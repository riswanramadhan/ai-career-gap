// Test AI service
import 'dotenv/config';
import { GoogleGenAI } from "@google/genai";

console.log("Testing AI service...");
console.log("API Key exists:", !!process.env.GEMINI_API_KEY);
console.log("API Key prefix:", process.env.GEMINI_API_KEY?.substring(0, 10) + "...");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function testAI() {
  try {
    console.log("Calling Gemini API...");
    
    // Try different model identifiers
    const models = ['gemini-2.5-flash', 'gemini-pro', 'gemini-2.0-flash-001'];
    
    for (const modelName of models) {
      try {
        console.log(`Trying model: ${modelName}`);
        const response = await ai.models.generateContent({
          model: modelName,
          contents: 'Say hello in JSON format: {"greeting": "hello"}',
        });
        console.log(`Success with model: ${modelName}`);
        console.log("Response.text:", response.text);
        return;
      } catch (e) {
        console.log(`Model ${modelName} failed:`, e.message?.substring(0, 100));
      }
    }
    
  } catch (error) {
    console.error("Error:", error);
  }
}

testAI();
