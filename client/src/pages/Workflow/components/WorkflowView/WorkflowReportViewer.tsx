/**
 * WorkflowReportViewer
 *
 * Minimal viewer for a structured (application/json) workflow report. Fetches the report body from
 * the /download endpoint, parses the JSON event array, and renders a legible timeline (newest first).
 * Entity references embedded in an event's `data` render as safe links (built from ids, never from
 * free text). A legacy text/html report is not opened here — the caller falls back to a raw tab.
 */
import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, IconButton, Box, Typography, Link } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import CloseIcon from '@material-ui/icons/Close';
import { IWorkflowReportEvent, IWorkflowReportRef } from '@dpo-packrat/common';
import { NewTabLink } from '../../../../components';
import { getDetailsUrlForObject } from '../../../../utils/repository';
import { formatDateAndTime } from '../../../../utils/shared';

export interface WorkflowReportHeader {
    title: string;
    recipe?: string;
    cookJobId?: string;
    cookServer?: string;
    started?: string;
}

interface WorkflowReportViewerProps {
    open: boolean;
    onClose: () => void;
    reportUrl: string;
    header: WorkflowReportHeader;
    mimeType?: string | null;
}

const useStyles = makeStyles(({ palette }) => ({
    content: {
        minWidth: 640,
        maxWidth: 900
    },
    subtitle: {
        color: palette.primary.dark,
        opacity: 0.75,
        fontSize: '0.72rem',
        lineHeight: 1.4
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
        marginTop: 3,
        display: 'flex',
        flexWrap: 'wrap',
        gap: '14px'
    },
    refLink: {
        fontSize: '0.78rem'
    },
    refText: {
        fontSize: '0.78rem',
        color: palette.primary.dark
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
    },
    legacyFrame: {
        width: '100%',
        height: '60vh',
        border: 0,
        backgroundColor: '#ffffff'
    }
}));

function isRef(value: unknown): value is IWorkflowReportRef {
    return typeof value === 'object' && value !== null && ('idSystemObject' in value || 'name' in value);
}

/** Label the object type of a reference, from most to least specific, for the [Type] link tag. */
function refTypeLabel(ref: IWorkflowReportRef): string {
    if (typeof ref.idScene === 'number') return 'Scene';
    if (typeof ref.idModel === 'number') return 'Model';
    if (typeof ref.idSubject === 'number') return 'Subject';
    if (typeof ref.idAssetVersion === 'number' || typeof ref.idAsset === 'number') return 'Asset';
    return 'Object';
}

function WorkflowReportViewer(props: WorkflowReportViewerProps): React.ReactElement {
    const { open, onClose, reportUrl, header, mimeType } = props;
    const classes = useStyles();
    const [events, setEvents] = useState<IWorkflowReportEvent[] | null>(null);
    const [legacyHtml, setLegacyHtml] = useState<string | null>(null);
    const [status, setStatus] = useState<string>('Loading report…');

    useEffect(() => {
        if (!open) return;
        let cancelled = false;
        setEvents(null);
        setLegacyHtml(null);
        setStatus('Loading report…');

        (async () => {
            try {
                const response = await fetch(reportUrl, { credentials: 'include' });
                const text = await response.text();
                if (cancelled) return;

                if (mimeType === 'application/json') {
                    let parsed: unknown = null;
                    try {
                        parsed = JSON.parse(text);
                    } catch {
                        parsed = null;
                    }
                    if (Array.isArray(parsed)) {
                        setEvents(parsed as IWorkflowReportEvent[]);
                        if (parsed.length === 0) setStatus('Report is empty.');
                    } else {
                        // unexpected non-array JSON body — fall back to the safe raw render
                        setLegacyHtml(text.trim().length ? text : null);
                        if (!text.trim().length) setStatus('Report is empty.');
                    }
                } else {
                    // legacy text/html (or unknown) — render inertly in a sandboxed iframe (no scripts)
                    setLegacyHtml(text.trim().length ? text : null);
                    if (!text.trim().length) setStatus('Report is empty.');
                }
            } catch (error) {
                if (!cancelled) setStatus(`Unable to load report: ${error instanceof Error ? error.message : String(error)}`);
            }
        })();

        return () => { cancelled = true; };
    }, [open, reportUrl, mimeType]);

    const renderRefs = (data: { [key: string]: unknown } | undefined): React.ReactNode => {
        if (!data) return null;
        const nodes: React.ReactNode[] = [];
        for (const [key, value] of Object.entries(data)) {
            if (isRef(value)) {
                if (typeof value.idSystemObject === 'number')
                    nodes.push(
                        <NewTabLink key={key} to={getDetailsUrlForObject(value.idSystemObject)} className={classes.refLink}>
                            {`[${refTypeLabel(value)}] ${value.name ?? key}`}
                        </NewTabLink>
                    );
                else if (value.name)
                    nodes.push(<span key={key} className={classes.refText}>{`[${refTypeLabel(value)}] ${value.name}`}</span>);
            } else if (key === 'output' && typeof value === 'string') {
                nodes.push(
                    <Link
                        key={key}
                        href={value}
                        target='_blank'
                        rel='noreferrer noopener'
                        className={classes.refLink}
                    >
                        Cook Job Output
                    </Link>
                );
            } else if (key === 'href' && typeof value === 'string') {
                nodes.push(
                    <Link
                        key={key}
                        href={value}
                        target='_blank'
                        rel='noreferrer noopener'
                        className={classes.refLink}
                    >
                        Download
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
            if (key === 'href' || key === 'output' || isRef(value)) continue; // rendered as links above
            plain[key] = value;
        }
        return Object.keys(plain).length > 0 ? <Box className={classes.data}>{JSON.stringify(plain)}</Box> : null;
    };

    const subtitleLines: string[] = [];
    if (header.cookJobId) subtitleLines.push(`Cook Job: ${header.cookJobId}`);
    if (header.recipe) subtitleLines.push(`Recipe: ${header.recipe}`);
    if (header.started) subtitleLines.push(`Started: ${header.started}`);
    if (header.cookServer) subtitleLines.push(`Cook Server: ${header.cookServer}`);

    // newest-first
    const ordered = events ? events.map((event, index) => ({ event, index })).reverse() : [];

    return (
        <Dialog open={open} onClose={onClose} maxWidth='md'>
            <DialogTitle disableTypography>
                <Box display='flex' justifyContent='space-between' alignItems='flex-start'>
                    <Box>
                        <Typography variant='h6'>{header.title}</Typography>
                        {subtitleLines.map((line, i) => (
                            <div key={i} className={classes.subtitle}>{line}</div>
                        ))}
                    </Box>
                    <IconButton size='small' onClick={onClose} aria-label='close'>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent dividers className={classes.content}>
                {events && events.length > 0 ? (
                    ordered.map(({ event, index }) => (
                        <Box
                            key={index}
                            className={`${classes.event} ${event.level === 'error' ? classes.eventError : ''} ${event.level === 'warn' ? classes.eventWarn : ''}`}
                        >
                            <span className={classes.meta}>
                                {(event.ts ? formatDateAndTime(event.ts) : '')} · {event.phase} · {event.code}
                            </span>
                            {event.msg && event.msg.trim().length > 0 && <span className={classes.msg}>{event.msg}</span>}
                            {renderRefs(event.data)}
                            {renderData(event.data)}
                        </Box>
                    ))
                ) : legacyHtml ? (
                    <iframe
                        title='Workflow report (legacy)'
                        sandbox='allow-popups allow-popups-to-escape-sandbox'
                        srcDoc={legacyHtml}
                        className={classes.legacyFrame}
                    />
                ) : (
                    <Typography className={classes.status}>{status}</Typography>
                )}
            </DialogContent>
        </Dialog>
    );
}

export default WorkflowReportViewer;
