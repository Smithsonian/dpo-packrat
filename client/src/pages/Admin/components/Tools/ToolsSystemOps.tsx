import API, { RequestResponse } from '../../../../api';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, Button, LinearProgress, Divider, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@material-ui/core';
import { toast } from 'react-toastify';
import { toastError } from '../../../../utils/toastError';
import { useStyles as useToolsStyles } from '../shared/DataTypesStyles';

enum eSolrIndexPhase { eIdle = 0, eDeleting = 1, eObjects = 2, eMetadata = 3, eCompleted = 4, eError = 5 }

interface SolrIndexProgress {
    phase: eSolrIndexPhase;
    processed: number;
    total: number;
    startTime: string | null;
    endTime: string | null;
    error: string | null;
}

// one folder's slice of the cleanup preview
interface CleanupFolder {
    label: string;
    root: string;
    exists: boolean;
    managedEntries: number;
    protectedSkipped: number;
    recentSkipped: number;
    candidateCount: number;
    candidateBytes: number;
    oldestCandidateDate: string | null;
    newestCandidateDate: string | null;
}
interface CleanupPreview {
    days: number;
    protectedScenes: number;
    folders: CleanupFolder[];
    totalCandidateCount: number;
    totalCandidateBytes: number;
}

// raw EDAN query-probe response (data block from /api/system/edan-query)
interface EdanQueryResult {
    op: string;
    _debug?: { server?: string; path?: string; params?: string; paramUsed?: string; q?: string };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    record?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    results?: any;
}

const DEFAULT_RETENTION_DAYS: number = 30;

function fmtBytes(bytes: number): string {
    if (!bytes) return '0 B';
    if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(2)} GB`;
    if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
    if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(0)} KB`;
    return `${bytes} B`;
}
function fmtDate(iso: string | null): string {
    return iso ? iso.slice(0, 10) : '—';
}

const ToolsSystemOps = (): React.ReactElement => {
    const classes = useToolsStyles();

    // ---- Solr ----
    const [isIndexing, setIsIndexing] = useState<boolean>(false);
    const [progress, setProgress] = useState<SolrIndexProgress | null>(null);
    const [showRebuildConfirm, setShowRebuildConfirm] = useState<boolean>(false);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const operationRef = useRef<'reindex' | 'rebuild'>('reindex');

    // ---- EDAN resource cleanup ----
    const [cleanupDays, setCleanupDays] = useState<number>(DEFAULT_RETENTION_DAYS);
    const [cleanupPreview, setCleanupPreview] = useState<CleanupPreview | null>(null);
    const [cleanupLoading, setCleanupLoading] = useState<boolean>(false);
    const [cleanupRunning, setCleanupRunning] = useState<boolean>(false);
    const [showCleanupConfirm, setShowCleanupConfirm] = useState<boolean>(false);

    // ---- EDAN query probe (read-only diagnostic) ----
    const [queryOp, setQueryOp] = useState<'search' | 'content'>('content');
    const [contentParam, setContentParam] = useState<'url' | 'id'>('url');
    const [queryText, setQueryText] = useState<string>('');
    const [querySearchMetadata, setQuerySearchMetadata] = useState<boolean>(false);
    const [queryRunning, setQueryRunning] = useState<boolean>(false);
    const [queryResult, setQueryResult] = useState<EdanQueryResult | null>(null);

    const stopPolling = useCallback(() => {
        if (pollRef.current !== null) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
    }, []);

    const pollStatus = useCallback(async () => {
        try {
            const response = await API.solrReindexStatus();
            if (!response.success)
                return;

            const p: SolrIndexProgress = response.progress;
            setProgress(p);

            const label = operationRef.current === 'rebuild' ? 'Solr Rebuild' : 'Solr (Re)Index';

            if (p.phase === eSolrIndexPhase.eCompleted) {
                stopPolling();
                setIsIndexing(false);
                toast.success(`${label} completed successfully.`);
            } else if (p.phase === eSolrIndexPhase.eError) {
                stopPolling();
                setIsIndexing(false);
                toastError({ message: p.error, traceId: response.traceId }, `${label} failed.`);
            } else if (p.phase === eSolrIndexPhase.eIdle) {
                stopPolling();
                setIsIndexing(false);
            }
        } catch (error) {
            console.error(`[Packrat:ERROR] Error polling Solr reindex status: ${error}`);
        }
    }, [stopPolling]);

    const startPolling = useCallback(() => {
        stopPolling();
        pollRef.current = setInterval(pollStatus, 3000);
    }, [stopPolling, pollStatus]);

    // On mount: check if an index is already in progress
    useEffect(() => {
        const checkInitialStatus = async () => {
            try {
                const response = await API.solrReindexStatus();
                if (!response.success)
                    return;

                const p: SolrIndexProgress = response.progress;
                if (p.phase === eSolrIndexPhase.eDeleting || p.phase === eSolrIndexPhase.eObjects || p.phase === eSolrIndexPhase.eMetadata) {
                    setProgress(p);
                    setIsIndexing(true);
                    startPolling();
                }
            } catch (error) {
                console.error(`[Packrat:ERROR] Error checking initial Solr reindex status: ${error}`);
            }
        };
        checkInitialStatus();
        return stopPolling;
    }, [startPolling, stopPolling]);

    const onSolrReindex = async () => {
        operationRef.current = 'reindex';
        setIsIndexing(true);
        setProgress(null);
        try {
            const response: RequestResponse = await API.solrReindex();
            if (response.success) {
                startPolling();
            } else {
                toastError(response, 'Solr (Re)Index failed');
                setIsIndexing(false);
            }
        } catch (error) {
            console.error(`[Packrat:ERROR] Unexpected error during Solr reindex: ${error}`);
            toast.error('Solr (Re)Index failed due to an unexpected error.');
            setIsIndexing(false);
        }
    };

    const onSolrRebuild = async () => {
        setShowRebuildConfirm(false);
        operationRef.current = 'rebuild';
        setIsIndexing(true);
        setProgress(null);
        try {
            const response: RequestResponse = await API.solrRebuildIndex();
            if (response.success) {
                startPolling();
            } else {
                toastError(response, 'Solr Rebuild failed');
                setIsIndexing(false);
            }
        } catch (error) {
            console.error(`[Packrat:ERROR] Unexpected error during Solr rebuild: ${error}`);
            toast.error('Solr Rebuild failed due to an unexpected error.');
            setIsIndexing(false);
        }
    };

    const onCleanupPreview = async () => {
        setCleanupLoading(true);
        setCleanupPreview(null);
        try {
            const response: RequestResponse = await API.edanCleanupPreview(cleanupDays);
            if (response.success && response.data)
                setCleanupPreview(response.data as CleanupPreview);
            else
                toastError(response, 'Cleanup preview failed');
        } catch (error) {
            console.error(`[Packrat:ERROR] Unexpected error during EDAN cleanup preview: ${error}`);
            toast.error('Cleanup preview failed due to an unexpected error.');
        } finally {
            setCleanupLoading(false);
        }
    };

    const onCleanupExecute = async () => {
        setShowCleanupConfirm(false);
        setCleanupRunning(true);
        try {
            const response: RequestResponse = await API.edanCleanupExecute(cleanupDays);
            if (response.success) {
                toast.success(response.message ?? 'Cleanup complete');
                await onCleanupPreview(); // refresh so the panel reflects what remains
            } else {
                toastError(response, 'Cleanup failed');
            }
        } catch (error) {
            console.error(`[Packrat:ERROR] Unexpected error during EDAN cleanup: ${error}`);
            toast.error('Cleanup failed due to an unexpected error.');
        } finally {
            setCleanupRunning(false);
        }
    };

    const onRunQuery = async () => {
        const text: string = queryText.trim();
        if (!text) {
            toast.info(queryOp === 'content' ? 'Enter an EDAN locator or id.' : 'Enter a search query.');
            return;
        }
        setQueryRunning(true);
        setQueryResult(null);
        try {
            const params: Record<string, string> = { op: queryOp };
            if (queryOp === 'content') {
                params[contentParam] = text;
            } else {
                params.q = text;
                params.gatherRaw = '1';
                if (querySearchMetadata)
                    params.searchMetadata = '1';
            }
            const response: RequestResponse = await API.edanQuery(params);
            if (response.data)
                setQueryResult(response.data as EdanQueryResult);
            // a content miss returns success:true with a message and a null record — surface it without erroring
            if (!response.success)
                toastError(response, 'EDAN query failed');
            else if (response.message)
                toast.info(response.message);
        } catch (error) {
            console.error(`[Packrat:ERROR] Unexpected error during EDAN query: ${error}`);
            toast.error('EDAN query failed due to an unexpected error.');
        } finally {
            setQueryRunning(false);
        }
    };

    const onCopyQueryResult = async () => {
        if (!queryResult) return;
        try {
            await navigator.clipboard.writeText(JSON.stringify(queryResult, null, 2));
            toast.success('Copied raw response to clipboard.');
        } catch {
            toast.error('Could not copy to clipboard.');
        }
    };

    const renderProgress = () => {
        if (!isIndexing || !progress)
            return null;

        if (progress.phase === eSolrIndexPhase.eDeleting) {
            return (
                <Box style={{ marginTop: '0.5rem', maxWidth: 400 }}>
                    <Typography variant='body2'>Deleting all Solr documents...</Typography>
                    <LinearProgress variant='indeterminate' />
                </Box>
            );
        }
        if (progress.phase === eSolrIndexPhase.eObjects) {
            const pct = progress.total > 0 ? Math.round((progress.processed / progress.total) * 100) : 0;
            return (
                <Box style={{ marginTop: '0.5rem', maxWidth: 400 }}>
                    <Typography variant='body2'>Indexing objects: {progress.processed} / {progress.total}</Typography>
                    <LinearProgress variant='determinate' value={pct} />
                </Box>
            );
        }
        if (progress.phase === eSolrIndexPhase.eMetadata) {
            return (
                <Box style={{ marginTop: '0.5rem', maxWidth: 400 }}>
                    <Typography variant='body2'>Indexing metadata: {progress.processed} processed</Typography>
                    <LinearProgress variant='indeterminate' />
                </Box>
            );
        }
        return null;
    };

    const sectionHeader = (text: string): React.ReactElement => (
        <Typography variant='subtitle1' style={{ fontWeight: 600, marginBottom: 4 }}>{text}</Typography>
    );

    const cleanupBusy: boolean = cleanupLoading || cleanupRunning;

    return (
        <Box style={{ paddingLeft: '1rem' }}>
            {/* ---------------- Search Index (Solr) ---------------- */}
            {sectionHeader('Search Index (Solr)')}
            <Typography variant='body2' gutterBottom>Reindex or rebuild the Solr search index.</Typography>

            <Box style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.75rem' }}>
                <Button
                    className={isIndexing ? classes.btnDisabled : classes.btn}
                    onClick={onSolrReindex}
                    disableElevation
                    disabled={isIndexing}
                    style={{ width: 180, paddingLeft: '15px', paddingRight: '15px', textTransform: 'none' }}
                >
                    {isIndexing ? 'Indexing...' : 'Solr (Re)Index'}
                </Button>
                <Typography variant='body2'>
                    Triggers a full Solr reindex of all Packrat objects. Runs in the background and may take several minutes.
                </Typography>
            </Box>

            <Box style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                <Button
                    className={isIndexing ? classes.btnDisabled : classes.btn}
                    onClick={() => setShowRebuildConfirm(true)}
                    disableElevation
                    disabled={isIndexing}
                    style={{ width: 180, paddingLeft: '15px', paddingRight: '15px', textTransform: 'none', backgroundColor: isIndexing ? undefined : '#d32f2f', color: isIndexing ? undefined : '#fff' }}
                >
                    {isIndexing ? 'Indexing...' : 'Rebuild Index'}
                </Button>
                <Typography variant='body2'>
                    Deletes all Solr documents then reindexes from scratch. Use after a database rebuild to remove orphaned documents. Admin only.
                </Typography>
            </Box>
            {renderProgress()}

            <Divider style={{ margin: '1.5rem 0' }} />

            {/* ---------------- EDAN Resource Cleanup ---------------- */}
            {sectionHeader('EDAN Resource Cleanup')}
            <Typography variant='body2' gutterBottom>
                Reclaims space in the EDAN resource folders (the per-scene hot-folder resources and the
                upsert package zips). Removes only entries older than the retention window whose scene is
                <b> not</b> currently published. Always preview before deleting.
            </Typography>

            <Box style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.75rem' }}>
                <Typography variant='body2'>Remove items older than</Typography>
                <input
                    type='number'
                    min={1}
                    value={cleanupDays}
                    disabled={cleanupBusy}
                    onChange={(e) => setCleanupDays(Math.max(1, parseInt(e.target.value, 10) || DEFAULT_RETENTION_DAYS))}
                    style={{ width: 70, padding: '4px 6px' }}
                />
                <Typography variant='body2'>days</Typography>
                <Button
                    className={cleanupBusy ? classes.btnDisabled : classes.btn}
                    onClick={onCleanupPreview}
                    disableElevation
                    disabled={cleanupBusy}
                    style={{ width: 120, textTransform: 'none' }}
                >
                    {cleanupLoading ? 'Scanning…' : 'Preview'}
                </Button>
            </Box>

            {cleanupPreview && (
                <Box style={{ marginTop: '0.75rem', maxWidth: 640 }}>
                    <Typography variant='body2' style={{ marginBottom: 4 }}>
                        <b>{cleanupPreview.totalCandidateCount}</b> item(s) removable · <b>{fmtBytes(cleanupPreview.totalCandidateBytes)}</b> reclaimable
                        {'  '}(older than {cleanupPreview.days} days; {cleanupPreview.protectedScenes} published scene(s) protected).
                    </Typography>
                    {cleanupPreview.folders.map(f => (
                        <Box key={f.label} style={{ padding: '6px 10px', margin: '4px 0', border: '1px solid #d7dbe0', borderRadius: 6, backgroundColor: '#f6f8fa' }}>
                            <Typography variant='body2' style={{ fontWeight: 600 }}>{f.label}{!f.exists ? ' (folder not found)' : ''}</Typography>
                            <Typography variant='caption' style={{ display: 'block', color: '#5a6472' }}>
                                {f.candidateCount} removable · {fmtBytes(f.candidateBytes)} · {f.managedEntries} managed entries
                                {' · '}skipped: {f.recentSkipped} recent, {f.protectedSkipped} published
                                {f.candidateCount > 0 ? ` · oldest ${fmtDate(f.oldestCandidateDate)}, newest ${fmtDate(f.newestCandidateDate)}` : ''}
                            </Typography>
                        </Box>
                    ))}
                    <Button
                        className={(cleanupBusy || cleanupPreview.totalCandidateCount === 0) ? classes.btnDisabled : classes.btn}
                        onClick={() => setShowCleanupConfirm(true)}
                        disableElevation
                        disabled={cleanupBusy || cleanupPreview.totalCandidateCount === 0}
                        style={{ marginTop: 8, width: 200, textTransform: 'none', backgroundColor: (cleanupBusy || cleanupPreview.totalCandidateCount === 0) ? undefined : '#d32f2f', color: (cleanupBusy || cleanupPreview.totalCandidateCount === 0) ? undefined : '#fff' }}
                    >
                        {cleanupRunning ? 'Deleting…' : 'Delete Eligible Items'}
                    </Button>
                </Box>
            )}

            <Divider style={{ margin: '1.5rem 0' }} />

            {/* ---------------- EDAN Query (Diagnostic) ---------------- */}
            {sectionHeader('EDAN Query (Diagnostic)')}
            <Typography variant='body2' gutterBottom>
                Read-only probe of the live EDAN service. <b>Content</b> fetches a single record by locator —
                a scheme-prefixed <code>edanmdm:</code>/<code>edanlists:</code> value uses <code>url</code>,
                an opaque internal id/UUID uses <code>id</code>. <b>Search</b> queries the collection by text.
                Nothing is written; results show the raw EDAN response.
            </Typography>

            <Box style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                <select
                    value={queryOp}
                    disabled={queryRunning}
                    onChange={(e) => { setQueryOp(e.target.value as 'search' | 'content'); setQueryResult(null); }}
                    style={{ padding: '4px 6px' }}
                >
                    <option value='content'>Content (by locator/id)</option>
                    <option value='search'>Search (by text)</option>
                </select>

                {queryOp === 'content' && (
                    <select
                        value={contentParam}
                        disabled={queryRunning}
                        onChange={(e) => setContentParam(e.target.value as 'url' | 'id')}
                        style={{ padding: '4px 6px' }}
                    >
                        <option value='url'>url (edanmdm:/edanlists:)</option>
                        <option value='id'>id (internal/UUID)</option>
                    </select>
                )}

                {queryOp === 'search' && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <input
                            type='checkbox'
                            checked={querySearchMetadata}
                            disabled={queryRunning}
                            onChange={(e) => setQuerySearchMetadata(e.target.checked)}
                        />
                        <Typography variant='body2'>search all record types</Typography>
                    </label>
                )}
            </Box>

            <Box style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.75rem', maxWidth: 760 }}>
                <input
                    type='text'
                    value={queryText}
                    disabled={queryRunning}
                    placeholder={queryOp === 'content' ? 'edanlists:… or edanmdm:… or internal id' : 'search text'}
                    onChange={(e) => setQueryText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') onRunQuery(); }}
                    style={{ flex: 1, padding: '6px 8px' }}
                />
                <Button
                    className={queryRunning ? classes.btnDisabled : classes.btn}
                    onClick={onRunQuery}
                    disableElevation
                    disabled={queryRunning}
                    style={{ width: 120, textTransform: 'none' }}
                >
                    {queryRunning ? 'Querying…' : 'Run Query'}
                </Button>
            </Box>

            {queryResult && (
                <Box style={{ marginTop: '0.75rem', maxWidth: 760 }}>
                    <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                        <Typography variant='caption' style={{ fontFamily: 'monospace', color: '#5a6472', wordBreak: 'break-all' }}>
                            {queryResult._debug
                                ? `GET ${queryResult._debug.path ?? ''}?${queryResult._debug.params ?? (queryResult._debug.q ? `q=${queryResult._debug.q}` : '')}` +
                                  (queryResult._debug.paramUsed ? ` · paramUsed: ${queryResult._debug.paramUsed}` : '')
                                : ''}
                        </Typography>
                        <Button onClick={onCopyQueryResult} disableElevation style={{ textTransform: 'none', minWidth: 72 }}>Copy</Button>
                    </Box>
                    <pre style={{ marginTop: 4, padding: '10px', maxHeight: 420, overflow: 'auto', border: '1px solid #d7dbe0', borderRadius: 6, backgroundColor: '#f6f8fa', fontSize: 12 }}>
                        {JSON.stringify(queryResult.record ?? queryResult.results ?? queryResult, null, 2)}
                    </pre>
                </Box>
            )}

            {/* ---------------- Confirm dialogs ---------------- */}
            <Dialog open={showRebuildConfirm} onClose={() => setShowRebuildConfirm(false)}>
                <DialogTitle>Confirm Rebuild Index</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        This will delete ALL documents from both Solr cores and reindex from the database.
                        Search will be unavailable during this process. Are you sure?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowRebuildConfirm(false)} color='primary'>Cancel</Button>
                    <Button onClick={onSolrRebuild} style={{ color: '#d32f2f' }}>Rebuild</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={showCleanupConfirm} onClose={() => setShowCleanupConfirm(false)}>
                <DialogTitle>Confirm EDAN Resource Cleanup</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        This permanently deletes <b>{cleanupPreview?.totalCandidateCount ?? 0}</b> item(s)
                        ({fmtBytes(cleanupPreview?.totalCandidateBytes ?? 0)}) from the EDAN resource folders —
                        entries older than {cleanupDays} days whose scene is not currently published. This cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowCleanupConfirm(false)} color='primary'>Cancel</Button>
                    <Button onClick={onCleanupExecute} style={{ color: '#d32f2f' }}>Delete</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ToolsSystemOps;
