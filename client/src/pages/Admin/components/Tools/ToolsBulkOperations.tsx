/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Typography, Button, Select, MenuItem, LinearProgress, Table, TableContainer, TableBody, TableRow, TableCell, Paper, Tooltip, CircularProgress } from '@material-ui/core';
import { CheckCircle, HighlightOff } from '@material-ui/icons';
import { Autocomplete } from '@material-ui/lab';
import clsx from 'clsx';
import { toast } from 'react-toastify';
import { toastError } from '../../../../utils/toastError';
import API, { RequestResponse } from '../../../../api';
import { ColumnHeader, DBReference, useStyles as useToolsStyles } from '../shared/DataTypesStyles';
import { DataTableSelect, DataTableSelectHandle } from '../shared/DataTableSelect';
import { useStyles as useTableStyles } from '../../../Repository/components/DetailsView/DetailsTab/CaptureDataDetails';

// Operations registered in the harness. The label is shown to the user; the key is sent to the
// server, which owns each operation's columns, per-row settings, validation, and apply logic.
const OPERATIONS: { key: string; label: string }[] = [
    { key: 'fixDisplayUnits', label: 'Fix Display Units' },
];
const ALL_PROJECTS = -1;

type OpColumn = { key: string; label: string };
type OpSetting = { key: string; label: string; type: string; options: { value: string; label: string }[] };
type ProjectRef = { idProject: number; Name: string };
type RowStatus = { state?: 'working' | 'success' | 'error'; message?: string };
type Row = DBReference & {
    name_link: string;
    isCandidate: boolean;            // server: does this row need a change (vs already matching)
    settings: Record<string, any>;   // current (possibly edited) per-row settings, sent to apply
    current: Record<string, any>;    // the current value per setting, from the op
    status: RowStatus;               // live run status
    [k: string]: any;                // op-declared rowData columns
};

function ToolsBulkOperations(): React.ReactElement {
    const classes = useToolsStyles();
    const tableClasses = useTableStyles();
    const tableRef = useRef<DataTableSelectHandle<Row>>(null);

    const [operation, setOperation] = useState<string>(OPERATIONS[0].key);
    const [filterMode, setFilterMode] = useState<string>('needsChange');
    const [projects, setProjects] = useState<ProjectRef[]>([]);
    const [idProject, setIdProject] = useState<number>(ALL_PROJECTS);

    const [opColumns, setOpColumns] = useState<OpColumn[]>([]);
    const [rowSettings, setRowSettings] = useState<OpSetting[]>([]);
    const [rows, setRows] = useState<Row[]>([]);
    const [selected, setSelected] = useState<Row[]>([]);

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [running, setRunning] = useState<boolean>(false);
    const [progress, setProgress] = useState<{ done: number; total: number }>({ done: 0, total: 0 });

    // project list, used to scope the candidate sweep (a full sweep reads every scene's SVX)
    useEffect(() => {
        (async () => {
            try {
                const res: RequestResponse = await API.getProjects();
                if (res?.success && Array.isArray(res.data))
                    setProjects(res.data.map((p: any) => ({ idProject: p.idProject, Name: p.Name })));
            } catch (error) {
                console.error('[Packrat:ERROR] bulk ops getProjects:', error);
            }
        })();
    }, []);

    const updateRowSetting = (id: number, key: string, value: any) => {
        setRows(prev => prev.map(row => row.id === id ? { ...row, settings: { ...row.settings, [key]: value } } : row));
    };
    const setRowStatus = (id: number, status: RowStatus) => {
        setRows(prev => prev.map(row => row.id === id ? { ...row, status } : row));
    };

    // status cell: spinner while working, green check on success / no-change, red X (+ error tooltip) on failure
    const renderStatus = (row: Row): React.ReactNode => {
        const st = row.status?.state;
        if (st === 'working') return <CircularProgress size={16} />;
        if (st === 'success') return <CheckCircle style={{ color: '#2e7d32' }} fontSize='small' />;
        if (st === 'error')
            return <Tooltip title={row.status?.message || 'Failed'}><HighlightOff style={{ color: '#c62828' }} fontSize='small' /></Tooltip>;
        if (!row.isCandidate) return <Tooltip title='No change needed'><CheckCircle style={{ color: '#2e7d32' }} fontSize='small' /></Tooltip>;
        return null;
    };

    // inline editor for a per-row setting; dispatch by the setting's declared type so new ops with
    // different (or multiple) fields render without harness changes
    const renderSettingControl = (s: OpSetting, row: Row): React.ReactNode => {
        if (s.type === 'select')
            return (
                <Select
                    value={row.settings[s.key] ?? ''}
                    disabled={running}
                    onChange={(e) => updateRowSetting(row.id, s.key, e.target.value as string)}
                    disableUnderline
                    className={tableClasses.select}
                    SelectDisplayProps={{ style: { paddingLeft: '10px', borderRadius: '5px' } }}
                    style={{ minWidth: 80 }}
                >
                    {s.options.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                </Select>
            );
        return <span>{String(row.settings[s.key] ?? '')}</span>;
    };

    // table columns are derived each render so the inline editors capture the latest state
    const buildColumns = (): ColumnHeader[] => ([
        { key: 'id', label: 'ID', align: 'center' },
        { key: 'name', label: 'Object', align: 'left', link: true },
        ...opColumns.map(c => ({ key: c.key, label: c.label, align: 'center' as const })),
        ...rowSettings.map(s => ({ key: `set_${s.key}`, label: s.label, align: 'center' as const, render: (row: Row) => renderSettingControl(s, row) })),
        { key: 'status', label: 'Status', align: 'center' as const, render: (row: Row) => renderStatus(row) },
    ]);

    const loadCandidates = useCallback(async () => {
        setIsLoading(true);
        setRows([]); setSelected([]); setProgress({ done: 0, total: 0 });
        try {
            // scope to a project's scenes when chosen; otherwise the server sweeps all candidates
            let idSystemObjects: number[] | undefined = undefined;
            if (idProject !== ALL_PROJECTS) {
                const sceneRes: RequestResponse = await API.getProjectScenes(idProject);
                if (!sceneRes?.success) { toastError(sceneRes, 'Failed to load project scenes'); return; }
                idSystemObjects = (sceneRes.data ?? []).map((s: any) => s.id).filter((n: any) => Number.isInteger(n));
            }
            const res: RequestResponse = await API.bulkOperation(operation, 'validate', idSystemObjects ? { idSystemObjects } : {});
            if (!res?.success) { toastError(res, 'Failed to load candidates'); return; }

            const data = res.data ?? {};
            setOpColumns(data.columns ?? []);
            setRowSettings(data.rowSettings ?? []);
            const mapped: Row[] = (data.rows ?? []).map((r: any) => ({
                id: r.id,
                name: r.name ?? `SystemObject ${r.id}`,
                name_link: `/repository/details/${r.id}`,
                ...(r.rowData ?? {}),
                isCandidate: !!r.isCandidate,
                settings: { ...(r.defaultSettings ?? {}) },
                current: { ...(r.current ?? {}) },
                status: {},
            }));
            setRows(mapped);
        } catch (error) {
            console.error('[Packrat:ERROR] bulk validate:', error);
            toast.error('Failed to load candidates');
        } finally {
            setIsLoading(false);
        }
    }, [operation, idProject]);

    // process the selected rows one at a time (one request in flight), updating status + progress live
    const run = useCallback(async () => {
        const ids: number[] = selected.map(s => s.id);
        if (ids.length === 0) { toast.info('Select at least one row'); return; }
        setRunning(true);
        setProgress({ done: 0, total: ids.length });
        let remaining: number[] = [...ids];   // still-selected; successes get removed, failures stay
        let ok = 0, fail = 0;
        for (let i = 0; i < ids.length; i++) {
            const id = ids[i];
            const current = rows.find(r => r.id === id);   // pick up the latest per-row settings
            setRowStatus(id, { state: 'working' });
            try {
                const res: RequestResponse = await API.bulkOperation(operation, 'apply', { idSystemObject: id, rowSettings: current?.settings ?? {} });
                if (res?.success) {
                    ok++;
                    setRowStatus(id, { state: 'success', message: res.message });
                    remaining = remaining.filter(r => r !== id);
                    tableRef.current?.selectByIds(remaining);   // deselect the succeeded row
                } else {
                    fail++;
                    setRowStatus(id, { state: 'error', message: res?.message });
                }
            } catch (err) {
                fail++;
                setRowStatus(id, { state: 'error', message: 'unexpected error' });
                console.error('[Packrat:ERROR] bulk apply:', err);
            }
            setProgress({ done: i + 1, total: ids.length });
        }
        setRunning(false);
        toast.info(`Done: ${ok} succeeded, ${fail} failed`);
    }, [selected, rows, operation]);

    // rows shown for the current filter (already-matching rows are hidden unless "All scenes" is chosen)
    const displayRows: Row[] = filterMode === 'all' ? rows : rows.filter(r => r.isCandidate);

    // export the shown rows (all pages, not just the current table page) to a CSV file
    const exportCSV = () => {
        if (displayRows.length === 0) { toast.info('Nothing to export'); return; }
        const sanitize = (v: any): string => {
            const s = v == null ? '' : String(v);
            const esc = s.replace(/"/g, '""');
            return /[",\n\r]/.test(esc) ? `"${esc}"` : esc;
        };
        const cols: { label: string; value: (r: Row) => any }[] = [
            { label: 'ID', value: (r) => r.id },
            { label: 'Object', value: (r) => r.name },
            ...opColumns.map(c => ({ label: c.label, value: (r: Row) => r[c.key] })),
            ...rowSettings.map(s => ({ label: s.label, value: (r: Row) => r.settings[s.key] })),
            { label: 'Status', value: (r) => {
                if (r.status?.state) return r.status.message ? `${r.status.state}: ${r.status.message}` : r.status.state;
                return r.isCandidate ? 'pending' : 'no change';
            } },
        ];
        const header = cols.map(c => sanitize(c.label)).join(',');
        const body = displayRows.map(r => cols.map(c => sanitize(c.value(r))).join(','));
        const csv = [header, ...body].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `bulk_${operation}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const projectOptions: ProjectRef[] = [{ idProject: ALL_PROJECTS, Name: 'All Projects (slow)' }, ...projects];
    const selectedProject: ProjectRef = projectOptions.find(p => p.idProject === idProject) ?? projectOptions[0];

    return (
        <Box>
            <Typography variant='body1' gutterBottom>
                Run a bulk operation over objects. Pick an operation and (optionally) a project, then
                <b>Load Candidates</b>. Edit any per-row settings inline, select the rows, and
                <b>Submit</b>. Export all candidates to CSV any time. Items are processed one at a time.
            </Typography>

            <TableContainer component={Paper} elevation={0} style={{ overflow: 'hidden', marginTop: '1rem' }}>
                <Table className={tableClasses.table}>
                    <TableBody>
                        <TableRow className={tableClasses.tableRow}>
                            <TableCell className={clsx(tableClasses.tableCell, classes.fieldLabel)}>
                                <Typography className={tableClasses.labelText}>Operation</Typography>
                            </TableCell>
                            <TableCell className={tableClasses.tableCell}>
                                <Select
                                    value={operation}
                                    onChange={(e) => setOperation(e.target.value as string)}
                                    disabled={running || isLoading}
                                    disableUnderline
                                    className={clsx(tableClasses.select, classes.fieldSizing)}
                                    SelectDisplayProps={{ style: { paddingLeft: '10px', borderRadius: '5px' } }}
                                >
                                    {OPERATIONS.map(op => <MenuItem key={op.key} value={op.key}>{op.label}</MenuItem>)}
                                </Select>
                            </TableCell>
                        </TableRow>

                        <TableRow className={tableClasses.tableRow}>
                            <TableCell className={clsx(tableClasses.tableCell, classes.fieldLabel)}>
                                <Typography className={tableClasses.labelText}>Show</Typography>
                            </TableCell>
                            <TableCell className={tableClasses.tableCell}>
                                <Select
                                    value={filterMode}
                                    onChange={(e) => setFilterMode(e.target.value as string)}
                                    disabled={running || isLoading}
                                    disableUnderline
                                    className={clsx(tableClasses.select, classes.fieldSizing)}
                                    SelectDisplayProps={{ style: { paddingLeft: '10px', borderRadius: '5px' } }}
                                >
                                    <MenuItem value='needsChange'>Needs change</MenuItem>
                                    <MenuItem value='all'>All scenes</MenuItem>
                                </Select>
                            </TableCell>
                        </TableRow>

                        <TableRow className={tableClasses.tableRow}>
                            <TableCell className={clsx(tableClasses.tableCell, classes.fieldLabel)}>
                                <Typography className={tableClasses.labelText}>Filter: Project</Typography>
                            </TableCell>
                            <TableCell className={tableClasses.tableCell}>
                                <Autocomplete
                                    id='bulk-ops-project'
                                    options={projectOptions}
                                    value={selectedProject}
                                    getOptionLabel={(option) => option.Name}
                                    getOptionSelected={(option, value) => option.idProject === value.idProject}
                                    onChange={(_e, value) => setIdProject(value ? value.idProject : ALL_PROJECTS)}
                                    disabled={running || isLoading}
                                    disableClearable
                                    size='small'
                                    className={clsx(tableClasses.select, classes.fieldSizing)}
                                    style={{ width: '300px', paddingLeft: '5px' }}
                                    renderInput={(params) => (
                                        <div ref={params.InputProps.ref} style={{ height: '100%' }}>
                                            <input style={{ width: '100%', border: 'none', height: '100%', background: 'none', paddingLeft: '5px' }} type='text' {...params.inputProps} />
                                        </div>
                                    )}
                                />
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>

            <Box style={{ display: 'flex', gap: 8, marginTop: '0.5rem' }}>
                <Button className={classes.btn} onClick={loadCandidates} disableElevation disabled={isLoading || running}>
                    {isLoading ? 'Loading…' : 'Load'}
                </Button>
            </Box>

            <Typography variant='body2' gutterBottom style={{ marginTop: '1rem' }}><b>{displayRows.length}</b> of {rows.length} shown.</Typography>

            <DataTableSelect
                ref={tableRef}
                columns={buildColumns()}
                data={displayRows}
                onUpdateSelection={setSelected}
                isLoading={isLoading}
                selectable
            />

            {(running || progress.total > 0) && (
                <Box mb={1}>
                    <Typography variant='body2'>{progress.done} / {progress.total} processed</Typography>
                    <LinearProgress variant='determinate' value={progress.total ? (progress.done / progress.total) * 100 : 0} />
                </Box>
            )}

            <Box style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                <Button className={classes.btn} onClick={run} disableElevation disabled={running || selected.length === 0}>
                    {running ? 'Running…' : 'Submit'}
                </Button>
                <Button className={classes.btn} onClick={exportCSV} disableElevation disabled={rows.length === 0}>
                    CSV
                </Button>
            </Box>
        </Box>
    );
}

export default ToolsBulkOperations;
