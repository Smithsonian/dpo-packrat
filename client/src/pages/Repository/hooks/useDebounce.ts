/* eslint-disable react-hooks/exhaustive-deps */
/**
 * Debounce hook
 *
 * This custom hook provides de-bouncing functionality.
 */
import { useState, useEffect } from 'react';

export default function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value]);

    return debouncedValue;
}
