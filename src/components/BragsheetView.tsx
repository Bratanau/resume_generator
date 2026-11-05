import React, { useState } from 'react';
import { BragsheetEntry } from '../types';
import { 
  Award, 
  Sparkles, 
  Calendar, 
  Plus, 
  TrendingUp, 
  FileCheck, 
  Download, 
  Tag, 
  Check, 
  ShieldCheck,
  Send,
  Brain
} from 'lucide-react';
import { triggerConfetti } from '../utils/helpers';

interface BragsheetViewProps {
  entries: BragsheetEntry[];
  onAddEntry: (entry: BragsheetEntry) => void;
  onTriggerNotification: (msg: string) => void;
}

export const BragsheetView: React.FC<BragsheetViewProps> = ({
  entries,
  onAddEntry,
  onTriggerNotification,
}) => {
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [casualInput, setCasualInput] = useState<string>('');
  const [period, setPeriod] = useState<string>('Ноябрь 2026');
  const [isPackaging, setIsPackaging] = useState<boolean>(false);

  const handlePackageEntry = async () => {
    if (!casualInput.trim()) return;
    setIsPackaging(true);

    try {
      const res = await fetch('/api/ai/bragsheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          casualEntry: casualInput,
          period,
          currentRole: 'Senior Engineer',
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        const item = data.data;
        const newEntry: BragsheetEntry = {
          id: `brag-${Date.now()}`,
          date: period,
          rawInput: `«${casualInput}»`,
          corporateTitle: item.corporateTitle || 'Оптимизация критического сервиса',
          situation: item.starBreakdown?.situation || 'Технические ограничения замедляли поставку фичей.',
          action: item.starBreakdown?.action || 'Перепроектировал архитектуру конвейера.',
          result: item.starBreakdown?.result || 'Снизил риски отказа и ускорил обработку.',
          performanceBullet: item.performanceReviewBullet || casualInput,
          category: item.category || 'Architecture',
          scoreBonus: item.promotionScoreBonus || '+15 баллов к грейду',
          tags: item.suggestedTags || ['Highload', 'Architecture'],
        };

        onAddEntry(newEntry);
        setCasualInput('');
        setShowAddForm(false);
        triggerConfetti();
        onTriggerNotification('💎 Достижение упаковано в Bragsheet и сохранено в карьерный капитал!');
      }
    } catch (err) {
      console.error(err);
      onTriggerNotification('⚠️ Ошибка соединения');
    } finally {
      setIsPackaging(false);
    }
  };

  const handleExportPerformanceReport = () => {
    let report = `# ЕЖЕГОДНЫЙ ОТЧЕТ О ДОСТИЖЕНИЯХ (PERFORMANCE REVIEW DOSSIER)\n`;
    report += `Сотрудник: Алексей Новиков | Должность: Senior / Staff Engineer\n\n`;
    report += `Суммарный прирост карьерного капитала: +47 баллов к промоушену\n\n`;

    entries.forEach((e) => {
      report += `## [${e.date}] ${e.corporateTitle} (${e.category})\n`;
      report += `*Исходная задача:* ${e.rawInput}\n\n`;
      report += `**Формулировка для ревью:** ${e.performanceBullet}\n`;
      report += `- S (Ситуация): ${e.situation}\n`;
      report += `- A (Действие): ${e.action}\n`;
      report += `- R (Результат): ${e.result}\n`;
      report += `Бонус к грейду: ${e.scoreBonus}\n\n`;
    });

    const blob = new Blob([report], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Performance_Review_Alex_Novikov.md`;
    a.click();
    URL.revokeObjectURL(url);
    onTriggerNotification('📄 Досье для 1-on-1 и прибавки к зарплате скачано!');
  };

  return (
    <div className="space-y-6">
      {/* Super Retention Hero Header */}
      <div className="bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/50 border border-purple-500/30 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-bold text-white">
                Bragsheet: Трекер Карьерного Капитала & Дневник Достижений
              </h2>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Не ждите увольнения, чтобы вспоминать, что вы делали 2 года назад. Наговаривайте голосовуху раз в месяц: ИИ упаковывает ваши рутинные рабочие победы в железобетонные аргументы для 1-on-1, прибавки к зарплате и промоушена в Staff.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPerformanceReport}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Выгрузить досье для 1-on-1</span>
            </button>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Записать победу за месяц</span>
            </button>
          </div>
        </div>

        {/* Promotion Readiness Bar */}
        <div className="mt-5 p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-black text-lg border border-purple-500/30">
              88%
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Готовность к повышению грейда (Promotion Score)</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                  Senior Staff Candidate
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Зафиксировано 3 подтвержденных архитектурных кейса нулевого простоя и менторинга
              </div>
            </div>
          </div>

          <div className="text-xs text-purple-300 font-medium">
            Суммарная ценность: <strong className="text-white">+47 баллов к капиталу</strong>
          </div>
        </div>
      </div>

      {/* Add New Accomplishment Modal / Form */}
      {showAddForm && (
        <div className="bg-slate-900 border border-purple-500/40 rounded-2xl p-5 shadow-2xl animate-fadeIn space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-400" />
              <span>Записать достижение простыми словами (ИИ упакует в STAR)</span>
            </h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="md:col-span-2">
              <label className="block text-slate-300 font-semibold mb-1">
                Что крутого внедрили или починили на работе за этот период?
              </label>
              <textarea
                rows={3}
                value={casualInput}
                onChange={(e) => setCasualInput(e.target.value)}
                placeholder="Пример: «Перевели аналитику с Postgres на ClickHouse, запросы стали летать за 20мс вместо 4 секунд»"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Отчетный период:
              </label>
              <input
                type="text"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500 mb-3"
              />

              <button
                onClick={handlePackageEntry}
                disabled={isPackaging || !casualInput.trim()}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-purple-600/30"
              >
                {isPackaging ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Упаковываю...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Упаковать в капитал</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Timeline of Accomplishments */}
      <div className="space-y-4">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl hover:border-slate-700 transition"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3 mb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-purple-500/15 text-purple-300 border border-purple-500/30">
                  {entry.date}
                </span>
                <h3 className="text-base font-bold text-white">
                  {entry.corporateTitle}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  {entry.scoreBonus}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {entry.category}
                </span>
              </div>
            </div>

            {/* Raw casual quote */}
            <div className="text-xs text-slate-400 italic mb-4 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
              Исходные слова разработчика: {entry.rawInput}
            </div>

            {/* Structured Executive Bullet */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-indigo-500/30 text-xs text-slate-200 mb-4 leading-relaxed">
              <span className="font-bold text-indigo-300 block mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Идеальная формулировка для руководителя & Performance Review:</span>
              </span>
              {entry.performanceBullet}
            </div>

            {/* Mini STAR Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs mb-3">
              <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800">
                <span className="text-amber-400 font-bold block text-[11px]">S (Ситуация):</span>
                <p className="text-slate-300 mt-0.5">{entry.situation}</p>
              </div>

              <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800">
                <span className="text-sky-400 font-bold block text-[11px]">A (Действие):</span>
                <p className="text-slate-300 mt-0.5">{entry.action}</p>
              </div>

              <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800">
                <span className="text-emerald-400 font-bold block text-[11px]">R (Результат):</span>
                <p className="text-slate-300 mt-0.5">{entry.result}</p>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800/60">
              {entry.tags.map((t, idx) => (
                <span
                  key={idx}
                  className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800 font-mono"
                >
                  #{t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
