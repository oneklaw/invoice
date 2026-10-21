import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  ArrowLeftRight,
  Globe,
  PieChart as PieIcon,
  BarChart3,
  AlertTriangle,
  Send,
  Eye,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Invoice, OrganizationSettings, SupportedLanguage, User } from '../../types';
import { translations } from '../../i18n/translations';
import { currencyService } from '../../services/currencyService';
import { aiService } from '../../services/aiService';
import { storageService } from '../../services/storage';

interface AnalyticsDashboardProps {
  invoices: Invoice[];
  org: OrganizationSettings;
  currentUser: User;
  currentLang: SupportedLanguage;
  onOpenNewInvoice: () => void;
  onOpenUpgradeModal: () => void;
  onViewInvoice: (inv: Invoice) => void;
  onNavigateTab: (tab: string) => void;
  onOpenCurrencyConversion?: () => void;
  onOpenConverter?: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  paid: '#10b981', // emerald
  sent: '#6366f1', // indigo
  overdue: '#f43f5e', // rose
  draft: '#64748b', // slate
  void: '#475569',
};

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  invoices,
  org,
  currentUser,
  currentLang,
  onOpenNewInvoice,
  onOpenUpgradeModal,
  onViewInvoice,
  onNavigateTab,
  onOpenCurrencyConversion,
  onOpenConverter,
}) => {
  const t = translations[currentLang];
  const isPro = org.plan === 'pro' && org.subscriptionStatus === 'active';
  const usedCount = org.invoiceCount || 0;
  const remainingFree = Math.max(0, 10 - usedCount);

  // Critical Alerts from Gemini AI
  const [criticalAlerts, setCriticalAlerts] = useState<{
    criticalAlertCount: number;
    projectedShortfallRisk: 'low' | 'medium' | 'high';
    headline: string;
    highRiskInvoices: {
      invoiceId: string;
      invoiceNumber: string;
      clientName: string;
      amount: number;
      dueDate: string;
      riskFactor: string;
      urgency: 'high' | 'critical';
    }[];
  } | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingAI(true);
    aiService.getCriticalCashflowAlerts(invoices, org.currency)
      .then((res) => {
        if (isMounted) {
          setCriticalAlerts(res);
          setIsLoadingAI(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoadingAI(false);
      });

    return () => {
      isMounted = false;
    };
  }, [invoices, org.currency]);

  // Inventory low stock check
  const lowStockItems = storageService.getLowStockItems(org.id);

  // Financial calculations
  const totalBilled = invoices
    .filter((i) => i.status !== 'void')
    .reduce((sum, i) => sum + i.totalAmount, 0);

  const totalCollected = invoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + i.totalAmount, 0);

  const totalOutstanding = invoices
    .filter((i) => i.status === 'sent')
    .reduce((sum, i) => sum + i.totalAmount, 0);

  const totalOverdue = invoices
    .filter((i) => i.status === 'overdue')
    .reduce((sum, i) => sum + i.totalAmount, 0);

  const paidCount = invoices.filter((i) => i.status === 'paid').length;
  const overdueCount = invoices.filter((i) => i.status === 'overdue').length;

  // Monthly Revenue Trends Data for Recharts BarChart
  const monthlyTrendsMap: Record<string, { billed: number; collected: number }> = {};
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();

  // Initialize last 6 months
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${monthNames[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`;
    monthlyTrendsMap[key] = { billed: 0, collected: 0 };
  }

  invoices.forEach((inv) => {
    if (inv.status === 'void') return;
    const date = new Date(inv.issueDate || inv.createdAt);
    if (!isNaN(date.getTime())) {
      const key = `${monthNames[date.getMonth()]} ${String(date.getFullYear()).slice(-2)}`;
      if (monthlyTrendsMap[key]) {
        monthlyTrendsMap[key].billed += inv.totalAmount;
        if (inv.status === 'paid') {
          monthlyTrendsMap[key].collected += inv.totalAmount;
        }
      }
    }
  });

  const monthlyChartData = Object.entries(monthlyTrendsMap).map(([month, data]) => ({
    month,
    billed: Number(data.billed.toFixed(2)),
    collected: Number(data.collected.toFixed(2)),
  }));

  // Invoice Status Distribution Data for Recharts PieChart
  const statusCounts: Record<string, number> = {
    paid: 0,
    sent: 0,
    overdue: 0,
    draft: 0,
  };

  invoices.forEach((inv) => {
    if (statusCounts[inv.status] !== undefined) {
      statusCounts[inv.status] += 1;
    }
  });

  const pieChartData = [
    { name: 'Paid', value: statusCounts.paid, color: STATUS_COLORS.paid },
    { name: 'Pending (Sent)', value: statusCounts.sent, color: STATUS_COLORS.sent },
    { name: 'Overdue', value: statusCounts.overdue, color: STATUS_COLORS.overdue },
    { name: 'Draft', value: statusCounts.draft, color: STATUS_COLORS.draft },
  ].filter((item) => item.value > 0);

  // If no data yet, provide a baseline slice so pie chart renders elegantly
  if (pieChartData.length === 0) {
    pieChartData.push({ name: 'Ready for Invoicing', value: 1, color: '#475569' });
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Banner / Welcome & Quota alert */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <span>{org.name}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-mono font-medium">
              Enterprise Dashboard
            </span>
          </h1>
          <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-400 mt-1.5">
            <span className="flex items-center gap-1.5">
              <span>Operating Currency:</span>
              <strong className="text-white font-mono bg-slate-900 border border-slate-700 px-2 py-0.5 rounded flex items-center gap-1">
                <span>{currencyService.getCurrency(org.currency).flag}</span>
                <span>{org.currency}</span>
                <span className="text-slate-400 font-normal">({currencyService.getCurrency(org.currency).symbol})</span>
              </strong>
            </span>

            {onOpenCurrencyConversion && (
              <button
                type="button"
                onClick={onOpenCurrencyConversion}
                className="px-2 py-0.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded text-[11px] font-semibold transition-colors flex items-center gap-1"
                title="Change or convert company operating currency"
              >
                <ArrowLeftRight className="w-3 h-3" />
                <span>Change Currency</span>
              </button>
            )}

            {onOpenConverter && (
              <button
                type="button"
                onClick={onOpenConverter}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded text-[11px] transition-colors flex items-center gap-1"
                title="Open World FX Rates & Currency Converter"
              >
                <Globe className="w-3 h-3 text-indigo-400" />
                <span>FX Calculator</span>
              </button>
            )}

            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>Tax ID: <strong className="text-slate-300 font-mono">{org.taxId}</strong></span>
          </div>
        </div>

        {/* Free Tier vs Pro Subscription Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4 shrink-0 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-300">
                {isPro ? 'Enterprise Pro Tier' : 'Free Starter Tier'}
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                isPro ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
              }`}>
                {isPro ? '$2.00 / MONTH' : `${usedCount}/10 FREE USED`}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {isPro ? (
                <span>Recurring billing active via VISA (•••• {org.cardLast4 || '4242'}) & Stripe</span>
              ) : (
                <span>{remainingFree} free invoice{remainingFree === 1 ? '' : 's'} remaining before $2/mo limit</span>
              )}
            </div>
          </div>

          {!isPro ? (
            <button
              onClick={onOpenUpgradeModal}
              className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Upgrade ($2/mo)</span>
            </button>
          ) : (
            <button
              onClick={() => onNavigateTab('billing')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-slate-700 transition-colors whitespace-nowrap"
            >
              Manage Billing
            </button>
          )}
        </div>
      </div>

      {/* Critical Alert Section: Gemini Cash Flow Monitor */}
      {criticalAlerts && criticalAlerts.highRiskInvoices.length > 0 && (
        <div className="p-4 bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900 border border-rose-800/60 rounded-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
              <span>Gemini AI Cash Flow Risk Monitor</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono">
                Risk Level: {criticalAlerts.projectedShortfallRisk.toUpperCase()}
              </span>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {criticalAlerts.criticalAlertCount} High-Risk Account(s)
            </span>
          </div>

          <p className="text-xs text-slate-200 leading-relaxed font-medium">
            {criticalAlerts.headline}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            {criticalAlerts.highRiskInvoices.slice(0, 3).map((item) => (
              <div
                key={item.invoiceId}
                className="p-3 bg-slate-950/80 border border-rose-900/40 rounded-lg space-y-1 hover:border-rose-700 transition-colors"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">{item.invoiceNumber}</span>
                  <span className="font-mono text-rose-400 font-bold">
                    {org.currency} {item.amount.toLocaleString()}
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 truncate font-medium">{item.clientName}</div>
                <div className="text-[10px] text-slate-400 leading-tight">{item.riskFactor}</div>
                <div className="pt-1 flex items-center justify-between">
                  <span className="text-[10px] text-amber-400">Due {item.dueDate}</span>
                  <button
                    onClick={() => onNavigateTab('invoices')}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                  >
                    <span>Follow Up</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Low Stock Threshold Alert if any */}
      {lowStockItems.length > 0 && (
        <div className="p-3.5 bg-amber-950/30 border border-amber-800/50 rounded-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <div className="text-xs font-semibold text-amber-200">
                Low Inventory Threshold Alert ({lowStockItems.length} item{lowStockItems.length === 1 ? '' : 's'} low in stock)
              </div>
              <div className="text-[11px] text-slate-400">
                {lowStockItems.map(i => `${i.name} (${i.currentStock} ${i.unit} remaining)`).slice(0, 3).join(', ')}
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('inventory')}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            Manage Stock →
          </button>
        </div>
      )}

      {/* 4 Primary Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Billed */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Billed Volume</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            {org.currency} {totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500">
            Across {invoices.length} lifetime invoices
          </div>
        </div>

        {/* Collected */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Collected Revenue</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
            {org.currency} {totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500">
            {paidCount} paid in full via Stripe/Wire
          </div>
        </div>

        {/* Outstanding */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Pending Receivables</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-indigo-300 tabular-nums">
            {org.currency} {totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500">
            Active invoices awaiting client payment
          </div>
        </div>

        {/* Overdue */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Overdue Balances</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400 tabular-nums">
            {org.currency} {totalOverdue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500">
            {overdueCount} invoice{overdueCount === 1 ? '' : 's'} past payment terms
          </div>
        </div>
      </div>

      {/* RECHARTS SECTION: Monthly Revenue Trends & Invoice Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Trends BarChart (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-semibold text-white">Monthly Revenue Trends</h2>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block" />
                <span>Billed Volume</span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                <span>Collected</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `${org.currency} ${v}`} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  labelStyle={{ color: '#94a3b8' }}
                  formatter={(value: any) => [`${org.currency} ${Number(value).toLocaleString()}`, '']}
                />
                <Bar dataKey="billed" fill="#6366f1" radius={[4, 4, 0, 0]} name="Billed" />
                <Bar dataKey="collected" fill="#10b981" radius={[4, 4, 0, 0]} name="Collected" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Invoice Status Distribution PieChart (1 col) */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-white">Invoice Status Distribution</h2>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Total: {invoices.length}
            </span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(value: any, name: any) => [`${value} Invoice(s)`, name]}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(val: any) => <span className="text-xs text-slate-300">{val}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Middle Section: Payment Gateways & Revenue Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Gateways Integration Status */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Configured Payment Gateways</h2>
            <CreditCard className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-3">
            {/* Stripe & Visa */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">Stripe & VISA Direct</span>
                <span className="text-[10px] text-emerald-400 font-mono font-medium">CONNECTED</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Primary gateway for client invoice card payments & recurring subscriptions.
              </div>
            </div>

            {/* Bank Wire Details */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">SWIFT / IBAN Bank Wire</span>
                <span className="text-[10px] text-emerald-400 font-mono font-medium">ACTIVE</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono truncate">
                {org.bankDetails.bankName} · {org.bankDetails.swiftBic}
              </div>
            </div>

            {/* PayPal */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">PayPal Business</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {org.paymentGateways.paypalEmail ? 'READY' : 'OPTIONAL'}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {org.paymentGateways.paypalEmail || 'Add in invoice customization settings'}
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('branding')}
            className="w-full py-2 text-xs text-indigo-400 hover:text-indigo-300 font-medium text-center hover:underline"
          >
            Edit Custom Bank & Payment Methods →
          </button>
        </div>

        {/* Recent Invoices View */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Recent Organization Invoices</h2>
            <button
              onClick={() => onNavigateTab('invoices')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              View All ({invoices.length}) →
            </button>
          </div>

          <div className="divide-y divide-slate-800">
            {invoices.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No invoices recorded yet. Click &quot;+ Create New Invoice&quot; to issue your first invoice.
              </div>
            ) : (
              invoices.slice(0, 4).map((inv) => (
                <div
                  key={inv.id}
                  className="py-3 flex items-center justify-between gap-4 hover:bg-slate-800/30 px-2 rounded-lg transition-colors cursor-pointer"
                  onClick={() => onViewInvoice(inv)}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-xs text-indigo-300">
                        {inv.invoiceNumber}
                      </span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span className="text-xs font-medium text-slate-200">{inv.clientName}</span>
                      {inv.tags && inv.tags.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">
                          {inv.tags[0]}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Due {inv.dueDate} · {inv.items.length} line item{inv.items.length === 1 ? '' : 's'}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold font-mono text-white tabular-nums">
                      {inv.currency} {inv.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[11px] mt-0.5">
                      <span
                        className={
                          inv.status === 'paid'
                            ? 'text-emerald-400 font-medium'
                            : inv.status === 'overdue'
                            ? 'text-rose-400 font-medium'
                            : 'text-indigo-400 font-medium'
                        }
                      >
                        {inv.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Multi-Tenant Boundary Isolated</span>
            </span>
            <button
              onClick={onOpenNewInvoice}
              className="text-indigo-400 hover:text-indigo-300 font-medium font-semibold"
            >
              + Create New Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
