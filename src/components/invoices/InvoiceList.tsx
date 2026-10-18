import React, { useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  Eye,
  Edit2,
  CreditCard,
  Ban,
  CheckCircle,
  Copy,
  Check,
  Plus,
} from 'lucide-react';
import { Invoice, InvoiceStatus, OrganizationSettings, SupportedLanguage, User } from '../../types';
import { translations } from '../../i18n/translations';
import { storageService } from '../../services/storage';

interface InvoiceListProps {
  invoices: Invoice[];
  org: OrganizationSettings;
  currentUser: User;
  currentLang: SupportedLanguage;
  onViewInvoice: (inv: Invoice) => void;
  onEditInvoice: (inv: Invoice) => void;
  onOpenPayModal: (inv: Invoice) => void;
  onOpenNewInvoice: () => void;
  onRefresh: () => void;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({
  invoices,
  org,
  currentUser,
  currentLang,
  onViewInvoice,
  onEditInvoice,
  onOpenPayModal,
  onOpenNewInvoice,
  onRefresh,
}) => {
  const t = translations[currentLang];
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const canEdit = ['super_admin', 'org_admin', 'invoice_editor'].includes(currentUser.role);

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.clientEmail.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = selectedStatus === 'all' || inv.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleCopyLink = (inv: Invoice) => {
    const link = `${window.location.origin}/pay/${inv.id}`;
    navigator.clipboard.writeText(link);
    setCopiedId(inv.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleMarkPaid = (inv: Invoice) => {
    storageService.markInvoicePaid(inv.id, org.id, 'Manual Bank Wire (Admin Override)', currentUser);
    onRefresh();
  };

  const handleVoid = (inv: Invoice) => {
    if (confirm(`Are you sure you want to void Invoice ${inv.invoiceNumber}?`)) {
      storageService.voidInvoice(inv.id, org.id, currentUser);
      onRefresh();
    }
  };

  const statusTabs = [
    { id: 'all', label: 'All Invoices', count: invoices.length },
    { id: 'paid', label: t.paid, count: invoices.filter((i) => i.status === 'paid').length },
    { id: 'sent', label: t.sent, count: invoices.filter((i) => i.status === 'sent').length },
    { id: 'overdue', label: t.overdue, count: invoices.filter((i) => i.status === 'overdue').length },
    { id: 'draft', label: t.draft, count: invoices.filter((i) => i.status === 'draft').length },
  ];

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'paid':
        return <span className="text-emerald-400 font-medium">● Paid</span>;
      case 'sent':
        return <span className="text-indigo-400 font-medium">● Sent</span>;
      case 'overdue':
        return <span className="text-rose-400 font-medium">● Overdue</span>;
      case 'draft':
        return <span className="text-slate-400 font-medium">● Draft</span>;
      case 'void':
        return <span className="text-slate-500 font-medium line-through">● Void</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">{t.invoices}</h1>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <span>{org.name}</span>
            <span aria-hidden="true">·</span>
            <span>{invoices.length} Total Issued</span>
            <span aria-hidden="true">·</span>
            <span>Strict Tenant Isolation Active</span>
          </div>
        </div>

        <button
          onClick={onOpenNewInvoice}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t.newInvoice}</span>
        </button>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
        {/* Status segmented controls */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {statusTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                selectedStatus === tab.id
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <span>{tab.label}</span>
              <span className="font-mono text-[11px] text-slate-400">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by invoice #, client..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* High-Density Data Grid */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
        {filteredInvoices.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <FileText className="w-5 h-5" />
            </div>
            <div className="text-sm font-semibold text-slate-200">No invoices found</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery || selectedStatus !== 'all'
                ? 'Try adjusting your search criteria or status filter.'
                : 'Get started by creating your first online invoice for this organization.'}
            </p>
            {canEdit && (
              <button
                onClick={onOpenNewInvoice}
                className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Invoice</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-medium border-b border-slate-800 select-none">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-indigo-300">
                      <button
                        onClick={() => onViewInvoice(inv)}
                        className="hover:underline text-left"
                      >
                        {inv.invoiceNumber}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-200">{inv.clientName}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                        {inv.clientEmail}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-white tabular-nums">
                      {inv.currency} {inv.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {getStatusBadge(inv.status)}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 tabular-nums">
                      {inv.issueDate}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 tabular-nums">
                      {inv.dueDate}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100">
                        {/* View / Print button */}
                        <button
                          onClick={() => onViewInvoice(inv)}
                          className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                          title="View / Print Document"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Simulate Client Visa Payment */}
                        {inv.status !== 'paid' && (
                          <button
                            onClick={() => onOpenPayModal(inv)}
                            className="p-1.5 text-indigo-400 hover:text-indigo-300 rounded hover:bg-slate-800 transition-colors"
                            title="Simulate Client Payment (Visa/Stripe)"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Copy payment link */}
                        <button
                          onClick={() => handleCopyLink(inv)}
                          className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                          title="Copy Shareable Link"
                        >
                          {copiedId === inv.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Edit invoice */}
                        {canEdit && inv.status !== 'paid' && (
                          <button
                            onClick={() => onEditInvoice(inv)}
                            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                            title="Edit Invoice"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Mark Paid manually */}
                        {inv.status !== 'paid' && canEdit && (
                          <button
                            onClick={() => handleMarkPaid(inv)}
                            className="p-1.5 text-emerald-400 hover:text-emerald-300 rounded hover:bg-slate-800 transition-colors"
                            title="Mark Paid"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Void invoice */}
                        {inv.status !== 'void' && canEdit && (
                          <button
                            onClick={() => handleVoid(inv)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
                            title="Void Invoice"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
