import API, { RequestResponse } from '../../../../api';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, Button, LinearProgress, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@material-ui/core';
import { toast } from 'react-toastify';
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

const ToolsSystemOps = (): React.ReactElement => {
    const classes = useToolsStyles();
    const [isIndexing, setIsIndexing] = useState<boolean>(false);
    const [progress, setProgress] = useState<SolrIndexProgress | null>(null);
    const [showRebuildConfirm, setShowRebuildConfirm] = useState<boolean>(false);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const operationRef = useRef<'reindex' | 'rebuild'>('reindex');

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
                toast.error(`${label} failed. ${p.error ?? ''}`);
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
                toast.error(`Solr (Re)Index failed. ${response.message ?? ''}`);
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
                toast.error(`Solr Rebuild failed. ${response.message ?? ''}`);
                setIsIndexing(false);
            }
        } catch (error) {
            console.error(`[Packrat:ERROR] Unexpected error during Solr rebuild: ${error}`);
            toast.error('Solr Rebuild failed due to an unexpected error.');
            setIsIndexing(false);
        }
    };

    const renderProgress = () => {
        if (!isIndexing || !progress)
            return null;

        if (progress.phase === eSolrIndexPhase.eDeleting) {
            return (
                <Box style={{ marginTop: '0.5rem', maxWidth: 400 }}>
                    <Typography variant='body2'>
                        Deleting all Solr documents...
                    </Typography>
                    <LinearProgress variant='indeterminate' />
                </Box>
            );
        }

        if (progress.phase === eSolrIndexPhase.eObjects) {
            const pct = progress.total > 0 ? Math.round((progress.processed / progress.total) * 100) : 0;
            return (
                <Box style={{ marginTop: '0.5rem', maxWidth: 400 }}>
                    <Typography variant='body2'>
                        Indexing objects: {progress.processed} / {progress.total}
                    </Typography>
                    <LinearProgress variant='determinate' value={pct} />
                </Box>
            );
        }

        if (progress.phase === eSolrIndexPhase.eMetadata) {
            return (
                <Box style={{ marginTop: '0.5rem', maxWidth: 400 }}>
                    <Typography variant='body2'>
                        Indexing metadata: {progress.processed} processed
                    </Typography>
                    <LinearProgress variant='indeterminate' />
                </Box>
            );
        }

        return null;
    };

    return (
        <>
            <Box style={{ paddingLeft: '1rem' }}>
                <Typography variant='body2' gutterBottom>
                    System-level operations for managing Packrat services.
                </Typography>

                <Box style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
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
                        Triggers a full Solr reindex of all Packrat objects. This process runs in the background and may take several minutes.
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
            </Box>

            <Dialog open={showRebuildConfirm} onClose={() => setShowRebuildConfirm(false)}>
                <DialogTitle>Confirm Rebuild Index</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        This will delete ALL documents from both Solr cores and reindex from the database.
                        Search will be unavailable during this process. Are you sure?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowRebuildConfirm(false)} color='primary'>
                        Cancel
                    </Button>
                    <Button onClick={onSolrRebuild} style={{ color: '#d32f2f' }}>
                        Rebuild
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default ToolsSystemOps;
