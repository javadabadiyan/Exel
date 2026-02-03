
import { GoogleGenAI } from "@google/genai";

export const performPersianOCR = async (base64Images: string[], customInstruction?: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined") {
    throw new Error("کلید API در تنظیمات برنامه یافت نشد.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const systemPrompt = `
    وظیفه: استخراج متن (OCR) و تحلیل تصاویر ارسالی با دقت فوق‌العاده بالا.
    زبان هدف: فارسی (Persian).
    
    دستورالعمل‌ها:
    1. تمام متون را با حفظ ساختار و علائم نگارشی استخراج کن.
    2. اگر کاربر دستور خاصی برای استخراج بخشی از متن داده است، دقیقاً همان را اولویت قرار بده.
    3. اگر چندین تصویر وجود دارد، محتوای آن‌ها را به ترتیب و با جداکننده مشخص (مثلاً "--- تصویر شماره X ---") ارائه بده.
    4. خروجی فقط شامل متن درخواستی باشد و هیچ توضیح اضافه‌ای نده.
  `;

  const instructionPrompt = customInstruction 
    ? `دستور اختصاصی کاربر: ${customInstruction}` 
    : "تمام متن موجود در تصاویر را استخراج کن.";

  const parts = [
    { text: `${systemPrompt}\n\n${instructionPrompt}` },
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
    
    if (!response.text) {
      throw new Error("هوش مصنوعی پاسخی برنگرداند.");
    }
    
    return response.text;
  } catch (error: any) {
    console.error("OCR API Error Details:", error);
    const errorMsg = error.message || "خطای ناشناخته در سرویس Gemini";
    throw new Error(`خطای API: ${errorMsg}`);
  }
};
