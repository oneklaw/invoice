import React, { useState } from 'react';
import { X, Plus, Trash2, Save, Sparkles, AlertCircle, ArrowLeftRight } from 'lucide-react';
import { Client, Invoice, InvoiceItem, OrganizationSettings, User } from '../../types';
import { storageService } from '../../services/storage';
import { CurrencySelect } from '../currency/CurrencySelect';
import { currencyService } from '../../services/currencyService';
import { googleDriveService } from '../../services/googleDriveService';

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

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewCurrency, setPreviewCurrency] = useState<string>(currency === 'USD' ? 'EUR' : 'USD');
  const [showFxPreview, setShowFxPreview] = useState<boolean>(false);

  if (!isOpen) return null;

  // Role verification: Viewers cannot create or edit invoices
  const canEdit = ['super_admin', 'org_admin', 'invoice_editor'].includes(currentUser.role);

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      setClientName(client.name);
      setClientEmail(client.email);
      setClientAddress(`${client.address}, ${client.city}, ${client.country}`);
      if (client.currency) setCurrency(client.currency);
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
    const newItem: InvoiceItem = {
      id: 'item_' + Math.random().toString(36).substring(2, 7),
      description: 'Consulting & Deliverables',
      quantity: 1,
      unitPrice: 500,
      taxRate: 0,
      discountRate: 0,
      amount: 500,
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
      createdAt: initialInvoice?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const res = storageService.saveInvoice(invoicePayload, currentUser);
    if (!res.success) {
      if (res.error?.includes('QUOTA_EXCEEDED')) {
        onTriggerUpgrade();
      } else {
        setErrorMessage(res.error || 'Failed to save invoice');
      }
      return;
    }

    // Google Drive Automated Pipeline: Save a copy of every generated invoice as a PDF into designated Drive folder
    if (org.googleDriveIntegration?.enabled && org.googleDriveIntegration?.autoUploadOnInvoiceCreate) {
      googleDriveService.uploadInvoicePdfToDrive(invoicePayload, org, currentUser).catch((err) => {
        console.warn('Google Drive automated background pipeline note:', err);
      });
    }

    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40 shrink-0">
          <div>
            <h2 className="text-base font-bold text-white">
              {isEditing ? `Edit Invoice ${invoiceNumber}` : 'Create New Invoice'}
            </h2>
            <p className="text-xs text-slate-400">
              Tenant: <span className="text-indigo-400">{org.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMessage && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-lg text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Top Invoice Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-950/50 p-4 rounded-lg border border-slate-800">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Invoice Number</label>
              <input
                type="text"
                required
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <CurrencySelect
                label="Currency"
                value={currency}
                onChange={setCurrency}
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Issue Date</label>
              <input
                type="date"
                required
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Due Date</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Client Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Select Existing Client</label>
              <select
                value={selectedClientId}
                onChange={(e) => handleClientSelect(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.email})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Client Name / Business</label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Client Email Address</label>
              <input
                type="email"
                required
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Client Billing Address</label>
            <input
              type="text"
              value={clientAddress}
              onChange={(e) => setClientAddress(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              placeholder="Full address, city, country..."
            />
          </div>

          {/* Line Items Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Line Items
              </h3>
              <button
                type="button"
                onClick={addItemRow}
                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item Row</span>
              </button>
            </div>

            <div className="border border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-medium border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-2 w-20 text-right">Qty</th>
                    <th className="py-2.5 px-2 w-28 text-right">Rate</th>
                    <th className="py-2.5 px-2 w-20 text-right">Tax %</th>
                    <th className="py-2.5 px-2 w-20 text-right">Disc %</th>
                    <th className="py-2.5 px-3 w-28 text-right">Total</th>
                    <th className="py-2.5 px-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          required
                          value={item.description}
                          onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(item.id, 'quantity', Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-right text-slate-200 font-mono tabular-nums focus:outline-none focus:border-indigo-500"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(item.id, 'unitPrice', Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-right text-slate-200 font-mono tabular-nums focus:outline-none focus:border-indigo-500"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          value={item.taxRate}
                          onChange={(e) => handleItemChange(item.id, 'taxRate', Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-right text-slate-200 font-mono tabular-nums focus:outline-none focus:border-indigo-500"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          value={item.discountRate}
                          onChange={(e) => handleItemChange(item.id, 'discountRate', Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-right text-slate-200 font-mono tabular-nums focus:outline-none focus:border-indigo-500"
                        />
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-medium text-slate-200 tabular-nums">
                        {currency} {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeItemRow(item.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Notes & Calculated Totals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Invoice Notes & Delivery Instructions</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                placeholder="Add special instructions, purchase order notes or remittance codes..."
              />
            </div>

            <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal:</span>
                <span className="font-mono text-slate-200 tabular-nums">{currency} {subtotal.toFixed(2)}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-rose-400">
                  <span>Discount:</span>
                  <span className="font-mono tabular-nums">-{currency} {totalDiscount.toFixed(2)}</span>
                </div>
              )}
              {totalTax > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>Taxes:</span>
                  <span className="font-mono text-slate-200 tabular-nums">+{currency} {totalTax.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-800">
                <span>Grand Total:</span>
                <span className="font-mono text-indigo-400 tabular-nums">{currency} {grandTotal.toFixed(2)}</span>
              </div>

              {/* Currency Conversion Preview */}
              <div className="pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setShowFxPreview(!showFxPreview)}
                  className="w-full flex items-center justify-between text-[11px] text-slate-400 hover:text-indigo-300 transition-colors py-0.5"
                >
                  <span className="flex items-center gap-1">
                    <ArrowLeftRight className="w-3 h-3 text-indigo-400" />
                    <span>Currency Conversion Preview</span>
                  </span>
                  <span className="text-[10px] text-indigo-400 font-mono">
                    {showFxPreview ? 'Hide' : 'Show Equivalent'}
                  </span>
                </button>

                {showFxPreview && (
                  <div className="mt-2 p-2.5 bg-slate-900 border border-slate-800 rounded-lg space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] text-slate-400">Equivalent in:</span>
                      <div className="w-40">
                        <CurrencySelect
                          value={previewCurrency}
                          onChange={setPreviewCurrency}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs font-mono font-bold text-emerald-400 pt-1.5 border-t border-slate-800">
                      <span className="text-slate-400 font-sans font-normal text-[11px]">Converted:</span>
                      <span>
                        {currencyService.getCurrency(previewCurrency).symbol}{' '}
                        {currencyService.convertAmount(grandTotal, currency, previewCurrency).toLocaleString(undefined, { minimumFractionDigits: 2 })} {previewCurrency}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 text-right">
                      1 {currency} = {currencyService.getExchangeRate(currency, previewCurrency).toFixed(4)} {previewCurrency}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Save Invoice Changes' : 'Generate & Issue Invoice'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
