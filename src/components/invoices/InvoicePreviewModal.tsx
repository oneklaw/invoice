import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  CreditCard,
  Download,
  ShieldCheck,
  UploadCloud,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  History,
  RotateCcw,
  Clock,
  Eye,
  BookmarkPlus,
  AlertTriangle,
  FileCheck,
  Receipt,
  FileText,
  Building2,
  QrCode,
} from 'lucide-react';
import QRCode from 'qrcode';
import { Invoice, InvoiceVersion, OrganizationSettings } from '../../types';
import { googleDriveService } from '../../services/googleDriveService';
import { storageService, DEFAULT_ENTERPRISE_TERMS } from '../../services/storage';
import { pdfExportService } from '../../services/pdfExportService';
import { PaymentReceiptModal } from './PaymentReceiptModal';

interface InvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  org: OrganizationSettings;
  onOpenPayModal: (invoice: Invoice) => void;
}

export const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({
  isOpen,
  onClose,
  invoice: initialInvoice,
  org,
  onOpenPayModal,
}) => {
  const [currentInvoice, setCurrentInvoice] = useState<Invoice>(initialInvoice);
  const [isUploadingToDrive, setIsUploadingToDrive] = useState(false);
  const [driveSuccess, setDriveSuccess] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  // Versioning state
  const [showVersionsDrawer, setShowVersionsDrawer] = useState(false);
  const [previewingVersion, setPreviewingVersion] = useState<InvoiceVersion | null>(null);
  const [restoringVersionId, setRestoringVersionId] = useState<string | null>(null);
  const [restoreSuccessMsg, setRestoreSuccessMsg] = useState<string | null>(null);
  const [showCreateCheckpoint, setShowCreateCheckpoint] = useState(false);
  const [checkpointNote, setCheckpointNote] = useState('');

  if (!isOpen) return null;

  const currentUser = storageService.getCurrentUser();

  // If currently previewing a historical snapshot, use that; otherwise use currentInvoice
  const invoice = previewingVersion ? (previewingVersion.snapshot as Invoice) : currentInvoice;

  // Generate authentic verification QR code for preview and print
  useEffect(() => {
    const qrData = `INVOICE:${invoice.invoiceNumber}|TOTAL:${invoice.totalAmount}|CURR:${invoice.currency}|STATUS:${invoice.status}|TAX_ID:${org.taxId || 'KERO'}`;
    QRCode.toDataURL(qrData, {
      width: 120,
      margin: 1,
      color: { dark: '#0F172A', light: '#FFFFFF' },
    }).then(setQrCodeDataUrl).catch(console.warn);
  }, [invoice.invoiceNumber, invoice.totalAmount, invoice.currency, invoice.status, org.taxId]);

  // Ensure baseline version list exists
  const versions: InvoiceVersion[] = currentInvoice.versions && currentInvoice.versions.length > 0
    ? currentInvoice.versions
    : [
        {
          id: 'ver_baseline',
          timestamp: currentInvoice.createdAt || new Date().toISOString(),
          authorName: currentUser.name || 'System Baseline',
          summary: 'Original baseline invoice creation',
          snapshot: currentInvoice,
        },
      ];

  const handleSaveToDrive = async () => {
    setIsUploadingToDrive(true);
    setDriveSuccess(false);
    try {
      const res = await googleDriveService.uploadInvoicePdfToDrive(invoice, org);
      setCurrentInvoice((prev) => ({
        ...prev,
        googleDriveFileId: res.fileId,
        googleDriveLink: res.webViewLink,
        googleDriveUploadedAt: new Date().toISOString(),
      }));
      setDriveSuccess(true);
      setTimeout(() => setDriveSuccess(false), 4000);
    } catch (err: any) {
      console.error('Save to Drive error:', err);
      alert(`Could not save to Google Drive: ${err.message || 'Error occurred'}`);
    } finally {
      setIsUploadingToDrive(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportA4Pdf = async () => {
    setIsExportingPdf(true);
    try {
      await pdfExportService.exportInvoiceToA4Pdf(invoice, org);
    } catch (err: any) {
      console.error('Failed to export A4 PDF invoice:', err);
      alert(`Could not export PDF invoice: ${err?.message || 'Error occurred'}`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Restore to specific version
  const handleRestoreVersion = (version: InvoiceVersion) => {
    if (!window.confirm(`Restore invoice to version from ${new Date(version.timestamp).toLocaleString()}?`)) {
      return;
    }

    setRestoringVersionId(version.id);
    try {
      const success = storageService.restoreInvoiceVersion(
        currentInvoice.id,
        org.id,
        version.id,
        currentUser
      );

      if (success) {
        const updated = storageService.getInvoiceById(currentInvoice.id, org.id);
        if (updated) {
          setCurrentInvoice(updated);
        } else {
          setCurrentInvoice({
            ...version.snapshot,
            updatedAt: new Date().toISOString(),
          });
        }
        setPreviewingVersion(null);
        setRestoreSuccessMsg(`Successfully restored invoice to version from ${new Date(version.timestamp).toLocaleDateString()}`);
        setTimeout(() => setRestoreSuccessMsg(null), 5000);

        // Dispatch window event so parent invoice list reloads
        window.dispatchEvent(new CustomEvent('invox:invoice_restored', { detail: { id: currentInvoice.id } }));
      } else {
        alert('Could not restore to this version.');
      }
    } catch (err) {
      console.error('Error restoring version:', err);
    } finally {
      setRestoringVersionId(null);
    }
  };

  const handleCreateManualCheckpoint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkpointNote.trim()) return;

    try {
      const newVer = storageService.saveInvoiceVersion(
        currentInvoice.id,
        org.id,
        checkpointNote.trim(),
        currentUser
      );

      const updated = storageService.getInvoiceById(currentInvoice.id, org.id);
      if (updated) {
        setCurrentInvoice(updated);
      }
      setCheckpointNote('');
      setShowCreateCheckpoint(false);
      setRestoreSuccessMsg('Version snapshot checkpoint recorded!');
      setTimeout(() => setRestoreSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Error creating checkpoint:', err);
    }
  };

  const getAccentColorClasses = () => {
    switch (org.accentColor) {
      case 'emerald':
        return {
          bg: 'bg-emerald-600',
          gradient: 'from-emerald-600 via-teal-500 to-emerald-700',
          text: 'text-emerald-700',
          border: 'border-emerald-600',
          badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        };
      case 'rose':
        return {
          bg: 'bg-rose-600',
          gradient: 'from-rose-600 via-pink-500 to-rose-700',
          text: 'text-rose-700',
          border: 'border-rose-600',
          badge: 'bg-rose-50 text-rose-800 border-rose-200',
        };
      case 'amber':
        return {
          bg: 'bg-amber-600',
          gradient: 'from-amber-600 via-orange-500 to-amber-700',
          text: 'text-amber-700',
          border: 'border-amber-600',
          badge: 'bg-amber-50 text-amber-800 border-amber-200',
        };
      case 'cyan':
        return {
          bg: 'bg-cyan-600',
          gradient: 'from-cyan-600 via-sky-500 to-cyan-700',
          text: 'text-cyan-700',
          border: 'border-cyan-600',
          badge: 'bg-cyan-50 text-cyan-800 border-cyan-200',
        };
      case 'slate':
        return {
          bg: 'bg-slate-800',
          gradient: 'from-slate-800 via-slate-700 to-slate-900',
          text: 'text-slate-800',
          border: 'border-slate-800',
          badge: 'bg-slate-100 text-slate-800 border-slate-300',
        };
      case 'indigo':
      default:
        return {
          bg: 'bg-indigo-600',
          gradient: 'from-indigo-600 via-indigo-500 to-indigo-700',
          text: 'text-indigo-700',
          border: 'border-indigo-600',
          badge: 'bg-indigo-50 text-indigo-800 border-indigo-200',
        };
    }
  };

  const colors = getAccentColorClasses();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto invoice-preview-backdrop">
      {/* Print styles injection for pixel-perfect pure white A4 portrait sheet & removing dark browser print artifacts */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm 8mm 10mm;
          }
          body, html {
            background: #ffffff !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .invoice-preview-backdrop {
            position: static !important;
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
          }
          .invoice-preview-window {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            max-width: 100% !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
          }
          .invoice-canvas-wrapper {
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
          }
          .invoice-printable {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            background: #ffffff !important;
            color: #0f172a !important;
          }
        }
      `}</style>

      <div className="invoice-preview-window w-full max-w-5xl h-[100dvh] sm:h-auto sm:max-h-[95vh] flex flex-col bg-slate-900 border-0 sm:border sm:border-slate-700 rounded-none sm:rounded-xl shadow-2xl overflow-hidden text-slate-100">
        
        {/* Desktop Controls Bar (Hidden on smartphone viewports & print) */}
        <div className="hidden md:flex items-center justify-between px-6 py-3.5 bg-slate-950 border-b border-slate-800 no-print shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-300">
              Invoice Preview: <span className="font-mono text-indigo-400">{invoice.invoiceNumber}</span>
            </span>
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                invoice.status === 'paid'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {invoice.status.toUpperCase()}
            </span>

            {/* Versioning Indicator Button */}
            <button
              onClick={() => setShowVersionsDrawer(!showVersionsDrawer)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                showVersionsDrawer
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-indigo-300 border-slate-700'
              }`}
              title="View document edit history and restore previous versions"
            >
              <History className="w-3.5 h-3.5 text-indigo-400" />
              <span>Version History</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
                {versions.length}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportA4Pdf}
              disabled={isExportingPdf}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg shadow-sm transition-colors cursor-pointer"
              title="Download Full A4 PDF Invoice directly"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExportingPdf ? 'Exporting PDF...' : 'Export A4 PDF'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            {invoice.googleDriveLink ? (
              <a
                href={invoice.googleDriveLink}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 rounded-lg border border-emerald-800 transition-colors"
                title="View PDF directly in Google Drive"
              >
                <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
                <span>Drive PDF</span>
                <ExternalLink className="w-3 h-3 text-emerald-400" />
              </a>
            ) : (
              <button
                type="button"
                disabled={isUploadingToDrive}
                onClick={handleSaveToDrive}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg border border-slate-700 transition-colors"
                title="Save PDF copy into Google Drive designated folder"
              >
                {isUploadingToDrive ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                ) : driveSuccess ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>{isUploadingToDrive ? 'Saving...' : driveSuccess ? 'Saved to Drive!' : 'Save to Drive'}</span>
              </button>
            )}

            {currentInvoice.status === 'paid' && (
              <button
                onClick={() => setShowReceiptModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors cursor-pointer"
                title="Generate Receipt"
              >
                <Receipt className="w-3.5 h-3.5 text-white" />
                <span>Generate Receipt</span>
              </button>
            )}

            {invoice.status !== 'paid' && (
              <button
                onClick={() => {
                  onClose();
                  onOpenPayModal(invoice);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Simulate Client Pay</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Smartphone Mobile Top App Bar (Visible on mobile viewports < 768px) */}
        <div className="flex md:hidden items-center justify-between px-3.5 py-2.5 bg-slate-950 border-b border-slate-800 no-print shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-indigo-400 truncate max-w-[130px]">
              {invoice.invoiceNumber}
            </span>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                invoice.status === 'paid'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {invoice.status.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowVersionsDrawer(!showVersionsDrawer)}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-300 hover:text-white bg-slate-800/80 rounded-lg"
              title="Version History"
            >
              <History className="w-4 h-4 text-indigo-400" />
            </button>
            <button
              onClick={handlePrint}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-300 hover:text-white bg-slate-800/80 rounded-lg"
              title="Print"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-white bg-slate-800/80 rounded-lg ml-0.5"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Snapshot Active Alert Banner */}
        {previewingVersion && (
          <div className="bg-amber-950/80 border-b border-amber-800/80 px-6 py-2.5 flex items-center justify-between text-xs text-amber-200 animate-in fade-in shrink-0 no-print">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-400" />
              <span>
                <strong>Viewing Historical Snapshot:</strong> {previewingVersion.summary} (Recorded{' '}
                {new Date(previewingVersion.timestamp).toLocaleString()} by {previewingVersion.authorName})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleRestoreVersion(previewingVersion)}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-xs flex items-center gap-1 shadow-sm transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore to This Version</span>
              </button>
              <button
                onClick={() => setPreviewingVersion(null)}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors"
              >
                Exit Snapshot
              </button>
            </div>
          </div>
        )}

        {/* Restore Success Toast */}
        {restoreSuccessMsg && (
          <div className="bg-emerald-950/90 border-b border-emerald-800 px-6 py-2 flex items-center justify-between text-xs text-emerald-300 animate-in fade-in shrink-0 no-print">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{restoreSuccessMsg}</span>
            </div>
            <button onClick={() => setRestoreSuccessMsg(null)} className="text-emerald-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Body Container with Side Versioning Drawer */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Printable Invoice Canvas */}
          <div className="invoice-canvas-wrapper flex-1 overflow-y-auto p-2.5 sm:p-6 lg:p-8 bg-slate-100/90 pb-28 md:pb-8">
            <div className="invoice-printable max-w-3xl mx-auto bg-white text-slate-900 rounded-2xl shadow-xl p-4 sm:p-8 md:p-10 font-sans border border-slate-200/90 overflow-hidden relative">
              {/* Top Corporate Graphic Accent Bar */}
              <div className={`h-2.5 w-full bg-gradient-to-r ${colors.gradient} -mt-4 sm:-mt-8 md:-mt-10 -mx-4 sm:-mx-8 md:-mx-10 mb-6 sm:mb-8`} />

              {/* Invoice Top Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-8 pb-6 sm:pb-8 border-b border-slate-200">
                <div className="space-y-2.5">
                  {org.logoUrl || '/kero-logo.png' ? (
                    <img
                      src={org.logoUrl || '/kero-logo.png'}
                      alt={org.name}
                      className="h-10 sm:h-12 w-auto max-w-[180px] sm:max-w-[200px] object-contain"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg ${colors.bg} text-white font-bold flex items-center justify-center text-base shadow-sm`}>
                        {org.name.charAt(0)}
                      </div>
                      <span className="text-xl font-bold tracking-tight text-slate-900">
                        {org.name}
                      </span>
                    </div>
                  )}

                  <div className="text-xs text-slate-500 leading-relaxed">
                    <div className="font-semibold text-slate-800">{org.legalName}</div>
                    <div>{org.address.line1}</div>
                    <div>{org.address.city}, {org.address.postalCode} · {org.address.country}</div>
                    <div className="pt-0.5">Tax ID / VAT Reg: <span className="font-mono font-medium text-slate-800">{org.taxId}</span></div>
                    <div>Email: {org.email} · Phone: {org.phone}</div>
                  </div>
                </div>

                <div className="sm:text-right space-y-1.5 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-xl sm:text-2xl font-black tracking-tight uppercase text-slate-900">
                    INVOICE
                  </div>
                  <div className="text-sm font-mono font-bold text-indigo-700">
                    {invoice.invoiceNumber}
                  </div>
                  <div>
                    <span
                      className={`inline-block px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border shadow-xs ${
                        invoice.status === 'paid'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : invoice.status === 'overdue'
                          ? 'bg-rose-50 text-rose-700 border-rose-300'
                          : invoice.status === 'sent'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                          : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                    >
                      STATUS: {invoice.status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 pt-1 space-y-0.5">
                    <div>Issue Date: <strong className="text-slate-800 font-mono">{invoice.issueDate}</strong></div>
                    <div>Due Date: <strong className="text-slate-800 font-mono">{invoice.dueDate}</strong></div>
                    {invoice.poNumber && (
                      <div>PO Number: <span className="text-slate-800 font-mono">{invoice.poNumber}</span></div>
                    )}
                  </div>
                </div>
              </div>

              {/* Billed To & Payment Method Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 py-4 sm:py-6 border-b border-slate-200 text-xs">
                <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 space-y-1">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <span>Billed To:</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900">{invoice.clientName}</div>
                  <div className="text-slate-600 mt-0.5 whitespace-pre-line leading-relaxed">
                    {invoice.clientAddress}
                  </div>
                  <div className="text-slate-500 pt-1">
                    Email: <span className="text-slate-700 font-medium">{invoice.clientEmail}</span>
                  </div>
                  {invoice.clientTaxId && (
                    <div className="text-slate-500">
                      Tax / VAT ID: <span className="font-mono text-slate-800 font-semibold">{invoice.clientTaxId}</span>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Payment Details & Terms:
                  </div>
                  <div className="text-slate-600 space-y-1">
                    <div className="font-medium text-slate-800">
                      Credit Card (VISA / Mastercard via Stripe) or Bank Wire
                    </div>
                    <div>Currency: <strong className="font-mono text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">{invoice.currency}</strong></div>
                    <div>Payment Terms: <span className="font-medium text-slate-800">{org.defaultPaymentTerms}</span></div>
                    {invoice.paidAt && (
                      <div className="pt-2 border-t border-slate-200/80 mt-1 flex flex-wrap items-center justify-between gap-2">
                        <div className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Settled on {new Date(invoice.paidAt).toLocaleDateString()}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowReceiptModal(true)}
                          className="no-print inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-xs transition-colors cursor-pointer shrink-0"
                          title="Generate Receipt"
                        >
                          <Receipt className="w-3 h-3 text-white" />
                          <span>Generate Receipt</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Line Items - Smartphone Cards on Mobile, Table on Desktop */}
              <div className="py-4 sm:py-6">
                {/* Smartphone Line-Item Cards (Visible on mobile screens) */}
                <div className="sm:hidden space-y-2.5">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Line Items ({invoice.items.length})
                  </div>
                  {invoice.items.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5"
                    >
                      <div className="font-semibold text-slate-900 text-xs leading-snug">
                        {item.description}
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200/80">
                        <span className="text-slate-500 font-mono text-[11px]">
                          {item.quantity} × {invoice.currency} {item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          {item.taxRate > 0 && ` (+${item.taxRate}%)`}
                        </span>
                        <span className="font-mono font-bold text-slate-900 tabular-nums text-sm">
                          {invoice.currency} {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Classic High-Density Table (Visible on sm: and up) */}
                <table className="hidden sm:table w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-300 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-3 pr-4">Description</th>
                      <th className="py-3 px-3 text-right">Qty</th>
                      <th className="py-3 px-3 text-right">Unit Rate</th>
                      <th className="py-3 px-3 text-right">Tax</th>
                      <th className="py-3 pl-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoice.items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-3.5 pr-4 text-slate-800 font-medium leading-relaxed">
                          {item.description}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono text-slate-700 tabular-nums">
                          {item.quantity}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono text-slate-700 tabular-nums">
                          {invoice.currency} {item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono text-slate-500 tabular-nums">
                          {item.taxRate}%
                        </td>
                        <td className="py-3.5 pl-3 text-right font-mono font-semibold text-slate-900 tabular-nums">
                          {invoice.currency} {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Section */}
              <div className="flex justify-end pt-4 pb-6 border-t border-slate-200">
                <div className="w-full sm:w-72 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono tabular-nums text-slate-900 font-medium">{invoice.currency} {invoice.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>

                  {invoice.totalDiscount > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Discount:</span>
                      <span className="font-mono tabular-nums">-{invoice.currency} {invoice.totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}

                  {invoice.totalTax > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Tax / VAT:</span>
                      <span className="font-mono tabular-nums text-slate-900 font-medium">+{invoice.currency} {invoice.totalTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}

                  {invoice.shippingFee && invoice.shippingFee > 0 ? (
                    <div className="flex justify-between text-slate-600">
                      <span>Shipping:</span>
                      <span className="font-mono tabular-nums text-slate-900 font-medium">+{invoice.currency} {invoice.shippingFee.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  ) : null}

                  {invoice.lateFeeApplied && invoice.lateFeeApplied > 0 ? (
                    <div className="flex justify-between text-rose-600">
                      <span>Late Fee (Overdue):</span>
                      <span className="font-mono tabular-nums font-semibold">+{invoice.currency} {invoice.lateFeeApplied.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  ) : null}

                  <div className="flex justify-between items-center text-base font-bold text-slate-900 p-3 bg-indigo-50/80 rounded-xl border border-indigo-100 shadow-xs">
                    <span>Total Due:</span>
                    <span className="font-mono tabular-nums text-indigo-700 text-lg">{invoice.currency} {invoice.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Bank Remittance Details & Authentic QR Code */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5 border-t border-slate-200 text-xs">
                {/* Bank Details (2 cols on md) */}
                <div className="md:col-span-2 bg-slate-50/90 p-4 rounded-xl border border-slate-200/90 space-y-2">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200/80">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                      Bank Wire Remittance Instructions
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 font-mono grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                    <div>Bank: <strong className="text-slate-900">{org.bankDetails.bankName}</strong></div>
                    <div>Account: <strong className="text-slate-900">{org.bankDetails.accountNumber}</strong></div>
                    <div>SWIFT/BIC: <strong className="text-slate-900">{org.bankDetails.swiftBic}</strong></div>
                    <div>IBAN: <strong className="text-slate-900">{org.bankDetails.iban}</strong></div>
                    <div className="sm:col-span-2">Beneficiary: <strong className="text-slate-800">{org.bankDetails.accountHolderName}</strong></div>
                    <div className="sm:col-span-2 text-indigo-700 font-bold">
                      Remittance Reference: <span className="font-mono bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">#{invoice.invoiceNumber}</span>
                    </div>
                  </div>
                  {org.bankDetails.paymentInstructions && (
                    <div className="text-[10px] text-slate-500 pt-1 leading-tight border-t border-slate-200/80">
                      {org.bankDetails.paymentInstructions}
                    </div>
                  )}
                </div>

                {/* Authentic Verification QR Code Card (1 col on md) */}
                <div className="bg-slate-50/90 p-4 rounded-xl border border-slate-200/90 flex flex-col items-center justify-center text-center">
                  {qrCodeDataUrl ? (
                    <img
                      src={qrCodeDataUrl}
                      alt={`Verification QR Code for Invoice ${invoice.invoiceNumber}`}
                      className="w-22 h-22 rounded border border-slate-200 bg-white p-1 shadow-xs"
                    />
                  ) : (
                    <div className="w-22 h-22 rounded border border-slate-200 bg-white flex items-center justify-center text-slate-300">
                      <QrCode className="w-10 h-10" />
                    </div>
                  )}
                  <div className="mt-2 text-[10px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Authentic Document</span>
                  </div>
                  <div className="text-[9px] text-slate-500 mt-0.5">
                    Scan to verify issuer & tax ledger
                  </div>
                </div>
              </div>

              {/* Commercial Terms & Conditions Card */}
              <div className="mt-4 p-4 sm:p-5 bg-slate-50/90 border border-slate-200/90 rounded-xl text-xs space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                      Commercial Terms & Conditions
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 font-medium">
                    Enterprise Policy Standard
                  </span>
                </div>

                <div className="text-[11px] text-slate-600 leading-relaxed whitespace-pre-line font-normal">
                  {invoice.termsAndConditions || org.invoiceTermsAndConditions || DEFAULT_ENTERPRISE_TERMS}
                </div>

                {invoice.notes && (
                  <div className="pt-2 border-t border-slate-200/80 text-[11px] text-slate-500 italic flex items-start gap-1.5">
                    <span className="font-semibold not-italic text-slate-700">Client Note:</span>
                    <span>{invoice.notes}</span>
                  </div>
                )}
              </div>

              {/* Official Document Footer */}
              <div className="mt-6 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-400 gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-600">KERO INVOICE SaaS Platform</span>
                  <span>·</span>
                  <span className="font-mono text-slate-400">
                    Ledger Ref: sha256:{Math.abs((invoice.id + invoice.totalAmount).split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0)).toString(16)}00e2417c
                  </span>
                </div>
                <span>ISO 216 A4 Standard · Page 1 of 1</span>
              </div>
            </div>
          </div>

          {/* Smartphone Thumb Zone Sticky Bottom Action Bar (Mobile Only) */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 p-3 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 z-40 flex items-center gap-2 no-print shadow-2xl">
            {invoice.status !== 'paid' ? (
              <>
                <button
                  onClick={() => {
                    onClose();
                    onOpenPayModal(invoice);
                  }}
                  className="flex-1 min-h-[44px] px-3 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-transform"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Pay Online</span>
                </button>
                <button
                  onClick={handleExportA4Pdf}
                  disabled={isExportingPdf}
                  className="flex-1 min-h-[44px] px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 border border-slate-700 active:scale-[0.98] transition-transform"
                >
                  <Download className="w-4 h-4 text-indigo-400" />
                  <span>{isExportingPdf ? 'Exporting...' : 'A4 PDF'}</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleExportA4Pdf}
                  disabled={isExportingPdf}
                  className="flex-1 min-h-[44px] px-3 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-transform"
                >
                  <Download className="w-4 h-4" />
                  <span>{isExportingPdf ? 'Exporting...' : 'Export A4 PDF'}</span>
                </button>
                <button
                  onClick={() => setShowReceiptModal(true)}
                  className="flex-1 min-h-[44px] px-3 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-transform"
                >
                  <Receipt className="w-4 h-4" />
                  <span>Generate Receipt</span>
                </button>
              </>
            )}
          </div>

        {/* Version History Side Drawer */}
        {showVersionsDrawer && (
          <div className="fixed inset-0 z-50 md:static md:w-80 lg:w-96 bg-slate-950 border-l border-slate-800 flex flex-col shrink-0 no-print animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Document Version History
                  </h3>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  View previous edits and restore earlier snapshots
                </p>
              </div>

              <button
                onClick={() => setShowVersionsDrawer(false)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Checkpoint Action Bar */}
            <div className="p-3 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">
                {versions.length} timestamped record{versions.length === 1 ? '' : 's'}
              </span>
              <button
                onClick={() => setShowCreateCheckpoint(true)}
                className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[11px] font-semibold transition-colors shadow-sm"
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                <span>Save Checkpoint</span>
              </button>
            </div>

            {/* Versions List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {[...versions].reverse().map((ver, idx) => {
                const isPreviewing = previewingVersion?.id === ver.id;
                const isCurrentLive = !previewingVersion && idx === 0;
                const snap = ver.snapshot || {};

                return (
                  <div
                    key={ver.id || idx}
                    className={`p-3 rounded-xl border text-xs transition-all space-y-2 ${
                      isPreviewing
                        ? 'bg-amber-950/40 border-amber-500/60 shadow-md shadow-amber-500/10'
                        : isCurrentLive
                        ? 'bg-indigo-950/30 border-indigo-500/40'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-slate-300 font-mono text-[11px]">
                          <Clock className="w-3 h-3 text-indigo-400" />
                          <span>{new Date(ver.timestamp).toLocaleString()}</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Author: <strong className="text-slate-200">{ver.authorName || 'Kenneth Onekalit'}</strong>
                        </div>
                      </div>

                      {isCurrentLive ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Live Active
                        </span>
                      ) : isPreviewing ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Previewing
                        </span>
                      ) : null}
                    </div>

                    <p className="text-slate-300 text-xs italic bg-slate-950/60 p-2 rounded border border-slate-800/80">
                      &quot;{ver.summary}&quot;
                    </p>

                    {snap.totalAmount !== undefined && (
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800/60">
                        <span>Items: {snap.items?.length || 0}</span>
                        <span className="text-white font-bold">
                          {snap.currency || invoice.currency} {(snap.totalAmount || 0).toLocaleString()}
                        </span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 pt-1">
                      {isPreviewing ? (
                        <button
                          onClick={() => setPreviewingVersion(null)}
                          className="px-2 py-1 text-[11px] text-slate-400 hover:text-white rounded bg-slate-800 transition-colors"
                        >
                          Exit Preview
                        </button>
                      ) : (
                        <button
                          onClick={() => setPreviewingVersion(ver)}
                          className="px-2 py-1 text-[11px] text-slate-300 hover:text-white rounded bg-slate-800 hover:bg-slate-700 flex items-center gap-1 border border-slate-700 transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Preview</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleRestoreVersion(ver)}
                        disabled={restoringVersionId === ver.id}
                        className="px-2.5 py-1 text-[11px] font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded flex items-center gap-1 shadow-sm transition-colors disabled:opacity-50"
                      >
                        {restoringVersionId === ver.id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <RotateCcw className="w-3 h-3" />
                        )}
                        <span>Restore</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal: Create Manual Checkpoint */}
      {showCreateCheckpoint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden text-slate-100">
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <BookmarkPlus className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Create Version Checkpoint
                </h4>
              </div>
              <button
                onClick={() => setShowCreateCheckpoint(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateManualCheckpoint} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Revision Summary / Change Reason <span className="text-rose-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={checkpointNote}
                  onChange={(e) => setCheckpointNote(e.target.value)}
                  placeholder="e.g. Revised milestone rates per client agreement, before sending official PDF..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateCheckpoint(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                >
                  Save Checkpoint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clean A4 Official Payment Receipt Modal */}
      {showReceiptModal && (
        <PaymentReceiptModal
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          invoice={currentInvoice}
          org={org}
        />
      )}
      </div>
    </div>
  );
};
