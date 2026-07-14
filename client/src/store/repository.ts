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
import { toast } from 'react-toastify';

const FILTER_POSITION_COOKIE = 'isFilterExpanded';

export interface NavigationResultEntryState extends NavigationResultEntry {
    hierarchy?: string;
}

type RepositoryStore = {
    isExpanded: boolean;
    search: string;
    keyword: string;
    tree: Map<string, NavigationResultEntryState[]>;
    cursors: Map<string, string>;
    rootPage: number;                         // 1-based page index of the top-level (root) objects
    rootPageSize: number;                     // number of root objects per page (user-selectable)
    rootTotal: number;                        // total count of root objects (Solr numFound) for pager math
    loading: boolean;
    expandedCount: number;
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
    idRoots: number[] | null;
    repositoryBrowserRootObjectType: string | null;
    repositoryBrowserRootName: string | null;
    getFilterState: () => RepositoryFilter;
    removeChipOption: (id: number, type: eRepositoryChipFilterType, isModal: boolean) => void;
    updateFilterValue: (name: string, value: number | number[] | Date | null, isModal: boolean) => void;
    resetRepositoryFilter: (modifyCookie?: boolean, keepMetadata?: boolean) => void;
    resetKeywordSearch: () => void;
    initializeTree: () => Promise<void>;
    setRootPage: (page: number) => Promise<void>;
    setRootPageSize: (size: number) => Promise<void>;
    getChildren: (nodeId: string) => Promise<void>;
    deleteChildren: (nodeId: string) => Promise<void>;
    updateRepositoryFilter: (filter: RepositoryFilter, isModal: boolean) => void;
    setCookieToState: () => void;
    setDefaultIngestionFilters: (systemObjectType: eSystemObjectType, idRoots: number[], displayOverride?: { repositoryRootType: eSystemObjectType[]; objectsToDisplay: eSystemObjectType[] }) => Promise<void>;
    getChildrenForIngestion: (idRoots: number[]) => void;
    closeRepositoryBrowser: () => void;
    resetRepositoryBrowserRoot: () => void;
    setLoading: (isLoading: boolean) => void;
    initializeFilterPosition: () => void;
    setExpandedCount: (expandedCountNew: number) => boolean; // returns true if we expanded and false if we contracted
};

export const treeRootKey: string = 'root';

export const useRepositoryStore = create<RepositoryStore>((set: SetState<RepositoryStore>, get: GetState<RepositoryStore>) => ({
    isExpanded: true,
    // keyword is the text within input. search is the actual term used for searching
    search: '',
    keyword: '',
    tree: new Map<string, NavigationResultEntryState[]>([[treeRootKey, []]]),
    cursors: new Map<string, string>(),
    rootPage: 1,
    rootPageSize: 25,
    rootTotal: 0,
    loading: true,
    expandedCount: 0,
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
    idRoots: null,
    repositoryBrowserRootObjectType: null,
    repositoryBrowserRootName: null,
    updateFilterValue: (name: string, value: number | number[] | Date | null, isModal: boolean): void => {
        const { initializeTree, setCookieToState, keyword } = get();
        // A filter change re-queries from the first page of roots.
        set({ [name]: value, loading: true, search: keyword, rootPage: 1 });
        if (!isModal) setCookieToState();

        initializeTree();
    },
    updateSearch: (value: string): void => {
        set({ keyword: value });
    },
    toggleFilter: (): void => {
        const { isExpanded } = get();
        updateCookie(FILTER_POSITION_COOKIE, String(!isExpanded));
        set({ isExpanded: !isExpanded });
    },
    initializeTree: async (): Promise<void> => {
        const { getFilterState, getChildrenForIngestion, idRoots, rootPage, rootPageSize } = get();
        const filter = getFilterState();
        if (idRoots && idRoots.length > 0) {
            getChildrenForIngestion(idRoots);
        } else {
            // Root level uses numbered offset pagination: load exactly one page of roots.
            const start = (rootPage - 1) * rootPageSize;
            const { data, error } = await getObjectChildrenForRoot(filter, [], start, rootPageSize);
            if (data && !error) {
                const { getObjectChildren } = data;
                if (getObjectChildren.success === false) {
                    toast.warn('Repository search service is unavailable. Please try again later or contact support.', { toastId: 'solr-down' });
                    set({ loading: false });
                    return;
                }
                const { entries, total } = getObjectChildren;

                const updatedTree: Map<string, NavigationResultEntryState[]> = new Map();
                updatedTree.set(treeRootKey, entries);
                // Changing the root page resets the tree: drop prior pages' children and cursors.
                set({ tree: updatedTree, cursors: new Map<string, string>(), rootTotal: total ?? 0, loading: false, expandedCount: 0 });
            }
        }
    },
    setRootPage: async (page: number): Promise<void> => {
        // Switching root pages tears down the current page (bounding mounted DOM) and loads the new one.
        set({ rootPage: page, loading: true, tree: new Map<string, NavigationResultEntryState[]>([[treeRootKey, []]]), cursors: new Map<string, string>() });
        get().setCookieToState();
        await get().initializeTree();
    },
    setRootPageSize: async (size: number): Promise<void> => {
        // Changing the page size restarts at page 1 with the new size and rebuilds the tree.
        set({ rootPageSize: size, rootPage: 1, loading: true, tree: new Map<string, NavigationResultEntryState[]>([[treeRootKey, []]]), cursors: new Map<string, string>() });
        get().setCookieToState();
        await get().initializeTree();
    },
    getChildren: async (nodeId: string): Promise<void> => {
        const { tree, getFilterState, cursors } = get();
        const filter = getFilterState();
        const { idSystemObject, hierarchy } = parseRepositoryTreeNodeId(nodeId);
        const { data, error } = await getObjectChildren([idSystemObject], filter);
        if (data && !error) {
            const { getObjectChildren } = data;
            const { entries, cursorMark } = getObjectChildren;
            const updatedTree: Map<string, NavigationResultEntryState[]> = new Map(tree);

            const uniqueEntries = entries.map((entry) => {
                const entryCopy: NavigationResultEntryState = { ...entry };
                entryCopy.hierarchy = (hierarchy ? hierarchy + '|' : '') + entryCopy.idSystemObject.toString();
                return entryCopy;
            });

            updatedTree.set(nodeId, uniqueEntries);
            // console.log('getChildren', updatedTree);
            set({ tree: updatedTree });

            if (cursorMark) {
                const newCursors = new Map(cursors);
                newCursors.set(nodeId, cursorMark);
                set({ cursors: newCursors });
            }
        }
    },
    deleteChildren: async (nodeId: string): Promise<void> => {
        const { tree } = get();

        if (tree.has(nodeId)) {
            const updatedTree: Map<string, NavigationResultEntryState[]> = new Map(tree);
            updatedTree.delete(nodeId);
            // console.log('deleteChildren', updatedTree);
            set({ tree: updatedTree });
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
        set({ search: keyword, loading: true, rootPage: 1 });
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
                idRoots: filter.idRoots
                // dateCreatedFrom: filter.dateCreatedFrom,
                // dateCreatedTo: filter.dateCreatedTo,
            };
            set(stateValues);
            // Restore the page/size from a persisted URL/cookie state; a fresh filter (no page) starts at page 1.
            set({ rootPage: filter.rootPage ?? 1, rootPageSize: filter.rootPageSize ?? get().rootPageSize });

            if (filter.idRoots && filter.idRoots.length > 0) {
                const { data: { getSystemObjectDetails: { name, objectType } } } = await apolloClient.query({
                    query: GetSystemObjectDetailsDocument,
                    variables: {
                        input: {
                            idSystemObject: filter.idRoots[0]
                        }
                    }
                });
                set({ idRoots: filter.idRoots, repositoryBrowserRootName: name, repositoryBrowserRootObjectType: getTermForSystemObjectType(objectType) });
            }
        }
        if (!isModal) setCookieToState();

        initializeTree();
    },
    resetRepositoryFilter: (modifyCookie = true, keepMetadata = false): void => {
        const { setCookieToState, metadataToDisplay } = get();
        const stateValues = {
            repositoryRootType: [],
            objectsToDisplay: [],
            metadataToDisplay: keepMetadata ? metadataToDisplay : [eMetadata.eHierarchyUnit, eMetadata.eHierarchySubject, eMetadata.eHierarchyItem],
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
            idRoots: null,
            repositoryBrowserRootObjectType: null,
            repositoryBrowserRootName: null
        };
        set({ ...stateValues, cursors: new Map<string, string>(), rootPage: 1, rootTotal: 0, loading: true });
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
            idRoots,
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
            idRoots,
            dateCreatedFrom,
            dateCreatedTo
        };
    },
    setCookieToState: (): void => {
        const { getFilterState, rootPage, rootPageSize } = get();
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
            idRoots
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
            idRoots,
            rootPage,
            rootPageSize
        };
        // 20 years
        document.cookie = `filterSelections=${JSON.stringify(currentFilterState)};path=/;max-age=630700000`;
    },
    setDefaultIngestionFilters: async (systemObjectType: eSystemObjectType, idRoots: number[], displayOverride?: { repositoryRootType: eSystemObjectType[]; objectsToDisplay: eSystemObjectType[] }): Promise<void> => {
        const { resetKeywordSearch, resetRepositoryFilter, getChildrenForIngestion } = get();
        if (idRoots.length > 0 && systemObjectType) {
            const { data: { getSystemObjectDetails: { name, objectType } } } = await apolloClient.query({
                query: GetSystemObjectDetailsDocument,
                variables: {
                    input: {
                        idSystemObject: idRoots[0]
                    }
                }
            });
            resetRepositoryFilter(false);
            const rootName = idRoots.length > 1 ? `${name} (+${idRoots.length - 1} more)` : name;
            set({ isExpanded: false, idRoots, repositoryBrowserRootName: rootName, repositoryBrowserRootObjectType: getTermForSystemObjectType(objectType) });
        }
        resetKeywordSearch();

        // explicit override (e.g. a download model picks a Scene parent -- show Scenes only,
        // which the systemObjectType branches below cannot express since eScene already means
        // "ingesting a scene, show its Model parents")
        if (displayOverride) {
            set({ repositoryRootType: displayOverride.repositoryRootType, objectsToDisplay: displayOverride.objectsToDisplay });
            getChildrenForIngestion(idRoots);
            return;
        }

        if (systemObjectType === eSystemObjectType.eModel) {
            set({ repositoryRootType: [eSystemObjectType.eModel, eSystemObjectType.eScene], objectsToDisplay: [eSystemObjectType.eCaptureData, eSystemObjectType.eModel] });
        }

        if (systemObjectType === eSystemObjectType.eCaptureData) {
            set({ repositoryRootType: [eSystemObjectType.eCaptureData, eSystemObjectType.eModel], objectsToDisplay: [eSystemObjectType.eCaptureData, eSystemObjectType.eModel] });
        }

        if (systemObjectType === eSystemObjectType.eScene) {
            set({ repositoryRootType: [eSystemObjectType.eModel, eSystemObjectType.eScene], objectsToDisplay: [eSystemObjectType.eCaptureData, eSystemObjectType.eModel] });
        }

        getChildrenForIngestion(idRoots);
    },
    getChildrenForIngestion: async (idSystemObjects: number[]): Promise<void> => {
        const { getFilterState } = get();
        const filter = getFilterState();
        const { data, error } = await getObjectChildrenForRoot(filter, idSystemObjects);

        // set root to 0 for testing
        // const { data, error } = await getObjectChildrenForRoot(filter, 0);

        if (data && !error) {
            const { getObjectChildren } = data;
            const { entries } = getObjectChildren;

            const updatedTree = new Map();
            updatedTree.set(treeRootKey, entries);
            set({ tree: updatedTree, loading: false });
        }
    },
    closeRepositoryBrowser: (): void => {
        set({ isExpanded: true, idRoots: null });
    },
    resetRepositoryBrowserRoot: (): void => {
        set({  idRoots: null, repositoryBrowserRootObjectType: null, repositoryBrowserRootName: null });
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
    setExpandedCount: (expandedCountNew: number): boolean => { // returns true if we expanded and false if we contracted
        const { expandedCount } = get();
        const retValue: boolean = expandedCountNew > expandedCount;
        set({ expandedCount: expandedCountNew });
        return retValue;
    }
}));