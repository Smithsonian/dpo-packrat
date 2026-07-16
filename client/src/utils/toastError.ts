/**
 * toastError
 *
 * Shows an error toast with a specific, user-facing reason when one is available.
 * Prefers a server-provided `message` (our resolvers curate these for users); for a
 * thrown/network Error it keeps the concise fallback rather than surfacing raw
 * exception text. Use this so error toasts state *why* something failed, not just that.
 * The underlying error/result is also logged to the browser console, so the technical
 * detail is captured client-side even though the toast shows only a safe message.
 */
import { toast, ToastOptions } from 'react-toastify';

type ResultWithMessage = { message?: string | null };

export function toastError(source: unknown, fallback: string, options?: ToastOptions): void {
    let message = fallback;

    // Server results carry a user-ready `message`; prefer it. Error/thrown objects are
    // technical or network noise, so keep the generic fallback for those.
    if (source && typeof source === 'object' && !(source instanceof Error)) {
        const candidate = (source as ResultWithMessage).message;
        if (typeof candidate === 'string' && candidate.trim().length > 0)
            message = candidate.trim();
    }

    // Preserve the underlying error/result in the browser console for debugging; the toast
    // shows only the user-facing message and never raw exception text.
    if (source !== undefined && source !== null)
        console.error('[toastError]', message, source);

    toast.error(message, options);
}

export default toastError;
