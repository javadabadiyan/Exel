
import { GoogleGenAI } from "@google/genai";

/**
 * استخراج متن از چندین تصویر با پشتیبانی از دستورات اختصاصی
 */
export const performPersianOCR = async (base64Images: string[], customInstruction?: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined") {
    throw new Error("کلید API در تنظیمات برنامه یافت نشد.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // دستورالعمل سیستمی برای هدایت مدل
  const systemPrompt = `
    شما یک متخصص OCR و استخراج متن هستید. وظیفه شما استخراج متن از تصاویر ارسالی با دقت بسیار بالا به زبان فارسی است.
    
    قوانین:
    1. تمام متون را با حفظ ساختار، پاراگراف‌بندی و علائم نگارشی استخراج کنید.
    2. اگر چندین تصویر وجود دارد، محتوای آن‌ها را به ترتیب استخراج کرده و با جداکننده واضح (مانند "--- صفحه X ---") از هم جدا کنید.
    3. به دستورات خاص کاربر که در ادامه می‌آید با اولویت بالا عمل کنید (مثلاً اگر کاربر خواست فقط بخش خاصی یا جدول خاصی استخراج شود).
    4. خروجی فقط و فقط شامل متن استخراج شده باشد. از دادن توضیحات اضافی خودداری کنید.
  `;

  const userPrompt = customInstruction 
    ? `دستور خاص کاربر: ${customInstruction}\nلطفاً طبق این دستور، متن را از تصاویر زیر استخراج کن.` 
    : "لطفاً تمام متن موجود در تصاویر زیر را با دقت استخراج کن.";

  const parts = [
    { text: `${systemPrompt}\n\n${userPrompt}` },
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
      throw new Error("هوش مصنوعی پاسخی تولید نکرد.");
    }
    
    return response.text;
  } catch (error: any) {
    console.error("OCR API Error:", error);
    throw new Error(`خطا در ارتباط با هوش مصنوعی: ${error.message || 'خطای ناشناخته'}`);
  }
};
