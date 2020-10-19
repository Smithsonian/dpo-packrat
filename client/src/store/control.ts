import create, { SetState } from 'zustand';

type ControlStore = {
    sideBarExpanded: boolean;
    toggleSidebar: (sideBarExpanded: boolean) => void;
};

export const useControlStore = create<ControlStore>((set: SetState<ControlStore>) => ({
    sideBarExpanded: true,
    toggleSidebar: (sideBarExpanded: boolean): void => {
        set({ sideBarExpanded });
    }
}));
