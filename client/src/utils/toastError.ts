/**
 * toastError
 *
 * Shows an error toast with a specific, user-facing reason when one is available.
 * Prefers a server-provided `message` (our resolvers curate these for users); for a
 * thrown/network Error it keeps the concise fallback rather than surfacing raw
 * exception text. Use this so error toasts state *why* something failed, not just that.
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

    toast.error(message, options);
}

export default toastError;
