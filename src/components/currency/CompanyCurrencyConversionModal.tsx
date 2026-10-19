import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowRight,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Layers,
  ArrowLeftRight,
  ShieldCheck,
  Check,
  Sliders,
} from 'lucide-react';
import { OrganizationSettings, User, Invoice } from '../../types';
import { currencyService } from '../../services/currencyService';
import { storageService } from '../../services/storage';
import { CurrencySelect } from './CurrencySelect';

interface CompanyCurrencyConversionModalProps {
  isOpen: boolean;
  onClose: () => void;
  org: OrganizationSettings;
  currentUser: User;
  onSuccess: (newCurrency: string, convertedCount: number) => void;
  initialTargetCurrency?: string;
}

export const CompanyCurrencyConversionModal: React.FC<CompanyCurrencyConversionModalProps> = ({
  isOpen,
  onClose,
  org,
  currentUser,
  onSuccess,
  initialTargetCurrency,
}) => {
  const [targetCurrency, setTargetCurrency] = useState<string>(
    initialTargetCurrency || (org.currency === 'USD' ? 'EUR' : 'USD')
  );
  const [exchangeRate, setExchangeRate] = useState<number>(1.0);
  const [isCustomRate, setIsCustomRate] = useState<boolean>(false);
  const [convertExistingInvoices, setConvertExistingInvoices] = useState<boolean>(true);
  const [testAmount, setTestAmount] = useState<number>(1000);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isRefreshingRates, setIsRefreshingRates] = useState<boolean>(false);
  const [conversionSuccess, setConversionSuccess] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  const fromInfo = currencyService.getCurrency(org.currency);
  const toInfo = currencyService.getCurrency(targetCurrency);

  // Invoices for this company
  const companyInvoices = storageService.getInvoices(org.id);

  // Calculate live market exchange rate
  useEffect(() => {
    if (!isOpen) return;
    const defaultTarget = initialTargetCurrency || (org.currency === 'USD' ? 'EUR' : 'USD');
    setTargetCurrency(defaultTarget);
    const rate = currencyService.getExchangeRate(org.currency, defaultTarget);
    setExchangeRate(Number(rate.toFixed(4)));
    setIsCustomRate(false);
    setConversionSuccess(false);
    setLastRefreshed(new Date().toLocaleTimeString());
  }, [isOpen, org.currency, initialTargetCurrency]);

  const handleTargetChange = (newCode: string) => {
    setTargetCurrency(newCode);
    const rate = currencyService.getExchangeRate(org.currency, newCode);
    setExchangeRate(Number(rate.toFixed(4)));
    setIsCustomRate(false);
  };

  const handleRefreshMarketRate = async () => {
    setIsRefreshingRates(true);
    await currencyService.refreshLiveRates();
    const rate = currencyService.getExchangeRate(org.currency, targetCurrency);
    setExchangeRate(Number(rate.toFixed(4)));
    setIsCustomRate(false);
    setLastRefreshed(new Date().toLocaleTimeString());
    setIsRefreshingRates(false);
  };

  if (!isOpen) return null;

  // Impact calculations
  const totalBilled = companyInvoices
    .filter((i) => i.status !== 'void')
    .reduce((sum, i) => sum + i.totalAmount, 0);

  const totalCollected = companyInvoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + i.totalAmount, 0);

  const totalOutstanding = companyInvoices
    .filter((i) => i.status === 'sent' || i.status === 'overdue')
    .reduce((sum, i) => sum + i.totalAmount, 0);

  const convertedBilled = totalBilled * exchangeRate;
  const convertedCollected = totalCollected * exchangeRate;
  const convertedOutstanding = totalOutstanding * exchangeRate;

  const testConverted = testAmount * exchangeRate;

  const handleConfirm = async () => {
    if (org.currency === targetCurrency) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));

    const result = storageService.convertOrganizationCurrency(
      org.id,
      targetCurrency,
      exchangeRate,
      convertExistingInvoices,
      currentUser
    );

    setIsSubmitting(false);

    if (result.success) {
      setConversionSuccess(true);
      setTimeout(() => {
        onSuccess(targetCurrency, result.convertedInvoiceCount);
        onClose();
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Company Currency Conversion</h2>
              <p className="text-xs text-slate-400">
                Change primary operating currency for <span className="text-indigo-400">{org.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {conversionSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-950 border border-emerald-600 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-900/20">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Currency Successfully Converted!</h3>
              <p className="text-xs text-slate-400 mt-1">
                Your company currency is now <strong className="text-white">{toInfo.code} ({toInfo.symbol})</strong>.
                {convertExistingInvoices && (
                  <span className="block mt-1 text-emerald-400">
                    All {companyInvoices.length} historical invoices and balances have been systematically converted at rate {exchangeRate}.
                  </span>
                )}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Currency Pair Visualizer */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
              <div className="grid grid-cols-1 md:grid-cols-5 items-center gap-4">
                {/* From Currency (Current) */}
                <div className="md:col-span-2 p-3 bg-slate-900 border border-slate-800 rounded-lg">
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-1">
                    Current Currency
                  </span>
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{fromInfo.flag}</span>
                    <div>
                      <div className="font-mono font-bold text-base text-white">
                        {fromInfo.code} <span className="text-slate-400 font-normal">({fromInfo.symbol})</span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">{fromInfo.name}</div>
                    </div>
                  </div>
                </div>

                {/* Conversion Direction */}
                <div className="flex flex-col items-center justify-center md:col-span-1 py-1">
                  <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono mt-1">Convert</span>
                </div>

                {/* To Currency (Target Selector) */}
                <div className="md:col-span-2">
                  <span className="text-[10px] uppercase font-semibold text-indigo-400 block mb-1">
                    Choose New Currency
                  </span>
                  <CurrencySelect
                    value={targetCurrency}
                    onChange={handleTargetChange}
                  />
                </div>
              </div>
            </div>

            {/* Exchange Rate Box */}
            <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Exchange Rate Benchmark</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRefreshMarketRate}
                    disabled={isRefreshingRates}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw className={`w-3 h-3 ${isRefreshingRates ? 'animate-spin' : ''}`} />
                    <span>Sync Live Market FX</span>
                  </button>
                  {lastRefreshed && (
                    <span className="text-[10px] text-slate-500">({lastRefreshed})</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-900 border border-slate-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-300">
                    1 {fromInfo.code} =
                  </span>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.0001"
                      min="0.0001"
                      value={exchangeRate}
                      onChange={(e) => {
                        setExchangeRate(parseFloat(e.target.value) || 0);
                        setIsCustomRate(true);
                      }}
                      className="w-32 bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded px-2.5 py-1 text-sm font-mono font-bold text-indigo-400 text-right focus:outline-none"
                    />
                  </div>
                  <span className="text-sm font-semibold text-white">
                    {toInfo.code}
                  </span>
                </div>

                {isCustomRate && (
                  <button
                    type="button"
                    onClick={() => {
                      const rate = currencyService.getExchangeRate(org.currency, targetCurrency);
                      setExchangeRate(Number(rate.toFixed(4)));
                      setIsCustomRate(false);
                    }}
                    className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 self-start sm:self-auto"
                  >
                    <span>Custom rate entered · Reset to Market</span>
                  </button>
                )}
              </div>

              {/* Quick Test Converter */}
              <div className="flex items-center justify-between text-xs text-slate-400 px-1 pt-1">
                <span>Interactive Preview:</span>
                <div className="font-mono text-slate-300 flex items-center gap-1.5">
                  <span>{fromInfo.symbol}</span>
                  <input
                    type="number"
                    value={testAmount}
                    onChange={(e) => setTestAmount(parseFloat(e.target.value) || 0)}
                    className="w-20 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-xs font-mono text-white text-right"
                  />
                  <span>{fromInfo.code}</span>
                  <span>=</span>
                  <strong className="text-indigo-400">
                    {toInfo.symbol} {testConverted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {toInfo.code}
                  </strong>
                </div>
              </div>
            </div>

            {/* Conversion Impact Breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>Financial Impact Preview ({companyInvoices.length} Invoices Found)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Total Billed */}
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                  <div className="text-[11px] text-slate-400">Total Billed Volume</div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">
                    {fromInfo.symbol} {totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2 })} {fromInfo.code}
                  </div>
                  <div className="text-sm font-bold font-mono text-white mt-1">
                    ➔ {toInfo.symbol} {convertedBilled.toLocaleString(undefined, { minimumFractionDigits: 2 })} {toInfo.code}
                  </div>
                </div>

                {/* Collected */}
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                  <div className="text-[11px] text-slate-400">Collected Revenue</div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">
                    {fromInfo.symbol} {totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })} {fromInfo.code}
                  </div>
                  <div className="text-sm font-bold font-mono text-emerald-400 mt-1">
                    ➔ {toInfo.symbol} {convertedCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })} {toInfo.code}
                  </div>
                </div>

                {/* Outstanding */}
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                  <div className="text-[11px] text-slate-400">Outstanding Receivables</div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">
                    {fromInfo.symbol} {totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })} {fromInfo.code}
                  </div>
                  <div className="text-sm font-bold font-mono text-indigo-300 mt-1">
                    ➔ {toInfo.symbol} {convertedOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })} {toInfo.code}
                  </div>
                </div>
              </div>
            </div>

            {/* Choose Conversion Strategy */}
            <div className="space-y-2.5">
              <span className="text-xs font-semibold text-slate-300 block">
                Choose Conversion Scope:
              </span>

              {/* Option A: Full Conversion */}
              <label
                onClick={() => setConvertExistingInvoices(true)}
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  convertExistingInvoices
                    ? 'bg-indigo-600/10 border-indigo-500/60 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="conversionStrategy"
                  checked={convertExistingInvoices}
                  onChange={() => setConvertExistingInvoices(true)}
                  className="mt-1 text-indigo-600 focus:ring-0 bg-slate-900 border-slate-700"
                />
                <div className="flex-1 text-xs">
                  <div className="font-semibold text-white flex items-center gap-2">
                    <span>Convert All Existing Invoices & Line Items</span>
                    <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-1.5 py-0.5 rounded font-mono uppercase">
                      Recommended
                    </span>
                  </div>
                  <p className="text-slate-400 mt-0.5 leading-relaxed">
                    Systematically recalculates every invoice line item, unit price, tax, and total balance into <strong className="text-slate-300">{toInfo.code}</strong> at the agreed FX rate ({exchangeRate}). All reports, Google Sheets exports, and client invoices reflect the new currency.
                  </p>
                </div>
              </label>

              {/* Option B: Operating Currency Only */}
              <label
                onClick={() => setConvertExistingInvoices(false)}
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  !convertExistingInvoices
                    ? 'bg-indigo-600/10 border-indigo-500/60 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="conversionStrategy"
                  checked={!convertExistingInvoices}
                  onChange={() => setConvertExistingInvoices(false)}
                  className="mt-1 text-indigo-600 focus:ring-0 bg-slate-900 border-slate-700"
                />
                <div className="flex-1 text-xs">
                  <div className="font-semibold text-white">
                    Update Operating Currency Only (Keep Past Invoices in {fromInfo.code})
                  </div>
                  <p className="text-slate-400 mt-0.5 leading-relaxed">
                    New invoices will default to {toInfo.code}. Past invoices and historical balances will stay in their original {fromInfo.code} denomination without modifying existing amounts.
                  </p>
                </div>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isSubmitting || org.currency === targetCurrency}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Converting Financial Records...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>
                      Apply & Switch to {toInfo.code} ({toInfo.symbol})
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
