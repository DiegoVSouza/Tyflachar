import { useState, useCallback, useRef, useEffect } from 'react';

interface UseApiReturn<T> {
  execute: (...args: unknown[]) => Promise<T | null>;
  data: T | null;
  isLoading: boolean;
  error: string | null;
  reset: () => void;
}

export function useApi<T = unknown>(
  serviceMethod: (...args: unknown[]) => Promise<T>
): UseApiReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const execute = useCallback(
    async (...args: unknown[]): Promise<T | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await serviceMethod(...args);
        if (isMountedRef.current) setData(result);
        return result;
      } catch (err) {
        if (isMountedRef.current) {
          setError((err as Error).message ?? 'Ocorreu um erro inesperado.');
        }
        return null;
      } finally {
        if (isMountedRef.current) setIsLoading(false);
      }
    },
    [serviceMethod]
  );

  const reset = useCallback((): void => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { execute, data, isLoading, error, reset };
}
