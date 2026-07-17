/**
 * traceRegistry
 *
 * Associates a request's trace id with the result objects it produced, without mutating
 * those objects (Apollo may freeze cached results). The Apollo client wrappers register
 * each GraphQL result's trace id here; toastError reads it back so the id shown in an
 * error toast matches the traceId the server logged for that request.
 *
 * A WeakMap keyed by the result object means entries are collected automatically when the
 * result is no longer referenced — no manual cleanup, no leak.
 */
type TraceKey = Record<string, unknown>;

const registry: WeakMap<TraceKey, string> = new WeakMap<TraceKey, string>();

export function setTraceId(target: unknown, traceId: string): void {
    if (target && typeof target === 'object' && traceId)
        registry.set(target as TraceKey, traceId);
}

export function getTraceId(target: unknown): string {
    if (target && typeof target === 'object')
        return registry.get(target as TraceKey) ?? '';
    return '';
}
