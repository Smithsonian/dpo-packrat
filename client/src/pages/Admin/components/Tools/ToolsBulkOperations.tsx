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

// Fallback op catalog if the server 'list' call is unavailable; the server registry is authoritative.
const FALLBACK_OPERATIONS: { key: string; label: string }[] = [
    { key: 'fixDisplayUnits', label: 'Fix Display Units' },
    { key: 'syncFromEDAN', label: 'Sync from EDAN' },
];
const ALL_PROJECTS = -1;

type OpColumn = { key: string; label: string };
type OpSetting = { key: string; label: string; type: string; options: { value: string; label: string }[] };
type OpParam = { key: string; label: string; type: string; options: { value: string; label: string }[]; default?: string };
type ProjectRef = { idProject: number; Name: string };
type RowStatus = { state?: 'working' | 'success' | 'error'; message?: string };
type Row = DBReference & {
    name_link: string;
    isCandidate: boolean;            // server: does this row have a change to apply (vs already in sync / no change)
    settings: Record<string, any>;   // current (possibly edited) per-row settings, sent to apply
    current: Record<string, any>;    // the current value per setting, from the op
    status: RowStatus;               // live run status
    [k: string]: any;                // op-declared rowData columns
};

function ToolsBulkOperations(): React.ReactElement {
    const classes = useToolsStyles();
    const tableClasses = useTableStyles();
    const tableRef = useRef<DataTableSelectHandle<Row>>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const [operations, setOperations] = useState<{ key: string; label: string }[]>(FALLBACK_OPERATIONS);
    const [operation, setOperation] = useState<string>(FALLBACK_OPERATIONS[0].key);
    const [filterMode, setFilterMode] = useState<string>('needsChange');
    const [nameFilter, setNameFilter] = useState<string>('');
    const [projects, setProjects] = useState<ProjectRef[]>([]);
    const [idProject, setIdProject] = useState<number>(ALL_PROJECTS);

    const [opColumns, setOpColumns] = useState<OpColumn[]>([]);
    const [rowSettings, setRowSettings] = useState<OpSetting[]>([]);
    const [opParams, setOpParams] = useState<OpParam[]>([]);
    const [paramValues, setParamValues] = useState<Record<string, string>>({});
    const [rows, setRows] = useState<Row[]>([]);
    const [selected, setSelected] = useState<Row[]>([]);

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [gather, setGather] = useState<{ processed: number; total: number }>({ processed: 0, total: 0 });
    const [running, setRunning] = useState<boolean>(false);
    const [progress, setProgress] = useState<{ done: number; total: number }>({ done: 0, total: 0 });

    const stopPolling = useCallback(() => {
        if (pollRef.current !== null) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
    }, []);

    // catalog of registered ops (from the server; falls back to the static list)
    useEffect(() => {
        (async () => {
            try {
                const res: RequestResponse = await API.bulkOperation('', 'list');
                if (res?.success && Array.isArray(res.data?.operations) && res.data.operations.length > 0)
                    setOperations(res.data.operations);
            } catch (error) {
                console.error('[Packrat:ERROR] bulk ops list:', error);
            }
        })();
    }, []);

    // project list, used to scope scene-based sweeps
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

    // describe the selected op → its columns, per-row settings, and pre-run params
    useEffect(() => {
        (async () => {
            setRows([]); setSelected([]); setGather({ processed: 0, total: 0 }); setProgress({ done: 0, total: 0 });
            try {
                const res: RequestResponse = await API.bulkOperation(operation, 'describe');
                if (!res?.success) return;
                const data = res.data ?? {};
                setOpColumns(data.columns ?? []);
                setRowSettings(data.rowSettings ?? []);
                const params: OpParam[] = data.params ?? [];
                setOpParams(params);
                const defaults: Record<string, string> = {};
                params.forEach(p => { defaults[p.key] = p.default ?? (p.options[0]?.value ?? ''); });
                setParamValues(defaults);
            } catch (error) {
                console.error('[Packrat:ERROR] bulk describe:', error);
            }
        })();
    }, [operation]);

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
        if (!row.isCandidate) return <Tooltip title='No change'><CheckCircle style={{ color: '#2e7d32' }} fontSize='small' /></Tooltip>;
        return null;
    };

    // inline editor for a per-row setting; dispatch by declared type so new ops render without harness changes
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

    // table columns derived each render so the inline editors capture the latest state
    const buildColumns = (): ColumnHeader[] => ([
        { key: 'id', label: 'ID', align: 'center' },
        { key: 'name', label: 'Object', align: 'left', link: true },
        ...opColumns.map(c => ({ key: c.key, label: c.label, align: 'center' as const })),
        ...rowSettings.map(s => ({ key: `set_${s.key}`, label: s.label, align: 'center' as const, render: (row: Row) => renderSettingControl(s, row) })),
        { key: 'status', label: 'Status', align: 'center' as const, render: (row: Row) => renderStatus(row) },
    ]);

    const mapRows = (data: any): Row[] => (data.rows ?? []).map((r: any) => ({
        id: r.id,
        name: r.name ?? `SystemObject ${r.id}`,
        name_link: `/repository/details/${r.id}`,
        ...(r.rowData ?? {}),
        isCandidate: !!r.isCandidate,
        settings: { ...(r.defaultSettings ?? {}) },
        current: { ...(r.current ?? {}) },
        status: {},
    }));

    const loadResults = useCallback(async () => {
        try {
            const res: RequestResponse = await API.bulkOperation(operation, 'results');
            if (!res?.success) { toastError(res, 'Failed to load results'); return; }
            const data = res.data ?? {};
            if (Array.isArray(data.columns)) setOpColumns(data.columns);
            if (Array.isArray(data.rowSettings)) setRowSettings(data.rowSettings);
            setRows(mapRows(data));
        } catch (error) {
            console.error('[Packrat:ERROR] bulk results:', error);
            toast.error('Failed to load results');
        }
    }, [operation]);

    const pollStatus = useCallback(async () => {
        try {
            const res: RequestResponse = await API.bulkOperation(operation, 'status');
            if (!res?.success) return;
            const p = res.data?.progress ?? {};
            setGather({ processed: p.processed ?? 0, total: p.total ?? 0 });
            if (p.phase === 'completed') {
                stopPolling();
                await loadResults();
                setIsLoading(false);
            } else if (p.phase === 'error') {
                stopPolling();
                setIsLoading(false);
                toastError({ message: p.error, traceId: res.traceId }, 'Gather failed');
            } else if (p.phase === 'idle') {
                stopPolling();
                setIsLoading(false);
            }
        } catch (error) {
            console.error('[Packrat:ERROR] bulk status:', error);
        }
    }, [operation, stopPolling, loadResults]);

    const startPolling = useCallback(() => {
        stopPolling();
        pollRef.current = setInterval(pollStatus, 3000);
    }, [stopPolling, pollStatus]);

    useEffect(() => stopPolling, [stopPolling]);

    // start the async gather job for the selected op + params, then poll to completion
    const loadCandidates = useCallback(async () => {
        setIsLoading(true);
        setRows([]); setSelected([]); setGather({ processed: 0, total: 0 }); setProgress({ done: 0, total: 0 });
        try {
            let idSystemObjects: number[] | undefined = undefined;
            if (idProject !== ALL_PROJECTS) {
                const sceneRes: RequestResponse = await API.getProjectScenes(idProject);
                if (!sceneRes?.success) { toastError(sceneRes, 'Failed to load project scenes'); setIsLoading(false); return; }
                idSystemObjects = (sceneRes.data ?? []).map((s: any) => s.id).filter((n: any) => Number.isInteger(n));
            }
            const res: RequestResponse = await API.bulkOperation(operation, 'start', { params: paramValues, ...(idSystemObjects ? { idSystemObjects } : {}) });
            if (!res?.success) { toastError(res, 'Failed to start gather'); setIsLoading(false); return; }
            startPolling();
        } catch (error) {
            console.error('[Packrat:ERROR] bulk start:', error);
            toast.error('Failed to start gather');
            setIsLoading(false);
        }
    }, [operation, idProject, paramValues, startPolling]);

    // process the selected rows one at a time (one request in flight), updating status + progress live
    const run = useCallback(async () => {
        const ids: number[] = selected.map(s => s.id);
        if (ids.length === 0) { toast.info('Select at least one row'); return; }
        setRunning(true);
        setProgress({ done: 0, total: ids.length });
        let remaining: number[] = [...ids];
        let ok = 0, fail = 0;
        for (let i = 0; i < ids.length; i++) {
            const id = ids[i];
            const current = rows.find(r => r.id === id);
            setRowStatus(id, { state: 'working' });
            try {
                const res: RequestResponse = await API.bulkOperation(operation, 'apply', { idSystemObject: id, rowSettings: current?.settings ?? {}, params: paramValues });
                if (res?.success) {
                    ok++;
                    // Merge any op-returned column values (e.g. the new current units) into the row so the
                    // table reflects the change immediately, alongside the success status.
                    const patch = res.data?.rowData ?? {};
                    setRows(prev => prev.map(row => row.id === id
                        ? { ...row, ...patch, status: { state: 'success', message: res.message } }
                        : row));
                    remaining = remaining.filter(r => r !== id);
                    tableRef.current?.selectByIds(remaining);
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
    }, [selected, rows, operation, paramValues]);

    // rows shown for the current filter (non-candidate rows hidden unless "All" is chosen), then narrowed
    // by a case-insensitive substring match on the object name.
    const candidateRows: Row[] = filterMode === 'all' ? rows : rows.filter(r => r.isCandidate);
    const nameNeedle: string = nameFilter.trim().toLowerCase();
    const displayRows: Row[] = nameNeedle
        ? candidateRows.filter(r => String(r.name ?? '').toLowerCase().includes(nameNeedle))
        : candidateRows;

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
    const busy: boolean = isLoading || running;

    return (
        <Box>
            <Typography variant='body1' gutterBottom>
                Run a bulk operation over objects. Pick an operation, set any options, then <b>Load</b>.
                Review the rows (each op defines its own columns), edit per-row settings inline, select
                the rows, and <b>Submit</b>. Nothing is changed until you submit. Items apply one at a time.
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
                                    disabled={busy}
                                    disableUnderline
                                    className={clsx(tableClasses.select, classes.fieldSizing)}
                                    SelectDisplayProps={{ style: { paddingLeft: '10px', borderRadius: '5px' } }}
                                >
                                    {operations.map(op => <MenuItem key={op.key} value={op.key}>{op.label}</MenuItem>)}
                                </Select>
                            </TableCell>
                        </TableRow>

                        {opParams.map(p => (
                            <TableRow key={p.key} className={tableClasses.tableRow}>
                                <TableCell className={clsx(tableClasses.tableCell, classes.fieldLabel)}>
                                    <Typography className={tableClasses.labelText}>{p.label}</Typography>
                                </TableCell>
                                <TableCell className={tableClasses.tableCell}>
                                    <Select
                                        value={paramValues[p.key] ?? ''}
                                        onChange={(e) => setParamValues(prev => ({ ...prev, [p.key]: e.target.value as string }))}
                                        disabled={busy}
                                        disableUnderline
                                        className={clsx(tableClasses.select, classes.fieldSizing)}
                                        SelectDisplayProps={{ style: { paddingLeft: '10px', borderRadius: '5px' } }}
                                    >
                                        {p.options.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                                    </Select>
                                </TableCell>
                            </TableRow>
                        ))}

                        <TableRow className={tableClasses.tableRow}>
                            <TableCell className={clsx(tableClasses.tableCell, classes.fieldLabel)}>
                                <Typography className={tableClasses.labelText}>Show</Typography>
                            </TableCell>
                            <TableCell className={tableClasses.tableCell}>
                                <Select
                                    value={filterMode}
                                    onChange={(e) => setFilterMode(e.target.value as string)}
                                    disabled={busy}
                                    disableUnderline
                                    className={clsx(tableClasses.select, classes.fieldSizing)}
                                    SelectDisplayProps={{ style: { paddingLeft: '10px', borderRadius: '5px' } }}
                                >
                                    <MenuItem value='needsChange'>Needs change</MenuItem>
                                    <MenuItem value='all'>All</MenuItem>
                                </Select>
                            </TableCell>
                        </TableRow>

                        <TableRow className={tableClasses.tableRow}>
                            <TableCell className={clsx(tableClasses.tableCell, classes.fieldLabel)}>
                                <Typography className={tableClasses.labelText}>Filter: Name</Typography>
                            </TableCell>
                            <TableCell className={tableClasses.tableCell}>
                                <div className={clsx(tableClasses.select, classes.fieldSizing)} style={{ width: '300px', paddingLeft: '5px' }}>
                                    <input
                                        type='text'
                                        value={nameFilter}
                                        onChange={(e) => setNameFilter(e.target.value)}
                                        placeholder='Filter by object name'
                                        style={{ width: '100%', border: 'none', height: '100%', background: 'none', paddingLeft: '5px' }}
                                    />
                                </div>
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
                                    disabled={busy}
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
                <Button className={busy ? classes.btnDisabled : classes.btn} onClick={loadCandidates} disableElevation disabled={busy}>
                    {isLoading ? 'Loading…' : 'Load'}
                </Button>
            </Box>

            {isLoading && (
                <Box mb={1} mt={1} style={{ maxWidth: 400 }}>
                    <Typography variant='body2'>Gathering: {gather.processed} / {gather.total}</Typography>
                    <LinearProgress variant={gather.total > 0 ? 'determinate' : 'indeterminate'} value={gather.total ? (gather.processed / gather.total) * 100 : 0} />
                </Box>
            )}

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
                <Button className={(busy || selected.length === 0) ? classes.btnDisabled : classes.btn} onClick={run} disableElevation disabled={busy || selected.length === 0}>
                    {running ? 'Running…' : 'Submit'}
                </Button>
                <Button className={rows.length === 0 ? classes.btnDisabled : classes.btn} onClick={exportCSV} disableElevation disabled={rows.length === 0}>
                    CSV
                </Button>
            </Box>
        </Box>
    );
}

export default ToolsBulkOperations;
