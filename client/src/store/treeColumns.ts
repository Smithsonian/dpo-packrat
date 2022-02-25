import create, { GetState, SetState } from 'zustand';
import { eMetadata } from '@dpo-packrat/common';

const COL_WIDTH_COOKIE = 'colWidths';

type TreeColumns = {
    widths: {};
    initializeWidth: () => void;
    updateWidth: (colName: eMetadata, width: string) => void;
};

export const useTreeColumnsStore = create<TreeColumns>((set: SetState<TreeColumns>, get: GetState<TreeColumns>) => ({
    widths: {},
    initializeWidth: () => {
        let colWidthsCookie;
        // console.log('initializeWidth');
        if ((!document.cookie.length || document.cookie.indexOf(COL_WIDTH_COOKIE) === -1)) {
            // console.log('resetting cookie');
            document.cookie = `${COL_WIDTH_COOKIE}={};path=/;max-age=630700000`;
        }

        const cookies = document.cookie.split(';');
        colWidthsCookie = cookies.find(entry => entry.trim().startsWith(COL_WIDTH_COOKIE));
        if (colWidthsCookie) {
            colWidthsCookie = JSON.parse(colWidthsCookie.split('=')[1]);
            // console.log("colWidthsCookie", colWidthsCookie);
            set({ widths: colWidthsCookie });
        }
    },
    updateWidth: (colName: eMetadata, newWidth: string) => {
        const { widths } = get();
        // When unmounting the headers, their observed width is 0 so we want to ignore that
        if (newWidth === '0') return;
        
        if (widths[colName] === newWidth) return;
        
        const newWidths = Object.assign({}, widths);
        newWidths[colName] = newWidth;
        updateCookie(COL_WIDTH_COOKIE, JSON.stringify(newWidths));
        set({ widths: newWidths });
    }
}));


export const updateCookie = (cookieName: string, value: string) => {
    document.cookie = `${cookieName}=${value};path=/;max-age=630700000`;
}