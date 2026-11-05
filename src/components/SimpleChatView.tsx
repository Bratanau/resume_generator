import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Upload, 
  FileText, 
  Check, 
  Copy, 
  ExternalLink, 
  Clock, 
  Flame, 
  Eye, 
  ArrowRight, 
  HelpCircle, 
  RotateCcw,
  CheckCircle2,
  Calendar,
  Layers,
  FileCheck
} from 'lucide-react';
import { triggerConfetti } from '../utils/helpers';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  type?: 'intro' | 'questions' | 'improved_resume' | 'regular';
  questionsData?: string[];
  resumeData?: any;
}

interface TrackingData {
  linkId: string;
  shareUrl: string;
  createdAt: string;
  openedAt?: string;
  dwellSeconds?: number;
  device?: string;
  heatmap?: { section: string; seconds: number; intensity: 'hot' | 'warm' | 'cold'; percentage: number }[];
}

export const SimpleChatView: React.FC<{ onSwitchToOldVersion: () => void }> = ({ onSwitchToOldVersion }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'ai',
      type: 'intro',
      text: 'Здравствуйте! Я ваш карьерный AI-ассистент на базе Gemini. Загрузите ваше текущее резюме файлом или вставьте текст — я задам несколько точечных вопросов, распакую реальный масштаб ваших проектов и соберу идеальное резюме с трекингом для отклика.',
    },
  ]);

  const [inputResumeText, setInputResumeText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<'upload' | 'answering' | 'generated'>('upload');
  
  // Questions and Answers state
  const [pendingQuestions, setPendingQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>(['', '', '']);
  
  // Generated improved resume & link tracking
  const [improvedResume, setImprovedResume] = useState<any | null>(null);
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [showTrackingMiniWindow, setShowTrackingMiniWindow] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Pre-fill sample resume for quick testing
  const sampleResume = `Алексей Новиков, Backend Engineer. 
Опыт: 
- Работал над платежным сервисом, оптимизировал запросы в базе данных PostgreSQL.
- Написал интеграцию с брокером сообщений и настраивал кэш в Redis.
- Поддерживал микросервисы в Kubernetes.
Стек: Go, TypeScript, PostgreSQL, Redis, Docker, k8s.`;

  const handlePreFillSample = () => {
    setInputResumeText(sampleResume);
  };

  // Step 1: Submit Resume -> Get Questions
  const handleAnalyzeResume = async (overrideText?: string) => {
    const textToAnalyze = typeof overrideText === 'string' ? overrideText : inputResumeText;
    if (!textToAnalyze.trim()) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: `Вот мое резюме для вакансии Senior Engineer:\n\n${textToAnalyze}`,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/simple/analyze-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText: textToAnalyze,
          targetVacancy: 'Senior Software Engineer',
        }),
      });

      const resData = await res.json();
      const aiData = resData.data;

      const questions = aiData.questions || [
        'Каков был пиковый объем трафика, пользователей или RPS в вашей системе?',
        'Что именно падало, тормозило или создавало блокер в бизнесе до вашего решения?',
        'Как изменились задержки (latency), отказы или расходы на сервера в цифрах?'
      ];

      setPendingQuestions(questions);
      setAnswers(questions.map(() => ''));

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        type: 'questions',
        text: aiData.greeting || 'Изучил ваш опыт! Чтобы резюме выделилось среди сотен других, мне нужны 3 уточнения по реальному масштабу:',
        questionsData: questions,
      };

      setMessages((prev) => [...prev, aiMsg]);
      setCurrentStep('answering');
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Submit Answers -> Generate Improved Resume
  const handleSubmitAnswers = async () => {
    const combinedAnswers = answers.join('; ');
    if (!combinedAnswers.trim()) return;

    const userAnswersMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: answers.map((ans, i) => `Ответ ${i + 1}: ${ans || 'Не замеряли'}`).join('\n\n'),
    };
    setMessages((prev) => [...prev, userAnswersMsg]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/simple/generate-improved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText: inputResumeText,
          questions: pendingQuestions,
          answers: answers,
          targetVacancy: 'Senior Software Engineer',
        }),
      });

      const resData = await res.json();
      const generated = resData.data;
      setImprovedResume(generated);

      const aiGeneratedMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        type: 'improved_resume',
        text: 'Готово! Я упаковал ваш опыт по международному стандарту STAR с подтвержденными метриками. Вот ваше итоговое улучшенное резюме:',
        resumeData: generated,
      };

      setMessages((prev) => [...prev, aiGeneratedMsg]);
      setCurrentStep('generated');
      triggerConfetti();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Click "Make Apply" -> Generate Tracking Link
  const handleCreateApplyLink = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/simple/create-apply-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          improvedResume: improvedResume?.fullMarkdown || 'Resume Content',
          companyName: 'IT Работодатель',
        }),
      });

      const data = await res.json();
      const mockTracking: TrackingData = {
        linkId: data.linkId,
        shareUrl: data.shareUrl || `https://cvision.app/r/${data.linkId}`,
        createdAt: data.createdAt || 'Только что',
        openedAt: 'Сегодня в 14:24:05',
        dwellSeconds: 142,
        device: 'Desktop Chrome 124 (macOS)',
        heatmap: [
          { section: 'Ключевые достижения (STAR)', seconds: 72, intensity: 'hot', percentage: 52 },
          { section: 'Технологический стек', seconds: 38, intensity: 'warm', percentage: 27 },
          { section: 'Контакты и шапка', seconds: 24, intensity: 'warm', percentage: 17 },
          { section: 'Образование', seconds: 4, intensity: 'cold', percentage: 4 },
        ],
      };

      setTrackingData(mockTracking);
      setShowTrackingMiniWindow(true);
      triggerConfetti();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!trackingData?.shareUrl) return;
    navigator.clipboard.writeText(trackingData.shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Simulated employer opening the link
  const handleSimulateEmployerOpen = () => {
    if (trackingData) {
      const now = new Date();
      setTrackingData({
        ...trackingData,
        openedAt: `${now.toLocaleDateString('ru-RU')} в ${now.toLocaleTimeString('ru-RU')}`,
      });
      triggerConfetti();
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased flex flex-col">
      {/* Top Clean Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30 px-4 py-3 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-slate-900">
                  CVision
                </span>
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  Gemini Chat
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Упрощенный диалог: Резюме → Вопросы → Улучшение → Отклик с трекингом
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Switch to Full PRO Version Button */}
            <button
              onClick={onSwitchToOldVersion}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-300 transition cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Перейти в PRO-версию (Webvisor & CRM)</span>
              <span className="sm:hidden">PRO</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Chat Stream Container */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.sender === 'ai' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-2xl rounded-2xl p-4 sm:p-5 text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none shadow-sm'
                  : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none shadow-xs'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>

              {/* Step 2 Interactive: AI Questions Form inside Chat */}
              {msg.type === 'questions' && currentStep === 'answering' && (
                <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Ваши ответы на уточнения ИИ:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setAnswers([
                          '32,000 RPS пиковая нагрузка, 12 Тб PostgreSQL',
                          'Задержка p99 доходила до 480мс, были дедлоки в Черную пятницу',
                          'p99 задержка снизилась на 88% до 55мс, сэкономили $94,000 в год на серверах'
                        ]);
                      }}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                    >
                      + Заполнить готовые ответы
                    </button>
                  </div>

                  {pendingQuestions.map((q, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 block">
                        {q}
                      </label>
                      <input
                        type="text"
                        placeholder={
                          idx === 0
                            ? 'Например: 32,000 RPS, база данных 12 Тб PostgreSQL'
                            : idx === 1
                            ? 'Например: задержка доходила до 480мс, были deadlock при пике'
                            : 'Например: p99 снизилась на 88%, сэкономили $94,000/год'
                        }
                        value={answers[idx] || ''}
                        onChange={(e) => {
                          const updated = [...answers];
                          updated[idx] = e.target.value;
                          setAnswers(updated);
                        }}
                        className="w-full text-xs p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                      />
                    </div>
                  ))}

                  <button
                    onClick={handleSubmitAnswers}
                    disabled={isLoading || !answers.some((a) => a.trim())}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Собрать улучшенное STAR-резюме</span>
                  </button>
                </div>
              )}

              {/* Step 4: Improved Resume Card inside Chat */}
              {msg.type === 'improved_resume' && msg.resumeData && (
                <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
                  <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="font-extrabold text-base text-slate-900">
                          {msg.resumeData.fullName}
                        </h3>
                        <p className="text-xs font-semibold text-blue-600">
                          {msg.resumeData.title}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          📍 {msg.resumeData.location}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        STAR Ready
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 italic">
                      {msg.resumeData.summary}
                    </p>

                    {/* Metric Badges */}
                    {msg.resumeData.metrics && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {msg.resumeData.metrics.map((m: any, idx: number) => (
                          <div key={idx} className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-center">
                            <span className="text-sm font-black text-blue-600 block">
                              {m.value}
                            </span>
                            <span className="text-[10px] text-slate-500 block leading-tight">
                              {m.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Star Bullets */}
                    <div className="space-y-1.5 text-xs text-slate-700">
                      <span className="font-bold text-slate-900 block text-xs">
                        🎯 Подтвержденные результаты:
                      </span>
                      {msg.resumeData.starBullets?.map((b: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                          <span>{b}</span>
                        </div>
                      ))}
                    </div>

                    {/* Tech stack */}
                    <div className="flex flex-wrap gap-1 pt-2 border-t border-slate-100">
                      {msg.resumeData.techStack?.map((t: string, idx: number) => (
                        <span key={idx} className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Step 5 CTA: Button "Сделать отклик" */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-blue-50 p-3.5 rounded-xl border border-blue-200">
                    <div>
                      <div className="font-bold text-blue-950 text-xs">
                        Резюме готово к отправке работодателю
                      </div>
                      <div className="text-[11px] text-blue-700">
                        Сгенерируйте уникальную ссылку с трекингом открытия и тепловой картой
                      </div>
                    </div>

                    <button
                      onClick={handleCreateApplyLink}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition whitespace-nowrap cursor-pointer"
                    >
                      <span>Сделать отклик</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {msg.sender === 'user' && (
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 shrink-0 font-bold text-xs shadow-sm mt-0.5">
                Я
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm animate-pulse">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-none p-3.5 text-xs text-slate-500 flex items-center gap-2">
              <span className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>Gemini анализирует формулировки и метрики...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Step 6: Mini-Window with Open Date/Time & Heatmap */}
      {showTrackingMiniWindow && trackingData && (
        <div className="fixed bottom-20 right-4 sm:right-8 z-40 max-w-sm w-full bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 space-y-3 animate-slideUp">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <h4 className="text-xs font-bold text-slate-900">
                Мини-окно трекинга работодателя
              </h4>
            </div>
            <button
              onClick={() => setShowTrackingMiniWindow(false)}
              className="text-slate-400 hover:text-slate-600 text-xs p-1"
            >
              ✕
            </button>
          </div>

          {/* Unique Link Copy Box */}
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 block">
              Ваша уникальная ссылка для отклика:
            </span>
            <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-200 text-xs">
              <input
                type="text"
                readOnly
                value={trackingData.shareUrl}
                className="w-full bg-transparent font-mono text-[11px] text-slate-800 outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="px-2.5 py-1 rounded-md bg-blue-600 text-white text-[11px] font-semibold shrink-0 cursor-pointer"
              >
                {copiedLink ? <Check className="w-3 h-3" /> : 'Копия'}
              </button>
            </div>
          </div>

          {/* Date & Time of opening */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-[11px]">Дата и время открытия:</span>
              <span className="font-bold text-slate-900 font-mono text-[11px]">
                {trackingData.openedAt || 'Ожидаем переход...'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-[11px]">Устройство:</span>
              <span className="text-slate-700 text-[11px]">{trackingData.device}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-[11px]">Общее время чтения:</span>
              <span className="font-bold text-blue-600 text-[11px]">
                {trackingData.dwellSeconds} секунд
              </span>
            </div>
          </div>

          {/* Heatmap Section Breakdown */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-rose-500" />
                <span>Тепловая карта внимания (Heatmap)</span>
              </span>
              <span className="text-[10px] text-slate-400">сек / доля</span>
            </div>

            <div className="space-y-1.5 text-[11px]">
              {trackingData.heatmap?.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between text-slate-600 text-[10px]">
                    <span className="font-medium truncate max-w-[190px]">{item.section}</span>
                    <span className="font-bold text-slate-800">{item.seconds}с ({item.percentage}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.intensity === 'hot'
                          ? 'bg-rose-500'
                          : item.intensity === 'warm'
                          ? 'bg-amber-400'
                          : 'bg-blue-400'
                      }`}
                      style={{ width: `${item.percentage * 1.8}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <button
              onClick={handleSimulateEmployerOpen}
              className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
            >
              ⚡ Обновить визит работодателя
            </button>
            <span className="text-emerald-600 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Активно</span>
            </span>
          </div>
        </div>
      )}

      {/* Bottom Message Input Bar (Gemini style) */}
      {currentStep === 'upload' && (
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4">
          <div className="max-w-4xl mx-auto space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Загрузить файл (.txt / резюме)</span>
                  <input
                    type="file"
                    accept=".txt,.md,.json"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const content = ev.target?.result as string;
                          if (content) setInputResumeText(content);
                        };
                        reader.readAsText(file);
                      }
                    }}
                  />
                </label>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAnalyzeResume(sampleResume)}
                  className="px-2.5 py-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold cursor-pointer text-xs"
                >
                  ⚡ Разобрать пример в 1 клик
                </button>
                <button
                  type="button"
                  onClick={handlePreFillSample}
                  className="text-slate-500 hover:text-slate-700 font-medium cursor-pointer"
                >
                  Вставить текст
                </button>
              </div>
            </div>

            <div className="flex items-end gap-2 bg-slate-50 rounded-2xl border border-slate-300 p-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 focus-within:bg-white transition">
              <textarea
                rows={2}
                value={inputResumeText}
                onChange={(e) => setInputResumeText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && inputResumeText.trim() && !isLoading) {
                    e.preventDefault();
                    handleAnalyzeResume();
                  }
                }}
                placeholder="Вставьте текст вашего резюме сюда..."
                className="flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 p-2 outline-none resize-none leading-relaxed"
              />

              <button
                onClick={() => handleAnalyzeResume()}
                disabled={isLoading || !inputResumeText.trim()}
                className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shrink-0 disabled:opacity-40 transition shadow-sm cursor-pointer"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
