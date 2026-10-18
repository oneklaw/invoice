import React, { useState } from 'react';
import {
  History,
  Search,
  Filter,
  Download,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  User,
  Clock,
  Globe,
} from 'lucide-react';
import { AuditLog, OrganizationSettings } from '../../types';
import { storageService } from '../../services/storage';

interface AuditLogViewProps {
  org: OrganizationSettings;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ org }) => {
  const [logs, setLogs] = useState<AuditLog[]>(storageService.getAuditLogs(org.id));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActionFilter, setSelectedActionFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actorEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.ipAddress.includes(searchQuery);

    const matchesAction =
      selectedActionFilter === 'all' ||
      (selectedActionFilter === 'invoice' && log.resourceType === 'invoice') ||
      (selectedActionFilter === 'user' && log.resourceType === 'user') ||
      (selectedActionFilter === 'billing' && log.resourceType === 'subscription') ||
      (selectedActionFilter === 'settings' && log.resourceType === 'organization') ||
      (selectedActionFilter === 'api' && log.resourceType === 'api');

    return matchesSearch && matchesAction;
  });

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Actor Name', 'Actor Email', 'Role', 'Action', 'Resource', 'IP Address', 'Status', 'Details'];
    const rows = filteredLogs.map((l) => [
      l.timestamp,
      `"${l.actorName}"`,
      l.actorEmail,
      l.actorRole,
      l.action,
      l.resourceType,
      l.ipAddress,
      l.status,
      `"${l.details.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `audit_trail_${org.slug}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(filteredLogs, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit_trail_${org.slug}_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getActionBadge = (action: string) => {
    if (action.includes('CREATED') || action.includes('PAID') || action.includes('UPGRADED')) {
      return <span className="text-emerald-400 font-mono text-[11px]">● {action}</span>;
    }
    if (action.includes('CHANGED') || action.includes('UPDATED') || action.includes('VOIDED')) {
      return <span className="text-amber-400 font-mono text-[11px]">● {action}</span>;
    }
    return <span className="text-slate-400 font-mono text-[11px]">● {action}</span>;
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Security & System Audit Trail</h1>
          <p className="text-xs text-slate-400 mt-1">
            Tamper-evident logs of administrative actions, billing changes, and invoicing events.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'All Activities' },
            { id: 'invoice', label: 'Invoices' },
            { id: 'billing', label: 'Billing & Plans' },
            { id: 'user', label: 'Roles & Team' },
            { id: 'settings', label: 'Customizations' },
            { id: 'api', label: 'API & Gateway' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedActionFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                selectedActionFilter === tab.id
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by actor, IP, details..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 font-medium border-b border-slate-800 select-none">
            <tr>
              <th className="py-3 px-4">Timestamp (UTC)</th>
              <th className="py-3 px-4">Actor</th>
              <th className="py-3 px-4">Action</th>
              <th className="py-3 px-4">Details</th>
              <th className="py-3 px-4">IP Address</th>
              <th className="py-3 px-4 text-right">Diff</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {filteredLogs.map((log) => {
              const isExpanded = expandedId === log.id;
              return (
                <React.Fragment key={log.id}>
                  <tr
                    className="hover:bg-slate-800/30 transition-colors cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : log.id)}
                  >
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400 tabular-nums whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-200">{log.actorName}</div>
                      <div className="text-[10px] text-indigo-400 font-mono">
                        {log.actorRole}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-xs truncate">
                      {log.details}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400 tabular-nums">
                      {log.ipAddress}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {log.diff ? (
                        <button
                          type="button"
                          className="text-indigo-400 hover:text-indigo-300 text-xs font-mono"
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4 inline" /> : <ChevronRight className="w-4 h-4 inline" />}
                        </button>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                  </tr>

                  {/* Expandable Changeset Diff */}
                  {isExpanded && log.diff && (
                    <tr className="bg-slate-950/70 border-b border-slate-800">
                      <td colSpan={6} className="p-4 pl-12 text-xs">
                        <div className="font-semibold text-slate-300 mb-2 font-mono">
                          Recorded Changeset Payload:
                        </div>
                        <div className="grid grid-cols-2 gap-4 font-mono text-[11px]">
                          {log.diff.before && (
                            <div className="p-3 bg-rose-950/20 border border-rose-900/40 rounded">
                              <span className="text-rose-400 font-bold block mb-1">Previous State:</span>
                              <pre className="text-rose-200 overflow-x-auto">
                                {JSON.stringify(log.diff.before, null, 2)}
                              </pre>
                            </div>
                          )}
                          {log.diff.after && (
                            <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded">
                              <span className="text-emerald-400 font-bold block mb-1">Updated State:</span>
                              <pre className="text-emerald-200 overflow-x-auto">
                                {JSON.stringify(log.diff.after, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
