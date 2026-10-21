import React, { useState, useEffect } from 'react';
import {
  Building2,
  FileText,
  Download,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Receipt,
  ArrowLeft,
  Calendar,
  Lock,
} from 'lucide-react';
import { Client, Invoice, OrganizationSettings } from '../../types';
import { storageService } from '../../services/storage';
import { googleDriveService } from '../../services/googleDriveService';

interface ClientPortalViewProps {
  clientId?: string;
  onClose?: () => void;
  onOpenPayInvoice?: (inv: Invoice) => void;
  onPreviewInvoice?: (inv: Invoice) => void;
}

export const ClientPortalView: React.FC<ClientPortalViewProps> = ({
  clientId: initialClientId,
  onClose,
  onOpenPayInvoice,
  onPreviewInvoice,
}) => {
  // If not passed in props, check hash e.g. #portal/clt_1234
  const [clientId, setClientId] = useState<string>(() => {
    if (initialClientId) return initialClientId;
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#portal/')) {
      return window.location.hash.replace('#portal/', '');
    }
    return '';
  });

  const [portalData, setPortalData] = useState<{
    client?: Client;
    org?: OrganizationSettings;
    invoices: Invoice[];
    payments: { date: string; amount: number; method: string; invoiceNo: string }[];
  } | null>(null);

  const [isDownloadingBatch, setIsDownloadingBatch] = useState(false);

  useEffect(() => {
    if (clientId) {
      const data = storageService.getPublicClientPortalData(clientId);
      setPortalData(data);
      // Record client activity: portal accessed
      if (data.client && data.org) {
        storageService.recordClientActivity({
          organizationId: data.org.id,
          clientId: data.client.id,
          clientName: data.client.name,
          type: 'portal_access',
          ipAddress: '198.51.100.82',
        });
      }
    }
  }, [clientId]);

  if (!portalData || !portalData.client || !portalData.org) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center text-slate-300">
        <div className="max-w-md bg-slate-900 border border-slate-800 rounded-xl p-8 space-y-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 mx-auto flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">Client Portal Access</h2>
          <p className="text-xs text-slate-400">
            Please provide a valid client portal access link or select a client profile to view payment history and statements.
          </p>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Back to Dashboard
            </button>
          )}
        </div>
      </div>
    );
  }

  const { client, org, invoices, payments } = portalData;
  const brandColor = org.clientPortalSettings?.primaryBrandColor || '#6366f1';

  const totalBilled = invoices.reduce((sum, i) => sum + i.totalAmount, 0);
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalOutstanding = Math.max(0, totalBilled - totalPaid);

  const handleDownloadAll = () => {
    setIsDownloadingBatch(true);
    try {
      googleDriveService.downloadMergedInvoicesPdf(invoices, org);
      storageService.recordClientActivity({
        organizationId: org.id,
        clientId: client.id,
        clientName: client.name,
        type: 'downloaded',
        ipAddress: '198.51.100.82',
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsDownloadingBatch(false);
    }
  };

  const handleDownloadSingle = (inv: Invoice) => {
    googleDriveService.downloadMergedInvoicesPdf([inv], org);
    storageService.recordClientActivity({
      organizationId: org.id,
      clientId: client.id,
      clientName: client.name,
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      type: 'downloaded',
      ipAddress: '198.51.100.82',
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors mr-1"
                title="Exit Client Portal"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            {org.clientPortalSettings?.logoUrl ? (
              <img src={org.clientPortalSettings.logoUrl} alt={org.name} className="h-8 max-w-[120px] object-contain rounded" />
            ) : (
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs shadow-sm"
                style={{ backgroundColor: brandColor }}
              >
                {org.name.slice(0, 2).toUpperCase()}
              </div>
            )}

            <div>
              <div className="text-sm font-bold text-white">{org.name}</div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <span>Secure Client Billing Portal</span>
                <span className="text-emerald-400 flex items-center gap-0.5">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Verified 256-Bit</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleDownloadAll}
              disabled={isDownloadingBatch || invoices.length === 0}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>{isDownloadingBatch ? 'Compiling PDF...' : 'Download All Past Invoices'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 lg:p-8 space-y-8">
        {/* Welcome Client Banner */}
        <div
          className="p-6 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950 relative overflow-hidden"
          style={{ borderLeftColor: brandColor, borderLeftWidth: '6px' }}
        >
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Customer Account Statement
              </span>
              <h1 className="text-2xl font-bold text-white tracking-tight mt-0.5">
                {client.name}
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                {client.companyName ? `${client.companyName} · ` : ''}{client.email} · {client.address}, {client.city} {client.country}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[11px] text-slate-400">Total Outstanding Balance</div>
                <div className="text-2xl font-bold font-mono text-emerald-400">
                  {client.currency} {totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Lifetime Invoiced</span>
              <Receipt className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-xl font-bold font-mono text-white mt-1">
              {client.currency} {totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">{invoices.length} total invoice records</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Settled Payments</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
              {client.currency} {totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">{payments.length} verified transactions</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Payment Terms</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-bold font-mono text-white mt-1">
              {client.recommendedPaymentTerms || org.defaultPaymentTerms || 'Net 30'}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Online card / Direct Bank Wire</div>
          </div>
        </div>

        {/* Invoices List */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Invoices & Billing Statements</h2>
              <p className="text-xs text-slate-400 mt-0.5">View statements, print or download PDF invoices, and pay online</p>
            </div>
            <span className="text-xs text-slate-400 font-mono">{invoices.length} Statements</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold select-none">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 font-sans">
                      No invoices found for this account.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-bold text-white">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-sans">{inv.issueDate}</td>
                      <td className="py-3 px-4 text-slate-300 font-sans">{inv.dueDate}</td>
                      <td className="py-3 px-4 font-bold text-slate-100">
                        {inv.currency} {inv.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            inv.status === 'paid'
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                              : inv.status === 'overdue'
                              ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                              : 'bg-indigo-950/80 text-indigo-300 border border-indigo-800/60'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-sans space-x-2">
                        <button
                          onClick={() => handleDownloadSingle(inv)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-3.5 h-3.5 inline mr-1" />
                          <span>PDF</span>
                        </button>
                        {inv.status !== 'paid' && onOpenPayInvoice && (
                          <button
                            onClick={() => onOpenPayInvoice(inv)}
                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded transition-colors shadow-sm"
                          >
                            <span>Pay Now</span>
                          </button>
                        )}
                        {onPreviewInvoice && (
                          <button
                            onClick={() => onPreviewInvoice(inv)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded transition-colors"
                          >
                            <span>View</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment History Section */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Payment & Settlement History</h2>
              <p className="text-xs text-slate-400 mt-0.5">Audited electronic payment receipts and bank wire confirmations</p>
            </div>
            <CreditCard className="w-4 h-4 text-slate-400" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold select-none">
                <tr>
                  <th className="py-3 px-4">Payment Date</th>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500 font-sans">
                      No past payments recorded yet.
                    </td>
                  </tr>
                ) : (
                  payments.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 text-slate-300 font-sans">
                        {new Date(p.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 font-bold text-white">{p.invoiceNo}</td>
                      <td className="py-3 px-4 text-slate-300 font-sans">{p.method}</td>
                      <td className="py-3 px-4 font-bold text-emerald-400">
                        {client.currency} {p.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Settled</span>
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        <p>Invoicing and billing portal securely powered by {org.name} · All rights reserved.</p>
      </footer>
    </div>
  );
};
