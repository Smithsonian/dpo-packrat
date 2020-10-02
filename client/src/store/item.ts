import create from 'zustand';
import lodash from 'lodash';

export const defaultItem: StateItem = {
    id: 'default',
    name: '',
    entireSubject: false,
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
    reset: () => void;
};

export const useItem = create<ItemStore>((set, get) => ({
    items: [defaultItem],
    loading: false,
    getSelectedItem: () => {
        const { items } = get();
        return lodash.find(items, { selected: true });
    },
    addItems: (fetchedItems: StateItem[]): void => {
        const { items } = get();
        const currentDefaultItem = lodash.find(items, { id: defaultItem.id });

        if (currentDefaultItem) {
            if (!fetchedItems.length) {
                const selectedDefaultItem = { ...currentDefaultItem, selected: true };
                set({ items: [selectedDefaultItem] });
                return;
            }

            const newItemSelected = lodash.find(fetchedItems, { selected: true });

            if (newItemSelected) {
                currentDefaultItem.selected = false;
            }

            const newItems: StateItem[] = [currentDefaultItem].concat(fetchedItems);

            set({ items: newItems });
        }
    },
    updateItem: (item: StateItem) => {
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
    reset: (): void => {
        set({ items: [defaultItem], loading: false });
    }
}));
