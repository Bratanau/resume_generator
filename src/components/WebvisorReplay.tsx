import React, { useState, useEffect, useRef } from 'react';
import { RecruiterSession } from '../types';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  FastForward, 
  Flame, 
  Eye, 
  MousePointer, 
  Sparkles, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Laptop, 
  MapPin, 
  BellRing,
  ExternalLink
} from 'lucide-react';
import { formatSeconds, triggerConfetti } from '../utils/helpers';

interface WebvisorReplayProps {
  sessions: RecruiterSession[];
  onTriggerPushAlert: (message: string) => void;
}

export const WebvisorReplay: React.FC<WebvisorReplayProps> = ({
  sessions,
  onTriggerPushAlert,
}) => {
  const [selectedSessionId, setSelectedSessionId] = useState<string>(sessions[0]?.id || '');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [currentProgress, setCurrentProgress] = useState<number>(0); // 0 to 100
  const [activeTab, setActiveTab] = useState<'player' | 'heatmap' | 'funnel'>('player');

  const selectedSession = sessions.find((s) => s.id === selectedSessionId) || sessions[0];
  const timerRef = useRef<any>(null);

  // Playback timer loop
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 100;
          }
          return prev + 1 * playbackSpeed;
        });
      }, 250);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackSpeed]);

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentProgress(0);
  };

  // Calculate simulated cursor position based on progress
  const simulatedTimeSeconds = Math.round((currentProgress / 100) * (selectedSession?.durationSeconds || 120));
  
  // Interpolate cursor coords
  const cursorX = Math.min(85, Math.max(15, 30 + Math.sin(currentProgress / 8) * 35));
  const cursorY = Math.min(90, Math.max(10, currentProgress * 0.85));

  // Determine current thought bubble
  let recruiterThought = 'Смотрит шапку резюме и контакты...';
  if (currentProgress > 15 && currentProgress <= 45) {
    recruiterThought = '🔍 Вчитывается в метрику "32 000 RPS и p99 задержка 55мс" в опыте PayFlow...';
  } else if (currentProgress > 45 && currentProgress <= 80) {
    recruiterThought = '🔥 Открыл пет-проект HyperStream! Изучает eBPF и Lock-free RingBuffer (58 секунд внимания!)...';
  } else if (currentProgress > 80 && currentProgress < 98) {
    recruiterThought = '⚡ Кликает по ссылке на GitHub и копирует Telegram для связи!';
  } else if (currentProgress >= 98) {
    recruiterThought = '✅ Просмотр завершен. Кандидат добавлен в шорт-лист на технический скрининг.';
  }

  return (
    <div className="space-y-6">
      {/* Top Funnel KPI Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="text-slate-400 text-xs font-medium">Отправлено ссылок</div>
          <div className="text-2xl font-black text-white mt-1">54</div>
          <div className="text-[11px] text-slate-400 mt-0.5">В топ-10 IT-компаний</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="text-slate-400 text-xs font-medium">Открытия (Open Rate)</div>
          <div className="text-2xl font-black text-indigo-400 mt-1">38 <span className="text-xs font-semibold text-slate-400">/ 70%</span></div>
          <div className="text-[11px] text-emerald-400 mt-0.5">↑ +25% выше PDF</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="text-slate-400 text-xs font-medium">Глубокое чтение (&gt;30с)</div>
          <div className="text-2xl font-black text-amber-400 mt-1">26 <span className="text-xs font-semibold text-slate-400">/ 68%</span></div>
          <div className="text-[11px] text-slate-400 mt-0.5">Вдумчивый анализ</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="text-slate-400 text-xs font-medium">Клики в GitHub/Код</div>
          <div className="text-2xl font-black text-purple-400 mt-1">14 <span className="text-xs font-semibold text-slate-400">/ 53%</span></div>
          <div className="text-[11px] text-slate-400 mt-0.5">Смотрят пет-проекты</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg col-span-2 sm:col-span-1">
          <div className="text-slate-400 text-xs font-medium">Офферы / Скрининги</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">9 <span className="text-xs font-semibold text-slate-400">приглашений</span></div>
          <div className="text-[11px] text-emerald-400 mt-0.5">Конверсия 34%</div>
        </div>
      </div>

      {/* Main Webvisor Console */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-emerald-400 animate-pulse" />
              <h2 className="text-lg font-bold text-white">
                Шпионский Webvisor (Запись действий рекрутера)
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Смотрите точную запись движения мыши, скролла и задержки внимания нанимающих менеджеров:
            </p>
          </div>

          {/* Sub-tabs: Player vs Heatmap vs Funnel */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('player')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'player'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              <span>Видео-реплей</span>
            </button>

            <button
              onClick={() => setActiveTab('heatmap')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'heatmap'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>Теплокарта внимания</span>
            </button>
          </div>
        </div>

        {/* Recruiter Session Cards Selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-4">
          {sessions.map((s) => {
            const isSelected = s.id === selectedSession.id;
            return (
              <div
                key={s.id}
                onClick={() => {
                  setSelectedSessionId(s.id);
                  handleReset();
                }}
                className={`cursor-pointer rounded-xl p-3.5 border transition-all text-left ${
                  isSelected
                    ? 'bg-indigo-950/40 border-indigo-500 shadow-md ring-1 ring-indigo-500'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={s.recruiterAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-700"
                    />
                    <div>
                      <div className="text-xs font-bold text-white leading-tight">
                        {s.company}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {s.recruiterTitle}
                      </div>
                    </div>
                  </div>

                  {s.status === 'watching_now' ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> LIVE
                    </span>
                  ) : s.status === 'interview_invited' ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      Интервью ✓
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-mono">
                      {s.startedAt}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-1 mt-3 pt-2 border-t border-slate-800/80 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Длительность</span>
                    <span className="font-bold text-slate-200">{formatSeconds(s.durationSeconds)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Доскролл</span>
                    <span className="font-bold text-indigo-300">{s.scrollDepth}%</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Клики</span>
                    <span className="font-bold text-emerald-300">{s.clickedLinks.length} ссылки</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* AI Insight banner for current session */}
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/40 via-slate-950 to-indigo-950/40 border border-amber-500/30 mb-5 flex items-start gap-3 text-xs">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold text-amber-200 block mb-0.5">
              Инсайт CVision:
            </span>
            <p className="text-slate-200">
              {selectedSession.insight}
            </p>
          </div>
          <button
            onClick={() => onTriggerPushAlert(`🔔 Рекрутер ${selectedSession.company} только что повторно открыл ваше резюме!`)}
            className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 shrink-0 font-medium flex items-center gap-1"
          >
            <BellRing className="w-3 h-3" />
            <span>Тест Пуш</span>
          </button>
        </div>

        {/* TAB 1: PLAYER */}
        {activeTab === 'player' && (
          <div className="space-y-4">
            {/* Virtual Browser Window */}
            <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl relative">
              {/* Browser chrome header */}
              <div className="bg-slate-900/90 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="font-mono text-[11px] text-slate-400 ml-2">
                    https://cvision.app/cv/alex-novikov?ref={selectedSession.company.replace(/\s+/g, '-').toLowerCase()}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[11px]">
                  <span className="flex items-center gap-1">
                    <Laptop className="w-3 h-3" /> {selectedSession.device}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-rose-400" /> {selectedSession.location}
                  </span>
                </div>
              </div>

              {/* Viewport canvas with simulated scrolling & cursor */}
              <div 
                className="relative h-96 overflow-hidden bg-slate-900 select-none transition-all duration-300"
                style={{
                  backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(99, 102, 241, 0.05) 0%, transparent 70%)'
                }}
              >
                {/* Scaled Mini Representation of the Candidate Resume */}
                <div 
                  className="p-6 transition-transform duration-300 ease-out text-slate-300"
                  style={{ transform: `translateY(-${currentProgress * 2.5}px)` }}
                >
                  <div className="space-y-6 max-w-2xl mx-auto">
                    {/* Mini Header */}
                    <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-indigo-600/40 border border-indigo-500 flex items-center justify-center font-bold text-white">
                          AN
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">Алексей Новиков</div>
                          <div className="text-xs text-indigo-400">Senior Full-Stack & Highload Architect</div>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-slate-400">
                        7+ лет проектирую распределенные сервисы с нагрузкой от 25k RPS...
                      </div>
                    </div>

                    {/* Mini Experience Block (HOT ZONE) */}
                    <div className="p-4 rounded-xl bg-slate-950/80 border border-rose-500/40 relative">
                      <div className="flex items-center justify-between text-xs font-bold text-white mb-2">
                        <span>Lead Backend Engineer @ PayFlow</span>
                        <span className="text-emerald-400 font-mono">32,000 RPS • -88% Latency</span>
                      </div>
                      <p className="text-xs text-slate-300">
                        Спроектировал асинхронный платежный конвейер на базе Kafka и Redis Streams. Оптимизировал 12 Тб PostgreSQL.
                      </p>
                      <div className="mt-2 flex gap-1">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">Kafka</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">Go</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">Redis</span>
                      </div>
                    </div>

                    {/* Mini Pet Projects Block (HOTTEST ZONE) */}
                    <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/40 relative">
                      <div className="flex items-center justify-between text-xs font-bold text-white mb-1">
                        <span>Pet Project: HyperStream (Go & eBPF)</span>
                        <span className="text-amber-400">⭐ 480 stars</span>
                      </div>
                      <p className="text-xs text-slate-300">
                        Ультра-легковесная шина сообщений с нулевым копированием. Sub-microsecond latency.
                      </p>
                      <div className="mt-2 text-[11px] text-emerald-400 font-mono">
                        1.2M msg/sec throughput • p99 &lt; 80µs
                      </div>
                    </div>

                    {/* Mini Education (COLD ZONE) */}
                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                      <div className="font-bold text-slate-300">МГТУ им. Н.Э. Баумана (ИУ7)</div>
                      <div className="text-slate-400">Программная инженерия, Магистр с отличием</div>
                    </div>
                  </div>
                </div>

                {/* Simulated Recruiter Mouse Cursor */}
                <div 
                  className="absolute pointer-events-none transition-all duration-150 ease-out z-30"
                  style={{
                    left: `${cursorX}%`,
                    top: `${cursorY}%`,
                  }}
                >
                  <div className="relative">
                    <MousePointer className="w-5 h-5 text-rose-500 drop-shadow-[0_2px_8px_rgba(244,63,94,0.8)] fill-rose-500" />
                    
                    {/* Ripple on active click */}
                    {currentProgress > 75 && currentProgress < 85 && (
                      <span className="absolute -top-2 -left-2 w-8 h-8 rounded-full border-2 border-emerald-400 animate-ping" />
                    )}

                    {/* Recruiter Live Thought Bubble */}
                    <div className="absolute left-6 top-0 bg-slate-950/95 border border-indigo-500/50 text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap backdrop-blur-md">
                      {recruiterThought}
                    </div>
                  </div>
                </div>
              </div>

              {/* Player Controls Toolbar */}
              <div className="bg-slate-900 p-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 transition cursor-pointer"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </button>

                  <button
                    onClick={handleReset}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                    title="Начать заново"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <div className="text-xs font-mono text-slate-300">
                    <span className="text-indigo-400 font-bold">{formatSeconds(simulatedTimeSeconds)}</span>
                    <span className="text-slate-400"> / {formatSeconds(selectedSession.durationSeconds)}</span>
                  </div>
                </div>

                {/* Progress Scrubber */}
                <div className="flex-1 w-full max-w-md mx-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={currentProgress}
                    onChange={(e) => setCurrentProgress(Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>

                {/* Speed Controls */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 mr-1">Скорость:</span>
                  {[1, 2, 4].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => setPlaybackSpeed(spd)}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
                        playbackSpeed === spd
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: HEATMAP BREAKDOWN */}
        {activeTab === 'heatmap' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950 rounded-xl p-5 border border-slate-800">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-400" />
                  <span>Распределение времени внимания рекрутеров (сек)</span>
                </h3>

                <div className="space-y-4 text-xs">
                  {selectedSession.topSectionsDwell.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between font-medium">
                        <span className="text-slate-200">{item.title}</span>
                        <span className="font-bold text-indigo-400 font-mono">{item.seconds} сек</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            item.seconds > 40
                              ? 'bg-rose-500'
                              : item.seconds > 20
                              ? 'bg-amber-500'
                              : 'bg-sky-500'
                          }`}
                          style={{ width: `${Math.min(100, (item.seconds / 60) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span>Рекомендации CVision для следующего отклика</span>
                  </h3>
                  <div className="space-y-3 text-xs text-slate-300 mt-3">
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                      <strong className="text-emerald-300 block mb-0.5">
                        ✓ Пет-проект HyperStream генерирует 58с удержания!
                      </strong>
                      Рекрутеры BigTech в 89% случаев кликают на исходники. Рекомендуем в целевой ссылке для банков ставить его сразу после первого места работы.
                    </div>

                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                      <strong className="text-amber-300 block mb-0.5">
                        ⚠️ Образование пролистывают за 4 секунды
                      </strong>
                      Не тратьте драгоценное место первого экрана на университет — поднимайте в шапку измеримые метрики (32k RPS, p99 latency).
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={() => {
                      triggerConfetti();
                      onTriggerPushAlert('💡 Рекомендации применены к умной ссылке!');
                    }}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow"
                  >
                    Применить рекомендации к смарт-ссылке
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
