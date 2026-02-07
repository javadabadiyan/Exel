
import React, { useState } from 'react';
import { generateRemoteBypassScript } from '../services/remoteService';
import { 
  CommandLineIcon, 
  ShieldCheckIcon, 
  ComputerDesktopIcon, 
  InformationCircleIcon,
  ArrowPathIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  LockClosedIcon,
  SignalIcon,
  BoltIcon,
  DevicePhoneMobileIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  WifiIcon
} from '@heroicons/react/24/outline';

const RemoteBridge: React.FC = () => {
  const [firewall, setFirewall] = useState("فایروال معمولی شرکت (پورت‌های بسته)");
  const [constraints, setConstraints] = useState("دسترسی ادمین ندارم، نصب نرم‌افزار محدود است.");
  const [loading, setLoading] = useState(false);
  const [script, setScript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setScript(null);
    try {
      const result = await generateRemoteBypassScript(firewall, constraints);
      setScript(result);
    } catch (e: any) {
      setError(e.message || "خطا در تولید راهکار ریموت.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (script) {
      navigator.clipboard.writeText(script);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Header Section */}
      <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
          <div className="w-24 h-24 bg-indigo-600 rounded-3xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20 rotate-3">
            <ComputerDesktopIcon className="w-14 h-14 text-white" />
          </div>
          <div className="text-right flex-grow">
            <h2 className="text-3xl font-black mb-4">پل ارتباطی هوشمند (Remote Bridge)</h2>
            <p className="text-slate-400 text-lg leading-relaxed max-w-3xl">
              به جای تنظیمات پیچیده، با کمک هوش مصنوعی یک تونل امن و مستقیم از شرکت به موبایل یا خانه خود ایجاد کنید.
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Side: Inputs and Quick Info */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                <ShieldCheckIcon className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">وضعیت فعلی شما</h3>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-3 mr-1">نوع فایروال یا نام شرکت</label>
                <input 
                  type="text" 
                  value={firewall}
                  onChange={(e) => setFirewall(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-600 mb-3 mr-1">محدودیت‌های ادمین/سیستم</label>
                <textarea 
                  value={constraints}
                  onChange={(e) => setConstraints(e.target.value)}
                  rows={3}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                />
              </div>

              <button 
                onClick={handleGenerate}
                disabled={loading}
                className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 group"
              >
                {loading ? <ArrowPathIcon className="w-6 h-6 animate-spin" /> : <BoltIcon className="w-6 h-6 group-hover:animate-pulse" />}
                <span>{loading ? 'در حال تحلیل شبکه...' : 'تولید راهکار اتصال ۱-دقیقه‌ای'}</span>
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className={`p-6 rounded-[2rem] border animate-in zoom-in-95 ${error.includes('اتصال') ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-red-50 border-red-200 text-red-600'}`}>
              <div className="flex items-center gap-3 font-black text-sm mb-3">
                {error.includes('اتصال') ? <WifiIcon className="w-6 h-6 shrink-0" /> : <ExclamationTriangleIcon className="w-6 h-6 shrink-0" />}
                <span>{error.includes('اتصال') ? 'خطای اتصال به هوش مصنوعی' : 'خطای سیستم'}</span>
              </div>
              <p className="text-xs leading-relaxed font-medium">{error}</p>
              {error.includes('اتصال') && (
                <div className="mt-4 bg-white/50 p-3 rounded-xl text-[10px] leading-relaxed border border-amber-100">
                  راهکار: لطفاً فیلترشکن خود را روی یک کشور پایدار (مثل آلمان یا فنلاند) تنظیم کنید و دوباره دکمه بنفش را بزنید.
                </div>
              )}
            </div>
          )}

          {/* Visual Guide Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-center group hover:bg-indigo-50 transition-colors">
              <DevicePhoneMobileIcon className="w-8 h-8 mx-auto mb-3 text-indigo-500 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-black text-slate-600">اتصال با گوشی</span>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-center group hover:bg-indigo-50 transition-colors">
              <ArrowDownTrayIcon className="w-8 h-8 mx-auto mb-3 text-indigo-500 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-black text-slate-600">بدون نصب نرم‌افزار</span>
            </div>
          </div>
        </div>

        {/* Right Side: Output Terminal */}
        <div className="lg:col-span-7 bg-slate-800 rounded-[2.5rem] p-8 text-slate-300 relative min-h-[600px] flex flex-col shadow-2xl border border-slate-700">
          <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
            <div className="flex items-center gap-3">
              <CommandLineIcon className="w-7 h-7 text-green-400" />
              <span className="font-mono text-sm font-bold text-white tracking-widest uppercase">Solution Terminal</span>
            </div>
            {script && (
              <button 
                onClick={copyToClipboard}
                className="p-3 bg-slate-700 hover:bg-slate-600 rounded-xl transition-all text-white border border-slate-600 shadow-sm"
              >
                {copied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <ClipboardDocumentIcon className="w-5 h-5" />}
              </button>
            )}
          </div>

          <div className="flex-grow font-mono text-sm leading-relaxed overflow-auto custom-scrollbar">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center gap-6">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin"></div>
                  <BoltIcon className="w-6 h-6 text-amber-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div className="text-center">
                  <p className="text-indigo-400 font-bold">در حال طراحی مسیر امن ریموت...</p>
                  <p className="text-[10px] text-slate-500 mt-2 italic">Gemini 3 در حال دور زدن محدودیت‌های شبکه شماست</p>
                </div>
              </div>
            ) : script ? (
              <div className="whitespace-pre-wrap animate-in fade-in duration-500 pr-2 pb-10 rtl text-right font-sans">
                {script}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-6 opacity-30">
                <LockClosedIcon className="w-20 h-20" />
                <p className="text-center font-bold">راهکار و اسکریپت در اینجا ظاهر خواهد شد</p>
                <div className="flex gap-2">
                  <div className="w-1.5 h-1.5 bg-slate-600 rounded-full animate-pulse"></div>
                  <div className="w-1.5 h-1.5 bg-slate-600 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-slate-600 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between text-[10px] font-bold text-slate-600 uppercase tracking-widest border-t border-slate-700 pt-6">
            <div className="flex items-center gap-3">
              <SignalIcon className="w-4 h-4 text-green-500" />
              AI Tunneling Helper v2.0
            </div>
            <div className="text-indigo-500">Secure AES-256 Protocol</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RemoteBridge;
