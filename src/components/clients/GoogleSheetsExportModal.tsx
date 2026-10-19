import React, { useState, useEffect } from 'react';
import {
  X,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Users,
  CreditCard,
  Building,
  TrendingUp,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Client, Invoice, OrganizationSettings, User } from '../../types';
import { storageService } from '../../services/storage';
import {
  googleSignIn,
  googleSignOut,
  getAccessToken,
  getCurrentGoogleUser,
  isGoogleConnected,
  initAuth,
} from '../../services/googleAuthService';
import { googleSheetsService, GoogleSheetExportResult } from '../../services/googleSheetsService';

interface GoogleSheetsExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  org: OrganizationSettings;
  clients: Client[];
  currentUser: User;
}

export const GoogleSheetsExportModal: React.FC<GoogleSheetsExportModalProps> = ({
  isOpen,
  onClose,
  org,
  clients,
  currentUser,
}) => {
  const [googleConnected, setGoogleConnected] = useState<boolean>(isGoogleConnected());
  const [googleEmail, setGoogleEmail] = useState<string | null>(
    getCurrentGoogleUser()?.email || null
  );
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStage, setExportStage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [exportResult, setExportResult] = useState<GoogleSheetExportResult | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Invoices metrics
  const invoices: Invoice[] = storageService.getInvoices(org.id);
  const paidInvoices = invoices.filter((i) => i.status === 'paid');
  const totalCollected = paidInvoices.reduce((sum, i) => sum + i.totalAmount, 0);

  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setExportResult(null);
      setExportStage('');
      return;
    }

    // Subscribe to auth state changes
    const unsubscribe = initAuth(
      (user) => {
        setGoogleConnected(true);
        setGoogleEmail(user.email);
      },
      () => {
        setGoogleConnected(false);
        setGoogleEmail(null);
      }
    );

    // Initial check
    if (getAccessToken() && getCurrentGoogleUser()) {
      setGoogleConnected(true);
      setGoogleEmail(getCurrentGoogleUser()?.email || null);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConnectGoogle = async () => {
    setError(null);
    setIsAuthorizing(true);
    try {
      const res = await googleSignIn();
      if (res && res.user) {
        setGoogleConnected(true);
        setGoogleEmail(res.user.email);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to authenticate with Google. Please check popup blockers.');
    } finally {
      setIsAuthorizing(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    try {
      await googleSignOut();
      setGoogleConnected(false);
      setGoogleEmail(null);
      setExportResult(null);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleExecuteExport = async () => {
    setError(null);
    setIsExporting(true);
    setExportStage('Starting export process...');

    try {
      const result = await googleSheetsService.exportClientsAndPaymentsToGoogleSheet(
        org,
        clients,
        currentUser,
        (_stage, message) => {
          setExportStage(message);
        }
      );

      setExportResult(result);
      setGoogleConnected(true);
      if (getCurrentGoogleUser()) {
        setGoogleEmail(getCurrentGoogleUser()?.email || null);
      }

      // Celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10B981', '#4F46E5', '#3B82F6', '#F59E0B'],
        });
      } catch {
        // ignore
      }
    } catch (err: any) {
      console.error('Export failed:', err);
      setError(err?.message || 'Failed to generate Google Sheet. Please try again.');
    } finally {
      setIsExporting(false);
      setExportStage('');
    }
  };

  const handleCopyLink = () => {
    if (!exportResult?.spreadsheetUrl) return;
    navigator.clipboard.writeText(exportResult.spreadsheetUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden text-slate-100 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-tight">
                  Export to Google Sheets™
                </h2>
                <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-mono border border-emerald-800/60">
                  Google Workspace API
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Generate real-time spreadsheet reports for clients and payment reconciliation.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Error notice */}
          {error && (
            <div className="p-3.5 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold">Export Failed: </span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Success Banner */}
          {exportResult ? (
            <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="space-y-1 flex-1">
                  <h3 className="text-sm font-bold text-emerald-200">
                    Google Sheet Created Successfully!
                  </h3>
                  <p className="text-xs text-slate-300">
                    Your spreadsheet was created and formatted in Google Drive via the Google Sheets API.
                  </p>
                  <div className="text-[11px] font-mono text-emerald-400 truncate">
                    Title: {exportResult.title}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <a
                  href={exportResult.spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open in Google Sheets</span>
                </a>

                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-2 border border-slate-700 transition-colors"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Spreadsheet Link</span>
                    </>
                  )}
                </button>
              </div>

              {/* Data summary */}
              <div className="grid grid-cols-3 gap-3 pt-2 text-center text-xs">
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Exported Clients</div>
                  <div className="font-bold text-white text-sm font-mono mt-0.5">
                    {exportResult.clientCount}
                  </div>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Payment Records</div>
                  <div className="font-bold text-white text-sm font-mono mt-0.5">
                    {exportResult.invoiceCount}
                  </div>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Total Paid Revenue</div>
                  <div className="font-bold text-emerald-400 text-sm font-mono mt-0.5">
                    {exportResult.currency} {exportResult.totalCollected.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Google Account Authentication Status Card */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                Google Workspace Connection
              </span>
              {googleConnected && googleEmail ? (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 text-[11px] border border-emerald-800">
                    <CheckCircle2 className="w-3 h-3" />
                    Connected
                  </span>
                  <button
                    onClick={handleDisconnectGoogle}
                    title="Disconnect Google account"
                    className="text-slate-500 hover:text-slate-300 p-1 text-[11px] flex items-center gap-1"
                  >
                    <LogOut className="w-3 h-3" />
                    Disconnect
                  </button>
                </div>
              ) : (
                <span className="text-[11px] text-amber-400 font-mono">Authorization Required</span>
              )}
            </div>

            {googleConnected && googleEmail ? (
              <div className="flex items-center justify-between text-xs bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <div className="flex items-center gap-2 truncate">
                  <div className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-300 flex items-center justify-center font-bold text-xs uppercase">
                    {googleEmail.charAt(0)}
                  </div>
                  <span className="text-slate-200 font-mono text-[11px] truncate">{googleEmail}</span>
                </div>
                <span className="text-[10px] text-slate-400">Permissions granted for Sheets</span>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                <p className="text-xs text-slate-400 leading-relaxed">
                  To create and edit spreadsheets in your Google Drive, please authenticate using your Google Account with permission from your account.
                </p>

                {/* Official Sign in with Google Button */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleConnectGoogle}
                    disabled={isAuthorizing}
                    className="gsi-material-button"
                  >
                    <div className="gsi-material-button-state"></div>
                    <div className="gsi-material-button-content-wrapper">
                      <div className="gsi-material-button-icon">
                        <svg
                          version="1.1"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 48 48"
                          xmlnsXlink="http://www.w3.org/1999/xlink"
                          style={{ display: 'block' }}
                        >
                          <path
                            fill="#EA4335"
                            d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                          ></path>
                          <path
                            fill="#4285F4"
                            d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                          ></path>
                          <path
                            fill="#FBBC05"
                            d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                          ></path>
                          <path
                            fill="#34A853"
                            d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                          ></path>
                          <path fill="none" d="M0 0h48v48H0z"></path>
                        </svg>
                      </div>
                      <span className="gsi-material-button-contents">
                        {isAuthorizing ? 'Connecting to Google...' : 'Sign in with Google'}
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Export Payload Overview */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Data Structure & Worksheets Included
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Sheet 1 */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs">
                  <TrendingUp className="w-4 h-4" />
                  <span>Executive Summary</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Financial KPIs, lifetime billing, total collected revenue, and overdue balance breakdown.
                </p>
                <div className="text-[10px] font-mono text-slate-500 pt-1">
                  17 Key Performance Rows
                </div>
              </div>

              {/* Sheet 2 */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                  <Users className="w-4 h-4" />
                  <span>Client Directory</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Complete directory with contacts, companies, billing emails, phone, tax/VAT IDs, and lifetime spend.
                </p>
                <div className="text-[10px] font-mono text-slate-500 pt-1">
                  {clients.length} Client Profiles
                </div>
              </div>

              {/* Sheet 3 */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
                  <CreditCard className="w-4 h-4" />
                  <span>Payment History</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Reconciliation ledger of all invoices, payment dates, payment methods (Visa/Stripe), and transaction IDs.
                </p>
                <div className="text-[10px] font-mono text-slate-500 pt-1">
                  {invoices.length} Invoices ({paidInvoices.length} Paid)
                </div>
              </div>
            </div>
          </div>

          {/* Organization & Scope Info */}
          <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-slate-500" />
              <span>Current Organization: <strong className="text-white">{org.name}</strong></span>
            </div>
            <span className="font-mono text-[11px] text-slate-500">
              Currency: {org.currency}
            </span>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/70">
          <div className="text-xs text-slate-400">
            {isExporting ? (
              <span className="flex items-center gap-2 text-indigo-400 font-medium">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                {exportStage || 'Exporting to Google Sheets API...'}
              </span>
            ) : exportResult ? (
              <span className="text-emerald-400 flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                Spreadsheet ready in Google Drive
              </span>
            ) : (
              <span>Creates a new standalone spreadsheet in Google Sheets</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors"
            >
              {exportResult ? 'Done' : 'Cancel'}
            </button>

            <button
              type="button"
              onClick={handleExecuteExport}
              disabled={isExporting || isAuthorizing}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors"
            >
              {isExporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Generating Sheet...</span>
                </>
              ) : exportResult ? (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Re-export Fresh Data</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>{googleConnected ? 'Create Google Sheet' : 'Authenticate & Export'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
