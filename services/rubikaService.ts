
import { GoogleGenAI, Type } from "@google/genai";

/**
 * تابع کمکی برای تلاش مجدد در صورت خطای شبکه
 */
const fetchWithRetry = async (fn: () => Promise<any>, retries = 2, delay = 2000): Promise<any> => {
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
 * استخراج داده از URL با مدیریت خطای شبکه و جستجوی عمیق
 */
export const extractDataFromUrl = async (url: string, fields: string): Promise<any[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined") throw new Error("کلید API یافت نشد.");

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    وظیفه فوری:
    1. به آدرس روبیکا برو: ${url}
    2. محتوای آخرین پست‌های این کانال را بررسی کن.
    3. اطلاعات محصولات یا خدمات را بر اساس فیلدهای [${fields}] استخراج کن.
    4. اگر قیمت یا توضیحی در پست‌ها هست، با دقت استخراج کن.
    5. خروجی فقط یک آرایه JSON باشد.
  `;

  return fetchWithRetry(async () => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          thinkingConfig: { thinkingBudget: 6000 },
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
      if (result.length === 0) throw new Error("محتوایی یافت نشد.");
      return result;
    } catch (error: any) {
      if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
        throw new Error("خطای شبکه: امکان اتصال به سرورهای گوگل وجود ندارد. لطفاً فیلترشکن خود را بررسی کرده و صفحه را رفرش کنید.");
      }
      throw error;
    }
  });
};
