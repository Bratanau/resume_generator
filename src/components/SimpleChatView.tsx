import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Upload, 
  FileText, 
  Check, 
  Copy, 
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
  Download,
  Sliders,
  CheckCircle,
  AlertCircle,
  Quote,
  Target,
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
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  type?: 'intro' | 'questions' | 'improved_resume' | 'regular';
  questionsData?: string[];
  specificQuestions?: SpecificQuestion[];
  detectedTech?: string[];
  reviewSummary?: string;
  strengths?: string[];
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
  maxScrollDepth?: number;
  linkClicks?: number;
  heatmap?: { section: string; seconds: number; intensity: 'hot' | 'warm' | 'cold'; percentage: number }[];
  recommendations?: { id: string; title: string; reason: string; prompt: string; accepted: boolean }[];
}

interface UploadedFile {
  name: string;
  sizeKb: number;
  base64?: string;
  text?: string;
}

interface SimpleChatViewProps {
  onSwitchToOldVersion: () => void;
}

async function readApiResponse(response: Response): Promise<Record<string, any>> {
  let data: Record<string, any>;
  try {
    data = await response.json();
  } catch {
    throw new Error(`Сервер вернул некорректный ответ (HTTP ${response.status}).`);
  }

  if (!response.ok || data.success === false) {
    throw new Error(data.error || data.detail || `Ошибка сервера (HTTP ${response.status}).`);
  }

  return data;
}

export const SimpleChatView: React.FC<SimpleChatViewProps> = ({ onSwitchToOldVersion }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'ai',
      type: 'intro',
      text: 'Здравствуйте! Я ваш карьерный AI-ассистент. Загрузите ваше резюме в формате PDF — я детально изучу ваш опыт, найду слабые формулировки и задам точечные вопросы именно по вашим проектам, чтобы усилить резюме реальными цифрами и масштабом.',
    },
  ]);

  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [inputResumeText, setInputResumeText] = useState<string>('');
  const [targetVacancy, setTargetVacancy] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<'upload' | 'answering' | 'generated'>('upload');
  
  // Questions and Answers state
  const [specificQuestions, setSpecificQuestions] = useState<SpecificQuestion[]>([]);
  const [pendingQuestions, setPendingQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>(['', '', '']);
  
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
  const [recommendationAnswers, setRecommendationAnswers] = useState<Record<string, string>>({});

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
        const data = await readApiResponse(res);
        if (data.success && data.tracking) {
          setTrackingData((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              openedAt: data.tracking.firstOpenedAt || prev.openedAt,
              opensCount: data.tracking.opensCount || prev.opensCount,
              dwellSeconds: data.tracking.dwellSeconds || prev.dwellSeconds,
              maxScrollDepth: data.tracking.maxScrollDepth ?? prev.maxScrollDepth,
              linkClicks: data.tracking.linkClicks ?? prev.linkClicks,
              heatmap: data.tracking.heatmap || prev.heatmap,
              recommendations: data.tracking.recommendations || prev.recommendations,
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

    if (file.size > 15 * 1024 * 1024) {
      alert('Файл слишком большой. Максимальный размер — 15 МБ.');
      e.target.value = '';
      return;
    }

    const sizeKb = Math.round(file.size / 1024);
    const reader = new FileReader();
    const isTextFile = file.name.toLowerCase().endsWith('.txt');
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        alert('Не удалось прочитать файл.');
        return;
      }
      setUploadedFile({
        name: file.name,
        sizeKb: sizeKb || 1,
        ...(isTextFile ? { text: reader.result } : { base64: reader.result }),
      });
    };
    if (isTextFile) reader.readAsText(file);
    else reader.readAsDataURL(file);
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
          resumeText: inputResumeText || uploadedFile?.text || '',
          targetVacancy: targetVacancy.trim(),
        }),
      });

      const resData = await readApiResponse(res);
      const aiData = resData.data || {};

      const detectedName = aiData.candidateName || 'Кандидат';
      const role = aiData.detectedRole || 'Специализация не указана';
      const techList = aiData.detectedTech || [];
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
        text: `${aiData.greeting || 'Я изучил резюме.'}${String(resData.poweredBy || '').includes('Local') ? '\n\nСейчас ИИ-модель недоступна, поэтому это предварительные локальные уточнения. Проверьте их перед ответом.' : ''}`,
        questionsData: questionsList,
        specificQuestions: specQuestions,
        detectedTech: techList,
        reviewSummary: typeof aiData.reviewSummary === 'string' ? aiData.reviewSummary : '',
        strengths: Array.isArray(aiData.strengths) ? aiData.strengths : [],
        candidateName: detectedName,
        detectedRole: role
      };

      setMessages((prev) => [...prev, aiMsg]);
      setCurrentStep('answering');
    } catch (e) {
      console.error('Analyze resume error:', e);
      setMessages((prev) => [...prev, {
        id: `ai-error-${Date.now()}`,
        sender: 'ai',
        text: `Не удалось проанализировать резюме: ${e instanceof Error ? e.message : 'неизвестная ошибка'}`,
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Submit Answers -> Generate Improved Resume
  const handleSubmitAnswers = async () => {
    if (pendingQuestions.length && !answers.some((answer) => answer.trim())) return;

    const userAnswersMsg: ChatMessage = {
      id: `usr-ans-${Date.now()}`,
      sender: 'user',
      text: answers.filter((answer) => answer.trim())
        .map((answer, index) => `Ответ по вопросу ${index + 1}: ${answer}`).join('\n\n'),
    };
    setMessages((prev) => [...prev, userAnswersMsg]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/simple/generate-improved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfBase64: uploadedFile?.base64,
          resumeText: inputResumeText || uploadedFile?.text || '',
          questions: pendingQuestions,
          specificQuestions: specificQuestions,
          answers,
          targetVacancy: targetVacancy.trim() || detectedRole,
        }),
      });

      const resData = await readApiResponse(res);
      const generated = resData.data;
      if (!generated) throw new Error('Сервер не вернул готовое резюме.');
      setImprovedResume(generated);

      const aiGeneratedMsg: ChatMessage = {
        id: `ai-gen-${Date.now()}`,
        sender: 'ai',
        type: 'improved_resume',
        text: `Готово, ${detectedCandidateName || 'коллега'}! Я подготовил полный HTML-макет резюме, сохранил подробности исходного текста и учёл ваши ответы. Проверьте каждый факт перед отправкой; неизвестные метрики не подставлялись.`,
        resumeData: generated,
      };

      setMessages((prev) => [...prev, aiGeneratedMsg]);
      setCurrentStep('generated');
      triggerConfetti();
    } catch (e) {
      console.error('Generate improved resume error:', e);
      setMessages((prev) => [...prev, {
        id: `ai-error-${Date.now()}`,
        sender: 'ai',
        text: `Не удалось улучшить резюме: ${e instanceof Error ? e.message : 'неизвестная ошибка'}`,
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Click "Make Apply" -> Generate Unique Tracking Link
  const handleCreateApplyLink = async () => {
    if (!improvedResume) {
      setMessages((prev) => [...prev, {
        id: `ai-error-${Date.now()}`,
        sender: 'ai',
        text: 'Сначала сформируйте резюме на основе исходного файла и ваших ответов.',
      }]);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/simple/create-apply-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          improvedResume,
          candidateName: detectedCandidateName || improvedResume.fullName,
        }),
      });

      const data = await readApiResponse(res);
      if (!data.linkId) throw new Error('Сервер не вернул ссылку для отклика.');

      const localOrigin = window.location.origin;
      const shareUrl = data.shareUrl || `${localOrigin}/?r=${data.linkId}`;

      const now = new Date();
      const dateStr = now.toLocaleDateString('ru-RU');
      const timeStr = now.toLocaleTimeString('ru-RU');

      const trackingObj: TrackingData = {
        linkId: data.linkId,
        shareUrl: shareUrl,
        createdAt: `${dateStr} в ${timeStr}`,
        openedAt: undefined,
        dwellSeconds: 0,
        opensCount: 0,
        heatmap: [],
        recommendations: [],
      };

      setTrackingData(trackingObj);
      setShowTrackingMiniWindow(true);
      triggerConfetti();
    } catch (e) {
      console.error('Create apply link error:', e);
      setMessages((prev) => [...prev, {
        id: `ai-error-${Date.now()}`,
        sender: 'ai',
        text: `Не удалось создать ссылку: ${e instanceof Error ? e.message : 'неизвестная ошибка'}`,
      }]);
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

  const handleDownloadResumeHtml = () => {
    if (!improvedResume?.html) return;
    const url = URL.createObjectURL(new Blob([improvedResume.html], { type: 'text/html;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${improvedResume.fullName || 'resume'}.html`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleAcceptRecommendation = async (recommendationId: string) => {
    if (!trackingData?.linkId) return;
    setIsRefreshingTracking(true);
    try {
      const response = await fetch(`/api/simple/recommendations/${trackingData.linkId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recommendationId,
          text: recommendationAnswers[recommendationId] || '',
        }),
      });
      const result = await readApiResponse(response);
      setImprovedResume(result.resume);
      setMessages((prev) => prev.map((message) => message.type === 'improved_resume'
        ? { ...message, resumeData: result.resume }
        : message));
      setTrackingData((prev) => prev ? {
        ...prev,
        recommendations: prev.recommendations?.filter((item) => item.id !== recommendationId),
      } : prev);
    } catch (error) {
      console.error('Accept resume recommendation error:', error);
      setMessages((prev) => [...prev, {
        id: `ai-error-${Date.now()}`,
        sender: 'ai',
        text: `Не удалось обновить резюме: ${error instanceof Error ? error.message : 'неизвестная ошибка'}`,
      }]);
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

                  {(msg.reviewSummary || msg.strengths?.length) && (
                    <div className="space-y-2 rounded-xl border border-blue-100 bg-blue-50/60 p-3">
                      {msg.reviewSummary && <p className="text-xs leading-relaxed text-slate-700">{msg.reviewSummary}</p>}
                      {msg.strengths?.length ? (
                        <ul className="space-y-1 text-xs text-slate-700">
                          {msg.strengths.map((strength, index) => <li key={index}>✓ {strength}</li>)}
                        </ul>
                      ) : null}
                    </div>
                  )}

                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 pt-1">
                    <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                    <span>{pendingQuestions.length ? 'Уточнения по пунктам, которым не хватает деталей:' : 'В резюме не нашлось пробелов, требующих уточнений.'}</span>
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
                                  Фрагмент или контекст из вашего резюме:
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

                        </div>
                      </div>
                    );
                  })}

                  {!pendingQuestions.length && (
                    <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-900">
                      Опыт выглядит достаточно полным. Можно сразу перейти к оформлению HTML-резюме.
                    </p>
                  )}

                  <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                    <button
                      onClick={handleSubmitAnswers}
                      disabled={isLoading || (pendingQuestions.length > 0 && !answers.some((a) => a.trim()))}
                      className="w-full sm:flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{pendingQuestions.length ? 'Собрать резюме с учетом ответов' : 'Сразу оформить HTML-резюме'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Final Improved Resume Card inside Chat */}
              {msg.type === 'improved_resume' && msg.resumeData && (
                <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
                  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                    {!msg.resumeData.html && <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        {msg.resumeData.photo && (
                          <img src={msg.resumeData.photo} alt="Фото из исходного резюме" className="mb-3 h-16 w-16 rounded-xl object-cover border border-slate-200" />
                        )}
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-lg text-slate-900">
                            {msg.resumeData.fullName || 'Имя не найдено в исходном резюме'}
                          </h3>
                        </div>
                        <p className="text-xs font-bold text-blue-600 mt-0.5">
                          {msg.resumeData.title || 'Специализация не указана'}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          📍 {msg.resumeData.location}
                        </p>
                      </div>

                      {/* Contacts */}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {msg.resumeData.contacts?.telegram && (
                          <a href={`https://t.me/${msg.resumeData.contacts.telegram.replace('@', '')}`} target="_blank" rel="noreferrer" className="text-blue-700 underline">
                            {msg.resumeData.contacts.telegram}
                          </a>
                        )}
                        {msg.resumeData.contacts?.email && (
                          <a href={`mailto:${msg.resumeData.contacts.email}`} className="text-blue-700 underline">
                            {msg.resumeData.contacts.email}
                          </a>
                        )}
                        {msg.resumeData.contacts?.phone && (
                          <a href={`tel:${msg.resumeData.contacts.phone.replace(/[^\d+]/g, '')}`} className="text-blue-700 underline">
                            {msg.resumeData.contacts.phone}
                          </a>
                        )}
                        {msg.resumeData.links?.map((link: { url: string; label: string }, index: number) => (
                          <a key={`${link.url}-${index}`} href={link.url} target="_blank" rel="noreferrer" className="text-blue-700 underline">
                            {link.label}
                          </a>
                        ))}
                      </div>
                    </div>}

                    {!msg.resumeData.html && <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
                      <span className="font-bold text-slate-900 block mb-0.5">
                        🎯 Позиционирование:
                      </span>
                      {msg.resumeData.summary}
                    </div>}

                    {msg.resumeData.html ? (
                      <section className="space-y-2 border-t border-slate-200 pt-4">
                        <div>
                          <h4 className="text-sm font-extrabold text-slate-900">Полное HTML-резюме</h4>
                          <p className="text-[11px] text-slate-500">
                            Это готовый макет целого резюме. Проверьте содержание и оформление перед отправкой.
                          </p>
                        </div>
                        <iframe
                          title="Предпросмотр полного HTML-резюме"
                          srcDoc={msg.resumeData.html}
                          sandbox="allow-popups allow-popups-to-escape-sandbox"
                          referrerPolicy="no-referrer"
                          className="w-full rounded-xl border border-slate-200 bg-slate-100"
                          style={{ height: `${Math.min(18000, Math.max(1400, Math.ceil((msg.resumeData.fullResumeText?.length || 0) / 42) * 32 + 800))}px` }}
                        />
                      </section>
                    ) : msg.resumeData.fullResumeText && (
                      <section className="space-y-2 border-t border-slate-200 pt-4">
                        <div>
                          <h4 className="text-sm font-extrabold text-slate-900">Полная версия резюме</h4>
                          <p className="text-[11px] text-slate-500">
                            Исходные разделы и детали сохранены; ответы добавлены к полной версии.
                          </p>
                        </div>
                        <div className="max-h-[36rem] overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 text-xs leading-6 text-slate-800 whitespace-pre-wrap break-words">
                          {msg.resumeData.fullResumeText}
                        </div>
                      </section>
                    )}

                    {/* Metric Badges */}
                    {!msg.resumeData.html && msg.resumeData.metrics && (
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
                    {!msg.resumeData.fullResumeText && <div className="space-y-2 text-xs text-slate-800">
                      <span className="font-bold text-slate-900 block text-xs">
                        🏆 Ключевые достижения (STAR):
                      </span>
                      {msg.resumeData.starBullets?.map((b: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                          <span className="leading-relaxed">{b}</span>
                        </div>
                      ))}
                    </div>}

                    {/* Tech stack */}
                    {!msg.resumeData.fullResumeText && <div className="pt-2 border-t border-slate-100">
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
                    </div>}
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

                    <div className="flex w-full flex-col gap-2 sm:w-auto">
                      <button
                        type="button"
                        onClick={handleDownloadResumeHtml}
                        className="w-full px-4 py-2.5 rounded-xl bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>Скачать HTML</span>
                      </button>
                      <button
                        onClick={handleCreateApplyLink}
                        className="w-full px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition whitespace-nowrap cursor-pointer"
                      >
                        <span>Создать ссылку резюме</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
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
              <span>Читаю резюме и готовлю вопросы по вашему опыту...</span>
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
              <span className="text-slate-500">Глубина просмотра:</span>
              <span className="text-slate-700 font-medium">
                {trackingData.maxScrollDepth ?? 0}%
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Время чтения (Dwell time):</span>
              <span className="font-bold text-blue-600">
                {trackingData.dwellSeconds ? `${trackingData.dwellSeconds} сек` : 'Пока нет данных'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Переходы по ссылкам:</span>
              <span className="font-bold text-slate-800">{trackingData.linkClicks || 0}</span>
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
              {trackingData.heatmap?.length ? trackingData.heatmap.map((item, idx) => (
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
              )) : <p className="text-xs text-slate-500">Тепловая карта появится после просмотра резюме.</p>}
            </div>
          </div>

          {(trackingData.recommendations?.length || 0) > 0 && (
            <section className="space-y-3 border-t border-slate-100 pt-4">
              <h5 className="text-xs font-bold text-slate-800">Рекомендации по улучшению</h5>
              {trackingData.recommendations?.map((recommendation) => (
                <div key={recommendation.id} className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs font-bold text-slate-800">{recommendation.title}</p>
                  <p className="text-[11px] leading-relaxed text-slate-600">{recommendation.reason}</p>
                  <p className="text-[11px] text-slate-700">{recommendation.prompt}</p>
                  {recommendation.id === 'add-result-0' && (
                    <textarea
                      value={recommendationAnswers[recommendation.id] || ''}
                      onChange={(event) => setRecommendationAnswers((prev) => ({
                        ...prev,
                        [recommendation.id]: event.target.value,
                      }))}
                      placeholder="Добавьте только результат, который можете подтвердить"
                      className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900"
                    />
                  )}
                  <button
                    type="button"
                    disabled={isRefreshingTracking || (recommendation.id === 'add-result-0' && !recommendationAnswers[recommendation.id]?.trim())}
                    onClick={() => handleAcceptRecommendation(recommendation.id)}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    Добавить результат в резюме
                  </button>
                </div>
              ))}
            </section>
          )}
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
                    {uploadedFile ? uploadedFile.name : 'Загрузите свое резюме'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {uploadedFile 
                      ? `${uploadedFile.sizeKb} KB • Готово к анализу` 
                      : 'PDF с текстом и фотографией, TXT или текст резюме'}
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
                  <span>{uploadedFile ? 'Заменить файл' : 'Выбрать файл'}</span>
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
                placeholder={uploadedFile ? "Добавьте недостающие факты из резюме..." : "Или вставьте текст резюме сюда..."}
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
            <input
              type="text"
              value={targetVacancy}
              onChange={(event) => setTargetVacancy(event.target.value)}
              placeholder="Целевая вакансия (необязательно)"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      )}
    </div>
  );
};
