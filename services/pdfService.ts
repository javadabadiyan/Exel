
import { GoogleGenAI } from "@google/genai";

export const extractPDFContent = async (base64Images: string[], targetFormat: 'word' | 'excel'): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = targetFormat === 'word' 
    ? "لطفا تمام متن موجود در این تصاویر را با دقت بالا استخراج کن. چیدمان پاراگراف‌ها را حفظ کن. اگر عکسی در صفحه است، آن را با عبارت [تصویر] مشخص کن. خروجی فقط متن فارسی باشد."
    : "لطفا تمام جداول موجود در این تصاویر را شناسایی کن و محتوای آن‌ها را به صورت یک ساختار JSON که شامل آرایه‌ای از ردیف‌هاست برگردان. اگر متنی خارج از جدول است آن را نادیده بگیر. هدف تبدیل به فایل اکسل است.";

  const parts = [
    { text: prompt },
    ...base64Images.map(img => ({
      inlineData: {
        mimeType: "image/jpeg",
        data: img.split(',')[1] || img
      }
    }))
  ];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
    });
    return response.text || "";
  } catch (error) {
    console.error("AI PDF Extraction failed:", error);
    throw new Error("خطا در پردازش هوشمند فایل PDF");
  }
};
