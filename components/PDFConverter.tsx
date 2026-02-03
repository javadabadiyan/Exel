
import React, { useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { extractPDFContent } from '../services/pdfService';
import { saveAsWord } from '../utils/wordHelper';
import * as XLSX from 'xlsx';
import { 
  DocumentIcon, 
  TableCellsIcon, 
  ArrowPathIcon, 
  CloudArrowUpIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

// Set worker source for pdfjs
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.10.38/build/pdf.worker.mjs`;

const PDFConverter: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const processPDF = async (format: 'word' | 'excel') => {
    if (!file) return;
    setLoading(true);
    setProgress("در حال خواندن فایل PDF...");
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const images: string[] = [];

      for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) { // Limit to 10 pages for demo
        setProgress(`در حال آماده‌سازی صفحه ${i} از ${pdf.numPages}...`);
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.getElementById('pdf-render-canvas') as HTMLCanvasElement;
        const context = canvas.getContext('2d');
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        await page.render({ canvasContext: context!, viewport }).promise;
        images.push(canvas.toDataURL('image/jpeg', 0.8));
      }

      setProgress("هوش مصنوعی در حال تحلیل متن و تصاویر...");
      const content = await extractPDFContent(images, format);
      
      if (format === 'word') {
        await saveAsWord(content, file.name.replace('.pdf', ''));
      } else {
        // Attempt to parse JSON if it's excel format
        try {
          const cleanJson = content.replace(/```json|```/g, '').trim();
          const data = JSON.parse(cleanJson);
          const ws = XLSX.utils.json_to_sheet(Array.isArray(data) ? data : [data]);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
          XLSX.writeFile(wb, `${file.name.replace('.pdf', '')}.xlsx`);
        } catch (e) {
          // Fallback if not JSON
          const ws = XLSX.utils.aoa_to_sheet([[content]]);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
          XLSX.writeFile(wb, `${file.name.replace('.pdf', '')}.xlsx`);
        }
      }
      
      setResult("تبدیل با موفقیت انجام شد.");
    } catch (error) {
      console.error(error);
      alert("خطا در پردازش فایل. لطفا دوباره تلاش کنید.");
    } finally {
      setLoading(false);
      setProgress("");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        <div className="p-10 text-center border-b border-slate-50 bg-gradient-to-br from-indigo-50 to-white">
          <DocumentIcon className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-slate-800 mb-2">تبدیل هوشمند PDF</h2>
          <p className="text-slate-500">فایل PDF خود را آپلود کنید تا هوش مصنوعی آن را به ورد یا اکسل تبدیل کند.</p>
        </div>

        <div className="p-10">
          <div className="mb-10">
            <label className={`block border-3 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all ${
              file ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200 hover:border-indigo-400'
            }`}>
              <input type="file" className="hidden" accept=".pdf" onChange={handleFileChange} />
              {file ? (
                <div className="flex flex-col items-center">
                  <CheckCircleIcon className="w-12 h-12 text-green-500 mb-3" />
                  <span className="text-lg font-bold text-slate-700">{file.name}</span>
                  <span className="text-sm text-slate-400 mt-1">{(file.size / 1024 / 1024).toFixed(2)} مگابایت</span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <CloudArrowUpIcon className="w-12 h-12 text-slate-400 mb-3" />
                  <span className="text-lg text-slate-600">انتخاب یا رها کردن فایل PDF</span>
                </div>
              )}
            </label>
          </div>

          {loading && (
            <div className="mb-10 text-center">
              <div className="inline-flex items-center gap-3 text-indigo-600 font-bold mb-4">
                <ArrowPathIcon className="w-6 h-6 animate-spin" />
                <span>{progress}</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full animate-pulse" style={{width: '60%'}}></div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            <button
              disabled={!file || loading}
              onClick={() => processPDF('word')}
              className="flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold py-5 px-8 rounded-2xl shadow-lg transition-all"
            >
              <DocumentIcon className="w-6 h-6" />
              <span>تبدیل به Word</span>
            </button>
            <button
              disabled={!file || loading}
              onClick={() => processPDF('excel')}
              className="flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white font-bold py-5 px-8 rounded-2xl shadow-lg transition-all"
            >
              <TableCellsIcon className="w-6 h-6" />
              <span>تبدیل به Excel</span>
            </button>
          </div>

          {result && (
            <div className="mt-8 p-4 bg-green-50 text-green-700 rounded-xl text-center font-bold border border-green-100">
              {result}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PDFConverter;
