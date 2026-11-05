import React from 'react';
import { 
  FileText, 
  Eye, 
  Sparkles, 
  Mic, 
  Award, 
  Share2, 
  Download, 
  Radio, 
  Send
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'passport' | 'webvisor' | 'coach' | 'voice' | 'bragsheet';
  setActiveTab: (tab: 'passport' | 'webvisor' | 'coach' | 'voice' | 'bragsheet') => void;
  onOpenCampaignModal: () => void;
  onOpenExportModal: () => void;
  onSimulateRecruiterVisit: () => void;
  voiceCommentsCount: number;
  liveViewsActive: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenCampaignModal,
  onOpenExportModal,
  onSimulateRecruiterVisit,
  voiceCommentsCount,
  liveViewsActive,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Brand Logo & Tag */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setActiveTab('passport')}
              className="flex items-center gap-2 group text-left cursor-pointer focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
                <Radio className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-indigo-100 to-purple-200 bg-clip-text text-transparent">
                    CVision
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                    B2B SaaS
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Candidate Sales CRM & Smart Web-Passport
                </p>
              </div>
            </button>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800/80">
            <button
              onClick={() => setActiveTab('passport')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'passport'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Паспорт-Резюме</span>
            </button>

            <button
              onClick={() => setActiveTab('webvisor')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all relative ${
                activeTab === 'webvisor'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Eye className="w-4 h-4 text-emerald-400" />
              <span>Webvisor & Теплокарта</span>
              {liveViewsActive && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('coach')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'coach'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>AI STAR-Коуч & Roast</span>
            </button>

            <button
              onClick={() => setActiveTab('voice')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all relative ${
                activeTab === 'voice'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Mic className="w-4 h-4 text-rose-400" />
              <span>Голосовая прожарка</span>
              {voiceCommentsCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-500/30 text-rose-300 border border-rose-500/40">
                  {voiceCommentsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('bragsheet')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'bragsheet'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Award className="w-4 h-4 text-purple-400" />
              <span>Bragsheet Капитал</span>
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Recruiter Simulation Trigger */}
            <button
              onClick={onSimulateRecruiterVisit}
              title="Симулировать открытие ссылки рекрутером прямо сейчас"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all shadow-sm"
            >
              <Send className="w-3.5 h-3.5 animate-bounce" />
              <span className="hidden lg:inline">Тест: Клик рекрутера</span>
            </button>

            {/* Campaign Smart Link Button */}
            <button
              onClick={onOpenCampaignModal}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700/80 transition-all"
            >
              <Share2 className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Смарт-ссылка</span>
            </button>

            {/* Export Button */}
            <button
              onClick={onOpenExportModal}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/20 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ATS Экспорт</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="md:hidden flex items-center justify-between py-2 border-t border-slate-800/80 overflow-x-auto gap-2 text-xs scrollbar-none">
          <button
            onClick={() => setActiveTab('passport')}
            className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap font-medium ${
              activeTab === 'passport' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            Резюме
          </button>
          <button
            onClick={() => setActiveTab('webvisor')}
            className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap font-medium ${
              activeTab === 'webvisor' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            Webvisor
          </button>
          <button
            onClick={() => setActiveTab('coach')}
            className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap font-medium ${
              activeTab === 'coach' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            AI Коуч
          </button>
          <button
            onClick={() => setActiveTab('voice')}
            className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap font-medium ${
              activeTab === 'voice' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            Прожарка ({voiceCommentsCount})
          </button>
          <button
            onClick={() => setActiveTab('bragsheet')}
            className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap font-medium ${
              activeTab === 'bragsheet' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            Bragsheet
          </button>
        </div>
      </div>
    </header>
  );
};
