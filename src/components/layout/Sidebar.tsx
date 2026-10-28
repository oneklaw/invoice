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
  Database,
  Building2,
  DollarSign,
  TrendingUp,
  Receipt,
  Headphones,
  Package,
} from 'lucide-react';
import { OrganizationSettings, SupportedLanguage, User } from '../../types';
import { translations } from '../../i18n/translations';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  currentOrg: OrganizationSettings;
  currentLang: SupportedLanguage;
  onOpenUpgradeModal: () => void;
  currentUser?: User;
}

interface SidebarNavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  note?: string;
  badge?: string;
}

interface SidebarNavGroup {
  heading: string;
  items: SidebarNavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  currentOrg,
  currentLang,
  onOpenUpgradeModal,
  currentUser,
}) => {
  const t = translations[currentLang];
  const isPro = currentOrg.plan === 'pro' && currentOrg.subscriptionStatus === 'active';
  const usedCount = currentOrg.invoiceCount || 0;
  const remainingFree = Math.max(0, 10 - usedCount);

  const isPlatformAdmin = currentUser?.role === 'super_admin';

  // Structured, memorable navigation groups with strict tenant privacy & role restrictions
  const navigationGroups: SidebarNavGroup[] = [
    {
      heading: 'Billing & Operations',
      items: [
        { id: 'invoices', label: t.invoices, icon: FileText, note: 'A4 PDF & CSV' },
        { id: 'clients', label: t.clients, icon: Users, note: 'Portals' },
        { id: 'inventory', label: 'Inventory', icon: Package, note: 'Stock & Reports' },
        { id: 'expenses', label: 'Expenses', icon: DollarSign, note: 'Spend' },
        { id: 'vendors', label: 'Vendors', icon: Building2, note: 'Payables' },
      ],
    },
    {
      heading: 'Insights & Platform',
      items: [
        { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
        ...(isPlatformAdmin
          ? [
              {
                id: 'saas-revenue',
                label: 'Tenants & Revenue',
                icon: TrendingUp,
                badge: 'Super Admin',
              },
            ]
          : []),
        { id: 'emails', label: 'Dispatches', icon: Mail },
      ],
    },
    {
      heading: isPlatformAdmin ? 'Administration & Platform Core' : 'Organization Settings',
      items: [
        { id: 'branding', label: 'Branding', icon: Palette },
        { id: 'team', label: 'Staff & Roles', icon: Shield, note: 'Invite Staff' },
        ...(isPlatformAdmin
          ? [
              { id: 'billing', label: 'Enterprise Billing', icon: CreditCard, note: 'Platform' },
              { id: 'database', label: 'Cloud SQL', icon: Database, note: 'Postgres' },
              { id: 'api', label: 'API Gateway', icon: Key, note: 'OAuth' },
            ]
          : []),
        { id: 'audit', label: 'Audit Trail', icon: History },
        { id: 'cache', label: 'Performance', icon: Zap },
      ],
    },
  ];

  return (
    <aside className="w-full h-full bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 no-print select-none">
      <div className="p-3.5 space-y-5 overflow-y-auto">
        {/* Brand Identification Card */}
        <div className="flex items-center gap-2.5 px-3 py-2 bg-slate-950/70 rounded-xl border border-slate-800/80 shadow-xs">
          <div className="h-8 w-8 bg-white rounded-lg p-0.5 shadow-sm border border-slate-700/80 flex items-center justify-center shrink-0 overflow-hidden">
            <img
              src="/kero-logo.png"
              alt="KERO Logo"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-black text-white tracking-tight truncate">
              KERO INVOICE SaaS
            </span>
            <span className="text-[9px] text-slate-400 font-mono truncate">
              Enterprise Billing Platform
            </span>
          </div>
        </div>

        {/* Navigation Sections */}
        {navigationGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            <div className="px-3 pb-1 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
              {group.heading}
            </div>
            <nav className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 min-h-[40px] text-xs font-medium rounded-lg transition-colors text-left ${
                      isActive
                        ? 'bg-slate-800 text-white font-semibold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-indigo-400' : 'text-slate-400'
                      }`}
                    />
                    <span className="truncate flex-1">{item.label}</span>

                    {item.note && !isActive && (
                      <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                        {item.note}
                      </span>
                    )}

                    {item.badge && (
                      <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Subscription Quota Card at Bottom */}
      <div className="p-3.5 border-t border-slate-800">
        <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-3">
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
                  <span className="text-rose-400 font-medium">Monthly quota reached (10/10)</span>
                ) : (
                  <span>{remainingFree} free invoice{remainingFree === 1 ? '' : 's'} remaining</span>
                )}
              </div>
              <button
                onClick={onOpenUpgradeModal}
                className="w-full mt-1 py-1.5 px-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Upgrade to Pro ($2/mo)</span>
              </button>
            </div>
          ) : (
            <div className="text-[11px] text-emerald-400 flex items-center gap-1.5 mt-0.5">
              <span>Unlimited Invoices Active · Visa •••• {currentOrg.cardLast4 || '4242'}</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
