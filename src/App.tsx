import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  FileCheck2,
  FileText,
  Link2,
  LoaderCircle,
  LockKeyhole,
  MessageCircle,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
  Users,
  X,
} from 'lucide-react';

type Decision = 'advance' | 'reject';
type Vacancy = {
  id: string;
  title: string;
  companyName: string;
  description: string;
  requiredCriteria: string[];
  preferredCriteria: string[];
  createdAt: string;
};
type Criterion = {
  criterion: string;
  status: 'confirmed' | 'needs_clarification' | 'not_confirmed';
  evidence: string;
};
type ApplicationResult = {
  id: string;
  decision: Decision;
  explanation: string;
  evidence: Criterion[];
};
type Application = ApplicationResult & {
  vacancyId: string;
  candidateName: string;
  email: string;
  questions: string[];
  answers: string[];
  submittedAt: string;
  durationSeconds: number;
};
type ResumeAnalysis = {
  candidateName: string;
  candidateRole: string;
  summary: string;
  criteria: Criterion[];
  questions: string[];
  resumeText: string;
};
type ResumeFile = { name: string; base64?: string; text?: string };
type View = 'hr' | 'candidate';
type Step = 'application' | 'questions' | 'result';

const demoVacancyId = 'senior-product-designer';
const demoApplications: Application[] = [
  {
    id: 'demo-1', vacancyId: demoVacancyId, candidateName: 'Александр Морозов', email: 'alex@example.com',
    questions: ['Расскажите о полном цикле работы над цифровым продуктом.'],
    answers: ['Вёл редизайн приложения от интервью с пользователями до запуска.'],
    decision: 'advance', explanation: 'В резюме и ответах подтверждены обязательные требования. Можно продолжить отбор.',
    evidence: [
      { criterion: 'От 5 лет опыта в продуктовом дизайне', status: 'confirmed', evidence: 'В резюме указано 6 лет опыта.' },
      { criterion: 'Опыт пользовательских исследований', status: 'confirmed', evidence: 'Упомянуты интервью с пользователями.' },
      { criterion: 'Полный цикл работы над цифровым продуктом', status: 'confirmed', evidence: 'Кандидат описал путь от интервью до запуска.' },
    ],
    submittedAt: '2026-05-18T10:42:00.000Z', durationSeconds: 246,
  },
  {
    id: 'demo-2', vacancyId: demoVacancyId, candidateName: 'Мария Кузнецова', email: 'maria@example.com',
    questions: ['Расскажите о вашем опыте пользовательских исследований.'],
    answers: ['Работала с аналитикой и прототипами, но сама интервью не проводила.'],
    decision: 'reject', explanation: 'В этой вакансии обязательны пользовательские исследования. В ответе вы указали, что пока не проводили их самостоятельно, поэтому мы не можем предложить следующий этап.',
    evidence: [
      { criterion: 'От 5 лет опыта в продуктовом дизайне', status: 'confirmed', evidence: 'В резюме указано 8 лет опыта.' },
      { criterion: 'Опыт пользовательских исследований', status: 'not_confirmed', evidence: 'Кандидат сообщил, что не проводил интервью самостоятельно.' },
      { criterion: 'Полный цикл работы над цифровым продуктом', status: 'confirmed', evidence: 'В резюме указаны запуски продуктов.' },
    ],
    submittedAt: '2026-05-17T17:20:00.000Z', durationSeconds: 312,
  },
];

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch {
    throw new Error('Не удалось связаться с сервером. Проверьте соединение и попробуйте ещё раз.');
  }
  let body: Record<string, unknown>;
  try {
    body = await response.json() as Record<string, unknown>;
  } catch {
    throw new Error('Сервер вернул некорректный ответ. Попробуйте ещё раз.');
  }
  if (!response.ok || body.success === false) {
    throw new Error(typeof body.error === 'string' ? body.error : `Ошибка сервера (${response.status}).`);
  }
  return body as T;
}

function Logo({ small = false }: { small?: boolean }) {
  return <a className={`brand ${small ? 'brand-small' : ''}`} href="?view=hr" aria-label="Люди — к вакансиям"><span className="brand-symbol"><i /><i /><i /><i /></span><span>люди<span className="brand-dot">.</span></span></a>;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string'
      ? resolve(reader.result)
      : reject(new Error('Не удалось прочитать файл.'));
    reader.onerror = () => reject(new Error('Не удалось прочитать файл.'));
    reader.readAsDataURL(file);
  });
}

function App() {
  const [view, setView] = useState<View>(() => new URLSearchParams(window.location.search).get('view') === 'candidate' ? 'candidate' : 'hr');
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [selectedVacancyId, setSelectedVacancyId] = useState(() => new URLSearchParams(window.location.search).get('vacancy') || demoVacancyId);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showVacancyForm, setShowVacancyForm] = useState(false);
  const [isSavingVacancy, setIsSavingVacancy] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [vacancyTitle, setVacancyTitle] = useState('');
  const [companyName, setCompanyName] = useState('Northstar');
  const [vacancyDescription, setVacancyDescription] = useState('');
  const [requiredText, setRequiredText] = useState('');
  const [preferredText, setPreferredText] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [resumeTextInput, setResumeTextInput] = useState('');
  const [resumeFile, setResumeFile] = useState<ResumeFile | null>(null);
  const [consent, setConsent] = useState(false);
  const [step, setStep] = useState<Step>('application');
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [result, setResult] = useState<ApplicationResult | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [startedAt, setStartedAt] = useState(Date.now());

  const vacancy = useMemo(
    () => vacancies.find((item) => item.id === selectedVacancyId) ?? (view === 'candidate' ? undefined : vacancies[0]),
    [selectedVacancyId, vacancies, view],
  );
  const visibleApplications = useMemo(() => {
    const submitted = applications.filter((item) => item.vacancyId === selectedVacancyId);
    if (submitted.length || selectedVacancyId !== demoVacancyId) return submitted;
    return demoApplications;
  }, [applications, selectedVacancyId]);
  const decisions = useMemo(() => ({
    advanced: visibleApplications.filter((item) => item.decision === 'advance').length,
    rejected: visibleApplications.filter((item) => item.decision === 'reject').length,
    averageSeconds: visibleApplications.length
      ? Math.round(visibleApplications.reduce((total, item) => total + item.durationSeconds, 0) / visibleApplications.length)
      : 0,
  }), [visibleApplications]);

  const loadVacancies = useCallback(async () => {
    const response = await requestJson<{ vacancies: Vacancy[] }>('/api/hiring/vacancies');
    setVacancies(response.vacancies);
  }, []);

  const loadApplications = useCallback(async (vacancyId: string) => {
    const response = await requestJson<{ applications: Application[] }>(`/api/hiring/applications/${encodeURIComponent(vacancyId)}`);
    setApplications(response.applications);
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        await loadVacancies();
        if (active) setError('');
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить вакансии.');
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [loadVacancies]);

  useEffect(() => {
    if (view === 'candidate' || !selectedVacancyId) return;
    let active = true;
    const refresh = async () => {
      try {
        await loadApplications(selectedVacancyId);
        if (active) setError('');
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить отклики.');
      }
    };
    void refresh();
    const timer = window.setInterval(() => { void refresh(); }, 12000);
    return () => { active = false; window.clearInterval(timer); };
  }, [loadApplications, selectedVacancyId, view]);

  useEffect(() => {
    const onPopState = () => {
      const params = new URLSearchParams(window.location.search);
      setView(params.get('view') === 'candidate' ? 'candidate' : 'hr');
      setSelectedVacancyId(params.get('vacancy') || demoVacancyId);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = (nextView: View, vacancyId = selectedVacancyId) => {
    const url = new URL(window.location.href);
    url.searchParams.set('view', nextView);
    url.searchParams.set('vacancy', vacancyId);
    window.history.pushState({}, '', url);
    setView(nextView);
    setSelectedVacancyId(vacancyId);
    setError('');
    setNotice('');
  };

  const setFlash = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 3500);
  };

  const makeShareUrl = (vacancyId: string) => {
    const url = new URL(window.location.href);
    url.search = '';
    url.searchParams.set('view', 'candidate');
    url.searchParams.set('vacancy', vacancyId);
    url.hash = '';
    return url.toString();
  };

  const shareVacancy = async (vacancyId: string) => {
    const url = makeShareUrl(vacancyId);
    setShareUrl(url);
    try {
      await navigator.clipboard.writeText(url);
      setFlash('Ссылка на вакансию скопирована');
    } catch {
      setFlash('Скопируйте ссылку в поле ниже');
    }
  };

  const createVacancy = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    const requiredCriteria = requiredText.split('\n').map((item) => item.trim()).filter(Boolean);
    const preferredCriteria = preferredText.split('\n').map((item) => item.trim()).filter(Boolean);
    if (!vacancyDescription.trim()) {
      setError('Добавьте описание вакансии — оно поможет точнее подобрать вопросы.');
      return;
    }
    setIsSavingVacancy(true);
    try {
      const response = await requestJson<{ vacancy: Vacancy }>('/api/hiring/vacancies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: vacancyTitle, companyName, description: vacancyDescription, requiredCriteria, preferredCriteria }),
      });
      setVacancies((current) => [...current, response.vacancy]);
      setSelectedVacancyId(response.vacancy.id);
      setShowVacancyForm(false);
      setVacancyTitle('');
      setVacancyDescription('');
      setRequiredText('');
      setPreferredText('');
      setShareUrl(makeShareUrl(response.vacancy.id));
      setFlash('Вакансия опубликована. Ссылка для соискателей готова.');
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Не удалось создать вакансию.');
    } finally {
      setIsSavingVacancy(false);
    }
  };

  const chooseResume = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      setError('Файл слишком большой. Максимальный размер — 15 МБ.');
      return;
    }
    const extension = file.name.toLocaleLowerCase('ru').split('.').pop();
    if (extension !== 'pdf' && extension !== 'txt') {
      setError('Загрузите резюме в PDF или TXT. Также можно вставить его текст ниже.');
      return;
    }
    setError('');
    try {
      if (extension === 'txt') {
        const text = await file.text();
        setResumeFile({ name: file.name, text });
        setResumeTextInput(text);
      } else {
        setResumeFile({ name: file.name, base64: await readFileAsDataUrl(file) });
      }
    } catch (fileError) {
      setError(fileError instanceof Error ? fileError.message : 'Не удалось прочитать файл.');
    }
  };

  const analyzeResume = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!vacancy || (!resumeFile && !resumeTextInput.trim())) {
      setError('Загрузите резюме или вставьте его текст.');
      return;
    }
    if (!consent) {
      setError('Подтвердите, что HR сможет ознакомиться с вашими ответами.');
      return;
    }
    setError('');
    setIsAnalyzing(true);
    try {
      const response = await requestJson<{ analysis: ResumeAnalysis; resumeText: string }>('/api/hiring/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vacancyId: vacancy.id,
          resumeText: resumeTextInput,
          pdfBase64: resumeFile?.base64,
        }),
      });
      const nextAnalysis = { ...response.analysis, resumeText: response.resumeText };
      setAnalysis(nextAnalysis);
      setAnswers(nextAnalysis.questions.map(() => ''));
      setQuestionIndex(0);
      setCandidateName((current) => current.trim() || nextAnalysis.candidateName);
      setStep('questions');
    } catch (analysisError) {
      setError(analysisError instanceof Error ? analysisError.message : 'Не удалось разобрать резюме.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const submitAnswers = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!vacancy || !analysis) return;
    if (!candidateName.trim() || !candidateEmail.trim()) {
      setError('Укажите имя и почту, чтобы получить результат отбора.');
      return;
    }
    if (analysis.questions.length > 0 && !answers[questionIndex]?.trim()) {
      setError('Ответьте на этот вопрос. Если опыта нет, так и напишите — это поможет принять точное решение.');
      return;
    }
    setError('');
    if (questionIndex < analysis.questions.length - 1) {
      setQuestionIndex((index) => index + 1);
      return;
    }
    if (analysis.questions.some((question, index) => !answers[index]?.trim())) {
      setError('Ответьте на оставшиеся уточняющие вопросы, чтобы получить точное решение.');
      return;
    }
    if (demoMode) {
      let answerIndex = 0;
      const evidence = analysis.criteria.map((criterion) => {
        if (criterion.status === 'confirmed') {
          return { ...criterion, status: 'confirmed' as const };
        }
        const answer = answers[answerIndex] || 'Опыт описан в ответе кандидата.';
        answerIndex += 1;
        return {
          criterion: criterion.criterion,
          status: 'confirmed' as const,
          evidence: `Ответ в демонстрационном сценарии: «${answer.trim()}»`,
        };
      });
      setResult({
        id: 'demo-candidate-preview',
        decision: 'advance',
        explanation: 'В этом демонстрационном сценарии опыт из резюме и ответов подтверждает обязательные требования вакансии. Результат показывает, как соискатель увидит следующий шаг.',
        evidence,
      });
      setStep('result');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await requestJson<{ result: ApplicationResult }>('/api/hiring/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vacancyId: vacancy.id,
          candidateName,
          email: candidateEmail,
          resumeText: analysis.resumeText,
          questions: analysis.questions,
          answers,
          startedAt,
        }),
      });
      setResult(response.result);
      setStep('result');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Не удалось обработать ответы.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startOver = () => {
    setCandidateName('');
    setCandidateEmail('');
    setResumeTextInput('');
    setResumeFile(null);
    setConsent(false);
    setAnalysis(null);
    setAnswers([]);
    setQuestionIndex(0);
    setResult(null);
    setDemoMode(false);
    setError('');
    setStep('application');
    setStartedAt(Date.now());
  };

  if (view === 'candidate') {
    return <CandidateExperience
      vacancy={vacancy}
      isLoading={isLoading}
      error={error}
      step={step}
      analysis={analysis}
      result={result}
      demoMode={demoMode}
      answers={answers}
      questionIndex={questionIndex}
      onQuestionIndex={setQuestionIndex}
      candidateName={candidateName}
      candidateEmail={candidateEmail}
      resumeTextInput={resumeTextInput}
      resumeFile={resumeFile}
      consent={consent}
      isAnalyzing={isAnalyzing}
      isSubmitting={isSubmitting}
      onName={setCandidateName}
      onEmail={setCandidateEmail}
      onResumeText={setResumeTextInput}
      onRemoveResume={() => { setResumeFile(null); setResumeTextInput(''); }}
      onChooseResume={chooseResume}
      onConsent={setConsent}
      onAnalyze={analyzeResume}
      onDemo={() => {
        setDemoMode(true);
        setCandidateName('Алексей Петров');
        setCandidateEmail('alexey@example.test');
        setResumeFile({ name: 'Резюме — демонстрационный пример.txt' });
        setResumeTextInput('Product Designer, 6 лет опыта. Проектировал мобильные интерфейсы и сценарии оплаты. Работал с продуктовыми командами. Ищу роль, где смогу отвечать за развитие продукта.');
        setAnalysis({
          candidateName: 'Алексей Петров',
          candidateRole: 'Product Designer',
          summary: 'В демонстрационном резюме подтверждён стаж. Исследования и полный цикл проекта описаны недостаточно подробно — спросим об этом перед решением.',
          criteria: vacancy?.requiredCriteria.map((criterion, index) => ({
            criterion,
            status: index === 0 ? 'confirmed' : 'needs_clarification',
            evidence: index === 0 ? 'В демонстрационном резюме указано 6 лет опыта.' : '',
          })) ?? [],
          questions: [
            'Расскажите о вашем опыте пользовательских исследований. Как вы проверяли задачи и решения с пользователями?',
            'Расскажите о проекте, который вы вели от первоначальной задачи до запуска. Какова была ваша личная роль?',
          ],
          resumeText: 'Product Designer, 6 лет опыта. Проектировал мобильные интерфейсы и сценарии оплаты. Работал с продуктовыми командами. Ищу роль, где смогу отвечать за развитие продукта.',
        });
        setAnswers(['Проводил интервью с пользователями и тестировал прототипы до разработки.', 'Самостоятельно вёл редизайн оплаты — от исследований до запуска вместе с командой разработки.']);
        setQuestionIndex(0);
        setStartedAt(Date.now());
        setStep('questions');
        setError('');
      }}
      onAnswers={setAnswers}
      onSubmit={submitAnswers}
      onStartOver={startOver}
      onBack={() => navigate('hr')}
    />;
  }

  return <HrWorkspace
    vacancies={vacancies}
    vacancy={vacancy}
    applications={visibleApplications}
    decisions={decisions}
    selectedVacancyId={selectedVacancyId}
    error={error}
    notice={notice}
    shareUrl={shareUrl}
    isLoading={isLoading}
    isCreatingVacancy={showVacancyForm}
    isSavingVacancy={isSavingVacancy}
    vacancyTitle={vacancyTitle}
    companyName={companyName}
    vacancyDescription={vacancyDescription}
    requiredText={requiredText}
    preferredText={preferredText}
    onSelectVacancy={(id) => { setSelectedVacancyId(id); setShareUrl(''); }}
    onCandidatePreview={() => navigate('candidate')}
    onCreateOpen={() => { setShowVacancyForm(true); setError(''); }}
    onCreateClose={() => { setShowVacancyForm(false); setError(''); }}
    onTitle={setVacancyTitle}
    onCompany={setCompanyName}
    onDescription={setVacancyDescription}
    onRequired={setRequiredText}
    onPreferred={setPreferredText}
    onCreate={createVacancy}
    onShare={shareVacancy}
    onClearShare={() => setShareUrl('')}
    onClearNotice={() => setNotice('')}
  />;
}

function HrWorkspace(props: {
  vacancies: Vacancy[];
  vacancy?: Vacancy;
  applications: Application[];
  decisions: { advanced: number; rejected: number; averageSeconds: number };
  selectedVacancyId: string;
  error: string;
  notice: string;
  shareUrl: string;
  isLoading: boolean;
  isCreatingVacancy: boolean;
  isSavingVacancy: boolean;
  vacancyTitle: string;
  companyName: string;
  vacancyDescription: string;
  requiredText: string;
  preferredText: string;
  onSelectVacancy: (id: string) => void;
  onCandidatePreview: () => void;
  onCreateOpen: () => void;
  onCreateClose: () => void;
  onTitle: (value: string) => void;
  onCompany: (value: string) => void;
  onDescription: (value: string) => void;
  onRequired: (value: string) => void;
  onPreferred: (value: string) => void;
  onCreate: (event: FormEvent<HTMLFormElement>) => void;
  onShare: (vacancyId: string) => void;
  onClearShare: () => void;
  onClearNotice: () => void;
}) {
  const selectedApplications = props.applications;
  const [expandedId, setExpandedId] = useState<string | null>(null);
  return <div className="hr-shell">
    <aside className="hr-sidebar">
      <Logo />
      <div className="workspace-switch"><span className="workspace-avatar">{props.vacancy?.companyName.slice(0, 1) || 'N'}</span><div><strong>{props.vacancy?.companyName || 'Команда'}</strong><span>Кабинет работодателя</span></div><ChevronDown size={15} /></div>
      <span className="nav-caption">РАБОТА С КАНДИДАТАМИ</span>
      <button className="hr-nav active"><BriefcaseBusiness size={17} />Вакансии<span className="nav-count">{props.vacancies.length}</span></button>
      <div className="sidebar-vacancies"><span className="nav-caption">ВАШИ ВАКАНСИИ</span>{props.vacancies.map((item) => <button key={item.id} className={`sidebar-vacancy ${item.id === props.selectedVacancyId ? 'selected' : ''}`} onClick={() => props.onSelectVacancy(item.id)}><i /><span>{item.title}</span></button>)}</div>
      <div className="sidebar-bottom"><div className="privacy-box"><ShieldCheck size={16} /><p><strong>Опыт важнее резюме</strong><span>Кандидат может дополнить факты, прежде чем ИИ сопоставит их с вакансией.</span></p></div><div className="hr-profile"><span>АК</span><div><strong>Анна Ковалёва</strong><small>Демо-аккаунт</small></div></div></div>
    </aside>

    <main className="hr-main">
      <header className="hr-topbar"><div className="breadcrumbs"><span>Рабочее пространство</span><i>/</i><strong>Вакансии</strong></div><div className="top-actions"><span className="demo-indicator"><i /> ДЕМО-ПРОЕКТ</span><button className="button button-outline top-candidate" onClick={props.onCandidatePreview}><Users size={15} /> Предпросмотр для соискателя <ArrowUpRight size={13} /></button></div></header>
      <div className="hr-page">
        <section className="hr-welcome"><div><div className="eyebrow"><span /> КАБИНЕТ РАБОТОДАТЕЛЯ</div><h1>Вакансии<span>.</span></h1><p>Сначала выясняем факты — только потом принимаем решение.</p></div><button className="button button-primary new-vacancy" onClick={props.onCreateOpen}><Plus size={16} /> Новая вакансия</button></section>
        {props.error && <div className="inline-alert" role="alert"><CircleHelp size={15} />{props.error}</div>}
        {props.vacancy && <>
          <section className="vacancy-title-card">
            <div className="vacancy-icon"><BriefcaseBusiness size={19} /></div>
            <div className="vacancy-overview"><div className="vacancy-status"><i /> ОТКРЫТАЯ ВАКАНСИЯ <span>·</span> ДЕМО-ПРИМЕР</div><h2>{props.vacancy.title}</h2><p>{props.vacancy.companyName} <span>·</span> {props.vacancy.description || 'По ссылке соискатели загрузят резюме и ответят на уточняющие вопросы.'}</p></div>
            <button className="button button-outline share-button" onClick={() => props.onShare(props.vacancy!.id)}><Link2 size={15} /> Ссылка для соискателя</button>
          </section>
          <section className="metric-grid">
            <article className="hr-metric metric-green"><span>Всего откликов</span><strong>{selectedApplications.length}</strong><small><Users size={12} /> Вакансия · {props.vacancies.length} {props.vacancies.length === 1 ? 'позиция' : 'позиций'}</small><div className="metric-decoration"><Users size={37} /></div></article>
            <article className="hr-metric"><span>Продолжили отбор</span><strong>{props.decisions.advanced}</strong><small><CheckCircle2 size={12} /> Обязательные требования подтверждены</small><div className="metric-decoration green-decoration"><ArrowUpRight size={37} /></div></article>
            <article className="hr-metric"><span>Получили объяснение</span><strong>{props.decisions.rejected}</strong><small><MessageCircle size={12} /> Конкретная причина по вакансии</small><div className="metric-decoration warm-decoration"><MessageCircle size={34} /></div></article>
            <article className="hr-metric"><span>Время первичного отбора</span><strong>{props.decisions.averageSeconds ? `${Math.floor(props.decisions.averageSeconds / 60)}:${String(props.decisions.averageSeconds % 60).padStart(2, '0')}` : '—'}<em>{props.decisions.averageSeconds ? ' мин' : ''}</em></strong><small><Clock3 size={12} /> От резюме до решения</small><div className="metric-decoration blue-decoration"><Clock3 size={34} /></div></article>
          </section>
          <section className="requirements-panel"><div className="requirements-heading"><div><span className="eyebrow-mini">КРИТЕРИИ ОТБОРА</span><h3>Что ищем в опыте кандидата</h3></div><span className="criteria-note"><ShieldCheck size={13} /> Отсутствие в резюме ≠ отсутствие опыта</span></div><div className="requirements-columns"><div><span className="criteria-label"><span className="required-dot" /> ОБЯЗАТЕЛЬНЫЕ</span><ul>{props.vacancy.requiredCriteria.map((criterion) => <li key={criterion}>{criterion}</li>)}</ul></div><div><span className="criteria-label"><span className="preferred-dot" /> БУДУТ ПЛЮСОМ</span><ul>{props.vacancy.preferredCriteria.length ? props.vacancy.preferredCriteria.map((criterion) => <li key={criterion}>{criterion}</li>) : <li className="muted-criterion">Не указаны</li>}</ul></div></div></section>
          <section className="applications-panel"><div className="applications-heading"><div><span className="eyebrow-mini">ПЕРВИЧНЫЙ ОТБОР</span><h3>Отклики <span>{selectedApplications.length}</span></h3><p>Сводка и ответы соискателей по обязательным критериям вакансии.</p></div><label className="applications-search"><Search size={15} /><input placeholder="Найти соискателя" onChange={(event) => {
            const query = event.target.value.toLocaleLowerCase('ru');
            document.querySelectorAll<HTMLElement>('.application-card[data-name]').forEach((card) => { card.hidden = !card.dataset.name?.includes(query); });
          }} /></label></div>
            {props.isLoading ? <div className="loading-line"><LoaderCircle size={17} />Загружаем отклики…</div> : selectedApplications.length ? <div className="application-list">{selectedApplications.map((application) => <article className="application-card" key={application.id} data-name={application.candidateName.toLocaleLowerCase('ru')}>
              <button className="application-summary" onClick={() => setExpandedId(expandedId === application.id ? null : application.id)} aria-expanded={expandedId === application.id}>
                <span className={`applicant-avatar ${application.decision === 'advance' ? 'avatar-green' : 'avatar-peach'}`}>{application.candidateName.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span>
                <span className="applicant-main"><strong>{application.candidateName}</strong><small>{application.id.startsWith('demo-') ? 'Демонстрационный пример' : application.email}</small></span>
                <span className="applicant-duration"><Clock3 size={13} /> {Math.floor(application.durationSeconds / 60)} мин {application.durationSeconds % 60} сек</span>
                <span className={`decision-badge ${application.decision === 'advance' ? 'decision-advance' : 'decision-reject'}`}><i />{application.decision === 'advance' ? 'Продолжить отбор' : 'Отказ с объяснением'}</span>
                <ChevronDown className={expandedId === application.id ? 'chevron-open' : ''} size={16} />
              </button>
              {expandedId === application.id && <div className="application-details"><div className="candidate-feedback"><span><Sparkles size={13} /> ОБЪЯСНЕНИЕ ДЛЯ СОИСКАТЕЛЯ</span><p>{application.explanation}</p></div><div className="evidence-list"><h4>Подтверждение требований</h4>{application.evidence.map((item) => <div className="evidence-item" key={item.criterion}><i className={item.status === 'confirmed' ? 'evidence-yes' : 'evidence-no'}>{item.status === 'confirmed' ? <Check size={10} /> : <X size={10} />}</i><span><strong>{item.criterion}</strong><small>{item.evidence}</small></span></div>)}</div>{application.questions.length > 0 && <div className="answer-list"><h4>Ответы соискателя</h4>{application.questions.map((question, index) => <div key={`${question}-${index}`}><span>{question}</span><p>{application.answers[index] || 'Ответ не указан'}</p></div>)}</div>}</div>}
            </article>)}</div> : <div className="empty-applications"><div><FileCheck2 size={21} /></div><h3>Пока нет откликов на эту вакансию</h3><p>Поделитесь ссылкой. Соискатель загрузит резюме, ответит на вопросы и сразу получит объяснение решения.</p><button className="button button-primary" onClick={() => props.onShare(props.vacancy!.id)}><Link2 size={14} /> Скопировать ссылку на вакансию</button></div>}
          </section>
        </>}
        {!props.vacancy && !props.isLoading && <div className="empty-vacancies"><BriefcaseBusiness size={26} /><h2>Пока нет вакансий</h2><p>Создайте вакансию, укажите обязательные требования и поделитесь ссылкой с кандидатами.</p><button className="button button-primary" onClick={props.onCreateOpen}><Plus size={15} /> Создать вакансию</button></div>}
        <footer className="hr-footer"><span>Люди AI <i /> сопоставляет опыт с обязательными требованиями и объясняет решение.</span><span>Демо · Без авторизации · Не загружайте реальные резюме</span></footer>
      </div>
      {props.isCreatingVacancy && <div className="overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) props.onCreateClose(); }}><form className="dialog vacancy-dialog" onSubmit={props.onCreate}><button type="button" className="dialog-close" aria-label="Закрыть" onClick={props.onCreateClose}><X size={18} /></button><div className="dialog-icon"><BriefcaseBusiness size={19} /></div><span className="eyebrow-mini">НОВАЯ ВАКАНСИЯ</span><h2>Кого вы ищете?</h2><p className="dialog-description">Опишите роль и укажите, какие подтверждённые навыки действительно обязательны.</p><label>Название вакансии<input required maxLength={120} value={props.vacancyTitle} onChange={(event) => props.onTitle(event.target.value)} placeholder="Например, Product Designer" /></label><label>Компания<input maxLength={120} value={props.companyName} onChange={(event) => props.onCompany(event.target.value)} placeholder="Название компании" /></label><label>Описание вакансии<textarea required rows={3} value={props.vacancyDescription} onChange={(event) => props.onDescription(event.target.value)} placeholder="Задачи, команда и контекст роли" /></label><div className="criteria-inputs"><label>Обязательные требования<textarea required rows={3} value={props.requiredText} onChange={(event) => props.onRequired(event.target.value)} placeholder={'Каждое требование — с новой строки'} /><small>ИИ задаст вопрос, если опыт неясен в резюме.</small></label><label>Будет плюсом<textarea rows={3} value={props.preferredText} onChange={(event) => props.onPreferred(event.target.value)} placeholder={'Каждое требование — с новой строки'} /><small>Эти пункты не могут стать причиной отказа.</small></label></div>{props.error && <div className="form-alert">{props.error}</div>}<div className="dialog-actions"><button type="button" className="button button-outline" onClick={props.onCreateClose}>Отмена</button><button type="submit" className="button button-primary" disabled={props.isSavingVacancy}>{props.isSavingVacancy ? <LoaderCircle className="spin" size={14} /> : <Plus size={15} />} Создать вакансию</button></div></form></div>}
      {props.shareUrl && <div className="share-popover"><div><CheckCircle2 size={17} /><strong>Ссылка готова к отправке</strong><button aria-label="Закрыть" onClick={() => { props.onClearShare(); props.onClearNotice(); }}><X size={15} /></button></div><p>По ссылке кандидат попадёт сразу на страницу этой вакансии.</p><input readOnly value={props.shareUrl} onFocus={(event) => event.target.select()} /><button className="copy-link" onClick={() => void props.onShare(props.vacancy?.id || demoVacancyId)}>Скопировать ссылку <ArrowRight size={13} /></button></div>}
      {props.notice && <div className="toast" role="status"><CheckCircle2 size={16} />{props.notice}<button onClick={props.onClearNotice} aria-label="Закрыть уведомление"><X size={14} /></button></div>}
    </main>
  </div>;
}

function CandidateExperience(props: {
  vacancy?: Vacancy;
  isLoading: boolean;
  error: string;
  step: Step;
  analysis: ResumeAnalysis | null;
  result: ApplicationResult | null;
  demoMode: boolean;
  answers: string[];
  questionIndex: number;
  onQuestionIndex: (index: number) => void;
  candidateName: string;
  candidateEmail: string;
  resumeTextInput: string;
  resumeFile: ResumeFile | null;
  consent: boolean;
  isAnalyzing: boolean;
  isSubmitting: boolean;
  onName: (value: string) => void;
  onEmail: (value: string) => void;
  onResumeText: (value: string) => void;
  onRemoveResume: () => void;
  onChooseResume: (event: ChangeEvent<HTMLInputElement>) => void;
  onConsent: (value: boolean) => void;
  onAnalyze: (event: FormEvent<HTMLFormElement>) => void;
  onDemo: () => void;
  onAnswers: (answers: string[]) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onStartOver: () => void;
  onBack: () => void;
}) {
  const [fileInputKey, setFileInputKey] = useState(0);
  const activeStep = props.step === 'application' ? 1 : props.step === 'questions' ? 2 : 3;
  const resultIsPositive = props.result?.decision === 'advance';
  return <div className="candidate-shell">
    <header className="candidate-header"><Logo /><div className="candidate-header-note"><LockKeyhole size={13} /> Ваша информация передаётся только работодателю</div><button className="return-hr" onClick={props.onBack}>Для работодателя <ArrowUpRight size={13} /></button></header>
    <main className="candidate-main">
      {props.isLoading ? <div className="candidate-loading"><LoaderCircle size={22} />Загружаем вакансию…</div> : !props.vacancy ? <section className="unavailable-card"><div className="unavailable-icon"><CircleHelp size={21} /></div><h1>Вакансия недоступна</h1><p>Возможно, ссылка устарела. Попросите работодателя прислать актуальную.</p><button className="text-button" onClick={props.onBack}><ArrowLeft size={14} /> Вернуться</button></section> : <>
        <div className="job-intro"><span className="job-company"><i /> {props.vacancy.companyName} <span>·</span> ОТКРЫТЫЙ ОТБОР</span><h1>{props.vacancy.title}</h1><p>{props.vacancy.description || 'Расскажите о своём опыте. Если резюме не отражает важную деталь, мы спросим об этом отдельно.'}</p><div className="job-expectations"><span><CheckCircle2 size={14} /> Сначала уточним ваш опыт</span><span><MessageCircle size={14} /> Решение и объяснение — сразу</span></div><div className="public-criteria"><span>ЧТО ВАЖНО ДЛЯ ЭТОЙ РОЛИ</span><div>{props.vacancy.requiredCriteria.map((criterion) => <span key={criterion}><Check size={10} />{criterion}</span>)}</div>{props.vacancy.preferredCriteria.length > 0 && <p><strong>Будет плюсом, но не причиной отказа:</strong> {props.vacancy.preferredCriteria.join(' · ')}</p>}</div></div>
        <div className="candidate-progress">{['Резюме', 'Пара вопросов', 'Результат'].map((label, index) => <div className={`progress-step ${activeStep >= index + 1 ? 'progress-active' : ''} ${activeStep === index + 1 ? 'progress-current' : ''}`} key={label}><span>{activeStep > index + 1 ? <Check size={12} /> : index + 1}</span><small>{label}</small></div>)}</div>
        {props.step === 'application' && <form className="candidate-card" onSubmit={props.onAnalyze}>
          <div className="card-title"><span className="step-kicker">ШАГ 1 ИЗ 3</span><h2>Давайте познакомимся</h2><p>Загрузите резюме. ИИ сопоставит опыт только с требованиями этой вакансии.</p></div>
          <div className="field-pair"><label>Как к вам обращаться<input required value={props.candidateName} onChange={(event) => props.onName(event.target.value)} placeholder="Имя и фамилия" autoComplete="name" /></label><label>Ваша почта<input required type="email" value={props.candidateEmail} onChange={(event) => props.onEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" /><small>Чтобы HR мог связаться, если вы пройдёте дальше.</small></label></div>
          <div className="resume-upload-section"><div className="field-label">Резюме</div><label className="upload-zone"><input key={fileInputKey} type="file" accept=".pdf,.txt,application/pdf,text/plain" onChange={(event) => { void props.onChooseResume(event); setFileInputKey((key) => key + 1); }} /><span className="upload-icon"><Upload size={19} /></span><strong>{props.resumeFile ? 'Заменить файл' : 'Нажмите, чтобы выбрать резюме'}</strong><span>PDF или TXT · до 15 МБ</span></label>{props.resumeFile && <div className="selected-file"><FileText size={16} /><span>{props.resumeFile.name}</span><button type="button" aria-label="Удалить резюме" onClick={() => { props.onRemoveResume(); setFileInputKey((key) => key + 1); }}><X size={15} /></button></div>}
          <label className="paste-resume">Или вставьте текст резюме<textarea rows={4} value={props.resumeTextInput} onChange={(event) => props.onResumeText(event.target.value)} placeholder="Опыт работы, проекты, навыки — всё, что поможет понять ваш опыт" /></label></div>
          <label className="consent-row"><input type="checkbox" checked={props.consent} onChange={(event) => props.onConsent(event.target.checked)} /><span className="custom-checkbox"><Check size={11} /></span><span>Я согласен(на) на обработку резюме AI-сервисом, передачу работодателю моих ответов и хранение контакта, ответов и результата отбора в базе приложения.</span></label>
          {props.error && <div className="form-alert" role="alert"><CircleHelp size={14} />{props.error}</div>}
          <button type="submit" className="button button-primary candidate-submit" disabled={props.isAnalyzing}>{props.isAnalyzing ? <><LoaderCircle className="spin" size={16} /> Внимательно читаем резюме…</> : <>Продолжить <ArrowRight size={15} /></>}</button>
          {props.vacancy.id === demoVacancyId && <button type="button" className="demo-flow-button" onClick={props.onDemo}><Sparkles size={13} /> Посмотреть демонстрационное прохождение</button>}
          <div className="candidate-privacy"><ShieldCheck size={13} /> Мы не оцениваем оформление резюме или личные характеристики. Только относящийся к работе опыт.</div>
          <div className="demo-warning"><LockKeyhole size={12} /> Демо-версия без авторизации: используйте только вымышленные данные.</div>
        </form>}
        {props.step === 'questions' && props.analysis && <form className="candidate-card questions-card" onSubmit={props.onSubmit}>
          <div className="card-title">{props.demoMode && <span className="demo-flow-label"><Sparkles size={11} /> ДЕМОНСТРАЦИЯ · ВЫМЫШЛЕННЫЕ ДАННЫЕ</span>}<span className="step-kicker">ШАГ 2 ИЗ 3 · {props.candidateName}</span><h2>Расскажите чуть больше</h2><p>{props.analysis.summary || 'В резюме есть подходящий опыт, который стоит уточнить перед решением.'}</p></div>
          <div className="criteria-review">{props.analysis.criteria.map((criterion) => <div key={criterion.criterion} className="criterion-review"><span className={`criterion-indicator ${criterion.status === 'confirmed' ? 'criterion-confirmed' : 'criterion-question'}`}>{criterion.status === 'confirmed' ? <Check size={12} /> : <MessageCircle size={12} />}</span><span><strong>{criterion.criterion}</strong><small>{criterion.status === 'confirmed' ? criterion.evidence || 'Подтверждено в резюме' : 'Пока не нашли подтверждение — попросим рассказать подробнее'}</small></span></div>)}</div>
          {props.analysis.questions.length > 0 ? <div className="chat-thread">
            {props.analysis.questions.slice(0, props.questionIndex).map((question, index) => <div className="chat-turn" key={`${question}-${index}`}><div className="chat-question"><span><Sparkles size={12} /> ВОПРОС {index + 1}</span><p>{question}</p></div><div className="chat-answer"><span>ВЫ</span><p>{props.answers[index]}</p></div></div>)}
            <div className="chat-question current-question"><span><Sparkles size={12} /> ВОПРОС {Math.min(props.questionIndex + 1, props.analysis.questions.length)} ИЗ {props.analysis.questions.length}</span><p>{props.analysis.questions[props.questionIndex]}</p></div>
            {props.questionIndex < props.analysis.questions.length && <label className="question-input"><span>Ваш ответ</span><textarea rows={3} required value={props.answers[props.questionIndex] || ''} onChange={(event) => props.onAnswers(props.answers.map((answer, answerIndex) => answerIndex === props.questionIndex ? event.target.value : answer))} placeholder="Расскажите своими словами. Если опыта нет — тоже можно сказать об этом." /></label>}
          </div> : <div className="no-questions"><CheckCircle2 size={17} />Вся нужная информация уже есть. Отправьте ответы, чтобы получить решение.</div>}
          <label className="field-label result-email-label">Почта для связи<input type="email" required value={props.candidateEmail} onChange={(event) => props.onEmail(event.target.value)} placeholder="you@example.com" /></label>
          {props.error && <div className="form-alert" role="alert"><CircleHelp size={14} />{props.error}</div>}
          <div className="question-footer">{props.questionIndex > 0 ? <button type="button" className="text-button" onClick={() => props.onQuestionIndex(props.questionIndex - 1)}><ArrowLeft size={14} /> Предыдущий вопрос</button> : <button type="button" className="text-button" onClick={props.onStartOver}><ArrowLeft size={14} /> Начать заново</button>}<button type="submit" className="button button-primary candidate-submit" disabled={props.isSubmitting}>{props.isSubmitting ? <><LoaderCircle className="spin" size={15} /> Сопоставляем ответы…</> : props.questionIndex < props.analysis.questions.length - 1 ? <>Ответить и продолжить <ArrowRight size={15} /></> : <>Получить решение <ArrowRight size={15} /></>}</button></div>
          <div className="candidate-privacy"><ShieldCheck size={13} /> Решение принимается только по обязательным критериям вакансии. Желательные навыки не могут стать причиной отказа.</div>
        </form>}
        {props.step === 'result' && props.result && <section className={`candidate-card result-card ${resultIsPositive ? 'result-positive' : 'result-negative'}`}>
          <div className="result-symbol">{resultIsPositive ? <CheckCircle2 size={27} /> : <MessageCircle size={27} />}</div>{props.demoMode && <span className="demo-flow-label"><Sparkles size={11} /> ДЕМОНСТРАЦИЯ · ЭТО НЕ РЕШЕНИЕ ПО ВАШЕМУ ОТКЛИКУ</span>}<span className="step-kicker">РЕЗУЛЬТАТ ПЕРВИЧНОГО ОТБОРА</span><h2>{resultIsPositive ? 'Вы проходите дальше' : 'На этот раз не продолжим отбор'}</h2><p className="result-description">{props.result.explanation}</p>
          <div className="result-evidence"><h3>По требованиям вакансии</h3>{props.result.evidence.map((item) => <div className="result-evidence-row" key={item.criterion}><span className={item.status === 'confirmed' ? 'result-check' : 'result-cross'}>{item.status === 'confirmed' ? <Check size={12} /> : <X size={12} />}</span><span><strong>{item.criterion}</strong><small>{item.evidence}</small></span></div>)}</div>
          {!resultIsPositive && <div className="respect-note"><ShieldCheck size={15} /><span>Это решение относится только к вакансии «{props.vacancy.title}». Оно объясняет совпадение опыта с требованиями, а не оценивает ваш потенциал.</span></div>}
          <div className="result-privacy"><LockKeyhole size={13} />{props.demoMode ? 'В демонстрации данные не отправляются и не сохраняются.' : 'Ваши ответы и контакт переданы работодателю по этой вакансии.'}</div>
        </section>}
        <div className="candidate-footer"><span>У вас есть возможность рассказать об опыте, которого не было видно в резюме.</span><details className="privacy-disclosure"><summary>Как обрабатываются данные?</summary><p>Резюме отправляется в подключённый AI-сервис, но не сохраняется в базе приложения. Контакт, ответы и результат отбора сохраняются в SQLite. В этой версии нет авторизации и разграничения доступа, поэтому не отправляйте настоящие персональные данные.</p></details></div>
      </>}
      <footer className="candidate-brand-footer"><Logo small /><span>Найм начинается с диалога.</span></footer>
    </main>
  </div>;
}

export default App;
