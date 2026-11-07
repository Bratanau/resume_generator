import React, { useState, useEffect } from 'react';
import { 
  CandidateResume, 
  RecruiterSession, 
  BragsheetEntry, 
  VoiceComment, 
  TargetCampaign 
} from '../types';
import { 
  initialCandidate, 
  initialSessions, 
  initialBragsheetEntries 
} from '../data/initialData';
import { Navbar } from '../components/Navbar';
import { ResumeView } from '../components/ResumeView';
import { WebvisorReplay } from '../components/WebvisorReplay';
import { AiCoachView } from '../components/AiCoachView';
import { VoiceReviewMode } from '../components/VoiceReviewMode';
import { BragsheetView } from '../components/BragsheetView';
import { CampaignModal } from '../components/CampaignModal';
import { ExportModal } from '../components/ExportModal';
import { triggerConfetti } from '../utils/helpers';
import { BellRing } from 'lucide-react';

export default function OldApp({ onSwitchToSimple }: { onSwitchToSimple?: () => void }) {
  const [activeTab, setActiveTab] = useState<'passport' | 'webvisor' | 'coach' | 'voice' | 'bragsheet'>('passport');
  const [candidate, setCandidate] = useState<CandidateResume>(initialCandidate);
  const [sessions, setSessions] = useState<RecruiterSession[]>(initialSessions);
  const [bragsheetEntries, setBragsheetEntries] = useState<BragsheetEntry[]>(initialBragsheetEntries);
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);
  const [showHeatmapOverlay, setShowHeatmapOverlay] = useState<boolean>(false);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [coachInitialContext, setCoachInitialContext] = useState<{ rawText: string; role: string } | null>(null);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const targetParam = params.get('target');
      if (targetParam) {
        const found = candidate.campaigns.find(
          (c) => c.slug.toLowerCase() === targetParam.toLowerCase()
        );
        if (found) {
          setActiveCampaignId(found.id);
          showToast(`🎯 Активирована персональная ссылка для: ${found.companyName}`);
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  const handleSimulateRecruiterVisit = () => {
    const companies = ['Яндекс (Cloud)', 'Т-Банк (Core)', 'Авито (Platform)', 'Ozon (Fintech)', 'Kaspersky Lab'];
    const randomCompany = companies[Math.floor(Math.random() * companies.length)];
    
    setCandidate((prev) => {
      const updatedCampaigns = prev.campaigns.map((c, idx) => {
        if ((activeCampaignId && c.id === activeCampaignId) || (!activeCampaignId && idx === 0)) {
          return {
            ...c,
            viewsCount: c.viewsCount + 1,
            lastViewedAt: 'Только что',
          };
        }
        return c;
      });
      return { ...prev, campaigns: updatedCampaigns };
    });

    const newSession: RecruiterSession = {
      id: `rec-live-${Date.now()}`,
      company: randomCompany,
      recruiterTitle: 'Hiring Manager & Tech Lead',
      recruiterAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
      device: 'MacBook Pro (Chrome macOS)',
      location: 'Москва (Корпоративная сеть)',
      startedAt: 'Прямо сейчас',
      durationSeconds: 110,
      scrollDepth: 91,
      status: 'watching_now',
      topSectionsDwell: [
        { sectionId: 'exp-1', title: 'Опыт: 32k RPS в PayFlow', seconds: 44 },
        { sectionId: 'petProjects', title: 'Пет-проект HyperStream (Go)', seconds: 52 },
      ],
      clickedLinks: ['GitHub', 'Telegram'],
      insight: `🔥 Рекрутер ${randomCompany} прямо сейчас перешел по вашей смарт-ссылке! 52 секунды удержания на пет-проекте HyperStream.`,
      events: [
        { t: 0, type: 'scroll', scrollY: 0, y: 10 },
        { t: 1500, type: 'mouse', x: 35, y: 25 },
        { t: 4000, type: 'dwell', sectionId: 'exp-1', dwellMs: 20000 },
        { t: 8000, type: 'click', x: 75, y: 60 }
      ],
    };

    setSessions((prev) => [newSession, ...prev]);
    triggerConfetti();
    showToast(`🔔 ПУШ-УВЕДОМЛЕНИЕ: Ваше резюме смотрят прямо сейчас (${randomCompany})!`);
  };

  const handleAddVoiceComment = (comment: VoiceComment) => {
    setCandidate((prev) => ({
      ...prev,
      voiceComments: [comment, ...prev.voiceComments],
    }));
  };

  const handleAcceptRewrite = (commentId: string, sectionId: string, rewrite: string) => {
    setCandidate((prev) => {
      const updatedComments = prev.voiceComments.map((c) =>
        c.id === commentId ? { ...c, accepted: true } : c
      );

      const updatedExperience = prev.experience.map((exp) => {
        if (exp.id === sectionId) {
          const newBullets = [...exp.starBullets];
          if (newBullets.length > 0) {
            newBullets[0] = rewrite;
          } else {
            newBullets.push(rewrite);
          }
          return { ...exp, starBullets: newBullets };
        }
        return exp;
      });

      return {
        ...prev,
        voiceComments: updatedComments,
        experience: updatedExperience,
      };
    });

    showToast('✨ Правка ментора успешно применена в резюме!');
  };

  const handleApplyBulletToResume = (newBullet: string, metricLabel?: string, metricValue?: string) => {
    setCandidate((prev) => {
      const expCopy = [...prev.experience];
      if (expCopy.length > 0) {
        expCopy[0] = {
          ...expCopy[0],
          starBullets: [newBullet, ...expCopy[0].starBullets.slice(0, 3)],
          metrics: metricValue
            ? [{ label: metricLabel || 'Метрика', value: metricValue, changeType: 'highlight' }, ...expCopy[0].metrics.slice(0, 3)]
            : expCopy[0].metrics,
        };
      }
      return { ...prev, experience: expCopy };
    });

    setActiveTab('passport');
    showToast('🚀 Новая STAR-формулировка вставлена в опыт работы!');
  };

  const handleAddBragsheetEntry = (entry: BragsheetEntry) => {
    setBragsheetEntries((prev) => [entry, ...prev]);
  };

  const handleAddCampaign = (campaign: TargetCampaign) => {
    setCandidate((prev) => ({
      ...prev,
      campaigns: [...prev.campaigns, campaign],
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white font-sans antialiased">
      {/* Switcher Banner to Simple Version */}
      {onSwitchToSimple && (
        <div className="bg-indigo-950 border-b border-indigo-500/40 px-4 py-2 flex items-center justify-between text-xs text-indigo-200">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">Версия 1: B2B CRM & Webvisor PRO</span>
            <span className="hidden sm:inline text-indigo-300">• Полный HR-Tech комбайн</span>
          </div>
          <button
            onClick={onSwitchToSimple}
            className="px-3 py-1 rounded-lg bg-white text-indigo-950 font-bold hover:bg-slate-100 transition shadow"
          >
            ← Переключить на упрощённую версию (AI-диалог, белый фон)
          </button>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCampaignModal={() => setIsCampaignModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onSimulateRecruiterVisit={handleSimulateRecruiterVisit}
        voiceCommentsCount={candidate.voiceComments.length}
        liveViewsActive={true}
      />

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-slate-900 border border-indigo-500/50 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-slideUp backdrop-blur-md">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shrink-0">
            <BellRing className="w-4 h-4 text-white animate-bounce" />
          </div>
          <p className="text-xs font-semibold leading-snug">
            {toastMessage}
          </p>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'passport' && (
          <ResumeView
            candidate={candidate}
            activeCampaignId={activeCampaignId}
            onSelectCampaign={(id) => setActiveCampaignId(id)}
            onOpenCoachWithContext={(text, role) => {
              setCoachInitialContext({ rawText: text, role });
              setActiveTab('coach');
            }}
            showHeatmapOverlay={showHeatmapOverlay}
            setShowHeatmapOverlay={setShowHeatmapOverlay}
            onAcceptRewrite={handleAcceptRewrite}
          />
        )}

        {activeTab === 'webvisor' && (
          <WebvisorReplay
            sessions={sessions}
            onTriggerPushAlert={showToast}
          />
        )}

        {activeTab === 'coach' && (
          <AiCoachView
            initialRawText={coachInitialContext?.rawText}
            initialRole={coachInitialContext?.role}
            onApplyBulletToResume={handleApplyBulletToResume}
            onTriggerNotification={showToast}
          />
        )}

        {activeTab === 'voice' && (
          <VoiceReviewMode
            candidate={candidate}
            onAddVoiceComment={handleAddVoiceComment}
            onAcceptRewrite={handleAcceptRewrite}
            onTriggerNotification={showToast}
          />
        )}

        {activeTab === 'bragsheet' && (
          <BragsheetView
            entries={bragsheetEntries}
            onAddEntry={handleAddBragsheetEntry}
            onTriggerNotification={showToast}
          />
        )}
      </main>

      <CampaignModal
        isOpen={isCampaignModalOpen}
        onClose={() => setIsCampaignModalOpen(false)}
        candidate={candidate}
        onAddCampaign={handleAddCampaign}
        onTriggerNotification={showToast}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        candidate={candidate}
        onTriggerNotification={showToast}
      />
    </div>
  );
}
