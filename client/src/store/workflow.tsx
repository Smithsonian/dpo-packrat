import create, { GetState, SetState } from 'zustand';
import { WorkflowListResult, GetWorkflowListInput } from '../types/graphql';
import { getWorkflowList } from '../pages/Workflow/hooks/useWorkflow';
import { eWorkflowListSortColumns } from '@dpo-packrat/common';

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
    dateFrom: Date | null;
    dateTo: Date | null;
    pageNumber: number;
    rowCount: number;
    sortBy: eWorkflowListSortColumns;
    sortOrder: boolean | null;
    loading: boolean;
    workflowRowData: WorkflowListResult[];
    updateFilterValue: (name: string, value: number | number[] | Date | null) => void;
    resetWorkflowFilters: () => void;
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
    rowCount: 50,
    sortBy: eWorkflowListSortColumns.eStart,
    sortOrder: false,
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

    fetchWorkflowList: async (): Promise<void> => {
        const { workflowType, jobType, state, initiator, owner, dateFrom, dateTo, pageNumber, rowCount, sortBy, sortOrder } = get();
        set({ loading: true });
        const filter: GetWorkflowListInput = {
            idVWorkflowType: workflowType,
            idVJobType: jobType,
            State: state,
            idUserInitiator: initiator,
            idUserOwner: owner,
            pageNumber: pageNumber + 1,
            DateFrom: dateFrom,
            rowCount,
            sortBy,
            sortOrder
        };

        // setting DateTo to null will return empty array
        if (dateTo) filter.DateTo = handleEndDate(dateTo);

        const { data } = await getWorkflowList(filter);
        if (data?.getWorkflowList?.WorkflowList) {
            const rows = data.getWorkflowList.WorkflowList as WorkflowListResult[];
            set({ workflowRowData: rows });
        }
        set({ loading: false });
    },
    paginationUpdateAndRefetchList: async (changeType: ePaginationChange, value?: number | null, column?: string | null, direction?: string | null): Promise<void> => {
        const { fetchWorkflowList } = get();
        if (changeType === ePaginationChange.ePage && value !== null) set({ pageNumber: value });

        if (changeType === ePaginationChange.eRowCount && value !== null) set({ rowCount: value });

        if (changeType === ePaginationChange.eSort && column) set({ sortBy: workflowListSortStringToEnum(column), sortOrder: direction === 'asc' ? true : false, pageNumber: 0 });

        await fetchWorkflowList();
    }
}));

const handleEndDate = (input: Date | null) => {
    if (!input) return null;
    const date = new Date(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate() + 1);
    return date;
};

const workflowListSortStringToEnum = (col: string): eWorkflowListSortColumns => {
    switch (col) {
        case 'idWorkflowSet': return eWorkflowListSortColumns.eSet;
        case 'Type': return eWorkflowListSortColumns.eType;
        case 'State': return eWorkflowListSortColumns.eState;
        case 'Owner': return eWorkflowListSortColumns.eOwner;
        case 'ProjectName': return eWorkflowListSortColumns.eProject;
        case 'DateStart': return eWorkflowListSortColumns.eStart;
        case 'DateLast': return eWorkflowListSortColumns.eLast;
        case 'idWorkflowReport': return eWorkflowListSortColumns.eReport;
        case 'idJobRun': return eWorkflowListSortColumns.eJobRun;
        case 'Error': return eWorkflowListSortColumns.eError;
        default: return eWorkflowListSortColumns.eDefault;
    }
};
