/* eslint-disable react/jsx-max-props-per-line */

/**
 * AuditLifelineTable
 *
 * Renders the full audit history for one SystemObject as a chronological list.
 * Hits `GET /api/audit/lifeline/:id`, which is admin-only on the server side
 * (admin/tools users only). The parent DetailsTab gates this tab on
 * `user.isAdmin`, but the server enforces the auth check independently.
 *
 * Each row reads as a sentence: "On <date>, <actor> <verb> <object>." The
 * Action column folds the affected entity name into the verb so the row is
 * self-explanatory ("Updated Scene", "Uploaded Asset", "Approved Scene for
 * publication"). The Detail column shows a one-line summary when it fits;
 * when there's more to show, it offers a "View details" link that opens a
 * modal with the full pretty-printed payload.
 */
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, Link, IconButton } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import clsx from 'clsx';
import React, { useEffect, useState } from 'react';
import API from '../../../../../api';
import { EmptyTable } from '../../../../../components';
import { formatDateAndTime } from '../../../../../utils/shared';
import { useStyles } from './AssetGrid';

type LifelineRow = {
    idAudit: number;
    AuditDate: string;
    idUser: number | null;
    UserName: string | null;
    EmailAddress: string | null;
    SystemActor: string | null;
    AuditType: number;
    AuditTypeName: string;
    DBObjectType: number | null;
    DBObjectTypeName: string | null;
    idDBObject: number | null;
    idSystemObject: number | null;
    Data: string | null;
    CorrelationId: string | null;
};

type LifelineResponse = {
    success: boolean;
    message?: string;
    data?: {
        idSystemObject: number;
        offset: number;
        limit: number;
        total: number;
        rows: LifelineRow[];
    };
};

interface AuditLifelineTableProps {
    idSystemObject: number;
}

const PAGE_SIZE = 50;

const headers: Array<{ name: string; width?: string; flex?: string; align?: 'left' | 'center' | 'right' }> = [
    { name: 'Date',          width: '160px', align: 'left' },
    { name: 'Actor',         width: '160px', align: 'left' },
    { name: 'Group',         width: '90px',  align: 'left' },
    { name: 'Action',        width: '240px', align: 'left' },
    { name: 'Detail',        flex: '1',      align: 'left' },
];

/**
 * Verb + object templates per AuditType. The function gets the resolved object
 * name (e.g. 'Scene', 'Asset') when DBObjectTypeName is set; some actions are
 * objectless (login, system maintenance) and ignore the argument.
 */
const ACTION_TEMPLATES: Record<string, (obj: string | null) => string> = {
    eUnknown:                       () => 'Unknown',
    eDBCreate:                      o => o ? `Created ${o}` : 'Created',
    eDBUpdate:                      o => o ? `Updated ${o}` : 'Updated',
    eDBDelete:                      o => o ? `Deleted ${o}` : 'Deleted',
    eAuthLogin:                     () => 'Logged in',
    eAuthFailed:                    () => 'Login failed',
    eAuthDenied:                    () => 'Access denied',
    eAuthGranted:                   () => 'Access granted',
    eAuthRevoked:                   () => 'Access revoked',
    eHTTPDownload:                  o => o ? `Downloaded ${o}` : 'Downloaded',
    eHTTPUpload:                    o => o ? `Uploaded ${o}` : 'Uploaded',
    eSolrRebuild:                   () => 'Rebuilt search index',
    eGenDownloads:                  () => 'Generated downloads',
    eSceneQCd:                      o => o ? `Marked ${o} QC (legacy)` : 'Marked QC (legacy)',
    eActionPublish:                 o => o ? `Published ${o}` : 'Published',
    eActionUnpublish:               o => o ? `Unpublished ${o}` : 'Unpublished',
    eActionAssignLicense:           o => o ? `Assigned license to ${o}` : 'Assigned license',
    eActionClearLicense:            o => o ? `Cleared license from ${o}` : 'Cleared license',
    eActionLicenseUpdate:           () => 'Updated license',
    eActionEDANIDChange:            o => o ? `Changed EDAN ID on ${o}` : 'Changed EDAN ID',
    eActionRollbackSOV:             o => o ? `Rolled back ${o} version` : 'Rolled back to version',
    eActionRollbackAssetVersion:    () => 'Rolled back asset version',
    eActionApproveForPublication:   o => o ? `Approved ${o} for publication` : 'Approved for publication',
    eActionPoseAndQC:               o => o ? `Posed and QC’d ${o}` : 'Posed and QC’d',
    eActionIngest:                  o => o ? `Ingested into ${o}` : 'Ingested',
    eActionAccessGrant:             () => 'Granted access',
    eActionAccessRevoke:            () => 'Revoked access',
    eActionRetire:                  o => o ? `Retired ${o}` : 'Retired',
    eActionReinstate:               o => o ? `Reinstated ${o}` : 'Reinstated',
    eActionSystemMaintenance:       () => 'System maintenance',
};

function actionPhrase(row: LifelineRow): string {
    const tpl = ACTION_TEMPLATES[row.AuditTypeName];
    if (tpl) return tpl(row.DBObjectTypeName);
    return row.AuditTypeName;
}

/** Render the actor cell: user name (with email tooltip) or system actor. */
function actorLabel(row: LifelineRow): string {
    if (row.UserName) return row.UserName;
    if (row.SystemActor) return `System: ${row.SystemActor}`;
    return '—';
}

/** Truncate a single value preview to keep cells compact. */
function previewValue(v: unknown): string {
    if (v === null || v === undefined) return 'null';
    if (typeof v === 'string') {
        if (v.length > 40) return `'${v.slice(0, 37)}…'`;
        return `'${v}'`;
    }
    if (typeof v === 'object') {
        const o = v as { __omitted?: string; bytes?: number };
        if (o && o.__omitted) return `<${o.__omitted}, ${o.bytes ?? 0}b>`;
        return JSON.stringify(v).slice(0, 40);
    }
    return String(v);
}

/**
 * Render result for the Detail column. `inline` is shown directly. `summary`
 * is short text + a "View details" link. `empty` shows nothing.
 */
type DetailRender =
    | { kind: 'empty' }
    | { kind: 'inline'; text: string }
    | { kind: 'summary'; text: string };

const INLINE_FIELD_LIMIT = 2;

/**
 * Convert a parsed audit payload into either a clean inline string or a short
 * summary that signals "click to view full payload". The shape varies by
 * AuditType — known shapes get bespoke renderers, the rest fall back to a
 * field-count summary.
 */
function renderDetail(row: LifelineRow): DetailRender {
    if (!row.Data) return { kind: 'empty' };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let obj: any;
    try {
        obj = JSON.parse(row.Data);
    } catch {
        return { kind: 'inline', text: row.Data.slice(0, 80) };
    }
    if (!obj || typeof obj !== 'object') return { kind: 'inline', text: String(obj) };

    const name = row.AuditTypeName;

    // Diff payload: { kind: 'diff', changed: { Field: { before, after }, ... } }
    if (obj.kind === 'diff' && obj.changed && typeof obj.changed === 'object') {
        const fields = Object.keys(obj.changed);
        if (fields.length === 0) return { kind: 'inline', text: 'no fields changed' };
        if (fields.length <= INLINE_FIELD_LIMIT) {
            const parts = fields.map(f => {
                const e = obj.changed[f];
                return `${f}: ${previewValue(e?.before)} → ${previewValue(e?.after)}`;
            });
            return { kind: 'inline', text: parts.join(' • ') };
        }
        const sample = fields.slice(0, 2).join(', ');
        return { kind: 'summary', text: `${fields.length} fields changed (${sample}…)` };
    }

    // Snapshot payload: { kind: 'snapshot', row: { Name, Title, ... } }
    if (obj.kind === 'snapshot' && obj.row && typeof obj.row === 'object') {
        const entries = Object.entries(obj.row).filter(([, v]) => v !== null && v !== undefined && v !== '');
        if (entries.length === 0) return { kind: 'empty' };
        // Surface a Name/Title/FileName when available — that's the natural
        // single-field summary for a created or deleted entity.
        const headline = entries.find(([k]) => k === 'Name' || k === 'Title' || k === 'FileName');
        if (headline)
            return { kind: 'summary', text: `${headline[0]}=${previewValue(headline[1])}` };
        return { kind: 'summary', text: `${entries.length} field${entries.length === 1 ? '' : 's'}` };
    }

    // Semantic action shapes — most are short enough to fit inline.
    switch (name) {
        case 'eActionRetire':
        case 'eActionReinstate': {
            const reason = obj.reason ? `reason: ${obj.reason}` : 'no reason given';
            const parent = obj.parentRetirement?.idAudit
                ? ` (cascade child of audit #${obj.parentRetirement.idAudit})`
                : '';
            return { kind: 'inline', text: `${reason}${parent}` };
        }
        case 'eActionPublish':
        case 'eActionUnpublish':
            if (obj.reason) return { kind: 'inline', text: `reason: ${obj.reason}` };
            if (obj.idSystemObjectVersion) return { kind: 'inline', text: `version: ${obj.idSystemObjectVersion}` };
            return { kind: 'empty' };
        case 'eActionApproveForPublication':
        case 'eActionPoseAndQC':
            if (obj.after && obj.before) {
                const k = Object.keys(obj.after)[0];
                return { kind: 'inline', text: `${k}: ${previewValue(obj.before[k])} → ${previewValue(obj.after[k])}` };
            }
            return { kind: 'empty' };
        case 'eActionAssignLicense':
        case 'eActionClearLicense':
            if (obj.idLicense) return { kind: 'inline', text: `license #${obj.idLicense}` };
            if (obj.licenseName) return { kind: 'inline', text: `license: ${obj.licenseName}` };
            return { kind: 'empty' };
        case 'eActionLicenseUpdate':
            if (obj.changed && typeof obj.changed === 'object') {
                const fs = Object.keys(obj.changed);
                if (fs.length === 0) return { kind: 'empty' };
                if (fs.length <= INLINE_FIELD_LIMIT) return { kind: 'inline', text: `changed: ${fs.join(', ')}` };
                return { kind: 'summary', text: `${fs.length} license fields changed` };
            }
            return { kind: 'empty' };
        case 'eActionEDANIDChange':
            if (obj.before !== undefined && obj.after !== undefined)
                return { kind: 'inline', text: `${previewValue(obj.before)} → ${previewValue(obj.after)}` };
            return { kind: 'empty' };
        case 'eActionRollbackSOV':
            if (obj.from !== undefined && obj.to !== undefined)
                return { kind: 'inline', text: `version #${obj.from} → #${obj.to}` };
            return { kind: 'empty' };
        case 'eActionRollbackAssetVersion':
            if (obj.from !== undefined && obj.to !== undefined)
                return { kind: 'inline', text: `asset version #${obj.from} → #${obj.to}` };
            return { kind: 'empty' };
        case 'eActionIngest': {
            const c = obj.counts ?? {};
            const parts: string[] = [];
            if (c.assetVersions) parts.push(`${c.assetVersions} asset version${c.assetVersions === 1 ? '' : 's'}`);
            if (c.subjects) parts.push(`${c.subjects} subject${c.subjects === 1 ? '' : 's'}`);
            if (c.idItem) parts.push(`item #${c.idItem}`);
            return parts.length ? { kind: 'inline', text: parts.join(' • ') } : { kind: 'empty' };
        }
        case 'eActionAccessGrant':
        case 'eActionAccessRevoke':
            if (obj.scope) return { kind: 'inline', text: `scope: ${obj.scope}` };
            return { kind: 'empty' };
        case 'eActionSystemMaintenance':
            if (typeof obj.skeletoned === 'number' && typeof obj.transientDeleted === 'number') {
                const parts = [`${obj.skeletoned} skeletoned`, `${obj.transientDeleted} deleted`];
                if (obj.cancelled) parts.push('cancelled');
                if (typeof obj.durationMs === 'number') parts.push(`${obj.durationMs}ms`);
                return { kind: 'inline', text: parts.join(' • ') };
            }
            return { kind: 'empty' };
        case 'eAuthLogin':
            return obj.email ? { kind: 'inline', text: `email: ${obj.email}` } : { kind: 'empty' };
        case 'eAuthFailed':
            if (obj.email)
                return { kind: 'inline', text: `email: ${obj.email}${obj.error ? ` — ${obj.error}` : ''}` };
            return obj.error ? { kind: 'inline', text: obj.error } : { kind: 'empty' };
        case 'eAuthDenied':
            if (obj.reason) return { kind: 'inline', text: `reason: ${obj.reason}` };
            if (obj.url) return { kind: 'inline', text: `url: ${obj.url}` };
            return { kind: 'empty' };
        case 'eHTTPUpload':
        case 'eHTTPDownload': {
            const file: string | undefined = obj.fileName ?? obj.filename;
            const reason: string | undefined = obj.reason;
            // Prefer the human reason; append filename when both are present.
            if (reason && file) return { kind: 'inline', text: `${reason} · ${file}` };
            if (reason) return { kind: 'inline', text: reason };
            if (file) return { kind: 'inline', text: `file: ${file}` };
            if (obj.url) return { kind: 'inline', text: `url: ${String(obj.url).slice(0, 80)}` };
            return { kind: 'empty' };
        }
        case 'eGenDownloads':
            if (obj.idScene) return { kind: 'inline', text: `scene #${obj.idScene}` };
            return { kind: 'empty' };
    }

    // Generic fallback: count the fields and offer the modal.
    const entries = Object.entries(obj).filter(([, v]) => v !== null && v !== undefined && v !== '');
    if (entries.length === 0) return { kind: 'empty' };
    if (entries.length <= INLINE_FIELD_LIMIT) {
        const parts = entries.map(([k, v]) => `${k}=${previewValue(v)}`);
        return { kind: 'inline', text: parts.join(' • ') };
    }
    return { kind: 'summary', text: `${entries.length} fields` };
}

function shortCorrelation(id: string | null): string {
    if (!id) return '';
    return id.slice(0, 8);
}

function prettyJson(data: string | null): string {
    if (!data) return '';
    try {
        return JSON.stringify(JSON.parse(data), null, 2);
    } catch {
        return data;
    }
}

type StructuredView =
    | { kind: 'diff'; rows: Array<{ field: string; before: unknown; after: unknown }> }
    | { kind: 'snapshot'; rows: Array<{ field: string; value: unknown }> }
    | null;

/**
 * Recognize the diff/snapshot envelope shapes so the modal can render them as a
 * proper table. Returns null for unrecognized payloads — callers fall back to
 * the raw JSON view.
 */
function parseStructured(data: string | null): StructuredView {
    if (!data) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let obj: any;
    try { obj = JSON.parse(data); } catch { return null; }
    if (!obj || typeof obj !== 'object') return null;
    if (obj.kind === 'diff' && obj.changed && typeof obj.changed === 'object') {
        const rows = Object.entries(obj.changed).map(([field, e]) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const entry = e as any;
            return { field, before: entry?.before, after: entry?.after };
        });
        return { kind: 'diff', rows };
    }
    if (obj.kind === 'snapshot' && obj.row && typeof obj.row === 'object') {
        const rows = Object.entries(obj.row).map(([field, value]) => ({ field, value }));
        return { kind: 'snapshot', rows };
    }
    return null;
}

/**
 * Format a raw audit value for the modal table. Strings are quoted, objects
 * pretty-printed, omitted blobs surfaced as <omitted, Nb>. Distinct from the
 * inline `previewValue` so the modal can show full values without truncation.
 */
function formatModalValue(v: unknown): string {
    if (v === null) return 'null';
    if (v === undefined) return '—';
    if (typeof v === 'string') return `'${v}'`;
    if (typeof v === 'object') {
        const o = v as { __omitted?: string; bytes?: number };
        if (o && o.__omitted) return `<${o.__omitted}, ${o.bytes ?? 0}b>`;
        try { return JSON.stringify(v, null, 2); } catch { return String(v); }
    }
    return String(v);
}

function AuditLifelineTable(props: AuditLifelineTableProps): React.ReactElement {
    const classes = useStyles();
    const { idSystemObject } = props;

    const [rows, setRows] = useState<LifelineRow[]>([]);
    const [total, setTotal] = useState<number>(0);
    const [offset, setOffset] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [modalRow, setModalRow] = useState<LifelineRow | null>(null);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            setError(null);
            try {
                const resp: LifelineResponse = await API.request(`api/audit/lifeline/${idSystemObject}?offset=${offset}&limit=${PAGE_SIZE}&order=desc`, { method: 'GET' });
                if (cancelled) return;
                if (resp?.success && resp.data) {
                    setRows(resp.data.rows ?? []);
                    setTotal(resp.data.total ?? 0);
                } else {
                    setError(resp?.message ?? 'failed to load audit lifeline');
                    setRows([]);
                    setTotal(0);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : String(err));
                    setRows([]);
                    setTotal(0);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, [idSystemObject, offset]);

    const canPrev = offset > 0;
    const canNext = offset + PAGE_SIZE < total;
    const showingFrom = total === 0 ? 0 : offset + 1;
    const showingTo = Math.min(offset + PAGE_SIZE, total);

    if (error) {
        return (
            <Box style={{ minWidth: '620px', padding: '12px' }}>
                <Typography color='error'>{error}</Typography>
            </Box>
        );
    }

    if (!loading && rows.length === 0) {
        return (
            <Box style={{ minWidth: '620px' }}>
                <EmptyTable />
            </Box>
        );
    }

    return (
        <Box style={{ minWidth: '620px' }}>
            <table className={clsx(classes.container, classes.fixedTable)}>
                <thead>
                    <tr style={{ borderBottom: '1px solid grey' }}>
                        {headers.map(({ name, width, flex, align }, idx: number) => (
                            <th key={idx} align={align} style={{ width, padding: 5, flex }}>
                                <Typography className={classes.header}>{name}</Typography>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => {
                        const corr = shortCorrelation(row.CorrelationId);
                        const detail = renderDetail(row);
                        return (
                            <tr key={row.idAudit}>
                                <td align='left' style={{ padding: '0 5px' }}>
                                    <Typography className={classes.value}>
                                        {formatDateAndTime(row.AuditDate)}
                                    </Typography>
                                </td>
                                <td align='left' style={{ padding: '0 5px' }}>
                                    <Typography
                                        className={classes.value}
                                        title={row.EmailAddress ?? undefined}
                                    >
                                        {actorLabel(row)}
                                    </Typography>
                                </td>
                                <td align='left' style={{ padding: '0 5px' }}>
                                    <Typography
                                        className={classes.value}
                                        style={{ fontFamily: 'monospace' }}
                                        title={row.CorrelationId ? `correlation id: ${row.CorrelationId}` : 'no correlation id'}
                                    >
                                        {corr || '—'}
                                    </Typography>
                                </td>
                                <td align='left' style={{ padding: '0 5px' }}>
                                    <Typography
                                        className={classes.value}
                                        title={`${row.AuditTypeName} (${row.AuditType})`}
                                    >
                                        {actionPhrase(row)}
                                    </Typography>
                                </td>
                                <td align='left' style={{ padding: '0 5px' }}>
                                    {detail.kind === 'inline' && (
                                        <Typography className={classes.value} style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {detail.text}
                                        </Typography>
                                    )}
                                    {detail.kind === 'summary' && (
                                        <Typography className={classes.value} style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {detail.text}
                                            {' '}
                                            <Link
                                                component='button'
                                                variant='body2'
                                                onClick={() => setModalRow(row)}
                                                style={{ verticalAlign: 'baseline' }}
                                            >
                                                View details
                                            </Link>
                                        </Typography>
                                    )}
                                    {detail.kind === 'empty' && row.Data && (
                                        <Link
                                            component='button'
                                            variant='body2'
                                            onClick={() => setModalRow(row)}
                                        >
                                            View details
                                        </Link>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            <Box display='flex' alignItems='center' justifyContent='space-between' style={{ padding: '8px 0' }}>
                <Typography variant='body2' style={{ color: '#1c2858', fontWeight: 500 }}>
                    {loading ? 'Loading…' : (total === 0 ? 'No audit rows' : `Showing ${showingFrom}–${showingTo} of ${total}`)}
                </Typography>
                <Box>
                    <Button
                        variant='contained'
                        color='primary'
                        disableElevation
                        size='small'
                        disabled={!canPrev || loading}
                        onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                        style={{ marginRight: 8 }}
                    >
                        Previous
                    </Button>
                    <Button
                        variant='contained'
                        color='primary'
                        disableElevation
                        size='small'
                        disabled={!canNext || loading}
                        onClick={() => setOffset(offset + PAGE_SIZE)}
                    >
                        Next
                    </Button>
                </Box>
            </Box>

            <Dialog
                open={!!modalRow}
                onClose={() => setModalRow(null)}
                maxWidth='md'
                fullWidth
                aria-labelledby='audit-lifeline-detail-title'
            >
                <DialogTitle id='audit-lifeline-detail-title' disableTypography>
                    <Box display='flex' alignItems='center' justifyContent='space-between'>
                        <Typography variant='h6'>
                            {modalRow ? `${actionPhrase(modalRow)} — ${formatDateAndTime(modalRow.AuditDate)}` : ''}
                        </Typography>
                        <IconButton
                            aria-label='close'
                            onClick={() => setModalRow(null)}
                            size='small'
                        >
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    <Box mb={1}>
                        <Typography variant='body2'>
                            <strong>Actor:</strong> {modalRow ? actorLabel(modalRow) : ''}
                            {modalRow?.EmailAddress ? ` (${modalRow.EmailAddress})` : ''}
                        </Typography>
                        <Typography variant='body2'>
                            <strong>Audit ID:</strong> {modalRow?.idAudit ?? ''}
                            {modalRow?.CorrelationId ? ` · correlation ${modalRow.CorrelationId}` : ''}
                        </Typography>
                    </Box>
                    {(() => {
                        const structured = parseStructured(modalRow?.Data ?? null);
                        if (!structured) return null;
                        if (structured.kind === 'diff') {
                            return (
                                <Box mb={2}>
                                    <Typography variant='body2' style={{ fontWeight: 600, marginBottom: 4 }}>
                                        Changed fields ({structured.rows.length})
                                    </Typography>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.2)' }}>
                                                <th align='left' style={{ padding: '4px 8px', width: '25%' }}>Field</th>
                                                <th align='left' style={{ padding: '4px 8px', width: '37.5%' }}>Before</th>
                                                <th align='left' style={{ padding: '4px 8px', width: '37.5%' }}>After</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {structured.rows.map(r => (
                                                <tr key={r.field} style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                                                    <td style={{ padding: '4px 8px', verticalAlign: 'top', fontFamily: 'monospace' }}>
                                                        {r.field}
                                                    </td>
                                                    <td style={{ padding: '4px 8px', verticalAlign: 'top', whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'rgba(244,67,54,0.06)' }}>
                                                        {formatModalValue(r.before)}
                                                    </td>
                                                    <td style={{ padding: '4px 8px', verticalAlign: 'top', whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'rgba(76,175,80,0.08)' }}>
                                                        {formatModalValue(r.after)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </Box>
                            );
                        }
                        return (
                            <Box mb={2}>
                                <Typography variant='body2' style={{ fontWeight: 600, marginBottom: 4 }}>
                                    Snapshot ({structured.rows.length} field{structured.rows.length === 1 ? '' : 's'})
                                </Typography>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                    <tbody>
                                        {structured.rows.map(r => (
                                            <tr key={r.field} style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                                                <td style={{ padding: '4px 8px', verticalAlign: 'top', fontFamily: 'monospace', width: '25%' }}>
                                                    {r.field}
                                                </td>
                                                <td style={{ padding: '4px 8px', verticalAlign: 'top', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                                    {formatModalValue(r.value)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </Box>
                        );
                    })()}
                    <Typography variant='body2' style={{ fontWeight: 600, marginBottom: 4 }}>
                        Raw payload
                    </Typography>
                    <pre
                        style={{
                            margin: 0,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            fontSize: '12px',
                            background: 'rgba(0,0,0,0.04)',
                            padding: '8px',
                            borderRadius: '3px',
                        }}
                    >
                        {prettyJson(modalRow?.Data ?? null)}
                    </pre>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setModalRow(null)}
                        color='primary'
                        variant='contained'
                        disableElevation
                        style={{ color: '#fff' }}
                    >
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default AuditLifelineTable;
