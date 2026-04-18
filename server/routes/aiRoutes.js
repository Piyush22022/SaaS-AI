import express from "express";
import { auth } from "../middlewares/auth.js";
import { generateArticle, generateImage, reviewResume } from "../controllers/aiController.js";

const aiRouter = express.Router(); // ✅ fixed

aiRouter.post('/generate-article', auth, generateArticle);
aiRouter.post('/generate-image', auth, generateImage);
aiRouter.post('/review-resume', auth, reviewResume);

export default aiRouter;
