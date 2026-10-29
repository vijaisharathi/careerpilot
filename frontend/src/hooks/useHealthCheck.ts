import { useState, useEffect, useCallback } from 'react';
import { healthService } from '../services/health.service';
import { HealthCheckData } from '../types/api.types';

export function useHealthCheck(autoPollIntervalMs: number = 0) {
  const [data, setData] = useState<HealthCheckData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkHealth = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await healthService.getHealth();
      setData(result);
      setLastChecked(new Date());
    } catch (err) {
      setError((err as Error).message || 'Unable to connect to backend service');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();

    if (autoPollIntervalMs > 0) {
      const interval = setInterval(checkHealth, autoPollIntervalMs);
      return () => clearInterval(interval);
    }
  }, [checkHealth, autoPollIntervalMs]);

  return {
    data,
    isLoading,
    error,
    lastChecked,
    refetch: checkHealth,
  };
}
