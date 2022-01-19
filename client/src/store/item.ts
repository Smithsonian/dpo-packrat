/**
 * Item Store
 *
 * This store manages state for items used in Ingestion flow.
 */
import create, { SetState, GetState } from 'zustand';
import lodash from 'lodash';

export const defaultItem: StateItem = {
    id: 'default',
    name: '',
    entireSubject: true,
    selected: true
};

export type StateItem = {
    id: string;
    name: string;
    entireSubject: boolean;
    selected: boolean;
};

type ItemStore = {
    items: StateItem[];
    loading: boolean;
    getSelectedItem: () => StateItem | undefined;
    addItems: (items: StateItem[]) => void;
    updateItem: (item: StateItem) => void;
    loadingItems: () => void;
    reset: () => void;
};

export const useItemStore = create<ItemStore>((set: SetState<ItemStore>, get: GetState<ItemStore>) => ({
    items: [defaultItem],
    loading: false,
    getSelectedItem: (): StateItem | undefined => {
        const { items } = get();
        return lodash.find(items, { selected: true });
    },
    addItems: (fetchedItems: StateItem[]): void => {
        const { items } = get();
        const currentDefaultItem = lodash.find(items, { id: defaultItem.id });

        if (currentDefaultItem) {
            if (!fetchedItems.length) {
                const selectedDefaultItem = { ...currentDefaultItem, selected: true };
                set({ items: [selectedDefaultItem], loading: false });
                return;
            }

            currentDefaultItem.selected = false;
            const newItemSelected = lodash.find(fetchedItems, { selected: true });

            if (!newItemSelected)
                fetchedItems[0].selected = true;

            const newItems: StateItem[] = fetchedItems.concat([currentDefaultItem]);

            set({ items: newItems, loading: false });
        }
    },
    updateItem: (item: StateItem): void => {
        const { items, getSelectedItem } = get();
        const { selected } = item;

        let updatedItems = items;

        const mapItems = (newItem: StateItem): StateItem[] =>
            lodash.map(updatedItems, item => {
                if (item.id === newItem.id) {
                    return newItem;
                }
                return item;
            });

        if (selected) {
            const alreadySelected: StateItem | undefined = getSelectedItem();
            if (alreadySelected) {
                const unselectedItem = {
                    ...alreadySelected,
                    selected: false
                };
                updatedItems = mapItems(unselectedItem);
                set({ items: updatedItems });
            }
        }

        updatedItems = mapItems(item);
        set({ items: updatedItems });
    },
    loadingItems: (): void => {
        set({ loading: true });
    },
    reset: (): void => {
        set({ items: [defaultItem], loading: false });
    }
}));
