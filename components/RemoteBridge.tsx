
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
  WifiIcon,
  LinkIcon,
  LifebuoyIcon,
  // Added SparklesIcon to the imports
  SparklesIcon
} from '@heroicons/react/24/outline';

const RemoteBridge: React.FC = () => {
  const [firewall, setFirewall] = useState("فایروال معمولی شرکت (پورت‌های بسته)");
  const [constraints, setConstraints] = useState("دسترسی ادمین ندارم، RustDesk خطای Not Ready می‌دهد.");
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
              اگر RustDesk متصل نمی‌شود، با استفاده از تکنولوژی <b>Mesh VPN</b> یک شبکه اختصاصی بین موبایل و کامپیوتر خود بسازید.
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Side: Inputs and Quick Info */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                <SignalIcon className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">تحلیل وضعیت شبکه</h3>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-3 mr-1 text-right">محدودیت‌های امنیتی شرکت</label>
                <input 
                  type="text" 
                  value={firewall}
                  onChange={(e) => setFirewall(e.target.value)}
                  placeholder="مثلاً: فایروال سخت‌گیرانه، فقط پورت 443 باز است"
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-right"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-600 mb-3 mr-1 text-right">توضیح مشکل (مثل Not Ready)</label>
                <textarea 
                  value={constraints}
                  onChange={(e) => setConstraints(e.target.value)}
                  rows={3}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none text-right"
                />
              </div>

              <button 
                onClick={handleGenerate}
                disabled={loading}
                className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 group"
              >
                {loading ? <ArrowPathIcon className="w-6 h-6 animate-spin" /> : <BoltIcon className="w-6 h-6 group-hover:animate-pulse" />}
                <span>{loading ? 'هوش مصنوعی در حال تفکر...' : 'حل مشکل اتصال و تولید اسکریپت'}</span>
              </button>
            </div>
          </div>

          {/* Quick Support Links */}
          <div className="bg-amber-50 rounded-[2rem] border border-amber-200 p-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-800 font-black text-sm">
              <LifebuoyIcon className="w-6 h-6" />
              <span>راهنمای سریع رفع Not Ready</span>
            </div>
            <ul className="text-[11px] text-amber-700 space-y-2 mr-2 list-disc list-inside font-medium leading-relaxed">
              <li><b>روش اول:</b> نصب Tailscale روی هر دو دستگاه (قطعی‌ترین روش در ایران).</li>
              <li><b>روش دوم:</b> تغییر ID Server در تنظیمات RustDesk به سرورهای داخل ایران.</li>
              <li><b>روش سوم:</b> استفاده از IP مستقیم در شبکه Tailscale به جای ID.</li>
            </ul>
          </div>

          {error && (
            <div className="p-6 rounded-[2rem] border bg-red-50 border-red-200 text-red-600 animate-in zoom-in-95">
              <div className="flex items-center gap-3 font-black text-sm mb-3">
                <ExclamationTriangleIcon className="w-6 h-6 shrink-0" />
                <span>خطای سیستم</span>
              </div>
              <p className="text-xs leading-relaxed font-medium">{error}</p>
            </div>
          )}
        </div>

        {/* Right Side: Output Terminal */}
        <div className="lg:col-span-7 bg-slate-800 rounded-[3rem] p-8 text-slate-300 relative min-h-[600px] flex flex-col shadow-2xl border border-slate-700">
          <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
            <div className="flex items-center gap-3">
              <CommandLineIcon className="w-7 h-7 text-indigo-400" />
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
                  <div className="w-20 h-20 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin"></div>
                  <SparklesIcon className="w-8 h-8 text-amber-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div className="text-center">
                  <p className="text-indigo-400 font-black text-lg">هوش مصنوعی در حال تحلیل لایه‌های شبکه...</p>
                  <p className="text-xs text-slate-500 mt-2 italic">Gemini 3 Pro در حال بررسی بهترین رله‌های موجود برای ایران</p>
                </div>
              </div>
            ) : script ? (
              <div className="whitespace-pre-wrap animate-in fade-in duration-500 pr-2 pb-10 rtl text-right font-sans leading-loose text-slate-200">
                {script}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-6 opacity-30">
                <div className="relative">
                  <LockClosedIcon className="w-24 h-24" />
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full animate-ping opacity-75"></div>
                </div>
                <p className="text-center font-bold text-lg">منتظر دستور شما برای تحلیل شبکه...</p>
                <div className="flex gap-3">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between text-[10px] font-bold text-slate-600 uppercase tracking-widest border-t border-slate-700 pt-6">
            <div className="flex items-center gap-3">
              <SignalIcon className="w-4 h-4 text-green-500" />
              Mesh Network Bridge v3.1
            </div>
            <div className="text-indigo-500 flex items-center gap-2">
              <LinkIcon className="w-3 h-3" />
              Powered by Tailscale & RustDesk
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RemoteBridge;
