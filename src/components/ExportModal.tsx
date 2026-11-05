import React, { useState } from 'react';
import { CandidateResume } from '../types';
import { 
  Download, 
  FileJson, 
  FileText, 
  Printer, 
  Copy, 
  Check, 
  ShieldCheck 
} from 'lucide-react';
import { exportToJsonResume, exportToMarkdown, triggerConfetti } from '../utils/helpers';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: CandidateResume;
  onTriggerNotification: (msg: string) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  candidate,
  onTriggerNotification,
}) => {
  const [activeFormat, setActiveFormat] = useState<'json' | 'markdown'>('json');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const jsonContent = exportToJsonResume(candidate);
  const markdownContent = exportToMarkdown(candidate);
  const currentText = activeFormat === 'json' ? jsonContent : markdownContent;

  const handleDownloadFile = () => {
    const extension = activeFormat === 'json' ? 'json' : 'md';
    const mime = activeFormat === 'json' ? 'application/json' : 'text/markdown';
    const blob = new Blob([currentText], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Resume_${candidate.slug}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
    triggerConfetti();
    onTriggerNotification(`💾 Файл Resume_${candidate.slug}.${extension} успешно скачан!`);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    onTriggerNotification('📋 Скопировано в буфер обмена!');
  };

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Экспорт резюме (ATS Machine & HR Standard)
              </h2>
              <p className="text-xs text-slate-400">
                Чистый машиночитаемый код для кадровых роботов и PDF-печать:
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Format Selector Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-2 rounded-xl border border-slate-800 text-xs">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveFormat('json')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
                activeFormat === 'json'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileJson className="w-4 h-4 text-emerald-400" />
              <span>JSON Resume Standard (v1.0.0)</span>
            </button>

            <button
              onClick={() => setActiveFormat('markdown')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
                activeFormat === 'markdown'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Markdown (GitHub / Notion)</span>
            </button>
          </div>

          <button
            onClick={handlePrintPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition cursor-pointer"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Печать / Сохранить в PDF</span>
          </button>
        </div>

        {/* Code Preview Box */}
        <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-[11px] text-slate-300 overflow-y-auto max-h-72 select-all leading-relaxed">
          <pre>{currentText}</pre>
        </div>

        {/* ATS compatibility badge */}
        <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>
              100% валидный синтаксис для ATS роботов-парсеров (Huntflow, Lever, Greenhouse, Поток).
            </span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold cursor-pointer"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{isCopied ? 'Скопировано!' : 'Скопировать код'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs"
            >
              Отмена
            </button>
            <button
              onClick={handleDownloadFile}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Скачать файл</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
