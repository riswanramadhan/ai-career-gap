// backend/index.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { analyzeGap } from './services/ai.js';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// --- ROUTES ---

app.post('/api/analyze', async (req, res) => {
  try {
    const { resumeText, jobDescText } = req.body;

    // Input Validation
    if (!resumeText || !jobDescText) {
      return res.status(400).json({ 
        error: "Resume and Job Description are required",
        code: "VALIDATION_ERROR"
      });
    }

    if (resumeText.length < 50 || jobDescText.length < 50) {
      return res.status(400).json({ 
        error: "Please provide more detailed Resume and Job Description (min 50 characters each)",
        code: "VALIDATION_ERROR"
      });
    }

    // 1. HASHING (Caching Logic)
    const resumeHash = crypto.createHash('sha256').update(resumeText.trim()).digest('hex');
    const jobDescHash = crypto.createHash('sha256').update(jobDescText.trim()).digest('hex');

    // 2. CEK DATABASE (Cache) - with graceful fallback if DB is unavailable
    let existingAnalysis = null;
    let dbAvailable = true;
    
    try {
      existingAnalysis = await prisma.analysis.findUnique({
        where: {
          resumeHash_jobDescHash: {
            resumeHash,
            jobDescHash
          }
        }
      });

      if (existingAnalysis) {
        console.log("⚡ CACHE HIT: Mengambil data dari database...");
        return res.json({
          ...existingAnalysis,
          cached: true
        });
      }
    } catch (dbError) {
      console.warn("⚠️ Database unavailable, skipping cache:", dbError.message);
      dbAvailable = false;
    }

    // 3. PANGGIL AI
    console.log("🤖 CACHE MISS: Meminta bantuan AI...");
    const aiResult = await analyzeGap(resumeText, jobDescText);

    // 4. SIMPAN KE DATABASE (skip if DB unavailable)
    let responseData = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      resumeHash,
      jobDescHash,
      missingSkills: aiResult.missingSkills,
      learningSteps: aiResult.learningSteps,
      interviewQuestions: aiResult.interviewQuestions,
      cached: false
    };

    if (dbAvailable) {
      try {
        const newAnalysis = await prisma.analysis.create({
          data: {
            resumeHash,
            jobDescHash,
            missingSkills: aiResult.missingSkills,
            learningSteps: aiResult.learningSteps,
            interviewQuestions: aiResult.interviewQuestions
          }
        });
        responseData = { ...newAnalysis, cached: false };
      } catch (saveError) {
        console.warn("⚠️ Failed to save to database:", saveError.message);
      }
    }

    res.json(responseData);

  } catch (error) {
    console.error("Server Error:", error);
    
    // Differentiate error types
    if (error.message.includes("malformed")) {
      return res.status(422).json({ 
        error: "AI returned invalid data. Please try again.",
        code: "AI_VALIDATION_ERROR"
      });
    }
    
    if (error.message.includes("AI Service Failed")) {
      return res.status(503).json({ 
        error: "AI service is temporarily unavailable. Please try again later.",
        code: "AI_SERVICE_ERROR"
      });
    }
    
    res.status(500).json({ 
      error: "Something went wrong processing your request.",
      code: "INTERNAL_ERROR"
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Export app untuk Vercel
export default app;

// Jalankan server HANYA jika bukan di Vercel (Local Development)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}