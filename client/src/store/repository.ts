/**
 * Repository Store
 *
 * This store manages state for Repository filter and tree view.
 */
import create, { GetState, SetState } from 'zustand';
import { RepositoryFilter } from '../pages/Repository';
import { getObjectChildren, getObjectChildrenForRoot } from '../pages/Repository/hooks/useRepository';
import { NavigationResultEntry } from '../types/graphql';
import { eMetadata, eSystemObjectType } from '../types/server';
import { parseRepositoryTreeNodeId, sortEntriesAlphabetically, validateArray } from '../utils/repository';

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
    removeUnitsOrProjects: (id: number, type: eSystemObjectType) => void;
    updateFilterValue: (name: string, value: number | number[]) => void;
    initializeTree: () => Promise<void>;
    getChildren: (nodeId: string) => Promise<void>;
    updateRepositoryFilter: (filter: RepositoryFilter) => void;
};

export const treeRootKey: string = 'root';

export const useRepositoryStore = create<RepositoryStore>((set: SetState<RepositoryStore>, get: GetState<RepositoryStore>) => ({
    isExpanded: true,
    search: '',
    tree: new Map<string, NavigationResultEntry[]>([[treeRootKey, []]]),
    loading: true,
    repositoryRootType: [eSystemObjectType.eUnit],
    objectsToDisplay: [eSystemObjectType.eUnit],
    metadataToDisplay: [eMetadata.eUnitAbbreviation, eMetadata.eSubjectIdentifier, eMetadata.eItemName],
    units: [],
    projects: [],
    has: 4,
    missing: 8,
    captureMethod: 1,
    variantType: 29,
    modelPurpose: 46,
    modelFileType: 50,
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
    },
    removeUnitsOrProjects: (id: number, type: eSystemObjectType): void => {
        const { units, projects } = get();
        let updatedUnits: number[] = units.slice();
        let updatedProjects: number[] = projects.slice();

        switch (type) {
            case eSystemObjectType.eUnit: {
                if (updatedUnits.length === 1) updatedUnits = [];
                else updatedUnits = updatedUnits.filter(unit => unit === id);
                break;
            }
            case eSystemObjectType.eProject: {
                if (updatedProjects.length === 1) updatedProjects = [];
                else updatedProjects = updatedProjects.filter(project => project === id);
                break;
            }
        }

        set({ units: updatedUnits, projects: updatedProjects });
    },
    updateRepositoryFilter: (filter: RepositoryFilter): void => {
        const { repositoryRootType, objectsToDisplay, metadataToDisplay, units, projects } = get();

        const stateValues: RepositoryFilter = {
            ...filter,
            repositoryRootType: validateArray<eSystemObjectType>(filter.repositoryRootType, repositoryRootType),
            objectsToDisplay: validateArray<eSystemObjectType>(filter.objectsToDisplay, objectsToDisplay),
            metadataToDisplay: validateArray<eMetadata>(filter.metadataToDisplay, metadataToDisplay),
            units: validateArray<number>(filter.units, units),
            projects: validateArray<number>(filter.projects, projects),
        };

        set(stateValues);
    }
}));
