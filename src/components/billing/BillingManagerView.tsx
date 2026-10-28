import React, { useState } from 'react';
import {
  CreditCard,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Download,
  Calendar,
  Lock,
  RefreshCw,
  Send,
} from 'lucide-react';
import { OrganizationSettings, User } from '../../types';
import { storageService } from '../../services/storage';

interface BillingManagerViewProps {
  org: OrganizationSettings;
  currentUser: User;
  onOpenUpgradeModal: () => void;
  onRefresh: () => void;
}

export const BillingManagerView: React.FC<BillingManagerViewProps> = ({
  org,
  currentUser,
  onOpenUpgradeModal,
  onRefresh,
}) => {
  const isPro = org.plan === 'pro' && org.subscriptionStatus === 'active';
  const usedCount = org.invoiceCount || 0;
  const [webhookLog, setWebhookLog] = useState<string | null>(null);

  const canManageBilling = ['super_admin', 'org_admin', 'billing_manager'].includes(currentUser.role);

  const handleCancelPlan = () => {
    if (!canManageBilling) {
      alert('Your role does not have permission to modify subscriptions.');
      return;
    }

    if (confirm('Are you sure you want to cancel the $2.00/month Pro subscription? Your plan will downgrade to Free once the current period ends.')) {
      storageService.cancelSubscription(org.id, currentUser);
      onRefresh();
    }
  };

  const simulateWebhook = (eventType: string) => {
    const time = new Date().toLocaleTimeString();
    setWebhookLog(`[${time}] Received Stripe Webhook: '${eventType}' for Customer ${org.slug} -> Verified 200 OK.`);
    setTimeout(() => setWebhookLog(null), 5000);
  };

  const mockReceipts = [
    { id: 'rec_2026_10', date: '2026-10-18', amount: '$2.00', status: 'Paid', method: 'VISA •••• 4242' },
    { id: 'rec_2026_09', date: '2026-09-18', amount: '$2.00', status: 'Paid', method: 'VISA •••• 4242' },
    { id: 'rec_2026_08', date: '2026-08-18', amount: '$2.00', status: 'Paid', method: 'VISA •••• 4242' },
  ];

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Subscription & Billing Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your recurring $2/mo Stripe & VISA subscription, payment methods, and invoice quotas.
          </p>
        </div>

        {!isPro ? (
          <button
            onClick={onOpenUpgradeModal}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 rounded-lg shadow-sm transition-all whitespace-nowrap self-start sm:self-auto"
          >
            <Sparkles className="w-4 h-4" />
            <span>Upgrade to Pro ($2.00/mo)</span>
          </button>
        ) : (
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Active Pro Subscription ($2.00/mo)</span>
          </span>
        )}
      </div>

      {webhookLog && (
        <div className="p-3 bg-slate-900 border border-indigo-700/60 rounded-lg text-indigo-300 text-xs font-mono flex items-center gap-2">
          <Send className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>{webhookLog}</span>
        </div>
      )}

      {/* Main Plan Overview Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Current Tier</div>
            <div className="text-2xl font-bold text-white mt-1">
              {isPro ? 'KERO INVOICE Enterprise Pro' : 'Free Starter Tier'}
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-lg">
              {isPro
                ? 'Unlimited invoice generation, full multi-user RBAC, priority caching, and Stripe & VISA recurring billing integration.'
                : 'Free starter tier allows up to 10 free invoices. Once reached, upgrade to continue issuing invoices for $2.00/mo.'}
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-right min-w-[200px]">
            <div className="text-xs text-slate-400">Subscription Price</div>
            <div className="text-2xl font-bold text-white font-mono mt-0.5">
              $2.00 <span className="text-xs font-normal text-slate-400">/ mo</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {isPro ? 'Renews automatically' : 'Fixed pricing, no hidden fees'}
            </div>
          </div>
        </div>

        {/* Quota Gauge */}
        <div className="p-4 bg-slate-950/80 rounded-lg border border-slate-800/80 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="font-medium text-slate-300">Lifetime Invoices Generated:</span>
            <span className="font-mono text-white tabular-nums">
              {isPro ? `${usedCount} (Unlimited Pro)` : `${usedCount} / 10 Free`}
            </span>
          </div>

          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isPro
                  ? 'bg-emerald-500'
                  : usedCount >= 10
                  ? 'bg-rose-500'
                  : 'bg-indigo-500'
              }`}
              style={{ width: isPro ? '100%' : `${Math.min(100, (usedCount / 10) * 100)}%` }}
            />
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>
              {isPro
                ? 'Your organization has unlimited recurring invoice capacity.'
                : usedCount >= 10
                ? 'Limit reached! Please upgrade to create additional invoices.'
                : `${10 - usedCount} invoices remaining before the $2/mo subscription is required.`}
            </span>
            {!isPro && (
              <button
                onClick={onOpenUpgradeModal}
                className="text-indigo-400 hover:text-indigo-300 font-semibold hover:underline"
              >
                Unlock Unlimited →
              </button>
            )}
          </div>
        </div>

        {/* Payment Method on File */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
            <div className="text-xs font-semibold text-slate-300">Primary Payment Method on File</div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-6 bg-blue-900/60 border border-blue-700 text-blue-200 font-bold text-[10px] rounded flex items-center justify-center font-mono">
                VISA
              </div>
              <div className="text-xs text-slate-200">
                Visa ending in <strong className="font-mono text-white">{org.cardLast4 || '4242'}</strong>
              </div>
            </div>
            <div className="text-[11px] text-slate-500">
              Processed via Stripe Billing. Next renewal date: Nov 18, 2026.
            </div>
            {canManageBilling && (
              <button
                onClick={onOpenUpgradeModal}
                className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline pt-1 block"
              >
                Update Card Details
              </button>
            )}
          </div>

          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
            <div className="text-xs font-semibold text-slate-300">Subscription Controls</div>
            <div className="text-[11px] text-slate-400">
              Status: <span className="font-mono text-emerald-400 font-semibold">{org.subscriptionStatus.toUpperCase()}</span>
            </div>
            <div className="text-[11px] text-slate-500">
              In accordance with SaaS regulations, you can cancel recurring renewals anytime with a single click.
            </div>
            {isPro && canManageBilling && (
              <button
                onClick={handleCancelPlan}
                className="text-xs text-rose-400 hover:text-rose-300 hover:underline pt-1 block"
              >
                Cancel Subscription Renewal
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Receipts History Table */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-white">Stripe & VISA Subscription Invoices</div>
            <div className="text-[11px] text-slate-400">Monthly billing receipts for accounting and tax deduction</div>
          </div>
          <Receipt className="w-4 h-4 text-slate-400" />
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 font-medium border-b border-slate-800">
            <tr>
              <th className="py-3 px-6">Receipt ID</th>
              <th className="py-3 px-4">Billing Date</th>
              <th className="py-3 px-4">Amount</th>
              <th className="py-3 px-4">Payment Method</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-6 text-right">PDF</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
            {mockReceipts.map((rec) => (
              <tr key={rec.id} className="hover:bg-slate-800/20">
                <td className="py-3 px-6 text-slate-300">{rec.id}</td>
                <td className="py-3 px-4 text-slate-400 tabular-nums">{rec.date}</td>
                <td className="py-3 px-4 text-white font-semibold tabular-nums">{rec.amount}</td>
                <td className="py-3 px-4 text-slate-300 font-sans">{rec.method}</td>
                <td className="py-3 px-4 text-emerald-400 font-medium">● {rec.status}</td>
                <td className="py-3 px-6 text-right">
                  <button
                    onClick={() => alert(`Downloaded receipt ${rec.id}.pdf`)}
                    className="p-1 text-slate-400 hover:text-white transition-colors"
                    title="Download Receipt PDF"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Stripe Webhook Simulator */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="text-xs font-semibold text-white">Stripe & Visa Webhook Testing Sandbox</div>
        <p className="text-xs text-slate-400">
          Simulate incoming payment events from Stripe to test real-time state synchronization:
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={() => simulateWebhook('invoice.payment_succeeded')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-mono transition-colors"
          >
            invoice.payment_succeeded
          </button>
          <button
            onClick={() => simulateWebhook('customer.subscription.updated')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-mono transition-colors"
          >
            customer.subscription.updated
          </button>
          <button
            onClick={() => simulateWebhook('payment_intent.succeeded')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-mono transition-colors"
          >
            payment_intent.succeeded
          </button>
        </div>
      </div>
    </div>
  );
};
