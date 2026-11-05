import React, { useState, useRef } from 'react';
import { VoiceComment, CandidateResume, ReviewTagType } from '../types';
import { 
  Mic, 
  Square, 
  Play, 
  Pause, 
  Volume2, 
  Check, 
  Sparkles, 
  UserCheck, 
  Flame, 
  AlertTriangle, 
  Trash2, 
  Plus,
  Send,
  MessageSquare
} from 'lucide-react';
import { triggerConfetti } from '../utils/helpers';

interface VoiceReviewModeProps {
  candidate: CandidateResume;
  onAddVoiceComment: (comment: VoiceComment) => void;
  onAcceptRewrite: (commentId: string, sectionId: string, rewrite: string) => void;
  onTriggerNotification: (msg: string) => void;
}

export const VoiceReviewMode: React.FC<VoiceReviewModeProps> = ({
  candidate,
  onAddVoiceComment,
  onAcceptRewrite,
  onTriggerNotification,
}) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordDuration, setRecordDuration] = useState<number>(0);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('exp-1');
  const [selectedTag, setSelectedTag] = useState<ReviewTagType>('fire');
  const [mentorName, setMentorName] = useState<string>('Михаил Данилов (Staff @ Ex-Yandex)');
  const [customTranscription, setCustomTranscription] = useState<string>('');
  const [suggestedRewrite, setSuggestedRewrite] = useState<string>('');
  const [playingCommentId, setPlayingCommentId] = useState<string | null>(null);

  const timerRef = useRef<any>(null);

  // Available sections to attach review to
  const availableSections = [
    { id: 'header', title: 'Шапка профиля & Позиционирование' },
    ...candidate.experience.map((e) => ({ id: e.id, title: `Опыт: ${e.company} (${e.role})` })),
    ...candidate.petProjects.map((p) => ({ id: p.id, title: `Пет-проект: ${p.title}` })),
  ];

  const startRecording = () => {
    setIsRecording(true);
    setRecordDuration(0);
    setCustomTranscription('');
    timerRef.current = setInterval(() => {
      setRecordDuration((prev) => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);

    // Auto generate transcription simulation if empty
    if (!customTranscription) {
      if (selectedTag === 'fire') {
        setCustomTranscription(
          '«Отличная формулировка с p99 задержкой и 32 000 RPS! Сразу видно инженерный масштаб и понимание архитектуры». '
        );
        setSuggestedRewrite(
          'Спроектировал и внедрил асинхронный платежный конвейер на базе Kafka и Redis Streams, выдерживающий нагрузку 32 000 RPS без единого сбоя.'
        );
      } else if (selectedTag === 'warning') {
        setCustomTranscription(
          '«Здесь слишком абстрактно написано "участвовал в разработке". Замени на активный глагол и покажи конкретный вклад команды». '
        );
        setSuggestedRewrite(
          'Возглавил кросс-функциональную команду из 5 инженеров и оптимизировал архитектуру очередей, снизив latency на 40%.'
        );
      } else {
        setCustomTranscription(
          '«Рекомендую вынести стек технологий в отдельный бейдж, чтобы ATS-система сразу проиндексировала Go и Kubernetes». '
        );
        setSuggestedRewrite(
          'Реализовал микросервис на Go с автоматическим горизонтальным масштабированием в Kubernetes.'
        );
      }
    }
    onTriggerNotification('🎙️ Аудиодорожка записана и расшифрована ИИ!');
  };

  const handleSaveComment = () => {
    if (!customTranscription.trim()) return;

    const newComment: VoiceComment = {
      id: `vc-${Date.now()}`,
      sectionId: selectedSectionId,
      sectionTitle: availableSections.find((s) => s.id === selectedSectionId)?.title || 'Блок резюме',
      authorName: mentorName.split('(')[0]?.trim() || 'Карьерный консультант',
      authorRole: mentorName.includes('(') ? mentorName.split('(')[1]?.replace(')', '') : 'Senior Mentor',
      authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      timestamp: 'Только что',
      audioDurationSeconds: Math.max(recordDuration, 12),
      tag: selectedTag,
      tagLabel: 
        selectedTag === 'fire' ? '🔥 Киллер-фича' :
        selectedTag === 'warning' ? '⚠️ Красный флаг' :
        selectedTag === 'tip' ? '💡 Совет ментора' : '❌ Вырезать',
      transcription: customTranscription,
      suggestedRewrite: suggestedRewrite || undefined,
      accepted: false,
    };

    onAddVoiceComment(newComment);
    setCustomTranscription('');
    setSuggestedRewrite('');
    setRecordDuration(0);
    triggerConfetti();
    onTriggerNotification('✅ Голосовой комментарий прикреплен к резюме!');
  };

  const playVoiceAudio = (comment: VoiceComment) => {
    if (playingCommentId === comment.id) {
      setPlayingCommentId(null);
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      return;
    }

    setPlayingCommentId(comment.id);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(comment.transcription);
      utterance.rate = 1.05;
      utterance.onend = () => setPlayingCommentId(null);
      utterance.onerror = () => setPlayingCommentId(null);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setPlayingCommentId(null), comment.audioDurationSeconds * 1000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro Banner for Mentors & Consultants */}
      <div className="bg-gradient-to-r from-rose-950/60 via-slate-900 to-indigo-950/50 border border-rose-500/30 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Mic className="w-5 h-5 text-rose-400 animate-pulse" />
              <h2 className="text-lg font-bold text-white">
                Асинхронные Voice Comments & Прожарка от менторов
              </h2>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Карьерному консультанту больше не нужно проводить часовые созвоны в Zoom. Кликайте в любой абзац, наговаривайте 15-секундную голосовуху — система сама расшифрует аудио и предложит кандидату правку в один клик.
            </p>
          </div>

          <div className="bg-rose-500/10 border border-rose-500/30 px-3.5 py-2 rounded-xl text-xs text-rose-300 font-semibold flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            <span>Режим ревьюера: {candidate.voiceComments.length} правок в базе</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recording & Comment Creation Box */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Mic className="w-4 h-4 text-rose-400" />
              <span>Записать голосовой отзыв на блок</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  Выберите блок резюме для комментирования:
                </label>
                <select
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  {availableSections.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  Тональность и статус метки:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTag('fire')}
                    className={`p-2 rounded-lg border text-left flex items-center gap-2 transition ${
                      selectedTag === 'fire'
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5 text-rose-400" />
                    <span>🔥 Киллер-фича</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTag('warning')}
                    className={`p-2 rounded-lg border text-left flex items-center gap-2 transition ${
                      selectedTag === 'warning'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>⚠️ Красный флаг</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTag('tip')}
                    className={`p-2 rounded-lg border text-left flex items-center gap-2 transition ${
                      selectedTag === 'tip'
                        ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>💡 Совет</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTag('delete')}
                    className={`p-2 rounded-lg border text-left flex items-center gap-2 transition ${
                      selectedTag === 'delete'
                        ? 'bg-red-500/20 border-red-500 text-red-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    <span>❌ Вырезать</span>
                  </button>
                </div>
              </div>

              {/* Voice Recorder Studio */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-3">
                <div className="flex items-center justify-center gap-2">
                  {isRecording ? (
                    <div className="flex items-center gap-2 text-rose-400 font-bold animate-pulse">
                      <span className="w-3 h-3 rounded-full bg-rose-500" />
                      <span>Идет запись голоса: 00:{recordDuration < 10 ? `0${recordDuration}` : recordDuration}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400">Нажмите для диктовки аудио-отзыва:</span>
                  )}
                </div>

                <div className="flex justify-center">
                  {isRecording ? (
                    <button
                      onClick={stopRecording}
                      className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-rose-600/30 cursor-pointer"
                    >
                      <Square className="w-4 h-4 fill-white" />
                      <span>Остановить запись</span>
                    </button>
                  ) : (
                    <button
                      onClick={startRecording}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-rose-600/30 cursor-pointer"
                    >
                      <Mic className="w-4 h-4" />
                      <span>Начать запись (Голос)</span>
                    </button>
                  )}
                </div>

                {/* Simulated Audio Waveform Visualizer */}
                {isRecording && (
                  <div className="flex items-center justify-center gap-1 h-8 pt-2">
                    {[12, 24, 16, 32, 28, 14, 30, 20, 15, 26, 18].map((h, i) => (
                      <span
                        key={i}
                        className="w-1 bg-rose-500 rounded-full animate-bounce"
                        style={{ height: `${h}px`, animationDelay: `${i * 70}ms` }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Transcription & Suggested Rewrite text areas */}
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  Расшифровка голоса (STT):
                </label>
                <textarea
                  rows={3}
                  value={customTranscription}
                  onChange={(e) => setCustomTranscription(e.target.value)}
                  placeholder="Расшифровка появится автоматически после остановки записи или введите текст..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  Предлагаемая готовая замена (1-клик внедрение):
                </label>
                <textarea
                  rows={2}
                  value={suggestedRewrite}
                  onChange={(e) => setSuggestedRewrite(e.target.value)}
                  placeholder="Готовый улучшенный текст для кандидата..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                onClick={handleSaveComment}
                disabled={!customTranscription.trim()}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-600/20"
              >
                <Send className="w-4 h-4" />
                <span>Прикрепить отзыв к резюме</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Existing Voice Comments Feed */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <span>Все голосовые комментарии менторов ({candidate.voiceComments.length})</span>
              </span>
              <span className="text-xs text-slate-400 font-normal">
                Кандидат может принять правку в 1 клик
              </span>
            </h3>

            <div className="space-y-4">
              {candidate.voiceComments.map((comment) => (
                <div
                  key={comment.id}
                  className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 hover:border-slate-700 transition"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <img
                        src={comment.authorAvatar}
                        alt={comment.authorName}
                        className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-800"
                      />
                      <div>
                        <div className="text-xs font-bold text-white">
                          {comment.authorName}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {comment.authorRole} • {comment.timestamp}
                        </div>
                      </div>
                    </div>

                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">
                      {comment.tagLabel}
                    </span>
                  </div>

                  <div className="text-[11px] font-semibold text-indigo-400 mb-2">
                    Прикреплено к: {comment.sectionTitle}
                  </div>

                  <p className="text-xs text-slate-200 italic mb-3 bg-slate-900 p-3 rounded-lg border border-slate-800/80">
                    {comment.transcription}
                  </p>

                  {/* Audio playback + Accept rewrite bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
                    <button
                      onClick={() => playVoiceAudio(comment)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                        playingCommentId === comment.id
                          ? 'bg-rose-600 text-white animate-pulse'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {playingCommentId === comment.id ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                      <span>
                        {playingCommentId === comment.id ? 'Воспроизведение...' : `Слушать голос (${comment.audioDurationSeconds}с)`}
                      </span>
                    </button>

                    {comment.suggestedRewrite && (
                      <div className="flex items-center gap-2">
                        {comment.accepted ? (
                          <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Правка принята</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              onAcceptRewrite(comment.id, comment.sectionId, comment.suggestedRewrite!);
                              triggerConfetti();
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Принять замену в резюме</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
