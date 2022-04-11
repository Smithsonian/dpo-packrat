/* eslint-disable @typescript-eslint/no-explicit-any */

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
    customFooter?: () => any;
    customTableBodyFooterRender?: () => any;
    setRowProps?: (row?, dataIndex?, rowIndex?) => any;
    setCellHeaderProps?: (any) => any;
    setTableProps?: (any) => any;
}

export interface SortOrderOptions {
    name: string | null;
    direction: 'asc' | 'desc' | null;
}
