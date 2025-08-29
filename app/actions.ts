// 'use server';

// import { GoogleGenAI } from "@google/genai";
// import type { GenerateContentResponse } from "@google/genai";

// export const askAIAboutDestination = async (destination: string): Promise<string> => {
//   const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
//   if (!API_KEY) {
//     console.error("API_KEY environment variable not set.");
//     return "The AI feature is currently unavailable. The API key is not configured on the server.";
//   }

//   try {
//     const ai = new GoogleGenAI({ apiKey: API_KEY });
//     const prompt = `Provide a concise and exciting travel guide for ${destination}. If the destination is not very familiar with you then guess where the destination is. Then, include key attractions, local food recommendations, and a fun fact. Format the response cleanly using markdown.`;

//     const response: GenerateContentResponse = await ai.models.generateContent({
//         model: 'gemini-2.5-flash',
//         contents: prompt,
//     });
    
//     return response.text ?? "No information available at the moment.";
//   } catch (error) {
//     console.error("Error calling Gemini API:", error);
//     return "Sorry, I couldn't fetch information about that destination right now. Please try again later.";
//   }
// };
