
import { GoogleGenAI } from "@google/genai";

/**
 * تابع کمکی برای تلاش مجدد در صورت بروز خطا با تاخیر تصاعدی
 */
const fetchWithRetry = async (fn: () => Promise<any>, retries = 2, delay = 1000): Promise<any> => {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && (error.message?.includes('fetch') || error.name === 'TypeError')) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

/**
 * استخراج متن از چندین تصویر با پشتیبانی از دستورات اختصاصی و مدیریت خطای شبکه
 */
export const performPersianOCR = async (base64Images: string[], customInstruction?: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined") {
    throw new Error("کلید API در تنظیمات برنامه یافت نشد. لطفاً از صحت تنظیمات اطمینان حاصل کنید.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const systemPrompt = `
    شما یک متخصص OCR و استخراج متن هستید. وظیفه شما استخراج متن از تصاویر ارسالی با دقت بسیار بالا به زبان فارسی است.
    
    قوانین:
    1. تمام متون را با حفظ ساختار، پاراگراف‌بندی و علائم نگارشی استخراج کنید.
    2. اگر چندین تصویر وجود دارد، محتوای آن‌ها را به ترتیب استخراج کرده و با جداکننده واضح از هم جدا کنید.
    3. به دستورات خاص کاربر با اولویت بالا عمل کنید.
    4. خروجی فقط و فقط شامل متن استخراج شده باشد.
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

  return fetchWithRetry(async () => {
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
      if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
        throw new Error("خطای اتصال به سرور هوش مصنوعی. لطفاً اتصال اینترنت یا ابزار تغییر IP خود را بررسی کنید.");
      }
      throw error;
    }
  });
};
