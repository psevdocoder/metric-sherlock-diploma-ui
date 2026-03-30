import { useEffect, useState } from 'react';

export function useDebouncedValue<T>(value: T, delay_ms: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delay_ms);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [delay_ms, value]);

  return debouncedValue;
}
