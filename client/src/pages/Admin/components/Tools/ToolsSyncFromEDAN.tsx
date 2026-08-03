import API, { RequestResponse } from '../../../../api';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, Button, LinearProgress, Link } from '@material-ui/core';
import { toast } from 'react-toastify';
import { toastError } from '../../../../utils/toastError';
import { useStyles as useToolsStyles } from '../shared/DataTypesStyles';
import { getDetailsUrlForObject } from '../../../../utils/repository';

enum eSubjectEDANSyncPhase { eIdle = 0, eRunning = 1, eCompleted = 2, eError = 3 }

interface SubjectEDANSyncSummary {
    live: number;
    noRecordID: number;
    notFound: number;
}

interface SubjectEDANSyncProgress {
    phase: eSubjectEDANSyncPhase;
    processed: number;
    total: number;
    startTime: string | null;
    endTime: string | null;
    error: string | null;
    summary: SubjectEDANSyncSummary;
}

interface SubjectEDANSyncResult {
    idSystemObject: number;
    idSubject: number;
    name: string;
    unitCode: string;
    recordId: string;
    outcome: 'Live' | 'NoRecordID' | 'NotFound';
    reason: string;
    edanStatus: number | null;
    edanPublicSearch: boolean | null;
}

const ToolsSyncFromEDAN = (): React.ReactElement => {
    const classes = useToolsStyles();
    const [isSyncing, setIsSyncing] = useState<boolean>(false);
    const [progress, setProgress] = useState<SubjectEDANSyncProgress | null>(null);
    const [results, setResults] = useState<SubjectEDANSyncResult[] | null>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const stopPolling = useCallback(() => {
        if (pollRef.current !== null) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
    }, []);

    const loadResults = useCallback(async () => {
        try {
            const response = await API.subjectEDANSyncResults();
            if (response.success && Array.isArray(response.data))
                setResults(response.data);
        } catch (error) {
            console.error(`[Packrat:ERROR] Error loading Subject EDAN sync results: ${error}`);
        }
    }, []);

    const pollStatus = useCallback(async () => {
        try {
            const response = await API.subjectEDANSyncStatus();
            if (!response.success)
                return;

            const p: SubjectEDANSyncProgress = response.data;
            setProgress(p);

            if (p.phase === eSubjectEDANSyncPhase.eCompleted) {
                stopPolling();
                setIsSyncing(false);
                await loadResults();
                toast.success('Sync from EDAN completed.');
            } else if (p.phase === eSubjectEDANSyncPhase.eError) {
                stopPolling();
                setIsSyncing(false);
                toastError({ message: p.error, traceId: response.traceId }, 'Sync from EDAN failed.');
            } else if (p.phase === eSubjectEDANSyncPhase.eIdle) {
                stopPolling();
                setIsSyncing(false);
            }
        } catch (error) {
            console.error(`[Packrat:ERROR] Error polling Subject EDAN sync status: ${error}`);
        }
    }, [stopPolling, loadResults]);

    const startPolling = useCallback(() => {
        stopPolling();
        pollRef.current = setInterval(pollStatus, 3000);
    }, [stopPolling, pollStatus]);

    // On mount: resume polling if a sweep is already running; otherwise surface the last results.
    useEffect(() => {
        const checkInitialStatus = async () => {
            try {
                const response = await API.subjectEDANSyncStatus();
                if (!response.success)
                    return;
                const p: SubjectEDANSyncProgress = response.data;
                if (p.phase === eSubjectEDANSyncPhase.eRunning) {
                    setProgress(p);
                    setIsSyncing(true);
                    startPolling();
                } else if (p.phase === eSubjectEDANSyncPhase.eCompleted) {
                    setProgress(p);
                    await loadResults();
                }
            } catch (error) {
                console.error(`[Packrat:ERROR] Error checking initial Subject EDAN sync status: ${error}`);
            }
        };
        checkInitialStatus();
        return stopPolling;
    }, [startPolling, stopPolling, loadResults]);

    const onSync = async () => {
        setIsSyncing(true);
        setProgress(null);
        setResults(null);
        try {
            const response: RequestResponse = await API.subjectEDANSync();
            if (response.success) {
                startPolling();
            } else {
                toastError(response, 'Sync from EDAN failed');
                setIsSyncing(false);
            }
        } catch (error) {
            console.error(`[Packrat:ERROR] Unexpected error during Sync from EDAN: ${error}`);
            toast.error('Sync from EDAN failed due to an unexpected error.');
            setIsSyncing(false);
        }
    };

    const renderProgress = () => {
        if (!isSyncing || !progress || progress.phase !== eSubjectEDANSyncPhase.eRunning)
            return null;
        const pct = progress.total > 0 ? Math.round((progress.processed / progress.total) * 100) : 0;
        return (
            <Box style={{ marginTop: '0.5rem', maxWidth: 400 }}>
                <Typography variant='body2'>
                    Checking Subjects: {progress.processed} / {progress.total}
                </Typography>
                <LinearProgress variant='determinate' value={pct} />
            </Box>
        );
    };

    const renderUnconfirmable = (label: string, outcome: 'NoRecordID' | 'NotFound') => {
        if (!results)
            return null;
        const rows = results.filter(r => r.outcome === outcome);
        if (rows.length === 0)
            return null;
        return (
            <Box style={{ marginTop: '0.75rem' }}>
                <Typography variant='body2' style={{ fontWeight: 600 }}>{label} ({rows.length})</Typography>
                <ul style={{ margin: '0.25rem 0', paddingLeft: '1.25rem' }}>
                    {rows.map(r => (
                        <li key={r.idSystemObject || r.idSubject}>
                            <Link href={getDetailsUrlForObject(r.idSystemObject)} target='_blank' rel='noopener noreferrer'>
                                {r.name || `Subject ${r.idSubject}`}
                            </Link>
                            {r.unitCode ? ` [${r.unitCode}]` : ''} — {r.reason}
                        </li>
                    ))}
                </ul>
            </Box>
        );
    };

    const renderResults = () => {
        if (isSyncing || !results || !progress)
            return null;
        const liveNotSearchable = results.filter(r => r.outcome === 'Live' && r.edanPublicSearch === false).length;
        return (
            <Box style={{ marginTop: '1rem', maxWidth: 700 }}>
                <Typography variant='body2' style={{ fontWeight: 600 }}>
                    Results ({results.length} Subjects)
                </Typography>
                <Typography variant='body2'>
                    Live: {progress.summary.live}
                    {liveNotSearchable > 0 ? ` (${liveNotSearchable} not publicly searchable)` : ''}
                    {' · '}No EDAN Record ID: {progress.summary.noRecordID}
                    {' · '}Not found on EDAN: {progress.summary.notFound}
                </Typography>
                {renderUnconfirmable('Cannot confirm — No EDAN Record ID', 'NoRecordID')}
                {renderUnconfirmable('Cannot confirm — Not found on EDAN', 'NotFound')}
            </Box>
        );
    };

    return (
        <Box style={{ paddingLeft: '1rem' }}>
            <Typography variant='body2' gutterBottom>
                Reconcile each Subject against EDAN and report its live status. Read-only — this does not
                change any Packrat publish state.
            </Typography>

            <Box style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                <Button
                    className={isSyncing ? classes.btnDisabled : classes.btn}
                    onClick={onSync}
                    disableElevation
                    disabled={isSyncing}
                    style={{ width: 180, paddingLeft: '15px', paddingRight: '15px', textTransform: 'none' }}
                >
                    {isSyncing ? 'Syncing...' : 'Sync from EDAN'}
                </Button>
                <Typography variant='body2'>
                    Walks every Subject and checks EDAN for its record. Runs in the background and may take
                    several minutes; a single lookup failure does not stop the run.
                </Typography>
            </Box>
            {renderProgress()}
            {renderResults()}
        </Box>
    );
};

export default ToolsSyncFromEDAN;
