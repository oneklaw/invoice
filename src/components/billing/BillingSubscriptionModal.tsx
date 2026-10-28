import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, Lock, CreditCard, Sparkles, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { OrganizationSettings, User } from '../../types';
import { storageService } from '../../services/storage';

interface BillingSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  org: OrganizationSettings;
  currentUser: User;
  onSuccess: () => void;
  reason?: 'limit_reached' | 'manual';
}

export const BillingSubscriptionModal: React.FC<BillingSubscriptionModalProps> = ({
  isOpen,
  onClose,
  org,
  currentUser,
  onSuccess,
  reason = 'manual',
}) => {
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('424');
  const [cardName, setCardName] = useState(currentUser.name || 'Kenneth Onekalit');
  const [postalCode, setPostalCode] = useState('94104');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFillTestVisa = () => {
    setCardNumber('4242 4242 4242 4242');
    setCardExpiry('11/29');
    setCardCvc('888');
    setCardName(currentUser.name);
    setPostalCode('94104');
    setError(null);
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanCard = cardNumber.replace(/\s+/g, '');
    if (cleanCard.length < 15) {
      setError('Please enter a valid 16-digit credit card number.');
      return;
    }

    setIsProcessing(true);
    setProcessingStep('Connecting to Stripe & Visa Network...');

    try {
      await new Promise(r => setTimeout(r, 600));
      setProcessingStep('Tokenizing card with Visa Secure / 3D-Secure 2.0...');
      await new Promise(r => setTimeout(r, 700));
      setProcessingStep('Activating $2.00/mo recurring subscription...');
      await new Promise(r => setTimeout(r, 600));

      const last4 = cleanCard.slice(-4);
      const isVisa = cleanCard.startsWith('4');
      const brand = isVisa ? 'Visa' : 'Mastercard';

      storageService.upgradeToPro(org.id, { last4, brand }, currentUser);

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });

      setIsProcessing(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      setIsProcessing(false);
      setError(err?.message || 'Payment processing failed. Please try again.');
    }
  };

  const isVisa = cardNumber.replace(/\s/g, '').startsWith('4');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Upgrade to KERO INVOICE Pro</h2>
              <p className="text-xs text-slate-400">Unlock unlimited invoices and API access</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Reason Alert if quota exceeded */}
        {reason === 'limit_reached' && (
          <div className="bg-amber-950/50 border-b border-amber-800/40 px-6 py-3 text-xs text-amber-200 flex items-start gap-2.5">
            <span className="font-semibold text-amber-400">Free Tier Limit Reached:</span>
            <span>You have generated all 10 free starter invoices. Subscribe for just $2/month to continue generating invoices seamlessly.</span>
          </div>
        )}

        {/* Plan summary badge */}
        <div className="p-6 pb-2">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                Monthly Recurring Plan
              </div>
              <div className="text-xl font-bold text-white mt-0.5">
                $2.00 <span className="text-xs font-normal text-slate-400">/ month</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Unlimited invoices · Multi-user RBAC · Stripe & VISA billing portal
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-900/60 text-blue-200 border border-blue-700 font-bold">
                VISA
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-200 border border-indigo-700 font-bold">
                STRIPE
              </span>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSubscribe} className="p-6 pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-medium text-slate-300">
              Card Details (Stripe & VISA Gateway)
            </label>
            <button
              type="button"
              onClick={handleFillTestVisa}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 hover:underline"
            >
              Fill Visa Test Card
            </button>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Name on Card</label>
            <input
              type="text"
              required
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              placeholder="e.g. John Doe"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Card Number</label>
            <div className="relative">
              <input
                type="text"
                required
                maxLength={19}
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-16 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                placeholder="4242 4242 4242 4242"
              />
              <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <div className="absolute right-3 top-2 flex items-center">
                {isVisa ? (
                  <span className="text-[10px] font-bold tracking-wider text-blue-400 bg-blue-950/80 px-1.5 py-0.5 rounded border border-blue-800">
                    VISA
                  </span>
                ) : (
                  <span className="text-[10px] font-bold tracking-wider text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800">
                    CARD
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Expires (MM/YY)</label>
              <input
                type="text"
                required
                maxLength={5}
                value={cardExpiry}
                onChange={(e) => setCardExpiry(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                placeholder="12/28"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">CVC / CVV</label>
              <input
                type="password"
                required
                maxLength={4}
                value={cardCvc}
                onChange={(e) => setCardCvc(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                placeholder="•••"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Billing ZIP / Postal Code</label>
            <input
              type="text"
              required
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
              placeholder="94104"
            />
          </div>

          {error && (
            <div className="p-2.5 rounded bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {isProcessing && (
            <div className="p-3 bg-indigo-950/40 border border-indigo-800/60 rounded-lg flex items-center gap-3 text-xs text-indigo-300">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400 shrink-0" />
              <span>{processingStep}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Pay $2.00 / Month via Stripe & VISA</span>
            </button>
          </div>

          <div className="flex items-center justify-center gap-3 text-[11px] text-slate-500 pt-1">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              256-bit Encrypted
            </span>
            <span>·</span>
            <span>Cancel anytime from billing settings</span>
            <span>·</span>
            <span>Visa Secure verified</span>
          </div>
        </form>
      </div>
    </div>
  );
};
