import API, { RequestResponse } from '../../../../api';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Typography, Button, Select, MenuItem, Table, TableContainer, TableCell, TableRow, TableBody, Tooltip, Paper, Input } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import clsx from 'clsx';
import { toast } from 'react-toastify';
import { AssetList, SceneSummary, ColumnHeader, useStyles as useToolsStyles } from '../shared/DataTypesStyles';
import { DataTableSelect } from '../shared/DataTableSelect';

// styles
import { useStyles as useTableStyles } from '../../../Repository/components/DetailsView/DetailsTab/CaptureDataDetails';

const ToolsBatchGeneration = (): React.ReactElement => {
    const classes = useToolsStyles();
    const tableClasses = useTableStyles();

    const [operation, setOperation] = useState<number>(0);
    const [selectedList, setSelectedList] = useState<SceneSummary[]>([]);
    const [isListValid, setIsListValid] = useState<boolean>(false);
    const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
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

            // add 'all' to end of list and store
            const allProject: Project = { idProject: -1, Name: 'All Projects (Expensive!)', Description: 'All projects on Packrat (Expensive!)' };
            const projects: Project[] = [allProject, ...response.data];
            setProjectList(projects);
            // console.log('[Packrat:DEBUG] getProjectList: ',response.data);
        } catch(error) {
            console.error(`[Packrat:ERROR] Unexpected error fetching project list: ${error}`);
        }
    }, []);
    const getProjectScenes = useCallback(async (project?: Project) => {

        // if project is empty (i.e. first run), bail
        if(!project || project?.Name.length===0)
            return;

        try {
            setIsLoadingData(true);

            console.log(`[Packrat] getting scenes for project (${project.Name}) - STARTED`,project);
            const response: RequestResponse = await API.getProjectScenes(project.idProject);
            if(response.success === false) {
                console.log(`[Packrat:ERROR] cannot get project scenes list. (project: ${project.Name} | message: ${response.message})`);
                setProjectScenes([]);
                return;
            }

            // cycle through data converting as needed for convenience
            const { protocol, host } = window.location;
            response.data.forEach(obj => {
                // stored ISO strings to Date objects
                obj.dateCreated = new Date(obj.dateCreated as string);
                obj.dateModified = new Date(obj.dateModified as string);

                // obj.dateGenDownloads = new Date(obj.dateGenDownloads as string);
                obj.datePublished = new Date(obj.datePublished as string);

                // format our capture data and master model dates
                if(obj.sources.captureData.items) {
                    for(let i=0; i<obj.sources.captureData.items.length; i++) {
                        obj.sources.captureData.items[i].dateCreated = new Date(obj.sources.captureData.items[i].dateCreated as string);
                        obj.sources.captureData.items[i].dateModified = new Date(obj.sources.captureData.items[i].dateModified as string);
                    }
                }
                if(obj.sources.models.items) {
                    for(let i=0; i<obj.sources.models.items.length; i++) {
                        obj.sources.models.items[i].dateCreated = new Date(obj.sources.models.items[i].dateCreated as string);
                        obj.sources.models.items[i].dateModified = new Date(obj.sources.models.items[i].dateModified as string);
                    }
                }

                // NOTE: all other dates (e.g. derivatives) are left as strings
                // and needs to be converted prior to use.

                // inject hyperlinks for the scene details page
                // link ties to 'name' field so need to set property to prefix of 'name_'
                obj['name_link'] = `${protocol}//${host}/repository/details/${obj.id}`;
            });

            // console.log('[Packrat:DEBUG] getProjectScenes: ',response.data);
            console.log(`[Packrat] getting scenes for project (${project.Name}) - FINISHED [${response.data.length}]`);
            setIsLoadingData(false);
            setProjectScenes(response.data);
        } catch(error) {
            console.error(`[Packrat:ERROR] Unexpected error fetching project scenes: ${error}`);
        }
    }, []);
    const getColumnHeader = (): ColumnHeader[] => {
        return [
            { key: 'id', label: 'ID', align: 'center', tooltip: 'idSystemObject for the scene' },
            { key: 'name', label: 'Scene', align: 'center', tooltip: 'Name of the scene', link: true },
            { key: 'mediaGroup.name', label: 'Media Group', align: 'center', tooltip: 'What MediaGroup the scene belongs to. Includes the the subtitle (if any).' },
            { key: 'subject.name', label: 'Subject', align: 'center', tooltip: 'The official subject name for the object' },
            { key: 'derivatives.downloads.status', label: 'Downloads', align: 'center', tooltip: 'Are downloads in good standing (GOOD), available but contain errors (ERROR), or are not available (MISSING).' },
            { key: 'publishedState', label: 'Published', align: 'center', tooltip: 'Is the scene published and with what accessibility' },
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

            // make sure we have data and responses
            if(!response.data || !Array.isArray(response.data)) {
                console.log(`[Packrat:ERROR] cannot run ${BatchOperations[operation]}. invalid response data.`,response);
                toast.error(`${BatchOperations[operation]} failed. Got unexpected data from server.`);
                return;
            }

            // get our unique error messages
            const uniqueMessages = Array.from(
                new Set(
                    response.data
                        .filter(response => !response.success && response.message)  // Ensure there is a message
                        .map(response => `${response.id}: ${response.message}`)     // Extract the messages
                )
            );
            const toastErrorMsg: string = (uniqueMessages.length>1) ? 'Check the console.' : uniqueMessages[0];

            // see if we have nuance to the response (i.e. some failed/some passed)
            const allFailed: boolean = response.data.every( response => response.succcess===false );
            if(allFailed===true) {
                const errorMsg: string = (response.data.length>1)
                    ? `All ${response.data.length} scenes failed during ${BatchOperations[operation]} run.`
                    : `${BatchOperations[operation]} cannot run. ${uniqueMessages[0]}`;

                console.log(`[Packrat:ERROR] ${errorMsg}`,response.data);
                toast.error(`${BatchOperations[operation]} failed. (${toastErrorMsg})`);
                return;
            }

            // only some failed so we need to handle this
            const failedCount: number = response.data.filter(response => !response.success).length;
            console.log(`[Packrat:ERROR] ${response.data.length}/${selectedList.length} scenes failed. (${uniqueMessages.join(' |')})`,response.data);
            toast.warn(`${BatchOperations[operation]} had issues. ${failedCount} scenes failed. (${toastErrorMsg})`);

            // we bail early so the selection is maintained on failure
            // TODO: deselect those that were successful.
            return false;
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
    const onExportTableDataToCSV = (): boolean => {
        // Helper function to format date to a string or default 'N/A'
        const formatDate = (date) => date ? new Date(date).toISOString().split('T')[0] : 'N/A';

        // Helper function to handle null or undefined values and return 'N/A' as default
        const handleNull = (value) => value != null ? value : 'N/A';

        // Helper function for cleaning strings for CSV export
        const sanitizeForCSV = (value: string): string => {
            if (typeof value !== 'string') return '';

            // Escape double quotes by doubling them
            const escapedValue = value.replace(/"/g, '""');

            // If the value contains a comma, double quote, newline, or carriage return, wrap it in quotes
            if (/[",\n\r]/.test(escapedValue)) {
                return `"${escapedValue}"`;
            }

            return escapedValue;
        };

        // Helper function to extract date created/modified from scene assets/properties
        const extractDates = (scene: SceneSummary): { dateCreated: Date, dateModified: Date } => {

            // start with scene dates
            let dateCreated: Date = scene.dateCreated;
            let dateModified: Date = scene.dateModified;

            // adjust based on capture data sources
            for(const cd of scene.sources.captureData.items){
                if(cd.dateCreated < dateCreated)
                    dateCreated = cd.dateCreated;
                if(cd.dateModified > dateModified)
                    dateModified = cd.dateModified;
            }

            // adjust based on master model sources
            for(const model of scene.sources.models.items){
                if(model.dateCreated < dateCreated)
                    dateCreated = model.dateCreated;
                if(model.dateModified > dateModified)
                    dateModified = model.dateModified;
            }

            return { dateCreated, dateModified };
        };

        // Helper to get capture data value
        const getCaptureDataValue = (cd: AssetList): string => {
            const status: string = cd.status;
            const count: number = cd.items?.length ?? 0;

            return (status.toLowerCase()==='good') ? `${status} (${count})` : status;
        };

        // Create CSV headers (clean names)
        const headers = [
            'Date Created',
            'Date Modified',
            'Creator',
            'ID',
            'Scene Name',
            'Reviewed',
            'Published',
            // 'Date Published',
            'Downloads',
            'Master Model',
            'AR',
            'Capture Data',
            // 'Project ID',
            'Project',
            // 'Subject ID',
            'Subject',
            // 'Media Group ID',
            'Media Group',
        ];

        // Build CSV rows
        const rows = projectScenes.map(scene => {
            // get first/last dates
            const { dateCreated, dateModified } = extractDates(scene);

            return [
                formatDate(dateCreated),
                formatDate(dateModified),
                handleNull(scene.sources.models?.items?.[0]?.creator?.name),
                handleNull(scene.id),
                handleNull(sanitizeForCSV(scene.name)),
                scene.isReviewed != null ? (scene.isReviewed ? 'Yes' : 'No') : 'N/A',
                handleNull(scene.publishedState),
                // formatDate(scene.datePublished),
                handleNull(scene.derivatives.downloads?.status),
                handleNull(scene.sources.models?.status),
                handleNull(scene.derivatives.ar?.status),
                handleNull(getCaptureDataValue(scene.sources.captureData)),
                // handleNull(scene.project?.id),
                handleNull(sanitizeForCSV(scene.project?.name)),
                // handleNull(scene.subject?.id),
                handleNull(sanitizeForCSV(scene.subject?.name)),
                // handleNull(scene.mediaGroup?.id),
                handleNull(sanitizeForCSV(scene.mediaGroup?.name)),
            ].join(',');  // Join the row values with commas
        });

        // Combine headers and rows into CSV format
        const csvContent = [headers.join(','), ...rows].join('\n');

        // Create a Blob and trigger download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        const fileName = !projectSelected ? 'scene_summaries' : projectSelected?.Name;

        // add our temp link to the DOM, click it, and then return
        link.href = url;
        link.setAttribute('download', `${fileName}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        return true;
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
        <>
            <Box style={{ paddingLeft: '1rem' }}>
                <Typography variant='body2' gutterBottom>
                    This tool allows you to batch download and generate scenes with ease.
                </Typography>
                {/* <Typography variant='body1'>
                    To get started, select your intended project from the dropdown menu. (<strong>Note:</strong> You can only select one project at a time.)
                </Typography>
                <Typography variant='body1' gutterBottom>
                    If needed, you can filter the results by scene name. Once you have made your selections, click the <strong>Submit</strong> button to begin processing. Progress can be monitored in the <strong>Workflow Tab</strong>.
                </Typography> */}
                <Typography variant='body1' color='error' gutterBottom>
                    Please remember, the process is limited to <strong>10 items</strong> at a time to prevent overloading the system.
                </Typography>
            </Box>

            <TableContainer component={Paper} elevation={0} style={{ overflow: 'hidden', marginTop: '2rem' }}>
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
                                <Tooltip title={'Filters scenes to the selected project. This will reset your selection and what scenes are available in the table below. Changing the project will deselect anything currently selected.'}>
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

            <DataTableSelect<SceneSummary>
                onUpdateSelection={onUpdatedSelection}
                data={filteredProjectScenes}
                columns={getColumnHeader()}
                resetSelection={resetSelection}
                isLoading={isLoadingData}
            />

            <Box style={{ display: 'flex', justifyContent: 'center' }}>
                <Button
                    className={classes.btn}
                    onClick={onProcessOperation}
                    disableElevation
                    disabled={!isListValid}
                >
                    Submit
                </Button>
                <Button
                    className={classes.btn}
                    onClick={onRefreshList}
                    disableElevation
                >
                    Refresh
                </Button>
                <Button
                    className={classes.btn}
                    onClick={onExportTableDataToCSV}
                    disableElevation
                    disabled={projectScenes.length===0}
                >
                    CSV
                </Button>
            </Box>
        </>
    );
};

export default ToolsBatchGeneration;