import create, { GetState, SetState } from 'zustand';
import { eMetadata } from '@dpo-packrat/common';

/*
    Tree Column Store
    This store manages the state and cookies for rendering repository tree view columns

    The workflow of initializing and adjusting width:
        -RepositoryTreeView initializes default or exisiting width of each column and sets it to state
        -RepositoryTreeHeader has a metadataColumns object that is responsible for handling
        each "class" (i.e. column) and gives it a function to dynamically change the width
        based on the widths state object
            -Once there's a useColumnStyles object, it's saved to the state store for later references
            -Creates ResizeObersvers to listen to resizes in each column and handles it using updateWidth
        -MetadataView and TreeLabel can now reference the classes to access the column style
*/

const COL_WIDTH_COOKIE = 'colWidths';
const COL_ORDER_COOKIE = 'colOrder';

type TreeColumns = {
    widths: { [name: string]: string };
    classes: { [name: string]: string };
    order: { [name: string]: string };
    initializeWidth: () => void;
    initializeClasses: (classes: {[name: string]: string}) => void;
    initializeOrder: () => void;
    updateWidth: (colName: eMetadata | string, width: string) => void;
    updateOrder: (colName: eMetadata | string, order: string) => void;
};

export const useTreeColumnsStore = create<TreeColumns>((set: SetState<TreeColumns>, get: GetState<TreeColumns>) => ({
    widths: {},
    classes: {},
    order: {},
    initializeWidth: () => {
        let colWidthsCookie;
        if ((!document.cookie.length || document.cookie.indexOf(COL_WIDTH_COOKIE) === -1)) {
            const defaultWidths = {};
            for (const col in eMetadata) {
                defaultWidths[eMetadata[col]] = '80';
            }
            defaultWidths['object-name'] = '200';
            document.cookie = `${COL_WIDTH_COOKIE}=${JSON.stringify(defaultWidths)};path=/;max-age=630700000`;
        }

        const cookies = document.cookie.split(';');
        colWidthsCookie = cookies.find(entry => entry.trim().startsWith(COL_WIDTH_COOKIE));
        if (colWidthsCookie) {
            colWidthsCookie = JSON.parse(colWidthsCookie.split('=')[1]);
            set({ widths: colWidthsCookie });
        }
    },
    initializeClasses: (classes) => {
        set({ classes });
    },
    initializeOrder: () => {
        let columnOrderCookie;
        if ((!document.cookie.length || document.cookie.indexOf(COL_ORDER_COOKIE) === -1)) {
            const defaultOrder = {};
            let index = 1
            for (const col in eMetadata) {
                defaultOrder[eMetadata[col]] = index;
                index ++;
            }
            document.cookie = `${COL_ORDER_COOKIE}=${JSON.stringify(defaultOrder)};path=/;max-age=630700000`;
        }

        const cookies = document.cookie.split(';');
        columnOrderCookie = cookies.find(entry => entry.trim().startsWith(COL_ORDER_COOKIE));
        if (columnOrderCookie) {
            columnOrderCookie = JSON.parse(columnOrderCookie.split('=')[1]);
            set({ order: columnOrderCookie });
        }
    },
    updateWidth: (colName: eMetadata | string, newWidth: string) => {
        const { widths } = get();

        // When unmounting the headers, their observed width is 0 so we want to ignore that
        if (newWidth === '0') return;
        if (widths[colName] === newWidth) return;

        const newWidths = Object.assign({}, widths);
        newWidths[colName] = newWidth;
        updateCookie(COL_WIDTH_COOKIE, JSON.stringify(newWidths));
        set({ widths: newWidths });
    },
    updateOrder: (colName, newOrder) => {
        const { order } = get();

        if (order[colName] === newOrder) return;

        const newOrders = Object.assign({}, order);
        newOrders[colName] = newOrder;
        updateCookie(COL_ORDER_COOKIE, JSON.stringify(newOrders));
        set({ order: newOrders });
    }
}));


export const updateCookie = (cookieName: string, value: string): void => {
    document.cookie = `${cookieName}=${value};path=/;max-age=630700000`;
};