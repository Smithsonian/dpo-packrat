/**
 * Repository Store
 *
 * This store manages state for Repository filter and tree view.
 */
import create, { GetState, SetState } from 'zustand';
import { getObjectChildren, getObjectChildrenForRoot } from '../pages/Repository/hooks/useRepository';
import { NavigationResultEntry } from '../types/graphql';
import { eMetadata, eSystemObjectType } from '../types/server';
import { parseRepositoryTreeNodeId, sortEntriesAlphabetically } from '../utils/repository';

export type RepositoryPath = {
    idSystemObject: number;
    name: string;
    objectType: eSystemObjectType;
};

type RepositoryStore = {
    isExpanded: boolean;
    search: string;
    tree: Map<string, NavigationResultEntry[]>;
    loading: boolean;
    updateSearch: (value: string) => void;
    toggleFilter: () => void;
    repositoryRootType: eSystemObjectType[];
    objectsToDisplay: number[];
    metadataToDisplay: eMetadata[];
    units: number[];
    projects: number[];
    has: number;
    missing: number;
    captureMethod: number;
    variantType: number;
    modelPurpose: number;
    modelFileType: number;
    updateFilterValue: (name: string, value: number | number[]) => void;
    initializeTree: () => Promise<void>;
    getChildren: (nodeId: string) => Promise<void>;
};

export const treeRootKey: string = 'root';

export const useRepositoryStore = create<RepositoryStore>((set: SetState<RepositoryStore>, get: GetState<RepositoryStore>) => ({
    isExpanded: true,
    search: '',
    tree: new Map<string, NavigationResultEntry[]>([[treeRootKey, []]]),
    loading: true,
    repositoryRootType: [eSystemObjectType.eUnit],
    objectsToDisplay: [0],
    metadataToDisplay: [eMetadata.eUnitAbbreviation, eMetadata.eSubjectIdentifier, eMetadata.eItemName],
    units: [0],
    projects: [0],
    has: 0,
    missing: 0,
    captureMethod: 0,
    variantType: 0,
    modelPurpose: 0,
    modelFileType: 0,
    updateFilterValue: (name: string, value: number | number[]): void => {
        const { initializeTree } = get();
        set({ [name]: value, loading: true });
        initializeTree();
    },
    updateSearch: (value: string): void => {
        set({ search: value });
    },
    toggleFilter: (): void => {
        const { isExpanded } = get();
        set({ isExpanded: !isExpanded });
    },
    initializeTree: async (): Promise<void> => {
        const { repositoryRootType, metadataToDisplay } = get();
        const { data, error } = await getObjectChildrenForRoot(repositoryRootType, metadataToDisplay);

        if (data && !error) {
            const { getObjectChildren } = data;
            const { entries } = getObjectChildren;
            const sortedEntries = sortEntriesAlphabetically(entries);
            const entry: [string, NavigationResultEntry[]] = [treeRootKey, sortedEntries];
            const updatedTree = new Map([entry]);
            set({ tree: updatedTree, loading: false });
        }
    },
    getChildren: async (nodeId: string): Promise<void> => {
        const { tree, metadataToDisplay } = get();
        const { idSystemObject } = parseRepositoryTreeNodeId(nodeId);
        const { data, error } = await getObjectChildren(idSystemObject, metadataToDisplay);

        if (data && !error) {
            const { getObjectChildren } = data;
            const { entries } = getObjectChildren;
            const sortedEntries = sortEntriesAlphabetically(entries);
            const updatedTree: Map<string, NavigationResultEntry[]> = new Map(tree);
            updatedTree.set(nodeId, sortedEntries);
            set({ tree: updatedTree });
        }
    }
}));
