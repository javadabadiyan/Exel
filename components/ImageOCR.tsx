
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
  ChatBubbleBottomCenterTextIcon
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
      // Fix: Cast Array.from result to File[] to ensure proper type inference for name and Blob compatibility
      (Array.from(files) as File[]).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const newImage: ImageFile = {
            id: Math.random().toString(36).substr(2, 9),
            preview: reader.result as string,
            base64: reader.result as string,
            // Fix: 'file' is now correctly recognized as File, allowing access to 'name'
            name: file.name
          };
          setImages(prev => [...prev, newImage]);
        };
        // Fix: 'file' is now recognized as a valid Blob for readAsDataURL
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
    saveAsWord(extractedText, "متن_استخراج_شده_هوشمند");
  };

  const downloadExcel = () => {
    const lines = extractedText.split('\n').map(line => ({ محتوا: line }));
    const ws = XLSX.utils.json_to_sheet(lines);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "متن استخراج شده");
    XLSX.writeFile(wb, "خروجی_اکسل_OCR.xlsx");
  };

  return (
    <div className="max-w-7xl mx-auto p-4 animate-in fade-in duration-500">
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl flex items-center gap-3">
          <ExclamationCircleIcon className="w-6 h-6 shrink-0" />
          <p className="text-sm font-bold">{error}</p>
        </div>
      )}
      
      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* Left Side: Controls & Upload (Column 1-5) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <PhotoIcon className="w-6 h-6 text-indigo-600" />
              بارگذاری و تنظیمات
            </h2>
            
            {/* Instruction Area */}
            <div className="mb-6">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-600 mb-3 mr-1">
                <ChatBubbleBottomCenterTextIcon className="w-5 h-5 text-amber-500" />
                دستور خاص برای استخراج (اختیاری)
              </label>
              <textarea
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="مثلاً: فقط جدول وسط صفحه را استخراج کن، یا فقط اسامی را بنویس..."
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none min-h-[100px] resize-none transition-all"
              />
            </div>

            {/* Dropzone */}
            <label className={`block border-3 border-dashed rounded-[2rem] p-10 text-center cursor-pointer transition-all ${
              images.length > 0 ? 'bg-indigo-50/30 border-indigo-200' : 'bg-slate-50 border-slate-200 hover:border-indigo-400'
            }`}>
              <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageUpload} />
              <div className="flex flex-col items-center">
                <PhotoIcon className="w-12 h-12 text-slate-300 mb-4" />
                <p className="text-slate-500 font-bold">انتخاب تصاویر (تکی یا دسته‌ای)</p>
                <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-widest">JPG, PNG, WEBP Supported</p>
              </div>
            </label>

            {/* Image List Preview */}
            {images.length > 0 && (
              <div className="mt-8 grid grid-cols-3 gap-3">
                {images.map(img => (
                  <div key={img.id} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
                    <img src={img.preview} alt="Preview" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                    <button 
                      onClick={() => removeImage(img.id)}
                      className="absolute top-1 left-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              disabled={images.length === 0 || loading}
              onClick={startOCR}
              className="w-full mt-8 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold py-5 rounded-2xl shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-3 group"
            >
              {loading ? (
                <>
                  <ArrowPathIcon className="w-6 h-6 animate-spin" />
                  <span>در حال تحلیل {images.length} تصویر...</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                  <span>شروع استخراج هوشمند</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Side: Result (Column 6-12) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <SparklesIcon className="w-6 h-6 text-amber-500" />
                متن استخراج شده نهایی
              </h2>
              {extractedText && (
                <div className="flex gap-2">
                  <button onClick={copyToClipboard} title="کپی متن" className="p-3 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-slate-100 shadow-sm">
                    {copied ? <CheckIcon className="w-5 h-5 text-green-500" /> : <ClipboardDocumentIcon className="w-5 h-5" />}
                  </button>
                  <button onClick={downloadWord} title="خروجی Word" className="p-3 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-slate-100 shadow-sm">
                    <DocumentArrowDownIcon className="w-5 h-5" />
                  </button>
                  <button onClick={downloadExcel} title="خروجی Excel" className="p-3 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all border border-slate-100 shadow-sm">
                    <TableCellsIcon className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex-grow">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-6 py-32 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 bg-indigo-400 rounded-full animate-bounce"></div>
                    <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce [animation-delay:-.3s]"></div>
                    <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce [animation-delay:-.5s]"></div>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-slate-700">هوش مصنوعی در حال بازخوانی...</p>
                    <p className="text-xs text-slate-400 mt-2">این فرآیند ممکن است چند لحظه زمان ببرد</p>
                  </div>
                </div>
              ) : extractedText ? (
                <textarea
                  readOnly
                  value={extractedText}
                  dir="rtl"
                  className="w-full h-[550px] p-8 bg-slate-50 border border-slate-100 rounded-[2rem] text-slate-700 leading-[2.2] text-lg resize-none focus:outline-none shadow-inner"
                />
              ) : (
                <div className="h-[550px] flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-[2rem] text-slate-300 bg-slate-50/30">
                  <SparklesIcon className="w-16 h-16 mb-4 text-slate-100" />
                  <p className="font-medium text-slate-400">پس از پردازش، متن هوشمند اینجا ظاهر می‌شود</p>
                </div>
              )}
            </div>

            {extractedText && (
              <div className="mt-6 flex items-center justify-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-slate-50 py-3 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  آماده برای خروجی
                </div>
                <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                {extractedText.split(' ').length} کلمه استخراج شده
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageOCR;
