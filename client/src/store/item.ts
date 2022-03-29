/**
 * Item Store
 *
 * This store manages state for items used in Ingestion flow.
 */
import create, { SetState, GetState } from 'zustand';
import lodash from 'lodash';
import { apolloClient } from '../graphql';
import { ApolloQueryResult } from '@apollo/client';
import {
    GetProjectListQuery,
    GetProjectListDocument,
    GetIngestionItemsDocument,
    GetIngestionItemsQuery,
    Project
} from '../types/graphql';
import { toast } from 'react-toastify';
import { parseIngestionItemToState } from './utils';

export type StateItem = {
    id: string;
    subtitle: string;
    entireSubject: boolean | null;
    selected: boolean;
    idProject: number;
    projectName: string;
};

export type StateProject = {
    id: number;
    name: string;
    selected: boolean;
};

export const defaultItem: StateItem = {
    id: 'default',
    subtitle: '',
    entireSubject: null,
    selected: false,
    idProject: -1,
    projectName: ''
};

type ItemStore = {
    items: StateItem[];
    newItem: StateItem;
    hasNewItem: boolean;
    loading: boolean;
    projectList: Project[];
    getSelectedItem: () => StateItem | undefined;
    addItems: (items: StateItem[]) => void;
    addNewItem: () => Promise<void>;
    updateNewItemEntireSubject: (entireSubject: boolean) => void;
    updateNewItemSubtitle: (event: React.ChangeEvent<HTMLInputElement>) => void;
    updateNewItemProject: (idProject: number) => void;
    updateSelectedItem: (id: string) => void;
    loadingItems: () => void;
    fetchIngestionItems: (idSubjects: number[]) => Promise<void>;
    reset: () => void;
};

export const useItemStore = create<ItemStore>((set: SetState<ItemStore>, get: GetState<ItemStore>) => ({
    items: [],
    newItem: { ...defaultItem },
    hasNewItem: false,
    loading: false,
    projectList: [],
    getSelectedItem: (): StateItem | undefined => {
        const { items, newItem } = get();
        const selectedItem = newItem.selected ? newItem : lodash.find(items, { selected: true });
        return selectedItem;
    },
    addItems: (fetchedItems: StateItem[]): void => {
        const { items } = get();
        const currentDefaultItem = lodash.find(items, { id: defaultItem.id });

        if (!fetchedItems.length)
            return;

        const newItemSelected = lodash.find(fetchedItems, { selected: true });

        if (!newItemSelected)
            fetchedItems[0].selected = true;

        if (currentDefaultItem)
            currentDefaultItem.selected = false;

        const newItems: StateItem[] = [...fetchedItems];
        if (currentDefaultItem)
            newItems.push(currentDefaultItem);


        set({ items: newItems, loading: false });
    },
    addNewItem: async () => {
        const { items, newItem } = get();
        try {
            const projectListQuery: ApolloQueryResult<GetProjectListQuery> = await apolloClient.query({
                query: GetProjectListDocument,
                variables: {
                    input: {
                        search: ''
                    }
                },
                fetchPolicy: 'no-cache'
            });
            const { data: { getProjectList: { projects } } } = projectListQuery;
            if (projects)
                set({ projectList: projects as Project[] });
        } catch (error) {
            toast.error('Failed to get media group for subjects');
        }
        const itemsCopy = lodash.cloneDeep(items);
        if (itemsCopy && itemsCopy.length)
            itemsCopy.forEach(item => item.selected = false);
        const newItemCopy = lodash.cloneDeep(newItem);
        newItemCopy.selected = true;
        set({ hasNewItem: true, items: itemsCopy, newItem: newItemCopy });
    },

    updateNewItemEntireSubject: (entireSubject: boolean) => {
        const { newItem } = get();
        const newItemCopy = lodash.cloneDeep(newItem);
        set({ newItem: { ...newItemCopy, entireSubject } });
    },
    updateNewItemSubtitle: (event: React.ChangeEvent<HTMLInputElement>) => {
        const { newItem } = get();

        const { target: { value: subtitle } } = event;
        set({ newItem: { ...newItem, subtitle } });
    },
    updateNewItemProject: (idProject: number) => {
        const { newItem, projectList } = get();
        const newItemCopy = lodash.cloneDeep(newItem);
        const newProjectName = projectList.find(project => project.idProject === idProject)?.Name ?? '';
        newItemCopy.idProject = idProject;
        newItemCopy.projectName = newProjectName;
        set({ newItem: newItemCopy });
    },
    updateSelectedItem: (id: string): void => {
        const { items, newItem } = get();
        if (id === newItem.id) {
            newItem.selected = !newItem.selected;
            if (items && items.length)
                items.forEach(item => item.selected = false);

            set({ items, newItem });
            return;
        }
        newItem.selected = false;
        const updatedItems = items.map((item) => {
            return {
                ...item,
                selected: id === item.id ? !item.selected : false
            };
        });
        set({ newItem, items: updatedItems });
    },
    loadingItems: (): void => {
        set({ loading: true });
    },
    fetchIngestionItems: async (idSubjects: number[]): Promise<void> => {
        try {
            const ingestionItemQuery: ApolloQueryResult<GetIngestionItemsQuery> = await apolloClient.query({
                query: GetIngestionItemsDocument,
                variables: {
                    input: {
                        idSubjects
                    }
                },
                fetchPolicy: 'no-cache'
            });
            const { data: { getIngestionItems: { IngestionItem } } } = ingestionItemQuery;
            const ingestionItemState = IngestionItem?.map(item => parseIngestionItemToState(item));
            set({ items: ingestionItemState });
        } catch (error) {
            toast.error('Failed to get media group for subjects');
        }
    },
    reset: (): void => {
        set({ items: [], loading: false, hasNewItem: false, newItem: { ...defaultItem } });
    }
}));
