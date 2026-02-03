
import { GoogleGenAI, Type } from "@google/genai";

export const extractChannelData = async (rawText: string, fields: string): Promise<any[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined") {
    throw new Error("کلید API یافت نشد.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    شما یک متخصص استخراج داده‌های ساختاریافته هستید.
    وظیفه: استخراج اطلاعات مشخص شده از متن خام ارسالی (مربوط به یک کانال در پیام‌رسان روبیکا).
    
    فیلدهای مورد نظر کاربر: [${fields}]
    متن خام کانال:
    ---
    ${rawText}
    ---

    دستورالعمل:
    1. متن را با دقت تحلیل کن و تمام مواردی که با فیلدهای درخواستی مطابقت دارند استخراج کن.
    2. خروجی باید یک آرایه از اشیاء (Objects) باشد.
    3. فقط و فقط خروجی JSON معتبر برگردان.
  `;

  try {
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
  } catch (error: any) {
    throw new Error(error.message || "خطا در استخراج هوشمند داده‌ها.");
  }
};

/**
 * استخراج داده مستقیماً از آدرس کانال با استفاده از ابزار جستجو
 */
export const extractDataFromUrl = async (url: string, fields: string): Promise<any[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key is missing");

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    با استفاده از ابزار جستجو، به آدرس کانال روبیکا زیر مراجعه کن: ${url}
    سپس آخرین پیام‌ها یا اطلاعات موجود در این آدرس را بررسی کرده و فیلدهای زیر را استخراج کن:
    فیلدها: [${fields}]

    نکات:
    1. اگر آدرس مربوط به یک کانال عمومی است، پست‌های اخیر را بخوان.
    2. اطلاعات را به صورت ساختاریافته (آرایه‌ای از اشیاء) برگردان.
    3. فقط JSON نهایی را برگردان.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
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
  } catch (error: any) {
    console.error("URL Extraction Error:", error);
    throw new Error("هوش مصنوعی نتوانست به محتوای آدرس دسترسی پیدا کند. لطفاً از عمومی بودن کانال مطمئن شوید یا متن را دستی کپی کنید.");
  }
};
