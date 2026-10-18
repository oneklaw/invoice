import React, { useState } from 'react';
import { Users, Plus, Mail, Building, MapPin, DollarSign, X } from 'lucide-react';
import { Client, OrganizationSettings, User } from '../../types';
import { storageService } from '../../services/storage';

interface ClientManagerViewProps {
  org: OrganizationSettings;
  clients: Client[];
  currentUser: User;
  onRefresh: () => void;
}

export const ClientManagerView: React.FC<ClientManagerViewProps> = ({
  org,
  clients,
  currentUser,
  onRefresh,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [taxId, setTaxId] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('United States');

  const canEdit = ['super_admin', 'org_admin', 'invoice_editor'].includes(currentUser.role);

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    const newClient: Client = {
      id: 'clt_' + Math.random().toString(36).substring(2, 9),
      organizationId: org.id,
      name,
      companyName: companyName || undefined,
      email,
      phone: phone || undefined,
      taxId: taxId || undefined,
      address,
      city,
      country,
      currency: org.currency,
      totalInvoiced: 0,
      createdAt: new Date().toISOString(),
    };

    storageService.saveClient(newClient, currentUser);
    setShowAddModal(false);
    setName('');
    setCompanyName('');
    setEmail('');
    setPhone('');
    setTaxId('');
    setAddress('');
    setCity('');
    onRefresh();
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Client Directory</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your organization&apos;s billing contacts, company profiles, and tax identifiers.
          </p>
        </div>

        {canEdit && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors whitespace-nowrap self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Client</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map((client) => (
          <div
            key={client.id}
            className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3 hover:border-slate-700 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-sm font-bold text-white">{client.name}</h2>
                {client.companyName && (
                  <div className="text-xs text-indigo-400 font-medium">{client.companyName}</div>
                )}
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {client.currency}
              </span>
            </div>

            <div className="text-xs text-slate-400 space-y-1.5 pt-1">
              <div className="flex items-center gap-2 truncate">
                <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="truncate">{client.email}</span>
              </div>
              <div className="flex items-center gap-2 truncate">
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="truncate">{client.city}, {client.country}</span>
              </div>
              {client.taxId && (
                <div className="text-[11px] font-mono text-slate-500">
                  Tax / VAT ID: {client.taxId}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500">Lifetime Invoiced:</span>
              <span className="font-mono font-bold text-white tabular-nums">
                {client.currency} {client.totalInvoiced.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-xl shadow-2xl overflow-hidden text-slate-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
              <h2 className="text-sm font-bold text-white">Create New Client</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Contact Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Company / Organization</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Acme Corp Inc."
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Billing Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  placeholder="ap@company.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    placeholder="New York, NY"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Country</label>
                  <input
                    type="text"
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Tax ID / VAT (Optional)</label>
                <input
                  type="text"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  placeholder="VAT-..."
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                >
                  Create Client Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
