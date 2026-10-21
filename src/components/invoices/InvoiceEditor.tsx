import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  Trash2,
  Save,
  Sparkles,
  AlertCircle,
  ArrowLeftRight,
  Mic,
  MicOff,
  Globe,
  Repeat,
  Percent,
  Users,
  Check,
  CheckCircle2,
} from 'lucide-react';
import { Client, Invoice, InvoiceItem, OrganizationSettings, User } from '../../types';
import { storageService } from '../../services/storage';
import { CurrencySelect } from '../currency/CurrencySelect';
import { currencyService } from '../../services/currencyService';
import { googleDriveService } from '../../services/googleDriveService';
import { aiService } from '../../services/aiService';

interface InvoiceEditorProps {
  isOpen: boolean;
  onClose: () => void;
  org: OrganizationSettings;
  clients: Client[];
  currentUser: User;
  initialInvoice?: Invoice | null;
  onSaved: () => void;
  onTriggerUpgrade: () => void;
}

// Regional standard tax rates mapping
const REGIONAL_TAX_RATES: Record<string, number> = {
  'United Kingdom': 20,
  'UK': 20,
  'Germany': 19,
  'France': 20,
  'Kenya': 16,
  'Canada': 5,
  'Australia': 10,
  'Japan': 10,
  'United Arab Emirates': 5,
  'Saudi Arabia': 15,
  'Spain': 21,
  'Italy': 22,
  'United States': 0, // State-level sales tax handled separately
};

export const InvoiceEditor: React.FC<InvoiceEditorProps> = ({
  isOpen,
  onClose,
  org,
  clients,
  currentUser,
  initialInvoice,
  onSaved,
  onTriggerUpgrade,
}) => {
  const isEditing = Boolean(initialInvoice);

  // Form State
  const [invoiceNumber, setInvoiceNumber] = useState(
    initialInvoice?.invoiceNumber || `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`
  );
  const [selectedClientId, setSelectedClientId] = useState(initialInvoice?.clientId || clients[0]?.id || '');
  const [clientName, setClientName] = useState(initialInvoice?.clientName || clients[0]?.name || '');
  const [clientEmail, setClientEmail] = useState(initialInvoice?.clientEmail || clients[0]?.email || '');
  const [clientAddress, setClientAddress] = useState(initialInvoice?.clientAddress || clients[0]?.address || '');
  const [clientCountry, setClientCountry] = useState(clients[0]?.country || 'United Kingdom');
  
  // Multi-Currency issuance toggle
  const [isMultiCurrency, setIsMultiCurrency] = useState(initialInvoice?.currency ? initialInvoice.currency !== org.currency : false);
  const [currency, setCurrency] = useState(initialInvoice?.currency || org.currency || 'USD');

  const [issueDate, setIssueDate] = useState(initialInvoice?.issueDate || new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(
    initialInvoice?.dueDate ||
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [poNumber, setPoNumber] = useState(initialInvoice?.poNumber || '');
  const [notes, setNotes] = useState(initialInvoice?.notes || '');
  const [items, setItems] = useState<InvoiceItem[]>(
    initialInvoice?.items || [
      {
        id: 'item_1',
        description: 'Professional Cloud Consulting & Implementation Services',
        quantity: 1,
        unitPrice: 2500,
        taxRate: 0,
        discountRate: 0,
        amount: 2500,
      },
    ]
  );

  // Recurring & Automation
  const [isRecurring, setIsRecurring] = useState(Boolean(initialInvoice?.isRecurring));
  const [recurringInterval, setRecurringInterval] = useState<'daily' | 'weekly' | 'monthly'>(initialInvoice?.recurringInterval || 'monthly');
  const [autoSendRecurring, setAutoSendRecurring] = useState(initialInvoice?.autoSendRecurring ?? true);

  // Regional Tax breakdown toggle
  const [showTaxBreakdown, setShowTaxBreakdown] = useState(initialInvoice?.regionalTaxDetails?.showBreakdown ?? true);

  // Smart Draft & AI
  const [isGeneratingSmartDraft, setIsGeneratingSmartDraft] = useState(false);

  // Voice Dictation
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingTargetIndex, setRecordingTargetIndex] = useState<number | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Role verification: Viewers cannot create or edit invoices
  const canEdit = ['super_admin', 'org_admin', 'invoice_editor'].includes(currentUser.role);

  // Selected client reference
  const selectedClient = clients.find((c) => c.id === selectedClientId) || clients[0];

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      setClientName(client.name);
      setClientEmail(client.email);
      setClientAddress(`${client.address}, ${client.city}, ${client.country}`);
      setClientCountry(client.country);
      if (client.currency && isMultiCurrency) {
        setCurrency(client.currency);
      }
    }
  };

  // Regional Tax Calculator
  const handleApplyRegionalTax = () => {
    const rate = REGIONAL_TAX_RATES[clientCountry] ?? 10;
    setItems((prev) =>
      prev.map((item) => {
        const qty = Number(item.quantity) || 0;
        const price = Number(item.unitPrice) || 0;
        const discount = Number(item.discountRate) || 0;
        const baseTotal = qty * price;
        const discounted = baseTotal * (1 - discount / 100);
        const withTax = discounted * (1 + rate / 100);
        return {
          ...item,
          taxRate: rate,
          amount: Number(withTax.toFixed(2)),
        };
      })
    );
  };

  // AI Smart Draft
  const handleSmartDraft = async () => {
    if (!selectedClient) return;
    setIsGeneratingSmartDraft(true);
    try {
      const pastInvoices = storageService.getInvoices(org.id);
      const generated = await aiService.generateSmartDraftItems(selectedClient, pastInvoices);
      if (generated && generated.length > 0) {
        setItems(generated);
      }
    } catch (err) {
      console.warn('Smart draft error:', err);
    } finally {
      setIsGeneratingSmartDraft(false);
    }
  };

  // Voice Dictation using Web Speech API
  const handleStartVoiceDictation = (index: number) => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported by your current browser.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsRecordingVoice(true);
      setRecordingTargetIndex(index);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setItems((prev) =>
            prev.map((item, idx) => (idx === index ? { ...item, description: transcript } : item))
          );
        }
        setIsRecordingVoice(false);
        setRecordingTargetIndex(null);
      };

      recognition.onerror = () => {
        setIsRecordingVoice(false);
        setRecordingTargetIndex(null);
      };

      recognition.onend = () => {
        setIsRecordingVoice(false);
        setRecordingTargetIndex(null);
      };

      recognition.start();
    } catch (err) {
      console.warn('Voice recognition initialization error:', err);
      setIsRecordingVoice(false);
      setRecordingTargetIndex(null);
    }
  };

  const handleItemChange = (
    id: string,
    field: keyof InvoiceItem,
    val: string | number
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, [field]: val };
        const qty = Number(updated.quantity) || 0;
        const price = Number(updated.unitPrice) || 0;
        const discount = Number(updated.discountRate) || 0;
        const tax = Number(updated.taxRate) || 0;

        const baseTotal = qty * price;
        const discounted = baseTotal * (1 - discount / 100);
        const withTax = discounted * (1 + tax / 100);

        updated.amount = Number(withTax.toFixed(2));
        return updated;
      })
    );
  };

  const addItemRow = () => {
    const defaultTax = REGIONAL_TAX_RATES[clientCountry] ?? 0;
    const newItem: InvoiceItem = {
      id: 'item_' + Math.random().toString(36).substring(2, 7),
      description: 'Consulting & Technical Deliverables',
      quantity: 1,
      unitPrice: 500,
      taxRate: defaultTax,
      discountRate: 0,
      amount: defaultTax > 0 ? Number((500 * (1 + defaultTax / 100)).toFixed(2)) : 500,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const removeItemRow = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);
  const totalDiscount = items.reduce((sum, item) => {
    const base = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
    return sum + base * ((Number(item.discountRate) || 0) / 100);
  }, 0);
  const totalTax = items.reduce((sum, item) => {
    const base = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
    const afterDisc = base * (1 - (Number(item.discountRate) || 0) / 100);
    return sum + afterDisc * ((Number(item.taxRate) || 0) / 100);
  }, 0);
  const grandTotal = Number((subtotal - totalDiscount + totalTax).toFixed(2));

  // Multi-currency FX conversion back to base org currency
  const baseCurrencyEquivalent = currency !== org.currency
    ? currencyService.convertAmount(grandTotal, currency, org.currency)
    : grandTotal;
  const currentFxRate = currencyService.getRate(currency, org.currency);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!canEdit) {
      setErrorMessage(`Your role '${currentUser.role}' does not have permission to create or edit invoices.`);
      return;
    }

    if (items.length === 0) {
      setErrorMessage('Please add at least one line item.');
      return;
    }

    // Check quota if creating new invoice
    if (!isEditing) {
      const quota = storageService.checkQuota(org.id);
      if (!quota.allowed) {
        onTriggerUpgrade();
        return;
      }
    }

    // Next recurring date calculation
    let nextDate: string | undefined = undefined;
    if (isRecurring) {
      const d = new Date(dueDate);
      if (recurringInterval === 'daily') d.setDate(d.getDate() + 1);
      else if (recurringInterval === 'weekly') d.setDate(d.getDate() + 7);
      else d.setMonth(d.getMonth() + 1);
      nextDate = d.toISOString().split('T')[0];
    }

    const regionalTaxRate = REGIONAL_TAX_RATES[clientCountry] ?? (totalTax > 0 ? (totalTax / subtotal) * 100 : 0);

    const invoicePayload: Invoice = {
      id: initialInvoice?.id || 'inv_' + Math.random().toString(36).substring(2, 9),
      organizationId: org.id,
      invoiceNumber,
      status: initialInvoice?.status || 'sent',
      issueDate,
      dueDate,
      poNumber: poNumber || undefined,
      currency,
      clientId: selectedClientId,
      clientName,
      clientEmail,
      clientAddress,
      items,
      subtotal: Number(subtotal.toFixed(2)),
      totalDiscount: Number(totalDiscount.toFixed(2)),
      totalTax: Number(totalTax.toFixed(2)),
      shippingFee: 0,
      totalAmount: grandTotal,
      notes: notes || undefined,
      isRecurring,
      recurringInterval: isRecurring ? recurringInterval : undefined,
      recurringNextDate: nextDate,
      autoSendRecurring: isRecurring ? autoSendRecurring : undefined,
      tags: initialInvoice?.tags || (isRecurring ? ['Recurring'] : []),
      regionalTaxDetails: {
        country: clientCountry,
        vatRate: regionalTaxRate,
        vatAmount: totalTax,
        showBreakdown: showTaxBreakdown,
      },
      createdAt: initialInvoice?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save version history if editing
    if (isEditing) {
      storageService.saveInvoiceVersion(
        invoicePayload.id,
        org.id,
        `Updated line items and details by ${currentUser.name}`,
        currentUser
      );
    }

    const res = storageService.saveInvoice(invoicePayload, currentUser);
    if (!res.success) {
      if (res.error?.includes('QUOTA_EXCEEDED')) {
        onTriggerUpgrade();
      } else {
        setErrorMessage(res.error || 'Failed to save invoice');
      }
      return;
    }

    // Google Drive Automated Pipeline: Save PDF into designated Drive folder when invoice is marked 'sent'
    if (org.googleDriveIntegration?.enabled && invoicePayload.status === 'sent') {
      googleDriveService.uploadInvoicePdfToDrive(invoicePayload, org, currentUser).catch((err) => {
        console.warn('Google Drive automated background pipeline note:', err);
      });
    }

    // Trigger workflow automator
    storageService.triggerWorkflow('invoice_created', org.id, { invoiceId: invoicePayload.id });

    onSaved();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
        {/* Header with Collaborative Presence Indicator */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-base font-bold text-white">
                {isEditing ? `Edit Invoice ${invoiceNumber}` : 'Create New Invoice'}
              </h2>
              <p className="text-xs text-slate-400">
                Tenant: <span className="text-indigo-400 font-semibold">{org.name}</span>
              </p>
            </div>

            {/* Real-time Presence Indicator */}
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-800">
              <div className="flex -space-x-1.5 overflow-hidden">
                <div
                  className="inline-block h-6 w-6 rounded-full ring-2 ring-slate-900 bg-indigo-600 text-[10px] font-bold text-center leading-6 text-white"
                  title={`${currentUser.name} (Active Editor)`}
                >
                  {currentUser.name.charAt(0)}
                </div>
                <div
                  className="inline-block h-6 w-6 rounded-full ring-2 ring-slate-900 bg-emerald-600 text-[10px] font-bold text-center leading-6 text-white"
                  title="Collaborative Presence: Real-time multi-tenant sync"
                >
                  SY
                </div>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Collaborating</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Gemini Smart Draft Button */}
            <button
              type="button"
              onClick={handleSmartDraft}
              disabled={isGeneratingSmartDraft}
              className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
              title="Use Gemini to auto-complete line items based on past customer purchases"
            >
              <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: isGeneratingSmartDraft ? '1s' : '0s' }} />
              <span>{isGeneratingSmartDraft ? 'Analyzing...' : 'AI Smart Draft'}</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="bg-rose-950/80 border-b border-rose-800 px-6 py-2.5 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top row: Client selection & Invoice metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
            {/* Client selection */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-300">
                Customer / Client
              </label>
              {clients.length > 0 ? (
                <select
                  value={selectedClientId}
                  onChange={(e) => handleClientSelect(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.companyName ? `(${c.companyName})` : ''} · {c.country}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-xs text-amber-400">
                  No clients created yet. Fill details manually below.
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-xs">
                <input
                  type="text"
                  placeholder="Client Name"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                />
                <input
                  type="email"
                  placeholder="Billing Email"
                  required
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>

              <input
                type="text"
                placeholder="Billing Address & Country"
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
              />

              {/* Regional Tax Auto-Apply Helper */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">
                  Client Country: <strong className="text-slate-200">{clientCountry}</strong>
                </span>
                <button
                  type="button"
                  onClick={handleApplyRegionalTax}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                >
                  <Percent className="w-3 h-3" />
                  <span>Auto-Apply Regional Tax ({REGIONAL_TAX_RATES[clientCountry] ?? 10}%)</span>
                </button>
              </div>
            </div>

            {/* Invoice meta & Multi-Currency */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Invoice Number
                  </label>
                  <input
                    type="text"
                    required
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    PO / Ref Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. PO-98124"
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Issue Date
                  </label>
                  <input
                    type="date"
                    required
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Payment Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                  />
                </div>
              </div>

              {/* Multi-Currency Toggle & Live FX Rates */}
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-xs font-semibold text-slate-200">Multi-Currency Billing</span>
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isMultiCurrency}
                      onChange={(e) => {
                        setIsMultiCurrency(e.target.checked);
                        if (!e.target.checked) setCurrency(org.currency);
                      }}
                      className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                    />
                    <span className="text-[11px] text-slate-300">Custom Currency</span>
                  </label>
                </div>

                {isMultiCurrency ? (
                  <div className="space-y-1.5">
                    <CurrencySelect
                      label="Issuance Currency"
                      value={currency}
                      onChange={setCurrency}
                    />
                    {currency !== org.currency && (
                      <div className="text-[10px] text-indigo-300 font-mono flex items-center justify-between">
                        <span>Live FX Rate: 1 {currency} = {currentFxRate.toFixed(4)} {org.currency}</span>
                        <span>Auto-Calculated</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 font-mono">
                    Billing in Base Operating Currency: <strong>{org.currency}</strong>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Automation: Recurring Invoicing Scheduler */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                  isRecurring ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  <Repeat className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Invoice Automation
                    </span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-semibold ${
                      isRecurring
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      {isRecurring ? 'ACTIVE RECURRING' : 'MANUAL ONE-TIME'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Schedule automated recurring invoice generation and dispatch via background worker.
                  </p>
                </div>
              </div>

              {/* Automation Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                <span className="ml-2.5 text-xs font-semibold text-slate-300">
                  {isRecurring ? 'Automation Enabled' : 'Enable Automation'}
                </span>
              </label>
            </div>

            {isRecurring && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80 animate-in fade-in">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Recurring Frequency
                  </label>
                  <select
                    value={recurringInterval}
                    onChange={(e: any) => setRecurringInterval(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                  >
                    <option value="daily">Daily Schedule (Every 24 Hours)</option>
                    <option value="weekly">Weekly Schedule (Every 7 Days)</option>
                    <option value="monthly">Monthly Recurring (Net 30 Billing)</option>
                  </select>
                </div>
                <div className="sm:col-span-2 flex flex-col justify-center space-y-1 pt-1">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoSendRecurring}
                      onChange={(e) => setAutoSendRecurring(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                    />
                    <span>Automatically email generated invoice PDF to {clientEmail || 'client'}</span>
                  </label>
                  <div className="text-[11px] text-indigo-400 font-mono">
                    Next run scheduled: {
                      (() => {
                        const d = new Date(dueDate || Date.now());
                        if (recurringInterval === 'daily') d.setDate(d.getDate() + 1);
                        else if (recurringInterval === 'weekly') d.setDate(d.getDate() + 7);
                        else d.setMonth(d.getMonth() + 1);
                        return d.toISOString().split('T')[0];
                      })()
                    } via Cloud Scheduler
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Line Items Table with Voice Dictation */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Line Items & Billable Deliverables
                </h3>
                {isRecordingVoice && (
                  <span className="text-[11px] text-rose-400 animate-pulse flex items-center gap-1 font-mono">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Listening...
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={addItemRow}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1 border border-slate-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-2 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800 items-center text-xs"
                >
                  {/* Description with Voice Dictation button */}
                  <div className="col-span-12 md:col-span-5 relative flex items-center">
                    <input
                      type="text"
                      placeholder="Item / service description..."
                      required
                      value={item.description}
                      onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-3 pr-8 py-1.5 text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleStartVoiceDictation(idx)}
                      className={`absolute right-2 p-1 rounded transition-colors ${
                        isRecordingVoice && recordingTargetIndex === idx
                          ? 'text-rose-400 bg-rose-950/60'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="Dictate line item via voice"
                    >
                      {isRecordingVoice && recordingTargetIndex === idx ? (
                        <MicOff className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                      ) : (
                        <Mic className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Quantity */}
                  <div className="col-span-3 md:col-span-2">
                    <input
                      type="number"
                      min="1"
                      step="any"
                      placeholder="Qty"
                      required
                      value={item.quantity}
                      onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono text-center"
                    />
                  </div>

                  {/* Unit Price */}
                  <div className="col-span-3 md:col-span-2">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="Price"
                      required
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(item.id, 'unitPrice', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono text-right"
                    />
                  </div>

                  {/* Tax Rate % */}
                  <div className="col-span-3 md:col-span-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="Tax %"
                      value={item.taxRate}
                      onChange={(e) => handleItemChange(item.id, 'taxRate', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-1.5 text-xs text-white font-mono text-center"
                      title="Tax %"
                    />
                  </div>

                  {/* Amount total & Delete */}
                  <div className="col-span-3 md:col-span-2 flex items-center justify-end gap-2">
                    <span className="font-mono font-semibold text-white tabular-nums">
                      {currency} {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItemRow(item.id)}
                      disabled={items.length <= 1}
                      className="p-1 text-slate-500 hover:text-rose-400 disabled:opacity-30 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Row: Notes & Financial Totals Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-300">
                Payment Notes & Bank Instructions
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Specific instructions for client payment or PO delivery..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
              />

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="taxBreakdown"
                  checked={showTaxBreakdown}
                  onChange={(e) => setShowTaxBreakdown(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <label htmlFor="taxBreakdown" className="text-xs text-slate-400 cursor-pointer">
                  Display regional VAT/GST tax breakdown on generated invoice document
                </label>
              </div>
            </div>

            {/* Totals Summary */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal:</span>
                <span className="font-mono text-white">
                  {currency} {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              {totalDiscount > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>Discounts Applied:</span>
                  <span className="font-mono text-emerald-400">
                    -{currency} {totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              {totalTax > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>Regional Tax ({clientCountry}):</span>
                  <span className="font-mono text-slate-300">
                    +{currency} {totalTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                <span className="text-sm font-bold text-white">Total Amount Due:</span>
                <span className="text-lg font-bold font-mono text-indigo-400">
                  {currency} {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Multi-Currency Base Org Equivalent */}
              {currency !== org.currency && (
                <div className="pt-1 text-[11px] text-slate-400 font-mono flex justify-between border-t border-slate-800/50">
                  <span>Base Org Equivalent ({org.currency}):</span>
                  <span className="text-slate-300">
                    {org.currency} {baseCurrencyEquivalent.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'Save Changes' : 'Issue & Dispatch Invoice'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
