
import { GoogleGenAI } from "@google/genai";

export const generateRemoteBypassScript = async (firewallType: string, constraints: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key missing");

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    شما یک متخصص امنیت شبکه و لینوکس/ویندوز هستید.
    کاربر می‌خواهد از خانه به سیستم شرکت (پشت فایروال و دامین) ریموت بزند.
    نوع فایروال: ${firewallType}
    محدودیت‌های خاص: ${constraints}
    
    وظیفه:
    یک اسکریپت PowerShell یا Python تولید کن که یک "Reverse Tunnel" یا "WebSocket Proxy" روی پورت 443 ایجاد کند.
    اسکریپت نباید نیاز به نصب نرم‌افزار اضافی داشته باشد (فقط کتابخانه‌های استاندارد).
    راهنمای کامل برای اجرا روی سیستم مبدأ (شرکت) و سیستم مقصد (خونه) ارائه بده.
    از ابزارهای متن‌باز مثل Ngrok یا Cloudflare Tunnels هم اگر بهترین گزینه هستند نام ببر و اسکریپت راه‌اندازی‌شان را بده.
    نکته: امنیت باید رعایت شود.
    فقط کد و راهنما به فارسی برگردان.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });
    return response.text || "خطا در تولید اسکریپت.";
  } catch (error) {
    return "متاسفانه مشکلی در ارتباط با هوش مصنوعی رخ داد.";
  }
};
