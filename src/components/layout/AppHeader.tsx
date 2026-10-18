import React from 'react';
import { Plus, Globe, Building2, ShieldCheck, ChevronDown, Check } from 'lucide-react';
import { OrganizationSettings, SupportedLanguage, User } from '../../types';
import { translations } from '../../i18n/translations';

interface AppHeaderProps {
  currentOrg: OrganizationSettings;
  allOrgs: OrganizationSettings[];
  currentUser: User;
  allUsers: User[];
  currentLang: SupportedLanguage;
  onSelectOrg: (orgId: string) => void;
  onSelectUser: (userId: string) => void;
  onSelectLang: (lang: SupportedLanguage) => void;
  onOpenNewInvoice: () => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentOrg,
  allOrgs,
  currentUser,
  allUsers,
  currentLang,
  onSelectOrg,
  onSelectUser,
  onSelectLang,
  onOpenNewInvoice,
  activeTab,
  onSelectTab,
}) => {
  const t = translations[currentLang];
  const [showOrgMenu, setShowOrgMenu] = React.useState(false);
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const [showLangMenu, setShowLangMenu] = React.useState(false);

  const languages: { code: SupportedLanguage; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: 'US' },
    { code: 'es', label: 'Español', flag: 'ES' },
    { code: 'fr', label: 'Français', flag: 'FR' },
    { code: 'de', label: 'Deutsch', flag: 'DE' },
    { code: 'ja', label: '日本語', flag: 'JP' },
    { code: 'ar', label: 'العربية', flag: 'SA' },
    { code: 'sw', label: 'Kiswahili', flag: 'KE' },
  ];

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-8 px-6 py-3.5 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100 no-print">
      {/* Zone 1: Brand title wordmark (single text element, no pills, no subtitles) */}
      <div className="flex items-center gap-4 shrink-0">
        <a
          href="#dashboard"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('dashboard');
          }}
          className="text-lg font-bold tracking-tight text-white whitespace-nowrap hover:text-indigo-400 transition-colors"
        >
          Invox SaaS
        </a>

        {/* Current Organization Switcher */}
        <div className="relative">
          <button
            onClick={() => {
              setShowOrgMenu(!showOrgMenu);
              setShowUserMenu(false);
              setShowLangMenu(false);
            }}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
            title="Switch Tenant Organization"
          >
            <Building2 className="w-3.5 h-3.5 text-indigo-400" />
            <span className="max-w-[140px] truncate">{currentOrg.name}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showOrgMenu && (
            <div className="absolute left-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-lg shadow-xl py-1 z-50">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Select Tenant Organization
              </div>
              {allOrgs.map((org) => (
                <button
                  key={org.id}
                  onClick={() => {
                    onSelectOrg(org.id);
                    setShowOrgMenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors ${
                    org.id === currentOrg.id ? 'bg-indigo-600/20 text-indigo-300' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="truncate">
                    <div className="font-medium text-slate-200">{org.name}</div>
                    <div className="text-[11px] text-slate-400">{org.currency} · {org.plan === 'pro' ? 'Pro Plan ($2/mo)' : 'Free Tier'}</div>
                  </div>
                  {org.id === currentOrg.id && <Check className="w-4 h-4 text-indigo-400 shrink-0 ml-2" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Zone 2: 4-5 clean single-line nav links with hover underlines */}
      <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-400">
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'dashboard' ? 'text-white border-b-2 border-indigo-500 pb-0.5' : ''
          }`}
        >
          {t.dashboard}
        </button>
        <button
          onClick={() => onSelectTab('invoices')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'invoices' ? 'text-white border-b-2 border-indigo-500 pb-0.5' : ''
          }`}
        >
          {t.invoices}
        </button>
        <button
          onClick={() => onSelectTab('branding')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'branding' ? 'text-white border-b-2 border-indigo-500 pb-0.5' : ''
          }`}
        >
          {t.brandingSettings}
        </button>
        <button
          onClick={() => onSelectTab('billing')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'billing' ? 'text-white border-b-2 border-indigo-500 pb-0.5' : ''
          }`}
        >
          {t.billingSubscription}
        </button>
        <button
          onClick={() => onSelectTab('api')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'api' ? 'text-white border-b-2 border-indigo-500 pb-0.5' : ''
          }`}
        >
          {t.apiSecurity}
        </button>
      </nav>

      {/* Zone 3: Primary Action + Controls */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Language selector */}
        <div className="relative">
          <button
            onClick={() => {
              setShowLangMenu(!showLangMenu);
              setShowOrgMenu(false);
              setShowUserMenu(false);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors"
            title="Change Language"
          >
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span className="uppercase font-mono text-[11px]">{currentLang}</span>
          </button>

          {showLangMenu && (
            <div className="absolute right-0 mt-2 w-40 bg-slate-900 border border-slate-700 rounded-lg shadow-xl py-1 z-50">
              {languages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => {
                    onSelectLang(l.code);
                    setShowLangMenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition-colors ${
                    l.code === currentLang ? 'bg-indigo-600/20 text-indigo-300' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>{l.label}</span>
                  <span className="text-[10px] text-slate-500 uppercase">{l.code}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Switcher / Role indicator */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowOrgMenu(false);
              setShowLangMenu(false);
            }}
            className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors"
            title="Switch User / Role"
          >
            <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] text-white font-bold">
              {currentUser.name.charAt(0)}
            </div>
            <span className="hidden sm:inline max-w-[100px] truncate">{currentUser.name}</span>
            <span className="text-[11px] text-indigo-400 font-mono">({currentUser.role.replace('_', ' ')})</span>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-lg shadow-xl py-1 z-50">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Simulate Role & User
              </div>
              {allUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    onSelectUser(u.id);
                    setShowUserMenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors ${
                    u.id === currentUser.id ? 'bg-indigo-600/20 text-indigo-300' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="truncate">
                    <div className="font-medium text-slate-200">{u.name}</div>
                    <div className="text-[11px] text-indigo-400 font-mono">{u.role} · {u.email}</div>
                  </div>
                  {u.id === currentUser.id && <Check className="w-4 h-4 text-indigo-400 shrink-0 ml-2" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 1 Primary Action */}
        <button
          onClick={onOpenNewInvoice}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t.newInvoice}</span>
        </button>
      </div>
    </header>
  );
};
