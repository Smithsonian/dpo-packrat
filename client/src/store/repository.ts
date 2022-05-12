/**
 * Repository Store
 *
 * This store manages state for Repository filter and tree view.
 */
import create, { GetState, SetState } from 'zustand';
import { RepositoryFilter } from '../pages/Repository';
import { getObjectChildren, getObjectChildrenForRoot } from '../pages/Repository/hooks/useRepository';
import { NavigationResultEntry } from '../types/graphql';
import { eMetadata, eSystemObjectType } from '@dpo-packrat/common';
import { parseRepositoryTreeNodeId, validateArray, getTermForSystemObjectType } from '../utils/repository';
import { apolloClient } from '../graphql';
import { GetSystemObjectDetailsDocument } from '../types/graphql';
import { eRepositoryChipFilterType } from '../pages/Repository/components/RepositoryFilterView/RepositoryFilterOptions';
import { updateCookie } from './treeColumns';

const FILTER_POSITION_COOKIE = 'isFilterExpanded';

export interface NavigationResultEntryState extends NavigationResultEntry {
    index?: number;
}

const loadingEntry: NavigationResultEntryState = {
    idSystemObject: -1,
    idObject: 0,
    name: 'Loading...',
    objectType: 1,
    metadata: []
};

type RepositoryStore = {
    isExpanded: boolean;
    search: string;
    keyword: string;
    tree: Map<string, NavigationResultEntryState[]>;
    cursors: Map<string, string>;
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
    dateCreatedFrom: Date | string | null;
    dateCreatedTo: Date | string | null;
    idRoot: number | null;
    repositoryBrowserRootObjectType: string | null;
    repositoryBrowserRootName: string | null;
    getFilterState: () => RepositoryFilter;
    removeChipOption: (id: number, type: eRepositoryChipFilterType, isModal: boolean) => void;
    updateFilterValue: (name: string, value: number | number[] | Date | null, isModal: boolean) => void;
    resetRepositoryFilter: (modifyCookie?: boolean) => void;
    resetKeywordSearch: () => void;
    initializeTree: () => Promise<void>;
    getMoreRoot: () => Promise<void>;
    getChildren: (nodeId: string) => Promise<void>;
    getMoreChildren: (nodeId: string, cursorMark: string) => Promise<void>;
    updateRepositoryFilter: (filter: RepositoryFilter, isModal: boolean) => void;
    setCookieToState: () => void;
    setDefaultIngestionFilters: (systemObjectType: eSystemObjectType, idRoot: number | undefined) => Promise<void>;
    getChildrenForIngestion: (idRoot: number) => void;
    closeRepositoryBrowser: () => void;
    resetRepositoryBrowserRoot: () => void;
    setLoading: (isLoading: boolean) => void;
    initializeFilterPosition: () => void;
    getRowCount: () => number;
};

export const treeRootKey: string = 'root';

export const useRepositoryStore = create<RepositoryStore>((set: SetState<RepositoryStore>, get: GetState<RepositoryStore>) => ({
    isExpanded: true,
    // keyword is the text within input. search is the actual term used for searching
    search: '',
    keyword: '',
    tree: new Map<string, NavigationResultEntryState[]>([[treeRootKey, []]]),
    cursors: new Map<string, string>(),
    loading: true,
    repositoryRootType: [],
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
    dateCreatedFrom: null,
    dateCreatedTo: null,
    idRoot: null,
    repositoryBrowserRootObjectType: null,
    repositoryBrowserRootName: null,
    updateFilterValue: (name: string, value: number | number[] | Date | null, isModal: boolean): void => {
        const { initializeTree, setCookieToState, keyword } = get();
        set({ [name]: value, loading: true, search: keyword });
        if (!isModal) setCookieToState();

        initializeTree();
    },
    updateSearch: (value: string): void => {
        //changed search to keyword
        set({ keyword: value });
    },
    toggleFilter: (): void => {
        const { isExpanded } = get();
        updateCookie(FILTER_POSITION_COOKIE, String(!isExpanded));
        set({ isExpanded: !isExpanded });
    },
    initializeTree: async (): Promise<void> => {
        const { getFilterState, getChildrenForIngestion, idRoot, getRowCount } = get();
        const filter = getFilterState();
        if (idRoot) {
            getChildrenForIngestion(idRoot);
        } else {
            const { data, error } = await getObjectChildrenForRoot(filter);
            if (data && !error) {
                const { getObjectChildren } = data;
                const { entries, cursorMark } = getObjectChildren;
                if (cursorMark) {
                    const newCursors = new Map<string, string>();
                    newCursors.set(treeRootKey, cursorMark);
                    set({ cursors: newCursors });
                }

                const rowCount = getRowCount();
                const uniqueEntries = entries.map((entry, index) => {
                    const entryCopy: NavigationResultEntryState = { ...entry };
                    entryCopy.index = index + rowCount;
                    return entryCopy;
                });

                const entry: [string, NavigationResultEntryState[]] = [treeRootKey, uniqueEntries];
                const updatedTree = new Map([entry]);
                set({ tree: updatedTree, loading: false });
            }
        }
    },
    getMoreRoot: async (): Promise<void> => {
        const { tree, cursors, getFilterState, getRowCount } = get();
        const filter = getFilterState();
        const rootCursor = cursors.get(treeRootKey);

        const treeCopy = new Map(tree);
        const rootWithoutLoader = treeCopy.get(treeRootKey) ?? [];
        const rootWithLoader = [...rootWithoutLoader, loadingEntry] as NavigationResultEntryState[];
        treeCopy.set(treeRootKey, rootWithLoader);
        set({ tree: treeCopy });

        if (rootCursor) {
            filter.cursorMark = rootCursor;
        }
        const { data, error } = await getObjectChildrenForRoot(filter);
        if (data && !error) {
            const { getObjectChildren } = data;
            const { entries, cursorMark } = getObjectChildren;
            if (cursorMark) {
                const newCursors = new Map(cursors);
                if (cursorMark !== rootCursor) {
                    newCursors.set(treeRootKey, cursorMark);
                } else {
                    newCursors.set(treeRootKey, '');
                }
                set({ cursors: newCursors });
            }

            const rowCount = getRowCount();
            const uniqueEntries = entries.map((entry, index) => {
                const entryCopy: NavigationResultEntryState = { ...entry };
                entryCopy.index = index + rowCount;
                return entryCopy;
            });

            const updatedNode = rootWithoutLoader.concat(uniqueEntries) as NavigationResultEntryState[];
            treeCopy.set(treeRootKey, updatedNode);
            set({ tree: treeCopy, loading: false });
        }
    },
    getChildren: async (nodeId: string): Promise<void> => {
        const { tree, getFilterState, cursors, getRowCount } = get();
        const filter = getFilterState();
        const { idSystemObject } = parseRepositoryTreeNodeId(nodeId);
        const { data, error } = await getObjectChildren(idSystemObject, filter);
        if (data && !error) {
            const { getObjectChildren } = data;
            const { entries, cursorMark } = getObjectChildren;
            const updatedTree: Map<string, NavigationResultEntryState[]> = new Map(tree);

            const rowCount = getRowCount();
            const uniqueEntries = entries.map((entry, index) => {
                const entryCopy: NavigationResultEntryState = { ...entry };
                entryCopy.index = index + rowCount;
                return entryCopy;
            });

            updatedTree.set(nodeId, uniqueEntries);
            set({ tree: updatedTree });

            if (cursorMark) {
                const newCursors = new Map(cursors);
                newCursors.set(nodeId, cursorMark);
                set({ cursors: newCursors });
            }
        }
    },
    getMoreChildren: async (nodeId: string, cursorMark: string): Promise<void> => {
        const { tree, cursors, getFilterState, getRowCount } = get();
        const filter = getFilterState();
        const { idSystemObject } = parseRepositoryTreeNodeId(nodeId);

        const treeCopy = new Map(tree);
        const nodeWithoutLoader = treeCopy.get(nodeId) ?? [];
        const nodeWithLoader = [...nodeWithoutLoader, loadingEntry] as NavigationResultEntryState[];
        treeCopy.set(nodeId, nodeWithLoader);
        set({ tree: treeCopy });

        if (cursorMark) filter.cursorMark = cursorMark;
        const { data, error } = await getObjectChildren(idSystemObject, filter);
        if (data && !error) {
            const { getObjectChildren } = data;
            const { entries, cursorMark } = getObjectChildren;

            const rowCount = getRowCount();
            const uniqueEntries = entries.map((entry, index) => {
                const entryCopy: NavigationResultEntryState = { ...entry };
                entryCopy.index = index + rowCount;
                return entryCopy;
            });

            const updatedNode = nodeWithoutLoader.concat(uniqueEntries) as NavigationResultEntryState[];
            treeCopy.set(nodeId, updatedNode);

            set({ tree: treeCopy });
            if (cursorMark) {
                const newCursors = cursors;
                if (cursorMark !== cursors.get(nodeId)) {
                    newCursors.set(nodeId, cursorMark);
                } else {
                    newCursors.delete(nodeId);
                }
                set({ cursors: newCursors });
            }
        }
    },
    removeChipOption: (id: number, type: eRepositoryChipFilterType, isModal: boolean): void => {
        const { units, projects, has, missing, captureMethod, variantType, modelPurpose, modelFileType, setCookieToState, initializeTree, keyword } = get();

        switch (type) {
            case eRepositoryChipFilterType.eUnit: {
                let updatedUnits: number[] = units.slice();
                if (updatedUnits.length === 1) updatedUnits = [];
                else updatedUnits = updatedUnits.filter(unit => unit !== id);
                set({ units: updatedUnits });
                break;
            }
            case eRepositoryChipFilterType.eProject: {
                let updatedProjects = projects.slice();
                if (updatedProjects.length === 1) updatedProjects = [];
                else updatedProjects = updatedProjects.filter(project => project !== id);
                set({ projects: updatedProjects });
                break;
            }
            case eRepositoryChipFilterType.eHas: {
                let updatedHas: eSystemObjectType[] = has.slice();
                if (updatedHas.length === 1) updatedHas = [];
                else updatedHas = updatedHas.filter(has => has !== id);
                set({ has: updatedHas });
                break;
            }
            case eRepositoryChipFilterType.eMissing: {
                let updatedMissing: eSystemObjectType[] = missing.slice();
                if (updatedMissing.length === 1) updatedMissing = [];
                else updatedMissing = updatedMissing.filter(missing => missing !== id);
                set({ missing: updatedMissing });
                break;
            }
            case eRepositoryChipFilterType.eCaptureMethod: {
                let updatedCaptureMethod: eSystemObjectType[] = captureMethod.slice();
                if (updatedCaptureMethod.length === 1) updatedCaptureMethod = [];
                else updatedCaptureMethod = updatedCaptureMethod.filter(captureMethod => captureMethod !== id);
                set({ captureMethod: updatedCaptureMethod });
                break;
            }
            case eRepositoryChipFilterType.eVariantType: {
                let updatedVariantType: eSystemObjectType[] = variantType.slice();
                if (updatedVariantType.length === 1) updatedVariantType = [];
                else updatedVariantType = updatedVariantType.filter(variantType => variantType !== id);
                set({ variantType: updatedVariantType });
                break;
            }
            case eRepositoryChipFilterType.eModelPurpose: {
                let updatedModelPurpose: eSystemObjectType[] = modelPurpose.slice();
                if (updatedModelPurpose.length === 1) updatedModelPurpose = [];
                else updatedModelPurpose = updatedModelPurpose.filter(modelPurpose => modelPurpose !== id);
                set({ modelPurpose: updatedModelPurpose });
                break;
            }
            case eRepositoryChipFilterType.eModelFileType: {
                let updatedModelFileType: eSystemObjectType[] = modelFileType.slice();
                if (updatedModelFileType.length === 1) updatedModelFileType = [];
                else updatedModelFileType = updatedModelFileType.filter(modelFileType => modelFileType !== id);
                set({ modelFileType: updatedModelFileType });
                break;
            }
            case eRepositoryChipFilterType.eDateCreatedFrom: {
                set({ dateCreatedFrom: null });
                break;
            }
            case eRepositoryChipFilterType.eDateCreatedTo: {
                set({ dateCreatedTo: null });
                break;
            }
        }
        set({ search: keyword, loading: true });
        if (!isModal) setCookieToState();

        initializeTree();
    },
    updateRepositoryFilter: async (filter: RepositoryFilter, isModal: boolean): Promise<void> => {
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
            // dateCreatedFrom,
            // dateCreatedTo,
            initializeTree,
            setCookieToState
        } = get();
        if (filter) {
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
                idRoot: filter.idRoot
                // dateCreatedFrom: filter.dateCreatedFrom,
                // dateCreatedTo: filter.dateCreatedTo,
            };
            set(stateValues);

            if (filter.idRoot) {
                const { data: { getSystemObjectDetails: { name, objectType } } } = await apolloClient.query({
                    query: GetSystemObjectDetailsDocument,
                    variables: {
                        input: {
                            idSystemObject: filter.idRoot
                        }
                    }
                });
                set({ idRoot: filter.idRoot, repositoryBrowserRootName: name, repositoryBrowserRootObjectType: getTermForSystemObjectType(objectType) });
            }
        }
        if (!isModal) setCookieToState();

        initializeTree();
    },
    resetRepositoryFilter: (modifyCookie = true): void => {
        const { setCookieToState } = get();
        const stateValues = {
            repositoryRootType: [],
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
            dateCreatedFrom: null,
            dateCreatedTo: null,
            idRoot: null,
            repositoryBrowserRootObjectType: null,
            repositoryBrowserRootName: null
        };
        set({ ...stateValues, loading: true });
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
            modelFileType,
            idRoot,
            dateCreatedFrom,
            dateCreatedTo
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
            modelFileType,
            idRoot,
            dateCreatedFrom,
            dateCreatedTo
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
            modelFileType,
            dateCreatedFrom,
            dateCreatedTo,
            idRoot
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
            modelFileType,
            dateCreatedFrom,
            dateCreatedTo,
            idRoot
        };
        // 20 years
        document.cookie = `filterSelections=${JSON.stringify(currentFilterState)};path=/;max-age=630700000`;
    },
    setDefaultIngestionFilters: async (systemObjectType: eSystemObjectType, idRoot: number | undefined): Promise<void> => {
        const { resetKeywordSearch, resetRepositoryFilter, getChildrenForIngestion } = get();
        if (idRoot !== undefined && systemObjectType) {
            const { data: { getSystemObjectDetails: { name, objectType } } } = await apolloClient.query({
                query: GetSystemObjectDetailsDocument,
                variables: {
                    input: {
                        idSystemObject: idRoot
                    }
                }
            });
            resetRepositoryFilter(false);
            set({ isExpanded: false, idRoot, repositoryBrowserRootName: name, repositoryBrowserRootObjectType: getTermForSystemObjectType(objectType) });
        }
        resetKeywordSearch();

        if (systemObjectType === eSystemObjectType.eModel) {
            set({ repositoryRootType: [eSystemObjectType.eModel, eSystemObjectType.eScene], objectsToDisplay: [eSystemObjectType.eCaptureData, eSystemObjectType.eModel] });
        }

        if (systemObjectType === eSystemObjectType.eCaptureData) {
            set({ repositoryRootType: [eSystemObjectType.eCaptureData, eSystemObjectType.eModel], objectsToDisplay: [eSystemObjectType.eCaptureData, eSystemObjectType.eModel] });
        }

        if (systemObjectType === eSystemObjectType.eScene) {
            set({ repositoryRootType: [eSystemObjectType.eModel, eSystemObjectType.eScene], objectsToDisplay: [eSystemObjectType.eCaptureData, eSystemObjectType.eModel] });
        }

        getChildrenForIngestion(idRoot || 0);
    },
    getChildrenForIngestion: async (idSystemObject: number): Promise<void> => {
        const { getFilterState } = get();
        const filter = getFilterState();
        const { data, error } = await getObjectChildrenForRoot(filter, idSystemObject);

        // set root to 0 for testing
        // const { data, error } = await getObjectChildrenForRoot(filter, 0);

        if (data && !error) {
            const { getObjectChildren } = data;
            const { entries } = getObjectChildren;
            const entry: [string, NavigationResultEntry[]] = [treeRootKey, entries];
            const updatedTree = new Map([entry]);
            set({ tree: updatedTree, loading: false });
        }
    },
    closeRepositoryBrowser: (): void => {
        set({ isExpanded: true, idRoot: null });
    },
    resetRepositoryBrowserRoot: (): void => {
        set({  idRoot: null, repositoryBrowserRootObjectType: null, repositoryBrowserRootName: null });
    },
    setLoading: (isLoading: boolean): void => {
        set({ loading: isLoading });
    },
    initializeFilterPosition: () => {
        let filterCookie;
        if ((!document.cookie.length || document.cookie.indexOf(FILTER_POSITION_COOKIE) === -1)) {
            document.cookie = `${FILTER_POSITION_COOKIE}=${true};path=/;max-age=630700000`;
        }

        const cookies = document.cookie.split(';');
        filterCookie = cookies.find(entry => entry.trim().startsWith(FILTER_POSITION_COOKIE));
        if (filterCookie) {
            filterCookie = filterCookie.split('=')[1];
            set({ isExpanded: filterCookie === 'true' ? true : false });
        }
    },
    getRowCount: (): number => {
        const { tree } = get();
        let result = 0;
        tree.forEach(node => result += node.length);
        return result;
    }
}));