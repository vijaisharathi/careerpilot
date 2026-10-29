import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Server,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  Lock,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Spinner } from '../../components/common/Spinner';
import { adminService } from '../../services/admin.service';
import { AdminAiMonitoringStats } from '../../types/admin.types';
import { useToast } from '../../context/ToastContext';

export const AdminAiMonitoringPage: React.FC = () => {
  const { error: toastError } = useToast();

  const [stats, setStats] = useState<AdminAiMonitoringStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const data = await adminService.getAiMonitoring();
      setStats(data);
    } catch (err) {
      toastError('Monitoring Error', (err as Error).message || 'Failed to retrieve AI service metrics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toastError]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Spinner size="lg" className="text-indigo-600 mb-3" />
        <p className="text-xs font-medium text-slate-500">Querying AI telemetry & usage statistics...</p>
      </div>
    );
  }

  const getHealthBadge = (status: string) => {
    switch (status) {
      case 'operational':
        return <Badge variant="success">Operational</Badge>;
      case 'degraded':
        return <Badge variant="warning">Degraded</Badge>;
      case 'failing':
        return <Badge variant="danger">Failing</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">AI Service Configuration & Monitoring</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time telemetry, latency benchmarking, and provider health monitoring for career analysis and interview AI.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Telemetry</span>
        </Button>
      </div>

      {/* Active Provider & Security Banner */}
      <Card className="border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-white to-slate-50">
        <CardContent className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h3 className="text-base font-bold text-slate-900 capitalize">
                  Provider: {stats?.provider}
                </h3>
                {getHealthBadge(stats?.status || 'operational')}
                {stats?.isSimulated && (
                  <Badge variant="info" size="sm">
                    Simulation Mode
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Model: <span className="font-semibold text-slate-700">{stats?.model}</span> • Configured:{' '}
                <span className="font-semibold text-slate-700">{stats?.isConfigured ? 'Yes' : 'No'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-500 bg-white/80 p-2.5 rounded-lg border border-slate-200">
            <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Credential Isolation:</strong> Secret API keys (Gemini / OpenAI) remain secured on the backend
              environment and are never exposed over administrative APIs.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase text-slate-400">Total Requests</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">{stats?.totalRequests ?? 0}</p>
              <p className="text-[11px] text-slate-500 mt-1">Platform lifecycle queries</p>
            </div>
            <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600">
              <Activity className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase text-slate-400">Success Rate</p>
              <p className="text-2xl font-black text-emerald-700 mt-0.5">
                {stats?.successRatePercentage ?? 100}%
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                {stats?.successfulRequests ?? 0} ok • {stats?.failedRequests ?? 0} errors
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase text-slate-400">Average Latency</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">
                {stats?.averageLatencyMs ?? 0} <span className="text-xs font-semibold text-slate-500">ms</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Mean inference turnaround</p>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-100 text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase text-slate-400">Tokens Processed</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">
                {stats?.totalTokensEstimated ? stats.totalTokensEstimated.toLocaleString() : 'N/A'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Estimated token consumption</p>
            </div>
            <div className="p-2.5 rounded-lg bg-purple-50 border border-purple-100 text-purple-600">
              <Layers className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Telemetry Log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Recent AI Execution Logs</CardTitle>
          <CardDescription className="text-xs">
            Real-time request trace records. Student prompt text and private credentials are automatically redacted.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {stats?.recentRequests && stats.recentRequests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200 tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Provider</th>
                    <th className="py-3 px-4">Model</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Outcome</th>
                    <th className="py-3 px-4">Diagnostics</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.recentRequests.map((req, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(req.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800 capitalize">{req.provider}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">{req.model}</td>
                      <td className="py-3 px-4 text-slate-700 font-mono">{req.durationMs} ms</td>
                      <td className="py-3 px-4">
                        <Badge variant={req.success ? 'success' : 'danger'} size="sm">
                          {req.success ? 'Success' : 'Error'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                        {req.errorSummary ? (
                          <span className="text-rose-600 font-medium">{req.errorSummary}</span>
                        ) : (
                          <span className="text-emerald-700">Completed without exceptions</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              No AI queries executed in the current session yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

