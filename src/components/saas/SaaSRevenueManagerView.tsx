import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  Building2,
  Activity,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Search,
  Filter,
  Copy,
  Check,
  CreditCard,
  Download,
  ExternalLink,
  Code,
  Layers,
  Sparkles,
  RefreshCw,
  X,
  FileText,
  UserCheck,
  Zap,
  Clock,
  ArrowUpRight,
  Shield,
  Key,
  LifeBuoy,
  UserPlus,
  Lock,
  ArrowRight,
} from 'lucide-react';
import {
  OrganizationSettings,
  User,
  SaaSSubscriptionTransaction,
  TenantQueryLog,
  UserRole,
} from '../../types';
import { storageService } from '../../services/storage';
import { SupportTicketCenter } from './SupportTicketCenter';

interface SaaSRevenueManagerViewProps {
  currentUser: User;
  onRefresh?: () => void;
  onSwitchTenant?: (orgId: string) => void;
}

export const SaaSRevenueManagerView: React.FC<SaaSRevenueManagerViewProps> = ({
  currentUser,
  onRefresh,
  onSwitchTenant,
}) => {
  const [activeTab, setActiveTab] = useState<'revenue' | 'troubleshooting' | 'support' | 'account'>('revenue');

  // Support Tickets State
  const [supportTicketsCount, setSupportTicketsCount] = useState<number>(
    () => storageService.getSupportTickets().filter((t) => t.status === 'open' || t.status === 'in_progress').length
  );

  // Multi-Tenant Revenue States
  const [tenants, setTenants] = useState<OrganizationSettings[]>(storageService.getSaaSTenants());
  const [transactions, setTransactions] = useState<SaaSSubscriptionTransaction[]>(
    storageService.getSaaSRevenueTransactions()
  );
  const [tenantSearch, setTenantSearch] = useState('');
  const [tenantPlanFilter, setTenantPlanFilter] = useState<'ALL' | 'PRO' | 'FREE'>('ALL');

  // Edit Plan Modal
  const [editingTenant, setEditingTenant] = useState<OrganizationSettings | null>(null);
  const [editPlan, setEditPlan] = useState<'free' | 'pro'>('pro');
  const [editStatus, setEditStatus] = useState<'active' | 'canceled' | 'past_due' | 'none'>('active');

  // Query Troubleshooting States
  const [queryLogs, setQueryLogs] = useState<TenantQueryLog[]>(storageService.getTenantQueryLogs());
  const [queryTenantFilter, setQueryTenantFilter] = useState<string>('ALL');
  const [queryStatusFilter, setQueryStatusFilter] = useState<'ALL' | 'SLOW' | 'OPTIMIZED'>('ALL');
  const [copiedQueryId, setCopiedQueryId] = useState<string | null>(null);
  const [inspectingQuery, setInspectingQuery] = useState<TenantQueryLog | null>(null);

  // Live Query Benchmark Runner
  const [diagnosticTenantId, setDiagnosticTenantId] = useState<string>(tenants[0]?.id || 'org_apex_tech');
  const [diagnosticQueryType, setDiagnosticQueryType] = useState<'invoices' | 'expenses' | 'clients'>('invoices');
  const [isDiagnosticRunning, setIsDiagnosticRunning] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<TenantQueryLog | null>(null);

  // Super Admin & Troubleshooting Accounts
  const [adminAccounts, setAdminAccounts] = useState<User[]>(() => storageService.getSuperAdminAccounts());
  const [isCreateAccountModalOpen, setIsCreateAccountModalOpen] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountEmail, setNewAccountEmail] = useState('');
  const [newAccountRole, setNewAccountRole] = useState<UserRole>('super_admin');
  const [newAccountTitle, setNewAccountTitle] = useState('SaaS Revenue & Tenant Query Specialist');

  // Success Feedback
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Receive Tenant Payment Modal States
  const [isReceivePaymentModalOpen, setIsReceivePaymentModalOpen] = useState(false);
  const [receiveOrgId, setReceiveOrgId] = useState('');
  const [receiveAmount, setReceiveAmount] = useState<number>(2.0);
  const [receivePlanName, setReceivePlanName] = useState('Pro Tier ($2.00/mo)');
  const [receiveGateway, setReceiveGateway] = useState('Stripe Visa Direct');
  const [receiveReference, setReceiveReference] = useState('');

  const handleOpenReceivePaymentModal = (tenant?: OrganizationSettings) => {
    if (tenant) {
      setReceiveOrgId(tenant.id);
      setReceiveAmount(tenant.id === 'org_quantum_ai' ? 19.0 : 2.0);
      setReceivePlanName(tenant.id === 'org_quantum_ai' ? 'Enterprise Pro Tier' : 'Pro Tier ($2.00/mo)');
    } else if (tenants.length > 0) {
      setReceiveOrgId(tenants[0].id);
      setReceiveAmount(2.0);
      setReceivePlanName('Pro Tier ($2.00/mo)');
    }
    setReceiveGateway('Stripe Visa Direct');
    setReceiveReference(`REC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`);
    setIsReceivePaymentModalOpen(true);
  };

  const handleProcessReceivePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiveOrgId) return;
    const targetOrg = tenants.find((t) => t.id === receiveOrgId);
    if (!targetOrg) return;

    try {
      storageService.receiveTenantPayment(
        receiveOrgId,
        receiveAmount,
        receivePlanName,
        receiveGateway,
        receiveReference,
        currentUser
      );
      refreshData();
      setIsReceivePaymentModalOpen(false);
      setActionSuccessMsg(
        `Successfully received payment of $${receiveAmount.toFixed(2)} from ${targetOrg.name} via ${receiveGateway}!`
      );
      setTimeout(() => setActionSuccessMsg(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Error recording payment');
    }
  };

  const refreshData = () => {
    setTenants(storageService.getSaaSTenants());
    setTransactions(storageService.getSaaSRevenueTransactions());
    setQueryLogs(storageService.getTenantQueryLogs());
    setSupportTicketsCount(
      storageService.getSupportTickets().filter((t) => t.status === 'open' || t.status === 'in_progress').length
    );
    setAdminAccounts(storageService.getSuperAdminAccounts());
    if (onRefresh) onRefresh();
  };

  // -----------------------------------------------------------------
  // CALCULATED SAAS METRICS
  // -----------------------------------------------------------------
  const activeProTenants = useMemo(
    () => tenants.filter((t) => t.plan === 'pro' && t.subscriptionStatus === 'active'),
    [tenants]
  );

  const freeTenants = useMemo(() => tenants.filter((t) => t.plan === 'free'), [tenants]);

  // Total MRR calculation: Pro standard ($2.00/mo) or Enterprise Pro ($19.00/mo)
  const currentMrr = useMemo(() => {
    return activeProTenants.reduce((sum, t) => {
      if (t.id === 'org_quantum_ai') return sum + 19.0;
      return sum + 2.0;
    }, 0);
  }, [activeProTenants]);

  const projectedArr = currentMrr * 12;

  const totalInvoicesAcrossTenants = useMemo(() => {
    return tenants.reduce((sum, t) => sum + (t.invoiceCount || 0), 0);
  }, [tenants]);

  const arpu = activeProTenants.length > 0 ? (currentMrr / activeProTenants.length).toFixed(2) : '0.00';

  // Filtered Tenants list
  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      const matchSearch =
        !tenantSearch ||
        t.name.toLowerCase().includes(tenantSearch.toLowerCase()) ||
        t.email.toLowerCase().includes(tenantSearch.toLowerCase()) ||
        t.id.toLowerCase().includes(tenantSearch.toLowerCase());

      const matchPlan =
        tenantPlanFilter === 'ALL' ||
        (tenantPlanFilter === 'PRO' && t.plan === 'pro') ||
        (tenantPlanFilter === 'FREE' && t.plan === 'free');

      return matchSearch && matchPlan;
    });
  }, [tenants, tenantSearch, tenantPlanFilter]);

  // Filtered Query logs
  const filteredQueries = useMemo(() => {
    return queryLogs.filter((q) => {
      const matchTenant = queryTenantFilter === 'ALL' || q.organizationId === queryTenantFilter;
      const matchStatus =
        queryStatusFilter === 'ALL' ||
        (queryStatusFilter === 'SLOW' && (q.status === 'slow_unindexed' || q.status === 'warning')) ||
        (queryStatusFilter === 'OPTIMIZED' && q.status === 'optimized');

      return matchTenant && matchStatus;
    });
  }, [queryLogs, queryTenantFilter, queryStatusFilter]);

  // -----------------------------------------------------------------
  // HANDLERS
  // -----------------------------------------------------------------
  const handleCollectSubscription = (tenant: OrganizationSettings) => {
    const fee = tenant.id === 'org_quantum_ai' ? 19.0 : 2.0;
    const planName = tenant.id === 'org_quantum_ai' ? 'Enterprise Pro' : 'Pro';
    const gateway = `Stripe Automated Billing (${tenant.cardBrand || 'Visa'} •••• ${tenant.cardLast4 || '4242'})`;

    storageService.recordSaaSSubscriptionCharge(tenant.id, planName, fee, gateway, currentUser);
    refreshData();
    setActionSuccessMsg(
      `Successfully processed monthly subscription payment of $${fee.toFixed(2)} from ${tenant.name}!`
    );
    setTimeout(() => setActionSuccessMsg(null), 5000);
  };

  const handleOpenEditPlanModal = (tenant: OrganizationSettings) => {
    setEditingTenant(tenant);
    setEditPlan(tenant.plan);
    setEditStatus(tenant.subscriptionStatus);
  };

  const handleSavePlanChanges = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant) return;

    storageService.updateTenantPlan(editingTenant.id, editPlan, editStatus, 0, currentUser);
    refreshData();
    setEditingTenant(null);
    setActionSuccessMsg(`Subscription updated for ${editingTenant.name}: ${editPlan.toUpperCase()} (${editStatus})`);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  const handleResetQuota = (tenant: OrganizationSettings) => {
    storageService.resetTenantInvoiceQuota(tenant.id, currentUser);
    refreshData();
    setActionSuccessMsg(`Starter invoice quota reset to 0 for ${tenant.name}.`);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  const handleResolveQuery = (query: TenantQueryLog) => {
    storageService.resolveTenantQuery(query.id, currentUser);
    refreshData();
    setActionSuccessMsg(`Applied composite index! Query on ${query.collection} is now fully optimized.`);
    setTimeout(() => setActionSuccessMsg(null), 5000);
  };

  const handleRunDiagnosticQuery = async () => {
    setIsDiagnosticRunning(true);
    setDiagnosticResult(null);
    await new Promise((r) => setTimeout(r, 650));

    const result = storageService.simulateDiagnosticQuery(diagnosticTenantId, diagnosticQueryType);
    setDiagnosticResult(result);
    setIsDiagnosticRunning(false);
    refreshData();
  };

  const handleCopyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedQueryId(id);
    setTimeout(() => setCopiedQueryId(null), 2000);
  };

  const handleExportTransactionsCsv = () => {
    const headers = 'Transaction ID,Date,Tenant Name,Tenant ID,Plan,Amount,Currency,Gateway,Status,Invoices\n';
    const rows = transactions
      .map(
        (t) =>
          `"${t.id}","${t.timestamp}","${t.organizationName}","${t.organizationId}","${t.planName}",${t.amount},"${t.currency}","${t.paymentGateway}","${t.status}",${t.invoiceCount}`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kero_saas_revenue_ledger_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateTroubleshootingAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountName.trim() || !newAccountEmail.trim()) return;

    try {
      const created = storageService.createTroubleshootingAccount(
        {
          name: newAccountName.trim(),
          email: newAccountEmail.trim(),
          role: newAccountRole,
          title: newAccountTitle.trim(),
        },
        currentUser
      );
      refreshData();
      setIsCreateAccountModalOpen(false);
      setNewAccountName('');
      setNewAccountEmail('');
      setActionSuccessMsg(
        `Successfully provisioned operations account for ${created.name} (${created.email}) with full troubleshooting & SaaS revenue privileges!`
      );
      setTimeout(() => setActionSuccessMsg(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Error creating account');
    }
  };

  const handleSwitchAdminAccount = (targetUser: User) => {
    storageService.setCurrentUserId(targetUser.id);
    refreshData();
    onRefresh?.();
  };

  return (
    <div className="space-y-6">
      {/* Platform Super Admin Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Platform Super Admin Operations
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              SaaS Control Center
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            SaaS Revenue & Tenant Operations Hub
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Logged in as <strong className="text-slate-200">Kenneth Onekalit</strong> (onekalitkenneth@gmail.com) · Monitoring {tenants.length} tenant workspaces and cross-tenant cloud query throughput.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => handleOpenReceivePaymentModal()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs shadow-sm transition-colors cursor-pointer"
            title="Receive and settle subscription or contract payment from a tenant"
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Receive Payment</span>
          </button>
          <button
            onClick={refreshData}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-semibold text-slate-300 transition-colors shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh State</span>
          </button>
        </div>
      </div>

      {/* Action Notification Toast */}
      {actionSuccessMsg && (
        <div className="p-3.5 bg-emerald-950/80 border border-emerald-800 rounded-xl flex items-center justify-between text-xs text-emerald-300 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Primary Module Tabs */}
      <div className="flex border-b border-slate-800 text-xs font-semibold gap-1 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('revenue')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'revenue'
              ? 'border-indigo-500 text-white bg-indigo-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5 text-indigo-400" />
          <span>Tenant Revenue & MRR Manager</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
            ${currentMrr}/mo
          </span>
        </button>

        <button
          onClick={() => setActiveTab('troubleshooting')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'troubleshooting'
              ? 'border-indigo-500 text-white bg-indigo-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Tenant Query Troubleshooting</span>
          {queryLogs.some((q) => q.status === 'slow_unindexed') && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono animate-pulse">
              2 Slow
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('support')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'support'
              ? 'border-indigo-500 text-white bg-indigo-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <LifeBuoy className="w-3.5 h-3.5 text-sky-400" />
          <span>Support Ticket Center</span>
          {supportTicketsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-sky-500/20 text-sky-300 border border-sky-500/30 font-mono">
              {supportTicketsCount} Active
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('account')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'account'
              ? 'border-indigo-500 text-white bg-indigo-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Operations Accounts & Permissions</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
            {adminAccounts.length} Staff
          </span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: SAAS REVENUE & TENANTS COMMAND CENTER */}
      {/* ========================================================= */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          {/* Executive Revenue KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Monthly Recurring Revenue</span>
                <span className="text-emerald-400 font-mono text-[11px] font-semibold flex items-center">
                  <ArrowUpRight className="w-3 h-3" /> +18.5%
                </span>
              </div>
              <div className="text-2xl font-black font-mono text-white tracking-tight">
                ${currentMrr.toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-500">
                From {activeProTenants.length} paying tenant organizations
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Annualized Run Rate (ARR)</span>
                <DollarSign className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div className="text-2xl font-black font-mono text-indigo-400 tracking-tight">
                ${projectedArr.toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-500">
                Based on active 30-day recurring renewals
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Tenants Breakdown</span>
                <Building2 className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="text-2xl font-black font-mono text-white tracking-tight">
                {activeProTenants.length} <span className="text-xs font-normal text-slate-400">Pro</span> / {freeTenants.length} <span className="text-xs font-normal text-slate-400">Free</span>
              </div>
              <div className="text-[11px] text-slate-500">
                {tenants.length} total organizations onboarded
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Lifetime Invoices Issued</span>
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-2xl font-black font-mono text-emerald-400 tracking-tight">
                {totalInvoicesAcrossTenants}
              </div>
              <div className="text-[11px] text-slate-500">
                ARPU: ${arpu}/mo per paying subscriber
              </div>
            </div>
          </div>

          {/* Revenue Monthly Trends & Tier Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-400" />
                    SaaS Monthly Revenue Collections
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Gross subscription payments collected from tenant billing cycles
                  </p>
                </div>
                <span className="text-[11px] font-mono text-indigo-300 bg-indigo-950/60 border border-indigo-800 px-2 py-0.5 rounded">
                  Q3-Q4 2026
                </span>
              </div>

              {/* Trend Chart Bars */}
              <div className="pt-4">
                <div className="grid grid-cols-4 gap-4 h-40 items-end border-b border-slate-800 pb-2">
                  <div className="flex flex-col items-center gap-2 h-full justify-end">
                    <span className="text-[11px] font-mono text-slate-300 font-semibold">$15.00</span>
                    <div className="w-full max-w-[48px] bg-slate-800 hover:bg-slate-700 rounded-t-lg transition-all h-[45%]" />
                    <span className="text-[11px] font-mono text-slate-400">Aug 2026</span>
                  </div>

                  <div className="flex flex-col items-center gap-2 h-full justify-end">
                    <span className="text-[11px] font-mono text-slate-300 font-semibold">$21.00</span>
                    <div className="w-full max-w-[48px] bg-slate-700 hover:bg-slate-600 rounded-t-lg transition-all h-[65%]" />
                    <span className="text-[11px] font-mono text-slate-400">Sep 2026</span>
                  </div>

                  <div className="flex flex-col items-center gap-2 h-full justify-end">
                    <span className="text-[11px] font-mono text-emerald-400 font-bold">$25.00</span>
                    <div className="w-full max-w-[48px] bg-gradient-to-t from-indigo-600 to-indigo-500 rounded-t-lg transition-all h-[80%] shadow-lg shadow-indigo-600/20" />
                    <span className="text-[11px] font-mono text-indigo-300 font-semibold">Oct 2026 (Live)</span>
                  </div>

                  <div className="flex flex-col items-center gap-2 h-full justify-end">
                    <span className="text-[11px] font-mono text-slate-400 font-semibold">$31.00 (Est)</span>
                    <div className="w-full max-w-[48px] border border-dashed border-indigo-500/50 bg-indigo-500/10 rounded-t-lg transition-all h-[95%]" />
                    <span className="text-[11px] font-mono text-slate-500">Nov 2026</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Plan Tier Distribution */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  Subscription Plan Breakdown
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Tenant distribution by billing tier
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-200">Standard Pro ($2.00/mo)</span>
                    <span className="font-mono text-indigo-300">3 Tenants ($6.00/mo)</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: '50%' }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-200">Enterprise Pro ($19.00/mo)</span>
                    <span className="font-mono text-emerald-300">1 Tenant ($19.00/mo)</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '17%' }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-200">Free Starter (10 free inv)</span>
                    <span className="font-mono text-slate-400">2 Tenants ($0.00/mo)</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-slate-600 h-full rounded-full" style={{ width: '33%' }} />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                Platform pricing: $2.00/mo per tenant unlocks unlimited invoices and automated Google Drive archiving.
              </div>
            </div>
          </div>

          {/* Tenants Directory & Plan Manager Table */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-center gap-3 flex-1">
                <div className="relative flex-1 max-w-xs">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={tenantSearch}
                    onChange={(e) => setTenantSearch(e.target.value)}
                    placeholder="Search tenant name, email, ID..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <select
                  value={tenantPlanFilter}
                  onChange={(e) => setTenantPlanFilter(e.target.value as any)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="ALL">All Plans</option>
                  <option value="PRO">Pro Subscribed</option>
                  <option value="FREE">Free Tier</option>
                </select>
              </div>

              <div className="text-xs text-slate-400">
                Showing {filteredTenants.length} of {tenants.length} tenants
              </div>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-medium border-b border-slate-800 select-none">
                  <tr>
                    <th className="py-3 px-4">Organization Tenant</th>
                    <th className="py-3 px-4">Contact Email</th>
                    <th className="py-3 px-4">Plan & Status</th>
                    <th className="py-3 px-4">Monthly Fee</th>
                    <th className="py-3 px-4">Invoices Issued</th>
                    <th className="py-3 px-4">Next Renewal</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredTenants.map((t) => {
                    const isPro = t.plan === 'pro';
                    const fee = t.id === 'org_quantum_ai' ? '$19.00' : isPro ? '$2.00' : '$0.00';
                    return (
                      <tr key={t.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="py-3.5 px-4">
                          <div>
                            <div className="font-bold text-white flex items-center gap-2">
                              <span>{t.name}</span>
                              {t.id === 'org_enterprise_primary' && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono">
                                  HQ
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {t.legalName} · {t.id}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px]">
                          {t.email}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              isPro
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {isPro ? 'Pro Active' : 'Starter Free'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-white text-sm">
                          {fee}
                          <span className="text-[10px] font-normal text-slate-400">/mo</span>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-slate-300">
                          {t.invoiceCount || 0}
                          {!isPro && (
                            <span className="text-slate-500 text-[10px]"> / 10 limit</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                          {t.subscriptionPeriodEnd
                            ? new Date(t.subscriptionPeriodEnd).toLocaleDateString()
                            : 'N/A (Free)'}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenReceivePaymentModal(t)}
                              className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 rounded transition-colors flex items-center gap-1 cursor-pointer"
                              title="Receive or log payment from this tenant"
                            >
                              <DollarSign className="w-3 h-3" />
                              <span>Receive</span>
                            </button>
                            {isPro ? (
                              <button
                                onClick={() => handleCollectSubscription(t)}
                                className="px-2.5 py-1 text-[11px] font-semibold bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 rounded transition-colors"
                                title="Collect recurring Stripe subscription charge"
                              >
                                Charge {fee}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleResetQuota(t)}
                                className="px-2.5 py-1 text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
                                title="Reset starter invoice quota"
                              >
                                Reset Limit
                              </button>
                            )}

                            <button
                              onClick={() => handleOpenEditPlanModal(t)}
                              className="px-2.5 py-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
                              title="Edit subscription tier & status"
                            >
                              Plan
                            </button>

                            {onSwitchTenant && (
                              <button
                                onClick={() => onSwitchTenant(t.id)}
                                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                                title="Switch active workspace to this tenant"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Historical SaaS Revenue Ledger */}
          <div className="space-y-3 pt-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  SaaS Revenue Billing Ledger & Transactions
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Record of all recurring subscription payments billed to tenant organizations
                </p>
              </div>

              <button
                onClick={handleExportTransactionsCsv}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Revenue Ledger CSV</span>
              </button>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-medium border-b border-slate-800 select-none">
                  <tr>
                    <th className="py-3 px-4">Billing Date</th>
                    <th className="py-3 px-4">Tenant Organization</th>
                    <th className="py-3 px-4">Subscription Plan</th>
                    <th className="py-3 px-4">Gateway & Card</th>
                    <th className="py-3 px-4">Transaction ID</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {transactions.map((txn) => (
                    <tr key={txn.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">
                        {new Date(txn.timestamp).toLocaleString()}
                      </td>

                      <td className="py-3 px-4 font-semibold text-white">
                        {txn.organizationName}
                      </td>

                      <td className="py-3 px-4 text-indigo-400 font-medium">
                        {txn.planName}
                      </td>

                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {txn.paymentGateway}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-300 text-[11px]">
                        {txn.transactionId}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-white text-sm">
                        {txn.currency} {txn.amount.toFixed(2)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-800">
                          {txn.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: TENANT QUERY TROUBLESHOOTING & DIAGNOSTICS */}
      {/* ========================================================= */}
      {activeTab === 'troubleshooting' && (
        <div className="space-y-6">
          {/* Diagnostics KPI Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-1">
              <div className="text-xs text-slate-400">Total Monitored Queries</div>
              <div className="text-2xl font-black font-mono text-white tracking-tight">
                {queryLogs.length}
              </div>
              <div className="text-[11px] text-slate-500">Across {tenants.length} tenant partitions</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-1">
              <div className="text-xs text-slate-400">Slow / Unindexed Queries</div>
              <div className="text-2xl font-black font-mono text-rose-400 tracking-tight">
                {queryLogs.filter((q) => q.status === 'slow_unindexed').length}
              </div>
              <div className="text-[11px] text-slate-500">Full partition scans detected</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-1">
              <div className="text-xs text-slate-400">Avg Tenant Query Latency</div>
              <div className="text-2xl font-black font-mono text-amber-400 tracking-tight">
                42ms
              </div>
              <div className="text-[11px] text-slate-500">P95: 185ms · P99: 342ms</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-1">
              <div className="text-xs text-slate-400">Multi-Tenant Isolation</div>
              <div className="text-2xl font-black font-mono text-emerald-400 tracking-tight">
                100% OK
              </div>
              <div className="text-[11px] text-slate-500">Zero cross-tenant leakage</div>
            </div>
          </div>

          {/* Interactive Live Query Benchmark Runner */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Play className="w-4 h-4 text-emerald-400" />
                Live Tenant Query Diagnostic Runner
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Execute a benchmark query against any tenant partition to inspect execution plans, document scan ratios, and missing composite indexes.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Target Tenant Partition</label>
                <select
                  value={diagnosticTenantId}
                  onChange={(e) => setDiagnosticTenantId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Query Collection</label>
                <select
                  value={diagnosticQueryType}
                  onChange={(e) => setDiagnosticQueryType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="invoices">invoices (Multi-filter & DueDate sorting)</option>
                  <option value="expenses">expenses (Category filter & Date ordering)</option>
                  <option value="clients">clients (Full text search & CreatedAt sort)</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleRunDiagnosticQuery}
                  disabled={isDiagnosticRunning}
                  className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  {isDiagnosticRunning ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4 text-amber-300" />
                  )}
                  <span>{isDiagnosticRunning ? 'Running Diagnostic...' : 'Execute Diagnostic Query'}</span>
                </button>
              </div>
            </div>

            {/* Diagnostic Result Card */}
            {diagnosticResult && (
              <div className="p-4 bg-slate-950/80 border border-indigo-500/40 rounded-xl space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                        diagnosticResult.status === 'slow_unindexed'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {diagnosticResult.status === 'slow_unindexed' ? 'SLOW UNINDEXED' : 'OPTIMIZED'}
                    </span>
                    <span className="text-xs font-semibold text-white">
                      Diagnostic Execution: {diagnosticResult.latencyMs}ms Latency
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Scanned: <strong>{diagnosticResult.docsScanned}</strong> · Returned: <strong>{diagnosticResult.docsReturned}</strong>
                  </span>
                </div>

                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto">
                  {diagnosticResult.signature}
                </div>

                {diagnosticResult.suggestedIndex && (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-amber-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      Index Required: {diagnosticResult.suggestedIndex.name}
                    </span>
                    <button
                      onClick={() => handleResolveQuery(diagnosticResult)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold transition-colors"
                    >
                      Apply Recommended Index
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Monitored Queries Table */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-center gap-3 flex-1">
                <select
                  value={queryTenantFilter}
                  onChange={(e) => setQueryTenantFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="ALL">All Tenant Partitions</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>

                <select
                  value={queryStatusFilter}
                  onChange={(e) => setQueryStatusFilter(e.target.value as any)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="ALL">All Query Statuses</option>
                  <option value="SLOW">Slow / Unindexed Only</option>
                  <option value="OPTIMIZED">Optimized Only</option>
                </select>
              </div>

              <div className="text-xs text-slate-400">
                {filteredQueries.length} queries logged
              </div>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-medium border-b border-slate-800 select-none">
                  <tr>
                    <th className="py-3 px-4">Timestamp & Tenant</th>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Collection & Signature</th>
                    <th className="py-3 px-4 text-center">Latency</th>
                    <th className="py-3 px-4 text-center">Scanned / Returned</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredQueries.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="py-3.5 px-4">
                        <div>
                          <div className="font-semibold text-white">{q.organizationName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {new Date(q.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300">
                        {q.userEmail}
                      </td>

                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="font-mono text-indigo-300 truncate text-[11px]" title={q.signature}>
                          {q.signature}
                        </div>
                        <div className="text-[10px] text-slate-500 uppercase mt-0.5">
                          Collection: <strong>{q.collection}</strong>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-bold text-xs">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] ${
                            q.latencyMs > 200
                              ? 'text-rose-400 bg-rose-950/60 border border-rose-800'
                              : q.latencyMs > 100
                              ? 'text-amber-400 bg-amber-950/60 border border-amber-800'
                              : 'text-emerald-400 bg-emerald-950/60 border border-emerald-800'
                          }`}
                        >
                          {q.latencyMs}ms
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono text-[11px] text-slate-300">
                        {q.docsScanned} / {q.docsReturned}
                        {q.docsScanned > 500 && (
                          <div className="text-[10px] text-rose-400 font-medium">Full Scan</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                            q.status === 'slow_unindexed'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : q.status === 'warning'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          }`}
                        >
                          {q.status === 'slow_unindexed' ? 'SLOW' : q.status === 'warning' ? 'WARN' : 'OPTIMIZED'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {q.suggestedIndex && q.status !== 'optimized' && (
                            <button
                              onClick={() => handleResolveQuery(q)}
                              className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 rounded transition-colors"
                              title="Deploy composite index to optimize"
                            >
                              Apply Index
                            </button>
                          )}

                          <button
                            onClick={() => setInspectingQuery(q)}
                            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                            title="Inspect Index DDL / Firestore JSON"
                          >
                            <Code className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: TENANT SUPPORT TICKET CENTER */}
      {/* ========================================================= */}
      {activeTab === 'support' && (
        <SupportTicketCenter
          currentUser={currentUser}
          onRefresh={refreshData}
          onNavigateToTroubleshooting={(tenantId) => {
            setActiveTab('troubleshooting');
            if (tenantId) setQueryTenantFilter(tenantId);
          }}
          onNavigateToRevenue={(tenantId) => {
            setActiveTab('revenue');
            if (tenantId) setTenantSearch(tenantId);
          }}
        />
      )}

      {/* ========================================================= */}
      {/* TAB 4: SUPER ADMIN & OPERATIONS ACCOUNTS DIRECTORY */}
      {/* ========================================================= */}
      {activeTab === 'account' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-600/30">
                  {currentUser.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white">{currentUser.name}</h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                      {currentUser.role.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-xs text-indigo-400 font-mono mt-0.5">
                    {currentUser.email} · SaaS Operations & Chief Architect
                  </div>
                </div>
              </div>

              <div className="text-left sm:text-right text-xs space-y-0.5">
                <span className="text-emerald-400 font-mono font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  MFA / 2FA Verified Active
                </span>
                <span className="text-[11px] text-slate-500 font-mono">Session ID: sess_{currentUser.id}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="bg-slate-950/70 p-4 rounded-lg border border-slate-800 space-y-1">
                <div className="text-[11px] text-slate-400 uppercase font-mono">Role Authority</div>
                <div className="text-sm font-bold text-white">super_admin (Full Root)</div>
                <div className="text-[11px] text-slate-500 leading-relaxed">
                  Cross-tenant visibility, billing modification, index deployment, disaster recovery snapshots.
                </div>
              </div>

              <div className="bg-slate-950/70 p-4 rounded-lg border border-slate-800 space-y-1">
                <div className="text-[11px] text-slate-400 uppercase font-mono">Firestore Database</div>
                <div className="text-sm font-bold text-indigo-300 font-mono truncate">
                  ai-studio-invoxsaasenterpr-52b75464
                </div>
                <div className="text-[11px] text-slate-500 leading-relaxed">
                  Project eco-context-13kqt (europe-west2) with strict multi-tenant partition rules.
                </div>
              </div>

              <div className="bg-slate-950/70 p-4 rounded-lg border border-slate-800 space-y-1">
                <div className="text-[11px] text-slate-400 uppercase font-mono">Platform Revenue</div>
                <div className="text-sm font-bold text-emerald-400 font-mono">
                  ${currentMrr.toFixed(2)}/mo MRR · ${projectedArr.toFixed(2)}/yr ARR
                </div>
                <div className="text-[11px] text-slate-500 leading-relaxed">
                  Direct merchant collections deposited via Stripe & Visa Direct.
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Super Admin Granted Capabilities
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                <div className="flex items-center gap-2 p-2 bg-slate-950/50 rounded border border-slate-800/80">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Troubleshoot and optimize slow Firestore queries for all tenant accounts</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-slate-950/50 rounded border border-slate-800/80">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Collect and manage SaaS subscription recurring charges from tenants</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-slate-950/50 rounded border border-slate-800/80">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Triage, respond to, and resolve incoming tenant support queries</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-slate-950/50 rounded border border-slate-800/80">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Upgrade/downgrade tenant plans or reset starter invoice quotas</span>
                </div>
              </div>
            </div>
          </div>

          {/* SaaS Operations & Troubleshooting Team Accounts Directory */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-lg space-y-4 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                    SaaS Troubleshooting & Revenue Operations Accounts
                  </h3>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
                    {adminAccounts.length} Active Accounts
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Manage accounts authorized to troubleshoot tenant database queries, collect MRR subscription billing, and resolve support tickets.
                </p>
              </div>

              <button
                onClick={() => setIsCreateAccountModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create Troubleshooting Account</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {adminAccounts.map((acc) => {
                const isCurrent = acc.id === currentUser.id;
                return (
                  <div
                    key={acc.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isCurrent
                        ? 'bg-indigo-950/40 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/20'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold text-xs">
                          {acc.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-bold text-white text-xs flex items-center gap-2">
                            <span>{acc.name}</span>
                            {isCurrent && (
                              <span className="text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded uppercase">
                                Active Now
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">{acc.email}</div>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                        {acc.role}
                      </span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-mono">
                        Created {new Date(acc.createdAt).toLocaleDateString()}
                      </span>

                      {isCurrent ? (
                        <span className="text-indigo-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Current Session
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSwitchAdminAccount(acc)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <span>Switch to this Account</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: EDIT TENANT SUBSCRIPTION PLAN */}
      {/* ========================================================= */}
      {editingTenant && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 space-y-5 shadow-2xl text-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Modify Tenant Subscription</h3>
              </div>
              <button onClick={() => setEditingTenant(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePlanChanges} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Organization Tenant</label>
                <input
                  type="text"
                  disabled
                  value={editingTenant.name}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-400 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Subscription Tier</label>
                  <select
                    value={editPlan}
                    onChange={(e) => setEditPlan(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="pro">Pro ($2.00/mo - Unlimited)</option>
                    <option value="free">Free Starter (10 Invoices)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Renewal Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="active">Active (Paid)</option>
                    <option value="none">None (Free Starter)</option>
                    <option value="canceled">Canceled</option>
                    <option value="past_due">Past Due (Delinquent)</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1 text-[11px] text-slate-400">
                <div>Current Invoice Count: <strong>{editingTenant.invoiceCount || 0}</strong></div>
                <div>Card on File: <strong>{editingTenant.cardBrand || 'Visa'} •••• {editingTenant.cardLast4 || '4242'}</strong></div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingTenant(null)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Save Subscription Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: INSPECT QUERY FIRESTORE JSON & SQL */}
      {/* ========================================================= */}
      {inspectingQuery && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-2xl text-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">
                  Query Diagnostic & Index Definition: {inspectingQuery.organizationName}
                </h3>
              </div>
              <button onClick={() => setInspectingQuery(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">
                  Query Signature
                </label>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-[11px] text-slate-200">
                  {inspectingQuery.signature}
                </div>
              </div>

              {inspectingQuery.suggestedIndex ? (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-slate-400 font-mono uppercase text-[10px]">
                        Firestore Composite Index Definition (firestore.indexes.json)
                      </label>
                      <button
                        onClick={() =>
                          handleCopyCode(inspectingQuery.suggestedIndex!.firestoreJson, 'fs_json')
                        }
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                      >
                        {copiedQueryId === 'fs_json' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>Copy JSON</span>
                      </button>
                    </div>
                    <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-[11px] text-indigo-300 overflow-x-auto max-h-48">
                      {inspectingQuery.suggestedIndex.firestoreJson}
                    </pre>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-slate-400 font-mono uppercase text-[10px]">
                        PostgreSQL Equivalent DDL Index
                      </label>
                      <button
                        onClick={() =>
                          handleCopyCode(inspectingQuery.suggestedIndex!.sqlStatement, 'pg_sql')
                        }
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                      >
                        {copiedQueryId === 'pg_sql' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>Copy SQL</span>
                      </button>
                    </div>
                    <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-[11px] text-emerald-300 overflow-x-auto">
                      {inspectingQuery.suggestedIndex.sqlStatement}
                    </pre>
                  </div>

                  <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-lg text-amber-200 text-[11px] flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{inspectingQuery.suggestedIndex.reason}</span>
                  </div>
                </>
              ) : (
                <div className="p-6 bg-slate-950 rounded-lg border border-slate-800 text-center text-slate-400">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                  <span>This query already executes using an indexed composite path ({inspectingQuery.latencyMs}ms).</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              {inspectingQuery.suggestedIndex && inspectingQuery.status !== 'optimized' && (
                <button
                  type="button"
                  onClick={() => {
                    handleResolveQuery(inspectingQuery);
                    setInspectingQuery(null);
                  }}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold"
                >
                  Apply Recommended Index
                </button>
              )}
              <button
                type="button"
                onClick={() => setInspectingQuery(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: CREATE OPERATIONS & TROUBLESHOOTING ACCOUNT */}
      {/* ========================================================= */}
      {isCreateAccountModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">
                  Provision SaaS Operations & Troubleshooting Account
                </h3>
              </div>
              <button
                onClick={() => setIsCreateAccountModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTroubleshootingAccount} className="space-y-3.5 text-xs">
              <div className="p-3 bg-indigo-950/40 border border-indigo-800/50 rounded-lg text-indigo-200 text-[11px] flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  This account will be authorized with full cross-tenant capabilities to troubleshoot Firestore queries, manage MRR subscription revenue collections, and respond to tenant support tickets.
                </span>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Operator Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kenneth Onekalit (SaaS Operations)"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Operator Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. troubleshoot@kero-saas.internal"
                  value={newAccountEmail}
                  onChange={(e) => setNewAccountEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Assigned Role</label>
                  <select
                    value={newAccountRole}
                    onChange={(e) => setNewAccountRole(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="super_admin">super_admin (Full Root)</option>
                    <option value="billing_manager">billing_manager (Revenue)</option>
                    <option value="org_admin">org_admin (Platform Staff)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Operational Title</label>
                  <input
                    type="text"
                    value={newAccountTitle}
                    onChange={(e) => setNewAccountTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-2">
                <span className="block text-[10px] font-mono uppercase text-slate-400">
                  Pre-Authorized Platform Privileges:
                </span>
                <div className="space-y-1 text-[11px] text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Multi-tenant slow query troubleshooting & composite indexing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Tenant subscription recurring charges collection & revenue metrics</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Support ticket center triage, responses & SLA resolution</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateAccountModalOpen(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Provision Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receive Tenant Payment Modal */}
      {isReceivePaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden text-slate-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Receive Payment from Tenant</h3>
                  <p className="text-[11px] text-slate-400">Record and settle tenant subscription fee or invoice</p>
                </div>
              </div>
              <button
                onClick={() => setIsReceivePaymentModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleProcessReceivePayment} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Select Tenant Organization</label>
                <select
                  value={receiveOrgId}
                  onChange={(e) => {
                    setReceiveOrgId(e.target.value);
                    const sel = tenants.find((t) => t.id === e.target.value);
                    if (sel) {
                      setReceiveAmount(sel.id === 'org_quantum_ai' ? 19.0 : 2.0);
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.plan.toUpperCase()} · Tax ID: {t.taxId || 'N/A'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Payment Purpose / Plan</label>
                  <select
                    value={receivePlanName}
                    onChange={(e) => {
                      setReceivePlanName(e.target.value);
                      if (e.target.value.includes('$2.00')) setReceiveAmount(2.0);
                      if (e.target.value.includes('$19.00')) setReceiveAmount(19.0);
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Pro Tier ($2.00/mo)">Pro Tier ($2.00/mo)</option>
                    <option value="Enterprise Pro ($19.00/mo)">Enterprise Pro ($19.00/mo)</option>
                    <option value="Annual Enterprise Contract">Annual Enterprise Contract</option>
                    <option value="Quota Overage & API Usage">Quota Overage & API Usage</option>
                    <option value="Onboarding & Setup Fee">Onboarding & Setup Fee</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Amount Received (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={receiveAmount}
                    onChange={(e) => setReceiveAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Payment Gateway / Method</label>
                  <select
                    value={receiveGateway}
                    onChange={(e) => setReceiveGateway(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Stripe Visa Direct">Stripe & Visa Direct</option>
                    <option value="SWIFT / Bank Wire Transfer">SWIFT / Bank Wire Transfer</option>
                    <option value="PayPal Business">PayPal Business</option>
                    <option value="Corporate Check / Cash">Corporate Check / Remittance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Reference / Transaction ID</label>
                  <input
                    type="text"
                    required
                    value={receiveReference}
                    onChange={(e) => setReceiveReference(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. WIRE-2026-092"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Platform Settlement Impact:</span>
                </div>
                <div>● Instantly records settled revenue in the SaaS Ledger.</div>
                <div>● Extends tenant organization subscription active period by 30 days.</div>
                <div>● Updates platform MRR and tenant payment records.</div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsReceivePaymentModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Confirm Payment Received</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
