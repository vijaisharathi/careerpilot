import React from 'react';
import { Server, Database, Bot, RefreshCw, CheckCircle2, AlertCircle, Clock, Cpu } from 'lucide-react';
import { useHealthCheck } from '../../hooks/useHealthCheck';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';

export const HealthStatusWidget: React.FC = () => {
  const { data, isLoading, error, lastChecked, refetch } = useHealthCheck(30000);

  return (
    <Card className="border-indigo-100 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-indigo-50/50 to-white">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle>System & Services Health</CardTitle>
            {data ? (
              <Badge variant={data.status === 'healthy' ? 'success' : 'warning'} size="sm" dot>
                {data.status.toUpperCase()}
              </Badge>
            ) : null}
          </div>
          <CardDescription>
            Live verification of API server, MongoDB connection, and LLM provider integration.
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          isLoading={isLoading}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Check Now
        </Button>
      </CardHeader>

      <CardContent className="pt-6">
        {error ? (
          <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <div className="font-semibold">Unable to connect to backend API server</div>
              <p className="mt-1 text-xs text-rose-700">{error}</p>
              <div className="mt-2 text-xs text-slate-600">
                Ensure backend server is running with <code className="bg-white px-1.5 py-0.5 rounded border border-rose-200">npm run dev:backend</code> on port 5000.
              </div>
            </div>
          </div>
        ) : !data ? (
          <div className="text-center py-6 text-slate-400 text-sm">Loading health status...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* API Server */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-500">API Server</span>
                <Server className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="mt-3">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-slate-800 text-sm">{data.service}</span>
                </div>
                <div className="text-xs text-slate-500 mt-1 capitalize font-mono">
                  Env: {data.environment}
                </div>
              </div>
            </div>

            {/* Database */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-500">Database</span>
                <Database className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-3">
                <div className="flex items-center gap-1.5">
                  {data.database.connected ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                  )}
                  <span className="font-semibold text-slate-800 text-sm">{data.database.provider}</span>
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  Status:
                  <span className={data.database.connected ? 'text-emerald-700 font-medium' : 'text-amber-700 font-medium'}>
                    {data.database.status}
                  </span>
                </div>
              </div>
            </div>

            {/* AI Provider */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-500">AI Service</span>
                <Bot className="w-4 h-4 text-purple-600" />
              </div>
              <div className="mt-3">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-800 text-sm capitalize">
                    {data.aiService.provider} Provider
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {data.aiService.simulated ? (
                    <span className="text-indigo-600 font-medium">Offline Simulation Mode</span>
                  ) : (
                    <span className="text-emerald-600 font-medium">Configured Live Engine</span>
                  )}
                </div>
              </div>
            </div>

            {/* System Info */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-500">System Telemetry</span>
                <Cpu className="w-4 h-4 text-slate-600" />
              </div>
              <div className="mt-3 text-xs text-slate-600 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Memory:</span>
                  <span className="font-mono">{data.system.memoryUsageMb} MB</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Uptime:</span>
                  <span className="font-mono">{data.uptimeSeconds}s</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {lastChecked && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" /> Last verified: {lastChecked.toLocaleTimeString()}
            </span>
            <span>REST API Endpoint: <code className="text-slate-600 font-mono">GET /api/health</code></span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
