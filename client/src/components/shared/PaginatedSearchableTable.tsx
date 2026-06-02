/**
 * PaginatedSearchableTable
 *
 * Generic MUI-based table with built-in client-side pagination and an optional
 * filename/text search. Designed to be reused across the Details pages anywhere
 * a list of records benefits from browsing controls (ZIP entries, capture-data
 * asset files, scene assets, etc.).
 *
 * Column definitions describe how to render each cell. The optional `rowActions`
 * slot renders extra controls per row (e.g., a Preview button).
 */
import React, { ReactNode, useMemo, useState } from 'react';
import {
    Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TablePagination, TextField, Typography
} from '@material-ui/core';

export interface PaginatedColumn<T> {
    key: keyof T & string;
    label: string;
    /** Optional custom renderer for the cell. Receives the row and should return ReactNode. */
    format?: (row: T) => ReactNode;
    align?: 'left' | 'center' | 'right';
    width?: string | number;
}

export interface PaginatedSearchableTableProps<T> {
    rows: T[];
    columns: PaginatedColumn<T>[];
    /**
     * Field keys to search across (case-insensitive substring match). If omitted,
     * search is disabled and the search box is hidden.
     */
    searchFields?: (keyof T & string)[];
    searchPlaceholder?: string;
    /** Default page size; falls back to 25. */
    defaultPageSize?: number;
    /** Selectable page sizes; falls back to [25, 50, 100, 250]. */
    pageSizeOptions?: number[];
    /** Right-aligned action cell rendered after the configured columns. */
    rowActions?: (row: T) => ReactNode;
    /** Shown when rows is empty after filtering. */
    emptyMessage?: string;
    /** Optional accessible caption / sub-title row above the table. */
    caption?: ReactNode;
}

function defaultMatches<T>(row: T, term: string, fields: (keyof T & string)[]): boolean {
    if (!term) return true;
    const needle = term.toLowerCase();
    for (const field of fields) {
        const value = row[field];
        if (value === null || value === undefined) continue;
        if (String(value).toLowerCase().includes(needle)) return true;
    }
    return false;
}

export function PaginatedSearchableTable<T>(props: PaginatedSearchableTableProps<T>): JSX.Element {
    const {
        rows, columns, searchFields, searchPlaceholder = 'Filter…',
        defaultPageSize = 25, pageSizeOptions = [25, 50, 100, 250],
        rowActions, emptyMessage = 'No entries', caption,
    } = props;

    const [search, setSearch] = useState<string>('');
    const [page, setPage] = useState<number>(0);
    const [rowsPerPage, setRowsPerPage] = useState<number>(defaultPageSize);

    const filtered: T[] = useMemo(() => {
        if (!searchFields || searchFields.length === 0 || search === '')
            return rows;
        return rows.filter(row => defaultMatches(row, search, searchFields));
    }, [rows, search, searchFields]);

    const paged: T[] = useMemo(() => {
        const start = page * rowsPerPage;
        return filtered.slice(start, start + rowsPerPage);
    }, [filtered, page, rowsPerPage]);

    const handleChangePage = (_e: unknown, newPage: number): void => setPage(newPage);
    const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setRowsPerPage(parseInt(e.target.value, 10));
        setPage(0);
    };
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setSearch(e.target.value);
        setPage(0);
    };

    return (
        <Box>
            {caption && <Box mb={1}>{caption}</Box>}
            {searchFields && searchFields.length > 0 && (
                <Box mb={1}>
                    <TextField
                        size='small'
                        variant='outlined'
                        placeholder={searchPlaceholder}
                        value={search}
                        onChange={handleSearchChange}
                        fullWidth
                    />
                </Box>
            )}
            <TableContainer component={Paper} variant='outlined'>
                <Table size='small'>
                    <TableHead>
                        <TableRow>
                            {columns.map(col => (
                                <TableCell key={col.key} align={col.align ?? 'left'} style={{ width: col.width, fontWeight: 600 }}>
                                    {col.label}
                                </TableCell>
                            ))}
                            {rowActions && <TableCell align='right' style={{ fontWeight: 600 }}>Actions</TableCell>}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paged.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={columns.length + (rowActions ? 1 : 0)} align='center'>
                                    <Typography variant='body2' color='textSecondary'>{emptyMessage}</Typography>
                                </TableCell>
                            </TableRow>
                        )}
                        {paged.map((row, idx) => (
                            <TableRow key={idx} hover>
                                {columns.map(col => (
                                    <TableCell key={col.key} align={col.align ?? 'left'}>
                                        {col.format ? col.format(row) : String(row[col.key] ?? '')}
                                    </TableCell>
                                ))}
                                {rowActions && (
                                    <TableCell align='right'>{rowActions(row)}</TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                component='div'
                count={filtered.length}
                page={page}
                onChangePage={handleChangePage}
                rowsPerPage={rowsPerPage}
                onChangeRowsPerPage={handleChangeRowsPerPage}
                rowsPerPageOptions={pageSizeOptions}
            />
        </Box>
    );
}

export default PaginatedSearchableTable;
