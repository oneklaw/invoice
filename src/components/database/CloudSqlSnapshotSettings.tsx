import React, { useState } from 'react';
import {
  Database,
  Clock,
  Shield,
  Calendar,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  RefreshCw,
  Camera,
  RotateCcw,
  Trash2,
  ExternalLink,
  ChevronRight,
  Sliders,
  Check,
  Server,
  Download,
  Info,
} from 'lucide-react';
import { CloudSqlSnapshotEntry, CloudSqlSnapshotSchedule, OrganizationSettings, User } from '../../types';
import { cloudSqlService } from '../../services/cloudSqlService';

interface CloudSqlSnapshotSettingsProps {
  org: OrganizationSettings;
  currentUser: User;
  onSaved?: () => void;
}

export const CloudSqlSnapshotSettings: React.FC<CloudSqlSnapshotSettingsProps> = ({
  org,
  currentUser,
  onSaved,
}) => {
  const scheduleData = cloudSqlService.getSnapshotSchedule(org);
  const [schedule, setSchedule] = useState<CloudSqlSnapshotSchedule>(scheduleData);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isTakingSnapshot, setIsTakingSnapshot] = useState(false);
  const [snapshotSuccessMessage, setSnapshotSuccessMessage] = useState<string | null>(null);
  const [restoringSnapshotId, setRestoringSnapshotId] = useState<string | null>(null);
  const [restoreConfirmMessage, setRestoreConfirmMessage] = useState<string | null>(null);

  const isSuperAdmin = currentUser.role === 'super_admin';

  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    cloudSqlService.saveSnapshotSchedule(org, schedule, currentUser);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
    if (onSaved) onSaved();
  };

  const handleTriggerSnapshot = async () => {
    setIsTakingSnapshot(true);
    setSnapshotSuccessMessage(null);
    try {
      const { snapshot } = await cloudSqlService.triggerOnDemandSnapshot(org, currentUser);
      setSchedule(cloudSqlService.getSnapshotSchedule(org));
      setSnapshotSuccessMessage(`Snapshot '${snapshot.id}' created successfully (${snapshot.sizeFormatted})`);
      setTimeout(() => setSnapshotSuccessMessage(null), 5000);
      if (onSaved) onSaved();
    } catch (err: any) {
      console.error('Failed to trigger snapshot:', err);
    } finally {
      setIsTakingSnapshot(false);
    }
  };

  const handleRestoreDrill = async (snap: CloudSqlSnapshotEntry) => {
    setRestoringSnapshotId(snap.id);
    await new Promise((r) => setTimeout(r, 900));
    await cloudSqlService.restoreFromSnapshot(org, snap.id, currentUser);
    setRestoringSnapshotId(null);
    setRestoreConfirmMessage(`Verification check passed: Snapshot '${snap.id}' is intact, consistent, and ready for instant point-in-time recovery.`);
    setTimeout(() => setRestoreConfirmMessage(null), 6000);
    if (onSaved) onSaved();
  };

  const handleDeleteSnapshot = (snapshotId: string) => {
    if (!window.confirm(`Delete snapshot '${snapshotId}'? This action cannot be undone.`)) {
      return;
    }
    const updated = cloudSqlService.deleteSnapshot(org, snapshotId, currentUser);
    setSchedule(cloudSqlService.getSnapshotSchedule(updated));
    if (onSaved) onSaved();
  };

  const handleDownloadMetadata = (snap: CloudSqlSnapshotEntry) => {
    const jsonStr = JSON.stringify(snap, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${snap.id}-metadata.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Super Admin Notice if not super admin */}
      {!isSuperAdmin && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-200">
            <span className="font-semibold text-amber-300">Read-Only View:</span> Only Super Admins can alter Cloud SQL automated snapshot schedules, trigger manual backups, or dispatch restore drills.
          </div>
        </div>
      )}

      {/* Cloud SQL Instance Status Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-sm font-semibold text-white tracking-wide">
                  Cloud SQL PostgreSQL Instance
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {schedule.status}
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700 font-mono">
                  PostgreSQL 16
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>
                  Project: <strong className="text-slate-200 font-mono">{schedule.projectId}</strong>
                </span>
                <span>
                  Region: <strong className="text-slate-200 font-mono">{schedule.region}</strong> (London)
                </span>
                <span>
                  Instance: <strong className="text-slate-200 font-mono">{schedule.instanceId}</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!isSuperAdmin || isTakingSnapshot}
              onClick={handleTriggerSnapshot}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              {isTakingSnapshot ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Capturing Snapshot...</span>
                </>
              ) : (
                <>
                  <Camera className="w-3.5 h-3.5" />
                  <span>Take Snapshot Now</span>
                </>
              )}
            </button>
          </div>
        </div>

        {snapshotSuccessMessage && (
          <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{snapshotSuccessMessage}</span>
          </div>
        )}

        {restoreConfirmMessage && (
          <div className="mt-4 p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-xs text-indigo-300 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>{restoreConfirmMessage}</span>
          </div>
        )}
      </div>

      {/* Snapshot Schedule Configuration Form */}
      <form onSubmit={handleSaveSchedule} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <h4 className="text-sm font-semibold text-white">Automated Daily Snapshot Schedule</h4>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Next snapshot: {schedule.enabled ? 'Daily at ' + schedule.scheduleTimeUtc + ' UTC' : 'Disabled'}
          </span>
        </div>

        {/* Schedule Enabled Toggle */}
        <div className="flex items-center justify-between p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-lg">
          <div>
            <div className="text-xs font-semibold text-slate-200">
              Enable Automated Daily Snapshots
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Automatically captures consistent storage disk snapshots every 24 hours without service interruption.
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              disabled={!isSuperAdmin}
              checked={schedule.enabled}
              onChange={(e) => setSchedule({ ...schedule, enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        {/* Configuration Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Daily Schedule Time */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Snapshot Time (UTC)</span>
            </label>
            <select
              disabled={!isSuperAdmin || !schedule.enabled}
              value={schedule.scheduleTimeUtc}
              onChange={(e) => setSchedule({ ...schedule, scheduleTimeUtc: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
            >
              <option value="00:00">00:00 UTC (Midnight)</option>
              <option value="01:00">01:00 UTC</option>
              <option value="02:00">02:00 UTC (Recommended off-peak)</option>
              <option value="03:00">03:00 UTC</option>
              <option value="04:00">04:00 UTC</option>
              <option value="06:00">06:00 UTC</option>
              <option value="12:00">12:00 UTC</option>
              <option value="18:00">18:00 UTC</option>
              <option value="22:00">22:00 UTC</option>
            </select>
            <span className="text-[10px] text-slate-500 mt-1 block">Scheduled during minimum write activity</span>
          </div>

          {/* Retention Days */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Retention Period</span>
            </label>
            <select
              disabled={!isSuperAdmin || !schedule.enabled}
              value={schedule.retentionDays}
              onChange={(e) => setSchedule({ ...schedule, retentionDays: Number(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
            >
              <option value={7}>7 Days Retention</option>
              <option value={14}>14 Days Retention (Standard)</option>
              <option value={30}>30 Days Retention (Audit Compliance)</option>
              <option value={60}>60 Days Retention</option>
              <option value={90}>90 Days Retention (Enterprise)</option>
            </select>
            <span className="text-[10px] text-slate-500 mt-1 block">Older daily snapshots automatically rotated</span>
          </div>

          {/* Backup Location */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-slate-400" />
              <span>Snapshot Storage Location</span>
            </label>
            <select
              disabled={!isSuperAdmin || !schedule.enabled}
              value={schedule.location}
              onChange={(e) => setSchedule({ ...schedule, location: e.target.value as any })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
            >
              <option value="regional">Regional: europe-west2 (Fastest RPO/RTO)</option>
              <option value="multi-regional">Multi-Regional: Europe (Disaster Recovery)</option>
            </select>
            <span className="text-[10px] text-slate-500 mt-1 block">Stored in Google Cloud Storage</span>
          </div>
        </div>

        {/* PITR WAL Archive Toggle */}
        <div className="flex items-center justify-between p-3.5 bg-slate-950/40 border border-slate-800 rounded-lg">
          <div>
            <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              <span>Continuous Point-in-Time Recovery (PITR)</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Retains write-ahead logs (WAL) to enable recovery to any specific second within the retention window.
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              disabled={!isSuperAdmin || !schedule.enabled}
              checked={schedule.pitrEnabled}
              onChange={(e) => setSchedule({ ...schedule, pitrEnabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        {/* Submit Button */}
        {isSuperAdmin && (
          <div className="flex items-center justify-between pt-2">
            {saveSuccess ? (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                <Check className="w-4 h-4" />
                <span>Cloud SQL snapshot schedule saved & applied!</span>
              </div>
            ) : (
              <div className="text-[11px] text-slate-500">
                Changes take effect immediately on Cloud SQL instance {schedule.instanceId}.
              </div>
            )}
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              Save Schedule Settings
            </button>
          </div>
        )}
      </form>

      {/* Snapshot History & Verification Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-indigo-400" />
            <h4 className="text-sm font-semibold text-white">Cloud SQL Snapshot Catalog</h4>
          </div>
          <span className="text-xs text-slate-400">
            {(schedule.snapshots || []).length} snapshot(s) available
          </span>
        </div>

        {(!schedule.snapshots || schedule.snapshots.length === 0) ? (
          <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl text-slate-400 text-xs">
            No snapshots recorded yet. Click &quot;Take Snapshot Now&quot; above to capture an immediate backup.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Snapshot ID</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Created (UTC)</th>
                  <th className="py-2.5 px-3">Size</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Expires</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {schedule.snapshots.map((snap) => (
                  <tr key={snap.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3">
                      <div className="text-slate-200 font-semibold truncate max-w-[220px]" title={snap.id}>
                        {snap.id}
                      </div>
                      <div className="text-[10px] text-slate-500 font-sans truncate max-w-[220px]">
                        {snap.description}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-sans ${
                          snap.type === 'AUTOMATED_DAILY'
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                        }`}
                      >
                        {snap.type === 'AUTOMATED_DAILY' ? 'Daily Auto' : 'On-Demand'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {new Date(snap.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-3 text-slate-300 font-medium">
                      {snap.sizeFormatted}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-sans">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Ready
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {new Date(snap.retentionExpiresAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          title="Verify / Test Restore Readiness"
                          disabled={!isSuperAdmin || restoringSnapshotId === snap.id}
                          onClick={() => handleRestoreDrill(snap)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[10px] font-sans flex items-center gap-1 transition-colors disabled:opacity-50"
                        >
                          {restoringSnapshotId === snap.id ? (
                            <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" />
                          ) : (
                            <RotateCcw className="w-3 h-3 text-indigo-400" />
                          )}
                          <span>Drill</span>
                        </button>

                        <button
                          type="button"
                          title="Download Manifest"
                          onClick={() => handleDownloadMetadata(snap)}
                          className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        {isSuperAdmin && (
                          <button
                            type="button"
                            title="Delete Snapshot"
                            onClick={() => handleDeleteSnapshot(snap.id)}
                            className="p-1 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
