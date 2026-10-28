import React, { useState } from 'react';
import {
  X,
  DollarSign,
  TrendingUp,
  Package,
  AlertTriangle,
  Search,
  Building2,
  MapPin,
  User as UserIcon,
  ArrowUpDown,
  Edit2,
  CheckCircle2,
  Layers,
  ArrowUpRight,
  Plus,
} from 'lucide-react';
import { InventoryItem, OrganizationSettings, User } from '../../types';

export type InventoryDrilldownType = 'cost' | 'retail' | 'catalog' | 'low_stock';

interface InventoryKpiDrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: InventoryDrilldownType;
  items: InventoryItem[];
  org: OrganizationSettings;
  currentUser: User;
  onEditItem: (item: InventoryItem) => void;
  onAdjustStock: (item: InventoryItem, defaultType?: 'in' | 'out') => void;
}

export const InventoryKpiDrilldownModal: React.FC<InventoryKpiDrilldownModalProps> = ({
  isOpen,
  onClose,
  type,
  items,
  org,
  currentUser,
  onEditItem,
  onAdjustStock,
}) => {
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [filterBranch, setFilterBranch] = useState('all');

  if (!isOpen) return null;

  // Global calculations
  const totalSkus = items.length;
  const totalUnits = items.reduce((sum, i) => sum + i.currentStock, 0);
  const totalCostValuation = items.reduce((sum, i) => sum + i.unitCost * i.currentStock, 0);
  const totalRetailValuation = items.reduce((sum, i) => sum + i.sellingPrice * i.currentStock, 0);
  const potentialProfit = totalRetailValuation - totalCostValuation;
  const potentialMargin = totalRetailValuation > 0 ? (potentialProfit / totalRetailValuation) * 100 : 0;
  const lowStockItems = items.filter((i) => i.currentStock <= i.lowStockThreshold);
  const outOfStockItems = items.filter((i) => i.currentStock === 0);

  // Departments & Branches for filtering
  const allDepartments = Array.from(new Set(items.map((i) => i.department).filter(Boolean)));
  const allBranches = Array.from(new Set(items.map((i) => i.branch).filter(Boolean)));

  // Filter items based on drilldown type + search/filters
  const getFilteredList = () => {
    let baseList = items;
    if (type === 'low_stock') {
      baseList = lowStockItems;
    }

    return baseList
      .filter((i) => {
        const matchesSearch =
          i.name.toLowerCase().includes(search.toLowerCase()) ||
          i.sku.toLowerCase().includes(search.toLowerCase()) ||
          i.category.toLowerCase().includes(search.toLowerCase()) ||
          i.department.toLowerCase().includes(search.toLowerCase()) ||
          i.branch.toLowerCase().includes(search.toLowerCase()) ||
          (i.addedBy && i.addedBy.toLowerCase().includes(search.toLowerCase()));

        const matchesDept = filterDept === 'all' || i.department === filterDept;
        const matchesBranch = filterBranch === 'all' || i.branch === filterBranch;

        return matchesSearch && matchesDept && matchesBranch;
      })
      .sort((a, b) => {
        if (type === 'cost') {
          return b.unitCost * b.currentStock - a.unitCost * a.currentStock;
        }
        if (type === 'retail') {
          return b.sellingPrice * b.currentStock - a.sellingPrice * a.currentStock;
        }
        if (type === 'low_stock') {
          return a.currentStock - b.currentStock;
        }
        return a.name.localeCompare(b.name);
      });
  };

  const filteredList = getFilteredList();

  const getHeaderInfo = () => {
    switch (type) {
      case 'cost':
        return {
          title: 'Asset Cost Valuation Drill-Down',
          subtitle: 'Itemized capital acquisition expenditure and valuation per inventory SKU',
          icon: DollarSign,
          iconColor: 'text-indigo-400',
          iconBg: 'bg-indigo-600/20 border-indigo-500/30',
        };
      case 'retail':
        return {
          title: 'Retail Valuation & Margin Drill-Down',
          subtitle: 'Gross revenue potential, selling prices, and projected profit margins',
          icon: TrendingUp,
          iconColor: 'text-emerald-400',
          iconBg: 'bg-emerald-600/20 border-emerald-500/30',
        };
      case 'catalog':
        return {
          title: 'Catalog Items & Stock Directory Drill-Down',
          subtitle: 'Comprehensive breakdown of all cataloged items, units in custody, and custodians',
          icon: Package,
          iconColor: 'text-indigo-400',
          iconBg: 'bg-indigo-600/20 border-indigo-500/30',
        };
      case 'low_stock':
        return {
          title: 'Low Stock Warnings & Reorder Register',
          subtitle: 'Items currently below minimum inventory threshold requiring restocking',
          icon: AlertTriangle,
          iconColor: 'text-rose-400',
          iconBg: 'bg-rose-600/20 border-rose-500/30',
        };
    }
  };

  const headerInfo = getHeaderInfo();
  const IconComponent = headerInfo.icon;

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
                  {filteredList.length} items
                </span>
              </div>
              <p className="text-xs text-slate-400">{headerInfo.subtitle}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close popup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Stat Bar depending on type */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-5 py-3 bg-slate-950/60 border-b border-slate-800/80 text-xs shrink-0">
          {type === 'cost' && (
            <>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Cost Valuation</span>
                <div className="text-base font-bold font-mono text-white">
                  {org.currency} {totalCostValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Physical Units</span>
                <div className="text-base font-bold font-mono text-indigo-300">
                  {totalUnits.toLocaleString()} units
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Avg Cost Per Unit</span>
                <div className="text-base font-bold font-mono text-slate-200">
                  {org.currency} {totalUnits > 0 ? (totalCostValuation / totalUnits).toFixed(2) : '0.00'}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Active Catalog SKUs</span>
                <div className="text-base font-bold font-mono text-slate-200">{totalSkus} SKUs</div>
              </div>
            </>
          )}

          {type === 'retail' && (
            <>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Retail Potential</span>
                <div className="text-base font-bold font-mono text-emerald-400">
                  {org.currency} {totalRetailValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Projected Gross Profit</span>
                <div className="text-base font-bold font-mono text-emerald-300">
                  {org.currency} {potentialProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Expected Gross Margin</span>
                <div className="text-base font-bold font-mono text-white">{potentialMargin.toFixed(1)}%</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Cost Capital Baseline</span>
                <div className="text-base font-bold font-mono text-slate-300">
                  {org.currency} {totalCostValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </>
          )}

          {type === 'catalog' && (
            <>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Catalog SKUs</span>
                <div className="text-base font-bold font-mono text-white">{totalSkus} SKUs</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Physical Units in Custody</span>
                <div className="text-base font-bold font-mono text-indigo-300">{totalUnits.toLocaleString()}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Departments Covered</span>
                <div className="text-base font-bold font-mono text-slate-200">{allDepartments.length}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Branch Locations</span>
                <div className="text-base font-bold font-mono text-slate-200">{allBranches.length}</div>
              </div>
            </>
          )}

          {type === 'low_stock' && (
            <>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Critical Reorder SKUs</span>
                <div className="text-base font-bold font-mono text-rose-400">{lowStockItems.length} SKUs</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Out of Stock (Zero)</span>
                <div className="text-base font-bold font-mono text-rose-300">{outOfStockItems.length} items</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Est. Replenishment Capital</span>
                <div className="text-base font-bold font-mono text-amber-300">
                  {org.currency}{' '}
                  {lowStockItems
                    .reduce((sum, i) => sum + (i.reorderQuantity || 10) * i.unitCost, 0)
                    .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Healthy Catalog Ratio</span>
                <div className="text-base font-bold font-mono text-emerald-400">
                  {totalSkus > 0 ? (((totalSkus - lowStockItems.length) / totalSkus) * 100).toFixed(0) : 100}%
                </div>
              </div>
            </>
          )}
        </div>

        {/* Quick Search & Filter Controls inside Drill-down */}
        <div className="px-5 py-2.5 bg-slate-900 border-b border-slate-800 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between text-xs shrink-0">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter items by SKU, name, or custodian..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-2 text-slate-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {allDepartments.length > 1 && (
              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
              >
                <option value="all">All Departments</option>
                {allDepartments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            )}

            {allBranches.length > 1 && (
              <select
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
              >
                <option value="all">All Branches</option>
                {allBranches.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Scrollable Detailed Itemized Table */}
        <div className="flex-1 overflow-y-auto">
          {filteredList.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                {type === 'low_stock' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Package className="w-5 h-5" />}
              </div>
              <div className="text-sm font-semibold text-slate-200">
                {type === 'low_stock' ? 'No Low Stock Warnings' : 'No Items Found'}
              </div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {type === 'low_stock'
                  ? 'All inventory items are currently stocked safely above their reorder thresholds.'
                  : 'No inventory items matched your search query in this drilldown view.'}
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-950 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800 z-10">
                <tr>
                  <th className="py-2.5 px-4">SKU & Item Name</th>
                  <th className="py-2.5 px-3">Location & Dept</th>
                  {type === 'catalog' && <th className="py-2.5 px-3">Added By</th>}
                  <th className="py-2.5 px-3 text-right">In Stock</th>
                  {type === 'cost' && (
                    <>
                      <th className="py-2.5 px-3 text-right">Unit Cost</th>
                      <th className="py-2.5 px-3 text-right">Total Asset Cost</th>
                      <th className="py-2.5 px-3 text-right">Capital Share</th>
                    </>
                  )}
                  {type === 'retail' && (
                    <>
                      <th className="py-2.5 px-3 text-right">Unit Cost</th>
                      <th className="py-2.5 px-3 text-right">Selling Price</th>
                      <th className="py-2.5 px-3 text-right">Total Retail Value</th>
                      <th className="py-2.5 px-3 text-right">Margin (%)</th>
                    </>
                  )}
                  {type === 'catalog' && (
                    <>
                      <th className="py-2.5 px-3 text-right">Unit Cost</th>
                      <th className="py-2.5 px-3 text-right">Selling Price</th>
                      <th className="py-2.5 px-3 text-right">Total Value</th>
                    </>
                  )}
                  {type === 'low_stock' && (
                    <>
                      <th className="py-2.5 px-3 text-right">Min Threshold</th>
                      <th className="py-2.5 px-3 text-right">Reorder Qty</th>
                      <th className="py-2.5 px-3 text-right">Est. Restock Cost</th>
                    </>
                  )}
                  <th className="py-2.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredList.map((item) => {
                  const isLow = item.currentStock <= item.lowStockThreshold;
                  const isOut = item.currentStock === 0;
                  const itemCost = item.unitCost * item.currentStock;
                  const itemRetail = item.sellingPrice * item.currentStock;
                  const capitalShare = totalCostValuation > 0 ? (itemCost / totalCostValuation) * 100 : 0;
                  const unitProfit = item.sellingPrice - item.unitCost;
                  const marginPct = item.sellingPrice > 0 ? (unitProfit / item.sellingPrice) * 100 : 0;

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                      {/* SKU & Name */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-indigo-400 text-xs">{item.sku}</div>
                        <div className="text-white font-medium truncate max-w-[200px]" title={item.name}>
                          {item.name}
                        </div>
                        <div className="text-[10px] text-slate-500">{item.category}</div>
                      </td>

                      {/* Location & Dept */}
                      <td className="py-3 px-3">
                        <div className="text-slate-200 font-medium truncate max-w-[140px] flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{item.department}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[140px] flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{item.branch}</span>
                        </div>
                      </td>

                      {/* Added By (Catalog type) */}
                      {type === 'catalog' && (
                        <td className="py-3 px-3">
                          <div className="text-slate-300 font-medium text-[11px] truncate max-w-[130px]">
                            {item.addedBy || 'Administrator'}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                      )}

                      {/* In Stock */}
                      <td className="py-3 px-3 text-right">
                        <div className="font-mono font-bold text-white text-xs">
                          {item.currentStock.toLocaleString()} {item.unit}
                        </div>
                        <div className="text-[10px]">
                          {isOut ? (
                            <span className="text-rose-400 font-semibold font-mono">OUT OF STOCK</span>
                          ) : isLow ? (
                            <span className="text-amber-400 font-semibold font-mono">LOW STOCK</span>
                          ) : (
                            <span className="text-emerald-400 font-mono">HEALTHY</span>
                          )}
                        </div>
                      </td>

                      {/* Specific Columns for 'cost' */}
                      {type === 'cost' && (
                        <>
                          <td className="py-3 px-3 text-right font-mono text-slate-300">
                            {org.currency} {item.unitCost.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-indigo-300">
                            {org.currency} {itemCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-slate-400">
                            {capitalShare.toFixed(1)}%
                          </td>
                        </>
                      )}

                      {/* Specific Columns for 'retail' */}
                      {type === 'retail' && (
                        <>
                          <td className="py-3 px-3 text-right font-mono text-slate-400">
                            {org.currency} {item.unitCost.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-slate-200">
                            {org.currency} {item.sellingPrice.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                            {org.currency} {itemRetail.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-3 text-right font-mono">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                marginPct >= 30
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : marginPct > 0
                                  ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                                  : 'bg-rose-950 text-rose-400 border border-rose-800'
                              }`}
                            >
                              {marginPct.toFixed(1)}%
                            </span>
                          </td>
                        </>
                      )}

                      {/* Specific Columns for 'catalog' */}
                      {type === 'catalog' && (
                        <>
                          <td className="py-3 px-3 text-right font-mono text-slate-300">
                            {org.currency} {item.unitCost.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-emerald-400">
                            {org.currency} {item.sellingPrice.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-white">
                            {org.currency} {itemCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </>
                      )}

                      {/* Specific Columns for 'low_stock' */}
                      {type === 'low_stock' && (
                        <>
                          <td className="py-3 px-3 text-right font-mono font-bold text-amber-400">
                            {item.lowStockThreshold} {item.unit}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-indigo-300">
                            +{item.reorderQuantity || 10} {item.unit}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-100">
                            {org.currency}{' '}
                            {((item.reorderQuantity || 10) * item.unitCost).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                        </>
                      )}

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {type === 'low_stock' ? (
                            <button
                              onClick={() => {
                                onClose();
                                onAdjustStock(item, 'in');
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold flex items-center gap-1 shadow-xs transition-colors"
                              title="Restock this item"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Restock</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                onClose();
                                onAdjustStock(item, 'in');
                              }}
                              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                              title="Stock Adjustment"
                            >
                              <ArrowUpDown className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => {
                              onClose();
                              onEditItem(item);
                            }}
                            className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded transition-colors"
                            title="Edit Item Details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span>Operating Currency: <strong className="text-white font-mono">{org.currency}</strong></span>
            <span>·</span>
            <span>Organization: <strong className="text-slate-200">{org.name}</strong></span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
          >
            Close Drill-Down
          </button>
        </div>
      </div>
    </div>
  );
};
