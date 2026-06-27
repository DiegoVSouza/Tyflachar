import { useState, useCallback } from 'react';

type ToggleTuple = [boolean, () => void, (value: boolean) => void];

export function useToggle(initialValue = false): ToggleTuple {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => setValue((v) => !v), []);
  const set = useCallback((v: boolean) => setValue(Boolean(v)), []);

  return [value, toggle, set];
}
