import API, { RequestResponse } from '../../../../api';
import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Select, MenuItem, Table, TableContainer, TableCell, TableRow, TableBody, Paper } from '@material-ui/core';

// styles
import clsx from 'clsx';
import { useStyles as useToolsStyles } from '../shared/DataTypesStyles';
import { useStyles as useTableStyles } from '../../../Repository/components/DetailsView/DetailsTab/CaptureDataDetails';

//#region REPORT SELECTOR
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
                console.log('[Packrat: Error] failed fetching report list: ',err);
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
            .catch((err) => {
                console.log('[Packrat: Error] failed to fetch report: ',err);
            });
    };

    return (
        <Box display='flex' flexDirection='column' alignItems='center'>
            <TableContainer component={Paper} elevation={0} style={{ overflow: 'hidden' }}>
                <Table className={tableClasses.table}>
                    <TableBody>
                        <TableRow className={tableClasses.tableRow}>
                            <TableCell className={clsx(tableClasses.tableCell, classes.fieldLabel)}>
                                <Typography className={tableClasses.labelText}>Asset Reports: </Typography>
                            </TableCell>
                            <TableCell className={tableClasses.tableCell}>
                                <Select
                                    labelId='date-select-label'
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value as string)}
                                    label='Reports'
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
        </Box>
    );
};
//#endregion

//#region VALIDATION UX
const ToolsAssetValidation = (): React.ReactElement => {
    const classes = useToolsStyles();
    const createReport = async (): Promise<void> => {
        const response: RequestResponse = await API.createReport('asset-files');
        console.log('[Packrat] creating asset report...',response);
    };

    // JSX
    return (
        <>
            <Box style={{ paddingLeft: '1rem' }}>
                <Typography variant='body2' gutterBottom>
                    This tool provides asset validation reports. Select the report date you would like and then click on the available formats to download.
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
                    onClick={createReport}
                    disableElevation
                >
                    Create
                </Button>
            </Box>
        </>
    );
};
//#endregion

export default ToolsAssetValidation;