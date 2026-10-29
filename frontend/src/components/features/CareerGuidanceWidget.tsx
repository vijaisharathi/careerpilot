import React, { useState } from 'react';
import { Sparkles, Send, Bot, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { ErrorState } from '../common/ErrorState';
import { LoadingState } from '../common/LoadingState';
import { aiService } from '../../services/ai.service';
import { AiCareerAdviceResponse } from '../../types/api.types';

export const CareerGuidanceWidget: React.FC = () => {
  const [prompt, setPrompt] = useState(
    'I am a 3rd year CS student with knowledge in React and Python. What career paths and internships should I target?'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<AiCareerAdviceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || prompt.length < 3) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await aiService.getCareerAdvice(prompt);
      setResponse(data);
    } catch (err) {
      setError((err as Error).message || 'Failed to generate career advice');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <CardTitle>AI Career Guidance Pipeline</CardTitle>
            </div>
            <CardDescription>
              Demonstration of the provider-independent LLM integration service architecture.
            </CardDescription>
          </div>

          <Badge variant="info" size="sm">
            <Bot className="w-3.5 h-3.5 mr-1 inline" /> Provider-Independent
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label htmlFor="prompt" className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
              Student Profile or Career Query
            </label>
            <textarea
              id="prompt"
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. 2nd year IT student aiming for campus placements in backend engineering..."
              className="w-full text-sm rounded-lg border border-slate-300 p-3 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm"
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Validated with Zod schema (min 3 chars, max 2000 chars)
            </span>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              loadingText="Analyzing Profile..."
              leftIcon={<Send className="w-4 h-4" />}
              disabled={!prompt.trim() || prompt.length < 3}
            >
              Analyze with Career Pilot AI
            </Button>
          </div>
        </form>

        {isLoading && (
          <div className="mt-6">
            <LoadingState
              title="Querying AI Service Engine..."
              message="Processing student career query through the provider-independent integration pipeline."
            />
          </div>
        )}

        {error && (
          <div className="mt-6">
            <ErrorState
              title="Career Guidance Generation Failed"
              message={error}
              onRetry={() => handleGenerate({ preventDefault: () => {} } as React.FormEvent)}
            />
          </div>
        )}

        {response && !isLoading && (
          <div className="mt-6 p-5 rounded-xl border border-indigo-100 bg-indigo-50/30">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-indigo-100/70 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-slate-800">Analysis Response Generated</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono bg-white px-2 py-0.5 rounded border border-indigo-200">
                  Provider: {response.provider}
                </span>
                {response.isSimulated ? (
                  <Badge variant="warning" size="sm">
                    Offline Simulation
                  </Badge>
                ) : (
                  <Badge variant="success" size="sm">
                    Live Model
                  </Badge>
                )}
              </div>
            </div>

            <pre className="text-sm font-sans text-slate-800 whitespace-pre-wrap leading-relaxed">
              {response.text}
            </pre>

            <div className="mt-4 pt-3 border-t border-indigo-100/60 flex items-center justify-between text-[11px] text-slate-400">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" /> Transparent LLM Response Envelope
              </span>
              {response.usage?.totalTokens && (
                <span>Tokens consumed: {response.usage.totalTokens}</span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
