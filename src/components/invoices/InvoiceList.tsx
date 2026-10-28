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
  Mail,
  UploadCloud,
  ExternalLink,
  Trash2,
  Download,
  BellRing,
  Tag,
  CheckSquare,
  Square,
  AlertCircle,
  X,
  Receipt,
  FileSpreadsheet,
  ChevronDown,
  FileDown,
  Loader2,
} from 'lucide-react';
import { Invoice, InvoiceStatus, OrganizationSettings, SupportedLanguage, User } from '../../types';
import { translations } from '../../i18n/translations';
import { storageService } from '../../services/storage';
import { emailService } from '../../services/emailService';
import { googleDriveService } from '../../services/googleDriveService';
import { pdfExportService } from '../../services/pdfExportService';
import { PaymentReceiptModal } from './PaymentReceiptModal';

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
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Batch Selection State
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [reminderToast, setReminderToast] = useState<string | null>(null);
  const [isBulkTagModalOpen, setIsBulkTagModalOpen] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [receiptModalInvoice, setReceiptModalInvoice] = useState<Invoice | null>(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [exportLoadingMsg, setExportLoadingMsg] = useState<string | null>(null);

  const canEdit = ['super_admin', 'org_admin', 'invoice_editor'].includes(currentUser.role);

  // Extract all existing tags across invoices
  const allTags = Array.from(new Set(invoices.flatMap((i) => i.tags || [])));

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.clientEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.tags && inv.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesStatus = selectedStatus === 'all' || inv.status === selectedStatus;
    const matchesTag = selectedTag === 'all' || (inv.tags && inv.tags.includes(selectedTag));

    return matchesSearch && matchesStatus && matchesTag;
  });

  const handleSelectAll = () => {
    if (selectedInvoiceIds.length === filteredInvoices.length) {
      setSelectedInvoiceIds([]);
    } else {
      setSelectedInvoiceIds(filteredInvoices.map((i) => i.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedInvoiceIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Payment Reminder Feature
  const handleSendPaymentReminder = (inv: Invoice) => {
    emailService.sendReminderEmail(inv, org);
    storageService.addAuditLog({
      organizationId: org.id,
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorEmail: currentUser.email,
      actorRole: currentUser.role,
      action: 'EMAIL_DISPATCHED',
      resourceType: 'email',
      resourceId: inv.id,
      status: 'success',
      details: `Payment reminder alert dispatched to ${inv.clientName} (${inv.clientEmail}) for Invoice ${inv.invoiceNumber}`,
    });

    setReminderToast(`Payment reminder email successfully sent to ${inv.clientName} (${inv.clientEmail})!`);
    setTimeout(() => setReminderToast(null), 4000);
    onRefresh();
  };

  // Batch Payment Reminders
  const handleBatchReminders = () => {
    const targets = invoices.filter(
      (i) => selectedInvoiceIds.includes(i.id) && i.status !== 'paid' && i.status !== 'void'
    );
    if (targets.length === 0) {
      alert('None of the selected invoices have an outstanding balance.');
      return;
    }

    targets.forEach((inv) => {
      emailService.sendReminderEmail(inv, org);
    });

    setReminderToast(`Dispatched payment reminders for ${targets.length} outstanding invoice(s).`);
    setTimeout(() => setReminderToast(null), 4500);
    setSelectedInvoiceIds([]);
    onRefresh();
  };

  // Export Data to CSV
  const handleExportCsv = (customList?: Invoice[]) => {
    const listToExport = customList || filteredInvoices;
    if (listToExport.length === 0) {
      alert('No invoice records to export.');
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    const filename = `Invoices_Export_${org.slug || 'export'}_${today}.csv`;
    pdfExportService.exportInvoicesToCsv(listToExport, filename);
    
    storageService.addAuditLog({
      organizationId: org.id,
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorEmail: currentUser.email,
      actorRole: currentUser.role,
      action: 'DATA_EXPORTED',
      resourceType: 'invoice',
      status: 'success',
      details: `Exported ${listToExport.length} invoices to CSV spreadsheet (${filename})`,
    });
    setIsExportMenuOpen(false);
  };

  // Export Summary Ledger PDF
  const handleExportSummaryPdf = () => {
    if (filteredInvoices.length === 0) {
      alert('No invoice records to export.');
      return;
    }
    setExportLoadingMsg('Generating executive financial ledger PDF...');
    try {
      pdfExportService.exportInvoicesSummaryPdf(filteredInvoices, org);
      storageService.addAuditLog({
        organizationId: org.id,
        actorId: currentUser.id,
        actorName: currentUser.name,
        actorEmail: currentUser.email,
        actorRole: currentUser.role,
        action: 'DATA_EXPORTED',
        resourceType: 'invoice',
        status: 'success',
        details: `Generated executive financial ledger A4 PDF for ${filteredInvoices.length} invoices`,
      });
    } catch (err) {
      console.error(err);
      alert('Failed to generate summary PDF report.');
    } finally {
      setExportLoadingMsg(null);
      setIsExportMenuOpen(false);
    }
  };

  // Batch Download as Merged A4 PDF
  const handleBatchDownloadPdf = async (customList?: Invoice[]) => {
    const targets = customList || invoices.filter((i) => selectedInvoiceIds.includes(i.id));
    if (targets.length === 0) {
      alert('No invoices selected.');
      return;
    }

    setExportLoadingMsg(`Compiling ${targets.length} invoices into A4 PDF document...`);
    try {
      await pdfExportService.exportMergedInvoicesPdf(targets, org);
      storageService.addAuditLog({
        organizationId: org.id,
        actorId: currentUser.id,
        actorName: currentUser.name,
        actorEmail: currentUser.email,
        actorRole: currentUser.role,
        action: 'DATA_EXPORTED',
        resourceType: 'invoice',
        status: 'success',
        details: `Exported batch merged A4 PDF containing ${targets.length} invoice records`,
      });
    } catch (err) {
      console.error(err);
      alert('Failed to generate merged PDF.');
    } finally {
      setExportLoadingMsg(null);
      setIsExportMenuOpen(false);
    }
  };

  // Direct single invoice A4 PDF download
  const handleExportSingleInvoicePdf = async (inv: Invoice) => {
    setExportLoadingMsg(`Exporting A4 PDF for ${inv.invoiceNumber}...`);
    try {
      await pdfExportService.exportInvoiceToA4Pdf(inv, org);
      storageService.addAuditLog({
        organizationId: org.id,
        actorId: currentUser.id,
        actorName: currentUser.name,
        actorEmail: currentUser.email,
        actorRole: currentUser.role,
        action: 'DATA_EXPORTED',
        resourceType: 'invoice',
        resourceId: inv.id,
        status: 'success',
        details: `Exported full A4 ISO 216 PDF for Invoice ${inv.invoiceNumber} with QR verification`,
      });
    } catch (err) {
      console.error(err);
      alert('Failed to export invoice PDF.');
    } finally {
      setExportLoadingMsg(null);
    }
  };

  // Bulk Tagging
  const handleApplyBulkTag = (tag: string) => {
    if (!tag.trim()) return;
    storageService.bulkTagInvoices(selectedInvoiceIds, org.id, tag.trim(), currentUser);
    setIsBulkTagModalOpen(false);
    setNewTagInput('');
    setSelectedInvoiceIds([]);
    onRefresh();
  };

  const handleCopyLink = (inv: Invoice) => {
    const link = `${window.location.origin}/pay/${inv.id}`;
    navigator.clipboard.writeText(link);
    setCopiedId(inv.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleMarkPaid = (inv: Invoice) => {
    storageService.markInvoicePaid(inv.id, org.id, 'Manual Bank Wire (Admin Override)', currentUser);
    onRefresh();
    const updated = storageService.getInvoiceById(inv.id, org.id);
    if (updated) {
      setReceiptModalInvoice(updated);
    }
  };

  const handleVoid = (inv: Invoice) => {
    if (confirm(`Are you sure you want to void Invoice ${inv.invoiceNumber}?`)) {
      storageService.voidInvoice(inv.id, org.id, currentUser);
      onRefresh();
    }
  };

  const handleDelete = (inv: Invoice) => {
    if (confirm(`Permanently delete Invoice ${inv.invoiceNumber}? This action cannot be undone.`)) {
      storageService.deleteInvoice(inv.id, org.id, currentUser);
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
      {/* Toast Notification */}
      {reminderToast && (
        <div className="fixed top-16 right-6 z-50 bg-emerald-950 border border-emerald-700 text-emerald-200 px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-xs animate-in slide-in-from-top-4 duration-200">
          <BellRing className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{reminderToast}</span>
          <button onClick={() => setReminderToast(null)} className="text-emerald-400 hover:text-white ml-2">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Bar / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">{t.invoices}</h1>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <span>{org.name}</span>
            <span aria-hidden="true">·</span>
            <span>{invoices.length} Total Issued</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-400 font-medium">Tenant Isolated</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Direct Export to CSV Button */}
          <button
            onClick={() => handleExportCsv()}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 rounded-lg shadow-sm transition-colors whitespace-nowrap cursor-pointer"
            title="Export filtered invoices to RFC 4180 CSV spreadsheet"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export to CSV</span>
          </button>

          {/* Export Data Dropdown (CSV, Summary Ledger PDF, Merged Invoices PDF) */}
          <div className="relative">
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg shadow-sm transition-colors whitespace-nowrap"
              title="Export filtered invoice data to CSV spreadsheet or A4 PDF ledger"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Export Data</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isExportMenuOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 text-[10px] uppercase font-mono text-slate-400 tracking-wider border-b border-slate-800/80 mb-1">
                  Data & Report Export
                </div>
                <button
                  onClick={() => handleExportCsv()}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-semibold text-white">Export to CSV (.csv)</div>
                    <div className="text-[10px] text-slate-400">RFC 4180 spreadsheet format ({filteredInvoices.length} rows)</div>
                  </div>
                </button>
                <button
                  onClick={handleExportSummaryPdf}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                  <div>
                    <div className="font-semibold text-white">Summary Ledger (.pdf)</div>
                    <div className="text-[10px] text-slate-400">Executive A4 balance & revenue report</div>
                  </div>
                </button>
                <button
                  onClick={() => handleBatchDownloadPdf(filteredInvoices)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <Download className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <div className="font-semibold text-white">Merged Invoices (.pdf)</div>
                    <div className="text-[10px] text-slate-400">Multi-page printable ISO 216 bundle</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={onOpenNewInvoice}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>{t.newInvoice}</span>
          </button>
        </div>
      </div>

      {/* Export progress toast / status */}
      {exportLoadingMsg && (
        <div className="fixed top-16 right-6 z-50 bg-slate-900 border border-indigo-500/80 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs animate-in slide-in-from-top-4">
          <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
          <span>{exportLoadingMsg}</span>
        </div>
      )}

      {/* Batch Action Toolbar when items selected */}
      {selectedInvoiceIds.length > 0 && (
        <div className="p-3 bg-slate-900 border border-indigo-700/80 rounded-xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-200">
            <span className="px-2 py-0.5 rounded bg-indigo-600 text-white font-mono">
              {selectedInvoiceIds.length}
            </span>
            <span>Invoice(s) Selected</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const selected = invoices.filter((i) => selectedInvoiceIds.includes(i.id));
                handleExportCsv(selected);
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-medium rounded-lg flex items-center gap-1.5 border border-slate-700 transition-colors shadow-sm"
              title="Export selected invoices to RFC 4180 CSV spreadsheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export Selected (CSV)</span>
            </button>

            <button
              onClick={() => handleBatchDownloadPdf()}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 border border-slate-700 transition-colors shadow-sm"
              title="Download selected invoices as merged A4 PDF document"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Download Merged PDF</span>
            </button>

            <button
              onClick={handleBatchReminders}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-medium rounded-lg flex items-center gap-1.5 border border-slate-700 transition-colors shadow-sm"
              title="Send payment reminders to clients with unpaid invoices"
            >
              <BellRing className="w-3.5 h-3.5 text-amber-400" />
              <span>Send Reminders</span>
            </button>

            <button
              onClick={() => setIsBulkTagModalOpen(true)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Apply Tag</span>
            </button>

            <button
              onClick={() => setSelectedInvoiceIds([])}
              className="p-1.5 text-slate-400 hover:text-white"
              title="Clear Selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

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

        {/* Tag & Search Inputs */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          {allTags.length > 0 && (
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Tags ({allTags.length})</option>
              {allTags.map((t) => (
                <option key={t} value={t}>Tag: {t}</option>
              ))}
            </select>
          )}

          <div className="relative min-w-[220px] flex-1 md:flex-initial">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by invoice #, client, tag..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
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
              {searchQuery || selectedStatus !== 'all' || selectedTag !== 'all'
                ? 'Try adjusting your search criteria, tag, or status filter.'
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
          <>
            {/* Smartphone Touch-Optimized Feed (Displays on screens < 640px) */}
            <div className="block sm:hidden divide-y divide-slate-800/80 font-sans">
              {/* Mobile Quick Select All Header */}
              <div className="px-3 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center gap-2 py-1 px-1.5 rounded hover:bg-slate-800 transition-colors min-h-[36px]"
                >
                  {selectedInvoiceIds.length === filteredInvoices.length && filteredInvoices.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-indigo-400 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 shrink-0" />
                  )}
                  <span className="font-medium text-slate-300">
                    {selectedInvoiceIds.length > 0 ? `Selected (${selectedInvoiceIds.length})` : 'Select All Invoices'}
                  </span>
                </button>
                <span className="text-[11px] font-mono text-slate-500">
                  {filteredInvoices.length} total
                </span>
              </div>

              {filteredInvoices.map((inv) => {
                const isSelected = selectedInvoiceIds.includes(inv.id);
                const isUnpaid = inv.status === 'sent' || inv.status === 'overdue';

                return (
                  <div
                    key={`mobile-${inv.id}`}
                    className={`p-3.5 space-y-3 transition-colors ${
                      isSelected ? 'bg-indigo-950/25 border-l-2 border-indigo-500' : 'bg-slate-900/30'
                    }`}
                  >
                    {/* Header Row: Checkbox, Invoice #, Status Pill */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => handleToggleSelect(inv.id)}
                          className="min-w-[40px] min-h-[40px] flex items-center justify-center -ml-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60"
                          title="Select invoice"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                        <div>
                          <button
                            onClick={() => onViewInvoice(inv)}
                            className="font-mono text-sm font-bold text-white hover:text-indigo-400 transition-colors text-left"
                          >
                            {inv.invoiceNumber}
                          </button>
                          <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                            {inv.clientName}
                          </div>
                        </div>
                      </div>

                      {/* Status badge */}
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          inv.status === 'paid'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : inv.status === 'overdue'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : inv.status === 'sent'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : inv.status === 'draft'
                            ? 'bg-slate-800 text-slate-300 border border-slate-700'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </div>

                    {/* Middle Row: Due Date & Amount */}
                    <div className="flex items-end justify-between bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80">
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">Due Date</div>
                        <div className="text-xs font-mono text-slate-300 mt-0.5">{inv.dueDate}</div>
                        {inv.paidAt && (
                          <div className="text-[10px] font-mono text-emerald-400 mt-0.5">
                            Settled {new Date(inv.paidAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">Total Amount</div>
                        <div className="text-base font-black font-mono text-white">
                          {inv.currency}{' '}
                          {inv.totalAmount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Tags row if any */}
                    {inv.tags && inv.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {inv.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Smartphone Touch Action Hitboxes (>= 44px min-height for touch ease) */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => onViewInvoice(inv)}
                        className="min-h-[44px] px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] transition-all"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View Invoice</span>
                      </button>

                      <button
                        onClick={() => handleExportSingleInvoicePdf(inv)}
                        className="min-h-[44px] px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 active:scale-[0.98] transition-all"
                      >
                        <Download className="w-4 h-4 text-indigo-400" />
                        <span>Export PDF</span>
                      </button>

                      {isUnpaid && (
                        <button
                          onClick={() => onOpenPayModal(inv)}
                          className="col-span-2 min-h-[44px] px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-[0.98] transition-all"
                        >
                          <CreditCard className="w-4 h-4" />
                          <span>Pay Online ({inv.currency} {inv.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
                        </button>
                      )}

                      {inv.status === 'paid' && (
                        <button
                          onClick={() => setReceiptModalInvoice(inv)}
                          className="col-span-2 min-h-[44px] px-3 py-2 bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-300 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all"
                        >
                          <Receipt className="w-4 h-4 text-emerald-400" />
                          <span>Generate Receipt</span>
                        </button>
                      )}
                    </div>

                    {/* Secondary Utility Actions (Copy Link, Reminder, Edit, Delete) */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-xs">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleCopyLink(inv)}
                          className="min-h-[38px] px-2 py-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 flex items-center gap-1 text-[11px]"
                          title="Copy Link"
                        >
                          {copiedId === inv.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>{copiedId === inv.id ? 'Copied' : 'Share Link'}</span>
                        </button>

                        {isUnpaid && (
                          <button
                            onClick={() => handleSendPaymentReminder(inv)}
                            className="min-h-[38px] px-2 py-1 text-amber-400 hover:text-amber-300 rounded-md hover:bg-slate-800 flex items-center gap-1 text-[11px]"
                            title="Send Reminder"
                          >
                            <BellRing className="w-3.5 h-3.5" />
                            <span>Remind</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {canEdit && inv.status !== 'paid' && (
                          <button
                            onClick={() => onEditInvoice(inv)}
                            className="min-w-[38px] min-h-[38px] flex items-center justify-center text-slate-400 hover:text-white rounded-md hover:bg-slate-800"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {inv.status !== 'paid' && canEdit && (
                          <button
                            onClick={() => handleMarkPaid(inv)}
                            className="min-w-[38px] min-h-[38px] flex items-center justify-center text-emerald-400 hover:text-emerald-300 rounded-md hover:bg-slate-800"
                            title="Mark Paid"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {canEdit && (
                          <button
                            onClick={() => handleDelete(inv)}
                            className="min-w-[38px] min-h-[38px] flex items-center justify-center text-slate-500 hover:text-rose-400 rounded-md hover:bg-slate-800"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop High-Density Table (Displays on screens >= 640px) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-medium border-b border-slate-800 select-none">
                <tr>
                  <th className="py-3 px-3 w-8">
                    <button
                      onClick={handleSelectAll}
                      className="text-slate-400 hover:text-white"
                      title="Select all"
                    >
                      {selectedInvoiceIds.length === filteredInvoices.length && filteredInvoices.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-indigo-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Tags</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredInvoices.map((inv) => {
                  const isSelected = selectedInvoiceIds.includes(inv.id);
                  const isUnpaid = inv.status === 'sent' || inv.status === 'overdue';

                  return (
                    <tr
                      key={inv.id}
                      className={`hover:bg-slate-800/40 transition-colors group ${
                        isSelected ? 'bg-indigo-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-3">
                        <button
                          onClick={() => handleToggleSelect(inv.id)}
                          className="text-slate-400 hover:text-white"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 font-semibold text-indigo-300">
                        <button
                          onClick={() => onViewInvoice(inv)}
                          className="hover:underline text-left font-bold"
                        >
                          {inv.invoiceNumber}
                        </button>
                        {inv.isRecurring && (
                          <span className="ml-1.5 px-1.5 py-0.2 rounded text-[10px] bg-indigo-900/60 text-indigo-300 font-sans">
                            ↻ {inv.recurringInterval || 'Monthly'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <div className="font-medium text-slate-200">{inv.clientName}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                          {inv.clientEmail}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-white tabular-nums">
                        {inv.currency} {inv.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        {inv.lateFeeApplied ? (
                          <div className="text-[10px] text-rose-400 font-normal">
                            +{inv.currency} {inv.lateFeeApplied.toLocaleString()} late fee
                          </div>
                        ) : null}
                      </td>
                      <td className="py-3 px-4 text-xs font-sans">
                        {getStatusBadge(inv.status)}
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <div className="flex flex-wrap gap-1 max-w-[140px]">
                          {inv.tags && inv.tags.length > 0 ? (
                            inv.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700"
                              >
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-slate-600">—</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-400 tabular-nums">
                        {inv.dueDate}
                      </td>
                      <td className="py-3 px-4 text-right font-sans">
                        <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100">
                          {/* Payment Reminder Button directly on row */}
                          {isUnpaid && (
                            <button
                              onClick={() => handleSendPaymentReminder(inv)}
                              className="p-1.5 text-amber-400 hover:text-amber-300 rounded hover:bg-slate-800 transition-colors"
                              title="Send Payment Reminder Alert Email to Client"
                            >
                              <BellRing className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* View / Print button */}
                          <button
                            onClick={() => onViewInvoice(inv)}
                            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                            title="View / Print Document"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Direct A4 PDF Export */}
                          <button
                            onClick={() => handleExportSingleInvoicePdf(inv)}
                            className="p-1.5 text-slate-400 hover:text-indigo-400 rounded hover:bg-slate-800 transition-colors"
                            title="Export A4 PDF Invoice (ISO 216 with QR)"
                          >
                            <FileDown className="w-3.5 h-3.5" />
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

                          {/* Clearly Labeled Generate Receipt Button */}
                          {inv.status === 'paid' && (
                            <button
                              onClick={() => setReceiptModalInvoice(inv)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-emerald-300 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/80 rounded-lg transition-colors shadow-xs cursor-pointer whitespace-nowrap"
                              title="Generate Receipt"
                            >
                              <Receipt className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>Generate Receipt</span>
                            </button>
                          )}

                          {/* Send Automated Email */}
                          <button
                            onClick={() => {
                              if (inv.status === 'paid') {
                                emailService.notifyPaymentReceived(inv, org, inv.paymentMethodUsed || 'Credit Card (Stripe)');
                              } else {
                                emailService.notifyInvoiceGenerated(inv, org);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-indigo-400 rounded hover:bg-slate-800 transition-colors"
                            title="Send Automated Customer Email"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>

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

                          {/* Google Drive PDF link */}
                          {inv.googleDriveLink && (
                            <a
                              href={inv.googleDriveLink}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 text-emerald-400 hover:text-emerald-300 rounded hover:bg-slate-800 transition-colors"
                              title="Open PDF in Google Drive"
                            >
                              <UploadCloud className="w-3.5 h-3.5" />
                            </a>
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

                          {/* Delete invoice */}
                          {canEdit && (
                            <button
                              onClick={() => handleDelete(inv)}
                              className="p-1.5 text-slate-500 hover:text-rose-500 rounded hover:bg-slate-800 transition-colors"
                              title="Delete Invoice"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
        </>
        )}
      </div>

      {/* Bulk Tag Modal */}
      {isBulkTagModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Tag className="w-4 h-4 text-indigo-400" />
                <span>Apply Bulk Tag</span>
              </div>
              <button onClick={() => setIsBulkTagModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Apply a label to <strong>{selectedInvoiceIds.length}</strong> selected invoice(s) for quick grouping and search.
            </p>

            <div className="space-y-2">
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                placeholder="e.g. Q4-Audit, Retainer, Priority"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />

              <div className="flex flex-wrap gap-1.5 pt-1">
                {['Priority', 'Enterprise', 'Monthly Retainer', 'Follow-Up', 'Tax-Exempt'].map((quickTag) => (
                  <button
                    key={quickTag}
                    type="button"
                    onClick={() => setNewTagInput(quickTag)}
                    className="px-2 py-0.5 rounded text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                  >
                    {quickTag}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsBulkTagModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleApplyBulkTag(newTagInput)}
                disabled={!newTagInput.trim()}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
              >
                Apply Label
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clean A4 Official Payment Receipt Modal */}
      {receiptModalInvoice && (
        <PaymentReceiptModal
          isOpen={Boolean(receiptModalInvoice)}
          onClose={() => setReceiptModalInvoice(null)}
          invoice={receiptModalInvoice}
          org={org}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};
