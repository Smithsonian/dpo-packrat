/**
 * Details Edit Store
 *
 * Tracks whether the repository details view has unsaved edits, so navigation
 * away from it can prompt before the changes are lost.
 */
import create, { SetState } from 'zustand';

type DetailsEditStore = {
    isDetailsDirty: boolean;
    setDetailsDirty: (isDetailsDirty: boolean) => void;
};

export const useDetailsEditStore = create<DetailsEditStore>((set: SetState<DetailsEditStore>) => ({
    isDetailsDirty: false,
    setDetailsDirty: (isDetailsDirty: boolean): void => set({ isDetailsDirty })
}));

// Returns true when it is safe to navigate away from a details view (no unsaved
// edits, or the user confirmed leaving); false to stay. Mirrors confirmLeaveIngestion.
export function confirmLeaveEdit(): boolean {
    if (!useDetailsEditStore.getState().isDetailsDirty)
        return true;
    return window.confirm('You have unsaved changes. Are you sure you want to navigate away? Changes will be lost.');
}
