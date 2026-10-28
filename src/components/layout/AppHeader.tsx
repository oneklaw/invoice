import React from 'react';
import { Plus, Globe, Building2, ShieldCheck, ChevronDown, Check, LogOut, ArrowLeftRight, Menu, X, Search } from 'lucide-react';
import { Client, Invoice, OrganizationSettings, SupportedLanguage, User } from '../../types';
import { translations } from '../../i18n/translations';
import { GlobalSearchBar } from '../search/GlobalSearchBar';
import { currencyService } from '../../services/currencyService';
import { storageService } from '../../services/storage';

interface AppHeaderProps {
  currentOrg: OrganizationSettings;
  allOrgs: OrganizationSettings[];
  currentUser: User;
  allUsers: User[];
  currentLang: SupportedLanguage;
  invoices: Invoice[];
  clients: Client[];
  onSelectOrg: (orgId: string) => void;
  onSelectUser: (userId: string) => void;
  onSelectLang: (lang: SupportedLanguage) => void;
  onOpenNewInvoice: () => void;
  onLogout: () => void;
  onSelectInvoice: (invoiceId: string) => void;
  onSelectClient: (clientId: string) => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenCurrencyConverter?: () => void;
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentOrg,
  allOrgs,
  currentUser,
  allUsers,
  currentLang,
  invoices,
  clients,
  onSelectOrg,
  onSelectUser,
  onSelectLang,
  onOpenNewInvoice,
  onLogout,
  onSelectInvoice,
  onSelectClient,
  activeTab,
  onSelectTab,
  onOpenCurrencyConverter,
  isMobileMenuOpen,
  onToggleMobileMenu,
}) => {
  const t = translations[currentLang];
  const [showOrgMenu, setShowOrgMenu] = React.useState(false);
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const [showLangMenu, setShowLangMenu] = React.useState(false);
  const [showMobileSearch, setShowMobileSearch] = React.useState(false);

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
    <header className="sticky top-0 z-40 flex items-center justify-between gap-2 sm:gap-4 lg:gap-6 px-3 sm:px-6 py-2.5 sm:py-3.5 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100 no-print">
      {/* Zone 1: Mobile Hamburger + Brand title wordmark with official KERO Logo */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Mobile Navigation Drawer Trigger */}
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="md:hidden flex items-center justify-center w-10 h-10 -ml-1 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 shrink-0"
            aria-label={isMobileMenuOpen ? 'Close navigation drawer' : 'Open navigation drawer'}
            title="Navigation Menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-indigo-400" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        )}

        <a
          href="#dashboard"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('dashboard');
          }}
          className="flex items-center gap-2 text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap hover:opacity-95 transition-all group"
          title="KERO INVOICE SaaS"
        >
          <div className="relative flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 bg-white rounded-lg p-0.5 shadow-sm border border-slate-700/80 group-hover:border-indigo-400 transition-colors shrink-0 overflow-hidden">
            <img
              src="/kero-logo.png"
              alt="KERO Logo"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-sm sm:text-base font-extrabold tracking-tight text-white leading-tight flex items-center gap-1.5">
              <span>KERO</span>
              <span className="text-indigo-400">INVOICE</span>
              <span className="text-[9px] sm:text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                SaaS
              </span>
            </span>
            <span className="text-[8px] font-mono tracking-wider text-slate-400 uppercase hidden lg:inline">
              Technology · Inspirations · Solutions
            </span>
          </div>
        </a>

        {/* Isolated Tenant Organization Badge (hidden on smallest screens to preserve viewport space) */}
        <div className="relative hidden sm:block">
          <button
            onClick={() => {
              setShowOrgMenu(!showOrgMenu);
              setShowUserMenu(false);
              setShowLangMenu(false);
            }}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors whitespace-nowrap shrink-0 group"
            title="Inspect Tenant Data Isolation & Boundary"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="max-w-[110px] sm:max-w-[130px] truncate text-slate-200 font-semibold">{currentOrg.name}</span>
            <span className="text-[11px] text-slate-400 font-normal">·</span>
            <span className="text-[11px] text-emerald-400 font-medium hidden md:inline">Isolated</span>
          </button>

          {showOrgMenu && (
            <div className="absolute left-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Tenant Privacy & Boundary</span>
                </div>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                  100% Isolated
                </span>
              </div>

              <div className="mt-2.5 space-y-2 text-xs">
                <div className="p-2 bg-slate-950/70 border border-slate-800/80 rounded-lg">
                  <div className="text-[10px] uppercase font-mono text-slate-400">Organization Tenant</div>
                  <div className="font-semibold text-slate-100 truncate">{currentOrg.name}</div>
                  <div className="text-[11px] text-slate-400 truncate">{currentOrg.legalName}</div>
                  <div className="text-[10px] text-indigo-400 font-mono mt-0.5">ID: {currentOrg.id}</div>
                </div>

                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between py-1 border-b border-slate-800/50">
                    <span className="text-slate-400">Data Visibility</span>
                    <span className="text-emerald-400 font-medium">Strictly Tenant Scoped</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/50">
                    <span className="text-slate-400">Cross-Tenant Access</span>
                    <span className="text-rose-400 font-medium">Blocked & Enforced</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/50">
                    <span className="text-slate-400">Operating Currency</span>
                    <span className="text-indigo-400 font-mono font-semibold">{currentOrg.currency}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/50">
                    <span className="text-slate-400">Cloud SQL Partition</span>
                    <span className="text-slate-300 font-mono text-[10px]">europe-west2 / Postgres</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Google Drive Folder</span>
                    <span className="text-slate-300 truncate max-w-[120px]">{currentOrg.googleDriveIntegration?.folderName || 'Invoices'}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Data privacy guarantee: Invoices, clients, team members, audit logs, and keys are strictly segregated and inaccessible to other organizations.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Global Full-Text Indexed Search Bar (Responsive Desktop & Mobile Toggle) */}
      <div className="hidden md:flex flex-1 max-w-xs lg:max-w-md mx-2">
        <GlobalSearchBar
          invoices={invoices}
          clients={clients}
          orgId={currentOrg.id}
          onSelectInvoice={onSelectInvoice}
          onSelectClient={onSelectClient}
        />
      </div>

      {/* Mobile Search Overlay Modal */}
      {showMobileSearch && (
        <div className="md:hidden fixed inset-x-2 top-2 z-50 bg-slate-900 border border-indigo-500/80 rounded-xl shadow-2xl p-2.5 flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex-1">
            <GlobalSearchBar
              invoices={invoices}
              clients={clients}
              orgId={currentOrg.id}
              onSelectInvoice={(id) => {
                setShowMobileSearch(false);
                onSelectInvoice(id);
              }}
              onSelectClient={(id) => {
                setShowMobileSearch(false);
                onSelectClient(id);
              }}
            />
          </div>
          <button
            onClick={() => setShowMobileSearch(false)}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors shrink-0"
            aria-label="Close search"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Zone 2: 4-5 clean single-line nav links with hover underlines */}
      <nav className="hidden xl:flex items-center gap-6 text-sm font-medium text-slate-400">
        <button
          onClick={() => onSelectTab('invoices')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'invoices' ? 'text-white border-b-2 border-indigo-500 pb-0.5' : ''
          }`}
        >
          {t.invoices}
        </button>
        <button
          onClick={() => onSelectTab('clients')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'clients' ? 'text-white border-b-2 border-indigo-500 pb-0.5' : ''
          }`}
        >
          {t.clients}
        </button>
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'dashboard' ? 'text-white border-b-2 border-indigo-500 pb-0.5' : ''
          }`}
        >
          {t.dashboard}
        </button>
        <button
          onClick={() => onSelectTab('saas-revenue')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'saas-revenue' ? 'text-white border-b-2 border-indigo-500 pb-0.5' : ''
          }`}
        >
          Tenants & Support
        </button>
        <button
          onClick={() => onSelectTab('branding')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'branding' ? 'text-white border-b-2 border-indigo-500 pb-0.5' : ''
          }`}
        >
          Branding & Theme
        </button>
      </nav>

      {/* Zone 3: Primary Action + Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Mobile Search Trigger Icon */}
        <button
          onClick={() => setShowMobileSearch(true)}
          className="md:hidden flex items-center justify-center min-h-[38px] min-w-[38px] text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors"
          title="Search invoices, clients, items"
          aria-label="Open search bar"
        >
          <Search className="w-4 h-4 text-slate-400" />
        </button>
        {/* World Currencies & FX Rates */}
        {onOpenCurrencyConverter && (
          <button
            onClick={onOpenCurrencyConverter}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors group"
            title="World Currency Converter & Live FX Rates"
          >
            <span className="text-sm">{currencyService.getCurrency(currentOrg.currency).flag}</span>
            <span className="font-mono text-indigo-400 font-bold text-[11px]">{currentOrg.currency}</span>
            <span className="text-[10px] text-slate-400 font-medium hidden xl:inline">FX Rates</span>
          </button>
        )}

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
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Team Profiles</span>
                <span className="text-[10px] text-emerald-400 font-mono lowercase">isolated</span>
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
              <div className="pt-1 mt-1 border-t border-slate-800 space-y-0.5">
                <button
                  onClick={() => {
                    if (confirm('Clear all cached data and restore clean slate?')) {
                      storageService.purgeAllDemoData();
                      onLogout();
                    }
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  <span>Reset / Clear Storage</span>
                </button>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Lock Session & Sign Out</span>
                </button>
              </div>
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

        {/* Quick Lock Button */}
        <button
          onClick={onLogout}
          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors shrink-0"
          title="Lock Session / Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
