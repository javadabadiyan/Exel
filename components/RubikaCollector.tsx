
import React, { useState } from 'react';
import { extractChannelData } from '../services/rubikaService';
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
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const RubikaCollector: React.FC = () => {
  const [rawText, setRawText] = useState("");
  const [fields, setFields] = useState("نام کالا، قیمت، شماره تماس");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleProcess = async () => {
    if (!rawText || !fields) {
      setError("لطفاً هم متن کانال و هم فیلدهای درخواستی را وارد کنید.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const data = await extractChannelData(rawText, fields);
      setResults(data);
      if (data.length > 0) setSuccess(true);
      else setError("داده‌ای با مشخصات درخواستی یافت نشد.");
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
    XLSX.utils.book_append_sheet(wb, ws, "اطلاعات_استخراج_شده");
    XLSX.writeFile(wb, "Channel_Data_Collection.xlsx");
  };

  const downloadWord = () => {
    if (results.length === 0) return;
    const content = results.map((item, idx) => 
      `ردیف ${idx + 1}:\n` + Object.entries(item).map(([k, v]) => `${k}: ${v}`).join('\n')
    ).join('\n\n---\n\n');
    saveAsWord(content, "گزارش_اطلاعات_کانال");
  };

  return (
    <div className="max-w-7xl mx-auto p-4 animate-in fade-in duration-700">
      <div className="grid lg:grid-cols-12 gap-8">
        {/* بخش ورودی */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
              <ChatBubbleLeftRightIcon className="w-7 h-7 text-indigo-600" />
              ورودی متن کانال
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-2 mr-1">چه اطلاعاتی جمع‌آوری شود؟</label>
                <input 
                  type="text"
                  value={fields}
                  onChange={(e) => setFields(e.target.value)}
                  placeholder="مثلاً: نام محصول، قیمت، تاریخ"
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
                <p className="text-[10px] text-slate-400 mt-2 mr-1">فیلدها را با کاما (،) از هم جدا کنید.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-600 mb-2 mr-1">متن کپی شده از کانال روبیکا</label>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="پیام‌های کانال را اینجا کپی کنید..."
                  className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none min-h-[300px] resize-none transition-all leading-relaxed"
                  dir="rtl"
                />
              </div>
            </div>

            <button
              disabled={loading || !rawText}
              onClick={handleProcess}
              className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold py-5 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3"
            >
              {loading ? (
                <ArrowPathIcon className="w-6 h-6 animate-spin" />
              ) : (
                <SparklesIcon className="w-6 h-6" />
              )}
              <span>استخراج هوشمند داده‌ها</span>
            </button>
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-center gap-3 text-sm font-bold animate-pulse">
              <ExclamationCircleIcon className="w-5 h-5" />
              {error}
            </div>
          )}
        </div>

        {/* بخش نتایج */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8 h-full flex flex-col min-h-[600px]">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <QueueListIcon className="w-7 h-7 text-amber-500" />
                <h2 className="text-xl font-bold text-slate-800">لیست داده‌های شناسایی شده</h2>
              </div>
              
              {results.length > 0 && (
                <div className="flex gap-2">
                  <button onClick={downloadWord} className="p-3 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all border border-slate-100 bg-white shadow-sm flex items-center gap-2">
                    <DocumentArrowDownIcon className="w-5 h-5" />
                    <span className="text-xs font-bold">Word</span>
                  </button>
                  <button onClick={downloadExcel} className="p-3 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-2xl transition-all border border-slate-100 bg-white shadow-sm flex items-center gap-2">
                    <TableCellsIcon className="w-5 h-5" />
                    <span className="text-xs font-bold">Excel</span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex-grow overflow-hidden relative">
              {loading ? (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-4">
                  <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                  <p className="font-bold text-slate-600">در حال تحلیل متون فارسی کانال...</p>
                </div>
              ) : null}

              {results.length > 0 ? (
                <div className="overflow-auto h-full max-h-[500px] border border-slate-100 rounded-3xl bg-slate-50/50">
                  <table className="w-full text-right border-collapse">
                    <thead className="sticky top-0 bg-indigo-600 text-white z-20">
                      <tr>
                        {Object.keys(results[0]).map((key, i) => (
                          <th key={i} className="px-6 py-4 text-xs font-black uppercase tracking-widest">{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((item, idx) => (
                        <tr key={idx} className="hover:bg-indigo-50 transition-colors border-b border-white last:border-0">
                          {Object.values(item).map((val: any, i) => (
                            <td key={i} className="px-6 py-4 text-sm text-slate-600 font-medium">
                              {val || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4 py-20">
                  <ClipboardDocumentCheckIcon className="w-20 h-20 opacity-20" />
                  <p className="font-bold">داده‌ای برای نمایش وجود ندارد. متن کانال را وارد کنید.</p>
                </div>
              )}
            </div>

            {success && (
              <div className="mt-6 p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center justify-center gap-3 text-green-700 font-bold animate-in fade-in duration-500">
                <CheckCircleIcon className="w-6 h-6" />
                <span>{results.length} رکورد با موفقیت استخراج شد!</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RubikaCollector;
