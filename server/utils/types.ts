export function maybe<T>(value: T | undefined | null): T | null {
    return value ?? null;
}
