/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
export function maybe<T>(value: T | undefined | null): T | null {
    return value ?? null;
}

export function maybeString(value: any): string | null {
    return (typeof value === 'string') ? value : null;
}
