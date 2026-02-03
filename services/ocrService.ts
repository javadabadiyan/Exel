
import { GoogleGenAI } from "@google/genai";

export const performPersianOCR = async (base64Image: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined") {
    throw new Error("کلید API در تنظیمات برنامه یافت نشد.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    وظیفه: استخراج متن (OCR) از تصویر ارسالی با دقت فوق‌العاده بالا.
    زبان هدف: فارسی (Persian).
    
    دستورالعمل‌ها:
    1. تمام کلمات، اعداد و علائم نگارشی را دقیقاً همان‌طور که هستند استخراج کن.
    2. ساختار پاراگراف‌ها، لیست‌ها و سرفصل‌ها را حفظ کن.
    3. اگر کلمات دست‌نویس هستند، با دقت تمام آن‌ها را بازخوانی کن.
    4. هیچ توضیح اضافه‌ای نده، فقط متن استخراج شده را برگردان.
    5. در صورت وجود جداول، سعی کن ساختار متنی آن‌ها را حفظ کنی.
  `;

  const part = {
    inlineData: {
      mimeType: "image/jpeg",
      data: base64Image.split(',')[1] || base64Image
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [part, { text: prompt }] },
    });
    
    if (!response.text) {
      throw new Error("هوش مصنوعی پاسخی برنگرداند.");
    }
    
    return response.text;
  } catch (error: any) {
    console.error("OCR API Error Details:", error);
    // Surface the actual error message to help debugging
    const errorMsg = error.message || "خطای ناشناخته در سرویس Gemini";
    throw new Error(`خطای API: ${errorMsg}`);
  }
};
