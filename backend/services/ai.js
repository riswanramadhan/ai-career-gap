// backend/services/ai.js
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

// Inisialisasi Client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Validation Schema dengan Zod
const AnalysisSchema = z.object({
  missingSkills: z.array(z.string()).min(1).max(10),
  learningSteps: z.array(z.object({
    title: z.string(),
    description: z.string()
  })).length(3),
  interviewQuestions: z.array(z.string()).length(3)
});

export async function analyzeGap(resumeText, jobDescText) {
  const prompt = `
You are an expert Career Coach and Technical Recruiter.

TASK: Analyze the gap between the candidate's Resume and the Target Job Description.

RESUME:
"""
${resumeText.slice(0, 8000)}
"""

JOB DESCRIPTION:
"""
${jobDescText.slice(0, 8000)}
"""

INSTRUCTIONS:
1. Identify skills/technologies mentioned in the JD but MISSING from the Resume
2. Create exactly 3 CONCRETE learning steps (actionable, specific projects)
3. Generate exactly 3 interview questions targeting the identified gaps

OUTPUT: Return ONLY valid JSON (no markdown, no explanation):
{
  "missingSkills": ["skill1", "skill2", "skill3"],
  "learningSteps": [
    {"title": "Step Title", "description": "Detailed actionable description with specific project example"},
    {"title": "Step Title", "description": "Detailed actionable description with specific project example"},
    {"title": "Step Title", "description": "Detailed actionable description with specific project example"}
  ],
  "interviewQuestions": ["Question 1?", "Question 2?", "Question 3?"]
}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const responseText = response.text;
    
    // Bersihkan markdown jika ada
    let cleanedText = responseText.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }
    
    const parsed = JSON.parse(cleanedText.trim());
    
    // Validasi dengan Zod
    const validated = AnalysisSchema.parse(parsed);
    
    return validated;

  } catch (error) {
    console.error("AI Error:", error.message);
    
    // Fallback jika validasi gagal
    if (error instanceof z.ZodError) {
      console.error("Validation Error:", error.errors);
      throw new Error("AI returned malformed data. Please try again.");
    }
    
    throw new Error("AI Service Failed: " + error.message);
  }
}