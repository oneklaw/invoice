import React, { useState } from 'react';
import {
  UserPlus,
  Shield,
  ShieldCheck,
  Mail,
  CheckCircle2,
  X,
  AlertCircle,
  Key,
  CreditCard,
  FileText,
  Eye,
} from 'lucide-react';
import { OrganizationSettings, User, UserRole } from '../../types';
import { storageService } from '../../services/storage';

interface TeamManagementProps {
  org: OrganizationSettings;
  currentUser: User;
  onRefresh: () => void;
}

export const TeamManagement: React.FC<TeamManagementProps> = ({
  org,
  currentUser,
  onRefresh,
}) => {
  const users = storageService.getUsersByOrg(org.id);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('invoice_editor');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const canManageTeam = ['super_admin', 'org_admin'].includes(currentUser.role);

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteName) return;

    storageService.inviteUser(inviteEmail, inviteName, inviteRole, org.id, currentUser);
    setShowInviteModal(false);
    setInviteName('');
    setInviteEmail('');
    setSuccessMsg(`Invitation dispatched to ${inviteEmail} with role '${inviteRole}'.`);
    setTimeout(() => setSuccessMsg(null), 4000);
    onRefresh();
  };

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    if (!canManageTeam) {
      alert('Only Super Admin or Org Admin can reassign roles.');
      return;
    }

    storageService.updateUserRole(userId, newRole, org.id, currentUser);
    onRefresh();
  };

  const roleLabels: Record<UserRole, { title: string; desc: string }> = {
    super_admin: {
      title: 'Super Admin',
      desc: 'Platform-level root authority, cross-tenant administration, system overrides.',
    },
    org_admin: {
      title: 'Org Admin',
      desc: 'Full administrative control of this tenant organization, billing, and team.',
    },
    billing_manager: {
      title: 'Billing Manager',
      desc: 'Manages Stripe & VISA subscriptions, receipts, bank coordinates, and invoices.',
    },
    invoice_editor: {
      title: 'Invoice Editor',
      desc: 'Generates, modifies, sends, and voids customer invoices and client profiles.',
    },
    viewer: {
      title: 'Viewer',
      desc: 'Read-only access to customer invoices, balances, and reports.',
    },
  };

  const permissionsMatrix = [
    { feature: 'View Invoices & Reports', super_admin: true, org_admin: true, billing_manager: true, invoice_editor: true, viewer: true },
    { feature: 'Create & Edit Invoices', super_admin: true, org_admin: true, billing_manager: false, invoice_editor: true, viewer: false },
    { feature: 'Void / Delete Invoices', super_admin: true, org_admin: true, billing_manager: false, invoice_editor: true, viewer: false },
    { feature: 'Manage Stripe & VISA Subscriptions', super_admin: true, org_admin: true, billing_manager: true, invoice_editor: false, viewer: false },
    { feature: 'Edit Bank Details & Custom Branding', super_admin: true, org_admin: true, billing_manager: true, invoice_editor: false, viewer: false },
    { feature: 'Invite Users & Change Roles', super_admin: true, org_admin: true, billing_manager: false, invoice_editor: false, viewer: false },
    { feature: 'Manage OAuth 2.0 & API Keys', super_admin: true, org_admin: true, billing_manager: false, invoice_editor: false, viewer: false },
    { feature: 'Inspect Audit Logs & Purge Cache', super_admin: true, org_admin: true, billing_manager: false, invoice_editor: false, viewer: false },
  ];

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Team Members & Role-Based Access (RBAC)</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage organization members and assign granular roles from Super Admin to Viewer.
          </p>
        </div>

        {canManageTeam && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors whitespace-nowrap self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Team Member</span>
          </button>
        )}
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Team Members Table */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="text-xs font-semibold text-white">Active Team Members ({users.length})</div>
          <div className="text-[11px] text-slate-400">Tenant: <span className="text-indigo-400">{org.name}</span></div>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 font-medium border-b border-slate-800 select-none">
            <tr>
              <th className="py-3 px-6">User</th>
              <th className="py-3 px-4">Role & Scope</th>
              <th className="py-3 px-4">Joined Date</th>
              <th className="py-3 px-6 text-right">Assign Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="py-3.5 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-200">
                        {user.name} {user.id === currentUser.id && <span className="text-[10px] text-indigo-400 font-mono">(You)</span>}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  <div className="font-medium text-slate-200">
                    {roleLabels[user.role]?.title || user.role}
                  </div>
                  <div className="text-[10px] text-slate-500 max-w-xs truncate">
                    {roleLabels[user.role]?.desc}
                  </div>
                </td>
                <td className="py-3.5 px-4 font-mono text-slate-400 tabular-nums">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="py-3.5 px-6 text-right">
                  {canManageTeam ? (
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                      className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="super_admin">Super Admin</option>
                      <option value="org_admin">Org Admin</option>
                      <option value="billing_manager">Billing Manager</option>
                      <option value="invoice_editor">Invoice Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  ) : (
                    <span className="text-slate-500 text-xs">Read-only</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Permissions Matrix */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
        <div className="px-6 py-4 border-b border-slate-800">
          <div className="text-xs font-semibold text-white">Role-Based Access Control (RBAC) Permissions Matrix</div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Clear role isolation ensuring security and multi-tenant integrity across all actions.
          </div>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 font-medium border-b border-slate-800">
            <tr>
              <th className="py-3 px-6">Capability / Resource</th>
              <th className="py-3 px-3 text-center">Super Admin</th>
              <th className="py-3 px-3 text-center">Org Admin</th>
              <th className="py-3 px-3 text-center">Billing Mgr</th>
              <th className="py-3 px-3 text-center">Invoice Editor</th>
              <th className="py-3 px-3 text-center">Viewer</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
            {permissionsMatrix.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-800/20">
                <td className="py-3 px-6 font-sans text-xs text-slate-200">{row.feature}</td>
                <td className="py-3 px-3 text-center">
                  {row.super_admin ? <span className="text-emerald-400">✓ ALLOW</span> : <span className="text-slate-600">—</span>}
                </td>
                <td className="py-3 px-3 text-center">
                  {row.org_admin ? <span className="text-emerald-400">✓ ALLOW</span> : <span className="text-slate-600">—</span>}
                </td>
                <td className="py-3 px-3 text-center">
                  {row.billing_manager ? <span className="text-emerald-400">✓ ALLOW</span> : <span className="text-slate-600">—</span>}
                </td>
                <td className="py-3 px-3 text-center">
                  {row.invoice_editor ? <span className="text-emerald-400">✓ ALLOW</span> : <span className="text-slate-600">—</span>}
                </td>
                <td className="py-3 px-3 text-center">
                  {row.viewer ? <span className="text-emerald-400">✓ ALLOW</span> : <span className="text-slate-600">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-xl shadow-2xl overflow-hidden text-slate-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
              <h2 className="text-sm font-bold text-white">Invite Team Member</h2>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Alex Morgan"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  placeholder="alex.m@yourcompany.com"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Assigned Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as UserRole)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="org_admin">Org Admin (Full management)</option>
                  <option value="billing_manager">Billing Manager (Finance & Cards)</option>
                  <option value="invoice_editor">Invoice Editor (Create & send invoices)</option>
                  <option value="viewer">Viewer (Read-only)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
