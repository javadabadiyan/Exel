
import React, { useState, useRef } from 'react';
import { transcribeAudio } from '../services/audioService';
import { saveAsWord } from '../utils/wordHelper';
import * as XLSX from 'xlsx';
import { 
  MicrophoneIcon, 
  StopIcon, 
  ArrowPathIcon, 
  DocumentArrowDownIcon, 
  TableCellsIcon, 
  ClipboardDocumentIcon, 
  CheckIcon,
  CloudArrowUpIcon,
  SparklesIcon,
  SpeakerWaveIcon
} from '@heroicons/react/24/outline';

const SpeechToText: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioURL(URL.createObjectURL(audioBlob));
        await processAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError(null);
    } catch (err) {
      setError("دسترسی به میکروفون امکان‌پذیر نیست.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setError(null);
      setAudioURL(URL.createObjectURL(file));
      await processAudio(file);
    }
  };

  const processAudio = async (blob: Blob) => {
    setLoading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        const text = await transcribeAudio(base64Audio, blob.type || 'audio/webm');
        setTranscription(text);
      };
    } catch (err: any) {
      setError(err.message || "خطا در تبدیل صوت.");
    } finally {
      setLoading(false);
    }
  };

  const downloadWord = () => saveAsWord(transcription, "متن_صوتی_فارسی");

  const downloadExcel = () => {
    const rows = transcription.split('\n').map(line => ({ "متن استخراج شده": line }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!views'] = [{ RTL: true }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "نتایج");
    XLSX.writeFile(wb, "خروجی_صوت_هوشمند.xlsx");
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(transcription);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 animate-in fade-in duration-700">
      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* کنترل‌های ضبط و آپلود */}
        <div className="space-y-6">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
              <SpeakerWaveIcon className="w-7 h-7 text-indigo-600" />
              ورودی صدا
            </h2>

            <div className="flex flex-col items-center gap-8 py-10">
              {/* دکمه ضبط */}
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-xl ${
                  isRecording 
                    ? 'bg-red-500 scale-110 shadow-red-100 ring-8 ring-red-50' 
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100 hover:scale-105'
                }`}
              >
                {isRecording ? (
                  <StopIcon className="w-10 h-10 text-white" />
                ) : (
                  <MicrophoneIcon className="w-10 h-10 text-white" />
                )}
                {isRecording && (
                  <span className="absolute -inset-4 border-4 border-red-400 rounded-full animate-ping opacity-25"></span>
                )}
              </button>
              
              <p className="text-slate-500 font-bold text-center">
                {isRecording ? "در حال شنیدن... برای توقف کلیک کنید" : "برای شروع ضبط فارسی کلیک کنید"}
              </p>

              <div className="w-full flex items-center gap-4">
                <div className="flex-grow h-px bg-slate-100"></div>
                <span className="text-[10px] text-slate-400 font-bold">یا آپلود فایل صوتی</span>
                <div className="flex-grow h-px bg-slate-100"></div>
              </div>

              <label className="w-full cursor-pointer group">
                <input type="file" className="hidden" accept="audio/*" onChange={handleFileUpload} />
                <div className="flex items-center justify-center gap-3 p-5 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl group-hover:border-indigo-400 transition-all">
                  <CloudArrowUpIcon className="w-6 h-6 text-slate-400 group-hover:text-indigo-500" />
                  <span className="text-sm font-bold text-slate-500 group-hover:text-indigo-600">انتخاب فایل صوتی (MP3, WAV, ...)</span>
                </div>
              </label>
            </div>

            {audioURL && (
              <div className="mt-4 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                <audio src={audioURL} controls className="w-full h-10" />
              </div>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-center gap-3 text-sm font-bold">
              <StopIcon className="w-5 h-5" />
              {error}
            </div>
          )}
        </div>

        {/* نتیجه تبدیل */}
        <div className="space-y-6">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8 flex flex-col min-h-[500px]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                <SparklesIcon className="w-7 h-7 text-amber-500" />
                متن استخراج شده
              </h2>
              {transcription && (
                <div className="flex gap-2">
                  <button onClick={copyToClipboard} className="p-2 text-slate-400 hover:text-indigo-600 bg-slate-50 rounded-xl transition-all">
                    {copied ? <CheckIcon className="w-5 h-5 text-green-500" /> : <ClipboardDocumentIcon className="w-5 h-5" />}
                  </button>
                  <button onClick={downloadWord} className="p-2 text-slate-400 hover:text-blue-600 bg-slate-50 rounded-xl transition-all">
                    <DocumentArrowDownIcon className="w-5 h-5" />
                  </button>
                  <button onClick={downloadExcel} className="p-2 text-slate-400 hover:text-green-600 bg-slate-50 rounded-xl transition-all">
                    <TableCellsIcon className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex-grow relative">
              {loading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10 gap-4">
                  <ArrowPathIcon className="w-10 h-10 text-indigo-600 animate-spin" />
                  <p className="text-sm font-bold text-slate-600">هوش مصنوعی در حال پردازش صوت...</p>
                </div>
              ) : null}
              
              <textarea
                readOnly
                value={transcription}
                placeholder="متن تبدیل شده در اینجا ظاهر خواهد شد..."
                className="w-full h-full min-h-[400px] p-6 bg-slate-50 border border-slate-100 rounded-3xl text-slate-700 leading-relaxed text-lg resize-none outline-none"
                dir="rtl"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpeechToText;
