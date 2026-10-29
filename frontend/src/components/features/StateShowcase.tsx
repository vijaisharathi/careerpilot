import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../common/Card';
import { LoadingState } from '../common/LoadingState';
import { ErrorState } from '../common/ErrorState';
import { EmptyState } from '../common/EmptyState';
import { SuccessState } from '../common/SuccessState';
import { Layers, Briefcase } from 'lucide-react';

export const StateShowcase: React.FC = () => {
  const [activeState, setActiveState] = useState<'loading' | 'error' | 'empty' | 'success'>('loading');

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              <CardTitle>Production UI State Architecture</CardTitle>
            </div>
            <CardDescription>
              Interactive showcase verifying consistent loading, error, empty, and success UI handling.
            </CardDescription>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
            {(['loading', 'error', 'empty', 'success'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setActiveState(st)}
                className={`px-3 py-1 text-xs font-semibold rounded-md capitalize transition-all ${
                  activeState === st
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st} State
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 min-h-[260px] flex items-center justify-center">
          {activeState === 'loading' && (
            <div className="w-full max-w-md">
              <LoadingState
                title="Generating Career Assessment..."
                message="Synthesizing student skills, coursework, and industry hiring trends."
              />
            </div>
          )}

          {activeState === 'error' && (
            <div className="w-full max-w-lg">
              <ErrorState
                title="Failed to Load Placement Analytics"
                message="The placement statistics service could not complete the request due to a transient network timeout."
                errorDetails={{
                  endpoint: '/api/placements/analytics',
                  status: 504,
                  code: 'GATEWAY_TIMEOUT',
                  retryAfterSeconds: 5,
                }}
                onRetry={() => alert('Retry action triggered successfully!')}
              />
            </div>
          )}

          {activeState === 'empty' && (
            <div className="w-full max-w-md">
              <EmptyState
                icon={<Briefcase className="w-8 h-8 text-indigo-400" />}
                title="No Job Applications Tracked Yet"
                description="Start adding target internships, campus placement drives, and off-campus opportunities to your tracker."
                actionText="Track First Application"
                onAction={() => alert('Add application modal triggered')}
              />
            </div>
          )}

          {activeState === 'success' && (
            <div className="w-full max-w-lg">
              <SuccessState
                title="Skill Gap Analysis Complete!"
                message="We identified 4 high-value competencies to bridge for your Full-Stack Developer target role."
                actionText="View Learning Roadmap"
                onAction={() => alert('Navigating to roadmap')}
              >
                <div className="p-3 bg-white/80 rounded-lg border border-emerald-200/80 text-xs text-slate-700 space-y-1">
                  <div>🎯 <strong>Identified Skills:</strong> TypeScript, System Design, Docker, Redis</div>
                  <div>📈 <strong>Estimated Time to Readiness:</strong> 6 Weeks (10 hrs/week)</div>
                </div>
              </SuccessState>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
