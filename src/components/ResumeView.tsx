import React, { useState } from 'react';
import { 
  CandidateResume, 
  TargetCampaign, 
  VoiceComment, 
  WorkExperience, 
  PetProject 
} from '../types';
import { 
  Building2, 
  Send, 
  Github, 
  Mail, 
  Flame, 
  Volume2, 
  ExternalLink, 
  Sparkles, 
  Plus, 
  Check, 
  ChevronRight, 
  TrendingUp, 
  Target, 
  Code2, 
  Play, 
  SlidersHorizontal 
} from 'lucide-react';

interface ResumeViewProps {
  candidate: CandidateResume;
  activeCampaignId: string | null;
  onSelectCampaign: (id: string | null) => void;
  onOpenCoachWithContext?: (rawText: string, currentRole: string) => void;
  onOpenVoiceRoast?: (sectionId: string) => void;
  showHeatmapOverlay: boolean;
  setShowHeatmapOverlay: (show: boolean) => void;
  onAcceptRewrite?: (commentId: string, sectionId: string, rewrite: string) => void;
}

export const ResumeView: React.FC<ResumeViewProps> = ({
  candidate,
  activeCampaignId,
  onSelectCampaign,
  onOpenCoachWithContext,
  onOpenVoiceRoast,
  showHeatmapOverlay,
  setShowHeatmapOverlay,
  onAcceptRewrite,
}) => {
  const [selectedSkillFilter, setSelectedSkillFilter] = useState<string | null>(null);
  const [activeVoicePopup, setActiveVoicePopup] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  const activeCampaign: TargetCampaign | undefined = candidate.campaigns.find(
    (c) => c.id === activeCampaignId
  );

  // Simulated audio playback for voice comments
  const playVoiceNote = (comment: VoiceComment) => {
    if (playingAudioId === comment.id) {
      setPlayingAudioId(null);
      return;
    }
    setPlayingAudioId(comment.id);
    
    // Web Speech API synthesis for realistic voice mentor playback if supported
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(comment.transcription);
      utterance.rate = 1.05;
      utterance.pitch = 0.95;
      utterance.onend = () => setPlayingAudioId(null);
      utterance.onerror = () => setPlayingAudioId(null);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => {
        setPlayingAudioId(null);
      }, comment.audioDurationSeconds * 1000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Target Campaign Bar (B2B Personalization) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Персонализация под работодателя (B2B Ссылка)
              </h2>
              <p className="text-xs text-slate-400">
                Выберите компанию для симуляции того, что видит конкретный нанимающий менеджер:
              </p>
            </div>
          </div>

          {/* Heatmap Overlay Switch */}
          <button
            onClick={() => setShowHeatmapOverlay(!showHeatmapOverlay)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
              showHeatmapOverlay
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-lg shadow-rose-500/20'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
            }`}
          >
            <Flame className={`w-4 h-4 ${showHeatmapOverlay ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`} />
            <span>{showHeatmapOverlay ? 'Скрыть теплокарту' : 'Показать тепловую карту (Heatmap)'}</span>
          </button>
        </div>

        {/* Campaign Pills */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-800/80">
          <button
            onClick={() => onSelectCampaign(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeCampaignId === null
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            🌐 Общая версия (Public Standard)
          </button>

          {candidate.campaigns.map((camp) => (
            <button
              key={camp.id}
              onClick={() => onSelectCampaign(camp.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                activeCampaignId === camp.id
                  ? 'border-indigo-500 bg-indigo-500/20 text-white font-semibold ring-1 ring-indigo-500'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-750'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" style={{ color: camp.accentColor || '#6366f1' }} />
              <span>{camp.companyName}</span>
              <span className="text-[10px] px-1 rounded bg-slate-900/80 text-slate-400">
                {camp.viewsCount} просм.
              </span>
            </button>
          ))}
        </div>

        {/* Active Campaign Greeting Banner */}
        {activeCampaign && (
          <div 
            className="mt-4 p-4 rounded-xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn"
            style={{ borderLeftColor: activeCampaign.accentColor || '#6366f1', borderLeftWidth: '4px' }}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 uppercase">
                  Targeted Link: {activeCampaign.slug}
                </span>
                <span className="text-xs text-slate-400">
                  Позиция: <strong className="text-slate-200">{activeCampaign.roleTitle}</strong>
                </span>
              </div>
              <p className="text-sm text-slate-200 font-medium mt-1">
                «{activeCampaign.customGreeting}»
              </p>
            </div>
            <div className="text-xs text-emerald-400 font-medium flex items-center gap-1 whitespace-nowrap bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Отслеживание включено
            </div>
          </div>
        )}
      </div>

      {/* Main Resume Canvas Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
        {/* Heatmap Banner if toggled */}
        {showHeatmapOverlay && (
          <div className="bg-rose-950/80 border-b border-rose-500/30 px-6 py-2.5 flex items-center justify-between text-xs text-rose-200">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-400 animate-bounce" />
              <span>
                <strong>Режим тепловой карты:</strong> Цветовые индикаторы показывают, на каких блоках рекрутеры и техлиды задерживают внимание дольше всего.
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-rose-500" /> Горячая зона (&gt;40 сек)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-amber-500" /> Средняя (15-30 сек)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-sky-500" /> Скан (&lt;5 сек)
              </span>
            </div>
          </div>
        )}

        {/* Candidate Header / Hero Section */}
        <div className={`p-6 sm:p-8 border-b border-slate-800 relative ${
          showHeatmapOverlay ? 'ring-2 ring-amber-500/40 bg-amber-950/10' : ''
        }`}>
          {showHeatmapOverlay && (
            <div className="absolute top-3 right-4 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold">
              Внимание: 18 сек (Первый скан контакта)
            </div>
          )}

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative">
                <img
                  src={candidate.avatarUrl}
                  alt={candidate.fullName}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-2 ring-indigo-500/50 shadow-xl"
                />
                <span className="absolute -bottom-1.5 -right-1.5 bg-emerald-500 text-white p-1 rounded-full ring-4 ring-slate-900 shadow">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </span>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {candidate.fullName}
                  </h1>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-medium">
                    {candidate.statusBadge}
                  </span>
                </div>

                <p className="text-base sm:text-lg font-semibold text-indigo-400 mt-1">
                  {candidate.title}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  📍 {candidate.location}
                </p>

                {/* Contacts & Social links */}
                <div className="flex flex-wrap items-center gap-3 mt-3">
                  <a
                    href={`https://t.me/${candidate.telegram.replace('@', '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-750 px-2.5 py-1.5 rounded-lg border border-slate-700 transition"
                  >
                    <Send className="w-3 h-3 text-sky-400" />
                    <span>{candidate.telegram}</span>
                  </a>

                  <a
                    href={`mailto:${candidate.email}`}
                    className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-750 px-2.5 py-1.5 rounded-lg border border-slate-700 transition"
                  >
                    <Mail className="w-3 h-3 text-amber-400" />
                    <span>{candidate.email}</span>
                  </a>

                  <a
                    href={candidate.github}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-750 px-2.5 py-1.5 rounded-lg border border-slate-700 transition"
                  >
                    <Github className="w-3 h-3 text-purple-400" />
                    <span>GitHub Code</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Quick Action CTA for Recruiter */}
            <div className="w-full md:w-auto flex flex-col sm:flex-row md:flex-col gap-2">
              <a
                href={`https://t.me/${candidate.telegram.replace('@', '')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition transform hover:scale-[1.02]"
              >
                <Send className="w-4 h-4" />
                <span>Назначить интервью / Telegram</span>
              </a>

              <button
                onClick={() => onOpenCoachWithContext?.(candidate.pitch, candidate.title)}
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs border border-slate-700 transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>AI Усилить формулировки</span>
              </button>
            </div>
          </div>

          {/* Elevator Pitch */}
          <div className="mt-5 p-4 rounded-xl bg-slate-950/60 border border-slate-800/90 text-sm text-slate-300 leading-relaxed">
            <span className="font-bold text-slate-100 block mb-1">
              🎯 Value Proposition (Ценность для бизнеса):
            </span>
            {candidate.pitch}
          </div>
        </div>

        {/* Section: Interactive Skills Matrix */}
        <div className={`p-6 sm:p-8 border-b border-slate-800 relative ${
          showHeatmapOverlay ? 'ring-2 ring-sky-500/40 bg-sky-950/10' : ''
        }`}>
          {showHeatmapOverlay && (
            <div className="absolute top-3 right-4 px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[11px] font-bold">
              Внимание: 28 сек • Фильтрация стека
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Code2 className="w-5 h-5 text-indigo-400" />
                <span>Технологический стек & Архитектурные компетенции</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Кликните на навык, чтобы подсветить релевантный коммерческий опыт и проекты:
              </p>
            </div>

            {selectedSkillFilter && (
              <button
                onClick={() => setSelectedSkillFilter(null)}
                className="text-xs px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-500/30"
              >
                Сбросить фильтр ({selectedSkillFilter}) ✕
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {candidate.skills.map((cat, idx) => (
              <div key={idx} className="bg-slate-950/50 rounded-xl p-4 border border-slate-800/80">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  {cat.category}
                </h3>
                <div className="space-y-2.5">
                  {cat.skills.map((skill, sIdx) => {
                    const isSelected = selectedSkillFilter === skill.name;
                    return (
                      <div
                        key={sIdx}
                        onClick={() => setSelectedSkillFilter(isSelected ? null : skill.name)}
                        className={`cursor-pointer p-2 rounded-lg transition-all ${
                          isSelected
                            ? 'bg-indigo-600/30 border border-indigo-500'
                            : 'hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className={`font-semibold ${isSelected ? 'text-indigo-300' : 'text-slate-200'}`}>
                            {skill.name}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {skill.level}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              skill.highlighted
                                ? 'bg-gradient-to-r from-indigo-500 to-purple-500'
                                : 'bg-slate-600'
                            }`}
                            style={{ width: `${skill.level}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section: Work Experience with STAR & Quantified Metrics */}
        <div className={`p-6 sm:p-8 border-b border-slate-800 relative ${
          showHeatmapOverlay ? 'ring-2 ring-rose-500/50 bg-rose-950/15' : ''
        }`}>
          {showHeatmapOverlay && (
            <div className="absolute top-3 right-4 px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[11px] font-bold flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>ГОРЯЧАЯ ЗОНА: 48 сек • 94% рекрутеров читают метрики</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <h2 className="text-xl font-bold text-white">
                  Коммерческий опыт (STAR: Situation → Task → Action → Result)
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Фокус на масштабируемости, измеримом бизнес-эффекте и предотвращении отказов систем:
              </p>
            </div>

            <button
              onClick={() => onOpenCoachWithContext?.('Работал над платежным сервисом, оптимизировал запросы в базе', 'Lead Backend Engineer')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 text-xs font-semibold"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Распаковать новый кейс в STAR</span>
            </button>
          </div>

          {/* Experience Cards */}
          <div className="space-y-6">
            {candidate.experience.map((exp) => {
              // Find voice comments for this experience block
              const commentsForExp = candidate.voiceComments.filter(
                (vc) => vc.sectionId === exp.id
              );

              return (
                <div
                  key={exp.id}
                  className="bg-slate-950/60 rounded-xl p-5 border border-slate-800 hover:border-slate-700 transition relative group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-3 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">
                          {exp.role}
                        </h3>
                        {exp.isCurrent && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Текущее место
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-indigo-400 mt-0.5">
                        {exp.company} • 📍 {exp.location}
                      </p>
                    </div>

                    <div className="text-xs font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 self-start sm:self-auto">
                      {exp.period}
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 font-medium italic mb-4">
                    {exp.summary}
                  </p>

                  {/* Highlighted Metric Badges */}
                  {exp.metrics && exp.metrics.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
                      {exp.metrics.map((m, mIdx) => (
                        <div
                          key={mIdx}
                          className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-800 flex flex-col items-center justify-center text-center"
                        >
                          <span className="text-base font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                            {m.value}
                          </span>
                          <span className="text-[11px] text-slate-400 mt-0.5 font-medium leading-tight">
                            {m.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* STAR Bullets */}
                  <div className="space-y-2 mb-4">
                    {exp.starBullets.map((bullet, bIdx) => (
                      <div key={bIdx} className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                        <span>{bullet}</span>
                      </div>
                    ))}
                  </div>

                  {/* Tech stack badges */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-slate-800/60">
                    <span className="text-[11px] font-bold text-slate-400 mr-1">
                      Стек:
                    </span>
                    {exp.techStack.map((tech, tIdx) => (
                      <span
                        key={tIdx}
                        className={`text-[11px] px-2 py-0.5 rounded font-mono ${
                          selectedSkillFilter === tech
                            ? 'bg-indigo-600 text-white font-bold ring-2 ring-indigo-400'
                            : 'bg-slate-900 text-slate-300 border border-slate-800'
                        }`}
                      >
                        {tech}
                      </span>
                    ))}
                  </div>

                  {/* Voice Comments Marker Pill */}
                  {commentsForExp.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                      {commentsForExp.map((vc) => (
                        <div key={vc.id} className="relative">
                          <button
                            onClick={() => setActiveVoicePopup(activeVoicePopup === vc.id ? null : vc.id)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold transition"
                          >
                            <Volume2 className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                            <span>{vc.tagLabel}</span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              ({vc.authorName})
                            </span>
                          </button>

                          {/* Voice Comment Details Popup */}
                          {activeVoicePopup === vc.id && (
                            <div className="absolute left-0 bottom-full mb-2 w-80 sm:w-96 bg-slate-900 border border-rose-500/40 rounded-xl p-4 shadow-2xl z-20 animate-fadeIn text-xs">
                              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                                <div className="flex items-center gap-2">
                                  <img
                                    src={vc.authorAvatar}
                                    alt={vc.authorName}
                                    className="w-7 h-7 rounded-full object-cover"
                                  />
                                  <div>
                                    <div className="font-bold text-white leading-tight">
                                      {vc.authorName}
                                    </div>
                                    <div className="text-[10px] text-slate-400">
                                      {vc.authorRole}
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => setActiveVoicePopup(null)}
                                  className="text-slate-400 hover:text-white"
                                >
                                  ✕
                                </button>
                              </div>

                              <p className="text-slate-200 italic mb-3">
                                {vc.transcription}
                              </p>

                              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
                                <button
                                  onClick={() => playVoiceNote(vc)}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                                    playingAudioId === vc.id
                                      ? 'bg-rose-600 text-white animate-pulse'
                                      : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                                  }`}
                                >
                                  <Play className="w-3.5 h-3.5" />
                                  <span>{playingAudioId === vc.id ? 'Слушаем...' : `Прослушать (${vc.audioDurationSeconds}с)`}</span>
                                </button>

                                {vc.suggestedRewrite && !vc.accepted && (
                                  <button
                                    onClick={() => {
                                      onAcceptRewrite?.(vc.id, exp.id, vc.suggestedRewrite!);
                                      setActiveVoicePopup(null);
                                    }}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Принять правку</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Section: Pet Projects & Open Source (The Recruiter Magnet) */}
        <div className={`p-6 sm:p-8 border-b border-slate-800 relative ${
          showHeatmapOverlay ? 'ring-2 ring-rose-500/60 bg-rose-950/20' : ''
        }`}>
          {showHeatmapOverlay && (
            <div className="absolute top-3 right-4 px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[11px] font-bold flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>ТОП-ИНТЕРЕС: 58 сек читали код и архитектуру пет-проекта!</span>
            </div>
          )}

          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span>Пет-проекты & Open Source (Живой код и Архитектура)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Инженерные решения с открытым исходным кодом, вызвавшие максимальный интерес техлидов:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {candidate.petProjects.map((proj) => (
              <div
                key={proj.id}
                className="bg-slate-950/70 rounded-xl p-5 border border-slate-800 hover:border-indigo-500/40 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-base font-bold text-white">
                      {proj.title}
                    </h3>
                    {proj.stars && (
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        ⭐ {proj.stars}
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-semibold text-indigo-400 mb-2">
                    {proj.tagline}
                  </p>

                  <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                    {proj.description}
                  </p>

                  {/* Architecture & Metrics callout */}
                  <div className="bg-slate-900/90 rounded-lg p-3 border border-slate-800/80 mb-4 space-y-1.5 text-xs">
                    {proj.metrics && (
                      <div className="flex items-center gap-2 text-emerald-300 font-mono">
                        <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                        <span>{proj.metrics}</span>
                      </div>
                    )}
                    {proj.highlightedArchitecture && (
                      <div className="flex items-center gap-2 text-indigo-300 font-mono text-[11px]">
                        <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
                        <span>Архитектура: {proj.highlightedArchitecture}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {proj.techStack.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 font-mono"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-slate-800/60">
                    {proj.githubUrl && (
                      <a
                        href={proj.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                      >
                        <Github className="w-3.5 h-3.5" />
                        <span>Смотреть код</span>
                      </a>
                    )}
                    {proj.liveDemoUrl && (
                      <a
                        href={proj.liveDemoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/40 text-xs font-semibold transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Архитектура</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section: Education & Mentorship */}
        <div className={`p-6 sm:p-8 relative ${
          showHeatmapOverlay ? 'ring-2 ring-sky-500/30 bg-sky-950/10' : ''
        }`}>
          {showHeatmapOverlay && (
            <div className="absolute top-3 right-4 px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[11px] font-bold">
              Внимание: 4 сек (Беглый просмотр диплома)
            </div>
          )}

          <h2 className="text-base font-bold text-white mb-3">
            Высшее образование & Академический бэкграунд
          </h2>

          <div className="space-y-3">
            {candidate.education.map((edu) => (
              <div key={edu.id} className="bg-slate-950/40 rounded-xl p-4 border border-slate-800">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {edu.institution}
                    </h3>
                    <p className="text-xs text-indigo-400 mt-0.5">
                      {edu.degree}
                    </p>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    {edu.period}
                  </span>
                </div>
                {edu.details && (
                  <p className="text-xs text-slate-400 mt-2">
                    {edu.details}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer / Watermark of Viral Loop */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>
              Создано и отслеживается в <strong>CVision</strong> • Умный паспорт кандидата
            </span>
          </div>

          <div className="text-[11px] text-slate-400">
            ATS Machine Compliant • JSON Resume v1.0.0
          </div>
        </div>
      </div>
    </div>
  );
};
