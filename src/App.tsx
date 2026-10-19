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
import { Mail, CheckCircle2 } from 'lucide-react';
import { CompanyCurrencyConversionModal } from './components/currency/CompanyCurrencyConversionModal';
import { CurrencyConverterModal } from './components/currency/CurrencyConverterModal';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(storageService.isAuthenticated());
  const [activeOrgId, setActiveOrgId] = useState<string>(storageService.getActiveOrgId());
  const [currentUserId, setCurrentUserId] = useState<string>(storageService.getCurrentUserId());
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>('en');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [emailToast, setEmailToast] = useState<EmailNotification | null>(null);

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

    window.addEventListener('invox:email_dispatched', handleEmailDispatched);
    window.addEventListener('invox:currency_converted', handleCurrencyConverted);
    return () => {
      window.removeEventListener('invox:email_dispatched', handleEmailDispatched);
      window.removeEventListener('invox:currency_converted', handleCurrencyConverted);
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

  // Resolved tenant and user
  const allOrgs = storageService.getOrganizations();
  const currentOrg = storageService.getOrganization(activeOrgId) || allOrgs[0];
  const allUsers = storageService.getAllUsers();
  const currentUser = storageService.getCurrentUser();

  const invoices = storageService.getInvoices(activeOrgId);
  const clients = storageService.getClients(activeOrgId);

  const handleSelectOrg = (newOrgId: string) => {
    storageService.setActiveOrgId(newOrgId);
    setActiveOrgId(newOrgId);
    // Find an authorized user in this organization
    const orgUsers = storageService.getUsersByOrg(newOrgId);
    if (orgUsers.length > 0) {
      storageService.setCurrentUserId(orgUsers[0].id);
      setCurrentUserId(orgUsers[0].id);
    }
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
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200"
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
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          currentOrg={currentOrg}
          currentLang={currentLang}
          onOpenUpgradeModal={() => {
            setUpgradeReason('manual');
            setIsUpgradeModalOpen(true);
          }}
        />

        {/* Viewport Content Area (Full desktop presence baseline) */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-950/70">
          <div className="max-w-6xl mx-auto">
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

            {activeTab === 'team' && (
              <TeamManagement
                org={currentOrg}
                currentUser={currentUser}
                onRefresh={handleRefresh}
              />
            )}

            {activeTab === 'billing' && (
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

            {activeTab === 'api' && (
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
    </div>
  );
}
