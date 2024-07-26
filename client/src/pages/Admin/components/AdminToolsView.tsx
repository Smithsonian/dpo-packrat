/* eslint-disable react/display-name */
/* eslint-disable import/no-unresolved */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-max-props-per-line */

/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import * as COMMON from '@dpo-packrat/common';
import API, { RequestResponse } from '../../../api';

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button, Select, MenuItem, Table, TableContainer, TableCell, TableRow, TableBody, TableHead, TableSortLabel, TablePagination, Checkbox, Paper, Collapse, IconButton } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
// import { DebounceInput } from 'react-debounce-input';
import { useLocation } from 'react-router';
import { useUserStore } from '../../../store';
// import { User } from '../../../types/graphql';
import GenericBreadcrumbsView from '../../../components/shared/GenericBreadcrumbsView';
import { Helmet } from 'react-helmet';
import clsx from 'clsx';

// styles
import { makeStyles } from '@material-ui/core/styles';
import { useStyles as useTableStyles } from '../../Repository/components/DetailsView/DetailsTab/CaptureDataDetails';

// icons
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';

const useStyles = makeStyles(({ palette }) => ({
    btn: {
        height: 30,
        width: 90,
        backgroundColor: palette.primary.main,
        color: 'white',
        margin: '10px'
    },
    btnDisabled: {
        height: 30,
        width: 90,
        backgroundColor: palette.grey[500],
        color: 'white',
        margin: '10px'
    },
    container: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
    },
    content: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        padding: 20,
        paddingBottom: 0
    },
    fieldContainer: {
        borderRadius: '0.5rem',
        border: `1px dashed ${palette.primary.main}`,
        overflow: 'hidden',
        margin: '0.5rem',
        padding: 0
    },
    fieldSizing: {
        width: '240px',
        padding: 0,
        boxSizing: 'border-box',
        textAlign: 'center'
    },
    fileChip: {
        marginRight: 10
    },
    fieldLabel: {
        width: '7rem'
    },
    ingestContainer: {
        borderRadius: '0.5rem',
        border: `1px dashed ${palette.primary.main}`,
        // overflow: 'hidden',
        backgroundColor: palette.primary.light,
        padding: 0,
        marginBottom: '1rem',
    },
    AdminPageViewContainer: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        overflow: 'auto',
        paddingBottom: '15px',
        paddingLeft: '15px',
        margin: '0 auto'
    },
    AdminBreadCrumbsContainer: {
        display: 'flex',
        alignItems: 'center',
        minHeight: '46px',
        paddingLeft: '20px',
        paddingRight: '20px',
        background: '#ECF5FD',
        color: '#3F536E',
        marginBottom: '15px',
        width: 'fit-content'
    },
    styledButton: {
        backgroundColor: '#3854d0',
        color: 'white',
        width: '75px',
        height: '25px',
        outline: '2px hidden #8DABC4',
        '& :focus': {
            outline: '2px solid #8DABC4',
        },
        fontSize: '0.8rem'
    },
    filterContainer: {
        display: 'flex',
        justifyContent: 'space-around',
        width: 'max-content',
        backgroundColor: 'rgb(255, 255, 224)',
        padding: '10px 10px',
        fontSize: '0.8rem',
        outline: '1px solid rgba(141, 171, 196, 0.4)',
        borderRadius: 5
    },
    searchContainerLeft: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '100%',
        width: '80%',
        columnGap: 10,
    },
    searchContainerRight: {
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        height: '100%',
        width: '20%'
    },
    formField: {
        backgroundColor: 'white',
        borderRadius: '4px'
    },
    searchFilter: {
        width: '250px'
    },
    collapseHeader: {
        display: 'flex',
        flexDirection: 'row',
        borderRadius: 5,
        backgroundColor: palette.primary.light,
        width: '100%',
        columnGap: 10,
        rowGap: 10,
        flexWrap: 'wrap',
        justifyContent: 'center',
        border: `1px solid ${palette.primary.main}`,
        color: palette.primary.main
    },
    collapseContainer: {
        border: `1px dotted ${palette.primary.main}`,
        borderTop: 0,
        boxSizing: 'border-box',
        borderRadius: 5,
        paddingBottom: '20px'
    },
    visuallyHidden: {
        border: 0,
        clip: 'rect(0 0 0 0)',
        height: 1,
        margin: -1,
        overflow: 'hidden',
        padding: 0,
        position: 'absolute',
        top: 20,
        width: 1,
    },
}));

type DBReference = {
    id: number,     // system object id
    name: string,   // name of object
};
type ColumnHeader = {
    key: string,
    label: string,
    align?: 'left' | 'right' | 'inherit' | 'center' | 'justify' | undefined,
};
type SelectTableProps<T> = {
    onUpdateSelection: (selection: T[]) => void;
    data: Array<T>;
    columns: ColumnHeader[];
};
const SelectScenesTable = <T extends DBReference>({ onUpdateSelection, data, columns }: SelectTableProps<T>): React.ReactElement => { //(props: SelectTableProps<T>): React.ReactElement {

    type Order = 'asc' | 'desc';

    const classes = useStyles();
    const tableClasses = useTableStyles();
    const [selected, setSelected] = React.useState<T[]>([]);
    const [order, setOrder] = React.useState<Order>('asc');
    const [orderBy, setOrderBy] = React.useState<string>('id');
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(5);

    // utility
    const convertDateToString = (date: Date): string => {
        // resulting format is <year>-<month>-<day>. example: 2024-07-24
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    const resolveProperty = (obj: T, path: string): string | undefined => {

        if(!obj || path.length<=0) {
            console.log(`[PACKRAT:ERROR] invalid inputs for resolveProperty (obj: ${obj ? 'true':'false'} | path: ${path})`);
            return 'NA';
        }

        const keys = path.split('.');

        /* eslint-disable @typescript-eslint/no-explicit-any */
        let result: any = '';

        // get the value stored (only two levels deep)
        switch(keys.length){
            case 1: {
                result = ((obj[keys[0]]) ?? 'NA');
                break;
            }
            case 2: {
                result = ((obj[keys[0]][keys[1]]) ?? 'NA');
                break;
            }
            default: {
                console.log('error.keys: ', Object.keys(obj));
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

        console.log('[PACKRAT:ERROR] unsupported type for table data',result);
        return 'NA';
    };

    // selection
    const updateSelected = (selected: T[]) => {
        console.log('updateSelected: ', selected);
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
        if (b[orderBy] < a[orderBy]) {
            return -1;
        }
        if (b[orderBy] > a[orderBy]) {
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
    const handleRequestSort = (_event: React.MouseEvent<unknown>, property: string) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };
    const createSortHandler = (property: string) => (event: React.MouseEvent<unknown>) => {
        handleRequestSort(event, property);
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
                                <TableCell
                                    key={columnHeading.key}
                                    align={columnHeading.align ?? 'center'}
                                    padding='none'
                                    component='th'
                                    sortDirection={orderBy === columnHeading.key ? order : false}
                                >
                                    {/* columnHeading.label */}
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
                            ))}
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        { (data && Array.isArray(data)) ?
                            stableSort(data, getComparator(order, orderBy))
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((row, index) => {
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
                                                    <TableCell key={column.key} align={column.align ?? 'center'}>
                                                        { resolveProperty(row, column.key) }
                                                    </TableCell>
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

type ProjectScene = DBReference & {
    project: DBReference,
    subject: DBReference,
    mediaGroup: DBReference,
    dateCreated: Date,
    hasDownloads: boolean,
    dateGenDownloads: Date,
    publishedState: COMMON.ePublishedState,
    datePublished: Date,
    isReviewed: boolean
};
const AdminToolsBatchGeneration = (): React.ReactElement => {
    const classes = useStyles();
    const tableClasses = useTableStyles();

    const [operation, setOperation] = useState<number>(0);
    const [selectedList, setSelectedList] = useState<ProjectScene[]>([]);
    const [isListValid, setIsListValid] = useState<boolean>(false);
    const [showBatchOps, setShowBacthOps] = useState<boolean>(false);
    const [projectList, setProjectList] = useState<Project[]>([]);
    const [projectScenes, setProjectScenes] = useState<ProjectScene[]>([]);

    type Project = {
        idProject: number,
        Name: string,
        Description: string | null
    };
    enum BatchOperations {
        DOWNLOADS = 0,
        VOYAGER_SCENE = 1,
    }

    // get data
    const getProjectList = useCallback(async () => {
        try {
            const response: RequestResponse = await API.getProjects();
            if(response.success === false) {
                console.log(`[Packrat:ERROR] cannot get project list. (${response.message})`);
                setSelectedList([]);
                return;
            }

            setProjectList(response.data);
            console.log('getProjectList: ',response.data);
        } catch(error) {
            console.error(`[Packrat:ERROR] Unexpected error fetching project list: ${error}`);
        }
    }, []);
    const getProjectScenes = useCallback(async (project?: Project) => {

        try {
            const scenes: ProjectScene[] = [
                {
                    project: { id: 1, name: 'Project Apollo' },
                    subject: { id: 1, name: 'Lunar Module' },
                    mediaGroup: { id: 1, name: 'Moon Landing' },
                    id: 101,
                    name: 'Eagle Has Landed',
                    dateCreated: new Date('2024-01-15'),
                    hasDownloads: true,
                    dateGenDownloads: new Date('2024-01-20'),
                    publishedState: 1,
                    datePublished: new Date('2024-01-25'),
                    isReviewed: true
                },
                {
                    project: { id: 2, name: 'Project Voyager' },
                    subject: { id: 2, name: 'Voyager 1' },
                    mediaGroup: { id: 2, name: 'Outer Solar System' },
                    id: 102,
                    name: 'Journey to Jupiter',
                    dateCreated: new Date('2024-02-10'),
                    hasDownloads: false,
                    dateGenDownloads: new Date('2024-02-15'),
                    publishedState: 0,
                    datePublished: new Date('2024-02-20'),
                    isReviewed: false
                },
                {
                    project: { id: 3, name: 'Project Mars' },
                    subject: { id: 3, name: 'Rover Curiosity' },
                    mediaGroup: { id: 3, name: 'Mars Exploration' },
                    id: 103,
                    name: 'Martian Landscape',
                    dateCreated: new Date('2024-03-05'),
                    hasDownloads: true,
                    dateGenDownloads: new Date('2024-03-10'),
                    publishedState: 1,
                    datePublished: new Date('2024-03-15'),
                    isReviewed: true
                },
                {
                    project: { id: 4, name: 'Project Neptune' },
                    subject: { id: 4, name: 'Deep Sea Probe' },
                    mediaGroup: { id: 4, name: 'Oceanic Research' },
                    id: 104,
                    name: 'Into the Abyss',
                    dateCreated: new Date('2024-04-01'),
                    hasDownloads: false,
                    dateGenDownloads: new Date('2024-04-05'),
                    publishedState: 0,
                    datePublished: new Date('2024-04-10'),
                    isReviewed: false
                },
                {
                    project: { id: 5, name: 'Project Gaia' },
                    subject: { id: 5, name: 'Earth Observation' },
                    mediaGroup: { id: 5, name: 'Global Monitoring' },
                    id: 105,
                    name: 'Blue Marble',
                    dateCreated: new Date('2024-05-15'),
                    hasDownloads: true,
                    dateGenDownloads: new Date('2024-05-20'),
                    publishedState: 1,
                    datePublished: new Date('2024-05-25'),
                    isReviewed: true
                },
                {
                    project: { id: 6, name: 'Project Titan' },
                    subject: { id: 6, name: 'Saturn\'s Moon' },
                    mediaGroup: { id: 6, name: 'Space Missions' },
                    id: 106,
                    name: 'Ringed Giant',
                    dateCreated: new Date('2024-06-10'),
                    hasDownloads: false,
                    dateGenDownloads: new Date('2024-06-15'),
                    publishedState: 0,
                    datePublished: new Date('2024-06-20'),
                    isReviewed: false
                },
                {
                    project: { id: 7, name: 'Project Orion' },
                    subject: { id: 7, name: 'Deep Space Mission' },
                    mediaGroup: { id: 7, name: 'Future Exploration' },
                    id: 107,
                    name: 'Beyond the Stars',
                    dateCreated: new Date('2024-07-05'),
                    hasDownloads: true,
                    dateGenDownloads: new Date('2024-07-10'),
                    publishedState: 1,
                    datePublished: new Date('2024-07-15'),
                    isReviewed: true
                }
            ];

            const response: RequestResponse = await API.getProjectScenes(project ? project.idProject : -1);
            if(response.success === false) {
                console.log(`[Packrat:ERROR] cannot get project scenes list. (project: ${project ? project.Name : 'all'} | message: ${response.message})`);
                setProjectScenes([]);
                return;
            }

            // cycle through data converting as needed
            response.data.forEach(obj => {
                // stored ISO strings to Date objects
                obj.dateCreated = new Date(obj.dateCreated as string);
                obj.dateGenDownloads = new Date(obj.dateGenDownloads as string);
                obj.datePublished = new Date(obj.datePublished as string);

                // published state to string (TODO: more natural mapping)
                obj.publishedState = COMMON.ePublishedState[obj.publishedState];
            });

            console.log('getProjectScenes: ',response.data);
            setProjectScenes(response.data);
        } catch(error) {
            console.error(`[Packrat:ERROR] Unexpected error fetching project scenes: ${error}`);
        }
    }, []);
    const getColumnHeader = (): ColumnHeader[] => {
        return [
            { key: 'id', label: 'ID', align: 'center' },
            { key: 'name', label: 'Scene Name', align: 'center' },
            { key: 'subject.name', label: 'Subject Name', align: 'center' },
            { key: 'hasDownloads', label: 'Downloads', align: 'center' },
            { key: 'dateGenDownloads', label: 'Downloads (Date)', align: 'center' },
            { key: 'publishedState', label: 'Published', align: 'center' },
            // { key: 'datePublished', label: 'Published (Date)', align: 'center' },
            // { key: 'isReviewed', label: 'Reviewed', align: 'center' }
        ];
    };

    // handle changes
    const handleOperationChange = (event) => {
        setOperation(event.target.value);
    };
    const handleProjectChange = (_event, newValue: Project | null) => {
        // store our value so the table gets updated, null if empty
        console.log(newValue);
        getProjectScenes(newValue ?? undefined);
    };
    const onProcessOperation = async () => {

        console.log(`[PACKRAT] Starting ${BatchOperations[operation]} batch operation for: ${selectedList.join(', ')}`);

        // build request to server

        // send request and wait

        // get report and store details
        //      change button to 'cancel'
        //      fire iteration polling status of job
    };
    const onUpdatedSelection = (selection) => {
        console.log('updated selection: ', selection);
        setSelectedList(selection);
        setIsListValid(selection.length>0);
    };

    // mounting/alteration routines
    useEffect(() => {
        // propogate our list of projects and scenes
        getProjectList();
        getProjectScenes();
    }, [getProjectList, getProjectScenes]);

    // JSX
    return (
        <Box className={classes.container} style={{ margin: '10px' }}>
            <IconButton
                className={classes.collapseHeader}
                style={{ marginTop: '1rem', fontSize: '1.2rem' }}
                onClick={() => setShowBacthOps(showBatchOps === true ? false:true )}
            >
                Batch Generation
                {showBatchOps === true ? (<KeyboardArrowUpIcon />):( <KeyboardArrowDownIcon /> )}
            </IconButton>
            <Collapse in={showBatchOps} className={classes.container}>
                <Box className={classes.collapseContainer} style={{ paddingTop: '10px', width: '100%' }}>
                    <TableContainer component={Paper} elevation={0}>
                        <Table className={tableClasses.table}>
                            <TableBody>
                                <TableRow className={tableClasses.tableRow}>
                                    <TableCell className={clsx(tableClasses.tableCell, classes.fieldLabel)}>
                                        <Typography className={tableClasses.labelText}>Operation Type</Typography>
                                    </TableCell>
                                    <TableCell className={tableClasses.tableCell}>
                                        <Select
                                            labelId='batch-generation-op'
                                            id='batch-generation-op'
                                            value={operation}
                                            label='Operation'
                                            onChange={handleOperationChange}
                                            disableUnderline
                                            className={clsx(tableClasses.select, classes.fieldSizing)}
                                            SelectDisplayProps={{ style: { paddingLeft: '10px', borderRadius: '5px' } }}
                                        >
                                            <MenuItem value={0}>Downloads</MenuItem>
                                            <MenuItem value={1} disabled>Voyager Scenes</MenuItem>
                                        </Select>
                                    </TableCell>
                                </TableRow>

                                <TableRow className={tableClasses.tableRow}>
                                    <TableCell className={clsx(tableClasses.tableCell, classes.fieldLabel)}>
                                        <Typography className={tableClasses.labelText}>Project</Typography>
                                    </TableCell>
                                    <TableCell className={tableClasses.tableCell}>
                                        <Autocomplete
                                            id='project-list'
                                            options={projectList}
                                            getOptionLabel={(option) => option.Name}
                                            onChange={handleProjectChange}
                                            size={'small'}
                                            className={clsx(tableClasses.select, classes.fieldSizing)}
                                            style={{ width: '300px', paddingLeft: '5px' }}
                                            getOptionSelected={(option, value) => option.idProject === value.idProject}
                                            renderInput={(params) =>
                                                // <TextField {...params} variant='outlined' placeholder='Project' style={{ border: 'none' }} />
                                                <div ref={params.InputProps.ref} style={{ height: '100%' }}>
                                                    <input style={{ width: '100%', border: 'none', height: '100%', background: 'none', paddingLeft: '5px' }} type='text' {...params.inputProps} />
                                                </div>
                                            }
                                        />
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <SelectScenesTable<ProjectScene>
                        onUpdateSelection={onUpdatedSelection}
                        data={projectScenes}
                        columns={getColumnHeader()}
                    />

                    { isListValid ? ( // if we have valid indices show the button to submit
                        <Box style={{ display: 'flex', justifyContent: 'center' }}>
                            <Button
                                className={classes.btn}
                                onClick={onProcessOperation}
                                disableElevation

                            >
                                Go
                            </Button>
                        </Box>
                    ):(
                        <Typography style={{ textAlign: 'center' }}>List of IDs is invalid. Please check.</Typography>
                    )}
                </Box>
            </Collapse>
        </Box>
    );
};

function AdminToolsView(): React.ReactElement {
    const classes = useStyles();
    const location = useLocation();
    const { user } = useUserStore();
    const [isAuthorized, setIsAuthorized] = useState<boolean>(false);

    useEffect(() => {
        async function isUserAuthorized() {
            const authorizedUsers: number[] = [
                2,  // Jon Blundell
                4,  // Jamie Cope
                5   // Eric Maslowski
            ];

            // if our current user ID is not in the list then return false
            if(!user) {
                console.log('[PACKRAT:ERROR] Admin tools cannot get authenticated user');
                setIsAuthorized(false);
            }
            setIsAuthorized(authorizedUsers.includes(user?.idUser ?? -1));
        }

        isUserAuthorized();
    }, [user]);

    return (
        <React.Fragment>
            <Helmet>
                <title>Admin: Tools</title>
            </Helmet>
            <Box className={classes.AdminPageViewContainer}>
                <Box className={classes.AdminBreadCrumbsContainer}>
                    <GenericBreadcrumbsView items={location.pathname.slice(1)} />
                </Box>
                {
                    isAuthorized ? (
                        <AdminToolsBatchGeneration />
                    ):(
                        <p>Not Authorized!</p>
                    )
                }
            </Box>
        </React.Fragment>
    );
}

export default AdminToolsView;
