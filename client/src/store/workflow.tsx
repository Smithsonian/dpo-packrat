import create, { GetState, SetState } from 'zustand';
import { GetWorkflowListInput, WorkflowListResult } from '../types/graphql';
import { getWorkflowList } from '../pages/Workflow/hooks/useWorkflow';
import { workflowListSortStringToEnum, eWorkflowListSortColumns } from '../types/server';

export enum ePaginationChange {
    eRowCount,
    ePage,
    eSort
}

export type FilterOption = {
    label: string;
    value: number;
};

type WorkflowStore = {
    workflowType: number[];
    jobType: number[];
    state: number[];
    initiator: number[];
    owner: number[];
    dateFrom: Date | string | null;
    dateTo: Date | string | null;
    pageNumber: number;
    rowCount: number;
    sortBy: eWorkflowListSortColumns;
    sortOrder: boolean | null;
    loading: boolean;
    workflowRowData: WorkflowListResult[];
    updateFilterValue: (name: string, value: number | number[] | Date | null) => void;
    resetWorkflowFilters: () => void;
    getWorkflowSearchFilterState: () => GetWorkflowListInput;
    fetchWorkflowList: () => Promise<void>;
    paginationUpdateAndRefetchList: (changeType: ePaginationChange, value?: number | null, column?: string | null, direction?: string | null) => Promise<void>;
};

export const useWorkflowStore = create<WorkflowStore>((set: SetState<WorkflowStore>, get: GetState<WorkflowStore>) => ({
    workflowType: [],
    jobType: [],
    state: [],
    initiator: [],
    owner: [],
    dateFrom: null,
    dateTo: null,
    pageNumber: 0,
    rowCount: 25,
    sortBy: eWorkflowListSortColumns.eDefault,
    sortOrder: null,
    loading: false,
    workflowRowData: [],
    updateFilterValue: (name: string, value: number | number[] | Date | null): void => {
        set({ [name]: value });
    },
    resetWorkflowFilters: () => {
        const resetState = {
            workflowType: [],
            jobType: [],
            state: [],
            initiator: [],
            owner: [],
            dateFrom: null,
            dateTo: null
        };
        set({ ...resetState });
    },
    getWorkflowSearchFilterState: () => {
        // TODO format time
        const { workflowType, jobType, state, initiator, owner, dateFrom, dateTo, pageNumber, rowCount, sortBy, sortOrder } = get();
        return {
            idVWorkflowType: workflowType,
            idVJobType: jobType,
            State: state,
            idUserInitiator: initiator,
            idUserOwner: owner,
            DateFrom: dateFrom,
            DateTo: dateTo,
            pageNumber,
            rowCount,
            sortBy,
            sortOrder
        };
    },
    fetchWorkflowList: async (): Promise<void> => {
        const { getWorkflowSearchFilterState } = get();
        const { data } = await getWorkflowList(getWorkflowSearchFilterState());
        if (data?.getWorkflowList?.WorkflowList) {
            const rows = data.getWorkflowList.WorkflowList as WorkflowListResult[];
            set({ workflowRowData: rows });
        }
        console.log('list', data.getWorkflowList.WorkflowList);
        // console.log('workflowRowData', workflowRowData);
    },
    paginationUpdateAndRefetchList: async (changeType: ePaginationChange, value?: number | null, column?: string | null, direction?: string | null): Promise<void> => {
        const { fetchWorkflowList } = get();

        if (changeType === ePaginationChange.ePage && value) set({ pageNumber: value });

        if (changeType === ePaginationChange.eRowCount && value) set({ rowCount: value });

        if (changeType === ePaginationChange.eSort && column) set({ sortBy: workflowListSortStringToEnum(column), sortOrder: direction === 'asc' ? true : false });

        await fetchWorkflowList();
    }
}));
