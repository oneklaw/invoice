import React, { useState, useMemo } from 'react';
import {
  X,
  Clock,
  TrendingUp,
  Building2,
  DollarSign,
  Search,
  CheckCircle2,
  Download,
  Copy,
  Check,
  CreditCard,
  Plus,
  ArrowUpRight,
  ExternalLink,
  ShieldCheck,
  Layers,
  PieChart,
  Calendar,
} from 'lucide-react';
import {
  OrganizationSettings,
  PurchaseOrder,
  User,
  Vendor,
  VendorPayment,
} from '../../types';

export type VendorDrilldownType = 'pending' | 'disbursed' | 'suppliers' | 'benchmarks';

interface VendorKpiDrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: VendorDrilldownType;
  purchaseOrders: PurchaseOrder[];
  payments: VendorPayment[];
  vendors: Vendor[];
  org: OrganizationSettings;
  currentUser: User;
  onOpenReconcileModal?: (po: PurchaseOrder) => void;
  onOpenAddSupplier?: () => void;
}

export const VendorKpiDrilldownModal: React.FC<VendorKpiDrilldownModalProps> = ({
  isOpen,
  onClose,
  type,
  purchaseOrders,
  payments,
  vendors,
  org,
  currentUser,
  onOpenReconcileModal,
  onOpenAddSupplier,
}) => {
  const [search, setSearch] = useState('');
  const [vendorFilter, setVendorFilter] = useState('all');
  const [copiedRefId, setCopiedRefId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyRef = (ref: string, id: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRefId(id);
    setTimeout(() => setCopiedRefId(null), 2000);
  };

  // Calculations
  const pendingOrders = purchaseOrders.filter((po) => po.status === 'issued' || po.status === 'received');
  const totalPendingAmount = pendingOrders.reduce((sum, po) => sum + po.totalAmount, 0);

  const completedPayments = payments.filter((p) => p.status === 'completed');
  const totalDisbursedYtd = completedPayments.reduce((sum, p) => sum + p.amount, 0);
  const avgDisbursement = completedPayments.length > 0 ? Math.round(totalDisbursedYtd / completedPayments.length) : 0;
  const maxDisbursement = completedPayments.length > 0 ? Math.max(...completedPayments.map((p) => p.amount)) : 0;

  // Supplier stats
  const avgPerformanceScore =
    vendors.length > 0
      ? Math.round(
          vendors.reduce((sum, v) => sum + (v.performanceScore || 90), 0) / vendors.length
        )
      : 90;

  // Vendor disbursement breakdown
  const vendorSpendMap = useMemo(() => {
    const map: Record<string, { vendorName: string; total: number; count: number }> = {};
    for (const p of completedPayments) {
      if (!map[p.vendorName]) {
        map[p.vendorName] = { vendorName: p.vendorName, total: 0, count: 0 };
      }
      map[p.vendorName].total += p.amount;
      map[p.vendorName].count += 1;
    }
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [completedPayments]);

  const topSupplierSpend = vendorSpendMap[0] || { vendorName: 'None', total: 0, count: 0 };

  const getHeaderInfo = () => {
    switch (type) {
      case 'pending':
        return {
          title: 'Pending Supplier Payouts & Reconciliation Queue',
          subtitle: 'Open purchase orders awaiting corporate treasury bank reconciliation',
          icon: Clock,
          iconColor: 'text-amber-400',
          iconBg: 'bg-amber-600/20 border-amber-500/30',
        };
      case 'disbursed':
        return {
          title: 'Total Supplier Disbursements Ledger (YTD)',
          subtitle: 'Audited record of all completed bank transfers, wires, and settled payouts',
          icon: TrendingUp,
          iconColor: 'text-emerald-400',
          iconBg: 'bg-emerald-600/20 border-emerald-500/30',
        };
      case 'suppliers':
        return {
          title: 'Active Supplier & Vendor Directory',
          subtitle: 'Approved supplier profiles, payment terms, VAT numbers, and performance ratings',
          icon: Building2,
          iconColor: 'text-indigo-400',
          iconBg: 'bg-indigo-600/20 border-indigo-500/30',
        };
      case 'benchmarks':
        return {
          title: 'Treasury Payout Benchmarks & Concentration Analysis',
          subtitle: 'Distribution curve, average disbursement benchmarks, and vendor capital allocation',
          icon: DollarSign,
          iconColor: 'text-cyan-400',
          iconBg: 'bg-cyan-600/20 border-cyan-500/30',
        };
    }
  };

  const headerInfo = getHeaderInfo();
  const IconComponent = headerInfo.icon;

  const handleExportCsv = () => {
    let headers: string[] = [];
    let rows: string[] = [];
    let filename = `Vendor_Drilldown_${type}_${new Date().toISOString().split('T')[0]}.csv`;

    if (type === 'pending') {
      headers = ['PO Number,Vendor Name,Issue Date,Payment Terms,Status,Amount,Currency'];
      rows = pendingOrders.map((po) => {
        const terms = vendors.find((v) => v.id === po.vendorId)?.paymentTerms || 'Net 30';
        return `"${po.poNumber}","${po.vendorName}","${po.issueDate}","${terms}","${po.status}","${po.totalAmount}","${po.currency}"`;
      });
    } else if (type === 'disbursed' || type === 'benchmarks') {
      headers = ['Payment Date,Vendor Name,Bank Reference,PO Reference,Amount,Currency,Status'];
      rows = completedPayments.map(
        (p) =>
          `"${p.paymentDate}","${p.vendorName}","${p.bankReference}","${p.purchaseOrderId || ''}","${p.amount}","${p.currency}","${p.status}"`
      );
    } else {
      headers = ['Name,Contact Person,Email,Phone,Payment Terms,Performance Score,Tax ID'];
      rows = vendors.map(
        (v) =>
          `"${v.name}","${v.contactPerson || ''}","${v.email || ''}","${v.phone || ''}","${v.paymentTerms || ''}","${v.performanceScore || 90}","${v.taxId || ''}"`
      );
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${headerInfo.iconBg} ${headerInfo.iconColor}`}>
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">{headerInfo.title}</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {type === 'pending'
                    ? `${pendingOrders.length} orders`
                    : type === 'disbursed'
                    ? `${completedPayments.length} transfers`
                    : type === 'suppliers'
                    ? `${vendors.length} vendors`
                    : `${completedPayments.length} samples`}
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

        {/* Dynamic Metric Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-5 py-3 bg-slate-950/60 border-b border-slate-800/80 text-xs shrink-0">
          {type === 'pending' && (
            <>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Pending Reconciliation</span>
                <div className="text-base font-bold font-mono text-amber-400">
                  {org.currency} {totalPendingAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Orders in Queue</span>
                <div className="text-base font-bold font-mono text-white">{pendingOrders.length} purchase orders</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Average Order Value</span>
                <div className="text-base font-bold font-mono text-slate-200">
                  {org.currency} {pendingOrders.length > 0 ? (totalPendingAmount / pendingOrders.length).toFixed(2) : '0.00'}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Settlement Urgency</span>
                <div className="text-base font-bold font-mono text-indigo-300">Net 30 Window</div>
              </div>
            </>
          )}

          {type === 'disbursed' && (
            <>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Disbursed (YTD)</span>
                <div className="text-base font-bold font-mono text-emerald-400">
                  {org.currency} {totalDisbursedYtd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Completed Transfers</span>
                <div className="text-base font-bold font-mono text-slate-200">{completedPayments.length} payouts</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Largest Single Transfer</span>
                <div className="text-base font-bold font-mono text-amber-300">
                  {org.currency} {maxDisbursement.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Primary Payout Method</span>
                <div className="text-base font-bold font-mono text-indigo-300">Wire / CHAPS / BACS</div>
              </div>
            </>
          )}

          {type === 'suppliers' && (
            <>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Registered Suppliers</span>
                <div className="text-base font-bold font-mono text-white">{vendors.length} vendors</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Avg Performance Score</span>
                <div className="text-base font-bold font-mono text-emerald-400">{avgPerformanceScore}% Rating</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Default Settlement Terms</span>
                <div className="text-base font-bold font-mono text-indigo-300">Net 30 Days</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Top Partner Volume</span>
                <div className="text-base font-bold font-mono text-amber-300 truncate">{topSupplierSpend.vendorName}</div>
              </div>
            </>
          )}

          {type === 'benchmarks' && (
            <>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Mean Disbursement Benchmark</span>
                <div className="text-base font-bold font-mono text-cyan-300">
                  {org.currency} {avgDisbursement.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Max Disbursement Cap</span>
                <div className="text-base font-bold font-mono text-amber-300">
                  {org.currency} {maxDisbursement.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Active Vendor Spread</span>
                <div className="text-base font-bold font-mono text-slate-200">{vendorSpendMap.length} vendors paid</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Top Vendor Share</span>
                <div className="text-base font-bold font-mono text-emerald-400">
                  {totalDisbursedYtd > 0 ? ((topSupplierSpend.total / totalDisbursedYtd) * 100).toFixed(1) : '0.0'}%
                </div>
              </div>
            </>
          )}
        </div>

        {/* If type === 'benchmarks', show tier breakdown */}
        {type === 'benchmarks' && (
          <div className="px-5 py-3 bg-slate-950/40 border-b border-slate-800 shrink-0">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <PieChart className="w-3.5 h-3.5 text-cyan-400" />
                Capital Concentration by Supplier
              </span>
              <span className="text-[11px] text-slate-500">Top 4 vendor allocations</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
              {vendorSpendMap.slice(0, 4).map((v) => {
                const percent = totalDisbursedYtd > 0 ? (v.total / totalDisbursedYtd) * 100 : 0;
                return (
                  <div key={v.vendorName} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-medium text-white truncate">{v.vendorName}</span>
                      <span className="font-mono text-cyan-300">{percent.toFixed(1)}%</span>
                    </div>
                    <div className="text-xs font-bold font-mono text-slate-200 mt-1">
                      {org.currency} {v.total.toLocaleString()}
                    </div>
                    <div className="w-full bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="bg-cyan-400 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="px-5 py-3 bg-slate-950/90 border-b border-slate-800/80 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between shrink-0">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={
                  type === 'pending'
                    ? 'Search by PO number, supplier, amount...'
                    : type === 'disbursed' || type === 'benchmarks'
                    ? 'Search by bank reference, supplier, PO...'
                    : 'Search suppliers by name, contact, email, VAT...'
                }
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

            {type !== 'suppliers' && (
              <select
                value={vendorFilter}
                onChange={(e) => setVendorFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Vendors</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.name}>
                    {v.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {type === 'suppliers' && onOpenAddSupplier && (
            <button
              onClick={() => {
                onClose();
                onOpenAddSupplier();
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 text-white" />
              <span>Add New Supplier</span>
            </button>
          )}
        </div>

        {/* Content Table by Type */}
        <div className="flex-1 overflow-y-auto">
          {/* VIEW 1: PENDING PAYMENTS */}
          {type === 'pending' && (
            <div>
              {pendingOrders.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="font-semibold text-slate-300">All purchase orders are fully reconciled</p>
                  <p className="text-slate-500 mt-1">No outstanding supplier payouts awaiting settlement.</p>
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 sticky top-0 z-10 backdrop-blur-sm">
                    <tr>
                      <th className="py-2.5 px-4">PO Number</th>
                      <th className="py-2.5 px-4">Supplier / Vendor</th>
                      <th className="py-2.5 px-4">Issue Date</th>
                      <th className="py-2.5 px-4">Payment Terms</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4 text-right">Amount</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {pendingOrders
                      .filter((po) => {
                        const q = search.toLowerCase();
                        const matchesSearch =
                          !q ||
                          po.poNumber.toLowerCase().includes(q) ||
                          po.vendorName.toLowerCase().includes(q) ||
                          po.totalAmount.toString().includes(q);
                        const matchesVendor = vendorFilter === 'all' || po.vendorName === vendorFilter;
                        return matchesSearch && matchesVendor;
                      })
                      .map((po) => (
                        <tr key={po.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-indigo-300 whitespace-nowrap">
                            {po.poNumber}
                          </td>
                          <td className="py-3 px-4 text-white font-semibold">
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              <span>{po.vendorName}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">
                            {po.issueDate}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                              {vendors.find((v) => v.id === po.vendorId)?.paymentTerms || 'Net 30'}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              <Clock className="w-3 h-3" />
                              <span>Awaiting Reconcile</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-white whitespace-nowrap">
                            {po.currency} {po.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            {onOpenReconcileModal && (
                              <button
                                onClick={() => {
                                  onClose();
                                  onOpenReconcileModal(po);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-[11px] font-semibold shadow-sm transition-colors"
                              >
                                <CreditCard className="w-3 h-3" />
                                <span>Reconcile Now</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* VIEW 2 & 4: COMPLETED PAYMENTS & BENCHMARKS */}
          {(type === 'disbursed' || type === 'benchmarks') && (
            <div>
              {completedPayments.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs">
                  <TrendingUp className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="font-semibold text-slate-300">No completed supplier disbursements recorded</p>
                  <p className="text-slate-500 mt-1">Reconcile pending purchase orders to track settlements.</p>
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 sticky top-0 z-10 backdrop-blur-sm">
                    <tr>
                      <th className="py-2.5 px-4">Payment Date</th>
                      <th className="py-2.5 px-4">Supplier / Vendor</th>
                      <th className="py-2.5 px-4">Bank Reference</th>
                      <th className="py-2.5 px-4">PO Reference</th>
                      {type === 'benchmarks' && <th className="py-2.5 px-4">Benchmark Diff</th>}
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4 text-right">Disbursed Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {completedPayments
                      .filter((p) => {
                        const q = search.toLowerCase();
                        const matchesSearch =
                          !q ||
                          p.vendorName.toLowerCase().includes(q) ||
                          p.bankReference.toLowerCase().includes(q) ||
                          (p.purchaseOrderId && p.purchaseOrderId.toLowerCase().includes(q)) ||
                          p.amount.toString().includes(q);
                        const matchesVendor = vendorFilter === 'all' || p.vendorName === vendorFilter;
                        return matchesSearch && matchesVendor;
                      })
                      .map((p) => {
                        const diffFromAvg = avgDisbursement > 0 ? ((p.amount - avgDisbursement) / avgDisbursement) * 100 : 0;
                        return (
                          <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                <span>{p.paymentDate}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-white font-semibold">
                              <div className="flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                <span>{p.vendorName}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-mono text-indigo-300 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span>{p.bankReference}</span>
                                <button
                                  onClick={() => handleCopyRef(p.bankReference, p.id)}
                                  className="text-slate-500 hover:text-white p-0.5 rounded transition-colors"
                                  title="Copy Bank Reference"
                                >
                                  {copiedRefId === p.id ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                              {p.purchaseOrderId || 'Direct Payout'}
                            </td>
                            {type === 'benchmarks' && (
                              <td className="py-3 px-4 whitespace-nowrap">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                    diffFromAvg >= 0
                                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                      : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                  }`}
                                >
                                  {diffFromAvg >= 0 ? `+${diffFromAvg.toFixed(0)}%` : `${diffFromAvg.toFixed(0)}%`} vs mean
                                </span>
                              </td>
                            )}
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Settled</span>
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-white whitespace-nowrap">
                              {p.currency} {p.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* VIEW 3: SUPPLIERS DIRECTORY */}
          {type === 'suppliers' && (
            <div>
              {vendors.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs">
                  <Building2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="font-semibold text-slate-300">No registered suppliers found</p>
                  <p className="text-slate-500 mt-1">Add suppliers or import via CSV bulk upload.</p>
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 sticky top-0 z-10 backdrop-blur-sm">
                    <tr>
                      <th className="py-2.5 px-4">Supplier Name</th>
                      <th className="py-2.5 px-4">Contact Person</th>
                      <th className="py-2.5 px-4">Email & Phone</th>
                      <th className="py-2.5 px-4">Payment Terms</th>
                      <th className="py-2.5 px-4">Tax / VAT ID</th>
                      <th className="py-2.5 px-4 text-right">Performance Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {vendors
                      .filter((v) => {
                        const q = search.toLowerCase();
                        return (
                          !q ||
                          v.name.toLowerCase().includes(q) ||
                          (v.contactPerson && v.contactPerson.toLowerCase().includes(q)) ||
                          (v.email && v.email.toLowerCase().includes(q)) ||
                          (v.taxId && v.taxId.toLowerCase().includes(q))
                        );
                      })
                      .map((v) => (
                        <tr key={v.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 font-semibold text-white">
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                              <span>{v.name}</span>
                            </div>
                            {v.address && <div className="text-[10px] text-slate-500 font-normal truncate mt-0.5">{v.address}</div>}
                          </td>
                          <td className="py-3 px-4 text-slate-300">{v.contactPerson || '—'}</td>
                          <td className="py-3 px-4 text-slate-300">
                            <div>{v.email || '—'}</div>
                            {v.phone && <div className="text-[10px] text-slate-500 font-mono mt-0.5">{v.phone}</div>}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                              {v.paymentTerms || 'Net 30'}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">{v.taxId || '—'}</td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              <ShieldCheck className="w-3 h-3" />
                              <span>{v.performanceScore || 90}%</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2 shrink-0">
          <div>
            {type === 'pending' && (
              <span>
                Total Pending Queue: <strong className="text-amber-400 font-mono">{org.currency} {totalPendingAmount.toLocaleString()}</strong>
              </span>
            )}
            {type === 'disbursed' && (
              <span>
                Total Settled Disbursed: <strong className="text-emerald-400 font-mono">{org.currency} {totalDisbursedYtd.toLocaleString()}</strong>
              </span>
            )}
            {type === 'suppliers' && (
              <span>
                Approved Suppliers in System: <strong className="text-white font-mono">{vendors.length} vendors</strong>
              </span>
            )}
            {type === 'benchmarks' && (
              <span>
                Benchmark Mean Payout: <strong className="text-cyan-300 font-mono">{org.currency} {avgDisbursement.toLocaleString()}</strong>
              </span>
            )}
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
