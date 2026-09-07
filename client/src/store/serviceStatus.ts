/**
 * Service Status Store
 *
 * This store tracks the availability of backend services (Database, Solr, EDAN)
 * and exposes state for banners and toasts.
 */
import create, { GetState, SetState } from 'zustand';
import { toast } from 'react-toastify';
import API from '../api';

interface ServiceStatusState {
    database: boolean;
    solr: boolean;
    edan: boolean;
}

// Server-side feature gates mirrored into the client so the UI only offers what the
// server will accept. Defaults are conservative (off) until the first status poll.
interface ServiceFeatures {
    volumetricIngest: boolean;
}

type ServiceStatusStore = {
    status: ServiceStatusState;
    features: ServiceFeatures;
    initialized: boolean;
    checkStatus: () => Promise<void>;
    startPolling: () => void;
    stopPolling: () => void;
    _intervalId: ReturnType<typeof setInterval> | null;
};

const POLL_INTERVAL = 60000; // 60 seconds

export const useServiceStatusStore = create<ServiceStatusStore>((set: SetState<ServiceStatusStore>, get: GetState<ServiceStatusStore>) => ({
    status: { database: true, solr: true, edan: true },
    features: { volumetricIngest: false },
    initialized: false,
    _intervalId: null,
    checkStatus: async (): Promise<void> => {
        try {
            const result = await API.getServiceStatus();
            if (!result) return;

            const prev = get().status;
            const next: ServiceStatusState = {
                database: result.database ?? false,
                solr: result.solr ?? false,
                edan: result.edan ?? false,
            };

            // Show toasts on state transitions (was up, now down)
            if (prev.database && !next.database) {
                toast.error('Database is unreachable. Some features may be unavailable.', { toastId: 'db-down' });
            }
            if (prev.solr && !next.solr) {
                toast.warn('Repository search service is unavailable. Please try again later or contact support.', { toastId: 'solr-down' });
            }
            if (prev.edan && !next.edan) {
                toast.warn('EDAN publishing service is unreachable. Publishing and ingestion from EDAN are unavailable.', { toastId: 'edan-down' });
            }

            // Show recovery toasts
            if (!prev.database && next.database && get().initialized) {
                toast.success('Database connection restored.', { toastId: 'db-up' });
            }
            if (!prev.solr && next.solr && get().initialized) {
                toast.success('Search service restored.', { toastId: 'solr-up' });
            }
            if (!prev.edan && next.edan && get().initialized) {
                toast.success('EDAN publishing service restored.', { toastId: 'edan-up' });
            }

            const features: ServiceFeatures = {
                volumetricIngest: result.features?.volumetricIngest ?? false,
            };

            set({ status: next, features, initialized: true });
        } catch {
            // If the status endpoint itself fails, assume everything is down
            const prev = get().status;
            if (prev.database || prev.solr || prev.edan) {
                toast.error('Unable to reach the server. Services may be unavailable.', { toastId: 'server-down' });
            }
            set({ status: { database: false, solr: false, edan: false }, initialized: true });
        }
    },
    startPolling: (): void => {
        const { _intervalId, checkStatus } = get();
        if (_intervalId) return; // already polling

        checkStatus();
        const id = setInterval(checkStatus, POLL_INTERVAL);
        set({ _intervalId: id });
    },
    stopPolling: (): void => {
        const { _intervalId } = get();
        if (_intervalId) {
            clearInterval(_intervalId);
            set({ _intervalId: null });
        }
    },
}));
