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
