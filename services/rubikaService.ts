
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
 * استخراج داده مستقیماً از آدرس کانال با استفاده از ابزار جستجو و مدل Pro
 */
export const extractDataFromUrl = async (url: string, fields: string): Promise<any[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined") throw new Error("کلید API یافت نشد.");

  // استفاده از مدل Pro برای دقت بالاتر در جستجو
  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    مراحل زیر را با دقت انجام بده:
    1. با استفاده از ابزار جستجوی گوگل، محتوای عمومی آدرس روبیکا مقابل را پیمایش کن: ${url}
    2. این آدرس مربوط به یک کانال ویترین یا فروشگاهی است. آخرین محصولات، پست‌ها یا پیام‌های منتشر شده در آن را پیدا کن.
    3. اطلاعات یافت شده را با دقت تحلیل کرده و فیلدهای زیر را از میان آن‌ها استخراج کن:
       فیلدهای درخواستی: [${fields}]
    
    نکته مهم: اگر قیمت یا شماره تماسی در پست‌ها وجود دارد، حتماً آن‌ها را استخراج کن. خروجی نهایی باید یک لیست (Array) از اشیاء باشد.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 4000 }, // اختصاص بودجه تفکر برای تحلیل بهتر نتایج جستجو
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
    
    if (result.length === 0) {
      throw new Error("محتوایی یافت نشد. ممکن است کانال خصوصی باشد یا محتوای آن توسط جستجوگر ایندکس نشده باشد.");
    }
    
    return result;
  } catch (error: any) {
    console.error("URL Extraction Detailed Error:", error);
    if (error.message?.includes("not found") || error.message?.includes("access")) {
      throw new Error("دسترسی به این کانال از طریق جستجوی هوشمند مقدور نبود. لطفاً محتوای کانال را کپی کرده و از لبه 'کپی متن' استفاده کنید.");
    }
    throw new Error(error.message || "خطا در پیمایش هوشمند آدرس کانال.");
  }
};
