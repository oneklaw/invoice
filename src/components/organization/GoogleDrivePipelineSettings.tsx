import React, { useState } from 'react';
import {
  FolderArchive,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  FolderPlus,
  UploadCloud,
  FileText,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { GoogleDriveIntegrationSettings, OrganizationSettings, User } from '../../types';
import { getAccessToken, googleSignIn, isGoogleConnected, getCurrentGoogleUser } from '../../services/googleAuthService';
import { googleDriveService } from '../../services/googleDriveService';
import { storageService } from '../../services/storage';

interface GoogleDrivePipelineSettingsProps {
  org: OrganizationSettings;
  currentUser: User;
  onSaved?: () => void;
}

export const GoogleDrivePipelineSettings: React.FC<GoogleDrivePipelineSettingsProps> = ({
  org,
  currentUser,
  onSaved,
}) => {
  const currentConfig: GoogleDriveIntegrationSettings = org.googleDriveIntegration || {
    enabled: true,
    folderName: `Invoices - ${org.name || 'Company'}`,
    autoUploadOnInvoiceCreate: true,
  };

  const [folderName, setFolderName] = useState(currentConfig.folderName);
  const [autoUpload, setAutoUpload] = useState(currentConfig.autoUploadOnInvoiceCreate);
  const [enabled, setEnabled] = useState(currentConfig.enabled);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTestingFolder, setIsTestingFolder] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [folderLink, setFolderLink] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const googleConnected = isGoogleConnected();
  const googleUser = getCurrentGoogleUser();

  const handleConnectGoogle = async () => {
    setIsConnecting(true);
    setStatusMessage(null);
    try {
      const res = await googleSignIn();
      if (res && res.user) {
        setStatusMessage(`Successfully connected Google Account: ${res.user.email}`);
        setTimeout(() => setStatusMessage(null), 4000);
      }
    } catch (err: any) {
      console.error('Google connect error:', err);
      setStatusMessage('Google authorization cancelled or failed.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedDriveSettings: GoogleDriveIntegrationSettings = {
      ...currentConfig,
      enabled,
      folderName: folderName.trim() || `Invoices - ${org.name || 'Company'}`,
      autoUploadOnInvoiceCreate: autoUpload,
      connectedEmail: googleUser?.email || currentConfig.connectedEmail,
    };

    const updatedOrg: OrganizationSettings = {
      ...org,
      googleDriveIntegration: updatedDriveSettings,
    };

    storageService.saveOrganization(updatedOrg);
    storageService.addAuditLog({
      organizationId: org.id,
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorEmail: currentUser.email,
      actorRole: currentUser.role,
      action: 'SETTINGS_UPDATED',
      resourceType: 'drive',
      status: 'success',
      details: `Configured Google Drive invoice pipeline: Folder '${updatedDriveSettings.folderName}', Auto-upload: ${autoUpload ? 'ON' : 'OFF'}`,
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    if (onSaved) onSaved();
  };

  const handleVerifyFolder = async () => {
    setIsTestingFolder(true);
    setStatusMessage(null);
    try {
      let token = getAccessToken();
      if (!token) {
        const authRes = await googleSignIn();
        if (!authRes?.accessToken) {
          throw new Error('Google authorization is required to access Drive.');
        }
        token = authRes.accessToken;
      }

      const res = await googleDriveService.getOrCreateDesignatedFolder(
        folderName.trim() || `Invoices - ${org.name || 'Company'}`,
        token
      );

      if (res.webViewLink) {
        setFolderLink(res.webViewLink);
      }
      setStatusMessage(`Designated Google Drive folder ready! Folder ID: ${res.folderId}`);
    } catch (err: any) {
      console.error('Drive verify error:', err);
      setStatusMessage(`Verification failed: ${err.message || 'Error communicating with Google Drive API'}`);
    } finally {
      setIsTestingFolder(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <UploadCloud className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Google Drive Automated Pipeline</h4>
            <p className="text-[11px] text-slate-400">
              Automatically archives a PDF copy of every generated invoice to your connected Google Drive.
            </p>
          </div>
        </div>

        {/* Connection status badge */}
        <div>
          {googleConnected ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Connected: {googleUser?.email || 'Google Account'}
            </span>
          ) : (
            <button
              type="button"
              disabled={isConnecting}
              onClick={handleConnectGoogle}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              {isConnecting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span>Connect Google Drive</span>
            </button>
          )}
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-slate-200 flex items-center gap-2 animate-in fade-in">
          <InfoIcon className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-4">
        {/* Enable Pipeline Switch */}
        <div className="flex items-center justify-between p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-lg">
          <div>
            <div className="text-xs font-semibold text-slate-200">
              Enable Google Drive Invoice Pipeline
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Activates automated PDF creation and background cloud upload upon invoice generation.
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        {/* Auto Upload Switch */}
        <div className="flex items-center justify-between p-3.5 bg-slate-950/40 border border-slate-800 rounded-lg">
          <div>
            <div className="text-xs font-semibold text-slate-200">
              Save Automatically on Invoice Generation
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Whenever you create, finalize, or dispatch an invoice, a PDF copy is synced immediately.
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              disabled={!enabled}
              checked={autoUpload}
              onChange={(e) => setAutoUpload(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        {/* Designated Folder Name */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <FolderArchive className="w-3.5 h-3.5 text-slate-400" />
              <span>Designated Google Drive Folder</span>
            </span>
            {folderLink && (
              <a
                href={folderLink}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:text-emerald-300 text-[11px] flex items-center gap-1 font-sans"
              >
                <span>Open Folder in Drive</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              disabled={!enabled}
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="e.g. Invoices - My Company"
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
            />
            <button
              type="button"
              disabled={!enabled || isTestingFolder}
              onClick={handleVerifyFolder}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5 shrink-0"
            >
              {isTestingFolder ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              ) : (
                <FolderPlus className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span>Verify / Create Folder</span>
            </button>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">
            If the folder doesn&apos;t exist in your Google Drive, the pipeline creates it automatically.
          </span>
        </div>

        {/* Action button */}
        <div className="flex items-center justify-between pt-2">
          {saveSuccess ? (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <Check className="w-4 h-4" />
              <span>Pipeline configuration saved!</span>
            </div>
          ) : (
            <div className="text-[11px] text-slate-500">
              Invoices will include a direct Google Drive link once uploaded.
            </div>
          )}
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            Save Pipeline Settings
          </button>
        </div>
      </form>
    </div>
  );
};

function InfoIcon(props: any) {
  return <AlertCircle {...props} />;
}
