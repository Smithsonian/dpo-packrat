/**
 * toastError
 *
 * Shows an error toast with a specific, user-facing reason when one is available.
 * Prefers a server-provided `message` (our resolvers curate these for users); for a
 * thrown/network Error it keeps the concise fallback rather than surfacing raw
 * exception text.
 *
 * When an underlying error/result is supplied, the toast appends a short reference id
 * `(XXXX)` and — when there is an extra human-readable reason — an expandable "Details"
 * disclosure showing that concise reason (not a raw object/stack dump). The full source
 * and the same id are written to the browser console as a collapsed group, so developers
 * still have the complete technical detail there.
 */
import React from 'react';
import { toast, ToastOptions } from 'react-toastify';
import { MdContentCopy } from 'react-icons/md';
import { getTraceId } from './traceRegistry';

type ResultWithMessage = { message?: string | null };

function shortId(): string {
    return Math.random().toString(36).slice(2, 6).toUpperCase();
}

function extractTraceId(source: unknown): string {
    // GraphQL results are registered in the trace registry (no field on the object);
    // REST results carry a `traceId` field directly.
    const registered = getTraceId(source);
    if (registered)
        return registered;
    if (source && typeof source === 'object') {
        const t = (source as { traceId?: unknown }).traceId;
        if (typeof t === 'string' && t.trim().length > 0)
            return t.trim();
    }
    return '';
}

function extractDetail(source: unknown): string {
    if (source instanceof Error)
        return source.message;
    if (typeof source === 'string')
        return source;
    if (source && typeof source === 'object') {
        const r = source as { detail?: unknown; message?: unknown; error?: unknown };
        // A dedicated `detail` is the expanded reason (e.g. the list of affected files) and takes
        // priority so it shows in the disclosure even when a short `message` is the toast headline.
        if (typeof r.detail === 'string' && r.detail.trim().length > 0)
            return r.detail.trim();
        if (typeof r.message === 'string' && r.message.trim().length > 0)
            return r.message.trim();
        if (typeof r.error === 'string' && r.error.trim().length > 0)
            return r.error.trim();
    }
    return '';
}

// Copies the toast's text (headline, expanded detail when present, and the full trace id) so a user
// can paste it into a bug report or a log search. Shows a copy icon, flips to "Copied" on click, then
// reverts to the icon so it can be copied again. Fails silently when the clipboard API is absent.
function CopyButton({ text }: { text: string }): React.ReactElement {
    const [copied, setCopied] = React.useState<boolean>(false);
    const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    React.useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);
    const onCopy = (e: React.MouseEvent): void => {
        e.preventDefault();
        e.stopPropagation();
        try {
            void navigator.clipboard?.writeText(text);
            setCopied(true);
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => setCopied(false), 1500);
        } catch { /* clipboard unavailable; ignore */ }
    };
    return (
        <button type='button' onClick={onCopy} title='Copy' aria-label='Copy error details'
            style={{ marginLeft: 8, cursor: 'pointer', fontSize: '0.75em', padding: 0, border: 'none',
                background: 'transparent', color: 'inherit', verticalAlign: 'middle', display: 'inline-flex', alignItems: 'center' }}
        >
            {copied ? '** copied **' : <MdContentCopy style={{ fontSize: '1.3em' }} />}
        </button>
    );
}

export function toastError(source: unknown, fallback: string, options?: ToastOptions): void {
    let message = fallback;

    // Server results carry a user-ready `message`; prefer it. Error/thrown objects are
    // technical or network noise, so keep the generic fallback for those.
    if (source && typeof source === 'object' && !(source instanceof Error)) {
        const candidate = (source as ResultWithMessage).message;
        if (typeof candidate === 'string' && candidate.trim().length > 0)
            message = candidate.trim();
    }

    // No underlying detail: a plain, clean toast with nothing to reference or expand.
    if (source === undefined || source === null) {
        toast.error(message, options);
        return;
    }

    const traceId = extractTraceId(source);
    // Prefer the request's server-logged trace id (shown as an 8-char prefix, searchable in the
    // server logs). When the source carries none, fall back to a local code marked `local:` so it is
    // not mistaken for a server trace — its absence signals the trace id did not reach the client.
    const ref = traceId ? traceId.slice(0, 8) : `local:${shortId()}`;
    const detail = extractDetail(source);
    // Only offer Details when it adds a human-readable reason beyond the main message.
    const showDetails = detail.length > 0 && detail !== message;

    // Collapsed console group keyed by the reference shown in the toast; the full trace id
    // (searchable in the server logs) and the full source stay here for developers.
    console.groupCollapsed(`[toastError ${traceId || ref}] ${message}`);
    console.error(source);
    console.groupEnd();

    // Copy carries the full trace id (not the 8-char ref) so it is directly searchable in the logs.
    const copyPayload = `${message}${showDetails ? `\n\n${detail}` : ''}\n(${traceId || ref})`;
    const content = (
        <div>
            <span>{message} ({ref})</span>
            <CopyButton text={copyPayload} />
            {showDetails && (
                <details style={{ marginTop: 4 }}>
                    <summary style={{ cursor: 'pointer', fontSize: '0.85em' }}>Details</summary>
                    <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.8em', marginTop: 4 }}>{detail}</div>
                </details>
            )}
        </div>
    );

    // closeOnClick disabled so the user can expand Details without dismissing the toast;
    // a caller-supplied option still wins.
    toast.error(content, { closeOnClick: false, ...options });
}

export default toastError;
