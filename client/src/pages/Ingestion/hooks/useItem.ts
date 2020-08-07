import { Item, AppContext, IngestionDispatchAction, ITEM_ACTIONS } from '../../../context';
import { useContext } from 'react';
import lodash from 'lodash';

interface UseItem {
    getSelectedItem: () => Item | undefined;
    addItems: (items: Item[]) => void;
    updateItem: (item: Item) => void;
}

function useItem(): UseItem {
    const {
        ingestion: { items },
        ingestionDispatch
    } = useContext(AppContext);

    const getSelectedItem = () => lodash.find(items, { selected: true });

    const addItems = (fetchedItems: Item[]) => {
        const newItems: Item[] = [];

        fetchedItems.forEach((item: Item) => {
            const { id } = item;
            const alreadyExists = !!lodash.find(items, { id });

            if (!alreadyExists) {
                newItems.push(item);
            }
        });

        const addItemsAction: IngestionDispatchAction = {
            type: ITEM_ACTIONS.ADD_ITEMS,
            items: newItems
        };

        ingestionDispatch(addItemsAction);
    };

    const updateItem = (item: Item) => {
        const { selected } = item;

        const updateItemAction = (item: Item): IngestionDispatchAction => ({
            type: ITEM_ACTIONS.UPDATE_ITEM,
            item
        });

        if (selected) {
            const alreadySelected: Item | undefined = getSelectedItem();

            if (alreadySelected) {
                const unselectedItem = {
                    ...alreadySelected,
                    selected: false
                };

                ingestionDispatch(updateItemAction(unselectedItem));
            }
        }

        ingestionDispatch(updateItemAction(item));
    };

    return {
        addItems,
        updateItem,
        getSelectedItem
    };
}

export default useItem;
