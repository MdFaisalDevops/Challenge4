import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn(
    '[gemini-config]: WARNING: GEMINI_API_KEY environment variable is not defined. AI Decision Engine features will fail.'
  );
}

// Initialize the Google Generative AI SDK
export const genAI = new GoogleGenerativeAI(apiKey || 'MOCK_API_KEY');

// Use the standard high-performance multimodal Gemini model
export const getGeminiModel = (config?: { modelName?: string }) => {
  const modelName = config?.modelName || 'gemini-1.5-flash';
  return genAI.getGenerativeModel({ model: modelName });
};
