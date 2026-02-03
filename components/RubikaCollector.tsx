
import React, { useState } from 'react';
import { extractChannelData, extractDataFromUrl } from '../services/rubikaService';
import { saveAsWord } from '../utils/wordHelper';
import * as XLSX from 'xlsx';
import { 
  ChatBubbleLeftRightIcon, 
  TableCellsIcon, 
  DocumentArrowDownIcon, 
  ArrowPathIcon,
  SparklesIcon,
  ClipboardDocumentCheckIcon,
  QueueListIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  GlobeAltIcon,
  DocumentTextIcon,
  InformationCircleIcon,
  SignalIcon
} from '@heroicons/react/24/outline';

const RubikaCollector: React.FC = () => {
  const [mode, setMode] = useState<'manual' | 'url'>('url');
  const [rawText, setRawText] = useState("");
  const [channelUrl, setChannelUrl] = useState("");
  const [fields, setFields] = useState("نام کالا، قیمت، شماره تماس");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleProcess = async () => {
    if (mode === 'manual' && !rawText) {
      setError("لطفاً متن کانال را وارد کنید.");
      return;
    }
    if (mode === 'url' && !channelUrl) {
      setError("لطفاً آدرس کانال را وارد کنید.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      let data;
      if (mode === 'url') {
        data = await extractDataFromUrl(channelUrl, fields);
      } else {
        data = await extractChannelData(rawText, fields);
      }
      
      setResults(data);
      if (data.length > 0) setSuccess(true);
      else setError("داده‌ای با مشخصات درخواستی در این منبع یافت نشد.");
    } catch (err: any) {
      setError(err.message || "خطا در برقراری ارتباط با هوش مصنوعی.");
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = () => {
    if (results.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(results);
    ws['!views'] = [{ RTL: true }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "نتایج");
    XLSX.writeFile(wb, "Channel_Extraction.xlsx");
  };

  const downloadWord = () => {
    if (results.length === 0) return;
    const content = results.map((item, idx) => 
      `ردیف ${idx + 1}:\n` + Object.entries(item).map(([k, v]) => `${k}: ${v}`).join('\n')
    ).join('\n\n---\n\n');
    saveAsWord(content, "گزارش_کانال");
  };

  return (
    <div className="max-w-7xl mx-auto p-4 animate-in fade-in duration-700">
      <div className="grid lg:grid-cols-12 gap-8">
        {/* بخش ورودی */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
              <ChatBubbleLeftRightIcon className="w-7 h-7 text-indigo-600" />
              تنظیمات استخراج
            </h2>

            <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
              <button 
                onClick={() => setMode('url')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${mode === 'url' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
              >
                <GlobeAltIcon className="w-5 h-5" />
                آدرس کانال
              </button>
              <button 
                onClick={() => setMode('manual')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${mode === 'manual' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
              >
                <DocumentTextIcon className="w-5 h-5" />
                کپی متن
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-2 mr-1">اطلاعات مورد نیاز</label>
                <input 
                  type="text"
                  value={fields}
                  onChange={(e) => setFields(e.target.value)}
                  placeholder="نام، قیمت، شماره تماس..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>

              {mode === 'url' ? (
                <div className="animate-in slide-in-from-right duration-300">
                  <label className="block text-sm font-bold text-slate-600 mb-2 mr-1">لینک کانال عمومی</label>
                  <div className="relative">
                    <input 
                      type="text"
                      dir="ltr"
                      value={channelUrl}
                      onChange={(e) => setChannelUrl(e.target.value)}
                      placeholder="https://rubika.ir/sirjanposh"
                      className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all pl-12"
                    />
                    <GlobeAltIcon className="w-6 h-6 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              ) : (
                <div className="animate-in slide-in-from-left duration-300">
                  <label className="block text-sm font-bold text-slate-600 mb-2 mr-1">متن پیام‌ها</label>
                  <textarea
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="پیام‌ها را اینجا کپی کنید..."
                    className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none min-h-[250px] resize-none transition-all"
                    dir="rtl"
                  />
                </div>
              )}
            </div>

            <button
              disabled={loading || (mode === 'url' ? !channelUrl : !rawText)}
              onClick={handleProcess}
              className="w-full mt-8 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold py-5 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3"
            >
              {loading ? (
                <ArrowPathIcon className="w-6 h-6 animate-spin" />
              ) : (
                <SparklesIcon className="w-6 h-6" />
              )}
              <span>{loading ? 'در حال تحلیل هوشمند...' : 'شروع استخراج'}</span>
            </button>
          </div>

          {error && (
            <div className="p-5 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex flex-col gap-3 shadow-sm animate-in fade-in">
              <div className="flex items-center gap-2 font-black text-sm uppercase">
                <ExclamationCircleIcon className="w-5 h-5 shrink-0" />
                <span>خطای سیستمی</span>
              </div>
              <p className="text-xs leading-relaxed">{error}</p>
              <div className="flex items-center gap-2 bg-red-100/50 p-2 rounded-lg text-[10px]">
                <SignalIcon className="w-4 h-4" />
                <span>نکته: در صورت استفاده از اینترنت ایران، حتماً از فیلترشکن استفاده کنید.</span>
              </div>
            </div>
          )}
        </div>

        {/* بخش نتایج */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8 h-full flex flex-col min-h-[600px]">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <QueueListIcon className="w-7 h-7 text-amber-500" />
                <h2 className="text-xl font-bold text-slate-800">خروجی هوشمند</h2>
              </div>
              
              {results.length > 0 && (
                <div className="flex gap-2">
                  <button onClick={downloadWord} className="p-3 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all border border-slate-100 bg-white">
                    <DocumentArrowDownIcon className="w-5 h-5" />
                  </button>
                  <button onClick={downloadExcel} className="p-3 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-2xl transition-all border border-slate-100 bg-white">
                    <TableCellsIcon className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex-grow overflow-hidden relative">
              {loading ? (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-6 text-center px-10">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                    <SparklesIcon className="w-6 h-6 text-amber-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <div>
                    <p className="font-black text-slate-700 text-lg">در حال تحلیل هوشمند</p>
                    <p className="text-sm text-slate-500 mt-2">این فرآیند به دلیل پیمایش اینترنتی ممکن است کمی زمان ببرد...</p>
                  </div>
                </div>
              ) : null}

              {results.length > 0 ? (
                <div className="overflow-auto h-full max-h-[500px] border border-slate-100 rounded-3xl bg-slate-50/50">
                  <table className="w-full text-right border-collapse">
                    <thead className="sticky top-0 bg-indigo-600 text-white z-20">
                      <tr>
                        {Object.keys(results[0]).map((key, i) => (
                          <th key={i} className="px-6 py-4 text-xs font-black uppercase">{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((item, idx) => (
                        <tr key={idx} className="hover:bg-indigo-50/50 border-b border-white last:border-0 transition-colors">
                          {Object.values(item).map((val: any, i) => (
                            <td key={i} className="px-6 py-4 text-sm text-slate-600 font-medium">{val || '-'}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4 py-20 opacity-50">
                  <ClipboardDocumentCheckIcon className="w-24 h-24" />
                  <p className="font-bold text-center">اطلاعات استخراج شده در اینجا نمایش داده می‌شود</p>
                </div>
              )}
            </div>

            {success && (
              <div className="mt-6 p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center justify-center gap-3 text-green-700 font-bold animate-in slide-in-from-bottom">
                <CheckCircleIcon className="w-6 h-6" />
                <span>{results.length} ردیف اطلاعات با موفقیت استخراج شد.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RubikaCollector;
