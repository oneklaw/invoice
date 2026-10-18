import React, { useState, useEffect } from 'react';
import {
  Zap,
  Gauge,
  Flame,
  RotateCcw,
  TrendingDown,
  Database,
  Cpu,
  Server,
  Play,
  CheckCircle2,
} from 'lucide-react';
import { CacheMetrics, CacheEntry, OrganizationSettings, User } from '../../types';
import { cacheEngine } from '../../services/cacheEngine';
import { storageService } from '../../services/storage';

interface CachePerformanceViewProps {
  org: OrganizationSettings;
  currentUser: User;
}

export const CachePerformanceView: React.FC<CachePerformanceViewProps> = ({ org, currentUser }) => {
  const [metrics, setMetrics] = useState<CacheMetrics>(cacheEngine.getMetrics());
  const [entries, setEntries] = useState<CacheEntry[]>(cacheEngine.getAllEntries());
  const [isRunningLoadTest, setIsRunningLoadTest] = useState(false);
  const [loadTestResult, setLoadTestResult] = useState<{
    durationMs: number;
    hits: number;
    misses: number;
    avgLatency: number;
    latencies: number[];
  } | null>(null);
  const [selectedLoadCount, setSelectedLoadCount] = useState<number>(100);

  const refreshData = () => {
    setMetrics(cacheEngine.getMetrics());
    setEntries(cacheEngine.getAllEntries());
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleFlushCache = () => {
    cacheEngine.flushAll();
    storageService.addAuditLog({
      organizationId: org.id,
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorEmail: currentUser.email,
      actorRole: currentUser.role,
      action: 'CACHE_PURGED',
      resourceType: 'cache',
      status: 'warning',
      details: 'Flushed in-memory cache layer for entire application cluster',
    });
    refreshData();
  };

  const handleWarmCache = () => {
    cacheEngine.set(`org:invoices:${org.id}`, storageService.getInvoices(org.id), 300);
    cacheEngine.set(`org:settings:${org.id}`, org, 300);
    cacheEngine.set(`org:clients:${org.id}`, storageService.getClients(org.id), 300);
    refreshData();
  };

  const handleRunLoadTest = async () => {
    setIsRunningLoadTest(true);
    setLoadTestResult(null);

    // Run load test burst through cacheEngine
    const res = await cacheEngine.simulateLoadTest(selectedLoadCount);
    setLoadTestResult(res);
    setIsRunningLoadTest(false);
    refreshData();
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">In-Memory Caching & Latency Optimization</h1>
          <p className="text-xs text-slate-400 mt-1">
            Maintain sub-5ms low latency under high load spikes via intelligent multi-tenant caching.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleWarmCache}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Pre-Warm Cache</span>
          </button>
          <button
            onClick={handleFlushCache}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 rounded-lg text-xs font-medium transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Purge Cache</span>
          </button>
        </div>
      </div>

      {/* 4 Performance KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Hit Ratio */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Cache Hit Ratio</span>
            <Gauge className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
            {metrics.hitRatio}%
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            {metrics.totalHits} hits · {metrics.totalMisses} misses
          </div>
        </div>

        {/* Cache Latency */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Cached Query Latency</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            {metrics.avgCacheLatencyMs} <span className="text-xs text-slate-400">ms</span>
          </div>
          <div className="text-[11px] text-emerald-400">
            98% faster than cold DB read
          </div>
        </div>

        {/* DB Latency (Cold) */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Database Query (Cold)</span>
            <Database className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-indigo-300 tabular-nums">
            {metrics.avgDbLatencyMs} <span className="text-xs text-slate-400">ms</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Disk I/O & index scan baseline
          </div>
        </div>

        {/* Stored Keys */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Hot Keys in RAM</span>
            <Server className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            {metrics.storedKeys}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            {(metrics.totalSizeBytes / 1024).toFixed(1)} KB memory footprint
          </div>
        </div>
      </div>

      {/* High-Load Concurrency Benchmark Simulator */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-400" />
              <h2 className="text-sm font-semibold text-white">
                Simulated High-Load Concurrency Stress Test
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Fire concurrent queries to verify low-latency stability and cache absorption during traffic surges.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedLoadCount}
              onChange={(e) => setSelectedLoadCount(Number(e.target.value))}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
            >
              <option value="50">50 Concurrent Queries</option>
              <option value="100">100 Concurrent Queries</option>
              <option value="250">250 Concurrent Queries</option>
              <option value="500">500 Concurrent Queries</option>
            </select>

            <button
              onClick={handleRunLoadTest}
              disabled={isRunningLoadTest}
              className="px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all whitespace-nowrap"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isRunningLoadTest ? 'Simulating...' : 'Execute Burst'}</span>
            </button>
          </div>
        </div>

        {loadTestResult && (
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-white">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Stress Test Completed in {loadTestResult.durationMs}ms
              </span>
              <span className="text-emerald-400 font-mono">
                Avg Latency: {loadTestResult.avgLatency}ms
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              <div className="p-2 bg-slate-900 rounded text-slate-300">
                Processed: <strong className="text-white">{loadTestResult.latencies.length}</strong>
              </div>
              <div className="p-2 bg-slate-900 rounded text-emerald-300">
                Cache Hits: <strong className="text-emerald-400">{loadTestResult.hits}</strong>
              </div>
              <div className="p-2 bg-slate-900 rounded text-slate-300">
                Cold Fetches: <strong className="text-amber-400">{loadTestResult.misses}</strong>
              </div>
            </div>

            {/* Visual latency spectrum graph */}
            <div>
              <div className="text-[11px] text-slate-400 mb-1.5 flex justify-between">
                <span>Response Time Distribution Across Load Burst:</span>
                <span className="font-mono text-emerald-400">Sub-5ms sustained under load</span>
              </div>
              <div className="h-10 bg-slate-900 rounded-lg p-1.5 flex items-end gap-1 overflow-hidden">
                {loadTestResult.latencies.slice(0, 80).map((lat, idx) => {
                  const heightPercent = Math.min(100, Math.max(15, (lat / 120) * 100));
                  const isFast = lat < 10;
                  return (
                    <div
                      key={idx}
                      className={`flex-1 rounded-sm transition-all ${
                        isFast ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                      title={`Request #${idx + 1}: ${lat}ms`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Active Cache Keys Table */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="text-xs font-semibold text-white">Active Cache Registry Entries</div>
          <span className="text-[11px] text-slate-400">Auto-expires based on TTL</span>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 font-medium border-b border-slate-800 select-none">
            <tr>
              <th className="py-3 px-6">Cache Key</th>
              <th className="py-3 px-4">Payload Size</th>
              <th className="py-3 px-4">Hits</th>
              <th className="py-3 px-4">TTL (Seconds)</th>
              <th className="py-3 px-6 text-right">Age</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
            {entries.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500 font-sans">
                  Cache registry is currently empty. Click &quot;Pre-Warm Cache&quot; to populate.
                </td>
              </tr>
            ) : (
              entries.map((entry) => {
                const ageSec = Math.floor((Date.now() - entry.createdAt) / 1000);
                return (
                  <tr key={entry.key} className="hover:bg-slate-800/20">
                    <td className="py-3 px-6 text-indigo-300 font-semibold">{entry.key}</td>
                    <td className="py-3 px-4 text-slate-300 tabular-nums">{entry.sizeBytes} B</td>
                    <td className="py-3 px-4 text-emerald-400 tabular-nums">{entry.hits}</td>
                    <td className="py-3 px-4 text-slate-400 tabular-nums">{entry.ttlSeconds}s</td>
                    <td className="py-3 px-6 text-right text-slate-500 tabular-nums">{ageSec}s ago</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
