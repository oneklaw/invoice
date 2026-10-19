import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, Globe } from 'lucide-react';
import { currencyService, WorldCurrency, WORLD_CURRENCIES } from '../../services/currencyService';

interface CurrencySelectProps {
  value: string;
  onChange: (currencyCode: string) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
  placeholder?: string;
}

const POPULAR_CODES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'KES', 'UGX', 'TZS', 'NGN', 'ZAR', 'BRL', 'AED', 'SGD'];

export const CurrencySelect: React.FC<CurrencySelectProps> = ({
  value,
  onChange,
  disabled = false,
  className = '',
  label,
  placeholder = 'Select currency...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedCurrency = currencyService.getCurrency(value || 'USD');

  const filteredCurrencies = currencyService.searchCurrencies(searchQuery);

  const popularCurrencies = WORLD_CURRENCIES.filter((c) =>
    POPULAR_CODES.includes(c.code) &&
    (searchQuery === '' ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.country.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (code: string) => {
    onChange(code);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-[11px] text-slate-400 mb-1 font-medium">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-950 border border-slate-700 hover:border-slate-600 disabled:opacity-50 text-white rounded-lg px-3 py-2 text-xs flex items-center justify-between gap-2 transition-colors text-left focus:outline-none focus:border-indigo-500 shadow-sm"
      >
        <div className="flex items-center gap-2 truncate">
          <span className="text-base shrink-0">{selectedCurrency.flag}</span>
          <span className="font-mono font-bold text-white shrink-0">{selectedCurrency.code}</span>
          <span className="text-slate-400 font-mono text-[11px] shrink-0">({selectedCurrency.symbol})</span>
          <span className="text-slate-400 truncate text-[11px] hidden sm:inline">
            · {selectedCurrency.name}
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform shrink-0 ${isOpen ? 'rotate-180 text-indigo-400' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-1 left-0 right-0 min-w-[280px] sm:min-w-[340px] max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Search Box */}
          <div className="p-2.5 border-b border-slate-800 bg-slate-950/60 sticky top-0 z-10">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by code, country, or currency..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 px-0.5">
              <span>{filteredCurrencies.length} currencies available</span>
              <span className="text-indigo-400 font-mono">160+ World ISO 4217</span>
            </div>
          </div>

          {/* List Options */}
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/50 p-1">
            {/* If not searching, show Popular section */}
            {!searchQuery && popularCurrencies.length > 0 && (
              <div className="pb-1 mb-1">
                <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  Popular Currencies
                </div>
                {popularCurrencies.map((c) => {
                  const isSelected = c.code === value;
                  return (
                    <button
                      key={`pop_${c.code}`}
                      type="button"
                      onClick={() => handleSelect(c.code)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left group ${
                        isSelected
                          ? 'bg-indigo-600/20 text-indigo-300 font-semibold'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-base">{c.flag}</span>
                        <span className="font-mono font-bold text-white group-hover:text-indigo-300">{c.code}</span>
                        <span className="text-slate-400 font-mono text-[11px]">({c.symbol})</span>
                        <span className="text-slate-400 text-[11px] truncate">· {c.name}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                    </button>
                  );
                })}
                <div className="px-2.5 pt-2 pb-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  All World Currencies (A-Z)
                </div>
              </div>
            )}

            {filteredCurrencies.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                No currencies matching &quot;{searchQuery}&quot;
              </div>
            ) : (
              filteredCurrencies.map((c) => {
                const isSelected = c.code === value;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleSelect(c.code)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left group ${
                      isSelected
                        ? 'bg-indigo-600/20 text-indigo-300 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-base">{c.flag}</span>
                      <span className="font-mono font-bold text-white group-hover:text-indigo-300">{c.code}</span>
                      <span className="text-slate-400 font-mono text-[11px]">({c.symbol})</span>
                      <span className="text-slate-400 text-[11px] truncate">· {c.name}</span>
                      <span className="text-slate-500 text-[10px] truncate hidden md:inline">({c.country})</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
