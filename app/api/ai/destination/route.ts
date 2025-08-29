import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
    try {
        const { destination } = await req.json();

        const API_KEY = process.env.GEMINI_API_KEY; // ⚠️ server-only env
        if (!API_KEY) {
            return NextResponse.json({ error: 'API_KEY not set on server.' }, { status: 500 });
        }

        const ai = new GoogleGenAI({ apiKey: API_KEY });
        const prompt = `Provide a concise and exciting travel guide for ${destination}. If the destination is not very familiar with you then guess where the destination is. Then, include key attractions, local food recommendations, and a fun fact. Format the response cleanly using markdown.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return NextResponse.json({ text: response.text ?? '' });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Failed to fetch AI content.' }, { status: 500 });
    }
}
