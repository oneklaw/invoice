import React, { useState, useMemo } from 'react';
import {
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  History,
  Layers,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  TrendingUp,
  Upload,
  AlertCircle,
  Copy,
  Check,
  X,
  ExternalLink,
  DollarSign,
  Briefcase,
} from 'lucide-react';
import {
  OrganizationSettings,
  PurchaseOrder,
  User,
  Vendor,
  VendorPayment,
} from '../../types';
import { storageService } from '../../services/storage';
import {
  VendorKpiDrilldownModal,
  VendorDrilldownType,
} from './VendorKpiDrilldownModal';

interface VendorManagementViewProps {
  org: OrganizationSettings;
  currentUser: User;
  onRefresh?: () => void;
}

export const VendorManagementView: React.FC<VendorManagementViewProps> = ({
  org,
  currentUser,
  onRefresh,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'reconciliation' | 'history' | 'directory' | 'import'
  >('reconciliation');

  const [drilldownType, setDrilldownType] = useState<VendorDrilldownType | null>(null);

  // Data states
  const [vendors, setVendors] = useState<Vendor[]>(storageService.getVendors(org.id));
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(
    storageService.getPurchaseOrders(org.id)
  );
  const [payments, setPayments] = useState<VendorPayment[]>(
    storageService.getVendorPayments(org.id)
  );

  const refreshAllData = () => {
    setVendors(storageService.getVendors(org.id));
    setPurchaseOrders(storageService.getPurchaseOrders(org.id));
    setPayments(storageService.getVendorPayments(org.id));
    if (onRefresh) onRefresh();
  };

  // -------------------------------------------------------------
  // RECONCILIATION STATES
  // -------------------------------------------------------------
  const [searchReconciliation, setSearchReconciliation] = useState('');
  const [selectedPOToReconcile, setSelectedPOToReconcile] = useState<PurchaseOrder | null>(null);
  const [reconcileBankRef, setReconcileBankRef] = useState('');
  const [reconcileDate, setReconcileDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [reconcileAccount, setReconcileAccount] = useState('Barclays Corporate Treasury (Canary Wharf)');
  const [reconcileMethod, setReconcileMethod] = useState<'Wire Transfer' | 'BACS' | 'CHAPS' | 'ACH' | 'SEPA'>('Wire Transfer');
  const [reconcileNotes, setReconcileNotes] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [reconcileSuccessMsg, setReconcileSuccessMsg] = useState<string | null>(null);

  // Pending payments list: purchase orders with status 'issued' or 'received' (awaiting payment)
  const pendingPayments = useMemo(() => {
    return purchaseOrders
      .filter((po) => po.status === 'issued' || po.status === 'received')
      .filter((po) => {
        if (!searchReconciliation) return true;
        const q = searchReconciliation.toLowerCase();
        return (
          po.poNumber.toLowerCase().includes(q) ||
          po.vendorName.toLowerCase().includes(q) ||
          po.totalAmount.toString().includes(q)
        );
      });
  }, [purchaseOrders, searchReconciliation]);

  // Handle Mark Paid / Reconcile
  const handleOpenReconcileModal = (po: PurchaseOrder) => {
    setSelectedPOToReconcile(po);
    // Generate suggested bank transfer reference
    const prefix = reconcileMethod === 'Wire Transfer' ? 'WIRE' : reconcileMethod === 'ACH' ? 'ACH' : 'TXN';
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    setReconcileBankRef(`${prefix}-${new Date().getFullYear()}-${randomHex}`);
    setReconcileDate(new Date().toISOString().split('T')[0]);
    setReconcileNotes(`Reconciliation for ${po.poNumber} delivered by ${po.vendorName}`);
  };

  const handleConfirmReconcilePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPOToReconcile || !reconcileBankRef.trim()) return;

    setIsSubmittingPayment(true);
    try {
      const newPayment: VendorPayment = {
        id: 'vp_' + Math.random().toString(36).substring(2, 9),
        organizationId: org.id,
        vendorId: selectedPOToReconcile.vendorId,
        vendorName: selectedPOToReconcile.vendorName,
        purchaseOrderId: selectedPOToReconcile.id,
        amount: selectedPOToReconcile.totalAmount,
        currency: selectedPOToReconcile.currency,
        paymentDate: reconcileDate,
        bankReference: reconcileBankRef.trim(),
        status: 'completed',
      };

      storageService.recordVendorPayment(newPayment, currentUser);

      setReconcileSuccessMsg(
        `Successfully reconciled ${selectedPOToReconcile.poNumber} (${selectedPOToReconcile.currency} ${selectedPOToReconcile.totalAmount.toLocaleString()}) with Bank Ref: ${reconcileBankRef.trim()}`
      );
      setTimeout(() => setReconcileSuccessMsg(null), 5000);

      setSelectedPOToReconcile(null);
      refreshAllData();
    } catch (err) {
      console.error('Error reconciling vendor payment:', err);
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // -------------------------------------------------------------
  // PAYMENT HISTORY & TRENDS
  // -------------------------------------------------------------
  const [historySearch, setHistorySearch] = useState('');
  const [historyVendorFilter, setHistoryVendorFilter] = useState('ALL');
  const [copiedRefId, setCopiedRefId] = useState<string | null>(null);

  const completedPayments = useMemo(() => {
    return payments
      .filter((p) => p.status === 'completed')
      .filter((p) => {
        if (historyVendorFilter !== 'ALL' && p.vendorId !== historyVendorFilter) return false;
        if (!historySearch) return true;
        const q = historySearch.toLowerCase();
        return (
          p.vendorName.toLowerCase().includes(q) ||
          p.bankReference.toLowerCase().includes(q) ||
          (p.purchaseOrderId && p.purchaseOrderId.toLowerCase().includes(q)) ||
          p.amount.toString().includes(q)
        );
      })
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
  }, [payments, historySearch, historyVendorFilter]);

  // Total Disbursed Stats
  const totalDisbursedYtd = useMemo(() => {
    return completedPayments.reduce((acc, curr) => acc + curr.amount, 0);
  }, [completedPayments]);

  const avgDisbursement = useMemo(() => {
    if (completedPayments.length === 0) return 0;
    return Math.round(totalDisbursedYtd / completedPayments.length);
  }, [completedPayments, totalDisbursedYtd]);

  // Aggregate disbursements by vendor for trend visualization
  const vendorDisbursementBreakdown = useMemo(() => {
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

  // Monthly disbursement trends (Last 6 months)
  const monthlyTrends = useMemo(() => {
    const monthNames = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
    const buckets: Record<string, number> = {
      May: 4200,
      Jun: 8900,
      Jul: 11400,
      Aug: 17400,
      Sep: 22500,
      Oct: 0,
    };

    // Calculate current month's payments
    for (const p of completedPayments) {
      const d = new Date(p.paymentDate);
      const m = d.toLocaleString('en-US', { month: 'short' });
      if (buckets[m] !== undefined) {
        buckets[m] += p.amount;
      }
    }

    return monthNames.map((m) => ({ month: m, amount: buckets[m] }));
  }, [completedPayments]);

  const maxMonthlyAmount = Math.max(...monthlyTrends.map((t) => t.amount), 1);

  const handleCopyRef = (ref: string, id: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRefId(id);
    setTimeout(() => setCopiedRefId(null), 2000);
  };

  const handleExportPaymentsCsv = () => {
    const headers = ['Payment Date,Vendor Name,Purchase Order ID,Amount,Currency,Bank Reference,Status'];
    const rows = completedPayments.map(
      (p) =>
        `"${p.paymentDate}","${p.vendorName}","${p.purchaseOrderId}","${p.amount}","${p.currency}","${p.bankReference}","${p.status}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Supplier_Payment_Disbursements_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // -------------------------------------------------------------
  // CSV IMPORT TOOL
  // -------------------------------------------------------------
  const [csvImportType, setCsvImportType] = useState<'suppliers' | 'payments'>('suppliers');
  const [csvRawText, setCsvRawText] = useState('');
  const [csvFileName, setCsvFileName] = useState('');
  const [parsedPreviewRows, setParsedPreviewRows] = useState<any[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);

  const handleDownloadSampleSupplierCsv = () => {
    const csv = `name,contactPerson,email,phone,address,taxId,paymentTerms,performanceScore,notes
Acme Cloud Hosting,John Miller,billing@acmecloud.com,+44 20 7946 0111,100 City Road London,GB-VAT-123456789,Net 30,95,Primary web server colocation
Highland Data Storage,Fiona Campbell,finance@highland-storage.co.uk,+44 141 496 0222,45 Union St Glasgow,GB-VAT-987654321,Net 15,92,Disaster recovery snapshot replicas
London Workspace Solutions,Tom Evans,accounts@londonworkspace.io,+44 20 8967 0333,20 Bishopsgate London,GB-VAT-554433221,Net 30,88,Conference meeting room pass`;
    downloadCsvFile(csv, 'sample_suppliers_template.csv');
  };

  const handleDownloadSamplePaymentsCsv = () => {
    const csv = `vendorName,amount,currency,paymentDate,bankReference,status,purchaseOrderId
AWS Cloud Services UK,3500,GBP,2026-09-15,WIRE-2026-BARC-1011,completed,PO-2026-081
Dell Technologies Enterprise,5800,GBP,2026-09-20,CHAPS-2026-DL-2022,completed,PO-2026-094
WeWork Office Facilities Ltd,3100,GBP,2026-09-25,BACS-2026-WW-3033,completed,PO-2026-072`;
    downloadCsvFile(csv, 'sample_supplier_payments_template.csv');
  };

  const downloadCsvFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);
    setCsvError(null);
    setImportSuccessMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvRawText(text);
      parseCsvData(text, csvImportType);
    };
    reader.readAsText(file);
  };

  const parseCsvData = (text: string, type: 'suppliers' | 'payments') => {
    setCsvError(null);
    try {
      const lines = text.trim().split(/\r\n|\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        setCsvError('CSV file must contain a header row and at least one data row.');
        setParsedPreviewRows([]);
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));

      const rows: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        // Simple CSV splitter handling quoted items
        const rawLine = lines[i];
        const values: string[] = [];
        let inQuote = false;
        let curVal = '';

        for (let j = 0; j < rawLine.length; j++) {
          const char = rawLine[j];
          if (char === '"') {
            inQuote = !inQuote;
          } else if (char === ',' && !inQuote) {
            values.push(curVal.trim().replace(/^["']|["']$/g, ''));
            curVal = '';
          } else {
            curVal += char;
          }
        }
        values.push(curVal.trim().replace(/^["']|["']$/g, ''));

        const rowObj: any = {};
        headers.forEach((h, idx) => {
          rowObj[h] = values[idx] || '';
        });

        // Basic validation
        if (type === 'suppliers') {
          if (!rowObj.name) continue;
          rowObj.performanceScore = Number(rowObj.performanceScore) || 90;
        } else {
          if (!rowObj.vendorName || !rowObj.amount) continue;
          rowObj.amount = Number(rowObj.amount) || 0;
          rowObj.currency = rowObj.currency || org.currency || 'GBP';
          rowObj.status = rowObj.status || 'completed';
          rowObj.paymentDate = rowObj.paymentDate || new Date().toISOString().split('T')[0];
          rowObj.bankReference = rowObj.bankReference || `TXN-IMP-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        }

        rows.push(rowObj);
      }

      if (rows.length === 0) {
        setCsvError('No valid rows could be extracted from this CSV file. Please verify headers.');
        setParsedPreviewRows([]);
        return;
      }

      setParsedPreviewRows(rows);
    } catch (err: any) {
      setCsvError(`Failed to parse CSV file: ${err.message || 'Syntax error'}`);
      setParsedPreviewRows([]);
    }
  };

  const handleExecuteImport = () => {
    if (parsedPreviewRows.length === 0) return;

    if (csvImportType === 'suppliers') {
      const newVendors: Vendor[] = parsedPreviewRows.map((r) => ({
        id: 'ven_' + Math.random().toString(36).substring(2, 9),
        organizationId: org.id,
        name: r.name,
        contactPerson: r.contactPerson || 'Procurement Office',
        email: r.email || `contact@${r.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        phone: r.phone || '',
        address: r.address || '',
        taxId: r.taxId || '',
        paymentTerms: r.paymentTerms || 'Net 30',
        performanceScore: Number(r.performanceScore) || 90,
        totalDisbursed: 0,
        notes: r.notes || 'Imported via CSV Bulk Tool',
        createdAt: new Date().toISOString(),
      }));

      const res = storageService.bulkImportVendors(newVendors, currentUser);
      setImportSuccessMsg(`Imported ${res.count} new suppliers into your workspace directory!`);
    } else {
      const newPayments: VendorPayment[] = parsedPreviewRows.map((r) => {
        // Match vendor id if existing
        const matchedVendor = vendors.find(
          (v) => v.name.toLowerCase() === r.vendorName.toLowerCase()
        );
        return {
          id: 'vp_imp_' + Math.random().toString(36).substring(2, 9),
          organizationId: org.id,
          vendorId: matchedVendor ? matchedVendor.id : 'ven_adhoc',
          vendorName: r.vendorName,
          purchaseOrderId: r.purchaseOrderId || `PO-HIST-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          amount: Number(r.amount) || 0,
          currency: r.currency || org.currency || 'GBP',
          paymentDate: r.paymentDate || new Date().toISOString().split('T')[0],
          bankReference: r.bankReference,
          status: 'completed',
        };
      });

      const res = storageService.bulkImportVendorPayments(newPayments, currentUser);
      setImportSuccessMsg(`Imported ${res.count} historical supplier payments and updated disbursements!`);
    }

    setParsedPreviewRows([]);
    setCsvRawText('');
    setCsvFileName('');
    refreshAllData();
    setTimeout(() => setImportSuccessMsg(null), 6000);
  };

  // -------------------------------------------------------------
  // SUPPLIER DIRECTORY MODAL
  // -------------------------------------------------------------
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [newVendorName, setNewVendorName] = useState('');
  const [newVendorContact, setNewVendorContact] = useState('');
  const [newVendorEmail, setNewVendorEmail] = useState('');
  const [newVendorPhone, setNewVendorPhone] = useState('');
  const [newVendorAddress, setNewVendorAddress] = useState('');
  const [newVendorTaxId, setNewVendorTaxId] = useState('');
  const [newVendorTerms, setNewVendorTerms] = useState('Net 30');
  const [newVendorScore, setNewVendorScore] = useState(95);
  const [newVendorNotes, setNewVendorNotes] = useState('');

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendorName.trim()) return;

    const v: Vendor = {
      id: 'ven_' + Math.random().toString(36).substring(2, 9),
      organizationId: org.id,
      name: newVendorName.trim(),
      contactPerson: newVendorContact.trim(),
      email: newVendorEmail.trim(),
      phone: newVendorPhone.trim(),
      address: newVendorAddress.trim(),
      taxId: newVendorTaxId.trim(),
      paymentTerms: newVendorTerms,
      performanceScore: Number(newVendorScore) || 90,
      totalDisbursed: 0,
      notes: newVendorNotes.trim(),
      createdAt: new Date().toISOString(),
    };

    storageService.saveVendor(v, currentUser);
    setShowAddSupplierModal(false);
    // Reset
    setNewVendorName('');
    setNewVendorContact('');
    setNewVendorEmail('');
    setNewVendorPhone('');
    setNewVendorAddress('');
    setNewVendorTaxId('');
    setNewVendorNotes('');
    refreshAllData();
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Module Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">
              Supplier & Vendor Management
            </h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
              Procurement & Payouts
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Reconcile pending supplier disbursements via bank transfer references, analyze disbursement trends, and bulk-import suppliers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddSupplierModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Supplier</span>
          </button>
          <button
            onClick={() => setActiveSubTab('import')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span>CSV Bulk Import</span>
          </button>
        </div>
      </div>

      {/* Global Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pending Payouts */}
        <div
          onClick={() => setDrilldownType('pending')}
          className="bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 rounded-xl p-4 space-y-1 transition-all cursor-pointer group shadow-sm hover:shadow-amber-950/20"
          role="button"
          tabIndex={0}
          title="Click to view pending purchase orders & reconciliation queue"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="group-hover:text-slate-300 font-medium">Pending Payouts</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDrilldownType('pending');
              }}
              className="p-1 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 group-hover:scale-110 transition-all border border-amber-500/20"
              title="Drill down into pending payouts"
            >
              <Clock className="w-4 h-4" />
            </button>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400 group-hover:text-amber-300 transition-colors">
            {pendingPayments.length}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
            <span className="truncate">
              {org.currency}{' '}
              {pendingPayments
                .reduce((acc, curr) => acc + curr.totalAmount, 0)
                .toLocaleString()}{' '}
              awaiting bank reconciliation
            </span>
            <span className="text-amber-400 group-hover:translate-x-0.5 transition-transform font-medium shrink-0 ml-1">Details →</span>
          </div>
        </div>

        {/* Card 2: Total Disbursed (YTD) */}
        <div
          onClick={() => setDrilldownType('disbursed')}
          className="bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 rounded-xl p-4 space-y-1 transition-all cursor-pointer group shadow-sm hover:shadow-emerald-950/20"
          role="button"
          tabIndex={0}
          title="Click to view settled disbursements ledger"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="group-hover:text-slate-300 font-medium">Total Disbursed (YTD)</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDrilldownType('disbursed');
              }}
              className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 group-hover:scale-110 transition-all border border-emerald-500/20"
              title="Drill down into settled disbursements"
            >
              <TrendingUp className="w-4 h-4" />
            </button>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 group-hover:text-emerald-300 transition-colors">
            {org.currency} {totalDisbursedYtd.toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
            <span>Across {completedPayments.length} completed bank transfers</span>
            <span className="text-emerald-400 group-hover:translate-x-0.5 transition-transform font-medium">Details →</span>
          </div>
        </div>

        {/* Card 3: Active Suppliers */}
        <div
          onClick={() => setDrilldownType('suppliers')}
          className="bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-4 space-y-1 transition-all cursor-pointer group shadow-sm hover:shadow-indigo-950/20"
          role="button"
          tabIndex={0}
          title="Click to view supplier directory & ratings"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="group-hover:text-slate-300 font-medium">Active Suppliers</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDrilldownType('suppliers');
              }}
              className="p-1 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 group-hover:scale-110 transition-all border border-indigo-500/20"
              title="Drill down into supplier directory"
            >
              <Building2 className="w-4 h-4" />
            </button>
          </div>
          <div className="text-2xl font-bold font-mono text-white group-hover:text-indigo-200 transition-colors">
            {vendors.length}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
            <span>Avg payment terms: Net 30</span>
            <span className="text-indigo-400 group-hover:translate-x-0.5 transition-transform font-medium">Details →</span>
          </div>
        </div>

        {/* Card 4: Avg Payout Size */}
        <div
          onClick={() => setDrilldownType('benchmarks')}
          className="bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 rounded-xl p-4 space-y-1 transition-all cursor-pointer group shadow-sm hover:shadow-cyan-950/20"
          role="button"
          tabIndex={0}
          title="Click to view treasury benchmarks & concentration analysis"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="group-hover:text-slate-300 font-medium">Avg Payout Size</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDrilldownType('benchmarks');
              }}
              className="p-1 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20 group-hover:scale-110 transition-all border border-cyan-500/20"
              title="Drill down into treasury benchmarks"
            >
              <DollarSign className="w-4 h-4" />
            </button>
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-300 group-hover:text-cyan-200 transition-colors">
            {org.currency} {avgDisbursement.toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
            <span>Corporate treasury benchmark</span>
            <span className="text-cyan-400 group-hover:translate-x-0.5 transition-transform font-medium">Details →</span>
          </div>
        </div>
      </div>

      {/* Success Banner */}
      {reconcileSuccessMsg && (
        <div className="p-3.5 bg-emerald-950/60 border border-emerald-800 rounded-xl flex items-center justify-between text-xs text-emerald-300 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{reconcileSuccessMsg}</span>
          </div>
          <button
            onClick={() => setReconcileSuccessMsg(null)}
            className="text-emerald-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {importSuccessMsg && (
        <div className="p-3.5 bg-indigo-950/60 border border-indigo-800 rounded-xl flex items-center justify-between text-xs text-indigo-300 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>{importSuccessMsg}</span>
          </div>
          <button
            onClick={() => setImportSuccessMsg(null)}
            className="text-indigo-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sub Tabs Navigation */}
      <div className="flex border-b border-slate-800 text-xs font-semibold gap-1">
        <button
          onClick={() => setActiveSubTab('reconciliation')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all ${
            activeSubTab === 'reconciliation'
              ? 'border-indigo-500 text-white bg-indigo-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Vendor Payment Reconciliation</span>
          {pendingPayments.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
              {pendingPayments.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('history')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all ${
            activeSubTab === 'history'
              ? 'border-indigo-500 text-white bg-indigo-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Supplier Payment History & Trends</span>
        </button>

        <button
          onClick={() => setActiveSubTab('directory')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all ${
            activeSubTab === 'directory'
              ? 'border-indigo-500 text-white bg-indigo-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Supplier Directory</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-400 font-mono">
            {vendors.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('import')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all ${
            activeSubTab === 'import'
              ? 'border-indigo-500 text-white bg-indigo-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>CSV Bulk Import Tool</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: VENDOR PAYMENT RECONCILIATION */}
      {/* ========================================================= */}
      {activeSubTab === 'reconciliation' && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchReconciliation}
                onChange={(e) => setSearchReconciliation(e.target.value)}
                placeholder="Search PO #, supplier name, amount..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Showing {pendingPayments.length} pending supplier payments</span>
              <button
                onClick={refreshAllData}
                className="p-1.5 text-slate-400 hover:text-white rounded bg-slate-800 hover:bg-slate-700 transition-colors"
                title="Refresh table"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Pending Table */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-medium border-b border-slate-800 select-none">
                <tr>
                  <th className="py-3 px-4">PO Number</th>
                  <th className="py-3 px-4">Supplier / Vendor</th>
                  <th className="py-3 px-4">Items Summary</th>
                  <th className="py-3 px-4">Issue / Delivery Date</th>
                  <th className="py-3 px-4 text-right">Amount Due</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Reconciliation Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {pendingPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
                      <p className="font-semibold text-slate-300">All supplier payments are fully reconciled!</p>
                      <p className="text-xs text-slate-500 mt-1">
                        No pending purchase order disbursements awaiting bank reference confirmation.
                      </p>
                    </td>
                  </tr>
                ) : (
                  pendingPayments.map((po) => {
                    const vendorInfo = vendors.find((v) => v.id === po.vendorId);
                    return (
                      <tr key={po.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-indigo-300">
                          {po.poNumber}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white">{po.vendorName}</div>
                          <div className="text-[11px] text-slate-500">
                            Terms: {vendorInfo?.paymentTerms || 'Net 30'} · Score: {vendorInfo?.performanceScore || 90}/100
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          {po.items.map((i) => `${i.itemName} (x${i.quantity})`).join(', ') || 'Procurement deliverable'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 font-mono">
                          <div>Issued: {po.issueDate}</div>
                          {po.receivedDate && (
                            <div className="text-[11px] text-emerald-400">
                              Delivered: {po.receivedDate.split('T')[0]}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-white text-sm">
                          {po.currency} {po.totalAmount.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                              po.status === 'received'
                                ? 'bg-amber-950/60 text-amber-300 border border-amber-800'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {po.status === 'received' ? 'Goods Received (Due)' : 'Issued'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleOpenReconcileModal(po)}
                            className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm ml-auto transition-all"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark as &apos;Paid&apos;</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: SUPPLIER PAYMENT HISTORY & TRENDS */}
      {/* ========================================================= */}
      {activeSubTab === 'history' && (
        <div className="space-y-6">
          {/* Trends Visualizations */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Trend Chart: Monthly Disbursements Timeline */}
            <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    Supplier Disbursement Trend (Last 6 Months)
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Monthly total disbursements to approved external vendors
                  </p>
                </div>
                <span className="text-xs font-mono font-semibold text-emerald-400">
                  {org.currency} {totalDisbursedYtd.toLocaleString()} Total
                </span>
              </div>

              {/* Bar / Trend visualization */}
              <div className="pt-4">
                <div className="h-44 flex items-end gap-3 pb-2 border-b border-slate-800">
                  {monthlyTrends.map((t, idx) => {
                    const heightPercent = Math.max(12, Math.round((t.amount / maxMonthlyAmount) * 100));
                    const isLatest = idx === monthlyTrends.length - 1;
                    return (
                      <div key={t.month} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                        <span className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          {org.currency} {(t.amount / 1000).toFixed(1)}k
                        </span>
                        <div
                          className={`w-full rounded-t-lg transition-all duration-500 ${
                            isLatest
                              ? 'bg-gradient-to-t from-emerald-600 to-teal-400 shadow-lg shadow-emerald-500/20'
                              : 'bg-gradient-to-t from-indigo-700 to-indigo-500 group-hover:from-indigo-600 group-hover:to-indigo-400'
                          }`}
                          style={{ height: `${heightPercent}%` }}
                        />
                        <span className="text-[11px] font-semibold text-slate-400 group-hover:text-white transition-colors">
                          {t.month}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Vendor Disbursement Breakdown */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-indigo-400" />
                  Disbursements by Supplier
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Share of capital disbursed across suppliers
                </p>
              </div>

              <div className="space-y-3 pt-1">
                {vendorDisbursementBreakdown.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">No payment history yet.</p>
                ) : (
                  vendorDisbursementBreakdown.slice(0, 5).map((v) => {
                    const percent = totalDisbursedYtd > 0 ? Math.round((v.total / totalDisbursedYtd) * 100) : 0;
                    return (
                      <div key={v.vendorName} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-200 truncate max-w-[150px]">{v.vendorName}</span>
                          <span className="font-mono text-slate-300">
                            {org.currency} {v.total.toLocaleString()} ({percent}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Historical Bank Transfers Table */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-center gap-3 flex-1">
                <div className="relative flex-1 max-w-xs">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Search bank ref, vendor name, amount..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <select
                  value={historyVendorFilter}
                  onChange={(e) => setHistoryVendorFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="ALL">All Suppliers</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportPaymentsCsv}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Disbursements CSV</span>
                </button>
              </div>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-medium border-b border-slate-800 select-none">
                  <tr>
                    <th className="py-3 px-4">Payment Date</th>
                    <th className="py-3 px-4">Supplier / Vendor</th>
                    <th className="py-3 px-4">PO Reference</th>
                    <th className="py-3 px-4">Bank Transfer Reference</th>
                    <th className="py-3 px-4 text-right">Amount Disbursed</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {completedPayments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No historical bank transfer disbursements found.
                      </td>
                    </tr>
                  ) : (
                    completedPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="py-3 px-4 text-slate-300 font-mono">
                          {p.paymentDate}
                        </td>
                        <td className="py-3 px-4 font-semibold text-white">
                          {p.vendorName}
                        </td>
                        <td className="py-3 px-4 text-indigo-400 font-mono">
                          {p.purchaseOrderId || 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60 text-[11px]">
                              {p.bankReference}
                            </span>
                            <button
                              onClick={() => handleCopyRef(p.bankReference, p.id)}
                              className="text-slate-500 hover:text-white p-1 rounded transition-colors"
                              title="Copy Bank Reference"
                            >
                              {copiedRefId === p.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-white text-sm">
                          {p.currency} {p.amount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-emerald-950 text-emerald-300 border border-emerald-800">
                            Reconciled & Paid
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: SUPPLIER DIRECTORY */}
      {/* ========================================================= */}
      {activeSubTab === 'directory' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vendors.map((v) => (
              <div
                key={v.id}
                className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-white text-sm">{v.name}</h3>
                    <p className="text-[11px] text-slate-400">{v.contactPerson}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                    {v.paymentTerms}
                  </span>
                </div>

                <div className="text-xs text-slate-400 space-y-1">
                  <div>Email: <span className="text-slate-200">{v.email}</span></div>
                  {v.phone && <div>Phone: <span className="text-slate-200">{v.phone}</span></div>}
                  {v.taxId && <div>Tax ID: <span className="text-slate-200 font-mono">{v.taxId}</span></div>}
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[11px] text-slate-500">Total Disbursed:</span>
                    <div className="font-mono font-bold text-emerald-400">
                      {org.currency} {(v.totalDisbursed || 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-500">Quality Score:</span>
                    <div className="font-mono font-bold text-indigo-300">
                      {v.performanceScore || 95} / 100
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: CSV IMPORT TOOL */}
      {/* ========================================================= */}
      {activeSubTab === 'import' && (
        <div className="space-y-6 bg-slate-900/60 border border-slate-800 rounded-xl p-6">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
              Bulk CSV Importer for Suppliers & Payments
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Upload spreadsheets to bulk-create suppliers or import historical disbursements with automatic ledger reconciliation.
            </p>
          </div>

          {/* Import Mode Selector */}
          <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-200 cursor-pointer">
              <input
                type="radio"
                name="csvType"
                checked={csvImportType === 'suppliers'}
                onChange={() => {
                  setCsvImportType('suppliers');
                  setParsedPreviewRows([]);
                  setCsvError(null);
                }}
                className="text-indigo-600 focus:ring-0"
              />
              <span>Bulk Upload Suppliers Directory</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold text-slate-200 cursor-pointer">
              <input
                type="radio"
                name="csvType"
                checked={csvImportType === 'payments'}
                onChange={() => {
                  setCsvImportType('payments');
                  setParsedPreviewRows([]);
                  setCsvError(null);
                }}
                className="text-indigo-600 focus:ring-0"
              />
              <span>Bulk Upload Historical Bank Transfer Payments</span>
            </label>
          </div>

          {/* Template Download & File Picker */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-950 rounded-xl border border-slate-800">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-white">
                Download Pre-formatted CSV Template
              </div>
              <div className="text-[11px] text-slate-400">
                Ensure your column headers match our automated ingestion schema.
              </div>
            </div>

            <div className="flex items-center gap-2">
              {csvImportType === 'suppliers' ? (
                <button
                  type="button"
                  onClick={handleDownloadSampleSupplierCsv}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Download Suppliers CSV Template</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleDownloadSamplePaymentsCsv}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Download Payments CSV Template</span>
                </button>
              )}
            </div>
          </div>

          {/* Upload Dropzone */}
          <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-8 text-center transition-colors">
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-white">
              {csvFileName ? `Selected: ${csvFileName}` : 'Choose a CSV file to upload'}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Supports UTF-8 encoded .csv files with standard comma-separated columns.
            </p>

            <label className="inline-block mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm transition-colors">
              <span>Select CSV File</span>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Error Notice */}
          {csvError && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl flex items-center gap-2 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{csvError}</span>
            </div>
          )}

          {/* Parsed Preview Table */}
          {parsedPreviewRows.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">
                  Preview Ingest Data ({parsedPreviewRows.length} valid rows detected)
                </span>
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirm & Import Records</span>
                </button>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-x-auto max-h-64 bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 font-medium border-b border-slate-800">
                    <tr>
                      {Object.keys(parsedPreviewRows[0]).map((key) => (
                        <th key={key} className="py-2.5 px-3 uppercase text-[10px] tracking-wider">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {parsedPreviewRows.slice(0, 10).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/40">
                        {Object.values(row).map((val: any, vIdx) => (
                          <td key={vIdx} className="py-2 px-3 text-slate-300 truncate max-w-[200px]">
                            {String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedPreviewRows.length > 10 && (
                <p className="text-[11px] text-slate-500">
                  Showing first 10 of {parsedPreviewRows.length} total rows.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: RECONCILE PENDING SUPPLIER PAYMENT */}
      {/* ========================================================= */}
      {selectedPOToReconcile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden text-slate-100">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  Reconcile Supplier Bank Transfer
                </h3>
              </div>
              <button
                onClick={() => setSelectedPOToReconcile(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReconcilePayment} className="p-6 space-y-4">
              {/* PO Summary Card */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Purchase Order:</span>
                  <span className="font-mono font-bold text-indigo-400">
                    {selectedPOToReconcile.poNumber}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Supplier:</span>
                  <span className="font-semibold text-white">
                    {selectedPOToReconcile.vendorName}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                  <span className="text-slate-400">Total Disbursement Due:</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    {selectedPOToReconcile.currency}{' '}
                    {selectedPOToReconcile.totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Form Inputs */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Bank Transfer Reference / Transaction ID <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={reconcileBankRef}
                  onChange={(e) => setReconcileBankRef(e.target.value)}
                  placeholder="e.g. WIRE-2026-BARC-8819 or ACH-99214"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-emerald-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Record the bank wire or BACS reference number for formal audit reconciliation.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Disbursement Date
                  </label>
                  <input
                    type="date"
                    required
                    value={reconcileDate}
                    onChange={(e) => setReconcileDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Transfer Rail
                  </label>
                  <select
                    value={reconcileMethod}
                    onChange={(e: any) => setReconcileMethod(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Wire Transfer">Wire Transfer (Fedwire / SWIFT)</option>
                    <option value="BACS">BACS Direct Credit</option>
                    <option value="CHAPS">CHAPS Same-Day</option>
                    <option value="ACH">ACH Electronic Payout</option>
                    <option value="SEPA">SEPA Instant Euro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Disbursing Treasury Account
                </label>
                <input
                  type="text"
                  value={reconcileAccount}
                  onChange={(e) => setReconcileAccount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Reconciliation Notes
                </label>
                <textarea
                  rows={2}
                  value={reconcileNotes}
                  onChange={(e) => setReconcileNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedPOToReconcile(null)}
                  className="px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  {isSubmittingPayment ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>Confirm & Mark as Paid</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD NEW SUPPLIER */}
      {/* ========================================================= */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden text-slate-100">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">
                  Add New Approved Supplier
                </h3>
              </div>
              <button
                onClick={() => setShowAddSupplierModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Supplier / Company Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newVendorName}
                  onChange={(e) => setNewVendorName(e.target.value)}
                  placeholder="e.g. AWS Cloud Services UK"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={newVendorContact}
                    onChange={(e) => setNewVendorContact(e.target.value)}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Billing Email
                  </label>
                  <input
                    type="email"
                    value={newVendorEmail}
                    onChange={(e) => setNewVendorEmail(e.target.value)}
                    placeholder="billing@vendor.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Payment Terms
                  </label>
                  <select
                    value={newVendorTerms}
                    onChange={(e) => setNewVendorTerms(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 45">Net 45</option>
                    <option value="Net 60">Net 60</option>
                    <option value="Due on Receipt">Due on Receipt</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tax / VAT ID
                  </label>
                  <input
                    type="text"
                    value={newVendorTaxId}
                    onChange={(e) => setNewVendorTaxId(e.target.value)}
                    placeholder="GB-VAT-12345678"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Physical Office Address
                </label>
                <input
                  type="text"
                  value={newVendorAddress}
                  onChange={(e) => setNewVendorAddress(e.target.value)}
                  placeholder="Street, City, Postcode"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Procurement Notes
                </label>
                <textarea
                  rows={2}
                  value={newVendorNotes}
                  onChange={(e) => setNewVendorNotes(e.target.value)}
                  placeholder="Primary products, SLA agreements, or delivery notes..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddSupplierModal(false)}
                  className="px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KPI Drilldown Popup Modal */}
      <VendorKpiDrilldownModal
        isOpen={drilldownType !== null}
        onClose={() => setDrilldownType(null)}
        type={drilldownType || 'pending'}
        purchaseOrders={purchaseOrders}
        payments={payments}
        vendors={vendors}
        org={org}
        currentUser={currentUser}
        onOpenReconcileModal={handleOpenReconcileModal}
        onOpenAddSupplier={() => setShowAddSupplierModal(true)}
      />
    </div>
  );
};
