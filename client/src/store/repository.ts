import create, { GetState, SetState } from 'zustand';
import { getObjectChildren, getObjectChildrenForRoot } from '../pages/Repository/hooks/useRepository';
import { NavigationResultEntry } from '../types/graphql';
import { eMetadata, eSystemObjectType } from '../types/server';
import { parseRepositoryTreeNodeId } from '../utils/repository';

type RepositoryStore = {
    isExpanded: boolean;
    search: string;
    tree: Map<string, NavigationResultEntry[]>;
    loading: boolean;
    updateSearch: (value: string) => void;
    toggleFilter: () => void;
    repositoryRootType: eSystemObjectType[];
    metadataToDisplay: eMetadata[];
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
    metadataToDisplay: [eMetadata.eUnitAbbreviation, eMetadata.eSubjectIdentifier, eMetadata.eItemName],
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
            const entry: [string, NavigationResultEntry[]] = [treeRootKey, entries];
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
            const updatedTree: Map<string, NavigationResultEntry[]> = new Map(tree);
            updatedTree.set(nodeId, entries);
            set({ tree: updatedTree });
        }
    }
}));
