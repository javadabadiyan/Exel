
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

  // ایجاد نمونه لحظه‌ای برای اطمینان از خواندن آخرین کلید وارد شده توسط کاربر
  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    شما یک متخصص ارشد شبکه و امنیت هستید. کاربر می‌خواهد از خانه یا موبایل به سیستم شرکت (پشت فایروال و محدودیت دامین) وصل شود.
    نوع شبکه/فایروال کاربر: ${firewallType}
    محدودیت‌ها: ${constraints}
    
    وظیفه:
    1. بهترین راهکار "یک‌کلیکی" و بدون نیاز به دانش فنی (مثل استفاده از RustDesk با ID اختصاصی یا Tailscale) را پیشنهاد بده.
    2. یک اسکریپت یا دستور ساده (مثلاً دستور نصب در PowerShell) تولید کن که تمام تنظیمات را خودکار انجام دهد.
    3. راهنمای اتصال با موبایل را هم اضافه کن.
    4. به زبان فارسی روان توضیح بده که کاربر چه فایلی را دانلود کند و چه کدی را بزند.
    5. امنیت (پسورد ادمین ریموت) را هم در نظر بگیر.
  `;

  return fetchWithRetry(async () => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', // استفاده از فلش برای پایداری بیشتر در شرایط اینترنت ایران
        contents: prompt,
      });
      
      if (!response.text) throw new Error("پاسخی از هوش مصنوعی دریافت نشد.");
      return response.text;
    } catch (error: any) {
      const msg = error.message || "";
      if (msg.includes('Failed to fetch') || error.name === 'TypeError') {
        throw new Error("خطای اتصال شبکه: مرورگر شما نمی‌تواند با سرور گوگل ارتباط برقرار کند. لطفاً فیلترشکن خود را تغییر دهید و دوباره تلاش کنید.");
      }
      if (msg.includes('Quota') || msg.includes('429')) {
        throw new Error("خطای سهمیه: سهمیه رایگان کلید فعلی تمام شده است. لطفاً کلید API دیگری انتخاب کنید.");
      }
      throw error;
    }
  });
};
