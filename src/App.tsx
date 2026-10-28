import React, { useState, useEffect } from 'react';
import { storageService } from './services/storage';
import { Invoice, OrganizationSettings, SupportedLanguage, User } from './types';
import { AppHeader } from './components/layout/AppHeader';
import { Sidebar } from './components/layout/Sidebar';
import { AnalyticsDashboard } from './components/dashboard/AnalyticsDashboard';
import { InvoiceList } from './components/invoices/InvoiceList';
import { InvoiceEditor } from './components/invoices/InvoiceEditor';
import { InvoicePreviewModal } from './components/invoices/InvoicePreviewModal';
import { PublicPayInvoiceModal } from './components/invoices/PublicPayInvoiceModal';
import { CustomizationSettings } from './components/organization/CustomizationSettings';
import { TeamManagement } from './components/team/TeamManagement';
import { BillingManagerView } from './components/billing/BillingManagerView';
import { BillingSubscriptionModal } from './components/billing/BillingSubscriptionModal';
import { ApiSecurityView } from './components/security/ApiSecurityView';
import { AuditLogView } from './components/audit/AuditLogView';
import { CachePerformanceView } from './components/performance/CachePerformanceView';
import { ClientManagerView } from './components/clients/ClientManagerView';
import { SecureLoginView } from './components/auth/SecureLoginView';
import { EmailNotificationsView } from './components/notifications/EmailNotificationsView';
import { EmailNotification } from './types';
import { Mail, CheckCircle2, UploadCloud, ExternalLink, LayoutDashboard, FileText, Users, Menu, X, Plus } from 'lucide-react';
import { CompanyCurrencyConversionModal } from './components/currency/CompanyCurrencyConversionModal';
import { CurrencyConverterModal } from './components/currency/CurrencyConverterModal';
import { CloudSqlSnapshotSettings } from './components/database/CloudSqlSnapshotSettings';
import { VendorManagementView } from './components/vendors/VendorManagementView';
import { ExpenseTrackerView } from './components/expenses/ExpenseTrackerView';
import { SaaSRevenueManagerView } from './components/saas/SaaSRevenueManagerView';
import { InventoryManagementView } from './components/inventory/InventoryManagementView';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(storageService.isAuthenticated());
  const [activeOrgId, setActiveOrgId] = useState<string>(storageService.getActiveOrgId());
  const [currentUserId, setCurrentUserId] = useState<string>(storageService.getCurrentUserId());
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>('en');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [emailToast, setEmailToast] = useState<EmailNotification | null>(null);
  const [driveToast, setDriveToast] = useState<{
    invoiceNumber: string;
    folderName: string;
    webViewLink?: string;
  } | null>(null);

  // Reload trigger
  const [version, setVersion] = useState(0);
  const handleRefresh = () => setVersion((v) => v + 1);

  useEffect(() => {
    const handleEmailDispatched = (e: any) => {
      if (e.detail) {
        setEmailToast(e.detail);
        setTimeout(() => setEmailToast(null), 5000);
      }
    };

    const handleCurrencyConverted = () => {
      handleRefresh();
    };

    const handleDriveSynced = (e: any) => {
      if (e.detail) {
        setDriveToast(e.detail);
        setTimeout(() => setDriveToast(null), 6000);
        handleRefresh();
      }
    };

    const handleInvoiceRestored = () => {
      handleRefresh();
    };

    window.addEventListener('invox:email_dispatched', handleEmailDispatched);
    window.addEventListener('invox:currency_converted', handleCurrencyConverted);
    window.addEventListener('invox:drive_synced', handleDriveSynced);
    window.addEventListener('invox:invoice_restored', handleInvoiceRestored);
    return () => {
      window.removeEventListener('invox:email_dispatched', handleEmailDispatched);
      window.removeEventListener('invox:currency_converted', handleCurrencyConverted);
      window.removeEventListener('invox:drive_synced', handleDriveSynced);
      window.removeEventListener('invox:invoice_restored', handleInvoiceRestored);
    };
  }, []);

  // Modals state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [publicPayInvoice, setPublicPayInvoice] = useState<Invoice | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<'limit_reached' | 'manual'>('manual');
  const [isConversionModalOpen, setIsConversionModalOpen] = useState(false);
  const [isConverterModalOpen, setIsConverterModalOpen] = useState(false);

  // Resolved tenant and user (Strict privacy isolation)
  const currentUser = storageService.getCurrentUser();
  const isPlatformAdmin = currentUser.role === 'super_admin';
  const effectiveOrgId = currentUser.organizationId;
  const currentOrg = storageService.getOrganization(effectiveOrgId) || {
    id: effectiveOrgId,
    name: 'My Organization',
    currency: 'USD',
    plan: 'free',
    invoiceCount: 0,
    subscriptionStatus: 'none',
    defaultPaymentTerms: 'Net 30',
  } as OrganizationSettings;
  const allOrgs = [currentOrg];
  const allUsers = storageService.getUsersByOrg(effectiveOrgId);

  // Tab guard: hide platform admin views from tenants
  useEffect(() => {
    const platformAdminOnlyTabs = ['billing', 'database', 'api', 'saas-revenue'];
    if (!isPlatformAdmin && platformAdminOnlyTabs.includes(activeTab)) {
      setActiveTab('dashboard');
    }
  }, [activeTab, isPlatformAdmin]);

  const invoices = storageService.getInvoices(effectiveOrgId);
  const clients = storageService.getClients(effectiveOrgId);

  const handleSelectOrg = (newOrgId: string) => {
    if (newOrgId !== currentUser.organizationId) {
      console.warn('[Privacy Guard] Cross-tenant organization access prohibited.');
      return;
    }
    setActiveOrgId(newOrgId);
    handleRefresh();
  };

  const handleSelectUser = (newUserId: string) => {
    storageService.setCurrentUserId(newUserId);
    setCurrentUserId(newUserId);
    handleRefresh();
  };

  const handleOpenNewInvoice = () => {
    // Check Free Tier Quota before opening editor
    const quota = storageService.checkQuota(activeOrgId);
    if (!quota.allowed) {
      setUpgradeReason('limit_reached');
      setIsUpgradeModalOpen(true);
      return;
    }
    setEditingInvoice(null);
    setIsEditorOpen(true);
  };

  const handleEditInvoice = (inv: Invoice) => {
    setEditingInvoice(inv);
    setIsEditorOpen(true);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUserId(user.id);
    setActiveOrgId(user.organizationId);
    setIsAuthenticated(true);
    handleRefresh();
  };

  const handleLogout = () => {
    storageService.logout();
    setIsAuthenticated(false);
    handleRefresh();
  };

  const isRTL = currentLang === 'ar';

  if (!isAuthenticated) {
    return <SecureLoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200 w-full max-w-full overflow-x-hidden"
    >
      {/* Top Bar Contract (Wordmark, Nav links, 1 Primary Action + Tenant Switcher) */}
      <AppHeader
        currentOrg={currentOrg}
        allOrgs={allOrgs}
        currentUser={currentUser}
        allUsers={allUsers}
        currentLang={currentLang}
        invoices={invoices}
        clients={clients}
        onSelectOrg={handleSelectOrg}
        onSelectUser={handleSelectUser}
        onSelectLang={setCurrentLang}
        onOpenNewInvoice={handleOpenNewInvoice}
        onLogout={handleLogout}
        onSelectInvoice={(invoiceId) => {
          const inv = storageService.getInvoiceById(invoiceId, activeOrgId);
          if (inv) {
            setPreviewInvoice(inv);
          }
        }}
        onSelectClient={() => {
          setActiveTab('clients');
        }}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden relative w-full max-w-full min-w-0">
        {/* Desktop Navigation Sidebar (Hidden on mobile <768px) */}
        <div className="hidden md:flex md:w-64 md:shrink-0">
          <Sidebar
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            currentOrg={currentOrg}
            currentLang={currentLang}
            currentUser={currentUser}
            onOpenUpgradeModal={() => {
              setUpgradeReason('manual');
              setIsUpgradeModalOpen(true);
            }}
          />
        </div>

        {/* Mobile Slide-Over Navigation Drawer Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs transition-opacity duration-200"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden="true"
            />
            {/* Drawer Content */}
            <div className="relative w-72 max-w-[85vw] bg-slate-900 border-r border-slate-800 flex flex-col h-full z-10 shadow-2xl animate-in slide-in-from-left duration-200">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/90">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 bg-white rounded-md p-0.5 flex items-center justify-center shrink-0 border border-slate-700">
                    <img src="/kero-logo.png" alt="KERO" className="h-full w-full object-contain" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-extrabold text-xs text-white tracking-tight">KERO INVOICE</span>
                    <span className="text-[9px] font-mono text-indigo-400">SaaS Navigation</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  aria-label="Close navigation menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <Sidebar
                  activeTab={activeTab}
                  onSelectTab={(tab) => {
                    setActiveTab(tab);
                    setIsMobileMenuOpen(false);
                  }}
                  currentOrg={currentOrg}
                  currentLang={currentLang}
                  currentUser={currentUser}
                  onOpenUpgradeModal={() => {
                    setIsMobileMenuOpen(false);
                    setUpgradeReason('manual');
                    setIsUpgradeModalOpen(true);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Viewport Content Area (Full responsive presence baseline) */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-5 md:p-6 lg:p-8 pb-24 md:pb-8 bg-slate-950/70 w-full max-w-full min-w-0">
          <div className="max-w-7xl mx-auto w-full min-w-0">
            {activeTab === 'dashboard' && (
              <AnalyticsDashboard
                invoices={invoices}
                org={currentOrg}
                currentUser={currentUser}
                currentLang={currentLang}
                onOpenNewInvoice={handleOpenNewInvoice}
                onOpenUpgradeModal={() => {
                  setUpgradeReason('manual');
                  setIsUpgradeModalOpen(true);
                }}
                onViewInvoice={(inv) => setPreviewInvoice(inv)}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'saas-revenue' && isPlatformAdmin && (
              <SaaSRevenueManagerView
                currentUser={currentUser}
                onRefresh={handleRefresh}
                onSwitchTenant={(orgId) => {
                  handleSelectOrg(orgId);
                  setActiveTab('dashboard');
                }}
              />
            )}

            {activeTab === 'invoices' && (
              <InvoiceList
                invoices={invoices}
                org={currentOrg}
                currentUser={currentUser}
                currentLang={currentLang}
                onViewInvoice={(inv) => setPreviewInvoice(inv)}
                onEditInvoice={handleEditInvoice}
                onOpenPayModal={(inv) => setPublicPayInvoice(inv)}
                onOpenNewInvoice={handleOpenNewInvoice}
                onRefresh={handleRefresh}
              />
            )}

            {activeTab === 'inventory' && (
              <InventoryManagementView
                org={currentOrg}
                currentUser={currentUser}
                onRefresh={handleRefresh}
              />
            )}

            {activeTab === 'vendors' && (
              <VendorManagementView
                org={currentOrg}
                currentUser={currentUser}
                onRefresh={handleRefresh}
              />
            )}

            {activeTab === 'expenses' && (
              <ExpenseTrackerView
                org={currentOrg}
                currentUser={currentUser}
                onRefresh={handleRefresh}
              />
            )}

            {activeTab === 'emails' && (
              <EmailNotificationsView
                org={currentOrg}
                invoices={invoices}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'clients' && (
              <ClientManagerView
                org={currentOrg}
                clients={clients}
                currentUser={currentUser}
                onRefresh={handleRefresh}
              />
            )}

            {activeTab === 'branding' && (
              <CustomizationSettings
                org={currentOrg}
                currentUser={currentUser}
                onSaved={handleRefresh}
              />
            )}

            {activeTab === 'database' && isPlatformAdmin && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div>
                    <h1 className="text-xl font-bold text-white tracking-tight">Cloud SQL & Automated Snapshots</h1>
                    <p className="text-xs text-slate-400 mt-1">
                      Manage PostgreSQL database instance, daily snapshot schedules, and disaster recovery drills for project eco-context-13kqt (europe-west2).
                    </p>
                  </div>
                </div>
                <CloudSqlSnapshotSettings
                  org={currentOrg}
                  currentUser={currentUser}
                  onSaved={handleRefresh}
                />
              </div>
            )}

            {activeTab === 'team' && (
              <TeamManagement
                org={currentOrg}
                currentUser={currentUser}
                onRefresh={handleRefresh}
              />
            )}

            {activeTab === 'billing' && isPlatformAdmin && (
              <BillingManagerView
                org={currentOrg}
                currentUser={currentUser}
                onOpenUpgradeModal={() => {
                  setUpgradeReason('manual');
                  setIsUpgradeModalOpen(true);
                }}
                onRefresh={handleRefresh}
              />
            )}

            {activeTab === 'api' && isPlatformAdmin && (
              <ApiSecurityView
                org={currentOrg}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'audit' && (
              <AuditLogView
                org={currentOrg}
              />
            )}

            {activeTab === 'cache' && (
              <CachePerformanceView
                org={currentOrg}
                currentUser={currentUser}
              />
            )}
          </div>
        </main>
      </div>

      {/* Invoice Editor Modal */}
      {isEditorOpen && (
        <InvoiceEditor
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          org={currentOrg}
          clients={clients}
          currentUser={currentUser}
          initialInvoice={editingInvoice}
          onSaved={handleRefresh}
          onTriggerUpgrade={() => {
            setIsEditorOpen(false);
            setUpgradeReason('limit_reached');
            setIsUpgradeModalOpen(true);
          }}
        />
      )}

      {/* Invoice Preview & Printable Document Modal */}
      {previewInvoice && (
        <InvoicePreviewModal
          isOpen={Boolean(previewInvoice)}
          onClose={() => setPreviewInvoice(null)}
          invoice={previewInvoice}
          org={currentOrg}
          onOpenPayModal={(inv) => setPublicPayInvoice(inv)}
        />
      )}

      {/* Client Public Pay Portal Modal (Visa & Stripe) */}
      {publicPayInvoice && (
        <PublicPayInvoiceModal
          isOpen={Boolean(publicPayInvoice)}
          onClose={() => setPublicPayInvoice(null)}
          invoice={publicPayInvoice}
          org={currentOrg}
          currentUser={currentUser}
          onPaymentSuccess={handleRefresh}
        />
      )}

      {/* Stripe & VISA $2.00/mo Subscription Upgrade Modal */}
      <BillingSubscriptionModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        org={currentOrg}
        currentUser={currentUser}
        onSuccess={handleRefresh}
        reason={upgradeReason}
      />

      {/* Real-Time Automated Email Notification Toast */}
      {emailToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-slate-900 border border-indigo-500/50 rounded-xl shadow-2xl p-4 text-slate-100 flex items-start gap-3 animate-in slide-in-from-bottom-5 duration-200">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
            <Mail className="w-4 h-4" />
          </div>
          <div className="flex-1 pr-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <span>Automated Email Dispatched</span>
              <span className="text-[10px] text-emerald-400 font-mono font-normal">● 200 OK</span>
            </div>
            <div className="text-[11px] text-indigo-300 font-medium truncate mt-0.5">
              {emailToast.subject}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Sent to: <span className="text-slate-300 font-mono">{emailToast.recipientEmail}</span>
            </div>
          </div>
          <button
            onClick={() => {
              setActiveTab('emails');
              setEmailToast(null);
            }}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold underline shrink-0 mt-1"
          >
            View
          </button>
        </div>
      )}

      {/* Real-Time Automated Google Drive PDF Pipeline Toast */}
      {driveToast && (
        <div className="fixed bottom-20 right-6 z-50 max-w-md bg-slate-900 border border-emerald-500/50 rounded-xl shadow-2xl p-4 text-slate-100 flex items-start gap-3 animate-in slide-in-from-bottom-5 duration-200">
          <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
            <UploadCloud className="w-4 h-4" />
          </div>
          <div className="flex-1 pr-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <span>Google Drive PDF Saved</span>
              <span className="text-[10px] text-emerald-400 font-mono font-normal">● 200 Created</span>
            </div>
            <div className="text-[11px] text-emerald-300 font-medium truncate mt-0.5">
              Invoice #{driveToast.invoiceNumber} PDF archived
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Folder: <span className="text-slate-300 font-medium">{driveToast.folderName}</span>
            </div>
          </div>
          {driveToast.webViewLink ? (
            <a
              href={driveToast.webViewLink}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold underline shrink-0 mt-1 flex items-center gap-1"
            >
              <span>Open</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          ) : (
            <button
              onClick={() => setDriveToast(null)}
              className="text-[11px] text-slate-400 hover:text-slate-200 shrink-0 mt-1"
            >
              Dismiss
            </button>
          )}
        </div>
      )}
      {/* Mobile Bottom Navigation Bar (Thumb Zone for 320px–767px viewports) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-3 py-1 flex items-center justify-around select-none no-print">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center min-w-[52px] min-h-[48px] py-1 rounded-lg transition-colors ${
            activeTab === 'dashboard' ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
          aria-label="Dashboard"
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('invoices')}
          className={`flex flex-col items-center justify-center min-w-[52px] min-h-[48px] py-1 rounded-lg transition-colors ${
            activeTab === 'invoices' ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
          aria-label="Invoices"
        >
          <FileText className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Invoices</span>
        </button>

        {/* Center Prominent New Invoice Action */}
        <button
          onClick={handleOpenNewInvoice}
          className="flex flex-col items-center justify-center -mt-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full w-12 h-12 shadow-lg shadow-indigo-600/30 transition-transform active:scale-95 focus-visible:ring-2 focus-visible:ring-indigo-400"
          title="Create New Invoice"
          aria-label="Create New Invoice"
        >
          <Plus className="w-6 h-6" />
        </button>

        <button
          onClick={() => setActiveTab('clients')}
          className={`flex flex-col items-center justify-center min-w-[52px] min-h-[48px] py-1 rounded-lg transition-colors ${
            activeTab === 'clients' ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
          aria-label="Clients"
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Clients</span>
        </button>

        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className={`flex flex-col items-center justify-center min-w-[52px] min-h-[48px] py-1 rounded-lg transition-colors ${
            isMobileMenuOpen ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
          aria-label="More navigation options"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">More</span>
        </button>
      </nav>
    </div>
  );
}
