
import React, { useState } from 'react';
import { performPersianOCR } from '../services/ocrService';
import { saveAsWord } from '../utils/wordHelper';
import { 
  PhotoIcon, 
  ClipboardDocumentIcon, 
  DocumentArrowDownIcon,
  ArrowPathIcon,
  SparklesIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

const ImageOCR: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [extractedText, setExtractedText] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setExtractedText("");
      };
      reader.readAsDataURL(file);
    }
  };

  const startOCR = async () => {
    if (!image) return;
    setLoading(true);
    try {
      const text = await performPersianOCR(image);
      setExtractedText(text);
    } catch (err) {
      alert("خطا در پردازش هوشمند تصویر.");
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
    saveAsWord(extractedText, "extracted_text_persian");
  };

  return (
    <div className="max-w-6xl mx-auto p-4 animate-in fade-in duration-500">
      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* Left Side: Upload & Preview */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <PhotoIcon className="w-6 h-6 text-indigo-600" />
              بارگذاری تصویر
            </h2>
            
            <label className={`block border-3 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all ${
              image ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-200 hover:border-indigo-400'
            }`}>
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              {image ? (
                <div className="relative group">
                  <img src={image} alt="Preview" className="max-h-80 mx-auto rounded-xl shadow-md transition-transform group-hover:scale-[1.02]" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-xl transition-all">
                    <span className="text-white font-bold">تغییر تصویر</span>
                  </div>
                </div>
              ) : (
                <div className="py-12">
                  <PhotoIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">تصویر (عکس یا اسکرین‌شات) را اینجا رها کنید</p>
                </div>
              )}
            </label>

            <button
              disabled={!image || loading}
              onClick={startOCR}
              className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <ArrowPathIcon className="w-6 h-6 animate-spin" />
                  <span>در حال تحلیل هوشمند...</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="w-6 h-6" />
                  <span>تبدیل به متن فارسی</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Side: Result */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <SparklesIcon className="w-6 h-6 text-amber-500" />
                متن استخراج شده
              </h2>
              {extractedText && (
                <div className="flex gap-2">
                  <button onClick={copyToClipboard} title="کپی متن" className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                    {copied ? <CheckIcon className="w-5 h-5 text-green-500" /> : <ClipboardDocumentIcon className="w-5 h-5" />}
                  </button>
                  <button onClick={downloadWord} title="دانلود ورد" className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                    <DocumentArrowDownIcon className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex-grow">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 py-20">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-.3s]"></div>
                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:-.5s]"></div>
                  </div>
                  <p className="text-sm font-medium">هوش مصنوعی در حال بازخوانی حروف...</p>
                </div>
              ) : extractedText ? (
                <textarea
                  readOnly
                  value={extractedText}
                  dir="rtl"
                  className="w-full h-[450px] p-6 bg-slate-50 border border-slate-100 rounded-2xl text-slate-700 leading-loose text-lg resize-none focus:outline-none"
                />
              ) : (
                <div className="h-[450px] flex items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl text-slate-300">
                  <p>پس از پردازش، متن اینجا ظاهر می‌شود</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageOCR;
