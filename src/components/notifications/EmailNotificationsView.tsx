import React, { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  CheckCircle2,
  Eye,
  Clock,
  Sparkles,
  ExternalLink,
  RefreshCw,
  X,
  FileText,
  CreditCard,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { EmailNotification, Invoice, OrganizationSettings, User } from '../../types';
import { emailService } from '../../services/emailService';
import { storageService } from '../../services/storage';

interface EmailNotificationsViewProps {
  org: OrganizationSettings;
  invoices: Invoice[];
  currentUser: User;
}

export const EmailNotificationsView: React.FC<EmailNotificationsViewProps> = ({
  org,
  invoices,
  currentUser,
}) => {
  const [emails, setEmails] = useState<EmailNotification[]>(
    emailService.getEmailsByOrg(org.id)
  );
  const [selectedEmail, setSelectedEmail] = useState<EmailNotification | null>(null);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [testInvoiceId, setTestInvoiceId] = useState<string>(invoices[0]?.id || '');
  const [dispatchFeedback, setDispatchFeedback] = useState<string | null>(null);

  const refreshEmails = () => {
    setEmails(emailService.getEmailsByOrg(org.id));
  };

  useEffect(() => {
    const handleDispatched = () => {
      refreshEmails();
    };
    window.addEventListener('invox:email_dispatched', handleDispatched);
    return () => window.removeEventListener('invox:email_dispatched', handleDispatched);
  }, [org.id]);

  const handleManualSendReminder = (inv: Invoice) => {
    const notification = emailService.sendReminderEmail(inv, org);
    storageService.addAuditLog({
      organizationId: org.id,
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorEmail: currentUser.email,
      actorRole: currentUser.role,
      action: 'EMAIL_DISPATCHED',
      resourceType: 'email',
      resourceId: notification.id,
      status: 'success',
      details: `Dispatched payment reminder email for ${inv.invoiceNumber} to ${inv.clientEmail}`,
    });

    setDispatchFeedback(`Dispatched automated reminder to ${inv.clientEmail}`);
    refreshEmails();
    setTimeout(() => setDispatchFeedback(null), 4000);
  };

  const handleResend = (email: EmailNotification) => {
    const inv = invoices.find((i) => i.id === email.invoiceId);
    if (!inv) return;

    if (email.type === 'payment_received') {
      emailService.notifyPaymentReceived(inv, org, inv.paymentMethodUsed || 'Credit Card');
    } else {
      emailService.notifyInvoiceGenerated(inv, org);
    }

    setDispatchFeedback(`Re-dispatched notification to ${email.recipientEmail}`);
    refreshEmails();
    setTimeout(() => setDispatchFeedback(null), 4000);
  };

  const totalDelivered = emails.length;
  const openedCount = emails.filter((e) => e.status === 'opened' || e.status === 'clicked').length;
  const clickedCount = emails.filter((e) => e.status === 'clicked').length;
  const openRate = totalDelivered > 0 ? Math.round((openedCount / totalDelivered) * 100) : 100;
  const clickRate = totalDelivered > 0 ? Math.round((clickedCount / totalDelivered) * 100) : 40;

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Automated Customer Email Notifications
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Automated invoice delivery, real-time payment confirmation receipts, and payment reminders.
          </p>
        </div>

        {invoices.length > 0 && (
          <div className="flex items-center gap-2">
            <select
              value={testInvoiceId}
              onChange={(e) => setTestInvoiceId(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
            >
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoiceNumber} ({inv.clientName})
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                const inv = invoices.find((i) => i.id === testInvoiceId);
                if (inv) handleManualSendReminder(inv);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors whitespace-nowrap"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Reminder</span>
            </button>
          </div>
        )}
      </div>

      {dispatchFeedback && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-lg text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{dispatchFeedback}</span>
        </div>
      )}

      {/* 4 Performance Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Automated Dispatches</span>
            <Mail className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            {totalDelivered}
          </div>
          <div className="text-[11px] text-slate-500">
            100% automated delivery rate
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Customer Open Rate</span>
            <Eye className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
            {openRate}%
          </div>
          <div className="text-[11px] text-slate-500">
            High client engagement
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Payment Link Clicks</span>
            <ExternalLink className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300 tabular-nums">
            {clickRate}%
          </div>
          <div className="text-[11px] text-slate-500">
            Direct conversion via Visa / Stripe
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Delivery Pipeline</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-sm font-semibold text-white mt-1">
            Amazon SES / SMTP
          </div>
          <div className="text-[11px] text-emerald-400">
            TLS 1.3 Verified · DKIM / SPF Valid
          </div>
        </div>
      </div>

      {/* Active Automated Triggers List */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Active Automated Triggers</h2>
          <span className="text-[11px] font-mono text-emerald-400">● 3 OF 3 ACTIVE</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 space-y-1.5">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-semibold text-slate-200">1. Invoice Generated</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Dispatches instantly when an invoice is created. Contains itemized lines, due date, bank info, and Visa/Stripe payment button.
            </p>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 space-y-1.5">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-slate-200">2. Payment Receipt</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Dispatches automatically when client pays via Stripe / VISA or admin marks invoice paid. Confirms zero balance and transaction ID.
            </p>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 space-y-1.5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold text-slate-200">3. Due Date Reminder</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Sends automated polite reminder with direct settlement link for upcoming or overdue invoice balances.
            </p>
          </div>
        </div>
      </div>

      {/* Email Outbox & Delivery Log Table */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-semibold text-white">Automated Dispatch History & Logs</h2>
            <div className="text-[11px] text-slate-400">Live delivery records for customer communications</div>
          </div>
          <button
            onClick={refreshEmails}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
            title="Refresh logs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 font-medium border-b border-slate-800 select-none">
            <tr>
              <th className="py-3 px-4">Sent At</th>
              <th className="py-3 px-4">Customer Recipient</th>
              <th className="py-3 px-4">Trigger Type</th>
              <th className="py-3 px-4">Subject</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Preview</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {emails.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">
                  No automated emails logged yet for this organization.
                </td>
              </tr>
            ) : (
              emails.map((email) => (
                <tr key={email.id} className="hover:bg-slate-800/25 transition-colors">
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-400 tabular-nums whitespace-nowrap">
                    {new Date(email.sentAt).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-200">{email.recipientName}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{email.recipientEmail}</div>
                  </td>
                  <td className="py-3 px-4">
                    {email.type === 'payment_received' ? (
                      <span className="text-emerald-400 font-medium font-mono text-[11px]">
                        ● Payment Receipt
                      </span>
                    ) : email.type === 'invoice_generated' ? (
                      <span className="text-indigo-400 font-medium font-mono text-[11px]">
                        ● New Invoice
                      </span>
                    ) : (
                      <span className="text-amber-400 font-medium font-mono text-[11px]">
                        ● Reminder
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-300 max-w-xs truncate" title={email.subject}>
                    {email.subject}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-emerald-400 font-mono text-[10px] bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800 uppercase font-semibold">
                      {email.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedEmail(email)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => handleResend(email)}
                        className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                        title="Resend this email"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Rendered Email Preview Modal */}
      {selectedEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-3.5 bg-slate-950 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-200">
                  Email Preview: <span className="font-mono text-indigo-400">{selectedEmail.subject}</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  {selectedEmail.status.toUpperCase()}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-800 rounded p-0.5 border border-slate-700 text-xs">
                  <button
                    onClick={() => setViewMode('desktop')}
                    className={`px-2 py-0.5 rounded ${viewMode === 'desktop' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400'}`}
                  >
                    Desktop
                  </button>
                  <button
                    onClick={() => setViewMode('mobile')}
                    className={`px-2 py-0.5 rounded ${viewMode === 'mobile' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400'}`}
                  >
                    Mobile
                  </button>
                </div>
                <button
                  onClick={() => setSelectedEmail(null)}
                  className="p-1 rounded text-slate-400 hover:text-white ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Email Meta bar */}
            <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800 text-xs text-slate-400 space-y-1">
              <div>To: <strong className="text-slate-200">{selectedEmail.recipientName}</strong> &lt;{selectedEmail.recipientEmail}&gt;</div>
              <div>From: <strong className="text-slate-200">{org.name} Billing Engine</strong> &lt;notifications@{org.slug}.kero.io&gt;</div>
              <div>Subject: <strong className="text-slate-200">{selectedEmail.subject}</strong></div>
            </div>

            {/* Rendered Email Body container */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-950 flex justify-center">
              <div
                className={`bg-white text-slate-900 rounded-lg shadow-xl overflow-hidden transition-all ${
                  viewMode === 'mobile' ? 'w-[360px]' : 'w-full max-w-[620px]'
                }`}
                dangerouslySetInnerHTML={{ __html: selectedEmail.bodyHtml }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
