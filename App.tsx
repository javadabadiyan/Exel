
import React, { useState, useCallback } from 'react';
import { readExcel, generateMappedExcel } from './utils/excelHelper';
import { getSmartMappings } from './services/geminiService';
import { ExcelData, ColumnMapping, Step } from './types';
import { 
  CloudArrowUpIcon, 
  CheckCircleIcon, 
  ArrowPathIcon,
  TableCellsIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const App: React.FC = () => {
  const [step, setStep] = useState<Step>(Step.UPLOAD);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    } catch (err) {
      setError("خطا در ارتباط با هوش مصنوعی. لطفا مجددا تلاش کنید.");
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
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Header */}
      <header className="bg-indigo-600 text-white py-8 px-4 shadow-lg mb-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">هوشمند‌ساز اکسل فارسی</h1>
            <p className="opacity-90">انتقال خودکار اطلاعات بین دو فایل اکسل با استفاده از هوش مصنوعی</p>
          </div>
          <div className="hidden md:block">
            <TableCellsIcon className="w-16 h-16 opacity-30" />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4">
        {/* Step Indicator */}
        <div className="flex justify-between mb-10 relative">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -z-10 -translate-y-1/2"></div>
          {[
            { id: Step.UPLOAD, label: 'بارگذاری فایل‌ها' },
            { id: Step.MAPPING, label: 'تطبیق هوشمند' },
            { id: Step.DOWNLOAD, label: 'دریافت نتیجه' }
          ].map((s, idx) => (
            <div key={s.id} className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg mb-2 ${
                step === s.id ? 'bg-indigo-600 text-white' : 'bg-white border-2 border-slate-200 text-slate-400'
              }`}>
                {idx + 1}
              </div>
              <span className={`text-sm ${step === s.id ? 'text-indigo-600 font-bold' : 'text-slate-500'}`}>{s.label}</span>
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border-r-4 border-red-500 p-4 mb-6 flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-500 ml-3" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Step 1: Upload */}
        {step === Step.UPLOAD && (
          <div className="grid md:grid-cols-2 gap-8">
            <UploadCard 
              title="فایل اکسل نمونه (Template)"
              description="ساختار نهایی فایل شما به این صورت خواهد بود."
              onUpload={(e) => handleFileUpload(e, 'template')}
              isUploaded={!!templateFile}
              headers={templateFile?.headers}
            />
            <UploadCard 
              title="فایل اکسل داده (Data Source)"
              description="اطلاعاتی که می‌خواهید به فایل نمونه منتقل شود."
              onUpload={(e) => handleFileUpload(e, 'data')}
              isUploaded={!!dataFile}
              headers={dataFile?.headers}
            />

            <div className="md:col-span-2 flex justify-center mt-6">
              <button
                disabled={!templateFile || !dataFile || loading}
                onClick={startAIAssistedMapping}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold py-4 px-12 rounded-xl shadow-lg transition-all flex items-center gap-3"
              >
                {loading ? (
                  <>
                    <ArrowPathIcon className="w-6 h-6 animate-spin" />
                    <span>در حال تحلیل هوشمند...</span>
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-6 h-6" />
                    <span>شروع تطبیق هوشمند</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Mapping */}
        {step === Step.MAPPING && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">بررسی و تایید فیلدها</h2>
              <button 
                onClick={() => setStep(Step.UPLOAD)}
                className="text-slate-500 hover:text-indigo-600 text-sm"
              >
                تغییر فایل‌ها
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 text-sm uppercase">
                    <th className="px-6 py-4 font-bold border-b">فیلد هدف (نمونه)</th>
                    <th className="px-6 py-4 font-bold border-b">فیلد مبدا (داده)</th>
                    <th className="px-6 py-4 font-bold border-b">دقت تطبیق</th>
                    <th className="px-6 py-4 font-bold border-b">توضیحات AI</th>
                  </tr>
                </thead>
                <tbody>
                  {mappings.map((mapping, idx) => (
                    <tr key={idx} className="hover:bg-indigo-50/30 transition-colors border-b last:border-0">
                      <td className="px-6 py-4 font-medium text-slate-900">{mapping.templateHeader}</td>
                      <td className="px-6 py-4">
                        <select 
                          value={mapping.sourceHeader}
                          onChange={(e) => handleManualMappingChange(mapping.templateHeader, e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        >
                          <option value="">(انتخاب دستی)</option>
                          {dataFile?.headers.map(h => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${mapping.confidence > 0.8 ? 'bg-green-500' : mapping.confidence > 0.4 ? 'bg-amber-500' : 'bg-red-400'}`}
                              style={{ width: `${mapping.confidence * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-slate-500">{Math.round(mapping.confidence * 100)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 italic max-w-xs truncate">
                        {mapping.reason || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-center gap-4">
              <button
                onClick={() => setStep(Step.UPLOAD)}
                className="bg-white border-2 border-slate-200 text-slate-600 font-bold py-3 px-8 rounded-xl hover:bg-slate-100 transition-all"
              >
                بازگشت
              </button>
              <button
                onClick={() => {
                   downloadResult();
                   setStep(Step.DOWNLOAD);
                }}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-12 rounded-xl shadow-lg transition-all flex items-center gap-3"
              >
                <DocumentArrowDownIcon className="w-6 h-6" />
                <span>ایجاد و دانلود فایل نهایی</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Success/Download */}
        {step === Step.DOWNLOAD && (
          <div className="max-w-2xl mx-auto bg-white p-12 rounded-2xl shadow-xl border border-slate-100 text-center">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircleIcon className="w-16 h-16 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-4">عملیات با موفقیت انجام شد!</h2>
            <p className="text-slate-600 text-lg mb-8 leading-relaxed">
              فایل جدید با ساختار نمونه و داده‌های فایل مبدا تولید و دانلود شد.
              می‌توانید فایل را باز کرده و اطلاعات منتقل شده را بررسی کنید.
            </p>
            <div className="flex flex-col gap-4">
              <button
                onClick={downloadResult}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-12 rounded-xl shadow-lg transition-all flex items-center justify-center gap-3"
              >
                <DocumentArrowDownIcon className="w-6 h-6" />
                <span>دانلود مجدد فایل</span>
              </button>
              <button
                onClick={() => {
                   setTemplateFile(null);
                   setDataFile(null);
                   setMappings([]);
                   setStep(Step.UPLOAD);
                }}
                className="text-indigo-600 font-bold hover:underline"
              >
                انجام عملیات جدید
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-16 text-center text-slate-400 text-sm">
        ساخته شده با ❤️ و قدرت هوش مصنوعی Gemini
      </footer>
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
    <div className={`p-8 rounded-2xl border-2 transition-all h-full flex flex-col ${
      isUploaded ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-dashed border-slate-300 hover:border-indigo-400'
    }`}>
      <div className="flex items-center gap-4 mb-4">
        <div className={`p-3 rounded-xl ${isUploaded ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
          <CloudArrowUpIcon className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-800">{title}</h3>
          <p className="text-slate-500 text-sm">{description}</p>
        </div>
      </div>

      {!isUploaded ? (
        <label className="mt-6 flex-grow flex items-center justify-center cursor-pointer group">
          <input type="file" className="hidden" accept=".xlsx, .xls" onChange={onUpload} />
          <div className="text-center py-10 w-full border-2 border-dashed border-slate-200 rounded-xl group-hover:bg-slate-50 transition-all">
            <span className="text-indigo-600 font-bold">انتخاب فایل اکسل</span>
            <p className="text-xs text-slate-400 mt-2">فرمت‌های .xlsx یا .xls مورد تایید است</p>
          </div>
        </label>
      ) : (
        <div className="mt-6 flex-grow">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-indigo-100">
            <span className="text-xs font-bold text-indigo-600 block mb-2">ستون‌های شناسایی شده:</span>
            <div className="flex flex-wrap gap-2">
              {headers?.slice(0, 8).map((h, i) => (
                <span key={i} className="bg-indigo-50 text-indigo-700 text-[10px] px-2 py-1 rounded-md border border-indigo-100">
                  {h}
                </span>
              ))}
              {headers && headers.length > 8 && (
                <span className="text-slate-400 text-[10px]">+{headers.length - 8} ستون دیگر</span>
              )}
            </div>
          </div>
          <label className="block text-center mt-4 text-xs text-indigo-500 cursor-pointer hover:underline">
            <input type="file" className="hidden" accept=".xlsx, .xls" onChange={onUpload} />
            تغییر فایل
          </label>
        </div>
      )}
    </div>
  );
};

export default App;
