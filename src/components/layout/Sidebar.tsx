import React from 'react';
import {
  LayoutDashboard,
  FileText,
  Users,
  Palette,
  Shield,
  CreditCard,
  Key,
  History,
  Zap,
  Sparkles,
  Mail,
} from 'lucide-react';
import { OrganizationSettings, SupportedLanguage } from '../../types';
import { translations } from '../../i18n/translations';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  currentOrg: OrganizationSettings;
  currentLang: SupportedLanguage;
  onOpenUpgradeModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  currentOrg,
  currentLang,
  onOpenUpgradeModal,
}) => {
  const t = translations[currentLang];
  const isPro = currentOrg.plan === 'pro' && currentOrg.subscriptionStatus === 'active';
  const usedCount = currentOrg.invoiceCount || 0;
  const remainingFree = Math.max(0, 10 - usedCount);

  const navItems = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'invoices', label: t.invoices, icon: FileText },
    { id: 'emails', label: t.emailNotifications, icon: Mail },
    { id: 'clients', label: t.clients, icon: Users },
    { id: 'branding', label: t.brandingSettings, icon: Palette },
    { id: 'team', label: t.teamAndRoles, icon: Shield },
    { id: 'billing', label: t.billingSubscription, icon: CreditCard },
    { id: 'api', label: t.apiSecurity, icon: Key },
    { id: 'audit', label: t.auditLogs, icon: History },
    { id: 'cache', label: t.cachePerformance, icon: Zap },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 no-print select-none">
      <div className="p-4 space-y-6">
        {/* Navigation links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors text-left ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Subscription Quota Card at Bottom */}
      <div className="p-4 border-t border-slate-800/80">
        <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-slate-300">
              {isPro ? t.proPlan : t.freePlan}
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              {isPro ? '$2.00/mo' : `${usedCount}/10 Free`}
            </span>
          </div>

          {/* Progress bar for free tier */}
          {!isPro ? (
            <div className="space-y-2">
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    usedCount >= 10 ? 'bg-rose-500' : usedCount >= 7 ? 'bg-amber-500' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${Math.min(100, (usedCount / 10) * 100)}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-400">
                {usedCount >= 10 ? (
                  <span className="text-rose-400 font-medium">Quota reached (10/10)</span>
                ) : (
                  <span>{remainingFree} free invoice{remainingFree === 1 ? '' : 's'} remaining</span>
                )}
              </div>
              <button
                onClick={onOpenUpgradeModal}
                className="w-full mt-1 py-1.5 px-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Upgrade to Pro ($2/mo)</span>
              </button>
            </div>
          ) : (
            <div className="text-[11px] text-emerald-400 flex items-center gap-1.5 mt-1">
              <span>Unlimited Invoices Active · Visa •••• {currentOrg.cardLast4 || '4242'}</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
