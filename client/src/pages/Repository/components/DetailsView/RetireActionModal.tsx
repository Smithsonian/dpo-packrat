/* eslint-disable react/jsx-max-props-per-line */
/**
 * RetireActionModal
 *
 * Two-phase modal for retiring/reinstating an object and its dependents. It first previews the
 * objects that will be touched (from `describe`), highlighting scenes that will be unpublished from
 * EDAN and any scope-guard blockers, then executes and shows a per-object result. On a partial EDAN
 * failure the operation aborts (nothing retired) and can be retried.
 *
 * The preview lists objects (Scene/Model/…); their attached asset files are retired with them but
 * summarized as a count rather than listed, to keep the list legible.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, Chip, Tooltip, CircularProgress,
    Table, TableHead, TableBody, TableRow, TableCell } from '@material-ui/core';
import { toast } from 'react-toastify';
import API from '../../../../api';

type ItemStatus = 'succeeded' | 'failed' | 'skipped' | 'notApplied';

export type ObjectActionSummary = {
    idSystemObject: number;
    objectType: string;
    name: string | null;
    kind: 'object' | 'asset';
    depth?: number;
    retired?: boolean;
    unit?: string | null;
    project?: string | null;
    subject?: string | null;
    publishedState?: string;
    edanUUID?: string | null;
    status?: ItemStatus;
    unpublishedFromEdan?: boolean;
    error?: string;
    blockerReason?: string;
};

type Phase = 'loading' | 'preview' | 'executing' | 'results';

interface RetireActionModalProps {
    open: boolean;
    idSystemObject: number;
    retire: boolean;                 // true = retire, false = reinstate
    onClose: () => void;
    onComplete: () => void;          // fired after a successful apply so the caller can refetch
}

const PUBLISHED = (s?: string): boolean => !!s && s !== 'Not Published';

function statusColor(status?: ItemStatus): string {
    switch (status) {
        case 'succeeded': return '#2e7d32';
        case 'failed':    return '#c62828';
        case 'skipped':   return '#757575';
        case 'notApplied':return '#ed6c02';
        default:          return '#757575';
    }
}

function RetireActionModal(props: RetireActionModalProps): React.ReactElement {
    const { open, idSystemObject, retire, onClose, onComplete } = props;
    const verb: string = retire ? 'Retire' : 'Reinstate';

    const [phase, setPhase] = useState<Phase>('loading');
    const [objects, setObjects] = useState<ObjectActionSummary[]>([]);
    const [blockers, setBlockers] = useState<ObjectActionSummary[]>([]);
    const [applied, setApplied] = useState<boolean>(false);
    const [message, setMessage] = useState<string>('');
    const [loadError, setLoadError] = useState<string>('');

    const loadPreview = useCallback(async () => {
        setPhase('loading');
        setLoadError('');
        const res = await API.objectAction(idSystemObject, 'describe');
        if (!res?.success || !res.data) {
            setLoadError(res?.message ?? 'Unable to load preview');
            setPhase('preview');
            return;
        }
        setObjects(res.data.objects ?? []);
        setBlockers(res.data.blockers ?? []);
        setPhase('preview');
    }, [idSystemObject]);

    useEffect(() => {
        if (open) {
            setObjects([]);
            setBlockers([]);
            setApplied(false);
            setMessage('');
            loadPreview();
        }
    }, [open, loadPreview]);

    const execute = async () => {
        setPhase('executing');
        const res = await API.objectAction(idSystemObject, retire ? 'retire' : 'reinstate');
        const resultObjects: ObjectActionSummary[] = res?.data?.objects ?? [];
        const statusById: Map<number, ObjectActionSummary> = new Map(resultObjects.map(o => [o.idSystemObject, o]));

        setObjects(prev => prev.map(o => {
            const r = statusById.get(o.idSystemObject);
            return r ? { ...o, status: r.status, error: r.error, unpublishedFromEdan: r.unpublishedFromEdan } : o;
        }));
        setApplied(!!res?.data?.applied);
        setMessage(res?.message ?? '');
        setPhase('results');

        if (res?.data?.applied) {
            toast.success(res.message ?? `${verb} succeeded`);
            onComplete();
        } else
            toast.error(res?.message ?? `${verb} failed`);
    };

    const showStatus: boolean = phase === 'results';
    const objectCount: number = objects.filter(o => o.kind === 'object').length;
    const assetCount: number = objects.filter(o => o.kind === 'asset').length;
    const sceneUnpublishCount: number = objects.filter(o => PUBLISHED(o.publishedState)).length;
    const succeededCount: number = objects.filter(o => o.status === 'succeeded').length;
    const errorCount: number = objects.filter(o => o.status === 'failed').length;

    // Show the full tree in the server's depth-first order; indentation (by depth) nests assets and
    // derived objects under their parent.
    const rows: ObjectActionSummary[] = objects;

    // Names shared by more than one row get a * so the user knows to hover for distinguishing context.
    const nameCounts: Map<string, number> = new Map<string, number>();
    rows.forEach(o => { const n = o.name ?? ''; nameCounts.set(n, (nameCounts.get(n) ?? 0) + 1); });
    const duplicateName = (name: string | null): boolean => !!name && (nameCounts.get(name) ?? 0) > 1;
    const hasDuplicates: boolean = Array.from(nameCounts.values()).some(c => c > 1);

    const renderState = (o: ObjectActionSummary): React.ReactElement | null => {
        if (showStatus) {
            return (
                <Box display='flex' alignItems='center' style={{ gap: 6 }}>
                    {o.status && (
                        <Tooltip arrow title={o.error ?? ''}>
                            <Chip label={o.status} size='small' style={{ color: '#fff', backgroundColor: statusColor(o.status) }} />
                        </Tooltip>
                    )}
                    {o.unpublishedFromEdan && o.status === 'notApplied' && (
                        <Tooltip arrow title='Unpublished from EDAN but not retired (operation aborted); rerun to finish.'>
                            <Chip label='EDAN unpublished' size='small' variant='outlined' />
                        </Tooltip>
                    )}
                </Box>
            );
        }
        if (retire && PUBLISHED(o.publishedState))
            return <Chip label={`Unpublish from EDAN (${o.publishedState})`} size='small' style={{ backgroundColor: '#fff3e0', color: '#ed6c02' }} />;
        if (o.publishedState)
            return <Typography variant='caption' style={{ color: '#757575' }}>{o.publishedState}</Typography>;
        return null;
    };

    return (
        <Dialog open={open} onClose={phase === 'executing' ? undefined : onClose} maxWidth='md' fullWidth>
            <DialogTitle>{verb} object and dependents</DialogTitle>
            <DialogContent dividers>
                {phase === 'loading' && (
                    <Box display='flex' alignItems='center' justifyContent='center' py={3} style={{ gap: 10 }}>
                        <CircularProgress size={22} /><Typography>Computing affected objects…</Typography>
                    </Box>
                )}

                {phase !== 'loading' && (
                    <>
                        {loadError && <Typography color='error' style={{ marginBottom: 8 }}>{loadError}</Typography>}

                        {/* Header: preview counts, or completion status */}
                        {showStatus ? (
                            <Typography variant='subtitle1' style={{ fontWeight: 600, color: applied ? '#2e7d32' : '#c62828', marginBottom: 4 }}>
                                {applied
                                    ? `✓ ${verb} complete — ${succeededCount} object(s) ${retire ? 'retired' : 'reinstated'}`
                                    : `✕ ${verb} failed — ${errorCount} error(s); no objects were ${retire ? 'retired' : 'reinstated'}`}
                            </Typography>
                        ) : (
                            <Typography variant='body2' style={{ marginBottom: 4 }}>
                                {verb} will affect {objectCount} object(s){assetCount > 0 ? ` and ${assetCount} asset(s)` : ''}.
                            </Typography>
                        )}

                        {message && showStatus && <Typography variant='caption' style={{ color: '#757575' }}>{message}</Typography>}

                        {retire && sceneUnpublishCount > 0 && !showStatus && (
                            <Typography variant='body2' style={{ color: '#ed6c02', marginBottom: 4 }}>
                                {sceneUnpublishCount} published scene(s) will be unpublished from EDAN.
                            </Typography>
                        )}

                        {blockers.length > 0 && (
                            <Box style={{ backgroundColor: '#fdecea', padding: 8, borderRadius: 4, margin: '8px 0' }}>
                                <Typography variant='body2' color='error' style={{ fontWeight: 600 }}>
                                    {blockers.length} container object(s) reached through an unexpected relationship — NOT retired:
                                </Typography>
                                {blockers.map(b => (
                                    <Typography key={b.idSystemObject} variant='caption' style={{ display: 'block' }}>
                                        {b.name ?? `SystemObject ${b.idSystemObject}`} ({b.objectType})
                                    </Typography>
                                ))}
                            </Box>
                        )}

                        <Box style={{ maxHeight: 380, overflowY: 'auto', marginTop: 8 }}>
                            <Table size='small' stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Object</TableCell>
                                        <TableCell style={{ width: 120 }}>Type</TableCell>
                                        <TableCell style={{ width: 240 }}>{showStatus ? 'Result' : 'State'}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {rows.map(o => {
                                        const depth: number = o.depth ?? 0;
                                        const ancestry: string = [o.subject, o.project, o.unit].filter(Boolean).join(' • ');
                                        const label: string = `${o.name ?? `SystemObject ${o.idSystemObject}`}${duplicateName(o.name) ? ' *' : ''}`;
                                        const nameEl = <Typography variant='body2' style={{ fontWeight: 500, wordBreak: 'break-word' }}>{label}</Typography>;
                                        return (
                                            <TableRow key={o.idSystemObject}>
                                                <TableCell>
                                                    <Box style={{ paddingLeft: depth * 16, display: 'flex', alignItems: 'flex-start' }}>
                                                        {depth > 1 && (
                                                            <Typography variant='body2' style={{ color: '#9e9e9e', marginRight: 6, userSelect: 'none', whiteSpace: 'nowrap' }}>└─</Typography>
                                                        )}
                                                        {ancestry ? <Tooltip arrow title={ancestry}>{nameEl}</Tooltip> : nameEl}
                                                    </Box>
                                                </TableCell>
                                                <TableCell>{o.objectType}</TableCell>
                                                <TableCell>{renderState(o)}</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </Box>
                        {rows.length > 0 && (
                            <Typography variant='caption' style={{ color: '#757575', display: 'block', marginTop: 6 }}>
                                Hover an object name to see its Subject • Project • Unit.{hasDuplicates ? ' * marks objects that share a name.' : ''}
                            </Typography>
                        )}
                    </>
                )}
            </DialogContent>
            <DialogActions>
                {phase === 'executing' && <CircularProgress size={20} style={{ marginRight: 8 }} />}
                {phase !== 'results' && (
                    <Button onClick={onClose} disabled={phase === 'executing'}>Cancel</Button>
                )}
                {phase === 'preview' && !loadError && (
                    <Button onClick={execute} variant='contained' color='primary' style={{ color: '#fff' }}>{verb}</Button>
                )}
                {phase === 'results' && !applied && (
                    <Button onClick={execute} variant='contained' color='primary' style={{ color: '#fff' }}>Retry</Button>
                )}
                {phase === 'results' && <Button onClick={onClose} color='primary'>Close</Button>}
            </DialogActions>
        </Dialog>
    );
}

export default RetireActionModal;
