import API, { RequestResponse } from '../../../../api';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, Button, LinearProgress } from '@material-ui/core';
import { toast } from 'react-toastify';
import { useStyles as useToolsStyles } from '../shared/DataTypesStyles';

enum eSolrIndexPhase { eIdle, eObjects, eMetadata, eCompleted, eError }

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
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

            if (p.phase === eSolrIndexPhase.eCompleted) {
                stopPolling();
                setIsIndexing(false);
                toast.success('Solr (Re)Index completed successfully.');
            } else if (p.phase === eSolrIndexPhase.eError) {
                stopPolling();
                setIsIndexing(false);
                toast.error(`Solr (Re)Index failed. ${p.error ?? ''}`);
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
                if (p.phase === eSolrIndexPhase.eObjects || p.phase === eSolrIndexPhase.eMetadata) {
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

    const renderProgress = () => {
        if (!isIndexing || !progress)
            return null;

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
                {renderProgress()}
            </Box>
        </>
    );
};

export default ToolsSystemOps;
