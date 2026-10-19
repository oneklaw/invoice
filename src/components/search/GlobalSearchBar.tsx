import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  FileText,
  Users,
  Package,
  X,
  ArrowRight,
  Zap,
  CornerDownLeft,
} from 'lucide-react';
import { Client, Invoice } from '../../types';
import {
  searchIndexEngine,
  SearchQueryResult,
  SearchResultItem,
} from '../../services/searchIndex';

interface GlobalSearchBarProps {
  invoices: Invoice[];
  clients: Client[];
  orgId: string;
  onSelectInvoice: (invoiceId: string) => void;
  onSelectClient: (clientId: string) => void;
}

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
  invoices,
  clients,
  orgId,
  onSelectInvoice,
  onSelectClient,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchQueryResult | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Re-build index whenever invoices, clients, or organization changes
  useEffect(() => {
    searchIndexEngine.buildIndex(orgId, invoices, clients);
  }, [orgId, invoices, clients]);

  // Global keyboard shortcut: Cmd+K or Ctrl+K or /
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        inputRef.current?.focus();
      } else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsOpen(true);
        inputRef.current?.focus();
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Execute indexed search whenever query changes
  useEffect(() => {
    if (!query.trim()) {
      setSearchResult(null);
      setSelectedIndex(0);
      return;
    }

    const res = searchIndexEngine.search(query);
    setSearchResult(res);
    setSelectedIndex(0);
  }, [query]);

  // Flattened list of results for keyboard arrow navigation
  const flatResults: SearchResultItem[] = searchResult
    ? [
        ...searchResult.results.invoices,
        ...searchResult.results.clients,
        ...searchResult.results.lineItems,
      ]
    : [];

  const handleSelectItem = (item: SearchResultItem) => {
    setIsOpen(false);
    setQuery('');
    if (item.type === 'invoice' || item.type === 'line_item') {
      if (item.invoiceId) {
        onSelectInvoice(item.invoiceId);
      }
    } else if (item.type === 'client') {
      if (item.clientId) {
        onSelectClient(item.clientId);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || flatResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % flatResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + flatResults.length) % flatResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatResults[selectedIndex]) {
        handleSelectItem(flatResults[selectedIndex]);
      }
    }
  };

  return (
    <div ref={containerRef} className="relative flex-1 max-w-md w-full">
      {/* Search Input Bar */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search invoices, clients, line items... (⌘K)"
          className="w-full bg-slate-950/80 hover:bg-slate-950 text-slate-100 placeholder-slate-500 text-xs rounded-lg pl-9 pr-14 py-2 border border-slate-700/80 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all shadow-inner"
        />
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />

        {query ? (
          <button
            onClick={() => {
              setQuery('');
              setSearchResult(null);
            }}
            className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <kbd className="absolute right-2.5 top-2 px-1.5 py-0.5 text-[10px] font-mono text-slate-500 bg-slate-850 rounded border border-slate-700 pointer-events-none">
            ⌘K
          </kbd>
        )}
      </div>

      {/* Indexed Results Dropdown Overlay */}
      {isOpen && query.trim().length > 0 && (
        <div className="absolute left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 text-slate-100 animate-in fade-in-50 zoom-in-95 duration-100">
          {/* Index Performance Metrics Header */}
          <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Full-Text Inverted Index</span>
            </span>
            {searchResult && (
              <span className="text-emerald-400">
                {searchResult.totalMatches} matches in {searchResult.tookMs}ms
              </span>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-3">
            {searchResult && searchResult.totalMatches === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 space-y-1">
                <p>No results found for &quot;<strong className="text-white">{query}</strong>&quot;</p>
                <p className="text-[11px] text-slate-500">
                  Try searching by invoice # (e.g. INV-2026-001), client name, or item description.
                </p>
              </div>
            ) : (
              <>
                {/* 1. Invoices Category */}
                {searchResult && searchResult.results.invoices.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-[10px] font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3 h-3" />
                      <span>Invoices ({searchResult.results.invoices.length})</span>
                    </div>
                    <div className="space-y-1 mt-1">
                      {searchResult.results.invoices.map((item) => {
                        const globalIdx = flatResults.indexOf(item);
                        const isSelected = selectedIndex === globalIdx;
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleSelectItem(item)}
                            className={`px-3 py-2 rounded-lg cursor-pointer transition-colors flex items-center justify-between gap-3 text-xs ${
                              isSelected ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-200'
                            }`}
                          >
                            <div className="truncate">
                              <div className="font-semibold text-xs flex items-center gap-2">
                                <span className={isSelected ? 'text-white' : 'text-indigo-300 font-mono'}>
                                  {item.title}
                                </span>
                              </div>
                              <div className={`text-[11px] truncate mt-0.5 ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                                {item.subtitle}
                              </div>
                            </div>
                            <div className="text-right shrink-0 flex items-center gap-2">
                              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-300'
                              }`}>
                                Invoice
                              </span>
                              <ArrowRight className="w-3 h-3 opacity-60" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. Clients Category */}
                {searchResult && searchResult.results.clients.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-[10px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3 h-3" />
                      <span>Clients ({searchResult.results.clients.length})</span>
                    </div>
                    <div className="space-y-1 mt-1">
                      {searchResult.results.clients.map((item) => {
                        const globalIdx = flatResults.indexOf(item);
                        const isSelected = selectedIndex === globalIdx;
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleSelectItem(item)}
                            className={`px-3 py-2 rounded-lg cursor-pointer transition-colors flex items-center justify-between gap-3 text-xs ${
                              isSelected ? 'bg-emerald-600 text-white' : 'hover:bg-slate-800 text-slate-200'
                            }`}
                          >
                            <div className="truncate">
                              <div className="font-semibold text-xs text-white">
                                {item.title}
                              </div>
                              <div className={`text-[11px] truncate mt-0.5 ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                                {item.subtitle} · {item.details}
                              </div>
                            </div>
                            <div className="text-right shrink-0 flex items-center gap-2">
                              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                isSelected ? 'bg-emerald-700 text-white' : 'bg-slate-800 text-slate-300'
                              }`}>
                                Client
                              </span>
                              <ArrowRight className="w-3 h-3 opacity-60" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. Line Items Category */}
                {searchResult && searchResult.results.lineItems.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-[10px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Package className="w-3 h-3" />
                      <span>Line Items Across Invoices ({searchResult.results.lineItems.length})</span>
                    </div>
                    <div className="space-y-1 mt-1">
                      {searchResult.results.lineItems.map((item) => {
                        const globalIdx = flatResults.indexOf(item);
                        const isSelected = selectedIndex === globalIdx;
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleSelectItem(item)}
                            className={`px-3 py-2 rounded-lg cursor-pointer transition-colors flex items-center justify-between gap-3 text-xs ${
                              isSelected ? 'bg-amber-600 text-white' : 'hover:bg-slate-800 text-slate-200'
                            }`}
                          >
                            <div className="truncate">
                              <div className="font-semibold text-xs text-white">
                                {item.title}
                              </div>
                              <div className={`text-[11px] truncate mt-0.5 ${isSelected ? 'text-amber-100' : 'text-slate-400 font-mono'}`}>
                                {item.subtitle}
                              </div>
                            </div>
                            <div className="text-right shrink-0 flex items-center gap-2">
                              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                isSelected ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-300'
                              }`}>
                                Line Item
                              </span>
                              <ArrowRight className="w-3 h-3 opacity-60" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Keyboard navigation helper footer */}
          <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span className="flex items-center gap-2">
              <span>↑↓ Navigate</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <CornerDownLeft className="w-2.5 h-2.5" />
                Select
              </span>
              <span>·</span>
              <span>ESC Close</span>
            </span>
            <span>Indexed across {searchIndexEngine.getIndexedCount()} records</span>
          </div>
        </div>
      )}
    </div>
  );
};
