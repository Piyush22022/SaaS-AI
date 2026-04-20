import { clerkClient } from "@clerk/express";
import OpenAI from "openai";
import { insertCreation } from "../services/creations.js";

function envTrim(name) {
  const v = process.env[name];
  return typeof v === "string" ? v.trim() : "";
}

function formatProviderError(provider, error) {
  const status = error?.status || error?.response?.status;
  const message = error?.message || "Unknown error";

  if (status === 401) {
    return `${provider.toUpperCase()} API key is invalid or expired. Replace it in server/.env and restart the server.`;
  }

  return `${provider.toUpperCase()} request failed: ${message}`;
}

function extractTopicFromPrompt(prompt) {
  const match = prompt.match(/about:\s*(.+)$/i);
  if (match?.[1]) {
    return match[1].replace(/\.$/, "").trim();
  }

  return prompt.replace(/^write\s+a\s+/i, "").trim();
}

function generateLocally(prompt) {
  const topic = extractTopicFromPrompt(prompt) || "your topic";

  return [
    `# ${topic}`,
    "",
    `Writing a strong article about ${topic} means balancing clarity, structure, and a clear point of view.`,
    "",
    `## Why ${topic} matters`,
    `People care about ${topic} because it connects to practical outcomes, current trends, and future opportunities.`,
    "",
    `## Key ideas`,
    `- Start with a clear definition of ${topic}.`,
    `- Explain the most important benefits and tradeoffs.`,
    `- Use examples that make the idea easy to picture.`,
    `- End with a useful takeaway or next step.`,
    "",
    `## Conclusion`,
    `In short, ${topic} is worth paying attention to because it can help people make better decisions and understand what comes next.`,
  ].join("\n")
}

/** Gemini: default model when using Google (separate quota from 2.0-flash). */
const DEFAULT_GEMINI_MODEL = "gemini-1.5-flash";

function modelCandidates() {
  const primary = (process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL).trim();
  const fallbacks = (process.env.GEMINI_MODEL_FALLBACKS || "gemini-1.5-flash-8b,gemini-2.0-flash-lite")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return [...new Set([primary, ...fallbacks])];
}

function isQuotaOrRateLimit(data) {
  if (!data?.error) return false;
  const e = data.error;
  const msg = (e.message || "").toLowerCase();
  return (
    e.code === 429 ||
    e.status === "RESOURCE_EXHAUSTED" ||
    msg.includes("quota") ||
    msg.includes("rate limit") ||
    msg.includes("too many requests")
  );
}

function isUnknownModel(data) {
  const e = data?.error;
  if (!e) return false;
  const msg = (e.message || "").toLowerCase();
  return e.code === 404 || e.status === "NOT_FOUND" || msg.includes("not found");
}

async function callGeminiGenerate(model, prompt) {
  const key = envTrim("GEMINI_API_KEY");
  const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${key}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });
  const data = await response.json();
  return { response, data };
}

function extractGeminiText(data) {
  if (
    data.candidates &&
    data.candidates.length > 0 &&
    data.candidates[0].content &&
    data.candidates[0].content.parts
  ) {
    return data.candidates[0].content.parts
      .map((p) => p.text || "")
      .join(" ");
  }
  return "";
}

/**
 * Google Gemini (multiple models / fallbacks).
 * @throws {Error} with message from API or quota hint
 */
async function generateWithGemini(prompt) {
  if (!envTrim("GEMINI_API_KEY")) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const models = modelCandidates();
  let data = null;
  let lastError = null;

  for (const model of models) {
    console.log("GEMINI try model:", model);
    const result = await callGeminiGenerate(model, prompt);
    data = result.data;

    if (!data.error) {
      const text = extractGeminiText(data);
      if (text.trim()) return text.trim();
      if (!data.candidates?.length) {
        throw new Error("Gemini returned no candidates (blocked or empty).");
      }
      return "AI could not generate a response. Try again.";
    }

    lastError = data;
    const retry = isQuotaOrRateLimit(data) || isUnknownModel(data);
    if (!retry) {
      throw new Error(data.error.message || "Gemini request failed");
    }
  }

  const hint =
    "Gemini quota exhausted for all configured models. Add GROQ_API_KEY (free at console.groq.com) or OPENAI_API_KEY in server/.env — ARTICLE_AI_PROVIDER=auto tries Groq first.";
  const msg = lastError?.error?.message
    ? `${lastError.error.message}\n\n${hint}`
    : hint;
  throw new Error(msg);
}

/**
 * Groq — free tier Llama/Mixtral via OpenAI-compatible API (https://console.groq.com).
 */
async function generateWithGroq(prompt) {
  const key = envTrim("GROQ_API_KEY");
  if (!key) {
    throw new Error("GROQ_API_KEY is not set");
  }
  const model = (process.env.GROQ_MODEL || "llama-3.3-70b-versatile").trim();
  const client = new OpenAI({
    apiKey: key,
    baseURL: "https://api.groq.com/openai/v1"
  });

  let completion;
  try {
    completion = await client.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }]
    });
  } catch (error) {
    throw new Error(formatProviderError("groq", error));
  }

  const text = completion.choices[0]?.message?.content?.trim();
  if (!text) {
    throw new Error("Groq returned empty content");
  }
  return text;
}

/**
 * OpenAI Chat Completions (works when Gemini free tier is at 0).
 */
async function generateWithOpenAI(prompt) {
  const key = envTrim("OPENAI_API_KEY");
  if (!key) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  const model = (process.env.OPENAI_MODEL || "gpt-4o-mini").trim();
  const client = new OpenAI({ apiKey: key });

  let completion;
  try {
    completion = await client.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }]
    });
  } catch (error) {
    throw new Error(formatProviderError("openai", error));
  }

  const text = completion.choices[0]?.message?.content?.trim();
  if (!text) {
    throw new Error("OpenAI returned empty content");
  }
  return text;
}

/**
 * Which providers to try, in order.
 * - auto (default): Groq (free tier) → OpenAI → Gemini
 * - groq / openai / gemini: that provider only (if its key is set)
 */
function providerChain() {
  const mode = (process.env.ARTICLE_AI_PROVIDER || "auto").toLowerCase();
  const hasGroq = !!envTrim("GROQ_API_KEY");
  const hasOpenAI = !!envTrim("OPENAI_API_KEY");
  const hasGemini = !!envTrim("GEMINI_API_KEY");

  if (mode === "groq") {
    return hasGroq ? ["groq"] : [];
  }
  if (mode === "openai") {
    return hasOpenAI ? ["openai"] : [];
  }
  if (mode === "gemini") {
    return hasGemini ? ["gemini"] : [];
  }
  if (mode === "local") {
    return ["local"];
  }
  // auto — prefer free Groq, then paid OpenAI, then Gemini
  const chain = [];
  if (hasGroq) chain.push("groq");
  if (hasOpenAI) chain.push("openai");
  if (hasGemini) chain.push("gemini");
  chain.push("local");
  return chain;
}

export const generateArticle = async (req, res) => {
  try {
    const userId = req.userId;
    const plan = req.plan;
    const free_usage = req.free_usage;

    const { prompt } = req.body;

    console.log("PROMPT:", prompt);

    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: "Prompt is required"
      });
    }

    const chain = providerChain();

    let content = null;
    let lastError = null;

    for (const p of chain) {
      try {
        if (p === "groq") {
          console.log("ARTICLE_AI using Groq");
          content = await generateWithGroq(prompt);
        } else if (p === "openai") {
          console.log("ARTICLE_AI using OpenAI");
          content = await generateWithOpenAI(prompt);
        } else {
          if (p === "local") {
            console.log("ARTICLE_AI using local fallback");
            content = generateLocally(prompt);
            break;
          }
          console.log("ARTICLE_AI using Gemini");
          content = await generateWithGemini(prompt);
        }
        break;
      } catch (err) {
        lastError = err;
        console.error(`ARTICLE_AI ${p} failed:`, err.message);
      }
    }

    if (!content) {
      content = generateLocally(prompt);
    }

    if (!content.trim()) {
      content = "AI could not generate a response. Try again.";
    }

    const creation = await insertCreation({
      userId,
      prompt,
      content,
      type: "article",
      publish: Boolean(req.body.publish)
    });

    if (plan !== "premium") {
      try {
        await clerkClient.users.updateUserMetadata(userId, {
          privateMetadata: {
            free_usage: free_usage + 1
          }
        });
      } catch (metadataError) {
        console.warn(
          "[SaasAi] Failed to update Clerk usage metadata, but article generation succeeded:",
          metadataError.message
        );
      }
    }

    res.json({
      success: true,
      content,
      creation
    });
  } catch (error) {
    console.log("ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

function escapeSvgText(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapPromptLines(text, maxChars = 28) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines.slice(0, 4);
}

function generateLocalImageDataUrl({ prompt, style }) {
  const safePrompt = escapeSvgText(prompt || "Creative image");
  const safeStyle = escapeSvgText(style || "Custom");
  const lines = wrapPromptLines(prompt || "Creative image prompt", 26);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0f172a"/>
          <stop offset="45%" stop-color="#1d4ed8"/>
          <stop offset="100%" stop-color="#22c55e"/>
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.28"/>
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="1024" height="1024" rx="64" fill="url(#bg)"/>
      <circle cx="270" cy="220" r="220" fill="url(#glow)"/>
      <circle cx="790" cy="790" r="240" fill="rgba(255,255,255,0.08)"/>
      <rect x="110" y="120" width="804" height="784" rx="44" fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.18)"/>
      <text x="144" y="210" fill="#e2e8f0" font-family="Arial, Helvetica, sans-serif" font-size="32" letter-spacing="2">AI IMAGE</text>
      <text x="144" y="274" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="54" font-weight="700">${safeStyle}</text>
      <text x="144" y="330" fill="#bfdbfe" font-family="Arial, Helvetica, sans-serif" font-size="24">Prompt</text>
      ${lines
        .map((line, index) => {
          const y = 382 + index * 52;
          return `<text x="144" y="${y}" fill="#f8fafc" font-family="Arial, Helvetica, sans-serif" font-size="34">${escapeSvgText(line)}</text>`;
        })
        .join("")}
      <rect x="144" y="710" width="736" height="4" rx="2" fill="rgba(255,255,255,0.35)"/>
      <text x="144" y="772" fill="#cbd5e1" font-family="Arial, Helvetica, sans-serif" font-size="22">Generated locally from your prompt</text>
      <text x="144" y="816" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="600">${safePrompt.slice(0, 80)}</text>
    </svg>
  `

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`
}

async function generateWithOpenAIImage(prompt, style) {
  const key = envTrim("OPENAI_API_KEY");
  if (!key) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const client = new OpenAI({ apiKey: key });
  const model = (process.env.OPENAI_IMAGE_MODEL || "gpt-image-1").trim();
  const size = (process.env.OPENAI_IMAGE_SIZE || "1024x1024").trim();
  const isGptImageModel = model.startsWith("gpt-image-");

  let response;
  try {
    const params = {
      model,
      prompt: `${prompt} in ${style} style`,
      size,
    };

    if (!isGptImageModel) {
      params.response_format = "b64_json";
    }

    response = await client.images.generate(params);
  } catch (error) {
    throw new Error(formatProviderError("openai image", error));
  }

  const image = response?.data?.[0];
  const b64 = image?.b64_json;
  const url = image?.url;

  if (b64) {
    return `data:image/png;base64,${b64}`;
  }

  if (url) {
    return url;
  }

  throw new Error("OpenAI image API returned no image");
}

export const generateImage = async (req, res) => {
  try {
    const userId = req.userId
    const { prompt, style = "Realistic", publish = false } = req.body

    if (!prompt?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Prompt is required"
      })
    }

    const fullPrompt = `${prompt.trim()} in ${style} style`
    let content = null
    let provider = "local"

    try {
      if (envTrim("OPENAI_API_KEY")) {
        console.log("IMAGE_AI using OpenAI")
        content = await generateWithOpenAIImage(prompt.trim(), style)
        provider = "openai"
      } else {
        console.log("IMAGE_AI using local fallback")
        content = generateLocalImageDataUrl({ prompt: fullPrompt, style })
      }
    } catch (error) {
      console.error("IMAGE_AI OpenAI failed:", error.message)
      content = generateLocalImageDataUrl({ prompt: fullPrompt, style })
      provider = "local"
    }

    const creation = await insertCreation({
      userId,
      prompt: fullPrompt,
      content,
      type: "image",
      publish: Boolean(publish)
    })

    res.json({
      success: true,
      content,
      creation,
      provider
    })
  } catch (error) {
    console.log("ERROR:", error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

function countMatches(text, keywords) {
  const lower = String(text || "").toLowerCase();
  return keywords.reduce((count, keyword) => {
    return count + (lower.includes(keyword) ? 1 : 0);
  }, 0);
}

function buildResumeAnalysis({ fileName, fileType, fileSize, resumeText }) {
  const lowerName = String(fileName || "resume").toLowerCase();
  const text = String(resumeText || "");

  const strengths = [];
  const gaps = [];

  const hasExperience = countMatches(text, ["experience", "worked", "built", "developed", "led"]);
  const hasMetrics = countMatches(text, ["%", "percent", "improved", "increased", "reduced", "$"]);
  const hasSkills = countMatches(text, ["javascript", "react", "node", "python", "sql", "figma", "excel"]);
  const hasEducation = countMatches(text, ["bachelor", "master", "degree", "university", "college"]);
  const hasProjects = countMatches(text, ["project", "projects", "portfolio", "github"]);

  if (hasExperience) strengths.push("Work history is present and shows practical experience.");
  if (hasMetrics) strengths.push("The resume includes measurable impact or outcomes.");
  if (hasSkills) strengths.push("Technical or role-specific skills are mentioned.");
  if (hasEducation) strengths.push("Education details are included.");
  if (hasProjects) strengths.push("Projects or portfolio links appear in the resume.");

  if (!hasExperience) gaps.push("Add a short experience section with role, company, and impact.");
  if (!hasMetrics) gaps.push("Add measurable results such as percentages, counts, or outcomes.");
  if (!hasSkills) gaps.push("Include a focused skills section with keywords from the target job.");
  if (!hasEducation) gaps.push("Add education details if they are relevant to your role.");
  if (!hasProjects) gaps.push("Add a projects section or portfolio links to show proof of work.");

  const scoreBase =
    40 +
    Math.min(hasExperience * 10, 10) +
    Math.min(hasMetrics * 10, 10) +
    Math.min(hasSkills * 8, 8) +
    Math.min(hasEducation * 6, 6) +
    Math.min(hasProjects * 6, 6);

  const score = Math.max(42, Math.min(96, scoreBase));
  const overall = score >= 80 ? "Strong" : score >= 65 ? "Solid" : "Needs improvement";

  const inferredRole =
    lowerName.includes("react") || lowerName.includes("frontend")
      ? "Frontend Developer"
      : lowerName.includes("backend") || lowerName.includes("node")
        ? "Backend Developer"
        : lowerName.includes("designer")
          ? "Designer"
          : "General Professional";

  const fileSummary = `${fileName || "resume"} • ${fileType || "unknown type"} • ${
    fileSize ? `${Math.round(fileSize / 1024)} KB` : "size unavailable"
  }`;

  return `## Resume Analysis

**Target profile:** ${inferredRole}

**File:** ${fileSummary}

**Overall score:** ${score}/100

**Verdict:** ${overall}

### Strengths
${strengths.length ? strengths.map((item) => `- ${item}`).join("\n") : "- The resume is readable and can be reviewed."}

### Gaps
${gaps.length ? gaps.map((item) => `- ${item}`).join("\n") : "- No major issues detected from the available information."}

### Next steps
1. Make the top third of the resume clearer with a headline and summary.
2. Add 2-3 quantified achievements.
3. Tailor the skills section to the job you want.
4. Keep the formatting consistent and concise.
5. Make sure contact info and links are easy to find.
`
}

export const reviewResume = async (req, res) => {
  try {
    const { fileName, fileType, fileSize, resumeText } = req.body;

    if (!fileName && !resumeText) {
      return res.status(400).json({
        success: false,
        message: "Resume file name or text is required"
      });
    }

    const analysis = buildResumeAnalysis({
      fileName,
      fileType,
      fileSize,
      resumeText
    });

    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.log("ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}
