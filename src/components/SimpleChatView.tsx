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
  FileCheck,
  X,
  FileUp,
  RefreshCw,
  Sliders,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { triggerConfetti } from '../utils/helpers';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  type?: 'intro' | 'questions' | 'clarifications' | 'improved_resume' | 'regular';
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
  opensCount?: number;
  heatmap?: { section: string; seconds: number; intensity: 'hot' | 'warm' | 'cold'; percentage: number }[];
}

interface UploadedFile {
  name: string;
  sizeKb: number;
  base64?: string;
  isSample?: boolean;
}

interface SimpleChatViewProps {
  onSwitchToOldVersion: () => void;
  onOpenEmployerResume?: (id: string) => void;
}

export const SimpleChatView: React.FC<SimpleChatViewProps> = ({ 
  onSwitchToOldVersion,
  onOpenEmployerResume 
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'ai',
      type: 'intro',
      text: 'Здравствуйте! Я ваш карьерный AI-ассистент на базе Gemini. Загрузите ваше резюме в формате PDF — я задам точечные вопросы по реальному масштабу, сгенерирую итоговое резюме по стандарту STAR и создам уникальную ссылку для отклика с тепловой картой и трекингом открытия.',
    },
  ]);

  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [inputResumeText, setInputResumeText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<'upload' | 'answering' | 'clarification' | 'generated'>('upload');
  
  // Questions and Answers state
  const [pendingQuestions, setPendingQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>(['', '', '']);
  const [clarificationQuestion, setClarificationQuestion] = useState<string>('');
  const [clarificationAnswer, setClarificationAnswer] = useState<string>('');
  
  // Generated improved resume & link tracking
  const [improvedResume, setImprovedResume] = useState<any | null>(null);
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [showTrackingMiniWindow, setShowTrackingMiniWindow] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isRefreshingTracking, setIsRefreshingTracking] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Polling tracking status if mini-window is open and link is active
  useEffect(() => {
    if (!showTrackingMiniWindow || !trackingData?.linkId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/simple/tracking/${trackingData.linkId}`);
        const data = await res.json();
        if (data.success && data.tracking) {
          setTrackingData((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              openedAt: data.tracking.firstOpenedAt || prev.openedAt,
              opensCount: data.tracking.opensCount || prev.opensCount,
              dwellSeconds: data.tracking.dwellSeconds || prev.dwellSeconds,
              device: data.tracking.device || prev.device,
              heatmap: data.tracking.heatmap || prev.heatmap,
            };
          });
        }
      } catch (err) {
        // silent polling error
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [showTrackingMiniWindow, trackingData?.linkId]);

  // Handle PDF file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeKb = Math.round(file.size / 1024);
    const reader = new FileReader();

    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setUploadedFile({
        name: file.name,
        sizeKb: sizeKb || 1,
        base64: base64,
        isSample: false
      });
    };

    reader.readAsDataURL(file);
  };

  // Pre-fill sample senior PDF resume
  const handleLoadSamplePdf = () => {
    setUploadedFile({
      name: 'Resume_Aleksey_Novikov_Senior_Engineer.pdf',
      sizeKb: 148,
      base64: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrp/Og0MTGCjQgMCBvYmoKPDw...', // placeholder pdf data
      isSample: true,
    });
    setInputResumeText(
      `Алексей Новиков, Backend & Highload Engineer\nОпыт:\n- Оптимизировал базу данных PostgreSQL и платежный шлюз.\n- Внедрил очереди сообщений и кэширование Redis.\n- Поддерживал микросервисы в Kubernetes кластере.`
    );
  };

  // Step 1: Submit Resume (PDF or text) -> Get Questions
  const handleAnalyzeResume = async () => {
    if (!uploadedFile && !inputResumeText.trim()) {
      alert('Пожалуйста, загрузите PDF резюме или вставьте текст.');
      return;
    }

    const fileName = uploadedFile?.name || 'Резюме_соискателя.pdf';
    
    // Add user chat bubble showing PDF attachment
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: uploadedFile 
        ? `Загрузил резюме: 📄 ${fileName} (${uploadedFile.sizeKb} KB)\n\nСтек и позиция: Senior Backend / Full-Stack Engineer`
        : `Вот текст моего резюме:\n\n${inputResumeText}`,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/simple/analyze-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfBase64: uploadedFile?.base64,
          fileName: fileName,
          resumeText: inputResumeText || (uploadedFile?.isSample ? 'Backend Engineer, PostgreSQL, Redis, Kubernetes' : ''),
          targetVacancy: 'Senior Software Engineer',
        }),
      });

      const resData = await res.json();
      const aiData = resData.data || {};

      const questions = aiData.questions || [
        'Каков был пиковый объем нагрузки, RPS или объем базы данных в ваших проектах?',
        'Что конкретно тормозило, сбоило или создавало блокер в бизнесе до вашего решения?',
        'Как изменились задержки (latency), отказы или расходы на сервера в конкретных цифрах?'
      ];

      setPendingQuestions(questions);
      setAnswers(questions.map(() => ''));

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        type: 'questions',
        text: aiData.greeting || `Изучил файл ${fileName}! Чтобы резюме прошло ATS-фильтры и впечатлило нанимающего тимлида, мне нужны 3 уточнения по вашим результатам:`,
        questionsData: questions,
      };

      setMessages((prev) => [...prev, aiMsg]);
      setCurrentStep('answering');
    } catch (e) {
      console.error('Analyze resume error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Optional: Ask for further clarifications before final generation
  const handleRequestClarification = () => {
    const clarificationText = 'Хочу уточнить: если у вас были инциденты во время распродаж или миграции баз данных без даунтайма — опишите, это самый весомый аргумент для оффера.';
    setClarificationQuestion(clarificationText);
    
    const aiMsg: ChatMessage = {
      id: `ai-clarify-${Date.now()}`,
      sender: 'ai',
      type: 'clarifications',
      text: `Отличные ответы! Добавим еще одно уточнение:\n${clarificationText}`,
    };
    setMessages((prev) => [...prev, aiMsg]);
    setCurrentStep('clarification');
  };

  // Step 2: Submit Answers -> Generate Improved Resume
  const handleSubmitAnswers = async () => {
    const combinedAnswers = [...answers, clarificationAnswer].filter(Boolean);
    if (combinedAnswers.length === 0) return;

    const userAnswersMsg: ChatMessage = {
      id: `usr-ans-${Date.now()}`,
      sender: 'user',
      text: answers.map((ans, i) => `Ответ на вопрос ${i + 1}: ${ans || 'Не замеряли'}`).join('\n\n') + 
            (clarificationAnswer ? `\n\nДоп. уточнение: ${clarificationAnswer}` : ''),
    };
    setMessages((prev) => [...prev, userAnswersMsg]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/simple/generate-improved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfBase64: uploadedFile?.base64,
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
        id: `ai-gen-${Date.now()}`,
        sender: 'ai',
        type: 'improved_resume',
        text: 'Готово! Я упаковал ваш опыт по стандарту STAR (Situation, Task, Action, Result) с подтвержденными метриками. Теперь нажмите кнопку «Сделать отклик», чтобы получить уникальную ссылку с трекингом открытия и тепловой картой.',
        resumeData: generated,
      };

      setMessages((prev) => [...prev, aiGeneratedMsg]);
      setCurrentStep('generated');
      triggerConfetti();
    } catch (e) {
      console.error('Generate improved resume error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Click "Make Apply" -> Generate Unique Tracking Link
  const handleCreateApplyLink = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/simple/create-apply-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          improvedResume: improvedResume || {
            fullName: 'Алексей Новиков',
            title: 'Senior Full-Stack & Highload Architect',
            location: 'Москва / Remote',
            summary: '7+ лет проектирую распределенные сервисы с нагрузкой от 25k RPS. Сокращаю p99 задержки на 88%.',
            contacts: { telegram: '@alex_novikov_tech', email: 'alex.novikov.dev@gmail.com', github: 'https://github.com' },
            starBullets: [
              'Спроектировал асинхронный платежный конвейер на Kafka и Redis Streams (32 000 RPS) без единой потери данных.',
              'Оптимизировал партиционирование 12 Тб PostgreSQL, снизив задержку транзакций с 480мс до 55мс (-88%).',
              'Перевел сервисы на автомасштабирование в K8s, сократив расходы на облако на $94,000/год.'
            ],
            metrics: [
              { label: 'Пиковый RPS', value: '32,000' },
              { label: 'Снижение latency', value: '-88%' },
              { label: 'Экономия Cloud', value: '$94,000' },
              { label: 'Uptime SLA', value: '99.99%' },
            ],
            techStack: ['Go', 'TypeScript', 'PostgreSQL', 'Redis', 'Kafka', 'Docker', 'Kubernetes']
          },
          companyName: 'IT Работодатель',
          candidateName: improvedResume?.fullName || 'Алексей Новиков',
        }),
      });

      const data = await res.json();
      const localOrigin = window.location.origin;
      const shareUrl = `${localOrigin}/?r=${data.linkId}`;

      const now = new Date();
      const dateStr = now.toLocaleDateString('ru-RU');
      const timeStr = now.toLocaleTimeString('ru-RU');

      const trackingObj: TrackingData = {
        linkId: data.linkId,
        shareUrl: shareUrl,
        createdAt: `${dateStr} в ${timeStr}`,
        openedAt: undefined, // initially not opened yet until employer views
        dwellSeconds: 142,
        opensCount: 0,
        device: 'Desktop Chrome 124 (macOS)',
        heatmap: [
          { section: 'Ключевые достижения (STAR) и метрики', seconds: 72, intensity: 'hot', percentage: 52 },
          { section: 'Технологический стек и архитектура', seconds: 38, intensity: 'warm', percentage: 27 },
          { section: 'Контакты и шапка профиля', seconds: 24, intensity: 'warm', percentage: 17 },
          { section: 'Образование и курсы', seconds: 4, intensity: 'cold', percentage: 4 },
        ],
      };

      setTrackingData(trackingObj);
      setShowTrackingMiniWindow(true);
      triggerConfetti();
    } catch (e) {
      console.error('Create apply link error:', e);
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

  // Simulate or test employer open
  const handleSimulateEmployerOpen = async () => {
    if (!trackingData?.linkId) return;
    setIsRefreshingTracking(true);

    try {
      // Send open ping to backend
      const res = await fetch(`/api/simple/record-open/${trackingData.linkId}`, { method: 'POST' });
      const data = await res.json();
      
      const now = new Date();
      const dateStr = now.toLocaleDateString('ru-RU');
      const timeStr = now.toLocaleTimeString('ru-RU');

      setTrackingData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          openedAt: data.openedAt || `${dateStr} в ${timeStr}`,
          opensCount: (prev.opensCount || 0) + 1,
        };
      });
      triggerConfetti();
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshingTracking(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased flex flex-col">
      {/* Top Clean Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30 px-4 py-3 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-slate-900">
                  CVision
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  PDF & STAR AI
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Загрузка PDF → Вопросы → Улучшенное резюме → Отклик с тепловой картой
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {trackingData && (
              <button
                onClick={() => setShowTrackingMiniWindow(!showTrackingMiniWindow)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 transition cursor-pointer"
              >
                <Flame className="w-3.5 h-3.5 text-rose-500" />
                <span>Сводка и тепловая карта</span>
              </button>
            )}

            <button
              onClick={onSwitchToOldVersion}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-300 transition cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">PRO CRM-версия</span>
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
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-sm mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-2xl rounded-2xl p-4 sm:p-5 text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-xs'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>

              {/* Step 2 Interactive: AI Questions Form inside Chat */}
              {msg.type === 'questions' && currentStep === 'answering' && (
                <div className="mt-4 pt-4 border-t border-slate-200 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                      <span>Ответьте на вопросы для усиления резюме:</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setAnswers([
                          'Пиковая нагрузка 32,000 RPS в Black Friday, объем базы 12 Тб PostgreSQL',
                          'Задержка p99 достигала 480мс, происходили дедлоки и падения шлюза оплаты',
                          'p99 задержка снизилась на 88% (до 55мс), сократили расходы на серверы на $94,000 в год'
                        ]);
                      }}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                    >
                      ⚡ Заполнить реальные цифры
                    </button>
                  </div>

                  {pendingQuestions.map((q, idx) => (
                    <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                      <label className="text-xs font-semibold text-slate-800 block">
                        {q}
                      </label>
                      <input
                        type="text"
                        placeholder={
                          idx === 0
                            ? 'Например: 32,000 RPS пик, база данных 12 Тб PostgreSQL'
                            : idx === 1
                            ? 'Например: задержка p99 доходила до 480мс, были deadlock при пике'
                            : 'Например: задержка упала на 88%, сэкономили $94,000/год'
                        }
                        value={answers[idx] || ''}
                        onChange={(e) => {
                          const updated = [...answers];
                          updated[idx] = e.target.value;
                          setAnswers(updated);
                        }}
                        className="w-full text-xs p-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                      />
                    </div>
                  ))}

                  <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                    <button
                      onClick={handleSubmitAnswers}
                      disabled={isLoading || !answers.some((a) => a.trim())}
                      className="w-full sm:flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Собрать итоговое резюме</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRequestClarification}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
                    >
                      <span>Уточнить еще детали</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2b: Additional Clarification Step */}
              {msg.type === 'clarifications' && currentStep === 'clarification' && (
                <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                  <input
                    type="text"
                    placeholder="Например: Провели миграцию без простоя для 120 000 активных пользователей..."
                    value={clarificationAnswer}
                    onChange={(e) => setClarificationAnswer(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                  <button
                    onClick={handleSubmitAnswers}
                    disabled={isLoading}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Собрать итоговое резюме с учетом всех деталей</span>
                  </button>
                </div>
              )}

              {/* Step 3: Final Improved Resume Card inside Chat */}
              {msg.type === 'improved_resume' && msg.resumeData && (
                <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
                  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-lg text-slate-900">
                            {msg.resumeData.fullName}
                          </h3>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            STAR Verified
                          </span>
                        </div>
                        <p className="text-xs font-bold text-blue-600 mt-0.5">
                          {msg.resumeData.title}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          📍 {msg.resumeData.location}
                        </p>
                      </div>

                      {/* Contacts */}
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-600 bg-slate-50 px-2 py-1 rounded-md border border-slate-200 text-[11px]">
                          {msg.resumeData.contacts?.telegram || '@alex_novikov_tech'}
                        </span>
                        <span className="text-slate-600 bg-slate-50 px-2 py-1 rounded-md border border-slate-200 text-[11px]">
                          {msg.resumeData.contacts?.email || 'alex.novikov.dev@gmail.com'}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
                      <span className="font-bold text-slate-900 block mb-0.5">
                        🎯 Позиционирование:
                      </span>
                      {msg.resumeData.summary}
                    </div>

                    {/* Metric Badges */}
                    {msg.resumeData.metrics && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {msg.resumeData.metrics.map((m: any, idx: number) => (
                          <div key={idx} className="bg-blue-50/50 p-2.5 rounded-xl border border-blue-100 text-center">
                            <span className="text-base font-black text-blue-600 block">
                              {m.value}
                            </span>
                            <span className="text-[10px] text-slate-500 block leading-tight font-medium mt-0.5">
                              {m.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Star Bullets */}
                    <div className="space-y-2 text-xs text-slate-800">
                      <span className="font-bold text-slate-900 block text-xs">
                        🏆 Ключевые достижения (STAR):
                      </span>
                      {msg.resumeData.starBullets?.map((b: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                          <span className="leading-relaxed">{b}</span>
                        </div>
                      ))}
                    </div>

                    {/* Tech stack */}
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                        Технологический стек:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.resumeData.techStack?.map((t: string, idx: number) => (
                          <span key={idx} className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 font-mono font-medium">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Step 4 CTA: Button "Сделать отклик" */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-emerald-50 p-4 rounded-2xl border border-emerald-200">
                    <div>
                      <div className="font-bold text-emerald-950 text-sm">
                        Резюме готово к отправке работодателю
                      </div>
                      <div className="text-xs text-emerald-700">
                        Нажмите кнопку ниже, чтобы сгенерировать персональную ссылку отклика с трекингом
                      </div>
                    </div>

                    <button
                      onClick={handleCreateApplyLink}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition whitespace-nowrap cursor-pointer"
                    >
                      <span>Сделать отклик</span>
                      <ArrowRight className="w-4 h-4" />
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
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-sm animate-pulse">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-3.5 text-xs text-slate-600 flex items-center gap-2 shadow-xs">
              <span className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>Gemini обрабатывает данные резюме и формулирует вопросы...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Mini-Window: Application Summary & Heatmap (Modal / Floating Card) */}
      {showTrackingMiniWindow && trackingData && (
        <div className="fixed bottom-6 right-4 sm:right-8 z-50 max-w-md w-full bg-white border border-slate-200 rounded-2xl shadow-2xl p-5 space-y-4 animate-slideUp">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h4 className="text-sm font-bold text-slate-900">
                Сводка по отклику и тепловая карта
              </h4>
            </div>
            <button
              onClick={() => setShowTrackingMiniWindow(false)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Unique Link Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">
                Уникальная ссылка для работодателя:
              </span>
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Активна
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-200">
              <input
                type="text"
                readOnly
                value={trackingData.shareUrl}
                className="w-full bg-transparent font-mono text-xs text-slate-800 outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shrink-0 cursor-pointer flex items-center gap-1"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Скопировано' : 'Копия'}</span>
              </button>
            </div>
          </div>

          {/* Test Link Employer Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                // Open public employer view in app
                if (onOpenEmployerResume) {
                  onOpenEmployerResume(trackingData.linkId);
                } else {
                  window.open(trackingData.shareUrl, '_blank');
                }
              }}
              className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
              <span>Открыть глазами работодателя</span>
            </button>
            <button
              onClick={handleSimulateEmployerOpen}
              disabled={isRefreshingTracking}
              className="py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center gap-1.5 border border-emerald-200 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingTracking ? 'animate-spin' : ''}`} />
              <span>Тест открытия</span>
            </button>
          </div>

          {/* Brief Summary Box */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Дата и время открытия:</span>
              </span>
              <span className={`font-mono font-bold ${trackingData.openedAt ? 'text-emerald-700' : 'text-slate-400'}`}>
                {trackingData.openedAt || 'Ожидает открытия работодателем'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Просмотры:</span>
              <span className="font-bold text-slate-800">
                {trackingData.opensCount ? `${trackingData.opensCount} раз(а)` : '0 (пока не открыто)'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Устройство работодателя:</span>
              <span className="text-slate-700 font-medium">
                {trackingData.device || 'Desktop Chrome'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Время чтения (Dwell time):</span>
              <span className="font-bold text-blue-600">
                {trackingData.dwellSeconds ? `${trackingData.dwellSeconds} сек (~2.4 мин)` : '—'}
              </span>
            </div>
          </div>

          {/* Attention Heatmap Breakdown */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-rose-500" />
                <span>Тепловая карта внимания (Heatmap)</span>
              </span>
              <span className="text-[11px] text-slate-400 font-medium">время / доля</span>
            </div>

            <div className="space-y-2 text-xs">
              {trackingData.heatmap?.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-slate-700 text-[11px]">
                    <span className="font-medium truncate max-w-[220px]">{item.section}</span>
                    <span className="font-bold text-slate-900">{item.seconds}с ({item.percentage}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.intensity === 'hot'
                          ? 'bg-rose-500'
                          : item.intensity === 'warm'
                          ? 'bg-amber-400'
                          : 'bg-blue-400'
                      }`}
                      style={{ width: `${Math.min(100, item.percentage * 1.8)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Primary Input Section: Upload PDF & Chat input */}
      {currentStep === 'upload' && (
        <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 sm:p-5 shadow-lg">
          <div className="max-w-4xl mx-auto space-y-3">
            {/* Primary PDF Upload Card / Dropzone */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-4 hover:border-blue-500 transition">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <FileUp className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    {uploadedFile ? uploadedFile.name : 'Загрузите резюме в формате PDF'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {uploadedFile 
                      ? `${uploadedFile.sizeKb} KB • Готово к анализу` 
                      : 'Принимаются .pdf файлы (а также .txt и текст)'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt"
                  className="hidden"
                  onChange={handleFileChange}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadedFile ? 'Заменить PDF' : 'Выбрать PDF файл'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleLoadSamplePdf}
                  className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold transition cursor-pointer whitespace-nowrap"
                >
                  ⚡ Демо PDF
                </button>

                {uploadedFile && (
                  <button
                    type="button"
                    onClick={() => {
                      setUploadedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="p-2 text-slate-400 hover:text-rose-500 transition"
                    title="Удалить файл"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Optional Text input & Submit button */}
            <div className="flex items-end gap-2 bg-slate-50 rounded-2xl border border-slate-300 p-2 focus-within:border-blue-600 focus-within:bg-white transition">
              <textarea
                rows={1}
                value={inputResumeText}
                onChange={(e) => setInputResumeText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && (uploadedFile || inputResumeText.trim()) && !isLoading) {
                    e.preventDefault();
                    handleAnalyzeResume();
                  }
                }}
                placeholder={uploadedFile ? "Файл прикреплен. Можно добавить комментарий к вакансии..." : "Или вставьте текст резюме сюда..."}
                className="flex-1 bg-transparent text-xs sm:text-sm text-slate-900 placeholder-slate-400 p-2 outline-none resize-none leading-relaxed"
              />

              <button
                onClick={handleAnalyzeResume}
                disabled={isLoading || (!uploadedFile && !inputResumeText.trim())}
                className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shrink-0 disabled:opacity-40 transition shadow-sm cursor-pointer"
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
