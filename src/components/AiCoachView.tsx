import React, { useState } from 'react';
import { 
  Sparkles, 
  Flame, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Send, 
  Copy, 
  Check, 
  ArrowRight,
  ShieldAlert,
  Zap,
  Target
} from 'lucide-react';
import { triggerConfetti } from '../utils/helpers';

interface AiCoachViewProps {
  initialRawText?: string;
  initialRole?: string;
  onApplyBulletToResume: (newBullet: string, metricLabel?: string, metricValue?: string) => void;
  onTriggerNotification: (msg: string) => void;
}

export const AiCoachView: React.FC<AiCoachViewProps> = ({
  initialRawText = '',
  initialRole = 'Senior Backend Engineer',
  onApplyBulletToResume,
  onTriggerNotification,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'unpacker' | 'roast'>('unpacker');
  
  // Unpacker State
  const [rawText, setRawText] = useState<string>(
    initialRawText || 'Я просто переписал несколько тяжелых запросов в базе данных PostgreSQL и добавил кэш в Redis, чтобы сайт не тормозил'
  );
  const [role, setRole] = useState<string>(initialRole);
  const [targetCompany, setTargetCompany] = useState<string>('Яндекс / Тинькофф');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [unpackResult, setUnpackResult] = useState<any | null>(null);
  const [selectedBulletIdx, setSelectedBulletIdx] = useState<number>(0);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  // Roast State
  const [isRoasting, setIsRoasting] = useState<boolean>(false);
  const [roastResult, setRoastResult] = useState<any | null>(null);

  // Quick preset scenarios for instant demonstration
  const presets = [
    {
      title: 'Оптимизация базы данных',
      text: 'Переписал медленные SQL-запросы в PostgreSQL, повесил индексы и настроил кэш в Redis',
      role: 'Backend Developer'
    },
    {
      title: 'Интеграция платежей',
      text: 'Подключил шлюз эквайринга Сбера и Тинькофф, настроил вебхуки и повторные попытки списания',
      role: 'Full-Stack Engineer'
    },
    {
      title: 'Фронтенд и Web Vitals',
      text: 'Верстал личный кабинет на React, перевел на Vite и настроил виртуализацию списков для быстродействия',
      role: 'Frontend Developer'
    }
  ];

  const handleUnpack = async () => {
    if (!rawText.trim()) return;
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/unpack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText,
          currentRole: role,
          targetRole: targetCompany,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setUnpackResult(data.data);
        triggerConfetti();
        onTriggerNotification('✨ AI превратил скромное описание в подтвержденные STAR-достижения!');
      }
    } catch (err) {
      console.error(err);
      onTriggerNotification('⚠️ Ошибка соединения с AI сервисом');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoast = async () => {
    setIsRoasting(true);

    try {
      const res = await fetch('/api/ai/roast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText: 'Full-stack & Highload Architect: 32k RPS Kafka, Redis, PostgreSQL 12TB partition, Go, TypeScript',
          targetJobTitle: role,
          targetCompany: targetCompany,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setRoastResult(data.data);
        onTriggerNotification('🔥 Прожарка завершена! Анализ ATS и рекрутера готов.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRoasting(false);
    }
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
    onTriggerNotification('📋 Скопировано в буфер обмена!');
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex items-center justify-between bg-slate-900 p-2 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('unpacker')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'unpacker'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>AI Диалоговый STAR-Распаковщик</span>
          </button>

          <button
            onClick={() => {
              setActiveSubTab('roast');
              if (!roastResult) handleRoast();
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'roast'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-300" />
            <span>Резюме-Прожарка & ATS Скор</span>
          </button>
        </div>

        <div className="text-xs text-slate-400 hidden sm:block pr-3">
          Powered by <strong>YandexGPT</strong>
        </div>
      </div>

      {/* SUBTAB 1: UNPACKER */}
      {activeSubTab === 'unpacker' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Input and Guided Prompts */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Анти-Синдром Самозванца
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Напишите своими словами, что вы делали — ИИ вытянет масштаб и цифры:
                  </p>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="space-y-1.5 mb-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Быстрые примеры из жизни:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {presets.map((p, pIdx) => (
                    <button
                      key={pIdx}
                      onClick={() => {
                        setRawText(p.text);
                        setRole(p.role);
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white border border-slate-700 transition"
                    >
                      {p.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Input Area */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Сырое описание задачи (как вы говорите другу за кофе):
                  </label>
                  <textarea
                    rows={4}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Например: перенес базу на другой сервер, пофиксил тормоза при выгрузке отчетов..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Ваша роль:
                    </label>
                    <input
                      type="text"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Целевой работодатель:
                    </label>
                    <input
                      type="text"
                      value={targetCompany}
                      onChange={(e) => setTargetCompany(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <button
                  onClick={handleUnpack}
                  disabled={isLoading || !rawText.trim()}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Анализирую масштаб через STAR...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Распаковать в измеримый STAR-кейс</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Micro-coaching Card */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300">
              <span className="font-bold text-indigo-300 block mb-1">
                💡 Принцип формулы Google XYZ:
              </span>
              «Достиг [X], измеряемое с помощью [Y], совершив действие [Z]». Рекрутеры тратят 6 секунд на резюме — они ищут конкретные цифры и технологии, а не процесс.
            </div>
          </div>

          {/* Right Column: Generated STAR & 3 High-Impact Bullets */}
          <div className="lg:col-span-7 space-y-4">
            {unpackResult ? (
              <div className="space-y-4 animate-fadeIn">
                {/* STAR Decomposition Breakdown */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <Target className="w-4 h-4 text-indigo-400" />
                      <span>Декомпозиция по STAR-методологии</span>
                    </h4>
                    <span className="text-[11px] text-emerald-400 font-semibold">
                      ✓ Подтверждено метриками
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-4">
                    <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                      <span className="font-bold text-amber-400 block mb-1">
                        S (Ситуация / Проблема):
                      </span>
                      <p className="text-slate-300">
                        {unpackResult.starAnalysis?.situation}
                      </p>
                    </div>

                    <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                      <span className="font-bold text-indigo-400 block mb-1">
                        T (Инженерная задача):
                      </span>
                      <p className="text-slate-300">
                        {unpackResult.starAnalysis?.task}
                      </p>
                    </div>

                    <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                      <span className="font-bold text-sky-400 block mb-1">
                        A (Архитектурное действие):
                      </span>
                      <p className="text-slate-300">
                        {unpackResult.starAnalysis?.action}
                      </p>
                    </div>

                    <div className="bg-slate-950/70 p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/10">
                      <span className="font-bold text-emerald-400 block mb-1">
                        R (Измеримый результат):
                      </span>
                      <p className="text-slate-200 font-medium">
                        {unpackResult.starAnalysis?.result}
                      </p>
                    </div>
                  </div>

                  {/* Coach Advice */}
                  {unpackResult.coachTip && (
                    <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200">
                      <strong>Слово ментора:</strong> {unpackResult.coachTip}
                    </div>
                  )}
                </div>

                {/* 3 Formatted Enterprise Bullets */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                    Выберите готовую строчку для вставки в резюме:
                  </h4>

                  <div className="space-y-3">
                    {unpackResult.bulletOptions?.map((opt: any, idx: number) => {
                      const isSelected = selectedBulletIdx === idx;
                      return (
                        <div
                          key={idx}
                          onClick={() => setSelectedBulletIdx(idx)}
                          className={`p-4 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500'
                              : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-xs font-bold text-white flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-indigo-400' : 'bg-slate-600'}`} />
                              {opt.title}
                            </span>
                            <span className="text-xs font-mono font-extrabold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              {opt.metricBadge}
                            </span>
                          </div>

                          <p className="text-xs text-slate-200 leading-relaxed mb-3">
                            {opt.bullet}
                          </p>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                            <div className="flex gap-1">
                              {opt.tags?.map((t: string, tIdx: number) => (
                                <span
                                  key={tIdx}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(opt.bullet, idx);
                                }}
                                className="text-slate-400 hover:text-white p-1 rounded"
                                title="Скопировать"
                              >
                                {copiedIdx === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onApplyBulletToResume(opt.bullet, 'Метрика', opt.metricBadge);
                                  triggerConfetti();
                                }}
                                className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center gap-1 shadow"
                              >
                                <span>Вставить в опыт</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[350px] bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3">
                  <Sparkles className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-white mb-1">
                  Здесь появятся распакованные STAR-пункты
                </h4>
                <p className="text-xs text-slate-400 max-w-sm">
                  Нажмите кнопку слева, чтобы нейросеть провела анти-самозванец интервью и сформулировала достижения для BigTech.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 2: ROAST & ATS */}
      {activeSubTab === 'roast' && (
        <div className="space-y-6 animate-fadeIn">
          {roastResult ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* ATS Score Card */}
              <div className="md:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col items-center text-center justify-between">
                <div className="w-full">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                    ATS Робот-Парсер (Scoring)
                  </div>

                  <div className="relative w-36 h-36 mx-auto flex items-center justify-center my-3">
                    <div className="w-full h-full rounded-full border-8 border-slate-800 flex items-center justify-center relative">
                      <div className="text-center">
                        <span className="text-4xl font-black text-emerald-400">
                          {roastResult.atsScore}
                        </span>
                        <span className="text-xs text-slate-400 block">из 100</span>
                      </div>
                    </div>
                  </div>

                  <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 font-bold text-xs border border-emerald-500/30 mb-3">
                    {roastResult.verdict}
                  </div>

                  <p className="text-xs text-slate-300 italic">
                    «{roastResult.recruiterFirstImpression}»
                  </p>
                </div>

                <div className="w-full pt-4 border-t border-slate-800 mt-4 text-[11px] text-slate-400">
                  Совместимо с Lever, Huntflow, Поток, Greenhouse
                </div>
              </div>

              {/* Red Flags & Power Moves */}
              <div className="md:col-span-8 space-y-4">
                {/* Mentors Roast Quote */}
                <div className="bg-gradient-to-r from-rose-950/40 via-slate-900 to-amber-950/30 border border-rose-500/30 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="w-4 h-4 text-rose-400 animate-pulse" />
                    <span className="text-xs font-bold text-rose-300 uppercase tracking-wider">
                      Честная прожарка от техлида:
                    </span>
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed font-medium">
                    «{roastResult.overallRoastSummary}»
                  </p>
                </div>

                {/* Red Flags List */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                  <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider mb-3">
                    <ShieldAlert className="w-4 h-4" />
                    <span>3 Красных флага (почему вам могут отказать):</span>
                  </div>

                  <div className="space-y-3">
                    {roastResult.redFlags?.map((rf: any, idx: number) => (
                      <div key={idx} className="bg-slate-950/70 p-3.5 rounded-xl border border-rose-500/20 text-xs">
                        <div className="flex items-center justify-between text-rose-300 font-bold mb-1">
                          <span>{rf.issue}</span>
                          <span className="text-slate-400 font-normal">{rf.location}</span>
                        </div>
                        <p className="text-slate-300">
                          <strong className="text-emerald-400">Решение:</strong> {rf.fix}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Power Moves */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3">
                    <Zap className="w-4 h-4" />
                    <span>Киллер-фичи (почему вас позовут на оффер):</span>
                  </div>

                  <div className="space-y-2.5">
                    {roastResult.powerMoves?.map((pm: any, idx: number) => (
                      <div key={idx} className="bg-slate-950/70 p-3 rounded-xl border border-emerald-500/20 text-xs">
                        <div className="font-bold text-white mb-0.5">{pm.point}</div>
                        <div className="text-slate-400">{pm.why}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Missing Keywords */}
                {roastResult.missingKeywords && (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-300 mr-1">
                      Добавить ключевые слова для робота:
                    </span>
                    {roastResult.missingKeywords.map((kw: string, idx: number) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-mono"
                      >
                        + {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
              <span className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin inline-block mb-3" />
              <p className="text-sm font-semibold text-white">Прожариваем резюме через ATS сканер...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
