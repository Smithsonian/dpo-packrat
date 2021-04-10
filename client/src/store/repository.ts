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
import { parseRepositoryTreeNodeId, validateArray } from '../utils/repository';

type RepositoryStore = {
    isExpanded: boolean;
    search: string;
    keyword: string;
    tree: Map<string, NavigationResultEntry[]>;
    loading: boolean;
    updateSearch: (value: string) => void;
    toggleFilter: () => void;
    repositoryRootType: eSystemObjectType[];
    objectsToDisplay: number[];
    metadataToDisplay: eMetadata[];
    units: number[];
    projects: number[];
    has: eSystemObjectType[];
    missing: eSystemObjectType[];
    captureMethod: number[];
    variantType: number[];
    modelPurpose: number[];
    modelFileType: number[];
    fromDate: Date | null;
    toDate: Date | null;
    getFilterState: () => RepositoryFilter;
    removeUnitsOrProjects: (id: number, type: eSystemObjectType) => void;
    updateFilterValue: (name: string, value: number | number[] | Date) => void;
    resetRepositoryFilter: (modifyCookie?: boolean) => void;
    resetKeywordSearch: () => void;
    initializeTree: () => Promise<void>;
    getChildren: (nodeId: string) => Promise<void>;
    updateRepositoryFilter: (filter: RepositoryFilter) => void;
    setCookieToState: () => void;
    setDefaultIngestionFilters: (systemObjectType: eSystemObjectType, idRoot: number | undefined) => void;
    getChildrenForIngestion: (idRoot: number) => void;
};

export const treeRootKey: string = 'root';

export const useRepositoryStore = create<RepositoryStore>((set: SetState<RepositoryStore>, get: GetState<RepositoryStore>) => ({
    isExpanded: true,
    // keyword is the text within input. search is the actual term used for searching
    search: '',
    keyword: '',
    tree: new Map<string, NavigationResultEntry[]>([[treeRootKey, []]]),
    loading: true,
    repositoryRootType: [eSystemObjectType.eUnit],
    objectsToDisplay: [],
    metadataToDisplay: [eMetadata.eHierarchyUnit, eMetadata.eHierarchySubject, eMetadata.eHierarchyItem],
    units: [],
    projects: [],
    has: [],
    missing: [],
    captureMethod: [],
    variantType: [],
    modelPurpose: [],
    modelFileType: [],
    fromDate: null,
    toDate: null,
    updateFilterValue: (name: string, value: number | number[] | Date): void => {
        const { initializeTree, setCookieToState, keyword } = get();
        set({ [name]: value, loading: true, search: keyword });
        setCookieToState();
        initializeTree();
    },
    updateSearch: (value: string): void => {
        //changed search to keyword
        set({ keyword: value });
    },
    toggleFilter: (): void => {
        const { isExpanded } = get();
        set({ isExpanded: !isExpanded });
    },
    initializeTree: async (): Promise<void> => {
        const { getFilterState } = get();
        const filter = getFilterState();
        const { data, error } = await getObjectChildrenForRoot(filter);
        if (data && !error) {
            const { getObjectChildren } = data;
            const { entries } = getObjectChildren;
            const entry: [string, NavigationResultEntry[]] = [treeRootKey, entries];
            const updatedTree = new Map([entry]);
            set({ tree: updatedTree, loading: false });
        }
    },
    getChildren: async (nodeId: string): Promise<void> => {
        const { tree, getFilterState } = get();
        const filter = getFilterState();
        const { idSystemObject } = parseRepositoryTreeNodeId(nodeId);
        const { data, error } = await getObjectChildren(idSystemObject, filter);
        if (data && !error) {
            const { getObjectChildren } = data;
            const { entries } = getObjectChildren;
            const updatedTree: Map<string, NavigationResultEntry[]> = new Map(tree);
            updatedTree.set(nodeId, entries);
            set({ tree: updatedTree });
        }
    },
    removeUnitsOrProjects: (id: number, type: eSystemObjectType): void => {
        const { units, projects, setCookieToState, initializeTree, keyword } = get();
        let updatedUnits: number[] = units.slice();
        let updatedProjects: number[] = projects.slice();

        switch (type) {
            case eSystemObjectType.eUnit: {
                if (updatedUnits.length === 1) updatedUnits = [];
                else updatedUnits = updatedUnits.filter(unit => unit !== id);
                break;
            }
            case eSystemObjectType.eProject: {
                if (updatedProjects.length === 1) updatedProjects = [];
                else updatedProjects = updatedProjects.filter(project => project !== id);
                break;
            }
        }

        set({ units: updatedUnits, projects: updatedProjects, search: keyword });
        setCookieToState();
        initializeTree();
    },
    updateRepositoryFilter: (filter: RepositoryFilter): void => {
        const {
            repositoryRootType,
            objectsToDisplay,
            metadataToDisplay,
            units,
            projects,
            has,
            missing,
            captureMethod,
            variantType,
            modelPurpose,
            modelFileType,
            initializeTree,
            setCookieToState
        } = get();

        const stateValues: RepositoryFilter = {
            ...filter,
            repositoryRootType: validateArray<eSystemObjectType>(filter.repositoryRootType, repositoryRootType),
            objectsToDisplay: validateArray<eSystemObjectType>(filter.objectsToDisplay, objectsToDisplay),
            metadataToDisplay: validateArray<eMetadata>(filter.metadataToDisplay, metadataToDisplay),
            units: validateArray<number>(filter.units, units),
            projects: validateArray<number>(filter.projects, projects),
            has: validateArray<eSystemObjectType>(filter.has, has),
            missing: validateArray<eSystemObjectType>(filter.missing, missing),
            captureMethod: validateArray<number>(filter.captureMethod, captureMethod),
            variantType: validateArray<number>(filter.variantType, variantType),
            modelPurpose: validateArray<number>(filter.modelPurpose, modelPurpose),
            modelFileType: validateArray<number>(filter.modelFileType, modelFileType),
        };

        set(stateValues);
        setCookieToState();
        initializeTree();
    },
    resetRepositoryFilter: (modifyCookie = true): void => {
        const { setCookieToState } = get();
        const stateValues = {
            repositoryRootType: [eSystemObjectType.eUnit],
            objectsToDisplay: [],
            metadataToDisplay: [eMetadata.eHierarchyUnit, eMetadata.eHierarchySubject, eMetadata.eHierarchyItem],
            units: [],
            projects: [],
            has: [],
            missing: [],
            captureMethod: [],
            variantType: [],
            modelPurpose: [],
            modelFileType: [],
        };
        set(stateValues);
        if (modifyCookie) {
            setCookieToState();
        }
    },
    resetKeywordSearch: (): void => {
        set({ keyword: '', search: '' });
    },
    getFilterState: (): RepositoryFilter => {
        const {
            search,
            keyword,
            repositoryRootType,
            objectsToDisplay,
            metadataToDisplay,
            units,
            projects,
            has,
            missing,
            captureMethod,
            variantType,
            modelPurpose,
            modelFileType
        } = get();

        return {
            search,
            keyword,
            repositoryRootType,
            objectsToDisplay,
            metadataToDisplay,
            units,
            projects,
            has,
            missing,
            captureMethod,
            variantType,
            modelPurpose,
            modelFileType
        };
    },
    setCookieToState: (): void => {
        const { getFilterState } = get();
        const {
            repositoryRootType,
            objectsToDisplay,
            metadataToDisplay,
            units,
            projects,
            has,
            missing,
            captureMethod,
            variantType,
            modelPurpose,
            modelFileType
        } = getFilterState();
        const currentFilterState = {
            repositoryRootType,
            objectsToDisplay,
            metadataToDisplay,
            units,
            projects,
            has,
            missing,
            captureMethod,
            variantType,
            modelPurpose,
            modelFileType
        };
        // 20 years
        document.cookie = `filterSelections=${JSON.stringify(currentFilterState)};max-age=630700000`;
    },
    setDefaultIngestionFilters: (systemObjectType: eSystemObjectType, idRoot: number | undefined): void => {
        const { resetKeywordSearch, resetRepositoryFilter, getChildrenForIngestion } = get();
        set({ isExpanded: false });
        resetKeywordSearch();
        resetRepositoryFilter(false);

        if (systemObjectType === eSystemObjectType.eModel) {
            set({ repositoryRootType: [], objectsToDisplay: [eSystemObjectType.eCaptureData, eSystemObjectType.eModel] });
            getChildrenForIngestion(idRoot || 0);
        }
    },
    getChildrenForIngestion: async (idSystemObject: number): Promise<void> => {
        const { getFilterState } = get();
        const filter = getFilterState();
        const { data, error } = await getObjectChildrenForRoot(filter, idSystemObject);
        if (data && !error) {
            const { getObjectChildren } = data;
            const { entries } = getObjectChildren;
            const entry: [string, NavigationResultEntry[]] = [treeRootKey, entries];
            const updatedTree = new Map([entry]);
            set({ tree: updatedTree, loading: false });
        }
    }
}));