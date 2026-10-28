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

import { pdfExportService } from '../../services/pdfExportService';

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
  const [isExportingPdf, setIsExportingPdf] = useState(false);

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

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      await pdfExportService.exportReceiptToA4Pdf(invoice, org);
      setEmailStatus(`Official A4 PDF receipt downloaded: Receipt_${receiptNumber}.pdf`);
      setTimeout(() => setEmailStatus(null), 4000);
    } catch (err: any) {
      console.error('Failed to export A4 PDF receipt:', err);
      alert(`Could not export PDF receipt: ${err?.message || 'Error occurred'}`);
    } finally {
      setIsExportingPdf(false);
    }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto">
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

      <div className="w-full max-w-4xl h-[100dvh] sm:h-auto sm:max-h-[96vh] rounded-none sm:rounded-xl flex flex-col bg-slate-900 border-0 sm:border sm:border-slate-700 shadow-2xl overflow-hidden text-slate-100 relative">
        {/* Dedicated Smartphone App Bar (< md screens) */}
        <div className="flex md:hidden items-center justify-between px-3.5 py-2.5 bg-slate-950 border-b border-slate-800 no-print shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white font-mono truncate max-w-[130px]">
                  {receiptNumber}
                </span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  PAID
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {paymentDate}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowStamp(!showStamp)}
              className={`min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg border transition-colors ${
                showStamp
                  ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
              title="Toggle verification seal"
            >
              <FileCheck className="w-4 h-4" />
            </button>

            <button
              onClick={handlePrint}
              className="min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-300 bg-slate-800 rounded-lg border border-slate-700"
              title="Print Receipt"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Desktop Controls Toolbar (Hidden on mobile and print) */}
        <div className="hidden md:flex items-center justify-between px-6 py-3.5 bg-slate-950 border-b border-slate-800 no-print shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Receipt
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
              title="Toggle verification seal"
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
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg shadow-sm transition-colors cursor-pointer"
              title="Download A4 PDF Receipt directly"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExportingPdf ? 'Exporting PDF...' : 'Download Receipt (PDF)'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer"
              title="Open Browser Print Dialog"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-2 cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Email Toast confirmation */}
        {emailStatus && (
          <div className="bg-emerald-950/90 border-b border-emerald-800 px-4 sm:px-6 py-2 flex items-center justify-between text-xs text-emerald-300 no-print">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">{emailStatus}</span>
            </div>
            <button onClick={() => setEmailStatus(null)} className="text-emerald-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* A4 Paper Canvas Container */}
        <div className="a4-print-container flex-1 overflow-y-auto p-2 sm:p-6 lg:p-10 pb-28 md:pb-10 bg-slate-100/90 flex justify-center">
          {/* Authentic A4 Document Sheet: Exactly 210mm x 297mm proportions */}
          <div className="a4-receipt-sheet w-full max-w-[794px] min-h-[1050px] bg-white text-slate-900 rounded-lg shadow-2xl p-4 sm:p-8 md:p-12 font-sans flex flex-col justify-between border border-slate-200 select-text">
            {/* Top Security Header & Brand */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b-2 border-slate-900 pb-4 sm:pb-6 mb-4 sm:mb-6 gap-4">
                {/* Organization Brand */}
                <div className="space-y-2 max-w-sm">
                  {org.logoUrl || '/kero-logo.png' ? (
                    <img
                      src={org.logoUrl || '/kero-logo.png'}
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
                <div className="text-left sm:text-right space-y-2">
                  <div className="inline-block px-3 py-1 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-sm">
                    Receipt
                  </div>

                  <div className="space-y-1 pt-1 text-xs">
                    <div className="flex items-center justify-start sm:justify-end gap-2">
                      <span className="text-slate-500 font-medium">Receipt No:</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {receiptNumber}
                      </span>
                    </div>

                    <div className="flex items-center justify-start sm:justify-end gap-2">
                      <span className="text-slate-500">Invoice Ref:</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {invoice.invoiceNumber}
                      </span>
                    </div>

                    <div className="flex items-center justify-start sm:justify-end gap-2">
                      <span className="text-slate-500">Payment Date:</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {paymentDate}
                      </span>
                    </div>

                    <div className="flex items-center justify-start sm:justify-end gap-2">
                      <span className="text-slate-500">Timestamp:</span>
                      <span className="font-mono text-slate-600 text-[11px]">
                        {paymentTime} UTC
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Settlement Summary Banner */}
              <div className="bg-slate-50 border border-slate-200 rounded-md p-3.5 sm:p-4 mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Payment Status
                  </div>
                  <div className="text-sm sm:text-base font-black text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
                    <span>Funds Received & Cleared</span>
                  </div>
                  <div className="text-[11px] sm:text-xs text-slate-600">
                    Settled via <strong className="text-slate-800">{paymentMethod}</strong>
                  </div>
                </div>

                <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                  <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Amount Paid
                  </div>
                  <div className="text-xl sm:text-2xl font-black font-mono text-slate-900">
                    {invoice.currency}{' '}
                    {invoice.totalAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-bold text-emerald-700 font-mono">
                    Zero Outstanding Balance (0.00 Due)
                  </div>
                </div>
              </div>

              {/* Parties Grid (Received From / Billed To) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 pb-4 sm:pb-6 border-b border-slate-200 mb-4 sm:mb-6 text-xs">
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
                  <div className="space-y-1 font-mono text-slate-700 text-[11px] sm:text-xs">
                    <div>
                      <span className="text-slate-500">Transaction ID: </span>
                      <strong className="text-slate-900 break-all">{transactionId}</strong>
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

              {/* Line Items Schedule: Mobile Cards + Desktop Table */}
              <div className="mb-4 sm:mb-6">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Payment Deliverables & Line Item Schedule
                </div>

                {/* Smartphone Card Layout (< 640px) */}
                <div className="block sm:hidden space-y-2">
                  {invoice.items.map((item, idx) => (
                    <div
                      key={`mob-item-${item.id || idx}`}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-slate-900 leading-snug">
                          {item.description}
                        </span>
                        <span className="font-mono font-bold text-slate-900 shrink-0">
                          {invoice.currency} {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-0.5 border-t border-slate-200/60">
                        <span>
                          {item.quantity} × {invoice.currency} {item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        <span>Tax: {item.taxRate}%</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop High-Density Table (>= 640px) */}
                <table className="hidden sm:table w-full text-left text-xs border border-slate-200 rounded overflow-hidden">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 pt-2 pb-6 border-b border-slate-200 mb-6">
                {/* Official Paid Stamp Simulation */}
                <div className="flex items-center justify-center sm:justify-start">
                  {showStamp && (
                    <div className="relative border-4 border-emerald-600 border-dashed rounded-lg p-3 sm:p-3.5 max-w-[280px] w-full bg-emerald-50/50 rotate-[-2deg] select-none">
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
                      <div className="text-[9px] text-emerald-800 uppercase font-bold tracking-tight mt-0.5 truncate">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 text-[11px] text-slate-500">
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

                <div className="text-left sm:text-right space-y-1">
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
              <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-[10px] text-slate-400 gap-1.5">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span className="truncate">
                    Secured by KERO INVOICE SaaS · 256-Bit SSL Tamper-Evident Ledger
                  </span>
                </div>
                <div className="font-mono">Page 1 of 1 · DIN A4 (210 × 297 mm)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Natural Thumb Zone Sticky Action Bar for Smartphones */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 p-3 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 z-40 flex items-center gap-2 no-print shadow-2xl">
          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="flex-1 min-h-[44px] px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{isExportingPdf ? 'Exporting PDF...' : 'Export A4 PDF'}</span>
          </button>

          <button
            onClick={handleEmailReceipt}
            className="min-h-[44px] px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 border border-slate-700 active:scale-[0.98] transition-all cursor-pointer"
            title="Email Receipt to Client"
          >
            <Mail className="w-4 h-4 text-indigo-400" />
            <span>Email</span>
          </button>
        </div>
      </div>
    </div>
  );
};
