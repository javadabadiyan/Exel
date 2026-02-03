
import React, { useState, useEffect } from 'react';
import { readExcel, generateMappedExcel } from './utils/excelHelper.ts';
import { getSmartMappings } from './services/geminiService.ts';
import { ExcelData, ColumnMapping, Step } from './types.ts';
import PDFConverter from './components/PDFConverter.tsx';
import ImageOCR from './components/ImageOCR.tsx';
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
  ShieldExclamationIcon
} from '@heroicons/react/24/outline';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'excel' | 'pdf' | 'ocr'>('excel');
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
        ? { ...m, sourceHeader, confidence: 1 } 
        : m
    ));
  };

  const downloadResult = () => {
    if (!templateFile || !dataFile) return;
    generateMappedExcel(templateFile.headers, dataFile, mappings);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-white border-l border-slate-200 shadow-sm flex flex-col z-20">
        <div className="p-8 border-b border-slate-50">
          <div className="flex items-center gap-3 text-indigo-600 mb-2">
            <WrenchScrewdriverIcon className="w-8 h-8" />
            <span className="text-xl font-bold">هوش‌ابزار</span>
          </div>
          <p className="text-xs text-slate-400 font-medium">پلتفرم مدیریت هوشمند مستندات</p>
        </div>
        
        <nav className="p-4 flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab('excel')}
            className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${
              activeTab === 'excel' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <TableCellsIcon className="w-6 h-6" />
            <span className="font-bold text-sm">تطبیق اکسل</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('pdf')}
            className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${
              activeTab === 'pdf' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <DocumentDuplicateIcon className="w-6 h-6" />
            <span className="font-bold text-sm">تبدیل PDF</span>
          </button>

          <button 
            onClick={() => setActiveTab('ocr')}
            className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${
              activeTab === 'ocr' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <PhotoIcon className="w-6 h-6" />
            <span className="font-bold text-sm">عکس به متن (OCR)</span>
          </button>
        </nav>

        <div className="mt-auto p-8 text-center border-t border-slate-50">
          <p className="text-[10px] text-slate-400">قدرت گرفته از Gemini Pro</p>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-grow flex flex-col">
        {apiKeyMissing && (
          <div className="bg-amber-500 text-white px-8 py-3 flex items-center justify-center gap-3 animate-pulse">
            <ShieldExclamationIcon className="w-5 h-5" />
            <span className="text-sm font-bold">هشدار: کلید API ست نشده است. لطفاً در Vercel متغیر API_KEY را اضافه کنید.</span>
          </div>
        )}

        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-slate-100 px-8 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-800">
            {activeTab === 'excel' && 'مدیریت و انتقال هوشمند اکسل'}
            {activeTab === 'pdf' && 'تبدیل هوشمند فایل‌های PDF'}
            {activeTab === 'ocr' && 'استخراج هوشمند متن از تصویر'}
          </h1>
          <div className="text-xs font-bold px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100">
            نسخه هوشمند PRO
          </div>
        </header>

        <main className="p-8">
          {activeTab === 'pdf' && <PDFConverter />}
          {activeTab === 'ocr' && <ImageOCR />}
          {activeTab === 'excel' && (
            <div className="max-w-5xl mx-auto">
              {/* Stepper logic... */}
              <div className="flex justify-between mb-10 relative">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -z-10 -translate-y-1/2"></div>
                {[
                  { id: Step.UPLOAD, label: 'بارگذاری فایل‌ها' },
                  { id: Step.MAPPING, label: 'تطبیق هوشمند' },
                  { id: Step.DOWNLOAD, label: 'دریافت نتیجه' }
                ].map((s, idx) => (
                  <div key={s.id} className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg mb-2 ${
                      step === s.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border-2 border-slate-200 text-slate-400'
                    }`}>
                      {idx + 1}
                    </div>
                    <span className={`text-sm ${step === s.id ? 'text-indigo-600 font-bold' : 'text-slate-500'}`}>{s.label}</span>
                  </div>
                ))}
              </div>

              {error && (
                <div className="bg-red-50 border-r-4 border-red-500 p-4 mb-6 flex items-center rounded-lg">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-500 ml-3" />
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              {step === Step.UPLOAD && (
                <div className="grid md:grid-cols-2 gap-8">
                  <UploadCard 
                    title="فایل اکسل نمونه (Template)"
                    description="ساختار نهایی فایل شما."
                    onUpload={(e) => handleFileUpload(e, 'template')}
                    isUploaded={!!templateFile}
                    headers={templateFile?.headers}
                  />
                  <UploadCard 
                    title="فایل اکسل داده (Source)"
                    description="اطلاعاتی که باید منتقل شوند."
                    onUpload={(e) => handleFileUpload(e, 'data')}
                    isUploaded={!!dataFile}
                    headers={dataFile?.headers}
                  />

                  <div className="md:col-span-2 flex justify-center mt-6">
                    <button
                      disabled={!templateFile || !dataFile || loading || apiKeyMissing}
                      onClick={startAIAssistedMapping}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold py-4 px-12 rounded-2xl shadow-xl transition-all flex items-center gap-3"
                    >
                      {loading ? (
                        <>
                          <ArrowPathIcon className="w-6 h-6 animate-spin" />
                          <span>در حال تحلیل با هوش مصنوعی...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="w-6 h-6" />
                          <span>شروع پردازش هوشمند</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {step === Step.MAPPING && (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                  <div className="p-8 border-b border-slate-50 bg-slate-50 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800">بررسی و تایید تطبیق‌ها</h2>
                    <button onClick={() => setStep(Step.UPLOAD)} className="text-slate-500 hover:text-indigo-600 text-sm font-bold">تغییر فایل‌ها</button>
                  </div>
                  
                  <div className="overflow-x-auto px-4">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="text-slate-400 text-xs uppercase tracking-wider">
                          <th className="px-6 py-5 border-b">فیلد مقصد</th>
                          <th className="px-6 py-5 border-b">فیلد مبدا انتخاب شده</th>
                          <th className="px-6 py-5 border-b text-center">اطمینان هوش مصنوعی</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mappings.map((mapping, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors border-b last:border-0 group">
                            <td className="px-6 py-5 font-bold text-slate-700">{mapping.templateHeader}</td>
                            <td className="px-6 py-5">
                              <select 
                                value={mapping.sourceHeader}
                                onChange={(e) => handleManualMappingChange(mapping.templateHeader, e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl py-2 px-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                              >
                                <option value="">(خالی)</option>
                                {dataFile?.headers.map(h => (
                                  <option key={h} value={h}>{h}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex flex-col items-center gap-1">
                                <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full transition-all duration-1000 ${mapping.confidence > 0.8 ? 'bg-green-500' : mapping.confidence > 0.4 ? 'bg-amber-500' : 'bg-red-400'}`}
                                    style={{ width: `${mapping.confidence * 100}%` }}
                                  ></div>
                                </div>
                                <span className="text-[10px] text-slate-400 font-bold">{Math.round(mapping.confidence * 100)}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-10 bg-slate-50 border-t border-slate-100 flex justify-center gap-4">
                    <button onClick={() => setStep(Step.UPLOAD)} className="bg-white border-2 border-slate-200 text-slate-600 font-bold py-4 px-10 rounded-2xl hover:bg-slate-100 transition-all">بازگشت</button>
                    <button onClick={() => { downloadResult(); setStep(Step.DOWNLOAD); }} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-16 rounded-2xl shadow-xl transition-all flex items-center gap-3">
                      <DocumentArrowDownIcon className="w-6 h-6" />
                      <span>تولید فایل نهایی</span>
                    </button>
                  </div>
                </div>
              )}

              {step === Step.DOWNLOAD && (
                <div className="max-w-2xl mx-auto bg-white p-16 rounded-3xl shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-300">
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                    <CheckCircleIcon className="w-16 h-16 text-green-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-800 mb-4">انتقال با موفقیت انجام شد!</h2>
                  <p className="text-slate-500 text-lg mb-10 leading-relaxed">
                    فایل جدید با چیدمان نمونه و داده‌های فایل مبدا تولید و دانلود شد. 
                  </p>
                  <div className="flex flex-col gap-4">
                    <button onClick={downloadResult} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-5 px-12 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3">
                      <DocumentArrowDownIcon className="w-6 h-6" />
                      <span>دانلود مجدد فایل</span>
                    </button>
                    <button onClick={() => { setTemplateFile(null); setDataFile(null); setMappings([]); setStep(Step.UPLOAD); }} className="text-indigo-600 font-bold hover:underline transition-all">انجام عملیات جدید</button>
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
    <div className={`p-10 rounded-3xl border-2 transition-all h-full flex flex-col ${
      isUploaded ? 'bg-indigo-50 border-indigo-200 shadow-inner' : 'bg-white border-dashed border-slate-200 hover:border-indigo-400 hover:shadow-lg'
    }`}>
      <div className="flex items-center gap-5 mb-6">
        <div className={`p-4 rounded-2xl ${isUploaded ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
          <CloudArrowUpIcon className="w-10 h-10" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-800">{title}</h3>
          <p className="text-slate-400 text-xs mt-1">{description}</p>
        </div>
      </div>

      {!isUploaded ? (
        <label className="mt-6 flex-grow flex items-center justify-center cursor-pointer group">
          <input type="file" className="hidden" accept=".xlsx, .xls" onChange={onUpload} />
          <div className="text-center py-14 w-full border-2 border-dashed border-slate-100 rounded-2xl group-hover:bg-indigo-50/50 group-hover:border-indigo-200 transition-all">
            <span className="text-indigo-600 font-bold block mb-1">انتخاب فایل</span>
            <p className="text-[10px] text-slate-400">فرمت XLSX یا XLS</p>
          </div>
        </label>
      ) : (
        <div className="mt-6 flex-grow">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-indigo-100">
            <span className="text-[10px] font-bold text-indigo-400 block mb-3 uppercase tracking-widest">ستون‌های یافت شده:</span>
            <div className="flex flex-wrap gap-2">
              {headers?.slice(0, 6).map((h, i) => (
                <span key={i} className="bg-slate-50 text-slate-600 text-[10px] px-3 py-1.5 rounded-lg border border-slate-100 font-bold">
                  {h}
                </span>
              ))}
              {headers && headers.length > 6 && (
                <span className="text-slate-300 text-[10px] py-1.5">+{headers.length - 6} مورد دیگر</span>
              )}
            </div>
          </div>
          <label className="block text-center mt-6 text-xs text-indigo-400 font-bold cursor-pointer hover:text-indigo-600 transition-all">
            <input type="file" className="hidden" accept=".xlsx, .xls" onChange={onUpload} />
            تغییر فایل انتخابی
          </label>
        </div>
      )}
    </div>
  );
};

export default App;
