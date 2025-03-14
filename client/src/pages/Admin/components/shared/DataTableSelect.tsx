// import API, { RequestResponse } from '../../../../api';
import React, { useEffect } from 'react';
import { Box, Table, TableContainer, TableCell, TableRow, TableBody, TableHead, TableSortLabel, TablePagination, Tooltip, Checkbox } from '@material-ui/core';
import { DBReference, ColumnHeader, useStyles as useToolsStyles } from '../shared/DataTypesStyles';

// styles
import { useStyles as useTableStyles } from '../../../Repository/components/DetailsView/DetailsTab/CaptureDataDetails';

export type SelectTableProps<T> = {
    onUpdateSelection: (selection: T[]) => void;
    data: Array<T>;
    columns: ColumnHeader[];
    resetSelection?: boolean;
};
export const DataTableSelect = <T extends DBReference>({ onUpdateSelection, data, columns, resetSelection }: SelectTableProps<T>): React.ReactElement => {

    type Order = 'asc' | 'desc';

    const classes = useToolsStyles();
    const tableClasses = useTableStyles();
    const [selected, setSelected] = React.useState<T[]>([]);
    const [order, setOrder] = React.useState<Order>('asc');
    const [orderBy, setOrderBy] = React.useState<string>('id');
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);

    // utility
    const convertDateToString = (date: Date): string => {
        // resulting format is <year>-<month>-<day>. example: 2024-07-24
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    const resolveProperty = (obj: T, path: string): string => {

        if(!obj || path.length<=0) {
            console.log(`[Packrat:ERROR] invalid inputs for resolveProperty (obj: ${obj ? 'true':'false'} | path: ${path})`);
            return 'NA';
        }

        // if we're doing a link just return it
        if(path.includes('_link'))
            return obj[path] ?? '#';

        // otherwise, we split it up and try to resolve
        const keys = path.split('.');

        /* eslint-disable @typescript-eslint/no-explicit-any */
        let result: any = '';

        // get the value stored (only three levels deep)
        switch(keys.length){
            case 1: {
                result = ((obj?.[keys[0]]) ?? 'NA');
                break;
            }
            case 2: {
                result = ((obj?.[keys[0]]?.[keys[1]]) ?? 'NA');
                break;
            }
            case 3: {
                result = ((obj?.[keys[0]]?.[keys[1]]?.[keys[2]]) ?? 'NA');
                break;
            }
            default: {
                console.log('[Packrat:ERROR] error.keys: ', Object.keys(obj));
                result = 'NA';
            }
        }

        // convert into a string and return based on type
        const type = typeof(result);
        switch(type) {
            case 'string': {
                return result;
            }

            case 'number':
            case 'boolean': {
                return result.toString();
            }

            case 'object': {
                if(result instanceof Date) {
                    return convertDateToString(result);
                }
            }
        }

        console.log('[Packrat:ERROR] unsupported type for table data',result);
        return 'NA';
    };
    const getNestedValue = (obj: any, path: string): any => {
        return path.split('.').reduce((value, key) => value[key], obj);
    };

    // selection
    const updateSelected = (selected: T[]) => {
        setSelected(selected);
        onUpdateSelection(selected);
    };
    const isSelected = (item: T) => selected.findIndex((selectedItem) => selectedItem.id === item.id) !== -1;
    const handleRowSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            // now we update our selection and propogate changes to calling component
            updateSelected([...data]);
            return;
        }

        // reset our selected list and feed it to the calling comp
        updateSelected([]);
    };
    const handleRowSelect = (_event: React.MouseEvent<unknown>, item: T) => {
        // expecting a full object to be passed in
        const selectedIndex = selected.findIndex((selectedItem) => selectedItem.id === item.id);
        let newSelected: T[] = [];

        if (selectedIndex === -1) {
            newSelected = newSelected.concat(selected, item);
        } else if (selectedIndex === 0) {
            newSelected = newSelected.concat(selected.slice(1));
        } else if (selectedIndex === selected.length - 1) {
            newSelected = newSelected.concat(selected.slice(0, -1));
        } else if (selectedIndex > 0) {
            newSelected = newSelected.concat(
                selected.slice(0, selectedIndex),
                selected.slice(selectedIndex + 1),
            );
        }

        // now we update our selection and propogate changes to calling component
        updateSelected(newSelected);
    };

    // sorting
    function getComparator(
        order: Order,
        orderBy: string,
    ): (a: { [key: string]: number | string }, b: { [key: string]: number | string }) => number {
        return order === 'desc'
            ? (a, b) => descendingComparator(a, b, orderBy)
            : (a, b) => -descendingComparator(a, b, orderBy);
    }
    function descendingComparator(
        a: { [key: string]: number | string },
        b: { [key: string]: number | string },
        orderBy: string
    ): number {
        // we handle this to ensure nested properties are sortable
        const aValue = getNestedValue(a, orderBy);
        const bValue = getNestedValue(b, orderBy);

        if (bValue < aValue) {
            return -1;
        }
        if (bValue > aValue) {
            return 1;
        }
        return 0;
    }
    function stableSort<T>(array: T[], comparator: (a: T, b: T) => number): T[] {
        if (!array || !Array.isArray(array)) {
            console.error('not array', array);
            return [];
        }

        // Create an array of indices
        const indices = array.map((_, index) => index);

        // Sort indices based on the comparator applied to the elements in the original array
        indices.sort((a, b) => {
            const order = comparator(array[a], array[b]);
            if (order !== 0) return order;
            return a - b; // Preserve original order for equal elements
        });

        // Map the sorted indices back to the original elements
        return indices.map(index => array[index]);
    }
    const createSortHandler = (property: string) => (_event: React.MouseEvent<unknown>) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    // pagination
    const emptyRows = rowsPerPage - Math.min(rowsPerPage, data.length - page * rowsPerPage);
    const handleChangePage = (_event: unknown, newPage: number) => {
        setPage(newPage);
    };
    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };
    const handleElementClick = (event) => {
        event.stopPropagation();
    };

    // table operations
    const onResetSelection = () => {
        setSelected([]);
    };
    useEffect(() => {
        if (resetSelection===true)
            onResetSelection();

    }, [resetSelection]);

    // JSX
    return (
        <Box style={{ marginTop: '2rem', marginBottom: '2rem' }}>
            <TableContainer>
                <Table
                    className={tableClasses.table}
                    aria-labelledby='tableTitle'
                    size='small'
                    aria-label='enhanced table'
                >
                    <TableHead>
                        <TableRow>
                            <TableCell padding='checkbox'>
                                <Checkbox
                                    indeterminate={selected.length > 0 && selected.length < data.length}
                                    checked={data.length > 0 && selected.length === data.length}
                                    onChange={handleRowSelectAll}
                                    inputProps={{ 'aria-label': 'select all items' }}
                                />
                            </TableCell>
                            { columns.map((columnHeading) => (
                                <Tooltip key={columnHeading.key} title={columnHeading.tooltip ?? columnHeading.key} disableHoverListener={!columnHeading.tooltip}>
                                    <TableCell
                                        align={columnHeading.align ?? 'center'}
                                        padding='none'
                                        component='th'
                                        sortDirection={orderBy === columnHeading.key ? order : false}
                                    >
                                        <TableSortLabel
                                            active={orderBy === columnHeading.key}
                                            direction={orderBy === columnHeading.key ? order : 'asc'}
                                            onClick={createSortHandler(columnHeading.key)}
                                        >
                                            {columnHeading.label}
                                            {orderBy === columnHeading.key ? (
                                                <span className={classes.visuallyHidden}>
                                                    {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                                                </span>
                                            ) : null}
                                        </TableSortLabel>
                                    </TableCell>
                                </Tooltip>
                            ))}
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        { (data && Array.isArray(data)) ?
                            stableSort(data, getComparator(order, orderBy))
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((row: T, index: number) => {
                                    const isItemSelected = isSelected(row);
                                    const labelId = `table-checkbox-${index}`;

                                    return (
                                        <TableRow
                                            hover
                                            onClick={(event) => handleRowSelect(event, row)}
                                            role='checkbox'
                                            aria-checked={isItemSelected}
                                            tabIndex={-1}
                                            key={row.id}
                                            selected={isItemSelected}
                                        >
                                            <TableCell padding='checkbox'>
                                                <Checkbox
                                                    checked={isItemSelected}
                                                    inputProps={{ 'aria-labelledby': labelId }}
                                                />
                                            </TableCell>
                                            <TableCell component='th' id={labelId} scope='row' padding='none'>
                                                {row.id}
                                            </TableCell>
                                            {columns.map((column) => (
                                                // we do 'id' above so we can flag the entire row for accessibility
                                                (column.key!=='id') && (
                                                    <Tooltip
                                                        key={column.key}
                                                        title={resolveProperty(row,column.key)}
                                                    >
                                                        <TableCell
                                                            align={column.align ?? 'center'}
                                                            style={{  whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '10rem', }}
                                                        >
                                                            { (column.link && column.link===true) ? (
                                                                (() => {
                                                                    // if our link has a # we just skip adding the href so we don't
                                                                    // reload page on click or go to different unrelated page
                                                                    const link = resolveProperty(row, `${column.key}_link`);
                                                                    const displayText = resolveProperty(row, column.key);
                                                                    return link.includes('#') ? (
                                                                        displayText
                                                                    ) : (
                                                                        <a href={link} target='_blank' rel='noopener noreferrer' onClick={handleElementClick}>
                                                                            {displayText}
                                                                        </a>
                                                                    );
                                                                })()
                                                            ) : (
                                                                resolveProperty(row, column.key)
                                                            )}
                                                        </TableCell>
                                                    </Tooltip>
                                                )
                                            ))}
                                        </TableRow>
                                    );
                                }):
                            <></>}

                        {emptyRows > 0 && (
                            <TableRow style={{ height: 33 * emptyRows }}>
                                <TableCell colSpan={6} />
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                rowsPerPageOptions={[5, 10, 25, (data.length>25)?data.length:100].filter(option => option <= data.length)} // include options based on total count and one option to view all
                component='div'
                count={data.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onChangePage={handleChangePage}
                onChangeRowsPerPage={handleChangeRowsPerPage}
            />
        </Box>
    );
};

// export default DataTableSelect;