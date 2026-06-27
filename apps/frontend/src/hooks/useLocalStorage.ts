import { useState, useCallback } from 'react';

type SetValue<T> = (value: T | ((prev: T) => T)) => void;
type RemoveValue = () => void;

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, SetValue<T>, RemoveValue] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item !== null ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue: SetValue<T> = useCallback(
    (value) => {
      try {
        const valueToStore = typeof value === 'function'
          ? (value as (prev: T) => T)(storedValue)
          : value;
        setStoredValue(valueToStore);
        localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.warn(`useLocalStorage: erro ao salvar chave "${key}"`, error);
      }
    },
    [key, storedValue]
  );

  const removeValue: RemoveValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`useLocalStorage: erro ao remover chave "${key}"`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}
