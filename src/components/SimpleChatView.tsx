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
  AlertCircle,
  Quote,
  Target,
  Wand2,
  Tag
} from 'lucide-react';
import { triggerConfetti } from '../utils/helpers';

interface SpecificQuestion {
  id: number;
  context: string;
  quote: string;
  issue: string;
  question: string;
  placeholder: string;
  sampleAnswer?: string;
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  type?: 'intro' | 'questions' | 'clarifications' | 'improved_resume' | 'regular';
  questionsData?: string[];
  specificQuestions?: SpecificQuestion[];
  detectedTech?: string[];
  candidateName?: string;
  detectedRole?: string;
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
      text: 'Здравствуйте! Я ваш карьерный AI-ассистент на базе Gemini. Загрузите ваше резюме в формате PDF — я детально изучу ваш опыт, найду слабые формулировки и задам точечные вопросы именно по вашим проектам, чтобы усилить резюме реальными цифрами и масштабом.',
    },
  ]);

  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [inputResumeText, setInputResumeText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<'upload' | 'answering' | 'clarification' | 'generated'>('upload');
  
  // Questions and Answers state
  const [specificQuestions, setSpecificQuestions] = useState<SpecificQuestion[]>([]);
  const [pendingQuestions, setPendingQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>(['', '', '']);
  const [clarificationQuestion, setClarificationQuestion] = useState<string>('');
  const [clarificationAnswer, setClarificationAnswer] = useState<string>('');
  
  // Candidate metadata extracted from resume
  const [detectedCandidateName, setDetectedCandidateName] = useState<string>('');
  const [detectedRole, setDetectedRole] = useState<string>('');
  const [detectedTech, setDetectedTech] = useState<string[]>([]);

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

  // Pre-fill sample authentic developer PDF resume
  const handleLoadSamplePdf = () => {
    const sampleText = `Илья Братанов
Senior Frontend & Full-Stack Engineer (React, TypeScript)
Telegram: @ilya_bratanov | Email: ilya.bratanov.dev@gmail.com | GitHub: github.com/bratanov

ОПЫТ РАБОТЫ:
Fintech Global Trading (2022 — 2024) • Senior Frontend Developer
- Разрабатывал веб-терминал трейдера на React 18, TypeScript и WebSockets для торговли криптовалютами.
- Переписал глобальное состояние приложения с Redux на Zustand и оптимизировал рендеринг графиков TradingView.
- Настраивал сборку проекта на Vite и оптимизировал CI/CD пайплайн в GitLab.

E-Commerce Retail Platform (2020 — 2022) • Middle Frontend Developer
- Занимался версткой и поддержкой каталога товаров и чекаута на Next.js и Tailwind CSS.
- Исправлял баги в корзине покупок и оформлении заказов, подключал платежные шлюзы.

СТЕК ТЕХНОЛОГИЙ:
TypeScript, React 18, Next.js, Zustand, Redux Toolkit, WebSockets, Tailwind CSS, Vite, Node.js, REST API, Git.`;

    setUploadedFile({
      name: 'Resume_Ilya_Bratanov_Senior_Frontend.pdf',
      sizeKb: 154,
      base64: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrp/Og0MTGCjQgMCBvYmoKPDw...',
      isSample: true,
    });
    setInputResumeText(sampleText);
  };

  // Step 1: Submit Resume (PDF or text) -> Get Deep Tailored Questions
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
        ? `Загрузил резюме: 📄 ${fileName} (${uploadedFile.sizeKb} KB)\nПроанализируй мой опыт и задай вопросы по моим проектам.`
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
          resumeText: inputResumeText || (uploadedFile?.isSample ? 'Senior Frontend Engineer, React, TypeScript, WebSockets' : ''),
          targetVacancy: 'Senior Software Engineer',
        }),
      });

      const resData = await res.json();
      const aiData = resData.data || {};

      const detectedName = aiData.candidateName || 'Кандидат';
      const role = aiData.detectedRole || 'Senior Engineer';
      const techList = aiData.detectedTech || ['TypeScript', 'React'];
      const questionsList = aiData.questions || [];
      const specQuestions: SpecificQuestion[] = aiData.specificQuestions || [];

      setDetectedCandidateName(detectedName);
      setDetectedRole(role);
      setDetectedTech(techList);
      setSpecificQuestions(specQuestions);
      setPendingQuestions(questionsList);
      setAnswers(questionsList.map(() => ''));

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        type: 'questions',
        text: aiData.greeting || `Здравствуйте! Я изучил ваше резюме на позицию «${role}». Чтобы резюме выделилось среди других соискателей, я выделил 3 конкретных места из вашего опыта, требующих оцифровки:`,
        questionsData: questionsList,
        specificQuestions: specQuestions,
        detectedTech: techList,
        candidateName: detectedName,
        detectedRole: role
      };

      setMessages((prev) => [...prev, aiMsg]);
      setCurrentStep('answering');
    } catch (e) {
      console.error('Analyze resume error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick fill tailored answers for this specific resume
  const handleFillTailoredAnswers = () => {
    if (specificQuestions.length > 0) {
      const filled = specificQuestions.map((q) => q.sampleAnswer || '15,000 активных пользователей, снижение задержки на 65%');
      setAnswers(filled);
    } else {
      setAnswers([
        '12,000 тиков/сек в стакане через WebSockets, буферизация в Zustand, стабильные 60 FPS',
        'Снизили время загрузки графиков на 65% (с 2.4с до 0.8с), размер бандла упал на 34%',
        'Ликвидировали дедлоки и сбои чекаута в пиковые дни, подняли SLA до 99.99%'
      ]);
    }
  };

  // Quick fill individual question answer
  const handleFillSingleAnswer = (index: number) => {
    const updated = [...answers];
    updated[index] = specificQuestions[index]?.sampleAnswer || 'Метрика оптимизирована на 65%, нагрузка 15k пользователей';
    setAnswers(updated);
  };

  // Optional: Ask for further clarifications before final generation
  const handleRequestClarification = () => {
    const clarificationText = 'Дополнительное уточнение по вашему резюме: приходилось ли вам наставлять джуниоров, проводить код-ревью или принимать архитектурные решения по выбору библиотек? Опишите кратко, чтобы мы добавили лидерские метрики.';
    setClarificationQuestion(clarificationText);
    
    const aiMsg: ChatMessage = {
      id: `ai-clarify-${Date.now()}`,
      sender: 'ai',
      type: 'clarifications',
      text: `Отличные ответы по проектам! Добавим еще одно точечное уточнение:\n\n${clarificationText}`,
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
      text: answers.map((ans, i) => `Ответ по задаче ${i + 1}: ${ans || 'Не замеряли'}`).join('\n\n') + 
            (clarificationAnswer ? `\n\nЛидерство и процессы: ${clarificationAnswer}` : ''),
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
          specificQuestions: specificQuestions,
          answers: answers,
          targetVacancy: detectedRole || 'Senior Software Engineer',
        }),
      });

      const resData = await res.json();
      const generated = resData.data;
      setImprovedResume(generated);

      const aiGeneratedMsg: ChatMessage = {
        id: `ai-gen-${Date.now()}`,
        sender: 'ai',
        type: 'improved_resume',
        text: `Готово, ${detectedCandidateName || 'коллега'}! Я полностью переписал формулировки из вашего резюме по международному стандарту STAR. Пассивные фразы заменены на сильные инженерные результаты с вашими цифрами. Нажмите кнопку «Сделать отклик», чтобы создать персональную страницу с трекингом открытия и тепловой картой.`,
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
            fullName: detectedCandidateName || 'Илья Братанов',
            title: detectedRole || 'Senior Frontend & Full-Stack Engineer',
            location: 'Москва / Remote Worldwide',
            summary: 'Специалист по high-load интерфейсам и архитектуре состояния. Сокращаю задержки рендеринга и выдерживаю поток до 15 000 тиков/сек.',
            contacts: { telegram: '@candidate_lead', email: 'candidate.dev@gmail.com', github: 'https://github.com' },
            starBullets: [
              'Спроектировал клиентскую архитектуру веб-терминала: интегрировал буферизацию потока WebSockets (12 000 тиков/сек) через requestAnimationFrame, исключив микрофризы (стабильные 60 FPS).',
              'Переписал глобальное состояние с Redux на Zustand и оптимизировал графики TradingView: снизил время загрузки на 65% (с 2.4с до 0.8с) и сократил размер бандла на 34%.',
              'Оптимизировал процессы выкатки и чекаут: ликвидировал сбои при пиковом трафике, подняв SLA до 99.99%.'
            ],
            metrics: [
              { label: 'Поток событий', value: '12,000/с' },
              { label: 'Ускорение рендера', value: '-65%' },
              { label: 'Размер бандла', value: '-34%' },
              { label: 'Uptime SLA', value: '99.99%' },
            ],
            techStack: detectedTech.length > 0 ? detectedTech : ['TypeScript', 'React 18', 'Next.js', 'Zustand', 'WebSockets', 'Tailwind']
          },
          companyName: 'IT Работодатель',
          candidateName: detectedCandidateName || improvedResume?.fullName || 'Илья Братанов',
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
        openedAt: undefined,
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
                  Индивидуальный анализ резюме
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Анализ опыта → Точечные вопросы по проектам → STAR резюме → Отклик с трекингом
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

              {/* Step 2 Interactive: AI Questions Tailored Specifically to Candidate's Resume */}
              {msg.type === 'questions' && currentStep === 'answering' && (
                <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
                  {/* Candidate Summary Banner */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-slate-900">
                          {detectedCandidateName || msg.candidateName || 'Кандидат'}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                          {detectedRole || msg.detectedRole || 'Инженер'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleFillTailoredAnswers}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>Заполнить примеры под мое резюме</span>
                      </button>
                    </div>

                    {/* Tech tags found in the actual resume */}
                    {(detectedTech.length > 0 || (msg.detectedTech && msg.detectedTech.length > 0)) && (
                      <div className="flex flex-wrap gap-1 items-center pt-1">
                        <span className="text-[10px] text-slate-400 font-semibold mr-1">Найденный стек:</span>
                        {(detectedTech.length > 0 ? detectedTech : (msg.detectedTech || [])).map((t, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 font-mono">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 pt-1">
                    <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                    <span>Вопросы по конкретным пунктам вашего опыта:</span>
                  </span>

                  {/* Individual Question Cards */}
                  {pendingQuestions.map((q, idx) => {
                    const spec = specificQuestions[idx] || (msg.specificQuestions && msg.specificQuestions[idx]);
                    return (
                      <div key={idx} className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-3">
                        {/* Context & Quote Header */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                              Вопрос {idx + 1} из {pendingQuestions.length}
                            </span>
                            {spec?.context && (
                              <span className="text-[11px] font-semibold text-slate-500">
                                {spec.context}
                              </span>
                            )}
                          </div>

                          {/* Quoted sentence from the candidate's actual resume */}
                          {spec?.quote && (
                            <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-start gap-2">
                              <Quote className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                              <div>
                                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                                  Цитата из вашего резюме:
                                </span>
                                <span className="text-xs text-slate-800 italic font-medium">
                                  {spec.quote}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Specific issue */}
                          {spec?.issue && (
                            <p className="text-[11px] text-amber-700 bg-amber-50/70 p-2 rounded-lg border border-amber-200/60 leading-tight">
                              ⚠️ <strong>Слабое место:</strong> {spec.issue}
                            </p>
                          )}
                        </div>

                        {/* Targeted Question */}
                        <label className="text-xs font-bold text-slate-900 block leading-snug">
                          {spec?.question || q}
                        </label>

                        {/* Input & Fill single answer */}
                        <div className="space-y-1.5">
                          <input
                            type="text"
                            placeholder={spec?.placeholder || 'Опишите конкретные цифры и результат...'}
                            value={answers[idx] || ''}
                            onChange={(e) => {
                              const updated = [...answers];
                              updated[idx] = e.target.value;
                              setAnswers(updated);
                            }}
                            className="w-full text-xs p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                          />

                          {spec?.sampleAnswer && !answers[idx] && (
                            <button
                              type="button"
                              onClick={() => handleFillSingleAnswer(idx)}
                              className="text-[10px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <span>+ Вставить пример ответа под эту задачу</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                    <button
                      onClick={handleSubmitAnswers}
                      disabled={isLoading || !answers.some((a) => a.trim())}
                      className="w-full sm:flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Собрать итоговое резюме по стандарту STAR</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRequestClarification}
                      className="w-full sm:w-auto px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
                    >
                      <span>Уточнить еще детали</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2b: Additional Clarification Step */}
              {msg.type === 'clarifications' && currentStep === 'clarification' && (
                <div className="mt-3 pt-3 border-t border-slate-200 space-y-2.5">
                  <input
                    type="text"
                    placeholder="Например: Проводил архитектурные ревью, менторил 2 джунов, ускорил онбординг с 3 недель до 5 дней..."
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
                          {msg.resumeData.contacts?.telegram || '@candidate_lead'}
                        </span>
                        <span className="text-slate-600 bg-slate-50 px-2 py-1 rounded-md border border-slate-200 text-[11px]">
                          {msg.resumeData.contacts?.email || 'candidate.dev@gmail.com'}
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
              <span>Gemini читает текст резюме и формулирует вопросы по вашим проектам...</span>
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
