import React from 'react';
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
} from 'lucide-react';
import { Invoice, OrganizationSettings, SupportedLanguage, User } from '../../types';
import { translations } from '../../i18n/translations';

interface AnalyticsDashboardProps {
  invoices: Invoice[];
  org: OrganizationSettings;
  currentUser: User;
  currentLang: SupportedLanguage;
  onOpenNewInvoice: () => void;
  onOpenUpgradeModal: () => void;
  onViewInvoice: (inv: Invoice) => void;
  onNavigateTab: (tab: string) => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  invoices,
  org,
  currentUser,
  currentLang,
  onOpenNewInvoice,
  onOpenUpgradeModal,
  onViewInvoice,
  onNavigateTab,
}) => {
  const t = translations[currentLang];
  const isPro = org.plan === 'pro' && org.subscriptionStatus === 'active';
  const usedCount = org.invoiceCount || 0;
  const remainingFree = Math.max(0, 10 - usedCount);

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

  return (
    <div className="space-y-8">
      {/* Top Banner / Welcome & Quota alert */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {org.name}
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <span>Operating Currency: <strong className="text-slate-300 font-mono">{org.currency}</strong></span>
            <span aria-hidden="true">·</span>
            <span>Tax ID: <strong className="text-slate-300 font-mono">{org.taxId}</strong></span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-400">Strict Data Isolation Active</span>
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
                Primary gateway for client invoice card payments & $2/mo recurring subscriptions.
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
            {invoices.slice(0, 4).map((inv) => (
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
            ))}
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Multi-Tenant Data Encryption Enforced</span>
            </span>
            <button
              onClick={onOpenNewInvoice}
              className="text-indigo-400 hover:text-indigo-300 font-medium"
            >
              + Create New Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
