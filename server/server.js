import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { clerkMiddleware } from '@clerk/express'
import aiRouter from './routes/aiRoutes.js'
import creationsRouter from './routes/creationsRoutes.js'
import { getPublicCreations, insertCreation } from './services/creations.js'

dotenv.config({ path: new URL('./.env', import.meta.url) })

const app = express()
const clientOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(cors({ origin: clientOrigins, credentials: true }))
app.use(express.json())
app.use(clerkMiddleware())

// ✅ Routes
app.use('/api/ai', aiRouter)
app.use('/api/creations', creationsRouter)

app.get('/', (req, res) => {
  res.send('Server is Live! 🚀')
})

app.get('/api/health', (_req, res) => {
  res.json({ success: true, status: 'ok' })
})

const PORT = process.env.PORT || 5000

function svgDataUrl({ title, subtitle, accent = '#4f46e5', accent2 = '#22c55e' }) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0f172a"/>
          <stop offset="100%" stop-color="${accent}"/>
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="35%" r="60%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.28"/>
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="1200" height="900" rx="60" fill="url(#bg)"/>
      <circle cx="270" cy="180" r="210" fill="url(#glow)"/>
      <circle cx="950" cy="690" r="230" fill="${accent2}" fill-opacity="0.28"/>
      <rect x="110" y="120" width="980" height="660" rx="42" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.16)"/>
      <text x="155" y="230" fill="#e2e8f0" font-family="Arial, Helvetica, sans-serif" font-size="30" letter-spacing="3">AI GENERATED ART</text>
      <text x="155" y="305" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="64" font-weight="700">${title}</text>
      <text x="155" y="365" fill="#cbd5e1" font-family="Arial, Helvetica, sans-serif" font-size="28">${subtitle}</text>
      <rect x="155" y="440" width="890" height="4" rx="2" fill="rgba(255,255,255,0.30)"/>
      <text x="155" y="515" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="42" font-weight="600">Color, light, motion, atmosphere.</text>
      <text x="155" y="575" fill="#bfdbfe" font-family="Arial, Helvetica, sans-serif" font-size="24">Rendered locally as a shareable community sample</text>
    </svg>
  `

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

async function seedCommunityImages() {
  let publicCreations = []

  try {
    publicCreations = await getPublicCreations()
  } catch (error) {
    console.warn(
      '[SaasAi] Unable to seed community images yet:',
      error.message
    )
    return
  }

  if (publicCreations.length > 0) return

  const samples = [
    {
      prompt: 'Cyberpunk city at midnight with rain and glowing signs',
      content: svgDataUrl({
        title: 'Cyber City',
        subtitle: 'Cyberpunk skyline with rain, reflections, and glowing streets',
        accent: '#1d4ed8',
        accent2: '#22c55e'
      })
    },
    {
      prompt: 'A dreamy ghibli style forest with floating lanterns and a cozy path',
      content: svgDataUrl({
        title: 'Lantern Forest',
        subtitle: 'Soft fantasy woodland with warm light and gentle shadows',
        accent: '#7c3aed',
        accent2: '#f59e0b'
      })
    },
    {
      prompt: 'Futuristic portrait of a creator surrounded by holographic UI panels',
      content: svgDataUrl({
        title: 'Future Creator',
        subtitle: 'High-tech portrait with holograms, depth, and vibrant contrast',
        accent: '#0f766e',
        accent2: '#38bdf8'
      })
    }
  ]

  for (const sample of samples) {
    await insertCreation({
      userId: 'system',
      prompt: sample.prompt,
      content: sample.content,
      type: 'image',
      publish: true,
      likes: []
    })
  }
}

async function bootstrap() {
  await seedCommunityImages()

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`)
    const groq = process.env.GROQ_API_KEY?.trim()
    const gemini = process.env.GEMINI_API_KEY?.trim()
    if (!groq && gemini) {
      console.warn(
        '[SaasAi] GROQ_API_KEY is empty — ARTICLE_AI_PROVIDER=auto cannot use Groq. Add a key from https://console.groq.com/keys or set ARTICLE_AI_PROVIDER=gemini.'
      )
    }
  })
}

bootstrap().catch((error) => {
  console.error('Failed to start server:', error)
  process.exit(1)
})
