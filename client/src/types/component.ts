export interface DataTableOptions {
    filter?: boolean;
    filterType?: string;
    responsive?: string;
    selectableRows?: string;
    search?: boolean;
    download?: boolean;
    print?: boolean;
    fixedHeader?: boolean;
    page?: number;
    count?: number;
    pagination?: boolean;
    elevation?: number;
    tableBodyMaxHeight?: string;
    viewColumns?: boolean;
    rowsPerPage?: number;
    rowsPerPageOptions?: number[];
    sortOrder?: SortOrderOptions;
    onViewColumnsChange?: (change: string, action: string) => void;
    onTableChange?: (change: string, action: string) => void;
    onColumnSortChange?: (changedColumn: string, direction: string) => void;
    onChangeRowsPerPage?: (numberOfRows: number) => void;
    onChangePage?: (currentPage: number) => void;
    textLabels?: {
        pagination?: {
            displayRows?: string;
        };
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    customFooter?: () => any;
}

export interface SortOrderOptions {
    name: string | null;
    direction: 'asc' | 'desc' | null;
}
