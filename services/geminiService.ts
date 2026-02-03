
import { GoogleGenAI, Type } from "@google/genai";
import { ColumnMapping } from "../types";

export const getSmartMappings = async (templateHeaders: string[], sourceHeaders: string[]): Promise<ColumnMapping[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("کلید API یافت نشد. لطفاً در تنظیمات Vercel آن را اضافه کنید.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    Task: Map column headers from a "Source" Excel file to a "Template" Excel file.
    The headers are in Persian (Farsi).
    
    Template Headers: [${templateHeaders.join(', ')}]
    Source Headers: [${sourceHeaders.join(', ')}]
    
    Instructions:
    1. Identify which Source Header best matches each Template Header based on semantic meaning.
    2. If no clear match exists for a Template Header, map it to an empty string.
    3. Return the mapping as a JSON array of objects.
    4. Provide a confidence score (0 to 1) and a short reason for the match.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              templateHeader: { type: Type.STRING },
              sourceHeader: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              reason: { type: Type.STRING }
            },
            required: ['templateHeader', 'sourceHeader', 'confidence']
          }
        }
      }
    });

    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("AI Mapping failed:", error);
    return templateHeaders.map(th => ({
      templateHeader: th,
      sourceHeader: sourceHeaders.find(sh => sh === th) || '',
      confidence: sourceHeaders.includes(th) ? 1 : 0
    }));
  }
};
