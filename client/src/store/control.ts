/**
 * Control Store
 *
 * This store manages state for root level sidebar.
 */
import create, { SetState } from 'zustand';
import { updateCookie } from './treeColumns';

const SIDEBAR_POSITION_COOKIE = 'isSidebarExpanded';

type ControlStore = {
    sideBarExpanded: boolean;
    toggleSidebar: (sideBarExpanded: boolean) => void;
    initializeSidebarPosition: () => void;
};

export const useControlStore = create<ControlStore>((set: SetState<ControlStore>) => ({
    sideBarExpanded: true,
    toggleSidebar: (sideBarExpanded: boolean): void => {
        updateCookie(SIDEBAR_POSITION_COOKIE, String(sideBarExpanded));
        set({ sideBarExpanded });
    },
    initializeSidebarPosition: () => {
        let sidebarCookie;
        if ((!document.cookie.length || document.cookie.indexOf(SIDEBAR_POSITION_COOKIE) === -1)) {
            document.cookie = `${SIDEBAR_POSITION_COOKIE}=${true};path=/;max-age=630700000`;
        }

        const cookies = document.cookie.split(';');
        sidebarCookie = cookies.find(entry => entry.trim().startsWith(SIDEBAR_POSITION_COOKIE));
        if (sidebarCookie) {
            sidebarCookie = sidebarCookie.split('=')[1];
            set({ sideBarExpanded: sidebarCookie === 'true' ? true : false });
        }
    }
}));
