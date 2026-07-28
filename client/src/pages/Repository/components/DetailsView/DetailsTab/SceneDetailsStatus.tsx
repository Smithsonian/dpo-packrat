import React, { useState, useEffect, useCallback } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    TextField,
    Button,
    MenuItem,
    Tooltip,
    Typography,
    // Theme,
    createStyles
} from '@material-ui/core';
import { Edit, Sync, CheckCircleOutline, Straighten } from '@material-ui/icons';
import { Alert } from '@material-ui/lab';
import { makeStyles } from '@material-ui/core/styles';
import API, { RequestResponse } from '../../../../../api';

interface QCStatus {
    name: string;
    status: string;
    level: 'pass' | 'warn' | 'fail' | 'critical' | 'info';
    notes: string;
}
interface EdanRecordIdRaw {
    svx: string | null;
    db: string | null;
    subjectCount: number;
}
interface ScaleRaw {
    bboxState: string;
    currentUnits?: string | null;
    modelUnits?: string | null;
    realMeters?: number;
    intendedUnits?: string;
    multiModel?: boolean;
    canFix?: boolean;
    bboxMinMeters?: number[];
    bboxMaxMeters?: number[];
    bboxSizeMeters?: number[];
}
interface SceneQCData {
    idSystemObject: number,
    idScene: number,
    publishedUrl: string;
    published: QCStatus;
    license: QCStatus;
    reviewed: QCStatus;
    scale: QCStatus;
    thumbnails: QCStatus;
    baseModels: QCStatus;
    downloads: QCStatus;
    captureData: QCStatus;
    arModels: QCStatus;
    edanRecordId: QCStatus;
    edanUUID: QCStatus;
    edanRecordIdRaw?: EdanRecordIdRaw;
    scaleRaw?: ScaleRaw;
    // network: QCStatus;
}
interface QCRow {
    key: string;
    property: string;
    status: string;
    level: 'pass' | 'warn' | 'fail' | 'critical' | 'info';
    notes: string;
    tooltip: string;
}
interface SceneDetailsStatusProps {
    idSceneSO: number;
    refreshTick?: number;
    onUpdate?: () => void;
}

// row keys in display order
const qcRowKeys: (keyof SceneQCData)[] = [
    'published',
    'license',
    'reviewed',
    'edanRecordId',
    'edanUUID',
    // 'thumbnails',
    'baseModels',
    'scale',
    'downloads',
    'arModels',
    'captureData'
];

const qcRowTooltips: Record<string, string> = {
    published: 'Current publication state of this scene on EDAN/3d.si.edu',
    license: 'License assigned to this scene and whether it permits publishing and downloads',
    reviewed: 'Whether the scene has been marked as reviewed (QC\'d) by a team member',
    edanRecordId: 'EDAN Record ID linking this scene to its subject in the EDAN catalog',
    edanUUID: 'Unique identifier used by EDAN to reference this scene\'s 3D package',
    thumbnails: 'Presence of generated thumbnail images for this scene',
    baseModels: 'Base 3D models (master geometry) linked to this scene',
    scale: 'Whether the scene\'s Voyager display units are plausible for the model\'s real-world size',
    downloads: 'Generated download packages (GLB, OBJ, USDZ) for public distribution',
    arModels: 'AR-ready models (WebXR and native) for augmented reality viewing',
    captureData: 'Source capture datasets (photogrammetry, CT, etc.) linked to this scene',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapSceneQCData = (d: any): SceneQCData => ({
    idSystemObject: d.idSystemObject,
    idScene: d.idScene,
    publishedUrl: d.publishedUrl,
    published: d.published,
    license: d.license,
    reviewed: d.reviewed,
    scale: d.scale,
    thumbnails: d.thumbnails,
    baseModels: d.baseModels,
    downloads: d.downloads,
    arModels: d.arModels,
    captureData: d.captureData,
    edanRecordId: d.edanRecordId,
    edanUUID: d.edanUUID,
    edanRecordIdRaw: d.edanRecordIdRaw,
    scaleRaw: d.scaleRaw,
});

const UNIT_OPTIONS: string[] = ['mm', 'cm', 'm', 'km', 'in', 'ft', 'yd', 'mi'];
const fmtVec = (v?: number[] | null): string =>
    Array.isArray(v) && v.length >= 3 ? `(${v.map(n => (Number.isFinite(n) ? String(Number(n.toFixed(4))) : '?')).join(', ')})` : '—';

// Define styles
const useStyles = makeStyles(() =>
    createStyles({
        tableContainer: {
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            overflow: 'hidden',
        },
        tableHeader: {
            backgroundColor: '#f5f7fa',
            '& th': {
                fontWeight: 600,
                color: '#333',
                fontSize: '0.875rem',
            },
        },
        statusCell: {
            fontWeight: 500,
            textTransform: 'capitalize',
            '&.error': { backgroundColor: '#ffebee', color: '#c62828' },
            '&.warning': { backgroundColor: '#fff8e1', color: '#f57f17' },
            '&.pass': { backgroundColor: '#e8f5e9', color: '#2e7d32' },
            '&.critical': { backgroundColor: '#ffcdd2', color: '#b71c1c', fontWeight: 600 },
            '&.info': { backgroundColor: '#e3f2fd', color: '#1565c0' },
        },
        notesCell: {
            maxWidth: '20rem',
            wordWrap: 'normal',
            '& a': {
                color: '#1976d2',
                textDecoration: 'none',
                '&:hover': {
                    textDecoration: 'underline',
                },
            },
        },
        actionsCell: {
            width: 80,
            textAlign: 'center',
            padding: '4px 8px',
        },
        title: {
            marginBottom: 16,
            fontWeight: 600,
            color: '#333',
        },
        loadingContainer: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: 200,
        },
        dialogFieldRow: {
            display: 'flex',
            alignItems: 'center',
            gap: 8,
        },
    })
);

const SceneDetailsStatus = (props: SceneDetailsStatusProps): React.ReactElement => {
    const classes = useStyles();
    const [data, setData] = useState<SceneQCData | null>(null);
    const [rows, setRows] = useState<QCRow[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // dialog state
    const [dialogOpen, setDialogOpen] = useState<boolean>(false);
    const [edanRecordIdValue, setEdanRecordIdValue] = useState<string>('');
    const [saving, setSaving] = useState<boolean>(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    // verify/approve dialog state (date-flagged AR + Downloads)
    const [approveOpen, setApproveOpen] = useState<boolean>(false);
    const [approveKind, setApproveKind] = useState<'ar' | 'downloads'>('ar');
    const [approveReason, setApproveReason] = useState<string>('');
    const [approveSaving, setApproveSaving] = useState<boolean>(false);
    const [approveError, setApproveError] = useState<string | null>(null);

    // fix display-units dialog state
    const [scaleOpen, setScaleOpen] = useState<boolean>(false);
    const [scaleUnit, setScaleUnit] = useState<string>('m');
    const [scaleSaving, setScaleSaving] = useState<boolean>(false);
    const [scaleError, setScaleError] = useState<string | null>(null);

    const buildRows = useCallback((objectData: SceneQCData): QCRow[] => {
        return qcRowKeys.map((key) => {
            const row = objectData[key] as QCStatus;

            // adjust the publish one with a link, if available
            let publishedNotes: string | null = null;
            if(key==='published') {
                publishedNotes = row.notes;
                if(objectData.publishedUrl && objectData.publishedUrl.length>0)
                    publishedNotes += ` (<a href='${objectData.publishedUrl}' target='_blank' rel='noopener noreferrer'><b>Link</b></a>)`;
            }

            return {
                key: key as string,
                property: row.name,
                status: row.status,
                level: row.level,
                notes: (publishedNotes) ?? row.notes,
                tooltip: qcRowTooltips[key as string] ?? '',
            };
        });
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response: RequestResponse = await API.getObjectDetailsStatus(props.idSceneSO);

                const objectData: SceneQCData = mapSceneQCData(response.data);
                setData(objectData);
                setRows(buildRows(objectData));
            } catch (err) {
                setError('Failed to load QC data');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [props.idSceneSO, props.refreshTick, buildRows]);

    const getStatusClass = (level: 'pass' | 'warn' | 'fail' | 'critical' | 'info') => {
        switch (level) {
            case 'fail': return 'error';
            case 'warn': return 'warning';
            case 'pass': return 'pass';
            case 'critical': return 'critical';
            default: return 'info';
        }
    };

    const handleOpenDialog = () => {
        setEdanRecordIdValue(data?.edanRecordIdRaw?.svx ?? '');
        setSaveError(null);
        setDialogOpen(true);
    };

    const handleCancel = () => {
        setDialogOpen(false);
        setSaveError(null);
        setEdanRecordIdValue('');
    };

    const handleSyncFromDb = () => {
        setEdanRecordIdValue(data?.edanRecordIdRaw?.db ?? '');
    };

    const handleApply = async () => {
        if (!data || !edanRecordIdValue.trim()) return;
        setSaving(true);
        setSaveError(null);
        try {
            const patchResponse: RequestResponse = await API.patchObject(data.idSystemObject, { edanRecordId: edanRecordIdValue.trim() });
            if (!patchResponse.success) {
                setSaveError(patchResponse.message ?? 'Failed to update EDAN Record ID');
                return;
            }

            // re-fetch full status to rebuild all rows
            const statusResponse: RequestResponse = await API.getObjectDetailsStatus(props.idSceneSO);
            const updatedData: SceneQCData = mapSceneQCData(statusResponse.data);
            setData(updatedData);
            setRows(buildRows(updatedData));
            setDialogOpen(false);
            setEdanRecordIdValue('');
            props.onUpdate?.();
        } catch (err) {
            setSaveError('An unexpected error occurred');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleOpenScale = () => {
        setScaleUnit(data?.scaleRaw?.intendedUnits ?? data?.scaleRaw?.currentUnits ?? 'm');
        setScaleError(null);
        setScaleOpen(true);
    };

    const handleCancelScale = () => {
        setScaleOpen(false);
        setScaleError(null);
    };

    const handleApplyScale = async () => {
        if (!data || !scaleUnit) return;
        setScaleSaving(true);
        setScaleError(null);
        try {
            const patchResponse: RequestResponse = await API.patchObject(data.idSystemObject, { units: scaleUnit });
            if (!patchResponse.success) {
                setScaleError(patchResponse.message ?? 'Failed to update scene units');
                return;
            }

            // re-fetch full status to rebuild all rows
            const statusResponse: RequestResponse = await API.getObjectDetailsStatus(props.idSceneSO);
            const updatedData: SceneQCData = mapSceneQCData(statusResponse.data);
            setData(updatedData);
            setRows(buildRows(updatedData));
            setScaleOpen(false);
            props.onUpdate?.();
        } catch (err) {
            setScaleError('An unexpected error occurred');
            console.error(err);
        } finally {
            setScaleSaving(false);
        }
    };

    const handleOpenApprove = (kind: 'ar' | 'downloads') => {
        setApproveKind(kind);
        setApproveReason('');
        setApproveError(null);
        setApproveOpen(true);
    };

    const handleCancelApprove = () => {
        setApproveOpen(false);
        setApproveError(null);
        setApproveReason('');
    };

    const handleApplyApprove = async () => {
        if (!data) return;
        setApproveSaving(true);
        setApproveError(null);
        try {
            const field: string = approveKind === 'ar' ? 'approveARModels' : 'approveDownloadModels';
            const patchResponse: RequestResponse = await API.patchObject(data.idSystemObject, { [field]: { reason: approveReason.trim() } });
            if (!patchResponse.success) {
                setApproveError(patchResponse.message ?? 'Failed to record approval');
                return;
            }

            // re-fetch full status to rebuild all rows (server returns the row as "Verified")
            const statusResponse: RequestResponse = await API.getObjectDetailsStatus(props.idSceneSO);
            const updatedData: SceneQCData = mapSceneQCData(statusResponse.data);
            setData(updatedData);
            setRows(buildRows(updatedData));
            setApproveOpen(false);
            setApproveReason('');
            props.onUpdate?.();
        } catch (err) {
            setApproveError('An unexpected error occurred');
            console.error(err);
        } finally {
            setApproveSaving(false);
        }
    };

    if (loading) {
        return (
            <div className={classes.loadingContainer}>
                <CircularProgress />
            </div>
        );
    }

    if (error) {
        return <Alert severity='error'>{error}</Alert>;
    }

    if (!data) {
        return <Alert severity='warning'>No data available</Alert>;
    }

    return (
        <div>
            <TableContainer component={Paper} className={classes.tableContainer}>
                <Table>
                    <TableHead className={classes.tableHeader}>
                        <TableRow>
                            <TableCell>Property/Test</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Notes</TableCell>
                            <TableCell className={classes.actionsCell}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows && rows.map((row, index) => (
                            <TableRow key={index} hover>
                                <TableCell component='th' scope='row'>
                                    <Tooltip title={row.tooltip} placement='right' arrow>
                                        <span>{row.property}</span>
                                    </Tooltip>
                                </TableCell>
                                <TableCell className={`${classes.statusCell} ${getStatusClass(row.level)}`}>
                                    {row.status}
                                </TableCell>
                                <TableCell
                                    className={classes.notesCell}
                                    dangerouslySetInnerHTML={{ __html: row.notes }}
                                />
                                <TableCell className={classes.actionsCell}>
                                    {row.key === 'edanRecordId' && (
                                        <Tooltip title='Edit EDAN Record ID'>
                                            <IconButton size='small' onClick={handleOpenDialog}>
                                                <Edit fontSize='small' />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                    {(row.key === 'arModels' || row.key === 'downloads') && row.status === 'Outdated' && (
                                        <Tooltip title='Verify / Approve'>
                                            <IconButton size='small' onClick={() => handleOpenApprove(row.key === 'arModels' ? 'ar' : 'downloads')}>
                                                <CheckCircleOutline fontSize='small' />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                    {row.key === 'scale' && (
                                        <Tooltip title='Set Display Units'>
                                            <IconButton size='small' onClick={handleOpenScale}>
                                                <Straighten fontSize='small' />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={dialogOpen} onClose={handleCancel} maxWidth='sm' fullWidth>
                <DialogTitle>Edit EDAN Record ID</DialogTitle>
                <DialogContent>
                    {data?.edanRecordIdRaw?.db && (
                        <Typography variant='body2' style={{ marginBottom: 8 }}>
                            <strong>DB Subject identifier:</strong> {data.edanRecordIdRaw.db}
                        </Typography>
                    )}
                    <div className={classes.dialogFieldRow}>
                        <TextField
                            variant='outlined'
                            size='small'
                            fullWidth
                            placeholder='e.g. edanmdm:nmnhanthro_123456'
                            value={edanRecordIdValue}
                            onChange={(e) => setEdanRecordIdValue(e.target.value)}
                            disabled={saving}
                        />
                        <Tooltip title='Pull from DB Subject identifier'>
                            <span>
                                <IconButton
                                    size='small'
                                    onClick={handleSyncFromDb}
                                    disabled={saving || !data?.edanRecordIdRaw?.db}
                                >
                                    <Sync fontSize='small' />
                                </IconButton>
                            </span>
                        </Tooltip>
                    </div>
                    <Typography variant='caption' color='textSecondary' style={{ marginTop: 4, display: 'block' }}>
                        Multi-subject scenes require &apos;edanlists:&apos; prefix
                    </Typography>
                    {saveError && (
                        <Alert severity='error' style={{ marginTop: 8 }}>{saveError}</Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancel} disabled={saving}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleApply}
                        color='primary'
                        variant='contained'
                        disabled={saving || !edanRecordIdValue.trim()}
                        style={{ color: 'white' }}
                    >
                        {saving ? <CircularProgress size={20} /> : 'Apply'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={approveOpen} onClose={handleCancelApprove} maxWidth='sm' fullWidth>
                <DialogTitle>Verify {approveKind === 'ar' ? 'AR Models' : 'Download Models'}</DialogTitle>
                <DialogContent>
                    <Typography variant='body2' style={{ marginBottom: 8 }}>
                        These derivatives were generated before the 2024-06-14 Cook material fix, so
                        Packrat flags them as possibly outdated. This is a <strong>date check</strong>,
                        not a detected defect &mdash; the assets may be fine. Approving records a QA
                        sign-off and clears the warning; it does not modify the assets.
                    </Typography>
                    <TextField
                        variant='outlined'
                        size='small'
                        fullWidth
                        multiline
                        rows={2}
                        label='Reason (optional)'
                        placeholder='Optional note recorded with this approval'
                        value={approveReason}
                        onChange={(e) => setApproveReason(e.target.value)}
                        disabled={approveSaving}
                    />
                    {approveError && (
                        <Alert severity='error' style={{ marginTop: 8 }}>{approveError}</Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancelApprove} disabled={approveSaving}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleApplyApprove}
                        color='primary'
                        variant='contained'
                        disabled={approveSaving}
                        style={{ color: 'white' }}
                    >
                        {approveSaving ? <CircularProgress size={20} /> : 'Approve / Verify'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={scaleOpen}
                onClose={handleCancelScale}
                maxWidth='sm'
                fullWidth
                PaperProps={{ style: { maxWidth: 630 } }}
            >
                <DialogTitle>Set Display Units</DialogTitle>
                <DialogContent>
                    <Typography variant='body2' style={{ marginBottom: 16 }}>
                        The display units for a Voyager scene help with user navigation (zooming, rotating, measurement) and should match the object&apos;s relative size.
                    </Typography>
                    <Typography component='div' variant='body2' style={{ marginBottom: 32 }}>
                        <table style={{ borderCollapse: 'collapse' }}>
                            <tbody>
                                <tr>
                                    <td style={{ paddingRight: 16, verticalAlign: 'top' }}><strong>Current display units</strong></td>
                                    <td>{data?.scaleRaw?.currentUnits ?? 'unset'}</td>
                                </tr>
                                <tr>
                                    <td style={{ paddingRight: 16, verticalAlign: 'top' }}><strong>Adjusted bbox size</strong></td>
                                    <td>{fmtVec(data?.scaleRaw?.bboxSizeMeters)} m</td>
                                </tr>
                                <tr>
                                    <td style={{ paddingRight: 16, verticalAlign: 'top' }}><strong>Suggested unit</strong></td>
                                    <td>{data?.scaleRaw?.intendedUnits ?? '—'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </Typography>
                    <TextField
                        select
                        variant='outlined'
                        size='small'
                        fullWidth
                        label='Display units'
                        value={scaleUnit}
                        onChange={(e) => setScaleUnit(e.target.value)}
                        disabled={scaleSaving}
                    >
                        {UNIT_OPTIONS.map((u) => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                    </TextField>
                    <Typography variant='caption' color='textSecondary' style={{ display: 'block', marginTop: 8 }}>
                        Applying rewrites the scene&apos;s units in the SVX as a new asset version; the geometry is unchanged.
                    </Typography>
                    {scaleError && (
                        <Alert severity='error' style={{ marginTop: 8 }}>{scaleError}</Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancelScale} disabled={scaleSaving}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleApplyScale}
                        color='primary'
                        variant='contained'
                        disabled={scaleSaving || !scaleUnit}
                        style={{ color: 'white' }}
                    >
                        {scaleSaving ? <CircularProgress size={20} /> : 'Apply'}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default SceneDetailsStatus;
