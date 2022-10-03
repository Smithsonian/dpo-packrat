import create, { GetState, SetState } from 'zustand';
import { SubjectUnitIdentifier, GetSubjectListInput } from '../../../types/graphql';
import { toast } from 'react-toastify';
import { getSubjectList } from '../hooks/useAdminView';
import { eSubjectUnitIdentifierSortColumns } from '@dpo-packrat/common';

export enum ePaginationChange {
    eRowCount,
    ePage,
    eSort
}

export type FilterOption = {
    label: string;
    value: number;
};

type AdminSubjectStore = {
    keyword: string;
    selectedUnit: number;
    pageNumber: number;
    rowCount: number;
    sortOrder: boolean;
    sortBy: eSubjectUnitIdentifierSortColumns;
    loading: boolean;
    subjects: SubjectUnitIdentifier[];
    updateFilterValue: (name: string, value: number | string | null ) => void;
    fetchSubjectList: () => Promise<void>;
    paginationUpdateAndRefetchList: (changeType: ePaginationChange, value?: number | null, column?: string | null, direction?: string | null) => Promise<void>;
};

export const useAdminSubjectStore = create<AdminSubjectStore>((set: SetState<AdminSubjectStore>, get: GetState<AdminSubjectStore>) => ({
    keyword: '',
    selectedUnit: 0,
    pageNumber: 0,
    rowCount: 50,
    sortOrder: true,
    sortBy: eSubjectUnitIdentifierSortColumns.eDefault,
    loading: true,
    subjects: [],
    updateFilterValue: (name: string, value: number | string | null): void => {
        set({ [name]: value });
    },
    fetchSubjectList: async (): Promise<void> => {
        const { keyword, selectedUnit, pageNumber, rowCount, sortBy, sortOrder } = get();
        set({ loading: true });

        try {
            const filter: GetSubjectListInput = {
                search: keyword,
                idUnit: selectedUnit,
                pageNumber: pageNumber + 1,
                rowCount,
                sortBy,
                sortOrder
            };

            const { data } = await getSubjectList(filter);
            if (data?.getSubjectList.subjects && data.getSubjectList.subjects.length) {
                set({ subjects: data?.getSubjectList.subjects });
            } else {
                set({ subjects: [] });
            }
        } catch (error) {
            toast.error(`Error in fetching subjects. Message: ${error}`);
        }

        set({ loading: false });
    },
    paginationUpdateAndRefetchList: async (changeType: ePaginationChange, value?: number | null, column?: string | null, direction?: string | null): Promise<void> => {
        const { fetchSubjectList } = get();
        if (changeType === ePaginationChange.ePage && value !== null) set({ pageNumber: value });

        if (changeType === ePaginationChange.eRowCount && value !== null) set({ rowCount: value });

        if (changeType === ePaginationChange.eSort && column) set({ sortBy: subjectUnitIdentifierStringToEnum(column), sortOrder: direction === 'asc' ? true : false, pageNumber: 0 });

        await fetchSubjectList();
    }
}));

const subjectUnitIdentifierStringToEnum = (col: string): eSubjectUnitIdentifierSortColumns => {
    switch (col) {
        case 'UnitAbbreviation': return eSubjectUnitIdentifierSortColumns.eUnitAbbreviation;
        case 'SubjectName': return eSubjectUnitIdentifierSortColumns.eSubjectName;
        case 'IdentifierPublic': return eSubjectUnitIdentifierSortColumns.eIdentifierValue;
        default: return eSubjectUnitIdentifierSortColumns.eDefault;
    }
};
