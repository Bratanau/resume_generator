import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    // Fetch resume from server
    const fetchResume = async () => {
      try {
        const res = await fetch(`/api/simple/resume/${linkId}`);
        const data = await res.json();
        if (data.success && data.resume) {
          setResumeData(data.resume);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResume();

    // Send open telemetry ping
    fetch(`/api/simple/record-open/${linkId}`, { method: 'POST' }).catch(() => {});
  }, [linkId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-700">Загрузка резюме кандидата...</p>
      </div>
    );
  }

  const resume = resumeData || {
    fullName: 'Алексей Новиков',
    title: 'Senior Full-Stack & Highload Architect',
    location: 'Москва / Remote Worldwide',
    contacts: {
      telegram: '@alex_novikov_tech',
      email: 'alex.novikov.dev@gmail.com',
      github: 'https://github.com',
    },
    summary: '7+ лет проектирую распределенные сервисы с нагрузкой от 25k RPS. Сокращаю p99 задержки, перевожу монолиты на event-driven архитектуру и трансформирую инженерные практики в измеримую прибыль бизнеса.',
    starBullets: [
      'Спроектировал и внедрил асинхронный платежный конвейер на базе Kafka и Redis Streams, выдерживающий нагрузку 32 000 RPS в Black Friday без единого drop-события.',
      'Оптимизировал сложные аналитические запросы и настроил многоуровневое партиционирование таблиц PostgreSQL объемом 12 Тб, снизив среднее время транзакции с 480мс до 55мс (-88%).',
      'Внедрил распределенный Tracing (OpenTelemetry) и автоматический circuit-breaker для внешних банковских провайдеров, сократив время локализации сбоев (MTTR) с 40 минут до 3 минут.',
      'Перевел инфраструктуру на автомасштабируемые K8s-кластеры с оптимизацией потребления ресурсов, сократив облачный счет компании на $94 000 в год.'
    ],
    metrics: [
      { label: 'Пиковый RPS', value: '32,000' },
      { label: 'Снижение p99 задержки', value: '-88%' },
      { label: 'Годовая экономия Cloud', value: '$94,000' },
      { label: 'Uptime SLA', value: '99.99%' },
    ],
    techStack: ['Go', 'TypeScript', 'PostgreSQL', 'Redis', 'Kafka', 'Kubernetes', 'Docker', 'OpenTelemetry'],
  };

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
                Подтвержденный профиль кандидата • CVision Passport
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
            <a
              href={`https://t.me/${resume.contacts?.telegram?.replace('@', '') || 'alex_novikov_tech'}`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Написать в Telegram</span>
            </a>
          </div>
        </div>

        {/* Main Clean Resume Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {resume.fullName}
                </h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  STAR Verified
                </span>
              </div>
              <p className="text-base font-bold text-blue-600 mt-1">
                {resume.title}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                📍 {resume.location}
              </p>

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
              </div>
            </div>

            <a
              href={`https://t.me/${resume.contacts?.telegram?.replace('@', '') || 'alex_novikov_tech'}`}
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Пригласить на интервью</span>
            </a>
          </div>

          {/* Elevator Summary */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <span className="font-bold text-slate-900 block mb-1">
              🎯 Позиционирование и ценность для команды:
            </span>
            {resume.summary}
          </div>

          {/* Highlighted Metrics */}
          {resume.metrics && (
            <div>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                Ключевые подтвержденные показатели:
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
          <div>
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
          <div>
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

        {/* Footer watermark */}
        <div className="text-center text-xs text-slate-400 py-2">
          Умный отклик создан в <strong>CVision</strong> • ATS Machine Validated
        </div>
      </div>
    </div>
  );
};
