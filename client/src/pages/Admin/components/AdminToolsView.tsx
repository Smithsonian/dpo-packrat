/* eslint-disable react/display-name */
/* eslint-disable import/no-unresolved */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-max-props-per-line */

/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import API, { RequestResponse } from '../../../api';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Typography, Button, Select, MenuItem, Table, TableContainer, TableCell, TableRow, TableBody, TableHead, TableSortLabel, TablePagination, Tooltip, Checkbox, Paper, Collapse, Input, IconButton } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import { useLocation } from 'react-router';
import { useUserStore } from '../../../store';
import GenericBreadcrumbsView from '../../../components/shared/GenericBreadcrumbsView';
import { Helmet } from 'react-helmet';
import clsx from 'clsx';
import { toast } from 'react-toastify';

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
    tooltip?: string,
    link?: boolean
};
type SelectTableProps<T> = {
    onUpdateSelection: (selection: T[]) => void;
    data: Array<T>;
    columns: ColumnHeader[];
    resetSelection?: boolean;
};
const SelectScenesTable = <T extends DBReference>({ onUpdateSelection, data, columns, resetSelection }: SelectTableProps<T>): React.ReactElement => {

    type Order = 'asc' | 'desc';

    const classes = useStyles();
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
    const resolveProperty = (obj: T, path: string): string | undefined => {

        if(!obj || path.length<=0) {
            console.log(`[Packrat:ERROR] invalid inputs for resolveProperty (obj: ${obj ? 'true':'false'} | path: ${path})`);
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
                                <TableCell
                                    key={columnHeading.key}
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
                                                        { (column.link && column.link===true) ? (
                                                            <>
                                                                <a href={resolveProperty(row, `${column.key}_link`)} target='_blank' rel='noopener noreferrer' onClick={handleElementClick}>
                                                                    {resolveProperty(row,column.key)}
                                                                </a>
                                                            </>
                                                        ) : (
                                                            resolveProperty(row, column.key)
                                                        )}
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

// TODO: add enums and types to library and/or COMMON as needed
// TODO: refresh data table button
// NOTE: 'Summary' types/objects are intended for return via the API and for external use
//       so non-standard types (e.g. enums) are converted to strings for clarity/accessibility.
type AssetSummary = DBReference & {
    downloadable: boolean,
    quality: string,
    usage: string,
    dateCreated: Date,
};
type AssetList = {
    status: string,
    items: AssetSummary[];
};
type SceneSummary = DBReference & {
    project: DBReference,
    subject: DBReference,
    mediaGroup: DBReference,
    dateCreated: Date,
    downloads: AssetList,
    publishedState: string,
    datePublished: Date,
    isReviewed: boolean
};
const AdminToolsBatchGeneration = (): React.ReactElement => {
    const classes = useStyles();
    const tableClasses = useTableStyles();

    const [operation, setOperation] = useState<number>(0);
    const [selectedList, setSelectedList] = useState<SceneSummary[]>([]);
    const [isListValid, setIsListValid] = useState<boolean>(false);
    const [showBatchOps, setShowBacthOps] = useState<boolean>(false);
    const [projectList, setProjectList] = useState<Project[]>([]);
    const [projectScenes, setProjectScenes] = useState<SceneSummary[]>([]);
    const [projectSelected, setProjectSelected] = useState<Project|undefined>(undefined);
    const [resetSelection, setResetSelection] = useState<boolean>(false);
    const [republishScenes, setRepublishScenes] = useState(false);
    const [sceneNameFilter, setSceneNameFilter] = useState('');

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
            // console.log('[Packrat:DEBUG] getProjectList: ',response.data);
        } catch(error) {
            console.error(`[Packrat:ERROR] Unexpected error fetching project list: ${error}`);
        }
    }, []);
    const getProjectScenes = useCallback(async (project?: Project) => {
        try {
            console.log(`[Packrat] getting scenes for project (${project ? project.Name:'all'}) - STARTED`);
            const response: RequestResponse = await API.getProjectScenes(project ? project.idProject : -1);
            if(response.success === false) {
                console.log(`[Packrat:ERROR] cannot get project scenes list. (project: ${project ? project.Name : 'all'} | message: ${response.message})`);
                setProjectScenes([]);
                return;
            }

            // cycle through data converting as needed
            const { protocol, host } = window.location;
            response.data.forEach(obj => {
                // stored ISO strings to Date objects
                obj.dateCreated = new Date(obj.dateCreated as string);
                // obj.dateGenDownloads = new Date(obj.dateGenDownloads as string);
                obj.datePublished = new Date(obj.datePublished as string);

                // inject hyperlinks for the scene details page
                // link ties to 'name' field so need to set property to prefix of 'name_'
                obj['name_link'] = `${protocol}//${host}/repository/details/${obj.id}`;
            });

            // console.log('[Packrat:DEBUG] getProjectScenes: ',response.data);
            console.log(`[Packrat] getting scenes for project (${project ? project.Name:'all'}) - FINISHED [${response.data.length}]`);
            setProjectScenes(response.data);
        } catch(error) {
            console.error(`[Packrat:ERROR] Unexpected error fetching project scenes: ${error}`);
        }
    }, []);
    const getColumnHeader = (): ColumnHeader[] => {
        return [
            { key: 'id', label: 'ID', align: 'center' },
            { key: 'name', label: 'Scene Name', align: 'center', link: true },
            { key: 'subject.name', label: 'Subject Name', align: 'center' },
            { key: 'downloads.status', label: 'Downloads', align: 'center' },
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
        const project: Project | undefined = newValue ?? undefined;
        setProjectSelected(project);
        getProjectScenes(project);
    };
    const handleRepublishChange = (event) => {
        setRepublishScenes(event.target.value === 'true');
    };
    const onProcessOperation = async () => {

        if(selectedList.length===0) {
            toast.error('Cannot submit job. Nothing selected.');
            return;
        }
        console.log(`[Packrat] Starting ${BatchOperations[operation]} batch operation for ${selectedList.length} items: `,selectedList);

        // get our list of scene idSystemObject
        const sceneIDs: number[] = selectedList.map((scene)=>scene.id);

        // build request to server
        const response: RequestResponse = await API.generateDownloads(sceneIDs,false,republishScenes);
        if(response.success === false) {

            // if the job is running then handle differently
            if(response.message && response.message.includes('already running')) {
                console.log(`[Packrat:WARN] cannot do ${BatchOperations[operation]}. (${response.message})`);
                toast.warn(`Not running ${BatchOperations[operation]}. Job already running. Please wait for it to finish.`);
            } else {
                console.log(`[Packrat:ERROR] cannot run ${BatchOperations[operation]}. (${response.message})`);
                toast.error(`Cannot ${BatchOperations[operation]}. Check the report.`);
            }
            return;
        }

        // clear selection on succcess
        onResetSelection();

        // notify the user/log
        toast.success(`Generating Downloads for ${sceneIDs.length} scenes. Check the workflow tab for progress.`);
        console.log(`[Packrat] Submitted ${BatchOperations[operation]} batch operation for ${selectedList.length} items: `,selectedList);
        return;
    };
    const onUpdatedSelection = (selection) => {
        setSelectedList(selection);
        setIsListValid(selection.length>0);
    };
    const onResetSelection = () => {
        // quickly signal we want to reset the list and then set the value back to false
        setResetSelection(true);
        setTimeout(() => setResetSelection(false), 1); // set flag back so it doesn't keep resetting it
    };
    const onRefreshList = async () => {
        getProjectScenes(projectSelected);
    };
    const filteredProjectScenes = useMemo(() => {
        const filterPattern: string = sceneNameFilter.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
        return projectScenes.filter(row => {
            const sceneName: string = row.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
            // console.log(`[Packrat:Debug] sceneName: ${sceneName} | filter: ${filterPattern}`);
            return sceneName.includes(filterPattern);
        });
    }, [projectScenes, sceneNameFilter]);

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
                    <TableContainer component={Paper} elevation={0} style={{ overflow: 'hidden' }}>
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
                                        <Tooltip title={'Will re-publish selected scenes ONLY IF it is already published and Generate Downloads succeeds.'}>
                                            <Typography className={tableClasses.labelText}>Re-Publish Scenes</Typography>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell className={tableClasses.tableCell}>
                                        <Select
                                            id='select_republish_scenes'
                                            value={republishScenes}
                                            onChange={handleRepublishChange}
                                            disableUnderline
                                            className={clsx(tableClasses.select, classes.fieldSizing)}
                                            SelectDisplayProps={{ style: { paddingLeft: '10px', borderRadius: '5px' } }}
                                        >
                                            <MenuItem value='false'>False</MenuItem>
                                            <MenuItem value='true'>True</MenuItem>
                                        </Select>
                                    </TableCell>
                                </TableRow>

                                <TableRow style={{ height: '1rem' }} />

                                <TableRow className={tableClasses.tableRow}>
                                    <TableCell className={clsx(tableClasses.tableCell, classes.fieldLabel)}>
                                        <Tooltip title={'Filters scenes to the selected project. This will reset your selection and what scenes are available in the table below.'}>
                                            <Typography className={tableClasses.labelText}>Filter: Project</Typography>
                                        </Tooltip>
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

                                <TableRow className={tableClasses.tableRow}>
                                    <TableCell className={clsx(tableClasses.tableCell, classes.fieldLabel)}>
                                        <Tooltip title={'Filters the list by any scenes containing the entered text. (Case Insensitive)'}>
                                            <Typography className={tableClasses.labelText}>Filter: Scene Name</Typography>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell className={tableClasses.tableCell}>
                                        <Input
                                            type='text'
                                            value={sceneNameFilter}
                                            onChange={(e)=>setSceneNameFilter(e.target.value)}
                                            placeholder='Search by name'
                                            disableUnderline
                                            className={clsx(tableClasses.select, classes.fieldSizing)}
                                            style={{ width: '300px', paddingLeft: '5px' }}
                                        />
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <SelectScenesTable<SceneSummary>
                        onUpdateSelection={onUpdatedSelection}
                        data={filteredProjectScenes}
                        columns={getColumnHeader()}
                        resetSelection={resetSelection}
                    />

                    <Box style={{ display: 'flex', justifyContent: 'center' }}>
                        <Button
                            className={classes.btn}
                            onClick={onProcessOperation}
                            disableElevation
                            disabled={!isListValid}
                        >
                            Go
                        </Button>
                        <Button
                            className={classes.btn}
                            onClick={onRefreshList}
                            disableElevation
                        >
                            Refresh
                        </Button>
                    </Box>
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
                console.log('[Packrat:ERROR] Admin tools cannot get authenticated user');
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
