
import { GoogleGenAI, Type } from "@google/genai";

/**
 * تابع کمکی برای تلاش مجدد هوشمند با تاخیر تصاعدی
 */
const fetchWithRetry = async (fn: () => Promise<any>, retries = 3, delay = 1500): Promise<any> => {
  try {
    return await fn();
  } catch (error: any) {
    const errorMsg = error.message || "";
    // اگر خطا مربوط به شبکه یا قطع اتصال باشد، تلاش مجدد کن
    const isNetworkError = errorMsg.includes('fetch') || error.name === 'TypeError' || errorMsg.includes('NetworkError');
    
    if (retries > 0 && isNetworkError) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

export const extractChannelData = async (rawText: string, fields: string): Promise<any[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined") {
    throw new Error("کلید API یافت نشد. لطفاً از منوی سمت راست 'فعالسازی نسخه پیشرفته' را بزنید.");
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
 * استخراج داده از URL با مدیریت پیشرفته خطاهای اتصال
 */
export const extractDataFromUrl = async (url: string, fields: string): Promise<any[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined") {
    throw new Error("کلید API یافت نشد. لطفاً ابتدا روی 'فعالسازی نسخه پیشرفته' کلیک کنید.");
  }

  // ایجاد نمونه در لحظه فراخوانی طبق قوانین API Key Selection
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
        model: 'gemini-3-pro-image-preview',
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
      const msg = error.message || "";
      if (msg.includes('Failed to fetch') || error.name === 'TypeError') {
        throw new Error("خطای اتصال (Connection Failed): مرورگر شما نمی‌تواند با سرورهای هوش مصنوعی گوگل ارتباط برقرار کند. این مشکل معمولاً به دلیل فیلترشکن ضعیف یا کندی اینترنت است. لطفاً فیلترشکن خود را تغییر داده و دوباره امتحان کنید.");
      }
      if (msg.includes('429') || msg.includes('Quota')) {
        throw new Error("سهمیه استفاده (Quota Exceeded): محدودیت استفاده رایگان از این مدل به پایان رسیده است. لطفاً از یک پروژه Paid کلید API دریافت کرده و در بخش فعالسازی وارد کنید.");
      }
      if (msg.includes('entity was not found')) {
        // ریست کردن وضعیت کلید در صورت بروز خطای پروژه نامعتبر
        const aiStudio = (window as any).aistudio;
        if (aiStudio) aiStudio.openSelectKey();
        throw new Error("پروژه یافت نشد. لطفاً دوباره کلید API خود را انتخاب کنید.");
      }
      throw error;
    }
  });
};
