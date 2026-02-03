
import React, { useState } from 'react';
import { performPersianOCR } from '../services/ocrService';
import { saveAsWord } from '../utils/wordHelper';
import * as XLSX from 'xlsx';
import { 
  PhotoIcon, 
  ClipboardDocumentIcon, 
  DocumentArrowDownIcon,
  ArrowPathIcon,
  SparklesIcon,
  CheckIcon,
  ExclamationCircleIcon,
  XMarkIcon,
  TableCellsIcon,
  ChatBubbleBottomCenterTextIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface ImageFile {
  id: string;
  preview: string;
  base64: string;
  name: string;
}

const ImageOCR: React.FC = () => {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [extractedText, setExtractedText] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [instruction, setInstruction] = useState<string>("");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // Fix: Explicitly cast Array.from result to File[] to fix 'unknown' type errors
      const fileList = Array.from(files) as File[];
      fileList.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const newImage: ImageFile = {
            id: Math.random().toString(36).substr(2, 9),
            preview: reader.result as string,
            base64: reader.result as string,
            name: file.name
          };
          setImages(prev => [...prev, newImage]);
        };
        reader.readAsDataURL(file);
      });
      setError(null);
    }
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const startOCR = async () => {
    if (images.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const base64List = images.map(img => img.base64);
      const text = await performPersianOCR(base64List, instruction);
      setExtractedText(text);
    } catch (err: any) {
      setError(err.message || "خطا در پردازش تصاویر.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadWord = () => {
    if (!extractedText) return;
    saveAsWord(extractedText, "متن_استخراج_شده");
  };

  const downloadExcel = () => {
    if (!extractedText) return;
    // تبدیل هر خط به یک سطر در اکسل
    const rows = extractedText.split('\n').map(line => ({ "متن استخراج شده": line }));
    const ws = XLSX.utils.json_to_sheet(rows);
    
    // تنظیم جهت راست‌به‌چپ برای شیت اکسل
    if (!ws['!views']) ws['!views'] = [];
    ws['!views'].push({ RTL: true });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "نتایج");
    XLSX.writeFile(wb, "خروجی_اکسل_هوشمند.xlsx");
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl flex items-center gap-3 shadow-sm">
          <ExclamationCircleIcon className="w-6 h-6 shrink-0" />
          <p className="text-sm font-bold">{error}</p>
        </div>
      )}
      
      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* بخش تنظیمات و بارگذاری */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
              <PhotoIcon className="w-7 h-7 text-indigo-600" />
              تنظیمات استخراج
            </h2>
            
            {/* فیلد دستورات اختصاصی */}
            <div className="mb-8">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-600 mb-3 mr-1">
                <ChatBubbleBottomCenterTextIcon className="w-5 h-5 text-amber-500" />
                دستور اختصاصی (اختیاری)
              </label>
              <textarea
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="مثال: فقط شماره‌های تماس را استخراج کن، یا فقط پاراگراف دوم تصویر اول را بنویس..."
                className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none min-h-[120px] resize-none transition-all placeholder:text-slate-400"
              />
              <p className="text-[10px] text-slate-400 mt-2 mr-2">
                با این دستور می‌توانید به هوش مصنوعی بگویید دقیقاً چه بخشی از عکس را نیاز دارید.
              </p>
            </div>

            {/* دراپ‌زون عکس‌ها */}
            <label className={`block border-3 border-dashed rounded-[2.5rem] p-10 text-center cursor-pointer transition-all ${
              images.length > 0 ? 'bg-indigo-50/40 border-indigo-200' : 'bg-slate-50 border-slate-200 hover:border-indigo-400 hover:bg-slate-100/50'
            }`}>
              <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageUpload} />
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <PhotoIcon className="w-10 h-10 text-slate-300" />
                </div>
                <p className="text-slate-600 font-bold">انتخاب تصاویر (تکی یا گروهی)</p>
                <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-widest font-medium">JPEG, PNG, WEBP Supported</p>
              </div>
            </label>

            {/* لیست پیش‌نمایش عکس‌ها */}
            {images.length > 0 && (
              <div className="mt-8 grid grid-cols-4 gap-3">
                {images.map(img => (
                  <div key={img.id} className="relative group aspect-square rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
                    <img src={img.preview} alt="Preview" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                    <button 
                      onClick={() => removeImage(img.id)}
                      className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <XMarkIcon className="w-6 h-6 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              disabled={images.length === 0 || loading}
              onClick={startOCR}
              className="w-full mt-8 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold py-5 rounded-[1.5rem] shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-3 group"
            >
              {loading ? (
                <>
                  <ArrowPathIcon className="w-6 h-6 animate-spin" />
                  <span>در حال پردازش هوشمند...</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                  <span>شروع استخراج متن</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* بخش نمایش نتایج */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8 h-full flex flex-col min-h-[600px]">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <DocumentTextIcon className="w-7 h-7 text-amber-500" />
                <h2 className="text-xl font-bold text-slate-800">متن استخراج شده</h2>
              </div>
              
              {extractedText && (
                <div className="flex gap-2">
                  <button 
                    onClick={copyToClipboard} 
                    title="کپی در حافظه"
                    className="p-3 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all border border-slate-100 shadow-sm bg-white"
                  >
                    {copied ? <CheckIcon className="w-5 h-5 text-green-500" /> : <ClipboardDocumentIcon className="w-5 h-5" />}
                  </button>
                  <button 
                    onClick={downloadWord} 
                    title="خروجی Word"
                    className="p-3 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all border border-slate-100 shadow-sm bg-white"
                  >
                    <DocumentArrowDownIcon className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={downloadExcel} 
                    title="خروجی Excel"
                    className="p-3 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-2xl transition-all border border-slate-100 shadow-sm bg-white"
                  >
                    <TableCellsIcon className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex-grow">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-8 py-20 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200">
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                    <SparklesIcon className="w-8 h-8 text-amber-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-slate-700">هوش مصنوعی در حال بازخوانی...</p>
                    <p className="text-sm text-slate-400 mt-2">تصاویر شما با دقت تحلیل می‌شوند</p>
                  </div>
                </div>
              ) : extractedText ? (
                <textarea
                  readOnly
                  value={extractedText}
                  dir="rtl"
                  className="w-full h-full min-h-[450px] p-8 bg-slate-50 border border-slate-100 rounded-[2rem] text-slate-700 leading-[2.4] text-lg resize-none focus:outline-none shadow-inner font-light"
                />
              ) : (
                <div className="h-full min-h-[450px] flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-[2rem] text-slate-300 bg-slate-50/40">
                  <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center shadow-sm mb-6">
                    <SparklesIcon className="w-12 h-12 text-slate-100" />
                  </div>
                  <p className="font-bold text-slate-400">پس از پردازش، متن نهایی اینجا ظاهر می‌شود</p>
                  <p className="text-xs text-slate-300 mt-2">نتایج با پشتیبانی کامل از فونت فارسی ارائه می‌شوند</p>
                </div>
              )}
            </div>

            {extractedText && (
              <div className="mt-8 flex items-center justify-between px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">آماده برای دریافت خروجی</span>
                </div>
                <div className="text-[10px] text-slate-400 font-bold">
                  تعداد کلمات: {extractedText.trim().split(/\s+/).length}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageOCR;
