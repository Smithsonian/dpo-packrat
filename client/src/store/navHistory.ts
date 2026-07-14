/**
 * Navigation History Store
 *
 * Records the trail of repository objects the user actually visited (a "how you
 * got here" path), so the details header can show clickable breadcrumbs that step
 * back the way the user came — distinct from an object's ancestry hierarchy.
 *
 * The trail is persisted to sessionStorage so a refresh keeps it, while a fresh
 * tab starts empty (a new journey).
 */
import create, { SetState, GetState } from 'zustand';

export type NavCrumb = {
    idSystemObject: number;
    objectType: number;
    name: string;
    url: string;
    // When set, render this label verbatim instead of "<type> <name>" — used for the
    // synthetic "Repository" root crumb, which has no real system object.
    label?: string;
};

// Sentinel id for the synthetic repository-root crumb (real objects are positive).
export const NAV_ROOT_ID = 0;

const STORAGE_KEY = 'navTrail';
const TRAIL_CAP = 8;

function loadTrail(): NavCrumb[] {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveTrail(trail: NavCrumb[]): void {
    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(trail));
    } catch {
        // ignore storage failures (private mode / quota)
    }
}

type NavHistoryStore = {
    trail: NavCrumb[];
    visit: (crumb: NavCrumb) => void;
    seedRoot: (rootCrumb: NavCrumb) => void;
    truncateTo: (index: number) => void;
    reset: () => void;
};

export const useNavHistoryStore = create<NavHistoryStore>((set: SetState<NavHistoryStore>, get: GetState<NavHistoryStore>) => ({
    trail: loadTrail(),
    seedRoot: (rootCrumb: NavCrumb): void => {
        // Entering the repository tree starts a fresh journey seeded with the root
        // crumb, so subsequent object hops read as "Repository › … › here".
        set({ trail: [rootCrumb] });
        saveTrail([rootCrumb]);
    },
    visit: (crumb: NavCrumb): void => {
        const trail = get().trail;
        const existingIndex = trail.findIndex(c => c.idSystemObject === crumb.idSystemObject);
        let next: NavCrumb[];
        if (existingIndex >= 0) {
            // already visited earlier: truncate back to it (keeps browser Back/forward in sync)
            next = trail.slice(0, existingIndex + 1);
            next[existingIndex] = crumb; // refresh name/type in case it changed since
        } else {
            next = [...trail, crumb];
        }
        if (next.length > TRAIL_CAP)
            next = next.slice(next.length - TRAIL_CAP);
        set({ trail: next });
        saveTrail(next);
    },
    truncateTo: (index: number): void => {
        const next = get().trail.slice(0, index + 1);
        set({ trail: next });
        saveTrail(next);
    },
    reset: (): void => {
        set({ trail: [] });
        saveTrail([]);
    }
}));
