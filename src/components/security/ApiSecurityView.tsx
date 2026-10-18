import React, { useState, useEffect } from 'react';
import {
  Key,
  Shield,
  Lock,
  Terminal,
  Zap,
  Play,
  Copy,
  Check,
  AlertOctagon,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { ApiCredential, OAuthToken, OrganizationSettings, User } from '../../types';
import { apiSecurityService } from '../../services/apiSecurity';
import { storageService } from '../../services/storage';

interface ApiSecurityViewProps {
  org: OrganizationSettings;
  currentUser: User;
}

export const ApiSecurityView: React.FC<ApiSecurityViewProps> = ({ org, currentUser }) => {
  const [credentials, setCredentials] = useState<ApiCredential[]>(
    storageService.getApiKeys(org.id)
  );
  const [activeToken, setActiveToken] = useState<OAuthToken | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<'GET /api/v1/invoices' | 'GET /api/v1/organization' | 'POST /api/v1/invoices'>('GET /api/v1/invoices');
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [apiStatus, setApiStatus] = useState<number | null>(null);
  const [apiHeaders, setApiHeaders] = useState<Record<string, string>>({});
  const [requestLatency, setRequestLatency] = useState<number | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Rate Limiter Real-Time State
  const [rateLimitState, setRateLimitState] = useState(
    apiSecurityService.getRateLimitStatus()
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setRateLimitState(apiSecurityService.getRateLimitStatus());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleGenerateCredentials = () => {
    const name = `Production Service App (${new Date().toLocaleDateString()})`;
    const scopes = ['invoices:read', 'invoices:write', 'clients:read'];
    const cred = apiSecurityService.createNewCredential(name, scopes, org.id);
    storageService.saveApiKey(cred, currentUser);
    setCredentials(storageService.getApiKeys(org.id));
  };

  const handleRequestOAuthToken = (clientId: string, scopes: string[]) => {
    const token = apiSecurityService.generateOAuthToken(clientId, scopes);
    setActiveToken(token);
  };

  const handleTestApi = async () => {
    const start = performance.now();
    const tokenCheck = apiSecurityService.consumeToken();

    setRateLimitState(apiSecurityService.getRateLimitStatus());

    if (!tokenCheck.allowed) {
      const end = performance.now();
      setRequestLatency(Number((end - start).toFixed(1)));
      setApiStatus(429);
      setApiHeaders(tokenCheck.headers);
      setApiResponse({
        error: 'Too Many Requests',
        message: 'Rate limit of 60 req/min exceeded. Please throttle your requests.',
        retryAfterSeconds: tokenCheck.resetSeconds,
      });

      storageService.addAuditLog({
        organizationId: org.id,
        actorId: currentUser.id,
        actorName: currentUser.name,
        actorEmail: currentUser.email,
        actorRole: currentUser.role,
        action: 'RATE_LIMIT_EXCEEDED',
        resourceType: 'api',
        status: 'warning',
        details: `Client exceeded rate limit on ${selectedEndpoint}. HTTP 429 returned.`,
      });
      return;
    }

    // Process valid API query
    await new Promise((r) => setTimeout(r, 45));
    const end = performance.now();
    setRequestLatency(Number((end - start).toFixed(1)));
    setApiStatus(200);
    setApiHeaders(tokenCheck.headers);

    if (selectedEndpoint === 'GET /api/v1/invoices') {
      const invoices = storageService.getInvoices(org.id);
      setApiResponse({
        status: 'success',
        tenant: org.slug,
        count: invoices.length,
        data: invoices.map((i) => ({
          id: i.id,
          invoiceNumber: i.invoiceNumber,
          client: i.clientName,
          amount: i.totalAmount,
          currency: i.currency,
          status: i.status,
          dueDate: i.dueDate,
        })),
      });
    } else if (selectedEndpoint === 'GET /api/v1/organization') {
      setApiResponse({
        status: 'success',
        organization: {
          id: org.id,
          name: org.name,
          taxId: org.taxId,
          currency: org.currency,
          plan: org.plan,
          quota: {
            used: org.invoiceCount,
            limit: org.plan === 'pro' ? 'unlimited' : 10,
          },
        },
      });
    } else {
      setApiResponse({
        status: 'success',
        createdInvoiceId: 'inv_' + Math.random().toString(36).substring(2, 9),
        message: 'Invoice created successfully under tenant ' + org.name,
      });
    }
  };

  const handleTriggerRateLimitSpike = () => {
    // Consume tokens rapidly to show rate limit protection
    for (let i = 0; i < 65; i++) {
      apiSecurityService.consumeToken();
    }
    handleTestApi();
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">API Security, OAuth 2.0 & Rate Limiting</h1>
          <p className="text-xs text-slate-400 mt-1">
            Enterprise OAuth 2.0 authentication, token management, and dynamic rate limiting to protect user data.
          </p>
        </div>

        <button
          onClick={handleGenerateCredentials}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New OAuth 2.0 Client</span>
        </button>
      </div>

      {/* Rate Limiter Live Telemetry Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-white">Live API Rate Limiter (Token Bucket Algorithm)</h2>
          </div>
          <span className="font-mono text-xs text-slate-400">
            Window: 60 req/min per tenant
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
            <div className="text-[11px] text-slate-400">Requests Remaining</div>
            <div className="text-2xl font-bold font-mono text-white tabular-nums">
              {rateLimitState.remaining} <span className="text-xs text-slate-500">/ {rateLimitState.limit}</span>
            </div>
            <div className="text-[10px] text-slate-500">
              Refilling continuously at 1 req/sec
            </div>
          </div>

          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
            <div className="text-[11px] text-slate-400">Quota Availability</div>
            <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
              {rateLimitState.percentage}%
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
              <div
                className={`h-full transition-all duration-300 ${
                  rateLimitState.remaining < 10 ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${rateLimitState.percentage}%` }}
              />
            </div>
          </div>

          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
            <div className="text-[11px] text-slate-400">Bucket Reset</div>
            <div className="text-2xl font-bold font-mono text-indigo-400 tabular-nums">
              {rateLimitState.resetSeconds}s
            </div>
            <div className="text-[10px] text-slate-500">
              Time until full token quota restored
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="text-xs text-slate-400">
            Enforces HTTP 429 Too Many Requests when exhausted to prevent DDoS and resource starvation.
          </div>
          <button
            onClick={handleTriggerRateLimitSpike}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-rose-400 border border-slate-700 rounded text-xs font-mono transition-colors"
          >
            Simulate 429 Spike Test
          </button>
        </div>
      </div>

      {/* OAuth 2.0 Credentials Table */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="text-xs font-semibold text-white">OAuth 2.0 Client Credentials</div>
          <span className="text-[11px] text-slate-400">Strictly scoped to {org.name}</span>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 font-medium border-b border-slate-800">
            <tr>
              <th className="py-3 px-6">Application Name</th>
              <th className="py-3 px-4">Client ID</th>
              <th className="py-3 px-4">Client Secret</th>
              <th className="py-3 px-4">Scopes</th>
              <th className="py-3 px-6 text-right">Authorize</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
            {credentials.map((cred) => (
              <tr key={cred.id} className="hover:bg-slate-800/20">
                <td className="py-3.5 px-6 font-sans text-slate-200 font-medium">
                  {cred.name}
                </td>
                <td className="py-3.5 px-4 text-indigo-300">
                  <div className="flex items-center gap-1.5">
                    <span>{cred.clientId}</span>
                    <button
                      onClick={() => handleCopy(cred.clientId, cred.id)}
                      className="text-slate-500 hover:text-white"
                    >
                      {copiedKey === cred.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-slate-500">
                  {cred.clientSecretMasked}
                </td>
                <td className="py-3.5 px-4 font-sans">
                  <div className="flex flex-wrap gap-1">
                    {cred.scopes.map((s) => (
                      <span
                        key={s}
                        className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] font-mono"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-3.5 px-6 text-right font-sans">
                  <button
                    onClick={() => handleRequestOAuthToken(cred.clientId, cred.scopes)}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium transition-colors"
                  >
                    Get Token
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Active Token Display */}
      {activeToken && (
        <div className="p-4 bg-indigo-950/40 border border-indigo-800/60 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-indigo-300">Active Bearer OAuth 2.0 Access Token:</span>
            <span className="font-mono text-[11px] text-slate-400">Expires in 3600s</span>
          </div>
          <div className="p-2.5 bg-slate-950 rounded font-mono text-xs text-emerald-400 break-all select-all border border-slate-800 flex items-center justify-between">
            <span>{activeToken.accessToken}</span>
            <button
              onClick={() => handleCopy(activeToken.accessToken, 'token')}
              className="text-slate-400 hover:text-white shrink-0 ml-2"
            >
              {copiedKey === 'token' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="text-[11px] text-slate-400">
            Authorization: Bearer {activeToken.accessToken.substring(0, 20)}... · Granted scopes: {activeToken.scope}
          </div>
        </div>
      )}

      {/* Interactive API Console */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-white">Interactive API Gateway Console</h2>
          </div>
          {requestLatency !== null && (
            <span className="font-mono text-xs text-emerald-400">
              Response Time: {requestLatency}ms
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedEndpoint}
            onChange={(e) => setSelectedEndpoint(e.target.value as any)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
          >
            <option value="GET /api/v1/invoices">GET /api/v1/invoices</option>
            <option value="GET /api/v1/organization">GET /api/v1/organization</option>
            <option value="POST /api/v1/invoices">POST /api/v1/invoices</option>
          </select>

          <button
            onClick={handleTestApi}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Send Request</span>
          </button>
        </div>

        {apiResponse && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">HTTP Status:</span>
              <span
                className={`font-bold ${
                  apiStatus === 200 ? 'text-emerald-400' : apiStatus === 429 ? 'text-rose-400' : 'text-amber-400'
                }`}
              >
                {apiStatus} {apiStatus === 200 ? 'OK' : apiStatus === 429 ? 'TOO MANY REQUESTS' : ''}
              </span>
            </div>

            {/* Response Headers */}
            <div className="p-2.5 bg-slate-950 rounded border border-slate-800 text-[11px] font-mono text-slate-400 space-y-0.5">
              {Object.entries(apiHeaders).map(([k, v]) => (
                <div key={k}>
                  <span className="text-slate-500">{k}:</span> <span className="text-slate-300">{v}</span>
                </div>
              ))}
            </div>

            {/* JSON Response Body */}
            <pre className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-slate-200 overflow-x-auto max-h-64">
              {JSON.stringify(apiResponse, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
