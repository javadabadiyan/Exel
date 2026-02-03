
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
    2. خروجی باید یک آرایه از اشیاء (Objects) باشد که هر شیء نشان‌دهنده یک موجودیت (مثلاً یک محصول، یک پیام یا یک رکورد) است.
    3. اگر مقداری یافت نشد، مقدار آن را null یا رشته خالی بگذار.
    4. اعداد را به صورت عددی یا رشته فارسی دقیق حفظ کن.
    5. فقط و فقط خروجی JSON معتبر برگردان.
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

    const result = JSON.parse(response.text || "[]");
    return result;
  } catch (error: any) {
    console.error("Rubika Extraction Error:", error);
    throw new Error(error.message || "خطا در استخراج هوشمند داده‌ها.");
  }
};
