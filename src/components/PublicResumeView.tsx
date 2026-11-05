import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Mail, 
  Github, 
  Check, 
  TrendingUp, 
  Building2, 
  ArrowLeft, 
  Sparkles,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

interface PublicResumeViewProps {
  linkId: string;
  onBackToApp: () => void;
}

export const PublicResumeView: React.FC<PublicResumeViewProps> = ({ linkId, onBackToApp }) => {
  const [resumeData, setResumeData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string>('');
  const activeSections = useRef(new Set<string>());
  const pendingSeconds = useRef<Record<string, number>>({});
  const scrollDepth = useRef(0);

  useEffect(() => {
    const fetchResume = async () => {
      try {
        const res = await fetch(`/api/simple/resume/${linkId}`);
        const data = await res.json();
        if (!res.ok || !data.resume) throw new Error(data.error || 'Ссылка на резюме не найдена.');
        setResumeData(data.resume);
      } catch (error) {
        console.error('Failed to load public resume:', error);
        setLoadError(error instanceof Error ? error.message : 'Не удалось загрузить резюме.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchResume();
  }, [linkId]);

  useEffect(() => {
    if (!resumeData) return;
    const sections = document.querySelectorAll<HTMLElement>('[data-resume-section]');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const section = (entry.target as HTMLElement).dataset.resumeSection;
        if (!section) return;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.25) activeSections.current.add(section);
        else activeSections.current.delete(section);
      });
    }, { threshold: [0, 0.25, 0.5] });
    sections.forEach((section) => observer.observe(section));

    const updateScrollDepth = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable > 0) scrollDepth.current = Math.max(scrollDepth.current, Math.round((window.scrollY / scrollable) * 100));
    };
    const trackLinkClick = (event: MouseEvent) => {
      if ((event.target as HTMLElement).closest('a')) {
        const payload = new Blob([JSON.stringify({ linkClick: true })], { type: 'application/json' });
        if (navigator.sendBeacon) navigator.sendBeacon(`/api/simple/analytics/${linkId}`, payload);
      }
    };
    const flush = (useBeacon = false) => {
      const now = Date.now();
      if (document.visibilityState === 'hidden' && !useBeacon) {
        lastTick = now;
        return;
      }
      const elapsedSeconds = Math.max(0, Math.min(15, (now - lastTick) / 1000));
      lastTick = now;
      activeSections.current.forEach((section) => {
        pendingSeconds.current[section] = (pendingSeconds.current[section] || 0) + elapsedSeconds;
      });
      const payload = JSON.stringify({ sectionSeconds: pendingSeconds.current, scrollDepth: scrollDepth.current });
      if (!Object.keys(pendingSeconds.current).length && !scrollDepth.current) return;
      if (useBeacon && navigator.sendBeacon) {
        navigator.sendBeacon(`/api/simple/analytics/${linkId}`, new Blob([payload], { type: 'application/json' }));
      } else {
        void fetch(`/api/simple/analytics/${linkId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
        });
      }
      pendingSeconds.current = {};
    };
    let lastTick = Date.now();
    const interval = window.setInterval(() => {
      updateScrollDepth();
      flush();
    }, 5000);
    const handlePageHide = () => flush(true);
    window.addEventListener('scroll', updateScrollDepth, { passive: true });
    document.addEventListener('click', trackLinkClick);
    window.addEventListener('pagehide', handlePageHide, { once: true });

    return () => {
      flush(true);
      clearInterval(interval);
      observer.disconnect();
      window.removeEventListener('scroll', updateScrollDepth);
      document.removeEventListener('click', trackLinkClick);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [linkId, resumeData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-700">Загрузка резюме кандидата...</p>
      </div>
    );
  }

  if (loadError || !resumeData) {
    return <main className="min-h-screen flex items-center justify-center p-6 text-center text-slate-700">{loadError || 'Резюме не найдено.'}</main>;
  }
  const resume = resumeData;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased py-6 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-5">
        {/* Top Employer Navigation Banner */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs border border-emerald-200">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">
                Персональное резюме • CVision
              </div>
              <div className="text-[11px] text-slate-500">
                Уникальный отклик ID: <span className="font-mono font-semibold">{linkId}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onBackToApp}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>В кабинет соискателя</span>
            </button>
            {resume.contacts?.telegram && (
              <a
                href={`https://t.me/${resume.contacts.telegram.replace('@', '')}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Написать в Telegram</span>
              </a>
            )}
          </div>
        </div>

        {/* Main Clean Resume Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          {/* Header */}
          <div data-resume-section="Контакты" className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div className="flex items-center gap-4">
              {resume.photo && <img src={resume.photo} alt="Фото кандидата" className="w-24 h-24 rounded-2xl object-cover border border-slate-200" />}
              <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {resume.fullName || 'Кандидат'}
                </h1>
              </div>
              {resume.title && <p className="text-base font-bold text-blue-600 mt-1">
                {resume.title}
              </p>}
              {resume.location && <p className="text-xs text-slate-500 mt-0.5">📍 {resume.location}</p>}

              {/* Contacts */}
              <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
                {resume.contacts?.telegram && (
                  <a
                    href={`https://t.me/${resume.contacts.telegram.replace('@', '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-slate-600 hover:text-blue-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200"
                  >
                    <Send className="w-3 h-3 text-sky-500" />
                    <span>{resume.contacts.telegram}</span>
                  </a>
                )}
                {resume.contacts?.email && (
                  <a
                    href={`mailto:${resume.contacts.email}`}
                    className="flex items-center gap-1 text-slate-600 hover:text-blue-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200"
                  >
                    <Mail className="w-3 h-3 text-amber-500" />
                    <span>{resume.contacts.email}</span>
                  </a>
                )}
                {resume.contacts?.phone && (
                  <a
                    href={`tel:${resume.contacts.phone.replace(/[^\d+]/g, '')}`}
                    className="flex items-center gap-1 text-slate-600 hover:text-blue-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200"
                  >
                    <span>{resume.contacts.phone}</span>
                  </a>
                )}
                {resume.contacts?.github && (
                  <a
                    href={resume.contacts.github}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-slate-600 hover:text-blue-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200"
                  >
                    <Github className="w-3 h-3 text-purple-600" />
                    <span>GitHub Code</span>
                  </a>
                )}
                {resume.links?.map((link: { url: string; label: string }, index: number) => (
                  <a
                    key={`${link.url}-${index}`}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-slate-600 hover:text-blue-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200"
                  >
                    <ExternalLink className="w-3 h-3 text-blue-500" />
                    <span>{link.label}</span>
                  </a>
                ))}
              </div>
              </div>
            </div>

            {resume.contacts?.telegram && (
              <a
                href={`https://t.me/${resume.contacts.telegram.replace('@', '')}`}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Пригласить на интервью</span>
              </a>
            )}
          </div>

          {/* Elevator Summary */}
          <div data-resume-section="Профиль" className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <span className="font-bold text-slate-900 block mb-1">
              🎯 Позиционирование и ценность для команды:
            </span>
            {resume.summary}
          </div>

          {/* Highlighted Metrics */}
          {resume.metrics?.length > 0 && (
            <div>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                Показатели:
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {resume.metrics.map((m: any, idx: number) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                    <span className="text-xl font-black text-blue-600 block">
                      {m.value}
                    </span>
                    <span className="text-xs text-slate-500 mt-0.5 block font-medium">
                      {m.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STAR Experience Bullets */}
          <div data-resume-section="Опыт и кейсы">
            <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Опыт и ключевые решения (Situation → Task → Action → Result)</span>
            </h2>

            <div className="space-y-2.5">
              {resume.starBullets?.map((bullet: string, idx: number) => (
                <div key={idx} className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed">
                  <span className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  <span>{bullet}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tech Stack Matrix */}
          <div data-resume-section="Навыки">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Технологический стек:
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {resume.techStack?.map((tech: string, idx: number) => (
                <span
                  key={idx}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 font-mono font-medium"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>

        <p className="px-2 text-center text-[11px] leading-relaxed text-slate-500">
          Кандидату доступна агрегированная статистика просмотра: время в разделах, глубина прокрутки и переходы по ссылкам. Данные не позволяют установить личность посетителя.
        </p>

        {/* Footer watermark */}
        <div className="text-center text-xs text-slate-400 py-2">
          Резюме собрано из исходного опыта кандидата и его ответов • <strong>CVision</strong>
        </div>
      </div>
    </div>
  );
};
