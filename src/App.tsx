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

export default function App() {
  const [activeOrgId, setActiveOrgId] = useState<string>(storageService.getActiveOrgId());
  const [currentUserId, setCurrentUserId] = useState<string>(storageService.getCurrentUserId());
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>('en');
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Reload trigger
  const [version, setVersion] = useState(0);
  const handleRefresh = () => setVersion((v) => v + 1);

  // Modals state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [publicPayInvoice, setPublicPayInvoice] = useState<Invoice | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<'limit_reached' | 'manual'>('manual');

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

  const isRTL = currentLang === 'ar';

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
        onSelectOrg={handleSelectOrg}
        onSelectUser={handleSelectUser}
        onSelectLang={setCurrentLang}
        onOpenNewInvoice={handleOpenNewInvoice}
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
    </div>
  );
}
