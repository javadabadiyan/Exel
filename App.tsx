
import React, { useState, useEffect } from 'react';
import { readExcel, generateMappedExcel, getMappedRows } from './utils/excelHelper';
import { getSmartMappings } from './services/geminiService';
import { ExcelData, ColumnMapping, Step } from './types';
import PDFConverter from './components/PDFConverter';
import ImageOCR from './components/ImageOCR';
import SpeechToText from './components/SpeechToText';
import { 
  CloudArrowUpIcon, 
  CheckCircleIcon, 
  ArrowPathIcon,
  TableCellsIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  DocumentDuplicateIcon,
  WrenchScrewdriverIcon,
  PhotoIcon,
  ShieldExclamationIcon,
  EyeIcon,
  ArrowRightIcon,
  SparklesIcon,
  SpeakerWaveIcon
} from '@heroicons/react/24/outline';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'excel' | 'pdf' | 'ocr' | 'speech'>('excel');
  const [step, setStep] = useState<Step>(Step.UPLOAD);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);

  useEffect(() => {
    if (!process.env.API_KEY || process.env.API_KEY === "undefined") {
      setApiKeyMissing(true);
    }
  }, []);

  const [templateFile, setTemplateFile] = useState<ExcelData | null>(null);
  const [dataFile, setDataFile] = useState<ExcelData | null>(null);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [previewRows, setPreviewRows] = useState<any[][]>([]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'template' | 'data') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    try {
      const data = await readExcel(file);
      if (type === 'template') setTemplateFile(data);
      else setDataFile(data);
    } catch (err) {
      setError("خطا در خواندن فایل اکسل. لطفا از فرمت صحیح استفاده کنید.");
    }
  };

  const startAIAssistedMapping = async () => {
    if (!templateFile || !dataFile) return;

    setLoading(true);
    setError(null);
    try {
      const smartMappings = await getSmartMappings(templateFile.headers, dataFile.headers);
      setMappings(smartMappings);
      setStep(Step.MAPPING);
    } catch (err: any) {
      setError(`خطا در ارتباط با هوش مصنوعی: ${err.message || 'خطای ناشناخته'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleManualMappingChange = (templateHeader: string, sourceHeader: string) => {
    setMappings(prev => prev.map(m => 
      m.templateHeader === templateHeader 
        ? { ...m, sourceHeader, confidence: 1, reason: 'انتخاب دستی توسط کاربر' } 
        : m
    ));
  };

  const goToPreview = () => {
    if (!templateFile || !dataFile) return;
    const rows = getMappedRows(templateFile.headers, dataFile, mappings, 5);
    setPreviewRows(rows);
    setStep(Step.PREVIEW);
  };

  const downloadResult = () => {
    if (!templateFile || !dataFile) return;
    generateMappedExcel(templateFile.headers, dataFile, mappings);
    setStep(Step.DOWNLOAD);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row" dir="rtl">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-white border-l border-slate-200 shadow-sm flex flex-col z-20">
        <div className="p-8 border-b border-slate-50">
          <div className="flex items-center gap-3 text-indigo-600 mb-2">
            <WrenchScrewdriverIcon className="w-8 h-8" />
            <span className="text-xl font-bold">هوش‌ابزار اکسل</span>
          </div>
          <p className="text-xs text-slate-400 font-medium">مدیریت هوشمند مستندات فارسی</p>
        </div>
        
        <nav className="p-4 flex flex-col gap-2">
          <button 
            onClick={() => { setActiveTab('excel'); setStep(Step.UPLOAD); }}
            className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${
              activeTab === 'excel' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <TableCellsIcon className="w-6 h-6" />
            <span className="font-bold text-sm">تطبیق و انتقال اکسل</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('pdf')}
            className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${
              activeTab === 'pdf' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <DocumentDuplicateIcon className="w-6 h-6" />
            <span className="font-bold text-sm">تبدیل PDF به متن</span>
          </button>

          <button 
            onClick={() => setActiveTab('ocr')}
            className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${
              activeTab === 'ocr' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <PhotoIcon className="w-6 h-6" />
            <span className="font-bold text-sm">استخراج متن از عکس</span>
          </button>

          <button 
            onClick={() => setActiveTab('speech')}
            className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${
              activeTab === 'speech' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <SpeakerWaveIcon className="w-6 h-6" />
            <span className="font-bold text-sm">تبدیل صوت به متن</span>
          </button>
        </nav>

        <div className="mt-auto p-8 text-center border-t border-slate-50">
          <p className="text-[10px] text-slate-400">قدرت گرفته از Gemini 3 Pro</p>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-grow flex flex-col">
        {apiKeyMissing && (
          <div className="bg-amber-500 text-white px-8 py-3 flex items-center justify-center gap-3">
            <ShieldExclamationIcon className="w-5 h-5" />
            <span className="text-sm font-bold">هشدار: تنظیمات هوش مصنوعی ناقص است. لطفاً کلید API را بررسی کنید.</span>
          </div>
        )}

        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-slate-100 px-8 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-800">
            {activeTab === 'excel' && 'انتقال هوشمند داده‌های اکسل'}
            {activeTab === 'pdf' && 'تبدیل هوشمند فایل‌های PDF'}
            {activeTab === 'ocr' && 'استخراج هوشمند متن از تصویر'}
            {activeTab === 'speech' && 'تبدیل هوشمند صوت به متن'}
          </h1>
          <div className="hidden sm:flex text-xs font-bold px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100">
            نسخه پیشرفته هوشمند
          </div>
        </header>

        <main className="p-8">
          {activeTab === 'pdf' && <PDFConverter />}
          {activeTab === 'ocr' && <ImageOCR />}
          {activeTab === 'speech' && <SpeechToText />}
          {activeTab === 'excel' && (
            <div className="max-w-6xl mx-auto">
              {/* Stepper logic */}
              <div className="flex justify-between mb-12 relative max-w-4xl mx-auto">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -z-10 -translate-y-1/2"></div>
                {[
                  { id: Step.UPLOAD, label: 'بارگذاری فایل‌ها' },
                  { id: Step.MAPPING, label: 'تطبیق فیلدها' },
                  { id: Step.PREVIEW, label: 'پیش‌نمایش نتیجه' },
                  { id: Step.DOWNLOAD, label: 'دریافت خروجی' }
                ].map((s, idx) => (
                  <div key={s.id} className="flex flex-col items-center bg-slate-50 px-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mb-2 transition-all duration-500 ${
                      step === s.id ? 'bg-indigo-600 text-white shadow-xl scale-110 ring-4 ring-indigo-50' : 
                      (idx < Object.values(Step).indexOf(step)) ? 'bg-green-500 text-white shadow-md' : 'bg-white border-2 border-slate-200 text-slate-400'
                    }`}>
                      {idx < Object.values(Step).indexOf(step) ? <CheckCircleIcon className="w-6 h-6" /> : idx + 1}
                    </div>
                    <span className={`text-[11px] font-bold ${step === s.id ? 'text-indigo-600' : 'text-slate-400'}`}>{s.label}</span>
                  </div>
                ))}
              </div>

              {error && (
                <div className="bg-red-50 border-r-4 border-red-500 p-4 mb-8 flex items-center rounded-xl shadow-sm">
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-500 ml-4" />
                  <p className="text-red-700 font-medium">{error}</p>
                </div>
              )}

              {step === Step.UPLOAD && (
                <div className="grid lg:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-700 mr-2 flex items-center gap-2">
                      <div className="w-2 h-6 bg-indigo-600 rounded-full"></div>
                      گام اول: فایل نمونه (ساختار نهایی)
                    </h3>
                    <UploadCard 
                      title="اکسل الگو (Template)"
                      description="این فایلی است که ستون‌های آن را می‌خواهید حفظ کنید."
                      onUpload={(e) => handleFileUpload(e, 'template')}
                      isUploaded={!!templateFile}
                      headers={templateFile?.headers}
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-700 mr-2 flex items-center gap-2">
                      <div className="w-2 h-6 bg-amber-500 rounded-full"></div>
                      گام دوم: فایل داده (اطلاعات موجود)
                    </h3>
                    <UploadCard 
                      title="اکسل داده (Source)"
                      description="فایلی که داده‌های خام در آن قرار دارد."
                      onUpload={(e) => handleFileUpload(e, 'data')}
                      isUploaded={!!dataFile}
                      headers={dataFile?.headers}
                    />
                  </div>

                  <div className="lg:col-span-2 flex justify-center mt-10">
                    <button
                      disabled={!templateFile || !dataFile || loading || apiKeyMissing}
                      onClick={startAIAssistedMapping}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold py-5 px-16 rounded-2xl shadow-2xl transition-all flex items-center gap-4 group"
                    >
                      {loading ? (
                        <>
                          <ArrowPathIcon className="w-6 h-6 animate-spin" />
                          <span>هوش مصنوعی در حال تحلیل فیلدها...</span>
                        </>
                      ) : (
                        <>
                          <SparklesIcon className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                          <span>تطبیق هوشمند ستون‌ها</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {step === Step.MAPPING && (
                <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500">
                  <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">بررسی تطبیق‌های هوشمند</h2>
                      <p className="text-slate-400 text-xs mt-1">هوش مصنوعی بهترین ستون‌ها را بر اساس معنا پیدا کرده است.</p>
                    </div>
                    <button onClick={() => setStep(Step.UPLOAD)} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 text-sm font-bold bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm transition-all">
                      <ArrowRightIcon className="w-4 h-4" />
                      تغییر فایل‌ها
                    </button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-widest font-black">
                          <th className="px-8 py-5 text-right">ستون در فایل نمونه</th>
                          <th className="px-8 py-5 text-right">تطبیق در فایل داده</th>
                          <th className="px-8 py-5 text-center">میزان اطمینان</th>
                          <th className="px-8 py-5 text-right">دلیل هوش مصنوعی</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mappings.map((mapping, idx) => (
                          <tr key={idx} className="hover:bg-indigo-50/30 transition-colors border-b border-slate-50 last:border-0">
                            <td className="px-8 py-6 font-bold text-slate-700">{mapping.templateHeader}</td>
                            <td className="px-8 py-6">
                              <select 
                                value={mapping.sourceHeader}
                                onChange={(e) => handleManualMappingChange(mapping.templateHeader, e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm transition-all text-sm"
                              >
                                <option value="">(بدون مقدار - خالی)</option>
                                {dataFile?.headers.map(h => (
                                  <option key={h} value={h}>{h}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex flex-col items-center gap-1.5">
                                <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full transition-all duration-1000 ${mapping.confidence > 0.8 ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : mapping.confidence > 0.4 ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]'}`}
                                    style={{ width: `${mapping.confidence * 100}%` }}
                                  ></div>
                                </div>
                                <span className="text-[10px] text-slate-400 font-bold">{Math.round(mapping.confidence * 100)}%</span>
                              </div>
                            </td>
                            <td className="px-8 py-6 text-xs text-slate-500 italic max-w-xs">{mapping.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-10 bg-slate-50 border-t border-slate-100 flex justify-center gap-6">
                    <button onClick={() => setStep(Step.UPLOAD)} className="bg-white border-2 border-slate-200 text-slate-600 font-bold py-4 px-10 rounded-2xl hover:bg-slate-100 transition-all flex items-center gap-2">
                      <ArrowRightIcon className="w-5 h-5" />
                      مرحله قبل
                    </button>
                    <button onClick={goToPreview} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-14 rounded-2xl shadow-xl transition-all flex items-center gap-3">
                      <span>مشاهده پیش‌نمایش</span>
                      <EyeIcon className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              )}

              {step === Step.PREVIEW && (
                <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-500">
                  <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">پیش‌نمایش ۵ ردیف اول</h2>
                      <p className="text-slate-400 text-xs mt-1">نتایج نهایی بر اساس تطبیق‌های شما به این شکل خواهد بود.</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto p-4">
                    <table className="w-full text-right border-collapse min-w-[800px]">
                      <thead>
                        <tr className="bg-indigo-600 text-white font-bold">
                          {templateFile?.headers.map((h, i) => (
                            <th key={i} className="px-6 py-4 border-l border-indigo-500 last:border-0">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-50 border-b border-slate-50 last:border-0">
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="px-6 py-4 text-sm text-slate-600 border-l border-slate-50 last:border-0">{cell || '-'}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-10 bg-slate-50 border-t border-slate-100 flex justify-center gap-6">
                    <button onClick={() => setStep(Step.MAPPING)} className="bg-white border-2 border-slate-200 text-slate-600 font-bold py-4 px-10 rounded-2xl hover:bg-slate-100 transition-all flex items-center gap-2">
                      <ArrowRightIcon className="w-5 h-5" />
                      اصلاح تطبیق‌ها
                    </button>
                    <button onClick={downloadResult} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-14 rounded-2xl shadow-xl transition-all flex items-center gap-3">
                      <DocumentArrowDownIcon className="w-6 h-6" />
                      <span>تولید و دانلود فایل نهایی</span>
                    </button>
                  </div>
                </div>
              )}

              {step === Step.DOWNLOAD && (
                <div className="max-w-2xl mx-auto bg-white p-20 rounded-[3rem] shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-500 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full -translate-y-1/2 translate-x-1/2 -z-10"></div>
                  
                  <div className="w-24 h-24 bg-green-100 rounded-3xl flex items-center justify-center mx-auto mb-10 shadow-inner rotate-3">
                    <CheckCircleIcon className="w-16 h-16 text-green-600" />
                  </div>
                  <h2 className="text-3xl font-black text-slate-800 mb-4">انتقال با موفقیت کامل شد!</h2>
                  <p className="text-slate-500 text-lg mb-12 leading-relaxed">
                    فایل نهایی با ساختار نمونه و داده‌های فایل مبدأ آماده شد و هم‌اکنون در حال دانلود است.
                  </p>
                  <div className="flex flex-col gap-5">
                    <button onClick={downloadResult} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-6 px-12 rounded-2xl shadow-2xl shadow-indigo-200 transition-all flex items-center justify-center gap-4">
                      <ArrowPathIcon className="w-6 h-6" />
                      <span>دانلود مجدد فایل اکسل</span>
                    </button>
                    <button onClick={() => { setTemplateFile(null); setDataFile(null); setMappings([]); setStep(Step.UPLOAD); }} className="text-slate-400 font-bold hover:text-indigo-600 flex items-center justify-center gap-2 transition-all">
                      <ArrowRightIcon className="w-4 h-4" />
                      انجام یک عملیات جدید
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

interface UploadCardProps {
  title: string;
  description: string;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploaded: boolean;
  headers?: string[];
}

const UploadCard: React.FC<UploadCardProps> = ({ title, description, onUpload, isUploaded, headers }) => {
  return (
    <div className={`p-8 rounded-[2.5rem] border-2 transition-all h-full flex flex-col group ${
      isUploaded ? 'bg-white border-green-200 shadow-xl shadow-green-50' : 'bg-white border-dashed border-slate-200 hover:border-indigo-400 hover:shadow-2xl hover:shadow-indigo-50 hover:-translate-y-1'
    }`}>
      <div className="flex items-center gap-6 mb-8">
        <div className={`p-5 rounded-2xl transition-all duration-500 ${isUploaded ? 'bg-green-500 text-white shadow-lg rotate-6' : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-400'}`}>
          <CloudArrowUpIcon className="w-10 h-10" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-800">{title}</h3>
          <p className="text-slate-400 text-xs mt-1 leading-relaxed">{description}</p>
        </div>
      </div>

      {!isUploaded ? (
        <label className="flex-grow flex items-center justify-center cursor-pointer group/label">
          <input type="file" className="hidden" accept=".xlsx, .xls" onChange={onUpload} />
          <div className="text-center py-16 w-full border-2 border-dashed border-slate-100 rounded-3xl group-hover/label:bg-slate-50/50 group-hover/label:border-indigo-200 transition-all flex flex-col items-center">
            <span className="text-indigo-600 font-bold text-lg mb-2">انتخاب فایل اکسل</span>
            <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-full text-[10px] text-indigo-400 font-black uppercase tracking-widest">
              XLSX / XLS Support
            </div>
          </div>
        </label>
      ) : (
        <div className="flex-grow space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-inner">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ستون‌های شناسایی شده:</span>
              <span className="bg-green-100 text-green-600 text-[10px] px-2 py-0.5 rounded-md font-bold">{headers?.length} ستون</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {headers?.slice(0, 8).map((h, i) => (
                <span key={i} className="bg-white text-slate-600 text-[10px] px-3 py-2 rounded-xl border border-slate-100 font-bold shadow-sm">
                  {h}
                </span>
              ))}
              {headers && headers.length > 8 && (
                <span className="text-slate-300 text-[10px] py-2 font-bold">+{headers.length - 8} مورد دیگر</span>
              )}
            </div>
          </div>
          <label className="block text-center text-xs text-indigo-500 font-bold cursor-pointer hover:underline underline-offset-4 decoration-2">
            <input type="file" className="hidden" accept=".xlsx, .xls" onChange={onUpload} />
            تغییر فایل انتخابی
          </label>
        </div>
      )}
    </div>
  );
};

export default App;
