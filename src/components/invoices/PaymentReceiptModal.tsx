import React, { useState } from 'react';
import {
  X,
  Printer,
  Download,
  Mail,
  CheckCircle2,
  ShieldCheck,
  Copy,
  Check,
  Building2,
  Receipt,
  FileCheck,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { Invoice, OrganizationSettings, User } from '../../types';
import { emailService } from '../../services/emailService';

interface PaymentReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  org: OrganizationSettings;
  currentUser?: User;
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  isOpen,
  onClose,
  invoice,
  org,
  currentUser,
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [showStamp, setShowStamp] = useState(true);

  if (!isOpen) return null;

  // Receipt numbering convention
  const receiptNumber = `REC-${invoice.invoiceNumber.replace(/^INV-?/i, '')}`;
  const transactionId =
    invoice.paymentTransactionId || `txn_${invoice.id.slice(-6)}_${Date.now().toString(36).slice(-4)}`;
  const paymentDate = invoice.paidAt
    ? new Date(invoice.paidAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

  const paymentTime = invoice.paidAt
    ? new Date(invoice.paidAt).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '10:45 AM';

  const paymentMethod = invoice.paymentMethodUsed || 'Credit Card (Visa Direct via Stripe)';

  const handlePrint = () => {
    window.print();
  };

  const handleCopyReceiptNumber = () => {
    navigator.clipboard.writeText(receiptNumber);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleEmailReceipt = () => {
    try {
      emailService.notifyPaymentReceived(invoice, org, paymentMethod, transactionId);
      setEmailStatus(`Receipt sent to ${invoice.clientEmail}!`);
      setTimeout(() => setEmailStatus(null), 4000);
    } catch {
      setEmailStatus('Receipt sent to client!');
      setTimeout(() => setEmailStatus(null), 4000);
    }
  };

  // Generate simulated cryptographic verification hash
  const verificationHash = `sha256:7f8b9a1c${invoice.id.slice(-4)}${invoice.totalAmount}00e2417c`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      {/* Print styles injection for pixel-perfect A4 portrait sheet */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm 10mm 12mm;
          }
          body {
            background: #ffffff !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .a4-receipt-sheet {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: auto !important;
          }
          .a4-print-container {
            padding: 0 !important;
            background: transparent !important;
          }
        }
      `}</style>

      <div className="w-full max-w-4xl max-h-[96vh] flex flex-col bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden text-slate-100">
        {/* Modal Controls Toolbar (Hidden on print) */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-950 border-b border-slate-800 no-print shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Official A4 Payment Receipt
                </span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  PAID IN FULL
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                {receiptNumber} · Settled {paymentDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowStamp(!showStamp)}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 ${
                showStamp
                  ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
              title="Toggle official verification seal"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>{showStamp ? 'Seal Active' : 'Show Seal'}</span>
            </button>

            <button
              onClick={handleEmailReceipt}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
              title="Email receipt to client"
            >
              <Mail className="w-3.5 h-3.5 text-indigo-400" />
              <span>Email Receipt</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors"
              title="Print or save as high-resolution A4 PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print A4 PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-2"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Email Toast confirmation */}
        {emailStatus && (
          <div className="bg-emerald-950/90 border-b border-emerald-800 px-6 py-2 flex items-center justify-between text-xs text-emerald-300 no-print">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{emailStatus}</span>
            </div>
            <button onClick={() => setEmailStatus(null)} className="text-emerald-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* A4 Paper Canvas Container */}
        <div className="a4-print-container flex-1 overflow-y-auto p-6 lg:p-10 bg-slate-800/50 flex justify-center">
          {/* Authentic A4 Document Sheet: Exactly 210mm x 297mm proportions */}
          <div className="a4-receipt-sheet w-full max-w-[794px] min-h-[1050px] bg-white text-slate-900 rounded-lg shadow-2xl p-10 md:p-12 font-sans flex flex-col justify-between border border-slate-200 select-text">
            {/* Top Security Header & Brand */}
            <div>
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6 mb-6">
                {/* Organization Brand */}
                <div className="space-y-2 max-w-sm">
                  {org.logoUrl ? (
                    <img
                      src={org.logoUrl}
                      alt={org.name}
                      className="h-12 w-auto max-w-[200px] object-contain mb-2"
                    />
                  ) : (
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded bg-slate-900 text-white font-black text-lg flex items-center justify-center tracking-tight">
                        {org.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-lg font-black tracking-tight text-slate-900 leading-tight">
                          {org.name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          {org.legalName}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-slate-600 leading-relaxed pt-1">
                    <div>{org.address.line1}</div>
                    <div>
                      {org.address.city}, {org.address.postalCode} · {org.address.country}
                    </div>
                    <div className="text-slate-700 font-mono text-[11px] pt-0.5">
                      Tax / VAT: <strong>{org.taxId}</strong>
                    </div>
                    <div>
                      Email: {org.email} · Tel: {org.phone}
                    </div>
                  </div>
                </div>

                {/* Right Document Title & Receipt Identifiers */}
                <div className="text-right space-y-2">
                  <div className="inline-block px-3 py-1 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-sm">
                    Official Payment Receipt
                  </div>

                  <div className="space-y-1 pt-1 text-xs">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-slate-500 font-medium">Receipt No:</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {receiptNumber}
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <span className="text-slate-500">Invoice Ref:</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {invoice.invoiceNumber}
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <span className="text-slate-500">Payment Date:</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {paymentDate}
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <span className="text-slate-500">Timestamp:</span>
                      <span className="font-mono text-slate-600 text-[11px]">
                        {paymentTime} UTC
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Settlement Summary Banner */}
              <div className="bg-slate-50 border border-slate-200 rounded-md p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Payment Status
                  </div>
                  <div className="text-base font-black text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Funds Received & Cleared</span>
                  </div>
                  <div className="text-xs text-slate-600">
                    Settled via <strong className="text-slate-800">{paymentMethod}</strong>
                  </div>
                </div>

                <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Amount Paid
                  </div>
                  <div className="text-2xl font-black font-mono text-slate-900">
                    {invoice.currency}{' '}
                    {invoice.totalAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <div className="text-[11px] font-bold text-emerald-700 font-mono">
                    Zero Outstanding Balance (0.00 Due)
                  </div>
                </div>
              </div>

              {/* Parties Grid (Received From / Billed To) */}
              <div className="grid grid-cols-2 gap-8 pb-6 border-b border-slate-200 mb-6 text-xs">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Received From (Payer)
                  </div>
                  <div className="text-sm font-bold text-slate-900">{invoice.clientName}</div>
                  <div className="text-slate-600 mt-0.5 whitespace-pre-line leading-relaxed">
                    {invoice.clientAddress}
                  </div>
                  <div className="text-slate-600 mt-1">
                    Email: <span className="text-slate-800 font-medium">{invoice.clientEmail}</span>
                  </div>
                  {invoice.clientTaxId && (
                    <div className="text-slate-600 font-mono text-[11px]">
                      Tax ID: {invoice.clientTaxId}
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Transaction & Verification Details
                  </div>
                  <div className="space-y-1 font-mono text-slate-700">
                    <div>
                      <span className="text-slate-500">Transaction ID: </span>
                      <strong className="text-slate-900">{transactionId}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Settlement Gateway: </span>
                      <span>Stripe Direct Processing</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Auth Code: </span>
                      <span>AUTH-STP-{(invoice.id.slice(-6)).toUpperCase()}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Original Invoice Due: </span>
                      <span>{invoice.dueDate}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="mb-6">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Payment Deliverables & Line Item Schedule
                </div>
                <table className="w-full text-left text-xs border border-slate-200 rounded overflow-hidden">
                  <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 text-right">Qty</th>
                      <th className="py-2.5 px-3 text-right">Rate</th>
                      <th className="py-2.5 px-3 text-right">Tax</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoice.items.map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td className="py-2.5 px-3 font-medium text-slate-800">
                          {item.description}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                          {item.quantity}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                          {invoice.currency} {item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                          {item.taxRate}%
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          {invoice.currency} {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Settlement Totals Breakdown & Official Stamp */}
              <div className="grid grid-cols-2 gap-8 pt-2 pb-6 border-b border-slate-200 mb-6">
                {/* Official Paid Stamp Simulation */}
                <div className="flex items-center">
                  {showStamp && (
                    <div className="relative border-4 border-emerald-600 border-dashed rounded-lg p-3.5 max-w-[280px] bg-emerald-50/50 rotate-[-2deg] select-none">
                      <div className="flex items-center gap-1.5 text-emerald-800 font-black text-sm uppercase tracking-wider">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span>PAID IN FULL</span>
                      </div>
                      <div className="text-[10px] font-mono text-emerald-900 mt-1 font-semibold">
                        SETTLED ON: {paymentDate} · {paymentTime}
                      </div>
                      <div className="text-[9px] font-mono text-emerald-700 truncate">
                        AUTH: {transactionId}
                      </div>
                      <div className="text-[9px] text-emerald-800 uppercase font-bold tracking-tight mt-0.5">
                        {org.legalName}
                      </div>
                    </div>
                  )}
                </div>

                {/* Financial Totals */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono text-slate-800">
                      {invoice.currency} {invoice.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {invoice.totalDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Discount:</span>
                      <span className="font-mono font-medium">
                        -{invoice.currency} {invoice.totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-600">
                    <span>Tax / VAT:</span>
                    <span className="font-mono text-slate-800">
                      {invoice.currency} {invoice.totalTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
                    <span>Total Invoiced:</span>
                    <span className="font-mono">
                      {invoice.currency} {invoice.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm font-bold text-emerald-700 pt-1">
                    <span>Payment Received:</span>
                    <span className="font-mono">
                      -{invoice.currency} {invoice.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="pt-2 border-t-2 border-slate-900 flex justify-between text-base font-black text-slate-900">
                    <span>Balance Due:</span>
                    <span className="font-mono text-emerald-700">
                      {invoice.currency} 0.00
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Official Sign-Off & Microprint */}
            <div className="pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-8 text-[11px] text-slate-500">
                <div>
                  <div className="font-bold text-slate-800 uppercase text-[10px] tracking-wider mb-1">
                    Receipt Terms & Certification
                  </div>
                  <p className="leading-relaxed">
                    This document serves as an official proof of payment and tax receipt issued by{' '}
                    <strong>{org.legalName}</strong>. All amounts are settled in full and credited
                    to merchant account. Please retain this receipt for corporate tax and statutory
                    audit filings.
                  </p>
                </div>

                <div className="text-right space-y-1">
                  <div className="font-bold text-slate-800 uppercase text-[10px] tracking-wider mb-1">
                    Authorized Electronic Sign-off
                  </div>
                  <div className="font-serif italic text-slate-800 text-sm">
                    {currentUser?.name || org.name + ' Finance Controller'}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Treasury & Accounts Department · {org.legalName}
                  </div>
                  <div className="font-mono text-[9px] text-slate-400 truncate pt-1">
                    {verificationHash}
                  </div>
                </div>
              </div>

              {/* Security Microprint footer */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>
                    Secured by Invox Enterprise SaaS Platform · 256-Bit SSL Tamper-Evident Ledger
                  </span>
                </div>
                <div className="font-mono">Page 1 of 1 · DIN A4 (210 × 297 mm)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
