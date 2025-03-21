import API, { RequestResponse } from '../../../../api';

import React, { useState, useEffect } from 'react';
// import { Box, Typography, Button, Select, MenuItem, Table, TableContainer, TableCell, TableRow, TableBody, Tooltip, Paper, Input } from '@material-ui/core';
import { Box, Typography, Button, Select, MenuItem, Table, TableContainer, TableCell, TableRow, TableBody, Paper } from '@material-ui/core';
import clsx from 'clsx';
// import { toast } from 'react-toastify';
import { useStyles as useToolsStyles } from '../shared/DataTypesStyles';
// import { DataTableSelect } from '../shared/DataTableSelect';

// styles
import { useStyles as useTableStyles } from '../../../Repository/components/DetailsView/DetailsTab/CaptureDataDetails';

interface Report {
    date: string,
    format: string,
}
type ReportFormat = 'csv' | 'json';

const ReportSelector: React.FC = () => {
    const classes = useToolsStyles();
    const tableClasses = useTableStyles();

    const [reports, setReports] = useState<Report[]>([]);
    const [dates, setDates] = useState<string[]>([]);
    const [selectedDate, setSelectedDate] = useState<string>('');

    useEffect(() => {
        // Fetch the report list from the API
        API.getReportList('asset-files')
        .then((response) => {
            // Assume response.data.reports is an array of report objects
            const reportList: Report[] = response.data.reports;
            setReports(reportList);

            // Extract unique dates
            const uniqueDates = Array.from(new Set(reportList.map((r) => r.date)));
            // Sort dates from newest to oldest (assuming YYYY-MM-DD format)
            uniqueDates.sort((a, b) => (a < b ? 1 : -1));
            setDates(uniqueDates);

            // Optionally, select the first (newest) date by default
            if (uniqueDates.length > 0) {
            setSelectedDate(uniqueDates[0]);
            }
        })
        .catch((err) => {
            console.error('Error fetching report list', err);
        });
    }, []);

    // Check if a report in the desired format exists for the selected date.
    const isFormatAvailable = (date: string, format: string): boolean => {
        return reports.some(
        (report) => report.date === date && report.format.toLowerCase() === format
        );
    };

    // Handle report request. The default behavior is to trigger a download.
    const handleReportClick = (format: ReportFormat) => {
        // Convert the selected date string to a Date object.
        const dateObj = new Date(selectedDate);
        API.getReport('asset-files',dateObj, format)
        .then((response) => {
            console.log('Report retrieved', response);
        })
        .catch((err) => {
            console.error('Error fetching report', err);
        });
    };

    return (
        <Box display="flex" flexDirection="column" alignItems="center">
            <TableContainer component={Paper} elevation={0} style={{ overflow: 'hidden' }}>
                <Table className={tableClasses.table}>
                    <TableBody>
                        <TableRow className={tableClasses.tableRow}>
                            <TableCell className={clsx(tableClasses.tableCell, classes.fieldLabel)}>
                                <Typography className={tableClasses.labelText}>Asset Reports: </Typography>
                            </TableCell>
                            <TableCell className={tableClasses.tableCell}>
                                <Select
                                    labelId="date-select-label"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value as string)}
                                    label="Reports"
                                    disableUnderline
                                    className={clsx(tableClasses.select, classes.fieldSizing)}
                                    SelectDisplayProps={{ style: { paddingLeft: '10px', borderRadius: '5px' } }}
                                >
                                    {dates.map((date) => (
                                        <MenuItem key={date} value={date}>
                                        {date}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </TableCell>
                            <TableCell className={clsx(tableClasses.tableCell)}>
                                <Button
                                    className={classes.btn}
                                    disableElevation
                                    disabled={!isFormatAvailable(selectedDate, 'csv')}
                                    onClick={() => handleReportClick('csv')}
                                >
                                    CSV
                                </Button>
                                <Button
                                    className={classes.btn}
                                    disableElevation
                                    disabled={!isFormatAvailable(selectedDate, 'json')}
                                    onClick={() => handleReportClick('json')}
                                >
                                    JSON
                                </Button>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>

        {/* <FormControl variant="outlined" size="small">
            <InputLabel id="date-select-label">Select Date</InputLabel>
            <Select
            labelId="date-select-label"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value as string)}
            label="Select Date"
            style={{ minWidth: 150 }}
            >
            {dates.map((date) => (
                <MenuItem key={date} value={date}>
                {date}
                </MenuItem>
            ))}
            </Select>
        </FormControl>

        <Button
            variant="contained"
            color="primary"
            disabled={!isFormatAvailable(selectedDate, 'csv')}
            onClick={() => handleReportClick('csv')}
        >
            CSV
        </Button>

        <Button
            variant="contained"
            color="primary"
            disabled={!isFormatAvailable(selectedDate, 'json')}
            onClick={() => handleReportClick('json')}
        >
            JSON
        </Button> */}
        </Box>
    );
};

const ToolsAssetValidation = (): React.ReactElement => {
    const classes = useToolsStyles();
    // const tableClasses = useTableStyles();

    // const operation = 'asset';
    // const isListValid = false;
    // const [operation, setOperation] = useState<number>(0);
    // const [selectedList, setSelectedList] = useState<ValidationSummary[]>([]);
    // const [isListValid, setIsListValid] = useState<boolean>(false);
    // const [validationResults] = useState<ValidationSummary[]>([]);
    // const [resetSelection, setResetSelection] = useState<boolean>(false);
    // const [resultNameFilter, setResultNameFilter] = useState('');

    // enum ValidationOperations {
    //     ASSETS = 0,
    //     MODELS = 1,
    // }

    // const getServerLink = (): string => {
    //     const { protocol, host } = window.location;
    //     const realHost = host.includes('localhost:3000') ? 'localhost:4000' : (host+'/server');
    //     const result = `${protocol}//${realHost}/api/report/asset-files`;
    //     console.log(result);
    //     return result;
    // };

    const createReport = async (): Promise<void> => {
        const response: RequestResponse = await API.createReport('asset-files');
        console.log('[Packrat] creating asset report...',response);
    }

    // get data
    // const getValidationResults = async () => {
    //     const operationName: string = ValidationOperations[operation].toLocaleLowerCase();

    //     try {
    //         // create a report on asset files and their state
    //         console.log(`[Packrat] validating ${operationName} - STARTED`);
    //         const response: RequestResponse = await API.getReport('asset-files');
    //         if(response.success === false) {
    //             console.log(`[Packrat:ERROR] cannot get validation results. (op: ${operationName} | message: ${response.message})`);
    //             setValidationResults([]);
    //             return;
    //         }

    //         // cycle through data converting as needed
    //         // const { protocol, host } = window.location;
    //         // response.data.forEach(obj => {
    //             // stored ISO strings to Date objects
    //             // obj.dateCreated = new Date(obj.dateCreated as string);

    //             // inject hyperlinks for the scene details page
    //             // link ties to 'name' field so need to set property to prefix of 'name_'
    //             // obj['name_link'] = `${protocol}//${host}/repository/details/${obj.id}`;
    //         // });

    //         console.log(`[Packrat] validation ${operationName} - FINISHED [${response.data.length}]`,response,selectedList);
    //         setValidationResults(response.data);
    //     } catch(error) {
    //         console.error(`[Packrat:ERROR] Unexpected error fetching ${operationName} validation results: ${error}`);
    //     }
    // };
    // const getColumnHeader = (): ColumnHeader[] => {
    //     return [
    //         { key: 'id', label: 'ID', align: 'center', tooltip: 'idSystemObject for the scene' },
    //         { key: 'filename', label: 'File Name', align: 'center', tooltip: 'Asset filename' }, //, link: true },
    //         { key: 'filesize', label: 'File Size', align: 'center', tooltip: 'Size of asset in database' },
    //         { key: 'type', label: 'Type', align: 'center', tooltip: 'What type of asset is it' },
    //         { key: 'version', label: 'Version', align: 'center', tooltip: 'What version are we on' },
    //         { key: 'test_exists', label: 'File Exists', align: 'center', tooltip: 'Can file be found on disk' },
    //         { key: 'test_storage', label: 'Storage Test', align: 'center', tooltip: 'Storage test results' },
    //         { key: 'test_size', label: 'Size Test', align: 'center', tooltip: 'Does DB size match what is on disk' },
    //         // { key: 'mediaGroup.name', label: 'Media Group', align: 'center', tooltip: 'What MediaGroup the scene belongs to. Includes the the subtitle (if any).' },
    //         // { key: 'subject.name', label: 'Subject', align: 'center', tooltip: 'The official subject name for the object' },
    //         // { key: 'publishedState', label: 'Published', align: 'center', tooltip: 'Is the scene published and with what accessibility' },
    //         // { key: 'datePublished', label: 'Published (Date)', align: 'center' },
    //     ];
    // };

    // handle changes
    // const handleOperationChange = (event) => {
    //     setOperation(event.target.value);

    //     // TODO: invalidate the results (if any)
    // };
    // const onProcessOperation = async () => {
    //     const opName: string = ValidationOperations[operation].toLocaleLowerCase();
    //     console.log(`[Packrat] pulling ${opName} validation report. this may take awhile...`);

    //     // make request to get report/job id so it can be polled
    //     // await getValidationResults();

    //     // cycle through pulling latest report, updating the progress bar, etc.

    //     // clear selection on succcess
    //     onResetSelection();

    //     // notify the user/log
    //     toast.success('Pulled validation report.');
    //     console.log(`[Packrat] Pulled ${opName} validation report`,validationResults);
    //     return;
    // };
    // const onUpdatedSelection = (selection) => {
    //     setSelectedList(selection);
    //     setIsListValid(selection.length>0);
    // };
    // const onResetSelection = () => {
    //     // quickly signal we want to reset the list and then set the value back to false
    //     // setResetSelection(true);
    //     // setTimeout(() => setResetSelection(false), 1); // set flag back so it doesn't keep resetting it
    // };
    // const onExportTableDataToCSV = (): boolean => {
    //     // Helper function to format date to a string or default 'N/A'
    //     // const formatDate = (date) => date ? new Date(date).toISOString().split('T')[0] : 'N/A';

    //     // Helper function to handle null or undefined values and return 'N/A' as default
    //     const handleNull = (value) => value != null ? value : 'N/A';

    //     // Helper function for cleaning strings for CSV export
    //     const sanitizeForCSV = (value: string): string => {
    //         if (typeof value !== 'string') return '';

    //         // Escape double quotes by doubling them
    //         const escapedValue = value.replace(/"/g, '""');

    //         // If the value contains a comma, double quote, newline, or carriage return, wrap it in quotes
    //         if (/[",\n\r]/.test(escapedValue)) {
    //             return `"${escapedValue}"`;
    //         }

    //         return escapedValue;
    //     };

    //     // Create CSV headers (clean names)
    //     const headers = [
    //         // 'Date Created',
    //         // 'Creator',
    //         'ID',
    //         'Name',
    //         // 'Reviewed',
    //         // 'Published',
    //         // 'Date Published',
    //         // 'Downloads',
    //         // 'Master Model',
    //         // 'AR',
    //         // 'Capture Data',
    //         // 'Project ID',
    //         // 'Project',
    //         // 'Subject ID',
    //         // 'Subject',
    //         // 'Media Group ID',
    //         // 'Media Group',
    //     ];

    //     // Build CSV rows
    //     const rows = validationResults.map(asset => {
    //         return [
    //             // formatDate(scene.dateCreated),
    //             // handleNull(scene.sources.models?.items?.[0]?.creator?.name),
    //             handleNull(asset.id),
    //             handleNull(sanitizeForCSV(asset.name)),
    //             // scene.isReviewed != null ? (scene.isReviewed ? 'Yes' : 'No') : 'N/A',
    //             // handleNull(scene.publishedState),
    //             // formatDate(scene.datePublished),
    //             // handleNull(scene.derivatives.downloads?.status),
    //             // handleNull(scene.sources.models?.status),
    //             // handleNull(scene.derivatives.ar?.status),
    //             // handleNull(scene.sources.captureData?.status),
    //             // handleNull(scene.project?.id),
    //             // handleNull(sanitizeForCSV(scene.project?.name)),
    //             // handleNull(scene.subject?.id),
    //             // handleNull(sanitizeForCSV(scene.subject?.name)),
    //             // handleNull(scene.mediaGroup?.id),
    //             // handleNull(sanitizeForCSV(scene.mediaGroup?.name)),
    //         ].join(',');  // Join the row values with commas
    //     });

    //     // Combine headers and rows into CSV format
    //     const csvContent = [headers.join(','), ...rows].join('\n');

    //     // Create a Blob and trigger download
    //     const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    //     const link = document.createElement('a');
    //     const url = URL.createObjectURL(blob);
    //     const fileName = `${ValidationOperations[operation].toLocaleLowerCase()}_validation_results`; // TODO: attach date to end

    //     // add our temp link to the DOM, click it, and then return
    //     link.href = url;
    //     link.setAttribute('download', `${fileName}.csv`);
    //     document.body.appendChild(link);
    //     link.click();
    //     document.body.removeChild(link);

    //     return true;
    // };
    // const filteredValidationResults = useMemo(() => {
    //     const filterPattern: string = resultNameFilter.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    //     return validationResults.filter(row => {
    //         const sceneName: string = row.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    //         // console.log(`[Packrat:Debug] sceneName: ${sceneName} | filter: ${filterPattern}`);
    //         return sceneName.includes(filterPattern);
    //     });
    // }, [validationResults, resultNameFilter]);

    // JSX
    return (
        <>
            <Box style={{ paddingLeft: '1rem' }}>
                <Typography variant='body2' gutterBottom>
                    This tool provides validation reports for different aspects of the system. Select the report date you would like and then click on the available formats to download.
                </Typography>
            </Box>

            <Box style={{ paddingLeft: '1rem' }}>
                <ReportSelector />
            </Box>

            <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem', marginTop: '2rem' }}>
                <Typography variant='body2' gutterBottom color='error'>
                    The button below will create a report for today. <b>This is expensive</b> and may take several hours to complete. When done it will show in the dropdown list above.
                </Typography>

                <Button
                    className={classes.btn}
                    onClick={createReport} //() => window.open(getServerLink(), '_blank')}
                    disableElevation
                >
                    Create
                </Button>
            </Box>
        </>
    );
};

export default ToolsAssetValidation;