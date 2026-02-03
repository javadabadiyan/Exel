
import { GoogleGenAI, Type } from "@google/genai";

/**
 * تابع کمکی برای تلاش مجدد در صورت خطای شبکه
 */
const fetchWithRetry = async (fn: () => Promise<any>, retries = 2, delay = 2000): Promise<any> => {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && (error.message?.includes('fetch') || error.name === 'TypeError' || error.message?.includes('429'))) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

export const extractChannelData = async (rawText: string, fields: string): Promise<any[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined") {
    throw new Error("کلید API یافت نشد.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    شما یک متخصص استخراج داده‌های ساختاریافته هستید.
    استخراج فیلدهای [${fields}] از متن ارسالی:
    ---
    ${rawText}
    ---
    فقط JSON برگردان.
  `;

  return fetchWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: fields.split('،').map(f => f.trim()).reduce((acc, field) => {
              acc[field] = { type: Type.STRING };
              return acc;
            }, {} as any)
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  });
};

/**
 * استخراج داده از URL با استفاده از مدل Pro Image و ابزار جستجو
 */
export const extractDataFromUrl = async (url: string, fields: string): Promise<any[]> => {
  // ایجاد نمونه جدید در هر بار فراخوانی برای اطمینان از کلید به‌روز
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined") throw new Error("کلید API یافت نشد.");

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    لطفاً با استفاده از ابزار جستجو، محتوای عمومی آدرس زیر در پیام‌رسان روبیکا را بررسی کنید: ${url}
    سپس تمام اطلاعات مربوط به محصولات، خدمات یا پیام‌ها را بر اساس فیلدهای درخواستی استخراج کنید.
    فیلدها: [${fields}]
    خروجی باید یک آرایه JSON معتبر باشد.
  `;

  return fetchWithRetry(async () => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview', // مدل بهینه‌تر برای Grounding
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          thinkingConfig: { thinkingBudget: 8000 },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: fields.split('،').map(f => f.trim()).reduce((acc, field) => {
                acc[field] = { type: Type.STRING };
                return acc;
              }, {} as any)
            }
          }
        }
      });

      const result = JSON.parse(response.text || "[]");
      if (result.length === 0) throw new Error("داده‌ای یافت نشد.");
      return result;
    } catch (error: any) {
      if (error.message?.includes('429') || error.message?.includes('Quota exceeded')) {
        throw new Error("سهمیه استفاده رایگان شما از مدل Pro به پایان رسیده است. لطفاً برای ادامه، نسخه پیشرفته را از منوی سمت راست فعال کرده و یک API Key با اعتبار انتخاب کنید.");
      }
      throw error;
    }
  });
};
