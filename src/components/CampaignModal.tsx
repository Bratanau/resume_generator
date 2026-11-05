import React, { useState } from 'react';
import { TargetCampaign, CandidateResume } from '../types';
import { 
  Target, 
  Copy, 
  Check, 
  ExternalLink, 
  Plus, 
  Building2, 
  Sparkles,
  Link2
} from 'lucide-react';
import { triggerConfetti } from '../utils/helpers';

interface CampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: CandidateResume;
  onAddCampaign: (campaign: TargetCampaign) => void;
  onTriggerNotification: (msg: string) => void;
}

export const CampaignModal: React.FC<CampaignModalProps> = ({
  isOpen,
  onClose,
  candidate,
  onAddCampaign,
  onTriggerNotification,
}) => {
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [companyName, setCompanyName] = useState<string>('');
  const [slug, setSlug] = useState<string>('');
  const [roleTitle, setRoleTitle] = useState<string>('Senior Backend Engineer');
  const [customGreeting, setCustomGreeting] = useState<string>('');
  const [accentColor, setAccentColor] = useState<string>('#6366f1');

  if (!isOpen) return null;

  const handleCopyLink = (targetSlug: string) => {
    const url = `${window.location.origin}/?target=${targetSlug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(targetSlug);
    setTimeout(() => setCopiedSlug(null), 2500);
    onTriggerNotification(`📋 Ссылка для ${targetSlug} скопирована в буфер!`);
  };

  const handleCreateCampaign = () => {
    if (!companyName.trim() || !slug.trim()) return;

    const newCampaign: TargetCampaign = {
      id: `cmp-${Date.now()}`,
      slug: slug.toLowerCase().replace(/\s+/g, '-'),
      companyName,
      roleTitle,
      customGreeting: customGreeting || `Привет, команда ${companyName}! Рад показать профиль с акцентом на ваши задачи.`,
      accentColor,
      viewsCount: 0,
      status: 'active',
    };

    onAddCampaign(newCampaign);
    setShowCreateForm(false);
    setCompanyName('');
    setSlug('');
    setCustomGreeting('');
    triggerConfetti();
    onTriggerNotification('🚀 Персональная B2B-ссылка с трекингом создана!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                B2B Смарт-Ссылки (Campaign Slug Generator)
              </h2>
              <p className="text-xs text-slate-400">
                Создавайте уникальные ссылки под каждую компанию с персональным приветствием и вебвизором:
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Existing Campaigns List */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Активные целевые ссылки ({candidate.campaigns.length}):
          </span>

          {candidate.campaigns.map((camp) => {
            const isCopied = copiedSlug === camp.slug;
            return (
              <div
                key={camp.id}
                className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" style={{ color: camp.accentColor || '#6366f1' }} />
                    <span className="font-bold text-white text-sm">{camp.companyName}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-indigo-300 border border-slate-800">
                      ?target={camp.slug}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Роль: <strong className="text-slate-200">{camp.roleTitle}</strong> • {camp.viewsCount} просмотров • {camp.lastViewedAt || 'Еще не открывали'}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => handleCopyLink(camp.slug)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition cursor-pointer"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'Скопировано!' : 'Копировать'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Create New Campaign Button or Form */}
        {!showCreateForm ? (
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full py-3 rounded-xl border border-dashed border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/10 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Создать персонализированную ссылку для новой компании</span>
          </button>
        ) : (
          <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/40 space-y-3 text-xs animate-fadeIn">
            <div className="font-bold text-white text-xs">
              Параметры новой кампании
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Компания:</label>
                <input
                  type="text"
                  placeholder="Например: Сбер, Ozon, Kaspersky"
                  value={companyName}
                  onChange={(e) => {
                    setCompanyName(e.target.value);
                    if (!slug) setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Slug окончания ссылки:</label>
                <input
                  type="text"
                  placeholder="sber-core, ozon-fintech"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Персональное приветствие в шапке резюме:</label>
              <textarea
                rows={2}
                placeholder="Привет, команда Ozon! Этот профиль сфокусирован на моем опыте с Go и очередями сообщений..."
                value={customGreeting}
                onChange={(e) => setCustomGreeting(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                Отмена
              </button>
              <button
                onClick={handleCreateCampaign}
                disabled={!companyName || !slug}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold cursor-pointer"
              >
                Создать ссылку
              </button>
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-slate-800/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
