import React, { useState } from 'react';
import { X, Printer, CreditCard, Download, ShieldCheck, UploadCloud, ExternalLink, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Invoice, OrganizationSettings } from '../../types';
import { googleDriveService } from '../../services/googleDriveService';

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

  if (!isOpen) return null;

  const invoice = currentInvoice;

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

  const getAccentColorClasses = () => {
    switch (org.accentColor) {
      case 'emerald':
        return {
          bg: 'bg-emerald-600',
          text: 'text-emerald-700',
          border: 'border-emerald-600',
          badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        };
      case 'rose':
        return {
          bg: 'bg-rose-600',
          text: 'text-rose-700',
          border: 'border-rose-600',
          badge: 'bg-rose-50 text-rose-800 border-rose-200',
        };
      case 'amber':
        return {
          bg: 'bg-amber-600',
          text: 'text-amber-700',
          border: 'border-amber-600',
          badge: 'bg-amber-50 text-amber-800 border-amber-200',
        };
      case 'cyan':
        return {
          bg: 'bg-cyan-600',
          text: 'text-cyan-700',
          border: 'border-cyan-600',
          badge: 'bg-cyan-50 text-cyan-800 border-cyan-200',
        };
      case 'slate':
        return {
          bg: 'bg-slate-800',
          text: 'text-slate-800',
          border: 'border-slate-800',
          badge: 'bg-slate-100 text-slate-800 border-slate-300',
        };
      case 'indigo':
      default:
        return {
          bg: 'bg-indigo-600',
          text: 'text-indigo-700',
          border: 'border-indigo-600',
          badge: 'bg-indigo-50 text-indigo-800 border-indigo-200',
        };
    }
  };

  const colors = getAccentColorClasses();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-4xl max-h-[95vh] flex flex-col bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden text-slate-100">
        {/* Modal Controls Bar (Hidden during print) */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-950 border-b border-slate-800 no-print shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-300">
              Invoice Document Preview: <span className="font-mono text-indigo-400">{invoice.invoiceNumber}</span>
            </span>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${
              invoice.status === 'paid' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-300'
            }`}>
              {invoice.status.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
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

            {invoice.status !== 'paid' && (
              <button
                onClick={() => {
                  onClose();
                  onOpenPayModal(invoice);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Simulate Client Pay (Visa/Stripe)</span>
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

        {/* Printable Invoice Canvas (Clean white paper aesthetic) */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-800/40">
          <div className="invoice-printable max-w-3xl mx-auto bg-white text-slate-900 rounded-xl shadow-xl p-10 font-sans border border-slate-200">
            {/* Invoice Top Header */}
            <div className="flex justify-between items-start gap-8 pb-8 border-b border-slate-200">
              <div className="space-y-3">
                {org.logoUrl ? (
                  <img
                    src={org.logoUrl}
                    alt={org.name}
                    className="h-12 w-auto max-w-[200px] object-contain"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg ${colors.bg} text-white font-bold flex items-center justify-center text-base`}>
                      {org.name.charAt(0)}
                    </div>
                    <span className="text-xl font-bold tracking-tight text-slate-900">
                      {org.name}
                    </span>
                  </div>
                )}

                <div className="text-xs text-slate-500 leading-relaxed">
                  <div className="font-semibold text-slate-700">{org.legalName}</div>
                  <div>{org.address.line1}</div>
                  <div>{org.address.city}, {org.address.postalCode} · {org.address.country}</div>
                  <div>Tax ID / VAT: <span className="font-mono text-slate-700">{org.taxId}</span></div>
                  <div>Email: {org.email} · Phone: {org.phone}</div>
                </div>
              </div>

              <div className="text-right space-y-2">
                <div className="text-2xl font-black tracking-tight uppercase text-slate-900">
                  INVOICE
                </div>
                <div className="text-sm font-mono font-semibold text-slate-700">
                  {invoice.invoiceNumber}
                </div>
                <div className="inline-block px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider border bg-slate-50 text-slate-700 border-slate-200">
                  STATUS: {invoice.status}
                </div>

                <div className="text-xs text-slate-500 pt-2 space-y-1">
                  <div>Issue Date: <strong className="text-slate-800 font-mono">{invoice.issueDate}</strong></div>
                  <div>Due Date: <strong className="text-slate-800 font-mono">{invoice.dueDate}</strong></div>
                  {invoice.poNumber && (
                    <div>PO Number: <span className="text-slate-800 font-mono">{invoice.poNumber}</span></div>
                  )}
                </div>
              </div>
            </div>

            {/* Billed To */}
            <div className="grid grid-cols-2 gap-8 py-6 border-b border-slate-200">
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Billed To:
                </div>
                <div className="text-sm font-bold text-slate-900">{invoice.clientName}</div>
                <div className="text-xs text-slate-600 mt-0.5 whitespace-pre-line leading-relaxed">
                  {invoice.clientAddress}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Email: {invoice.clientEmail}
                </div>
                {invoice.clientTaxId && (
                  <div className="text-xs text-slate-500">
                    Tax / VAT ID: <span className="font-mono text-slate-700">{invoice.clientTaxId}</span>
                  </div>
                )}
              </div>

              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Payment Method:
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <div className="font-medium text-slate-800">
                    Credit Card (VISA / Mastercard via Stripe) or Bank Wire
                  </div>
                  <div>Currency: <strong className="font-mono text-slate-900">{invoice.currency}</strong></div>
                  <div>Terms: {org.defaultPaymentTerms}</div>
                  {invoice.paidAt && (
                    <div className="text-emerald-700 font-semibold pt-1">
                      Paid on {new Date(invoice.paidAt).toLocaleDateString()} via {invoice.paymentMethodUsed}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="py-6">
              <table className="w-full text-left text-xs">
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
              <div className="w-64 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono tabular-nums">{invoice.currency} {invoice.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>

                {invoice.totalDiscount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Discount:</span>
                    <span className="font-mono tabular-nums">-{invoice.currency} {invoice.totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                {invoice.totalTax > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Tax:</span>
                    <span className="font-mono tabular-nums">{invoice.currency} {invoice.totalTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-300">
                  <span>Total Due:</span>
                  <span className="font-mono tabular-nums">{invoice.currency} {invoice.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Bank Details & Terms */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-200 text-xs">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                  Bank Remittance Details:
                </div>
                <div className="text-[11px] text-slate-600 font-mono space-y-1">
                  <div>Bank: <strong className="text-slate-800">{org.bankDetails.bankName}</strong></div>
                  <div>Account: <strong className="text-slate-800">{org.bankDetails.accountNumber}</strong></div>
                  <div>SWIFT/BIC: <strong className="text-slate-800">{org.bankDetails.swiftBic}</strong></div>
                  <div>IBAN: <strong className="text-slate-800">{org.bankDetails.iban}</strong></div>
                  <div>Beneficiary: {org.bankDetails.accountHolderName}</div>
                </div>
                {org.bankDetails.paymentInstructions && (
                  <div className="text-[10px] text-slate-500 pt-1 leading-tight">
                    {org.bankDetails.paymentInstructions}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                  Terms & Conditions:
                </div>
                <div className="text-[11px] text-slate-600 leading-relaxed whitespace-pre-line">
                  {invoice.termsAndConditions || org.invoiceTermsAndConditions}
                </div>
                {invoice.notes && (
                  <div className="text-[11px] text-slate-500 italic pt-1">
                    Note: {invoice.notes}
                  </div>
                )}
              </div>
            </div>

            {/* Footer watermark */}
            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
              <span>Generated with Invox Enterprise SaaS Platform</span>
              <span>Page 1 of 1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
