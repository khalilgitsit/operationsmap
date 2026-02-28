import { useState, useEffect, type Dispatch, type SetStateAction } from 'react';

/**
 * A boolean toggle whose value is persisted to localStorage.
 * SSR-safe: returns `defaultValue` on the server.
 */
export function usePersistentToggle(
  storageKey: string,
  defaultValue = false,
): [boolean, Dispatch<SetStateAction<boolean>>] {
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') return defaultValue;
    return localStorage.getItem(storageKey) === 'true';
  });

  useEffect(() => {
    localStorage.setItem(storageKey, String(value));
  }, [storageKey, value]);

  return [value, setValue];
}
