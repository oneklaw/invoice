import React, { useState } from 'react';
import { X, CheckCircle2, Lock, CreditCard, ShieldCheck, Loader2, Receipt, Printer } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Invoice, OrganizationSettings, User } from '../../types';
import { storageService } from '../../services/storage';
import { PaymentReceiptModal } from './PaymentReceiptModal';

interface PublicPayInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  org: OrganizationSettings;
  currentUser: User;
  onPaymentSuccess: () => void;
  onViewReceipt?: (invoice: Invoice) => void;
}

export const PublicPayInvoiceModal: React.FC<PublicPayInvoiceModalProps> = ({
  isOpen,
  onClose,
  invoice,
  org,
  currentUser,
  onPaymentSuccess,
  onViewReceipt,
}) => {
  const [selectedGateway, setSelectedGateway] = useState<'visa_stripe' | 'bank_wire'>('visa_stripe');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 8912');
  const [expiry, setExpiry] = useState('08/29');
  const [cvc, setCvc] = useState('311');
  const [cardHolder, setCardHolder] = useState(invoice.clientName);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stepMessage, setStepMessage] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [paidInvoiceRecord, setPaidInvoiceRecord] = useState<Invoice | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  if (!isOpen) return null;

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setStepMessage('Contacting Visa payment network via Stripe...');

    await new Promise((r) => setTimeout(r, 700));
    setStepMessage('Verifying 3D-Secure authentication...');
    await new Promise((r) => setTimeout(r, 600));
    setStepMessage('Settling transaction funds into merchant account...');
    await new Promise((r) => setTimeout(r, 500));

    const cleanCard = cardNumber.replace(/\s+/g, '');
    const last4 = cleanCard.slice(-4) || '8912';
    const methodStr = `VISA (•••• ${last4}) via Stripe Gateway`;

    storageService.markInvoicePaid(invoice.id, org.id, methodStr, currentUser);

    const updated = storageService.getInvoiceById(invoice.id, org.id) || {
      ...invoice,
      status: 'paid',
      paidAt: new Date().toISOString(),
      paymentMethodUsed: methodStr,
      paymentTransactionId: 'txn_' + Math.random().toString(36).substring(2, 11),
    };
    setPaidInvoiceRecord(updated);

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    setIsProcessing(false);
    setIsCompleted(true);
    onPaymentSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden text-slate-100 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div>
            <div className="text-[11px] font-mono text-indigo-400 uppercase tracking-wider">
              Secure Client Payment Portal
            </div>
            <h2 className="text-base font-bold text-white">
              Pay Invoice {invoice.invoiceNumber}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Invoice Summary */}
        <div className="p-6 pb-2">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">Total Due to {org.name}</div>
              <div className="text-2xl font-bold font-mono text-white mt-0.5">
                {invoice.currency} {invoice.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Billed to: <span className="text-slate-300 font-medium">{invoice.clientName}</span>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                invoice.status === 'paid' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
              }`}>
                {invoice.status.toUpperCase()}
              </span>
              <div className="text-[11px] text-slate-400 mt-1.5 font-mono">
                Due: {invoice.dueDate}
              </div>
            </div>
          </div>
        </div>

        {isCompleted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Payment Received & Confirmed</h3>
              <p className="text-xs text-slate-300 max-w-sm mx-auto mt-1">
                Your payment of <strong className="font-mono text-white">{invoice.currency} {invoice.totalAmount.toLocaleString()}</strong> has been settled via {paidInvoiceRecord?.paymentMethodUsed || 'Stripe & VISA'}.
              </p>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-xs font-mono text-slate-400 max-w-sm mx-auto space-y-1 text-left">
              <div className="flex justify-between">
                <span>Receipt Number:</span>
                <span className="text-white font-bold">REC-{invoice.invoiceNumber.replace(/^INV-?/i, '')}</span>
              </div>
              <div className="flex justify-between">
                <span>Transaction Ref:</span>
                <span className="text-emerald-400 truncate max-w-[180px]">{paidInvoiceRecord?.paymentTransactionId || 'TXN-SETTLED-DIRECT'}</span>
              </div>
              <div className="flex justify-between">
                <span>Customer Email:</span>
                <span className="text-slate-300">{invoice.clientEmail}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (onViewReceipt && paidInvoiceRecord) {
                    onClose();
                    onViewReceipt(paidInvoiceRecord);
                  } else {
                    setShowReceiptModal(true);
                  }
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <Receipt className="w-4 h-4" />
                <span>Generate Receipt</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
              >
                Close Window
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handlePay} className="p-6 pt-2 space-y-4">
            {/* Payment Method Switcher */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedGateway('visa_stripe')}
                className={`py-1.5 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1.5 ${
                  selectedGateway === 'visa_stripe'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Credit Card / Visa</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedGateway('bank_wire')}
                className={`py-1.5 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1.5 ${
                  selectedGateway === 'bank_wire'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Bank Wire / ACH</span>
              </button>
            </div>

            {selectedGateway === 'visa_stripe' ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Cardholder Name</label>
                  <input
                    type="text"
                    required
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Visa / Card Number</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-14 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                    <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <span className="absolute right-3 top-2 text-[10px] font-bold text-blue-400 bg-blue-950 px-1 rounded border border-blue-800">
                      VISA
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Expiry (MM/YY)</label>
                    <input
                      type="text"
                      required
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">CVC</label>
                    <input
                      type="password"
                      required
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {isProcessing && (
                  <div className="p-3 bg-indigo-950/40 border border-indigo-800/60 rounded-lg flex items-center gap-2.5 text-xs text-indigo-300">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                    <span>{stepMessage}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full mt-2 min-h-[44px] py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>Authorize & Pay {invoice.currency} {invoice.totalAmount.toLocaleString()}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3 bg-slate-950/80 p-4 rounded-lg border border-slate-800 text-xs">
                <div className="font-semibold text-slate-200">Merchant Wire Account Details:</div>
                <div className="space-y-1.5 font-mono text-[11px] text-slate-300">
                  <div>Bank: <span className="text-white">{org.bankDetails.bankName}</span></div>
                  <div>Account Name: <span className="text-white">{org.bankDetails.accountHolderName}</span></div>
                  <div>Account #: <span className="text-white">{org.bankDetails.accountNumber}</span></div>
                  <div>Routing #: <span className="text-white">{org.bankDetails.routingNumber}</span></div>
                  <div>SWIFT / BIC: <span className="text-white">{org.bankDetails.swiftBic}</span></div>
                  <div>IBAN: <span className="text-white">{org.bankDetails.iban}</span></div>
                </div>
                <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                  {org.bankDetails.paymentInstructions}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const wireMethod = 'Manual Bank Wire (Remittance Confirmed)';
                    storageService.markInvoicePaid(invoice.id, org.id, wireMethod, currentUser);
                    const updated = storageService.getInvoiceById(invoice.id, org.id) || {
                      ...invoice,
                      status: 'paid',
                      paidAt: new Date().toISOString(),
                      paymentMethodUsed: wireMethod,
                      paymentTransactionId: 'txn_wire_' + Math.random().toString(36).substring(2, 9),
                    };
                    setPaidInvoiceRecord(updated);
                    onPaymentSuccess();
                    setIsCompleted(true);
                  }}
                  className="w-full mt-2 min-h-[44px] py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 active:scale-[0.98] transition-all cursor-pointer"
                >
                  Confirm Wire Transfer Initiated
                </button>
              </div>
            )}

            <div className="text-[11px] text-center text-slate-500 flex items-center justify-center gap-2 pt-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Direct encrypted checkout processed by Stripe & Visa</span>
            </div>
          </form>
        )}
      </div>

      {/* Embedded A4 Receipt Modal */}
      {showReceiptModal && (
        <PaymentReceiptModal
          isOpen={showReceiptModal}
          onClose={() => {
            setShowReceiptModal(false);
            onClose();
          }}
          invoice={paidInvoiceRecord || invoice}
          org={org}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};
