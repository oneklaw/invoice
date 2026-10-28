import React, { useState, useMemo } from 'react';
import {
  X,
  DollarSign,
  Repeat,
  Tag,
  Mic,
  Search,
  Calendar,
  Building2,
  Trash2,
  Download,
  CheckCircle2,
  PieChart,
  ArrowUpRight,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { Expense, OrganizationSettings, User } from '../../types';

export type ExpenseDrilldownType = 'total' | 'recurring' | 'category' | 'dictation';

interface ExpenseKpiDrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: ExpenseDrilldownType;
  expenses: Expense[];
  org: OrganizationSettings;
  currentUser: User;
  onDeleteExpense?: (id: string) => void;
  onOpenAddModal?: () => void;
}

export const ExpenseKpiDrilldownModal: React.FC<ExpenseKpiDrilldownModalProps> = ({
  isOpen,
  onClose,
  type,
  expenses,
  org,
  currentUser,
  onDeleteExpense,
  onOpenAddModal,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSort, setSelectedSort] = useState<'amount-desc' | 'amount-asc' | 'date-desc' | 'date-asc'>('date-desc');

  if (!isOpen) return null;

  // Global aggregate metrics
  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const avgExpense = expenses.length > 0 ? totalAmount / expenses.length : 0;
  const maxExpense = expenses.length > 0 ? Math.max(...expenses.map((e) => e.amount)) : 0;

  const recurringExpenses = expenses.filter((e) => e.isRecurring);
  const recurringMonthlyTotal = recurringExpenses.reduce((sum, e) => sum + e.amount, 0);
  const recurringAnnualRunRate = recurringMonthlyTotal * 12;

  // Voice/dictated expenses (notes contain "Speech" or "Dictated")
  const speechExpenses = expenses.filter(
    (e) => (e.notes && (e.notes.toLowerCase().includes('speech') || e.notes.toLowerCase().includes('dictat')))
  );

  // Category breakdown calculation
  const categoryStats = useMemo(() => {
    const map: Record<string, { category: string; total: number; count: number }> = {};
    for (const e of expenses) {
      if (!map[e.category]) {
        map[e.category] = { category: e.category, total: 0, count: 0 };
      }
      map[e.category].total += e.amount;
      map[e.category].count += 1;
    }
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [expenses]);

  const topCategory = categoryStats[0] || { category: 'None', total: 0, count: 0 };

  // Filtered expenses based on drilldown type + search + category filter
  const filteredExpenses = useMemo(() => {
    let list = expenses;

    if (type === 'recurring') {
      list = recurringExpenses;
    } else if (type === 'dictation') {
      // If none explicitly matched notes, show all with voice flag or all recent
      list = speechExpenses.length > 0 ? speechExpenses : expenses;
    }

    return list
      .filter((e) => {
        const matchesCategory = selectedCategory === 'all' || e.category === selectedCategory;
        const q = search.toLowerCase();
        const matchesSearch =
          !q ||
          e.title.toLowerCase().includes(q) ||
          (e.vendorName && e.vendorName.toLowerCase().includes(q)) ||
          e.category.toLowerCase().includes(q) ||
          e.amount.toString().includes(q) ||
          (e.notes && e.notes.toLowerCase().includes(q));

        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (selectedSort === 'amount-desc') return b.amount - a.amount;
        if (selectedSort === 'amount-asc') return a.amount - b.amount;
        if (selectedSort === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
  }, [expenses, type, recurringExpenses, speechExpenses, selectedCategory, search, selectedSort]);

  // Header metadata
  const getHeaderInfo = () => {
    switch (type) {
      case 'total':
        return {
          title: 'Total Expenses & Disbursements Ledger',
          subtitle: 'Complete itemized record of all operational disbursements and expenditures',
          icon: DollarSign,
          iconColor: 'text-emerald-400',
          iconBg: 'bg-emerald-600/20 border-emerald-500/30',
        };
      case 'recurring':
        return {
          title: 'Recurring Subscriptions & Commitments',
          subtitle: 'Monthly automated software licenses, infrastructure, facilities, and retainer obligations',
          icon: Repeat,
          iconColor: 'text-indigo-400',
          iconBg: 'bg-indigo-600/20 border-indigo-500/30',
        };
      case 'category':
        return {
          title: 'Category Cost Allocations & Budget Breakdown',
          subtitle: 'Comprehensive distribution of expenditure across departments and operational categories',
          icon: Tag,
          iconColor: 'text-amber-400',
          iconBg: 'bg-amber-600/20 border-amber-500/30',
        };
      case 'dictation':
        return {
          title: 'Acoustic Voice Dictation & Smart Entry Log',
          subtitle: 'Audited log of speech-recognized and smart-parsed operational expenditures',
          icon: Mic,
          iconColor: 'text-rose-400',
          iconBg: 'bg-rose-600/20 border-rose-500/30',
        };
    }
  };

  const headerInfo = getHeaderInfo();
  const IconComponent = headerInfo.icon;

  const handleExportCsv = () => {
    const headers = ['Date,Title,Category,Amount,Currency,Vendor,Recurring,Notes'];
    const rows = filteredExpenses.map(
      (e) =>
        `"${e.date}","${e.title}","${e.category}","${e.amount}","${e.currency}","${e.vendorName || ''}","${e.isRecurring ? 'Yes' : 'No'}","${e.notes || ''}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Expense_Drilldown_${type}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100 animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${headerInfo.iconBg} ${headerInfo.iconColor}`}>
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">{headerInfo.title}</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {filteredExpenses.length} records
                </span>
              </div>
              <p className="text-xs text-slate-400">{headerInfo.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors"
              title="Export filtered records to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="Close popup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dynamic Contextual KPI Metric Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-5 py-3 bg-slate-950/60 border-b border-slate-800/80 text-xs shrink-0">
          {type === 'total' && (
            <>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Capital Outlay</span>
                <div className="text-base font-bold font-mono text-emerald-400">
                  {org.currency} {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Average Per Expense</span>
                <div className="text-base font-bold font-mono text-slate-200">
                  {org.currency} {avgExpense.toFixed(2)}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Largest Single Outlay</span>
                <div className="text-base font-bold font-mono text-amber-300">
                  {org.currency} {maxExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Recorded Transactions</span>
                <div className="text-base font-bold font-mono text-indigo-300">{expenses.length} entries</div>
              </div>
            </>
          )}

          {type === 'recurring' && (
            <>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Monthly Commitment</span>
                <div className="text-base font-bold font-mono text-indigo-300">
                  {org.currency} {recurringMonthlyTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Annual Run Rate</span>
                <div className="text-base font-bold font-mono text-emerald-400">
                  {org.currency} {recurringAnnualRunRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Active Subscriptions</span>
                <div className="text-base font-bold font-mono text-white">{recurringExpenses.length} services</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">% of Operating Budget</span>
                <div className="text-base font-bold font-mono text-amber-300">
                  {totalAmount > 0 ? ((recurringMonthlyTotal / totalAmount) * 100).toFixed(1) : '0.0'}%
                </div>
              </div>
            </>
          )}

          {type === 'category' && (
            <>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Top Cost Center</span>
                <div className="text-base font-bold font-mono text-amber-300 truncate">{topCategory.category}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Top Center Spend</span>
                <div className="text-base font-bold font-mono text-white">
                  {org.currency} {topCategory.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Active Categories</span>
                <div className="text-base font-bold font-mono text-indigo-300">{categoryStats.length} categories</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Tracked Spend</span>
                <div className="text-base font-bold font-mono text-emerald-400">
                  {org.currency} {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </>
          )}

          {type === 'dictation' && (
            <>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Voice Dictation Engine</span>
                <div className="text-base font-bold font-mono text-rose-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                  Active / Speech API
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Speech-Logged Entries</span>
                <div className="text-base font-bold font-mono text-white">
                  {speechExpenses.length > 0 ? `${speechExpenses.length} dictated` : `${expenses.length} tracked`}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Acoustic Parser Status</span>
                <div className="text-base font-bold font-mono text-emerald-300">Ready (Browser Native)</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Voice Shortcuts</span>
                <div className="text-base font-bold font-mono text-slate-300">Amounts + Categories</div>
              </div>
            </>
          )}
        </div>

        {/* If type is 'category', show visual breakdown bars */}
        {type === 'category' && (
          <div className="px-5 py-3 bg-slate-950/40 border-b border-slate-800 shrink-0">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <PieChart className="w-3.5 h-3.5 text-amber-400" />
                Category Distribution Matrix
              </span>
              <span className="text-[11px] text-slate-500">Sorted by capital share</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
              {categoryStats.map((cat) => {
                const percent = totalAmount > 0 ? (cat.total / totalAmount) * 100 : 0;
                return (
                  <button
                    key={cat.category}
                    onClick={() => setSelectedCategory(selectedCategory === cat.category ? 'all' : cat.category)}
                    className={`text-left p-2 rounded-lg border transition-all ${
                      selectedCategory === cat.category
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-medium truncate">{cat.category}</span>
                      <span className="font-mono text-slate-400">{percent.toFixed(1)}%</span>
                    </div>
                    <div className="text-xs font-bold font-mono text-white mt-1">
                      {org.currency} {cat.total.toLocaleString()}
                    </div>
                    <div className="w-full bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="bg-amber-400 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      ></div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="px-5 py-3 bg-slate-950/90 border-b border-slate-800/80 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between shrink-0">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by title, vendor, notes, amount..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Categories</option>
              {categoryStats.map((c) => (
                <option key={c.category} value={c.category}>
                  {c.category} ({c.count})
                </option>
              ))}
            </select>

            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value as any)}
              className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Amount: High to Low</option>
              <option value="amount-asc">Amount: Low to High</option>
            </select>
          </div>

          {onOpenAddModal && (
            <button
              onClick={() => {
                onClose();
                onOpenAddModal();
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors whitespace-nowrap"
            >
              <Mic className="w-3.5 h-3.5 text-indigo-200" />
              <span>Record Expense</span>
            </button>
          )}
        </div>

        {/* Itemized Table */}
        <div className="flex-1 overflow-y-auto">
          {filteredExpenses.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              <Tag className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="font-semibold text-slate-300">No matching expense disbursements found</p>
              <p className="text-slate-500 mt-1">Try adjusting your search query or category filters.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 sticky top-0 z-10 backdrop-blur-sm">
                <tr>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Expense Title & Description</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Vendor / Payee</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredExpenses.map((e) => {
                  const shareOfTotal = totalAmount > 0 ? (e.amount / totalAmount) * 100 : 0;
                  const isDictated =
                    e.notes &&
                    (e.notes.toLowerCase().includes('speech') || e.notes.toLowerCase().includes('dictat'));

                  return (
                    <tr key={e.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>{e.date}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          <span>{e.title}</span>
                          {isDictated && (
                            <span className="p-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30" title="Dictated via Voice Speech API">
                              <Mic className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                        {e.notes && (
                          <div className="text-[11px] text-slate-400 truncate mt-0.5 font-normal">
                            {e.notes}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                          {e.category}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                        {e.vendorName ? (
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-500" />
                            <span>{e.vendorName}</span>
                          </div>
                        ) : (
                          <span className="text-slate-600 italic">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {e.isRecurring ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                            <Repeat className="w-3 h-3" />
                            <span>Recurring Monthly</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500">One-Off</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="font-mono font-bold text-white text-sm">
                          {e.currency} {e.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {shareOfTotal.toFixed(1)}% of total
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {onDeleteExpense && (
                          <button
                            onClick={() => onDeleteExpense(e.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
                            title="Delete this expense"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span>Showing {filteredExpenses.length} of {expenses.length} disbursements</span>
            <span className="text-slate-600">•</span>
            <span className="font-mono text-slate-300">
              Filtered Total: {org.currency} {filteredExpenses.reduce((s, e) => s + e.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
