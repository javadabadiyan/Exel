
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
  WrenchScrewdriverIcon,
  SignalIcon,
  BoltIcon
} from '@heroicons/react/24/outline';

const RemoteBridge: React.FC = () => {
  const [firewall, setFirewall] = useState("دقیق نمی‌دانم (فقط می‌دانم بسته است)");
  const [constraints, setConstraints] = useState("دامین دارم، دسترسی ادمین محدود است، پورت‌ها بسته‌اند.");
  const [loading, setLoading] = useState(false);
  const [script, setScript] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await generateRemoteBypassScript(firewall, constraints);
      setScript(result);
    } catch (e) {
      alert("خطا در تولید راهکار.");
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
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
          <div className="w-24 h-24 bg-indigo-600 rounded-3xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20 rotate-3">
            <ComputerDesktopIcon className="w-14 h-14 text-white" />
          </div>
          <div className="text-right flex-grow">
            <h2 className="text-3xl font-black mb-4">پل ارتباطی ریموت (Remote Bridge)</h2>
            <p className="text-slate-400 text-lg leading-relaxed max-w-3xl">
              این ابزار به شما کمک می‌کند تا محدودیت‌های فایروال شرکت و تنظیمات Domain را دور بزنید و به سیستم محل کار خود از خانه متصل شوید.
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* فرم تنظیمات */}
        <div className="space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                <ShieldCheckIcon className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">تحلیل وضعیت شبکه</h3>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-3 mr-1">نوع فایروال یا سیستم امنیتی شرکت</label>
                <input 
                  type="text" 
                  value={firewall}
                  onChange={(e) => setFirewall(e.target.value)}
                  placeholder="مثلاً: FortiGate, Cisco, یا فقط بگویید محدود است"
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-600 mb-3 mr-1">محدودیت‌های سیستم (مثل عدم دسترسی Admin)</label>
                <textarea 
                  value={constraints}
                  onChange={(e) => setConstraints(e.target.value)}
                  rows={4}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                  placeholder="مثلاً: نمی‌توانم نرم‌افزار نصب کنم، یوزر من ادمین نیست..."
                />
              </div>

              <button 
                onClick={handleGenerate}
                disabled={loading}
                className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 group"
              >
                {loading ? <ArrowPathIcon className="w-6 h-6 animate-spin" /> : <BoltIcon className="w-6 h-6 group-hover:animate-pulse" />}
                <span>{loading ? 'در حال طراحی استراتژی بای‌پس...' : 'تولید راهکار و اسکریپت ریموت'}</span>
              </button>
            </div>
          </div>

          <div className="bg-indigo-50 rounded-[2rem] p-6 border border-indigo-100 flex items-start gap-4">
            <InformationCircleIcon className="w-8 h-8 text-indigo-500 shrink-0" />
            <div className="text-sm text-indigo-800 leading-relaxed font-medium">
              نکته امنیتی: این اسکریپت‌ها معمولاً از پورت 443 (HTTPS) استفاده می‌کنند تا فایروال شک نکند. استفاده از تونل‌های رمزنگاری شده توصیه می‌شود.
            </div>
          </div>
        </div>

        {/* خروجی اسکریپت */}
        <div className="bg-slate-800 rounded-[2.5rem] p-8 text-slate-300 relative min-h-[500px] flex flex-col shadow-2xl">
          <div className="flex justify-between items-center mb-6">
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
            {script ? (
              <div className="whitespace-pre-wrap animate-in fade-in duration-500">
                {script}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-6 opacity-50">
                <LockClosedIcon className="w-20 h-20" />
                <p className="text-center font-bold">تنظیمات را وارد کرده و دکمه را بزنید تا راهکار تولید شود</p>
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-slate-600 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-2 h-2 bg-slate-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center gap-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-t border-slate-700 pt-6">
            <SignalIcon className="w-4 h-4 text-green-500" />
            AI-Powered Tunneling Helper v1.0
          </div>
        </div>
      </div>
    </div>
  );
};

export default RemoteBridge;
