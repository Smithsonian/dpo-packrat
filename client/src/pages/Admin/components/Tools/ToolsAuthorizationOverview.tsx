import API, { RequestResponse } from '../../../../api';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Typography, Button, Table, TableContainer, TableCell, TableRow, TableBody, Tooltip, Paper, Divider } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import clsx from 'clsx';
import { toast } from 'react-toastify';
import { DBReference, ColumnHeader, useStyles as useToolsStyles } from '../shared/DataTypesStyles';
import { DataTableSelect } from '../shared/DataTableSelect';

// styles
import { useStyles as useTableStyles } from '../../../Repository/components/DetailsView/DetailsTab/CaptureDataDetails';

// -------------------------------------------------------------------
// Types
// -------------------------------------------------------------------
type RawSummaryRow = {
    idUnit: number;
    UnitName: string;
    UnitAbbreviation: string | null;
    idProject: number;
    ProjectName: string;
    isRestricted: boolean;
    idUser: number | null;
    UserName: string | null;
    EmailAddress: string | null;
};

type GroupedProject = DBReference & {
    idUnit: number;
    unitName: string;
    isRestricted: boolean;
    authorizedUsers: string;
    userCount: number;
};

type DenialRow = DBReference & {
    auditDate: string;
    userName: string;
    email: string;
    details: string;
};

type UnitOption = { idUnit: number; name: string };
type UserOption = { idUser: number; name: string };

// -------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------
const sanitizeForCSV = (value: string): string => {
    if (typeof value !== 'string') return '';
    const escapedValue = value.replace(/"/g, '""');
    if (/[",\n\r]/.test(escapedValue)) {
        return `"${escapedValue}"`;
    }
    return escapedValue;
};

const formatDateISO = (d: Date): string => d.toISOString().split('T')[0];

const defaultStartDate = (): string => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return formatDateISO(d);
};
const defaultEndDate = (): string => formatDateISO(new Date());

// -------------------------------------------------------------------
// Component
// -------------------------------------------------------------------
const ToolsAuthorizationOverview = (): React.ReactElement => {
    const classes = useToolsStyles();
    const tableClasses = useTableStyles();

    // Summary state
    const [rawRows, setRawRows] = useState<RawSummaryRow[]>([]);
    const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(false);
    const [unitFilter, setUnitFilter] = useState<UnitOption | null>(null);
    const [userFilter, setUserFilter] = useState<UserOption | null>(null);

    // Denial state
    const [denialRows, setDenialRows] = useState<DenialRow[]>([]);
    const [isLoadingDenials, setIsLoadingDenials] = useState<boolean>(false);
    const [startDate, setStartDate] = useState<string>(defaultStartDate());
    const [endDate, setEndDate] = useState<string>(defaultEndDate());

    // -------------------------------------------------------------------
    // Summary data
    // -------------------------------------------------------------------
    const fetchSummary = useCallback(async () => {
        try {
            setIsLoadingSummary(true);
            const response: RequestResponse = await API.getAuthSummary();
            if (!response.success) {
                toast.error(`Failed to load auth summary: ${response.message ?? 'unknown error'}`);
                setRawRows([]);
                return;
            }
            setRawRows(response.data ?? []);
        } catch (error) {
            console.error('[Packrat:ERROR] fetchAuthSummary:', error);
            toast.error('Unexpected error loading auth summary');
        } finally {
            setIsLoadingSummary(false);
        }
    }, []);

    // Extract unique units & users for filter dropdowns
    const unitOptions = useMemo<UnitOption[]>(() => {
        const map = new Map<number, string>();
        for (const r of rawRows) {
            if (!map.has(r.idUnit))
                map.set(r.idUnit, r.UnitName);
        }
        return Array.from(map, ([idUnit, name]) => ({ idUnit, name })).sort((a, b) => a.name.localeCompare(b.name));
    }, [rawRows]);

    const userOptions = useMemo<UserOption[]>(() => {
        const map = new Map<number, string>();
        for (const r of rawRows) {
            if (r.idUser && r.UserName && !map.has(r.idUser))
                map.set(r.idUser, r.UserName);
        }
        return Array.from(map, ([idUser, name]) => ({ idUser, name })).sort((a, b) => a.name.localeCompare(b.name));
    }, [rawRows]);

    // Group by project, applying filters
    const groupedProjects = useMemo<GroupedProject[]>(() => {
        // Pre-filter raw rows
        let filtered = rawRows;
        if (unitFilter)
            filtered = filtered.filter(r => r.idUnit === unitFilter.idUnit);
        if (userFilter)
            filtered = filtered.filter(r => r.idUser === userFilter.idUser);

        // Group by idProject
        const projectMap = new Map<number, { row: RawSummaryRow; users: string[] }>();
        for (const r of filtered) {
            if (!projectMap.has(r.idProject)) {
                projectMap.set(r.idProject, { row: r, users: [] });
            }
            const entry = projectMap.get(r.idProject);
            if (!entry) continue;
            if (r.UserName && !entry.users.includes(r.UserName))
                entry.users.push(r.UserName);
        }

        return Array.from(projectMap.values()).map(({ row, users }) => ({
            id: row.idProject,
            name: row.ProjectName,
            idUnit: row.idUnit,
            unitName: row.UnitName,
            isRestricted: row.isRestricted,
            authorizedUsers: users.sort().join(', ') || '(none)',
            userCount: users.length,
        }));
    }, [rawRows, unitFilter, userFilter]);

    // Summary columns
    const summaryColumns: ColumnHeader[] = [
        { key: 'id', label: 'Project ID', align: 'center' },
        { key: 'unitName', label: 'Unit', align: 'center' },
        { key: 'name', label: 'Project', align: 'center' },
        { key: 'isRestricted', label: 'Restricted', align: 'center' },
        { key: 'authorizedUsers', label: 'Authorized Users', align: 'left' },
        { key: 'userCount', label: '# Users', align: 'center' },
    ];

    // -------------------------------------------------------------------
    // Denial data
    // -------------------------------------------------------------------
    const fetchDenials = useCallback(async () => {
        if (!startDate || !endDate) {
            toast.warn('Please select both start and end dates');
            return;
        }
        try {
            setIsLoadingDenials(true);
            const response: RequestResponse = await API.getAuthDenials(startDate, endDate);
            if (!response.success) {
                toast.error(`Failed to load denials: ${response.message ?? 'unknown error'}`);
                setDenialRows([]);
                return;
            }
            const rows: DenialRow[] = (response.data ?? []).map((r: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                let details = r.Data ?? '';
                try { details = JSON.stringify(JSON.parse(details), null, 0); } catch { /* use raw */ }
                return {
                    id: r.idAudit,
                    name: r.UserName ?? '(unknown)',
                    auditDate: r.AuditDate ? new Date(r.AuditDate).toLocaleString() : '',
                    userName: r.UserName ?? '(unknown)',
                    email: r.EmailAddress ?? '',
                    details,
                };
            });
            setDenialRows(rows);
        } catch (error) {
            console.error('[Packrat:ERROR] fetchAuthDenials:', error);
            toast.error('Unexpected error loading denials');
        } finally {
            setIsLoadingDenials(false);
        }
    }, [startDate, endDate]);

    // Denial columns
    const denialColumns: ColumnHeader[] = [
        { key: 'id', label: 'Audit ID', align: 'center' },
        { key: 'auditDate', label: 'Date', align: 'center' },
        { key: 'userName', label: 'User', align: 'center' },
        { key: 'email', label: 'Email', align: 'center' },
        { key: 'details', label: 'Details', align: 'left' },
    ];

    // -------------------------------------------------------------------
    // CSV export helpers
    // -------------------------------------------------------------------
    const exportSummaryCSV = () => {
        const headers = ['Project ID', 'Unit', 'Project', 'Restricted', 'Authorized Users', '# Users'];
        const rows = groupedProjects.map(p =>
            [p.id, sanitizeForCSV(p.unitName), sanitizeForCSV(p.name), p.isRestricted ? 'Yes' : 'No', sanitizeForCSV(p.authorizedUsers), p.userCount].join(',')
        );
        const csv = [headers.join(','), ...rows].join('\n');
        downloadCSV(csv, 'auth_summary.csv');
    };

    const exportDenialsCSV = () => {
        const headers = ['Audit ID', 'Date', 'User', 'Email', 'Details'];
        const rows = denialRows.map(d =>
            [d.id, sanitizeForCSV(d.auditDate), sanitizeForCSV(d.userName), sanitizeForCSV(d.email), sanitizeForCSV(d.details)].join(',')
        );
        const csv = [headers.join(','), ...rows].join('\n');
        downloadCSV(csv, 'auth_denials.csv');
    };

    const downloadCSV = (csvContent: string, fileName: string) => {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // -------------------------------------------------------------------
    // Mount
    // -------------------------------------------------------------------
    useEffect(() => { fetchSummary(); }, [fetchSummary]);

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const noop = useCallback(() => {}, []);

    // -------------------------------------------------------------------
    // JSX
    // -------------------------------------------------------------------
    return (
        <>
            <Box style={{ paddingLeft: '1rem' }}>
                <Typography variant='body2' gutterBottom>
                    Consolidated view of project authorization. Shows which users have access to each project, based on unit membership (unrestricted) or explicit grants (restricted).
                </Typography>
            </Box>

            {/* Filters */}
            <TableContainer component={Paper} elevation={0} style={{ overflow: 'hidden', marginTop: '1rem' }}>
                <Table className={tableClasses.table}>
                    <TableBody>
                        <TableRow className={tableClasses.tableRow}>
                            <TableCell className={clsx(tableClasses.tableCell, classes.fieldLabel)}>
                                <Tooltip title='Filter the table to a specific unit'>
                                    <Typography className={tableClasses.labelText}>Filter: Unit</Typography>
                                </Tooltip>
                            </TableCell>
                            <TableCell className={tableClasses.tableCell}>
                                <Autocomplete
                                    id='auth-unit-filter'
                                    options={unitOptions}
                                    getOptionLabel={(o) => o.name}
                                    value={unitFilter}
                                    onChange={(_e, v) => setUnitFilter(v)}
                                    size='small'
                                    className={clsx(tableClasses.select, classes.fieldSizing)}
                                    style={{ width: '300px', paddingLeft: '5px' }}
                                    getOptionSelected={(o, v) => o.idUnit === v.idUnit}
                                    renderInput={(params) =>
                                        <div ref={params.InputProps.ref} style={{ height: '100%' }}>
                                            <input style={{ width: '100%', border: 'none', height: '100%', background: 'none', paddingLeft: '5px' }} type='text' {...params.inputProps} placeholder='All units' />
                                        </div>
                                    }
                                />
                            </TableCell>
                        </TableRow>
                        <TableRow className={tableClasses.tableRow}>
                            <TableCell className={clsx(tableClasses.tableCell, classes.fieldLabel)}>
                                <Tooltip title='Filter the table to projects accessible by a specific user'>
                                    <Typography className={tableClasses.labelText}>Filter: User</Typography>
                                </Tooltip>
                            </TableCell>
                            <TableCell className={tableClasses.tableCell}>
                                <Autocomplete
                                    id='auth-user-filter'
                                    options={userOptions}
                                    getOptionLabel={(o) => o.name}
                                    value={userFilter}
                                    onChange={(_e, v) => setUserFilter(v)}
                                    size='small'
                                    className={clsx(tableClasses.select, classes.fieldSizing)}
                                    style={{ width: '300px', paddingLeft: '5px' }}
                                    getOptionSelected={(o, v) => o.idUser === v.idUser}
                                    renderInput={(params) =>
                                        <div ref={params.InputProps.ref} style={{ height: '100%' }}>
                                            <input style={{ width: '100%', border: 'none', height: '100%', background: 'none', paddingLeft: '5px' }} type='text' {...params.inputProps} placeholder='All users' />
                                        </div>
                                    }
                                />
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Summary Table */}
            <DataTableSelect<GroupedProject>
                onUpdateSelection={noop}
                data={groupedProjects}
                columns={summaryColumns}
                isLoading={isLoadingSummary}
                selectable={false}
            />
            <Box style={{ display: 'flex', justifyContent: 'center' }}>
                <Button className={classes.btn} onClick={fetchSummary} disableElevation>
                    Refresh
                </Button>
                <Button className={classes.btn} onClick={exportSummaryCSV} disableElevation disabled={groupedProjects.length === 0}>
                    CSV
                </Button>
            </Box>

            {/* Divider */}
            <Divider style={{ margin: '1.5rem 0' }} />

            {/* Denials Section */}
            <Box style={{ paddingLeft: '1rem' }}>
                <Typography variant='subtitle1' gutterBottom><strong>Recent Denials</strong></Typography>
            </Box>
            <TableContainer component={Paper} elevation={0} style={{ overflow: 'hidden', marginTop: '0.5rem' }}>
                <Table className={tableClasses.table}>
                    <TableBody>
                        <TableRow className={tableClasses.tableRow}>
                            <TableCell className={clsx(tableClasses.tableCell, classes.fieldLabel)}>
                                <Typography className={tableClasses.labelText}>Start Date</Typography>
                            </TableCell>
                            <TableCell className={tableClasses.tableCell}>
                                <input type='date' value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '4px 8px' }} />
                            </TableCell>
                        </TableRow>
                        <TableRow className={tableClasses.tableRow}>
                            <TableCell className={clsx(tableClasses.tableCell, classes.fieldLabel)}>
                                <Typography className={tableClasses.labelText}>End Date</Typography>
                            </TableCell>
                            <TableCell className={tableClasses.tableCell}>
                                <input type='date' value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '4px 8px' }} />
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Denials Table */}
            <DataTableSelect<DenialRow>
                onUpdateSelection={noop}
                data={denialRows}
                columns={denialColumns}
                isLoading={isLoadingDenials}
                selectable={false}
            />
            <Box style={{ display: 'flex', justifyContent: 'center' }}>
                <Button className={classes.btn} onClick={fetchDenials} disableElevation>
                    Fetch
                </Button>
                <Button className={classes.btn} onClick={exportDenialsCSV} disableElevation disabled={denialRows.length === 0}>
                    CSV
                </Button>
            </Box>
        </>
    );
};

export default ToolsAuthorizationOverview;
