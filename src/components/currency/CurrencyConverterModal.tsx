import React, { useState } from 'react';
import {
  X,
  ArrowRightLeft,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Globe,
  ArrowUpRight,
} from 'lucide-react';
import { currencyService, WORLD_CURRENCIES } from '../../services/currencyService';
import { CurrencySelect } from './CurrencySelect';
import { OrganizationSettings } from '../../types';

interface CurrencyConverterModalProps {
  isOpen: boolean;
  onClose: () => void;
  org: OrganizationSettings;
}

export const CurrencyConverterModal: React.FC<CurrencyConverterModalProps> = ({
  isOpen,
  onClose,
  org,
}) => {
  const [fromCurrency, setFromCurrency] = useState<string>(org.currency || 'USD');
  const [toCurrency, setToCurrency] = useState<string>(org.currency === 'USD' ? 'EUR' : 'USD');
  const [amount, setAmount] = useState<number>(1000);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>(new Date().toLocaleTimeString());

  if (!isOpen) return null;

  const fromInfo = currencyService.getCurrency(fromCurrency);
  const toInfo = currencyService.getCurrency(toCurrency);
  const exchangeRate = currencyService.getExchangeRate(fromCurrency, toCurrency);
  const inverseRate = currencyService.getExchangeRate(toCurrency, fromCurrency);
  const converted = amount * exchangeRate;

  const handleSwap = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await currencyService.refreshLiveRates();
    setLastRefreshed(new Date().toLocaleTimeString());
    setIsRefreshing(false);
  };

  // Top benchmark currencies to compare against company operating currency
  const popularBenchmarkCodes = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'KES', 'UGX', 'TZS', 'NGN', 'ZAR', 'AED', 'SGD', 'BRL'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">World Currency Converter & FX Rates</h2>
              <p className="text-xs text-slate-400">
                Live exchange rates across 160+ world currencies
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

        <div className="p-6 space-y-6">
          {/* Main Converter Card */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-300">Amount & Currency Pair</span>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Live Sync ({lastRefreshed})</span>
              </button>
            </div>

            <div className="space-y-3">
              {/* Input Amount & From Currency */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-slate-400 mb-1">Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-mono text-slate-500">
                      {fromInfo.symbol}
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={amount}
                      onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[11px] text-slate-400 mb-1">From Currency</label>
                  <CurrencySelect
                    value={fromCurrency}
                    onChange={setFromCurrency}
                  />
                </div>
              </div>

              {/* Swap Button */}
              <div className="flex justify-center my-1">
                <button
                  type="button"
                  onClick={handleSwap}
                  className="p-1.5 rounded-full bg-slate-900 border border-slate-700 hover:border-indigo-500 text-slate-400 hover:text-indigo-400 transition-colors shadow-sm"
                  title="Swap Currencies"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                </button>
              </div>

              {/* Target Currency */}
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">To Currency</label>
                <CurrencySelect
                  value={toCurrency}
                  onChange={setToCurrency}
                />
              </div>
            </div>

            {/* Result Box */}
            <div className="p-4 bg-indigo-950/30 border border-indigo-800/50 rounded-xl space-y-1">
              <div className="text-[11px] text-slate-400">
                {amount.toLocaleString()} {fromInfo.code} =
              </div>
              <div className="text-2xl font-bold font-mono text-white">
                {toInfo.symbol} {converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-indigo-400 text-lg">{toInfo.code}</span>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                <span>1 {fromInfo.code} = {exchangeRate.toFixed(4)} {toInfo.code}</span>
                <span>·</span>
                <span>1 {toInfo.code} = {inverseRate.toFixed(4)} {fromInfo.code}</span>
              </div>
            </div>
          </div>

          {/* Quick Benchmark Rates for Company Currency */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">
                Benchmark Rates against {org.currency} ({org.name})
              </span>
              <span className="text-[11px] text-slate-500">1 {org.currency} equals</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
              {popularBenchmarkCodes
                .filter((code) => code !== org.currency)
                .slice(0, 8)
                .map((code) => {
                  const target = currencyService.getCurrency(code);
                  const rate = currencyService.getExchangeRate(org.currency, code);
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => {
                        setFromCurrency(org.currency);
                        setToCurrency(code);
                      }}
                      className="p-2.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-lg text-left transition-colors group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{target.flag}</span>
                        <span className="font-mono font-bold text-xs text-white group-hover:text-indigo-300">
                          {target.code}
                        </span>
                      </div>
                      <div className="text-xs font-mono font-bold text-indigo-400 mt-1">
                        {rate.toFixed(target.decimals > 0 ? 2 : 0)} {target.symbol}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">
                        {target.name}
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>

          <div className="pt-2 flex justify-end border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
