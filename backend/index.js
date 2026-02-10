// backend/index.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import multer from 'multer';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import { PrismaClient } from '@prisma/client';
import { analyzeGap } from './services/ai.js';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// In-memory cache (layer 1 - instant, no DB roundtrip)
const memoryCache = new Map();
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

const allowedOrigins = [
  'https://ai-career-gap-frontend.vercel.app',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));
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
    const resumeHash = crypto.createHash('sha256').update(resumeText.trim().toLowerCase()).digest('hex');
    const jobDescHash = crypto.createHash('sha256').update(jobDescText.trim().toLowerCase()).digest('hex');
    const cacheKey = `${resumeHash}:${jobDescHash}`;

    // 2a. CEK MEMORY CACHE (Layer 1 - Instant)
    const memCached = memoryCache.get(cacheKey);
    if (memCached && (Date.now() - memCached.timestamp < CACHE_TTL)) {
      console.log("⚡ MEMORY CACHE HIT: Instant response!");
      return res.json({
        ...memCached.data,
        cached: true
      });
    }

    // 2b. CEK DATABASE (Layer 2 - Fast, with graceful fallback)
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
        console.log("⚡ DB CACHE HIT: Mengambil data dari database...");
        // Store in memory cache for next time
        memoryCache.set(cacheKey, { data: existingAnalysis, timestamp: Date.now() });
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

    // Store in memory cache regardless of DB status
    memoryCache.set(cacheKey, { data: responseData, timestamp: Date.now() });

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

// --- PDF UPLOAD & PARSE ---
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

app.post('/api/parse-pdf', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded', code: 'NO_FILE' });
    }

    const parser = new pdfParse.PDFParse({ data: req.file.buffer });
    const result = await parser.getText();
    const text = result.text.trim();
    await parser.destroy();

    if (!text || text.length < 10) {
      return res.status(422).json({
        error: 'Could not extract text from this PDF. Please make sure it is not a scanned image.',
        code: 'EMPTY_PDF'
      });
    }

    res.json({ text, pages: result.pages.length });
  } catch (error) {
    console.error('PDF Parse Error:', error);

    if (error.message === 'Only PDF files are allowed') {
      return res.status(400).json({ error: error.message, code: 'INVALID_FILE_TYPE' });
    }

    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large. Maximum size is 5MB.', code: 'FILE_TOO_LARGE' });
    }

    res.status(500).json({ error: 'Failed to parse PDF file', code: 'PDF_PARSE_ERROR' });
  }
});

// Multer error handler middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large. Maximum size is 5MB.', code: 'FILE_TOO_LARGE' });
    }
    return res.status(400).json({ error: err.message, code: 'UPLOAD_ERROR' });
  }
  if (err.message === 'Only PDF files are allowed') {
    return res.status(400).json({ error: err.message, code: 'INVALID_FILE_TYPE' });
  }
  next(err);
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