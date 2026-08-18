/**
 * WorkflowReportViewer
 *
 * Minimal viewer for a structured (application/json) workflow report. Fetches the report body from
 * the /download endpoint, parses the JSON event array, and renders a legible timeline. Entity
 * references embedded in an event's `data` render as safe links (built from ids, never from free
 * text). A legacy text/html report is not opened here — the caller falls back to a raw tab.
 */
import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, IconButton, Box, Typography, Link } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import CloseIcon from '@material-ui/icons/Close';
import { IWorkflowReportEvent } from '@dpo-packrat/common';
import { NewTabLink } from '../../../../components';
import { getDetailsUrlForObject } from '../../../../utils/repository';
import { formatDateAndTime } from '../../../../utils/shared';

interface WorkflowReportViewerProps {
    open: boolean;
    onClose: () => void;
    reportUrl: string;
    title: string;
}

const useStyles = makeStyles(({ palette }) => ({
    content: {
        minWidth: 640,
        maxWidth: 900
    },
    event: {
        display: 'flex',
        flexDirection: 'column',
        padding: '6px 8px',
        borderBottom: '1px solid #e0e0e0',
        fontSize: '0.8rem'
    },
    eventError: {
        backgroundColor: '#fdecea'
    },
    eventWarn: {
        backgroundColor: '#fff4e5'
    },
    meta: {
        color: palette.primary.dark,
        opacity: 0.7,
        fontSize: '0.72rem',
        marginBottom: 2
    },
    msg: {
        color: palette.primary.dark,
        wordBreak: 'break-word'
    },
    refs: {
        marginTop: 2
    },
    data: {
        marginTop: 2,
        color: '#666',
        fontFamily: 'monospace',
        fontSize: '0.7rem',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word'
    },
    status: {
        padding: 16,
        color: palette.primary.dark
    }
}));

type ReportRef = { name?: string; idSystemObject?: number };

function isRef(value: unknown): value is ReportRef {
    return typeof value === 'object' && value !== null && ('idSystemObject' in value || 'name' in value);
}

function WorkflowReportViewer(props: WorkflowReportViewerProps): React.ReactElement {
    const { open, onClose, reportUrl, title } = props;
    const classes = useStyles();
    const [events, setEvents] = useState<IWorkflowReportEvent[] | null>(null);
    const [status, setStatus] = useState<string>('Loading report…');

    useEffect(() => {
        if (!open) return;
        let cancelled = false;
        setEvents(null);
        setStatus('Loading report…');

        (async () => {
            try {
                const response = await fetch(reportUrl, { credentials: 'include' });
                const text = await response.text();
                let parsed: unknown = null;
                try {
                    parsed = JSON.parse(text);
                } catch {
                    parsed = null;
                }
                if (cancelled) return;
                if (Array.isArray(parsed)) {
                    setEvents(parsed as IWorkflowReportEvent[]);
                    if (parsed.length === 0) setStatus('Report is empty.');
                } else {
                    setEvents(null);
                    setStatus('This report is not a structured JSON report.');
                }
            } catch (error) {
                if (!cancelled) setStatus(`Unable to load report: ${error instanceof Error ? error.message : String(error)}`);
            }
        })();

        return () => { cancelled = true; };
    }, [open, reportUrl]);

    const renderRefs = (data: { [key: string]: unknown } | undefined): React.ReactNode => {
        if (!data) return null;
        const nodes: React.ReactNode[] = [];
        for (const [key, value] of Object.entries(data)) {
            if (isRef(value) && typeof value.idSystemObject === 'number') {
                nodes.push(
                    <NewTabLink
                        key={key}
                        to={getDetailsUrlForObject(value.idSystemObject)}
                        style={{ marginRight: 12 }}
                    >
                        {value.name ?? key}
                    </NewTabLink>
                );
            } else if (key === 'href' && typeof value === 'string') {
                nodes.push(
                    <Link
                        key={key}
                        href={value}
                        target='_blank'
                        rel='noreferrer noopener'
                        style={{ marginRight: 12 }}
                    >
                        Cook Job Output
                    </Link>
                );
            }
        }
        return nodes.length > 0 ? <Box className={classes.refs}>{nodes}</Box> : null;
    };

    const renderData = (data: { [key: string]: unknown } | undefined): React.ReactNode => {
        if (!data) return null;
        const plain: { [key: string]: unknown } = {};
        for (const [key, value] of Object.entries(data)) {
            if (key === 'href' || isRef(value)) continue; // rendered as links above
            plain[key] = value;
        }
        const keys = Object.keys(plain);
        return keys.length > 0 ? <Box className={classes.data}>{JSON.stringify(plain)}</Box> : null;
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth='md'>
            <DialogTitle disableTypography>
                <Box display='flex' justifyContent='space-between' alignItems='center'>
                    <Typography variant='h6'>{title}</Typography>
                    <IconButton size='small' onClick={onClose} aria-label='close'>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent dividers className={classes.content}>
                {events && events.length > 0 ? (
                    events.map((event, index) => (
                        <Box
                            key={index}
                            className={`${classes.event} ${event.level === 'error' ? classes.eventError : ''} ${event.level === 'warn' ? classes.eventWarn : ''}`}
                        >
                            <span className={classes.meta}>
                                {(event.ts ? formatDateAndTime(event.ts) : '')} · {event.phase} · {event.code}
                            </span>
                            <span className={classes.msg}>{event.msg}</span>
                            {renderRefs(event.data)}
                            {renderData(event.data)}
                        </Box>
                    ))
                ) : (
                    <Typography className={classes.status}>{status}</Typography>
                )}
            </DialogContent>
        </Dialog>
    );
}

export default WorkflowReportViewer;
