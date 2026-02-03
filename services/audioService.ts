
import { GoogleGenAI } from "@google/genai";

export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined") {
    throw new Error("کلید API یافت نشد.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    وظیفه: تبدیل فایل صوتی ارسالی به متن دقیق (Transcription).
    زبان: فارسی (Persian).
    
    دستورالعمل:
    1. تمام کلمات و جملات را با دقت بسیار بالا و با رعایت علائم نگارشی فارسی استخراج کن.
    2. اگر در صوت چندین نفر صحبت می‌کنند، متن را به صورت پاراگراف‌بندی شده ارائه بده.
    3. کلمات تخصصی یا محاوره‌ای فارسی را با دقت به شکل صحیح نوشتاری تبدیل کن.
    4. خروجی فقط و فقط شامل متن استخراج شده باشد و هیچ توضیح اضافه‌ای نده.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Audio.split(',')[1] || base64Audio
              }
            }
          ]
        }
      ]
    });

    if (!response.text) {
      throw new Error("هوش مصنوعی نتوانست متنی از این فایل استخراج کند.");
    }

    return response.text;
  } catch (error: any) {
    console.error("Audio Transcription Error:", error);
    throw new Error(error.message || "خطا در پردازش فایل صوتی.");
  }
};
