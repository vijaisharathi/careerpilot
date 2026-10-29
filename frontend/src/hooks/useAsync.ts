import { useState, useCallback } from 'react';

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

export interface UseAsyncState<T> {
  status: AsyncStatus;
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  isIdle: boolean;
}

export function useAsync<T>() {
  const [state, setState] = useState<UseAsyncState<T>>({
    status: 'idle',
    data: null,
    error: null,
    isLoading: false,
    isSuccess: false,
    isError: false,
    isIdle: true,
  });

  const execute = useCallback(async (asyncFunction: () => Promise<T>): Promise<T | null> => {
    setState({
      status: 'loading',
      data: null,
      error: null,
      isLoading: true,
      isSuccess: false,
      isError: false,
      isIdle: false,
    });

    try {
      const data = await asyncFunction();
      setState({
        status: 'success',
        data,
        error: null,
        isLoading: false,
        isSuccess: true,
        isError: false,
        isIdle: false,
      });
      return data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setState({
        status: 'error',
        data: null,
        error: err,
        isLoading: false,
        isSuccess: false,
        isError: true,
        isIdle: false,
      });
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      status: 'idle',
      data: null,
      error: null,
      isLoading: false,
      isSuccess: false,
      isError: false,
      isIdle: true,
    });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}
