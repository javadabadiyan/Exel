
import { GoogleGenAI } from "@google/genai";

const fetchWithRetry = async (fn: () => Promise<any>, retries = 2, delay = 1500): Promise<any> => {
  try {
    return await fn();
  } catch (error: any) {
    const errorMsg = error.message || "";
    const isNetworkError = errorMsg.includes('fetch') || error.name === 'TypeError' || errorMsg.includes('NetworkError');
    if (retries > 0 && isNetworkError) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

export const generateRemoteBypassScript = async (firewallType: string, constraints: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined") {
    throw new Error("کلید API یافت نشد. لطفاً ابتدا روی دکمه نارنجی 'فعالسازی نسخه پیشرفته' در پایین سمت راست کلیک کنید.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    شما یک معمار ارشد شبکه متخصص در دور زدن محدودیت‌های اینترنت ایران (مثل فیلترینگ پورت‌ها و پروتکل‌ها) هستید.
    کاربر می‌خواهد از خانه یا موبایل به سیستم شرکت وصل شود اما با خطای "Not Ready" در RustDesk مواجه شده است.
    
    ورودی کاربر:
    فایروال: ${firewallType}
    محدودیت‌ها: ${constraints}
    
    وظیفه شما ارائه یک نقشه راه عملیاتی (Step-by-Step) شامل موارد زیر است:
    1. راهکار Tailscale (توصیه اکید): توضیح دهید چگونه با نصب Tailscale روی کامپیوتر و گوشی، یک IP اختصاصی (مثل 100.x.y.z) می‌گیرد که حتی بدون فیلترشکن هم در داخل شبکه ایران به هم وصل می‌شوند.
    2. راهکار RustDesk + Relay: اگر کاربر اصرار به RustDesk دارد، تنظیمات Public Relay های جایگزین که در ایران باز هستند را بدهید.
    3. راهکار موبایل: لینک دانلود اپلیکیشن Tailscale و RustDesk برای اندروید/iOS و نحوه وارد کردن IP سیستم در گوشی.
    4. اسکریپت PowerShell برای ویندوز: کدی بدهید که سرویس‌های لازم را استارت کند و وضعیت فایروال ویندوز را برای پورت‌های ریموت اصلاح کند.
    
    خروجی باید با لحن حرفه‌ای، فارسی سلیس و به صورت بخش‌بندی شده باشد.
    در انتها یک بخش "عیب‌یابی سریع" برای حل مشکل Not Ready اضافه کنید.
  `;

  return fetchWithRetry(async () => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', // ارتقا به پرو برای تحلیل دقیق‌تر شبکه
        contents: prompt,
        config: {
          thinkingConfig: { thinkingBudget: 15000 } // اختصاص بودجه تفکر برای تحلیل پروتکل‌های شبکه
        }
      });
      
      if (!response.text) throw new Error("پاسخی از هوش مصنوعی دریافت نشد.");
      return response.text;
    } catch (error: any) {
      const msg = error.message || "";
      if (msg.includes('Failed to fetch') || error.name === 'TypeError') {
        throw new Error("خطای اتصال شبکه: مرورگر شما نمی‌تواند با سرور گوگل ارتباط برقرار کند. لطفاً فیلترشکن خود را تغییر دهید و دوباره تلاش کنید.");
      }
      throw error;
    }
  });
};
