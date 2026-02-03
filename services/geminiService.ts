
import { GoogleGenAI, Type } from "@google/genai";
import { ColumnMapping } from "../types";

export const getSmartMappings = async (templateHeaders: string[], sourceHeaders: string[]): Promise<ColumnMapping[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("کلید API یافت نشد. لطفاً در تنظیمات برنامه آن را اضافه کنید.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    وظیفه: تطبیق نام ستون‌های یک فایل اکسل "مبدأ" با یک فایل اکسل "نمونه" (Template).
    تمام عناوین به زبان فارسی هستند. ممکن است نام‌ها دقیقاً یکی نباشند اما معنای یکسانی داشته باشند.
    
    عناوین فایل نمونه (مقصد): [${templateHeaders.join(', ')}]
    عناوین فایل داده (مبدأ): [${sourceHeaders.join(', ')}]
    
    دستورالعمل:
    1. برای هر عنوان در فایل "نمونه"، بهترین و نزدیک‌ترین معادل را در فایل "مبدأ" بر اساس معنای فارسی پیدا کن.
    2. به تفاوت‌های املایی و مترادف‌ها توجه کن (مثلاً "کد ملی" و "شناسه ملی" یا "نام خانوادگی" و "شهرت").
    3. اگر برای یک ستون نمونه، هیچ معادل مناسبی در فایل مبدأ وجود ندارد، آن را به رشته خالی "" مپ کن.
    4. برای هر تطبیق، یک نمره اطمینان (بین 0 تا 1) و یک دلیل کوتاه به فارسی ارائه بده.
    5. خروجی باید صرفاً یک آرایه JSON باشد.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              templateHeader: { type: Type.STRING },
              sourceHeader: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              reason: { type: Type.STRING }
            },
            required: ['templateHeader', 'sourceHeader', 'confidence']
          }
        }
      }
    });

    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("AI Mapping failed:", error);
    return templateHeaders.map(th => ({
      templateHeader: th,
      sourceHeader: sourceHeaders.find(sh => sh.trim() === th.trim()) || '',
      confidence: sourceHeaders.includes(th) ? 1 : 0,
      reason: 'تطبیق مستقیم یا عدم یافتن معادل'
    }));
  }
};
