import React, { useState } from 'react';
import {
  Upload,
  Image,
  Save,
  CheckCircle,
  Building,
  CreditCard,
  FileText,
  DollarSign,
  Palette,
  Shield,
  Trash2,
} from 'lucide-react';
import { InvoiceAccentColor, InvoiceTheme, OrganizationSettings, User } from '../../types';
import { storageService } from '../../services/storage';

interface CustomizationSettingsProps {
  org: OrganizationSettings;
  currentUser: User;
  onSaved: () => void;
}

export const CustomizationSettings: React.FC<CustomizationSettingsProps> = ({
  org,
  currentUser,
  onSaved,
}) => {
  const [formData, setFormData] = useState<OrganizationSettings>(org);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Role permissions: Only org_admin or super_admin can alter organization branding & banking
  const canManage = ['super_admin', 'org_admin'].includes(currentUser.role);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({
        ...prev,
        logoUrl: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setFormData((prev) => ({
      ...prev,
      logoUrl: '',
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) {
      alert(`Role '${currentUser.role}' does not have permission to modify organization settings.`);
      return;
    }

    storageService.saveOrganization(formData, currentUser);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    onSaved();
  };

  const accentColors: { id: InvoiceAccentColor; label: string; class: string }[] = [
    { id: 'indigo', label: 'Indigo', class: 'bg-indigo-600' },
    { id: 'emerald', label: 'Emerald', class: 'bg-emerald-600' },
    { id: 'rose', label: 'Rose', class: 'bg-rose-600' },
    { id: 'amber', label: 'Amber', class: 'bg-amber-600' },
    { id: 'cyan', label: 'Cyan', class: 'bg-cyan-600' },
    { id: 'slate', label: 'Slate', class: 'bg-slate-700' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Invoice Customization & Branding</h1>
          <p className="text-xs text-slate-400 mt-1">
            Personalize your invoices with your company logo, payment terms, and custom bank accounts.
          </p>
        </div>

        <button
          type="submit"
          disabled={!canManage}
          className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg shadow-sm transition-colors self-start sm:self-auto"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Changes</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>Invoice customizations saved successfully. Audit trail updated.</span>
        </div>
      )}

      {/* 1. Brand Logo & Visual Styling */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Palette className="w-4 h-4 text-indigo-400" />
          <span>1. Visual Appearance & Brand Logo</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Logo Upload */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">Organization Logo</label>
            <div className="flex items-center gap-4">
              <div className="w-32 h-20 rounded-lg border-2 border-dashed border-slate-700 bg-slate-950 flex items-center justify-center overflow-hidden p-2">
                {formData.logoUrl ? (
                  <img
                    src={formData.logoUrl}
                    alt="Logo Preview"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="text-center text-slate-500">
                    <Image className="w-6 h-6 mx-auto mb-1 opacity-50" />
                    <span className="text-[10px]">No Logo</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg cursor-pointer transition-colors border border-slate-700">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Logo Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
                {formData.logoUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="block text-[11px] text-rose-400 hover:text-rose-300 transition-colors"
                  >
                    Remove Logo
                  </button>
                )}
                <div className="text-[10px] text-slate-500">
                  Recommended: PNG or SVG, min 300px wide on transparent background.
                </div>
              </div>
            </div>
          </div>

          {/* Accent Color & Theme */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">Invoice Accent Color</label>
              <div className="flex items-center gap-3">
                {accentColors.map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, accentColor: color.id })}
                    className={`w-7 h-7 rounded-full ${color.class} flex items-center justify-center transition-transform ${
                      formData.accentColor === color.id ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : 'opacity-70 hover:opacity-100'
                    }`}
                    title={color.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Invoice Layout Design</label>
              <select
                value={formData.invoiceTheme}
                onChange={(e) => setFormData({ ...formData, invoiceTheme: e.target.value as InvoiceTheme })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="modern">Modern Minimalist (High-Contrast Header)</option>
                <option value="classic">Corporate Classic (Structured Borders)</option>
                <option value="slate">Tech Slate (Dark Monospace Data Elements)</option>
                <option value="minimal">Ultra Clean (Light Architectural Style)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Business Entity Information */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Building className="w-4 h-4 text-indigo-400" />
          <span>2. Legal Business Entity & Tax Details</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Company Display Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Legal Registered Name</label>
            <input
              type="text"
              required
              value={formData.legalName}
              onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Tax ID / VAT / GST / EIN</label>
            <input
              type="text"
              required
              value={formData.taxId}
              onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Primary Operating Currency</label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
            >
              <option value="USD">USD ($ - United States Dollar)</option>
              <option value="EUR">EUR (€ - Euro)</option>
              <option value="GBP">GBP (£ - British Pound)</option>
              <option value="JPY">JPY (¥ - Japanese Yen)</option>
              <option value="CAD">CAD ($ - Canadian Dollar)</option>
              <option value="AUD">AUD ($ - Australian Dollar)</option>
              <option value="KES">KES (KSh - Kenyan Shilling)</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Billing Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Phone Number</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[11px] text-slate-400 mb-1">Physical Business Address</label>
            <input
              type="text"
              required
              value={formData.address.line1}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  address: { ...formData.address, line1: e.target.value },
                })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">City & Postal Code</label>
            <input
              type="text"
              required
              value={`${formData.address.city}, ${formData.address.postalCode}`}
              onChange={(e) => {
                const parts = e.target.value.split(',');
                setFormData({
                  ...formData,
                  address: {
                    ...formData.address,
                    city: parts[0]?.trim() || '',
                    postalCode: parts[1]?.trim() || '',
                  },
                });
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Country</label>
            <input
              type="text"
              required
              value={formData.address.country}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  address: { ...formData.address, country: e.target.value },
                })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* 3. Bank Account Details (SWIFT, IBAN, ACH) */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <CreditCard className="w-4 h-4 text-indigo-400" />
          <span>3. Bank Account & Wire Remittance Details</span>
        </div>
        <p className="text-xs text-slate-400">
          These bank coordinates are printed on every invoice footer so clients can send direct domestic or international wire transfers.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Bank Name</label>
            <input
              type="text"
              required
              value={formData.bankDetails.bankName}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  bankDetails: { ...formData.bankDetails, bankName: e.target.value },
                })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Account Holder / Beneficiary Name</label>
            <input
              type="text"
              required
              value={formData.bankDetails.accountHolderName}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  bankDetails: { ...formData.bankDetails, accountHolderName: e.target.value },
                })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Account Number</label>
            <input
              type="text"
              required
              value={formData.bankDetails.accountNumber}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  bankDetails: { ...formData.bankDetails, accountNumber: e.target.value },
                })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Routing / Sort Code / ABA</label>
            <input
              type="text"
              value={formData.bankDetails.routingNumber}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  bankDetails: { ...formData.bankDetails, routingNumber: e.target.value },
                })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">SWIFT / BIC Code</label>
            <input
              type="text"
              required
              value={formData.bankDetails.swiftBic}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  bankDetails: { ...formData.bankDetails, swiftBic: e.target.value },
                })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono uppercase focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">IBAN (International Bank Account Number)</label>
            <input
              type="text"
              value={formData.bankDetails.iban}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  bankDetails: { ...formData.bankDetails, iban: e.target.value },
                })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono uppercase focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[11px] text-slate-400 mb-1">Special Remittance Instructions</label>
            <input
              type="text"
              value={formData.bankDetails.paymentInstructions || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  bankDetails: { ...formData.bankDetails, paymentInstructions: e.target.value },
                })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              placeholder="e.g. Please note all cross-border wire fees must be settled by sender."
            />
          </div>
        </div>
      </div>

      {/* 4. Payment Gateways (Stripe, VISA, PayPal) */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <DollarSign className="w-4 h-4 text-indigo-400" />
          <span>4. Online Payment Gateways & VISA Integration</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Stripe Connected Account ID</label>
            <input
              type="text"
              value={formData.paymentGateways.stripeAccountId || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  paymentGateways: { ...formData.paymentGateways, stripeAccountId: e.target.value },
                })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
              placeholder="acct_1Nvx..."
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">VISA Merchant ID / Token</label>
            <input
              type="text"
              value={formData.paymentGateways.visaMerchantId || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  paymentGateways: { ...formData.paymentGateways, visaMerchantId: e.target.value },
                })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
              placeholder="VISA-MRCH-..."
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">PayPal Business Email</label>
            <input
              type="email"
              value={formData.paymentGateways.paypalEmail || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  paymentGateways: { ...formData.paymentGateways, paypalEmail: e.target.value },
                })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              placeholder="billing@yourdomain.com"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Stripe Direct Payment Link</label>
            <input
              type="text"
              value={formData.paymentGateways.stripePaymentLink || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  paymentGateways: { ...formData.paymentGateways, stripePaymentLink: e.target.value },
                })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              placeholder="https://buy.stripe.com/..."
            />
          </div>
        </div>
      </div>

      {/* 5. Invoice Terms and Conditions */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <FileText className="w-4 h-4 text-indigo-400" />
          <span>5. Invoice Terms & Conditions</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Default Payment Window</label>
            <select
              value={formData.defaultPaymentTerms}
              onChange={(e) => setFormData({ ...formData, defaultPaymentTerms: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="Due on Receipt">Due on Receipt (Immediate)</option>
              <option value="Net 7">Net 7 Days</option>
              <option value="Net 14">Net 14 Days</option>
              <option value="Net 30">Net 30 Days</option>
              <option value="Net 60">Net 60 Days</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-[11px] text-slate-400 mb-1">Invoice Terms & Conditions Contract</label>
            <textarea
              rows={4}
              required
              value={formData.invoiceTermsAndConditions}
              onChange={(e) => setFormData({ ...formData, invoiceTermsAndConditions: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-indigo-500 leading-relaxed"
            />
            <div className="text-[11px] text-slate-500 mt-1">
              Included verbatim at the bottom of every invoice rendered and exported to PDF.
            </div>
          </div>
        </div>
      </div>

      {/* Final Save Button */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
        <button
          type="submit"
          disabled={!canManage}
          className="flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>Save Organization Customizations</span>
        </button>
      </div>
    </form>
  );
};
