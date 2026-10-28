import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  FileSpreadsheet,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Building2,
  MapPin,
  User as UserIcon,
  Layers,
  Edit2,
  Trash2,
  ArrowUpDown,
  CheckCircle2,
  X,
  FileText,
  Clock,
  Printer,
  ChevronDown,
  ArrowUpRight,
  Download,
} from 'lucide-react';
import { InventoryItem, OrganizationSettings, StockMovement, User } from '../../types';
import { storageService } from '../../services/storage';
import { InventorySummaryReportModal } from './InventorySummaryReportModal';
import { InventoryKpiDrilldownModal, InventoryDrilldownType } from './InventoryKpiDrilldownModal';

interface InventoryManagementViewProps {
  org: OrganizationSettings;
  currentUser: User;
  onRefresh: () => void;
}

const STANDARD_CATEGORIES = [
  'Hardware & Servers',
  'Hardware & Components',
  'Peripherals & Displays',
  'Software & Licenses',
  'Networking & Cabling',
  'Office Supplies',
  'Raw Materials',
  'Finished Goods',
  'Maintenance & Tools',
];

const STANDARD_DEPARTMENTS = [
  'IT Infrastructure',
  'Operations',
  'Engineering',
  'Sales & Marketing',
  'Finance',
  'Logistics & Supply Chain',
  'Customer Support',
  'Human Resources',
];

const STANDARD_BRANCHES = [
  'Main HQ - London',
  'Regional Hub - New York',
  'EMEA Distribution - Dublin',
  'APAC Center - Singapore',
  'Warehouse East - Canary Wharf',
  'Secondary Storage Facility',
];

const STANDARD_UNITS = ['units', 'pcs', 'kits', 'boxes', 'licenses', 'kg', 'meters', 'packs'];

export const InventoryManagementView: React.FC<InventoryManagementViewProps> = ({
  org,
  currentUser,
  onRefresh,
}) => {
  const [items, setItems] = useState<InventoryItem[]>(() => storageService.getInventoryItems(org.id));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'low_stock' | 'out_of_stock' | 'healthy'>('all');

  // Modals
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isSummaryReportOpen, setIsSummaryReportOpen] = useState(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
  const [adjustType, setAdjustType] = useState<'in' | 'out'>('in');
  const [adjustQty, setAdjustQty] = useState<number>(1);
  const [adjustReason, setAdjustReason] = useState<string>('Restock / Delivery receipt');
  const [drilldownType, setDrilldownType] = useState<InventoryDrilldownType | null>(null);

  // Form State for Add / Edit
  const [formData, setFormData] = useState<{
    name: string;
    sku: string;
    category: string;
    customCategory: string;
    department: string;
    customDepartment: string;
    branch: string;
    customBranch: string;
    addedBy: string;
    unit: string;
    unitCost: number | string;
    sellingPrice: number | string;
    currentStock: number | string;
    lowStockThreshold: number | string;
    reorderQuantity: number | string;
    supplierId: string;
    notes: string;
  }>({
    name: '',
    sku: '',
    category: STANDARD_CATEGORIES[0],
    customCategory: '',
    department: STANDARD_DEPARTMENTS[0],
    customDepartment: '',
    branch: STANDARD_BRANCHES[0],
    customBranch: '',
    addedBy: `${currentUser.name} (${currentUser.role})`,
    unit: 'units',
    unitCost: '',
    sellingPrice: '',
    currentStock: '',
    lowStockThreshold: 5,
    reorderQuantity: 10,
    supplierId: '',
    notes: '',
  });

  const canEdit = ['super_admin', 'org_admin', 'billing_manager', 'invoice_editor'].includes(currentUser.role);
  const orgVendors = storageService.getVendors(org.id);
  const orgUsers = storageService.getUsersByOrg(org.id);

  // Reload local state whenever storage refreshes
  const reloadItems = () => {
    const updated = storageService.getInventoryItems(org.id);
    setItems(updated);
    onRefresh();
  };

  // Distinct Filter Options
  const allCategories = Array.from(new Set([...STANDARD_CATEGORIES, ...items.map((i) => i.category)]));
  const allDepartments = Array.from(new Set([...STANDARD_DEPARTMENTS, ...items.map((i) => i.department)]));
  const allBranches = Array.from(new Set([...STANDARD_BRANCHES, ...items.map((i) => i.branch)]));

  // Filtered List
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.branch.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.addedBy && item.addedBy.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesDepartment = selectedDepartment === 'all' || item.department === selectedDepartment;
    const matchesBranch = selectedBranch === 'all' || item.branch === selectedBranch;

    let matchesStatus = true;
    if (selectedStatus === 'low_stock') {
      matchesStatus = item.currentStock <= item.lowStockThreshold && item.currentStock > 0;
    } else if (selectedStatus === 'out_of_stock') {
      matchesStatus = item.currentStock === 0;
    } else if (selectedStatus === 'healthy') {
      matchesStatus = item.currentStock > item.lowStockThreshold;
    }

    return matchesSearch && matchesCategory && matchesDepartment && matchesBranch && matchesStatus;
  });

  // KPI Calculations
  const totalSkus = items.length;
  const totalUnits = items.reduce((sum, i) => sum + i.currentStock, 0);
  const totalCostValuation = items.reduce((sum, i) => sum + i.unitCost * i.currentStock, 0);
  const totalRetailValuation = items.reduce((sum, i) => sum + i.sellingPrice * i.currentStock, 0);
  const potentialProfit = totalRetailValuation - totalCostValuation;
  const potentialMargin = totalRetailValuation > 0 ? (potentialProfit / totalRetailValuation) * 100 : 0;
  const lowStockCount = items.filter((i) => i.currentStock <= i.lowStockThreshold).length;

  // Open Add Modal
  const handleOpenAddModal = () => {
    const randomSkuSuffix = Math.floor(1000 + Math.random() * 9000);
    setEditingItem(null);
    setFormData({
      name: '',
      sku: `SKU-INV-${randomSkuSuffix}`,
      category: STANDARD_CATEGORIES[0],
      customCategory: '',
      department: STANDARD_DEPARTMENTS[0],
      customDepartment: '',
      branch: STANDARD_BRANCHES[0],
      customBranch: '',
      addedBy: `${currentUser.name} (${currentUser.role})`,
      unit: 'units',
      unitCost: '',
      sellingPrice: '',
      currentStock: '',
      lowStockThreshold: 5,
      reorderQuantity: 10,
      supplierId: '',
      notes: '',
    });
    setIsAddEditModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      sku: item.sku,
      category: STANDARD_CATEGORIES.includes(item.category) ? item.category : 'custom',
      customCategory: STANDARD_CATEGORIES.includes(item.category) ? '' : item.category,
      department: STANDARD_DEPARTMENTS.includes(item.department) ? item.department : 'custom',
      customDepartment: STANDARD_DEPARTMENTS.includes(item.department) ? '' : item.department,
      branch: STANDARD_BRANCHES.includes(item.branch) ? item.branch : 'custom',
      customBranch: STANDARD_BRANCHES.includes(item.branch) ? '' : item.branch,
      addedBy: item.addedBy || `${currentUser.name} (${currentUser.role})`,
      unit: item.unit || 'units',
      unitCost: item.unitCost,
      sellingPrice: item.sellingPrice,
      currentStock: item.currentStock,
      lowStockThreshold: item.lowStockThreshold,
      reorderQuantity: item.reorderQuantity || 10,
      supplierId: item.supplierId || '',
      notes: item.notes || '',
    });
    setIsAddEditModalOpen(true);
  };

  // Save Item
  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.sku.trim()) {
      alert('Please enter a valid Item Name and SKU.');
      return;
    }

    const resolvedCategory =
      formData.category === 'custom' ? formData.customCategory.trim() || 'General' : formData.category;
    const resolvedDepartment =
      formData.department === 'custom' ? formData.customDepartment.trim() || 'General Operations' : formData.department;
    const resolvedBranch =
      formData.branch === 'custom' ? formData.customBranch.trim() || 'Main HQ' : formData.branch;

    const supplier = orgVendors.find((v) => v.id === formData.supplierId);

    const itemToSave: InventoryItem = {
      id: editingItem ? editingItem.id : 'inv_' + Math.random().toString(36).substring(2, 9),
      organizationId: org.id,
      name: formData.name.trim(),
      sku: formData.sku.trim().toUpperCase(),
      category: resolvedCategory,
      department: resolvedDepartment,
      branch: resolvedBranch,
      addedBy: formData.addedBy.trim() || `${currentUser.name} (${currentUser.role})`,
      addedById: currentUser.id,
      unit: formData.unit || 'units',
      unitCost: Math.max(0, Number(formData.unitCost) || 0),
      sellingPrice: Math.max(0, Number(formData.sellingPrice) || 0),
      currentStock: Math.max(0, Number(formData.currentStock) || 0),
      lowStockThreshold: Math.max(0, Number(formData.lowStockThreshold) || 0),
      reorderQuantity: Math.max(1, Number(formData.reorderQuantity) || 10),
      supplierId: formData.supplierId || undefined,
      supplierName: supplier ? supplier.name : undefined,
      notes: formData.notes.trim() || undefined,
      createdAt: editingItem ? editingItem.createdAt : new Date().toISOString(),
      lastRestockedAt: editingItem?.lastRestockedAt || new Date().toISOString(),
    };

    storageService.saveInventoryItem(itemToSave, currentUser);
    setIsAddEditModalOpen(false);
    reloadItems();
  };

  // Delete Item
  const handleDeleteItem = (item: InventoryItem) => {
    if (confirm(`Are you sure you want to delete inventory item "${item.name}" (${item.sku})?`)) {
      storageService.deleteInventoryItem(item.id, org.id, currentUser);
      reloadItems();
    }
  };

  // Open Quick Stock Adjust Modal
  const handleOpenAdjustmentModal = (item: InventoryItem, defaultType: 'in' | 'out' = 'in') => {
    setAdjustingItem(item);
    setAdjustType(defaultType);
    setAdjustQty(1);
    setAdjustReason(defaultType === 'in' ? 'Restock / Purchase delivery' : 'Internal usage / Customer order delivery');
    setIsAdjustmentModalOpen(true);
  };

  // Execute Quick Stock Adjust
  const handleExecuteAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingItem || adjustQty <= 0) return;

    const movement: StockMovement = {
      id: 'sm_' + Math.random().toString(36).substr(2, 8),
      itemId: adjustingItem.id,
      itemName: adjustingItem.name,
      organizationId: org.id,
      type: adjustType,
      quantity: adjustQty,
      date: new Date().toISOString(),
      department: adjustingItem.department,
      branch: adjustingItem.branch,
      reason: adjustReason.trim() || 'Manual stock adjustment',
      actorName: currentUser.name,
    };

    storageService.recordStockMovement(movement, currentUser);
    setIsAdjustmentModalOpen(false);
    setAdjustingItem(null);
    reloadItems();
  };

  // Quick Export CSV
  const handleQuickExportCsv = () => {
    const headers = [
      'SKU',
      'Item Name',
      'Category',
      'Department',
      'Branch',
      'Added By',
      'Stock',
      'Unit',
      'Unit Cost',
      'Selling Price',
      'Total Cost Valuation',
      'Total Retail Valuation',
      'Low Stock Threshold',
    ];

    const rows = filteredItems.map((i) => [
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
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Inventory_Items_${org.slug || 'kero'}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-200">
      {/* View Header with "Produce Summary Report" and "+ Add Inventory Item" */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Package className="w-6 h-6 text-indigo-400" />
            <span>Inventory & Asset Management</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              Billing & Operations
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track multi-category stock, department allocations, branch warehouses, and personnel custody under {org.name}.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Generate Summary Report Button */}
          <button
            onClick={() => setIsSummaryReportOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl shadow-md shadow-emerald-900/30 transition-all hover:scale-[1.02] cursor-pointer"
            title="Generate consolidated inventory report with department and branch breakdowns, printable and downloadable as PDF"
          >
            <FileText className="w-4 h-4 text-emerald-100" />
            <span>Generate Summary Report</span>
          </button>

          {/* Quick CSV Export */}
          <button
            onClick={handleQuickExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors cursor-pointer"
            title="Export filtered table to CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {/* Add Inventory Item Button */}
          {canEdit && (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Inventory Item</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Interactive KPI Summary Cards with Icon & Card Drill-Down Popups */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cost Valuation Card */}
        <div
          onClick={() => setDrilldownType('cost')}
          className="bg-slate-900/60 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/80 rounded-xl p-4 space-y-2 cursor-pointer transition-all hover:scale-[1.01] shadow-xs group"
          title="Click card or icon for detailed itemized breakdown of asset costs and capital allocation"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-300 group-hover:text-white transition-colors">Asset Cost Valuation</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setDrilldownType('cost');
              }}
              className="p-1.5 rounded-lg bg-indigo-600/10 group-hover:bg-indigo-600 text-indigo-400 group-hover:text-white transition-all shadow-xs cursor-pointer"
              title="Click icon for Asset Cost Valuation drill-down"
              aria-label="View Asset Cost Valuation drill-down"
            >
              <DollarSign className="w-4 h-4" />
            </button>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white tabular-nums">
            {org.currency} {totalCostValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
            <span>Total acquisition capital invested</span>
            <span className="text-[10px] text-indigo-400 font-semibold group-hover:underline flex items-center gap-0.5">
              <span>Details</span>
              <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Retail Selling Valuation Card */}
        <div
          onClick={() => setDrilldownType('retail')}
          className="bg-slate-900/60 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/80 rounded-xl p-4 space-y-2 cursor-pointer transition-all hover:scale-[1.01] shadow-xs group"
          title="Click card or icon for detailed itemized retail revenue potential, prices, and profit margins"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-300 group-hover:text-white transition-colors">Retail Valuation</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setDrilldownType('retail');
              }}
              className="p-1.5 rounded-lg bg-emerald-600/10 group-hover:bg-emerald-600 text-emerald-400 group-hover:text-white transition-all shadow-xs cursor-pointer"
              title="Click icon for Retail Valuation drill-down"
              aria-label="View Retail Valuation drill-down"
            >
              <TrendingUp className="w-4 h-4" />
            </button>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 tabular-nums">
            {org.currency} {totalRetailValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
            <span>Estimated gross margin: <strong className="text-emerald-400">{potentialMargin.toFixed(1)}%</strong></span>
            <span className="text-[10px] text-emerald-400 font-semibold group-hover:underline flex items-center gap-0.5">
              <span>Details</span>
              <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* SKUs & Physical Units Card */}
        <div
          onClick={() => setDrilldownType('catalog')}
          className="bg-slate-900/60 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/80 rounded-xl p-4 space-y-2 cursor-pointer transition-all hover:scale-[1.01] shadow-xs group"
          title="Click card or icon for full directory of catalog SKUs, quantities, and custodian details"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-300 group-hover:text-white transition-colors">Catalog Items & Stock</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setDrilldownType('catalog');
              }}
              className="p-1.5 rounded-lg bg-indigo-600/10 group-hover:bg-indigo-600 text-indigo-400 group-hover:text-white transition-all shadow-xs cursor-pointer"
              title="Click icon for Catalog Items drill-down"
              aria-label="View Catalog Items drill-down"
            >
              <Package className="w-4 h-4" />
            </button>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-indigo-300 tabular-nums">
            {totalSkus} <span className="text-sm font-normal text-slate-400">SKUs</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
            <span>{totalUnits.toLocaleString()} physical units in custody</span>
            <span className="text-[10px] text-indigo-400 font-semibold group-hover:underline flex items-center gap-0.5">
              <span>Details</span>
              <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Low Stock Alerts Card */}
        <div
          onClick={() => setDrilldownType('low_stock')}
          className={`border rounded-xl p-4 space-y-2 cursor-pointer transition-all hover:scale-[1.01] shadow-xs group ${
            lowStockCount > 0 ? 'bg-rose-950/20 border-rose-900/60 hover:border-rose-500/80 hover:bg-rose-950/30' : 'bg-slate-900/60 hover:bg-slate-850 border-slate-800 hover:border-slate-700'
          }`}
          title="Click card or icon for low stock replenishment register and instant reorder actions"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className={`font-semibold ${lowStockCount > 0 ? 'text-rose-300 group-hover:text-white' : 'text-slate-300'}`}>
              Low Stock Warnings
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setDrilldownType('low_stock');
              }}
              className={`p-1.5 rounded-lg transition-all shadow-xs cursor-pointer ${
                lowStockCount > 0 ? 'bg-rose-600/10 group-hover:bg-rose-600 text-rose-400 group-hover:text-white' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-white'
              }`}
              title="Click icon for Low Stock Warnings drill-down"
              aria-label="View Low Stock Warnings drill-down"
            >
              <AlertTriangle className="w-4 h-4" />
            </button>
          </div>
          <div className={`text-xl sm:text-2xl font-bold font-mono tabular-nums ${lowStockCount > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
            {lowStockCount} <span className="text-sm font-normal text-slate-400">Alerts</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
            <span className={lowStockCount > 0 ? 'text-rose-400 font-medium' : 'text-slate-500'}>
              {lowStockCount > 0 ? `${lowStockCount} items below threshold` : 'All inventory levels optimal'}
            </span>
            <span className={`text-[10px] font-semibold group-hover:underline flex items-center gap-0.5 ${lowStockCount > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
              <span>Details</span>
              <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Search & Multi-Attribute Filters (Category, Department, Branch, Status) */}
      <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          {/* Global Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by SKU, item name, category, department, branch, or added by..."
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="w-full md:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Categories ({allCategories.length})</option>
              {allCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div className="w-full md:w-48">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Departments ({allDepartments.length})</option>
              {allDepartments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Branch Filter */}
          <div className="w-full md:w-48">
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Branches ({allBranches.length})</option>
              {allBranches.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Secondary Filter Chips */}
        <div className="flex items-center justify-between text-xs flex-wrap gap-2 pt-1 border-t border-slate-800/60">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-500 text-[11px] mr-1">Status:</span>
            <button
              onClick={() => setSelectedStatus('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                selectedStatus === 'all'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              All Items ({items.length})
            </button>
            <button
              onClick={() => setSelectedStatus('low_stock')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                selectedStatus === 'low_stock'
                  ? 'bg-rose-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Low Stock Warnings ({lowStockCount})
            </button>
            <button
              onClick={() => setSelectedStatus('healthy')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                selectedStatus === 'healthy'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Healthy Stock
            </button>
            <button
              onClick={() => setSelectedStatus('out_of_stock')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                selectedStatus === 'out_of_stock'
                  ? 'bg-slate-700 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Out of Stock
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-[11px] text-slate-400 font-mono">
              Showing <strong className="text-white">{filteredItems.length}</strong> of {items.length} items
            </div>
            <button
              onClick={() => setIsSummaryReportOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 hover:text-white bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-800/80 rounded-lg transition-colors cursor-pointer"
              title="Generate consolidated inventory report as PDF"
            >
              <FileText className="w-3 h-3 text-emerald-400" />
              <span>Report PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Inventory Items Data Grid */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200">No Inventory Records Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery || selectedCategory !== 'all' || selectedDepartment !== 'all' || selectedBranch !== 'all' || selectedStatus !== 'all'
                ? 'No items matched your current filter criteria. Try resetting filters.'
                : 'No inventory items recorded yet. Click "+ Add Inventory Item" to register your first item.'}
            </p>
            {canEdit && (
              <button
                onClick={handleOpenAddModal}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Inventory Item</span>
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View (>= 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-semibold tracking-wider uppercase text-[10px]">
                    <th className="py-3 px-4">SKU & Item Name</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Department & Branch</th>
                    <th className="py-3 px-3">Added By</th>
                    <th className="py-3 px-3 text-right">Stock Level</th>
                    <th className="py-3 px-3 text-right">Cost / Selling</th>
                    <th className="py-3 px-3 text-right">Asset Valuation</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {filteredItems.map((item) => {
                    const isLow = item.currentStock <= item.lowStockThreshold;
                    const isOut = item.currentStock === 0;
                    const totalCost = item.unitCost * item.currentStock;

                    return (
                      <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                        {/* SKU & Name */}
                        <td className="py-3 px-4">
                          <div className="font-mono font-bold text-indigo-400 text-xs">
                            {item.sku}
                          </div>
                          <div className="text-slate-100 font-medium truncate max-w-[220px]" title={item.name}>
                            {item.name}
                          </div>
                          {item.notes && (
                            <div className="text-[10px] text-slate-500 truncate max-w-[220px]" title={item.notes}>
                              {item.notes}
                            </div>
                          )}
                        </td>

                        {/* Category */}
                        <td className="py-3 px-3">
                          <span className="text-slate-300 font-medium">{item.category}</span>
                        </td>

                        {/* Department & Branch */}
                        <td className="py-3 px-3">
                          <div className="text-slate-200 font-medium flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[140px]">{item.department}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                            <span className="truncate max-w-[140px]">{item.branch}</span>
                          </div>
                        </td>

                        {/* Added By */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            <UserIcon className="w-3 h-3 text-indigo-400 shrink-0" />
                            <span className="text-slate-300 font-medium truncate max-w-[130px]">
                              {item.addedBy || 'Administrator'}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </div>
                        </td>

                        {/* Stock Level */}
                        <td className="py-3 px-3 text-right">
                          <div className="font-mono font-bold text-slate-100 text-sm">
                            {item.currentStock.toLocaleString()}{' '}
                            <span className="text-xs font-normal text-slate-400">{item.unit}</span>
                          </div>
                          <div className="text-[10px] mt-0.5">
                            {isOut ? (
                              <span className="text-rose-400 font-semibold font-mono">OUT OF STOCK</span>
                            ) : isLow ? (
                              <span className="text-amber-400 font-semibold font-mono flex items-center justify-end gap-1">
                                <AlertTriangle className="w-3 h-3 text-amber-400" />
                                <span>MIN {item.lowStockThreshold}</span>
                              </span>
                            ) : (
                              <span className="text-emerald-400 font-mono">HEALTHY</span>
                            )}
                          </div>
                        </td>

                        {/* Cost & Selling */}
                        <td className="py-3 px-3 text-right font-mono text-xs">
                          <div className="text-slate-300">
                            Cost: {org.currency} {item.unitCost.toFixed(2)}
                          </div>
                          <div className="text-emerald-400 font-medium text-[11px]">
                            Sell: {org.currency} {item.sellingPrice.toFixed(2)}
                          </div>
                        </td>

                        {/* Asset Valuation */}
                        <td className="py-3 px-3 text-right">
                          <div className="font-mono font-bold text-white text-xs tabular-nums">
                            {org.currency} {totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Ret: {org.currency} {(item.sellingPrice * item.currentStock).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Stock Adjust button */}
                            {canEdit && (
                              <button
                                onClick={() => handleOpenAdjustmentModal(item, 'in')}
                                className="px-2 py-1 bg-slate-800 hover:bg-indigo-600/30 text-indigo-300 hover:text-white border border-slate-700 rounded text-[11px] font-semibold transition-colors"
                                title="Adjust Stock In / Out"
                              >
                                Adjust
                              </button>
                            )}

                            {/* Edit */}
                            {canEdit && (
                              <button
                                onClick={() => handleOpenEditModal(item)}
                                className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded-lg transition-colors"
                                title="Edit Item Details"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Delete */}
                            {canEdit && (
                              <button
                                onClick={() => handleDeleteItem(item)}
                                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                                title="Delete Item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Smartphone Card View (< 768px) */}
            <div className="block md:hidden divide-y divide-slate-800/80">
              {filteredItems.map((item) => {
                const isLow = item.currentStock <= item.lowStockThreshold;
                const isOut = item.currentStock === 0;
                const totalCost = item.unitCost * item.currentStock;

                return (
                  <div key={`mobile-${item.id}`} className="p-4 space-y-3 bg-slate-900/30">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono font-bold text-indigo-400 text-xs">
                          {item.sku}
                        </span>
                        <div className="text-sm font-semibold text-white mt-0.5">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {item.category}
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono tracking-wider ${
                          isOut
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : isLow
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        }`}
                      >
                        {isOut ? 'OUT' : isLow ? 'LOW STOCK' : 'IN STOCK'}
                      </span>
                    </div>

                    {/* Department, Branch & Added By */}
                    <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-500">Department</span>
                        <div className="text-slate-200 font-medium truncate">{item.department}</div>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-500">Branch Location</span>
                        <div className="text-slate-200 font-medium truncate">{item.branch}</div>
                      </div>
                      <div className="col-span-2 pt-1 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Added By:</span>
                        <span className="text-slate-300 font-medium truncate max-w-[200px]">{item.addedBy || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Stock & Valuation details */}
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase">Available Stock</span>
                        <div className="text-base font-bold font-mono text-white">
                          {item.currentStock.toLocaleString()} {item.unit}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 uppercase">Asset Cost Value</span>
                        <div className="text-base font-bold font-mono text-indigo-300">
                          {org.currency} {totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>

                    {/* Mobile Actions */}
                    {canEdit && (
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60">
                        <button
                          onClick={() => handleOpenAdjustmentModal(item, 'in')}
                          className="flex-1 min-h-[40px] px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 border border-slate-700"
                        >
                          <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Adjust Stock</span>
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="min-h-[40px] px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center justify-center border border-slate-700"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item)}
                          className="min-h-[40px] px-3 py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold rounded-lg flex items-center justify-center border border-rose-800/50"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Add / Edit Inventory Item Modal */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 sm:p-6 text-slate-100 max-h-[95vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Register item under designated inventory category, department, branch, and added by personnel.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddEditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Item Name */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Item Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Dell PowerEdge R750 Enterprise Server Rack"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* SKU */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    SKU Code <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="e.g. SKU-SRV-7501"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-indigo-300 font-mono font-bold uppercase placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Unit of Measure */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Unit of Measure</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {STANDARD_UNITS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>

                {/* Inventory Category */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Inventory Category <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {STANDARD_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="custom">+ Other / Custom Category...</option>
                  </select>
                  {formData.category === 'custom' && (
                    <input
                      type="text"
                      required
                      value={formData.customCategory}
                      onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                      placeholder="Enter custom category name"
                      className="w-full mt-1.5 bg-slate-950 border border-indigo-500/80 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                    />
                  )}
                </div>

                {/* Department */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Department <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {STANDARD_DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                    <option value="custom">+ Other / Custom Department...</option>
                  </select>
                  {formData.department === 'custom' && (
                    <input
                      type="text"
                      required
                      value={formData.customDepartment}
                      onChange={(e) => setFormData({ ...formData, customDepartment: e.target.value })}
                      placeholder="Enter custom department name"
                      className="w-full mt-1.5 bg-slate-950 border border-indigo-500/80 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                    />
                  )}
                </div>

                {/* Branch Location */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Branch Location <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {STANDARD_BRANCHES.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                    <option value="custom">+ Other / Custom Branch...</option>
                  </select>
                  {formData.branch === 'custom' && (
                    <input
                      type="text"
                      required
                      value={formData.customBranch}
                      onChange={(e) => setFormData({ ...formData, customBranch: e.target.value })}
                      placeholder="Enter custom branch or warehouse location"
                      className="w-full mt-1.5 bg-slate-950 border border-indigo-500/80 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                    />
                  )}
                </div>

                {/* Added By Personnel */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Added By (Personnel / Custodian) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.addedBy}
                    onChange={(e) => setFormData({ ...formData, addedBy: e.target.value })}
                    placeholder="e.g. Kenneth Onekalit (super_admin)"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                  {orgUsers.length > 1 && (
                    <div className="flex items-center gap-1.5 pt-1 text-[11px] text-slate-400">
                      <span>Quick Select:</span>
                      {orgUsers.slice(0, 3).map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, addedBy: `${u.name} (${u.role})` })}
                          className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 text-[10px]"
                        >
                          {u.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Initial Stock Quantity */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Current Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                    placeholder="0"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Low Stock Alert Threshold */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Low Stock Alert Threshold</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.lowStockThreshold}
                    onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                    placeholder="5"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-amber-400 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Unit Cost */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Unit Cost ({org.currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.unitCost}
                    onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Selling Price */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Selling / Retail Price ({org.currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-emerald-400 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Reorder Quantity */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Suggested Reorder Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.reorderQuantity}
                    onChange={(e) => setFormData({ ...formData, reorderQuantity: e.target.value })}
                    placeholder="10"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Linked Supplier / Vendor */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Supplier / Vendor (Optional)</label>
                  <select
                    value={formData.supplierId}
                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">No vendor linked</option>
                    {orgVendors.map((v) => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>

                {/* Notes */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Specifications / Storage Location</label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="e.g. Aisle 4, Server Rack B, dual power supplies with redundant fans..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md transition-colors"
                >
                  {editingItem ? 'Save Changes' : 'Create Inventory Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Stock Adjustment Modal */}
      {isAdjustmentModalOpen && adjustingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 text-slate-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Stock Adjustment</h3>
              </div>
              <button
                onClick={() => setIsAdjustmentModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteAdjustment} className="space-y-4 pt-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <div className="font-mono text-indigo-400 font-bold">{adjustingItem.sku}</div>
                <div className="text-slate-200 font-semibold">{adjustingItem.name}</div>
                <div className="text-slate-400 text-[11px]">
                  Current Stock: <strong className="text-white font-mono">{adjustingItem.currentStock} {adjustingItem.unit}</strong> · Location: {adjustingItem.branch}
                </div>
              </div>

              {/* Adjustment Type Tabs */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setAdjustType('in');
                    setAdjustReason('Restock / Purchase delivery received');
                  }}
                  className={`py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    adjustType === 'in' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  + Stock In (Add)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdjustType('out');
                    setAdjustReason('Internal usage / Customer order delivery');
                  }}
                  className={`py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    adjustType === 'out' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  - Stock Out (Remove)
                </button>
              </div>

              {/* Quantity */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Quantity ({adjustingItem.unit})
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-indigo-500"
                />
                <div className="text-[11px] text-slate-400">
                  Resulting Stock Level: <strong className="text-indigo-300 font-mono">
                    {adjustType === 'in'
                      ? adjustingItem.currentStock + adjustQty
                      : Math.max(0, adjustingItem.currentStock - adjustQty)}{' '}
                    {adjustingItem.unit}
                  </strong>
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Adjustment Reason</label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Received new shipment from Dell Technologies"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustmentModalOpen(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 font-bold text-white rounded-lg shadow-sm transition-colors ${
                    adjustType === 'in' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Summary Report Modal */}
      {isSummaryReportOpen && (
        <InventorySummaryReportModal
          isOpen={isSummaryReportOpen}
          onClose={() => setIsSummaryReportOpen(false)}
          org={org}
          items={items}
          currentUser={currentUser}
        />
      )}

      {/* KPI Metric Drilldown Modal */}
      {drilldownType && (
        <InventoryKpiDrilldownModal
          isOpen={Boolean(drilldownType)}
          onClose={() => setDrilldownType(null)}
          type={drilldownType}
          items={items}
          org={org}
          currentUser={currentUser}
          onEditItem={handleOpenEditModal}
          onAdjustStock={(item, type) => handleOpenAdjustmentModal(item, type || 'in')}
        />
      )}
    </div>
  );
};
