import React, { useState, useMemo } from 'react';
import {
  X,
  Printer,
  Download,
  Building2,
  Package,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  Calendar,
  Layers,
  MapPin,
  FileSpreadsheet,
  FileText,
  Loader2,
  Filter,
} from 'lucide-react';
import { InventoryItem, OrganizationSettings, User } from '../../types';
import { currencyService } from '../../services/currencyService';
import { pdfExportService } from '../../services/pdfExportService';

interface InventorySummaryReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  org: OrganizationSettings;
  items: InventoryItem[];
  currentUser: User;
}

export const InventorySummaryReportModal: React.FC<InventorySummaryReportModalProps> = ({
  isOpen,
  onClose,
  org,
  items,
  currentUser,
}) => {
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  if (!isOpen) return null;

  const generatedDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const generatedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Unique lists for filtering
  const allDepartments = Array.from(new Set(items.map((i) => i.department).filter(Boolean)));
  const allBranches = Array.from(new Set(items.map((i) => i.branch).filter(Boolean)));

  // Filtered Items
  const activeItems = useMemo(() => {
    return items.filter((item) => {
      const matchesDept = deptFilter === 'all' || item.department === deptFilter;
      const matchesBranch = branchFilter === 'all' || item.branch === branchFilter;
      return matchesDept && matchesBranch;
    });
  }, [items, deptFilter, branchFilter]);

  // High-level Calculations
  const totalSkus = activeItems.length;
  const totalUnits = activeItems.reduce((sum, i) => sum + i.currentStock, 0);
  const totalCostValuation = activeItems.reduce((sum, i) => sum + i.unitCost * i.currentStock, 0);
  const totalRetailValuation = activeItems.reduce((sum, i) => sum + i.sellingPrice * i.currentStock, 0);
  const potentialProfit = totalRetailValuation - totalCostValuation;
  const potentialMargin = totalRetailValuation > 0 ? (potentialProfit / totalRetailValuation) * 100 : 0;
  const lowStockItems = activeItems.filter((i) => i.currentStock <= i.lowStockThreshold);

  // Groupings
  const categoryGroups: Record<string, { count: number; units: number; costValuation: number; retailValuation: number }> = {};
  const departmentGroups: Record<string, { count: number; units: number; costValuation: number; retailValuation: number }> = {};
  const branchGroups: Record<string, { count: number; units: number; costValuation: number; retailValuation: number }> = {};

  activeItems.forEach((item) => {
    const cat = item.category || 'General';
    const dept = item.department || 'Operations';
    const br = item.branch || 'Main HQ';

    const cost = item.unitCost * item.currentStock;
    const retail = item.sellingPrice * item.currentStock;

    if (!categoryGroups[cat]) categoryGroups[cat] = { count: 0, units: 0, costValuation: 0, retailValuation: 0 };
    categoryGroups[cat].count += 1;
    categoryGroups[cat].units += item.currentStock;
    categoryGroups[cat].costValuation += cost;
    categoryGroups[cat].retailValuation += retail;

    if (!departmentGroups[dept]) departmentGroups[dept] = { count: 0, units: 0, costValuation: 0, retailValuation: 0 };
    departmentGroups[dept].count += 1;
    departmentGroups[dept].units += item.currentStock;
    departmentGroups[dept].costValuation += cost;
    departmentGroups[dept].retailValuation += retail;

    if (!branchGroups[br]) branchGroups[br] = { count: 0, units: 0, costValuation: 0, retailValuation: 0 };
    branchGroups[br].count += 1;
    branchGroups[br].units += item.currentStock;
    branchGroups[br].costValuation += cost;
    branchGroups[br].retailValuation += retail;
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    try {
      await pdfExportService.generateInventorySummaryReportPdf(org, activeItems, currentUser, {
        department: deptFilter,
        branch: branchFilter,
      });
    } catch (err) {
      console.error('Error generating inventory summary report PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadCsv = () => {
    const headers = [
      'SKU',
      'Item Name',
      'Category',
      'Department',
      'Branch',
      'Added By',
      'Current Stock',
      'Unit',
      'Unit Cost',
      'Selling Price',
      'Total Cost Valuation',
      'Total Retail Valuation',
      'Low Stock Threshold',
      'Status',
    ];

    const rows = activeItems.map((i) => {
      const isLow = i.currentStock <= i.lowStockThreshold;
      return [
        `"${i.sku}"`,
        `"${i.name.replace(/"/g, '""')}"`,
        `"${i.category}"`,
        `"${i.department}"`,
        `"${i.branch}"`,
        `"${i.addedBy || 'N/A'}"`,
        i.currentStock,
        `"${i.unit}"`,
        i.unitCost.toFixed(2),
        i.sellingPrice.toFixed(2),
        (i.unitCost * i.currentStock).toFixed(2),
        (i.sellingPrice * i.currentStock).toFixed(2),
        i.lowStockThreshold,
        isLow ? 'LOW STOCK' : 'HEALTHY',
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Inventory_Summary_Report_${org.slug || 'kero'}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm 10mm 12mm;
          }
          body, html {
            background: #ffffff !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .inventory-report-window {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            max-width: 100% !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
          }
          .inventory-report-sheet {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            background: #ffffff !important;
            color: #0f172a !important;
          }
        }
      `}</style>

      <div className="inventory-report-window w-full max-w-5xl h-[100dvh] sm:h-auto sm:max-h-[92vh] flex flex-col bg-slate-900 border-0 sm:border sm:border-slate-800 rounded-none sm:rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        {/* Top Toolbar (No-Print) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between px-5 py-3.5 bg-slate-950 border-b border-slate-800 shrink-0 gap-3 no-print">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>Consolidated Inventory Summary Report</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  {totalSkus} SKUs
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Tenant: <span className="text-slate-200 font-semibold">{org.name}</span> · Compiled by {currentUser.name}
              </div>
            </div>
          </div>

          {/* Department & Branch Filters in Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-1 text-xs">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-none text-xs cursor-pointer"
                aria-label="Filter by department"
              >
                <option value="all" className="bg-slate-900 text-white">All Departments</option>
                {allDepartments.map((dept) => (
                  <option key={dept} value={dept} className="bg-slate-900 text-white">{dept}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-1 text-xs">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-none text-xs cursor-pointer"
                aria-label="Filter by branch"
              >
                <option value="all" className="bg-slate-900 text-white">All Branches</option>
                {allBranches.map((branch) => (
                  <option key={branch} value={branch} className="bg-slate-900 text-white">{branch}</option>
                ))}
              </select>
            </div>

            {/* Download PDF Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
              title="Download formal consolidated inventory summary report as a PDF document"
            >
              {isExportingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileText className="w-3.5 h-3.5" />
              )}
              <span>{isExportingPdf ? 'Exporting PDF...' : 'Download PDF'}</span>
            </button>

            {/* Print / Save PDF Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
              title="Print formal executive report or save as PDF via system dialog"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>

            {/* Export CSV Button */}
            <button
              onClick={handleDownloadCsv}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors cursor-pointer"
              title="Download detailed CSV spreadsheet"
            >
              <Download className="w-3.5 h-3.5 text-slate-300" />
              <span className="hidden sm:inline">CSV</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Report Sheet */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950/60 font-sans">
          <div className="inventory-report-sheet max-w-4xl mx-auto bg-white text-slate-900 rounded-2xl p-6 sm:p-10 shadow-xl border border-slate-200 space-y-8">
            {/* Report Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-6 border-b-2 border-slate-900">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 bg-white rounded-lg p-0.5 border border-slate-300 shadow-xs flex items-center justify-center shrink-0">
                    <img src="/kero-logo.png" alt="KERO" className="h-full w-full object-contain" />
                  </div>
                  <div>
                    <span className="text-base font-extrabold tracking-tight text-slate-900 leading-tight">
                      KERO INVOICE SaaS
                    </span>
                    <div className="text-[10px] font-mono tracking-wider text-slate-500 uppercase">
                      Enterprise Asset & Inventory Ledger
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-600 space-y-0.5 pt-1">
                  <div className="font-bold text-slate-900">{org.legalName || org.name}</div>
                  <div>{org.address.line1}, {org.address.city} · {org.address.country}</div>
                  <div>Tax Identifier: <span className="font-mono text-slate-900">{org.taxId}</span></div>
                </div>
              </div>

              <div className="sm:text-right space-y-1 text-xs">
                <span className="inline-block px-2.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded font-bold uppercase text-[10px] tracking-wider">
                  Official Summary Report
                </span>
                <div className="text-sm font-black text-slate-900 mt-1 uppercase">
                  Consolidated Inventory Report
                </div>
                <div className="text-slate-600">
                  Date: <strong className="text-slate-900 font-mono">{generatedDate} {generatedTime}</strong>
                </div>
                <div className="text-slate-600">
                  Operating Currency: <strong className="text-slate-900 font-mono">{org.currency}</strong>
                </div>
                <div className="text-slate-600">
                  Compiled By: <strong className="text-slate-900">{currentUser.name}</strong> ({currentUser.role})
                </div>
                {(deptFilter !== 'all' || branchFilter !== 'all') && (
                  <div className="text-[10px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 inline-block mt-1">
                    Filters: {deptFilter !== 'all' ? `Dept: ${deptFilter}` : ''} {branchFilter !== 'all' ? `Branch: ${branchFilter}` : ''}
                  </div>
                )}
              </div>
            </div>

            {/* Executive KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total SKUs</span>
                <div className="text-xl font-black font-mono text-slate-900">{totalSkus}</div>
                <span className="text-[10px] text-slate-500">{totalUnits.toLocaleString()} physical units</span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Cost Valuation</span>
                <div className="text-xl font-black font-mono text-indigo-700">
                  {org.currency} {totalCostValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <span className="text-[10px] text-slate-500">Asset acquisition cost</span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Retail Value</span>
                <div className="text-xl font-black font-mono text-emerald-700">
                  {org.currency} {totalRetailValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <span className="text-[10px] text-slate-500">Margin: {potentialMargin.toFixed(1)}%</span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Low Stock Alerts</span>
                <div className={`text-xl font-black font-mono ${lowStockItems.length > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {lowStockItems.length}
                </div>
                <span className="text-[10px] text-slate-500">Items below threshold</span>
              </div>
            </div>

            {/* Department Breakdown Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Consolidated Inventory Levels by Department</span>
                </h3>
                <span className="text-[11px] text-slate-500 font-mono">{Object.keys(departmentGroups).length} Departments</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <th className="py-2 px-3">Department</th>
                      <th className="py-2 px-3 text-right">Unique Items</th>
                      <th className="py-2 px-3 text-right">Total Units</th>
                      <th className="py-2 px-3 text-right">Cost Valuation ({org.currency})</th>
                      <th className="py-2 px-3 text-right">Retail Value ({org.currency})</th>
                      <th className="py-2 px-3 text-right">Share (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Object.entries(departmentGroups).map(([dept, data]) => {
                      const share = totalCostValuation > 0 ? (data.costValuation / totalCostValuation) * 100 : 0;
                      return (
                        <tr key={dept} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-semibold text-slate-800">{dept}</td>
                          <td className="py-2 px-3 text-right font-mono">{data.count}</td>
                          <td className="py-2 px-3 text-right font-mono">{data.units.toLocaleString()}</td>
                          <td className="py-2 px-3 text-right font-mono font-medium text-slate-900">
                            {data.costValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-emerald-700">
                            {data.retailValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-slate-600">{share.toFixed(1)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Branch Locations Breakdown Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Consolidated Inventory Levels by Branch Location</span>
                </h3>
                <span className="text-[11px] text-slate-500 font-mono">{Object.keys(branchGroups).length} Branches</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <th className="py-2 px-3">Branch Location</th>
                      <th className="py-2 px-3 text-right">Unique Items</th>
                      <th className="py-2 px-3 text-right">Physical Units</th>
                      <th className="py-2 px-3 text-right">Cost Valuation ({org.currency})</th>
                      <th className="py-2 px-3 text-right">Retail Value ({org.currency})</th>
                      <th className="py-2 px-3 text-right">Share (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Object.entries(branchGroups).map(([br, data]) => {
                      const share = totalCostValuation > 0 ? (data.costValuation / totalCostValuation) * 100 : 0;
                      return (
                        <tr key={br} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-semibold text-slate-800">{br}</td>
                          <td className="py-2 px-3 text-right font-mono">{data.count}</td>
                          <td className="py-2 px-3 text-right font-mono">{data.units.toLocaleString()}</td>
                          <td className="py-2 px-3 text-right font-mono font-medium text-slate-900">
                            {data.costValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-emerald-700">
                            {data.retailValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-slate-600">{share.toFixed(1)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Category Breakdown Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Category Summary & Valuations</span>
                </h3>
                <span className="text-[11px] text-slate-500 font-mono">{Object.keys(categoryGroups).length} Categories</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <th className="py-2 px-3">Category</th>
                      <th className="py-2 px-3 text-right">SKU Count</th>
                      <th className="py-2 px-3 text-right">Units</th>
                      <th className="py-2 px-3 text-right">Cost Valuation ({org.currency})</th>
                      <th className="py-2 px-3 text-right">Retail Value ({org.currency})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Object.entries(categoryGroups).map(([cat, data]) => (
                      <tr key={cat} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-semibold text-slate-800">{cat}</td>
                        <td className="py-2 px-3 text-right font-mono">{data.count}</td>
                        <td className="py-2 px-3 text-right font-mono">{data.units.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right font-mono font-medium text-slate-900">
                          {data.costValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-emerald-700">
                          {data.retailValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Critical Low Stock Register */}
            {lowStockItems.length > 0 && (
              <div className="space-y-3 p-4 bg-rose-50/70 border border-rose-200 rounded-xl">
                <div className="flex items-center justify-between pb-1 border-b border-rose-200">
                  <h3 className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Replenishment Register: Low Stock Threshold Warnings</span>
                  </h3>
                  <span className="text-[11px] font-bold text-rose-700 font-mono">
                    {lowStockItems.length} Urgent Item{lowStockItems.length === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="text-rose-900 font-semibold border-b border-rose-200/80">
                        <th className="py-1.5 px-2">SKU</th>
                        <th className="py-1.5 px-2">Item Name</th>
                        <th className="py-1.5 px-2">Department</th>
                        <th className="py-1.5 px-2">Branch</th>
                        <th className="py-1.5 px-2 text-right">In Stock</th>
                        <th className="py-1.5 px-2 text-right">Min Threshold</th>
                        <th className="py-1.5 px-2 text-right">Reorder Qty</th>
                        <th className="py-1.5 px-2 text-right">Est. Restock Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rose-200/50">
                      {lowStockItems.map((item) => (
                        <tr key={item.id}>
                          <td className="py-1.5 px-2 font-mono font-bold text-rose-950">{item.sku}</td>
                          <td className="py-1.5 px-2 font-medium text-slate-800">{item.name}</td>
                          <td className="py-1.5 px-2 text-slate-600">{item.department}</td>
                          <td className="py-1.5 px-2 text-slate-600">{item.branch}</td>
                          <td className="py-1.5 px-2 text-right font-mono font-bold text-rose-700">{item.currentStock} {item.unit}</td>
                          <td className="py-1.5 px-2 text-right font-mono text-slate-600">{item.lowStockThreshold}</td>
                          <td className="py-1.5 px-2 text-right font-mono font-bold text-indigo-700">{item.reorderQuantity || 10}</td>
                          <td className="py-1.5 px-2 text-right font-mono font-semibold text-slate-900">
                            {org.currency} {((item.reorderQuantity || 10) * item.unitCost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Complete Itemized Inventory Register Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Itemized Inventory Register</span>
                </h3>
                <span className="text-[11px] text-slate-500 font-mono">{activeItems.length} Total Records</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-[11px] text-left">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <th className="py-2 px-2.5">SKU</th>
                      <th className="py-2 px-2.5">Item Name</th>
                      <th className="py-2 px-2.5">Category</th>
                      <th className="py-2 px-2.5">Department</th>
                      <th className="py-2 px-2.5">Branch</th>
                      <th className="py-2 px-2.5">Added By</th>
                      <th className="py-2 px-2.5 text-right">Stock</th>
                      <th className="py-2 px-2.5 text-right">Unit Cost</th>
                      <th className="py-2 px-2.5 text-right">Selling Price</th>
                      <th className="py-2 px-2.5 text-right">Total Cost ({org.currency})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="py-1.5 px-2.5 font-mono font-bold text-slate-900">{item.sku}</td>
                        <td className="py-1.5 px-2.5 font-medium text-slate-800">{item.name}</td>
                        <td className="py-1.5 px-2.5 text-slate-600">{item.category}</td>
                        <td className="py-1.5 px-2.5 text-slate-600">{item.department}</td>
                        <td className="py-1.5 px-2.5 text-slate-600">{item.branch}</td>
                        <td className="py-1.5 px-2.5 text-slate-500 font-mono text-[10px]">{item.addedBy || 'N/A'}</td>
                        <td className="py-1.5 px-2.5 text-right font-mono font-bold text-slate-900">
                          {item.currentStock} {item.unit}
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-mono text-slate-600">
                          {item.unitCost.toFixed(2)}
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-mono text-emerald-700 font-medium">
                          {item.sellingPrice.toFixed(2)}
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-mono font-bold text-slate-900">
                          {(item.unitCost * item.currentStock).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Corporate Sign-Off Block */}
            <div className="pt-6 border-t-2 border-slate-900 grid grid-cols-2 sm:grid-cols-3 gap-6 text-[10px] text-slate-600">
              <div>
                <span className="font-bold text-slate-800 uppercase tracking-wider block">Audited & Verified</span>
                <div className="mt-8 border-b border-slate-300 w-36" />
                <span className="text-slate-500 mt-1 block">Head of Operations / Comptroller</span>
              </div>

              <div>
                <span className="font-bold text-slate-800 uppercase tracking-wider block">Executive Sign-Off</span>
                <div className="mt-8 border-b border-slate-300 w-36" />
                <span className="text-slate-500 mt-1 block">{currentUser.name} ({currentUser.role})</span>
              </div>

              <div className="col-span-2 sm:col-span-1 text-right sm:text-right">
                <span className="font-bold text-slate-800 uppercase tracking-wider block">System Timestamp</span>
                <div className="font-mono text-slate-500 mt-2">{generatedDate} {generatedTime} UTC</div>
                <div className="font-mono text-[9px] text-slate-400 mt-0.5">Ledger Ref: KERO-INV-SUM-{Date.now().toString(36).toUpperCase()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
