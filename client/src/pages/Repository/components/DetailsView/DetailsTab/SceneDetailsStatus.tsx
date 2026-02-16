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
    Tooltip,
    Typography,
    // Theme,
    createStyles
} from '@material-ui/core';
import { Edit, Sync } from '@material-ui/icons';
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
    edanRecordIdRaw?: EdanRecordIdRaw;
    // network: QCStatus;
}
interface QCRow {
    key: string;
    property: string;
    status: string;
    level: 'pass' | 'warn' | 'fail' | 'critical' | 'info';
    notes: string;
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
    // 'thumbnails',
    'baseModels',
    'downloads',
    'arModels',
    'captureData'
];

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

    const buildRows = useCallback((objectData: SceneQCData): QCRow[] => {
        return qcRowKeys.map((key) => {
            const row = objectData[key] as QCStatus;

            // adjust the publish one with a link, if available
            let publishedNotes: string | null = null;
            if(key==='published') {
                publishedNotes = row.notes;
                if(objectData.publishedUrl && objectData.publishedUrl.length>0)
                    publishedNotes += ` (<a href='${objectData.publishedUrl}'><b>Link</b></a>)`;
            }

            return {
                key: key as string,
                property: row.name,
                status: row.status,
                level: row.level,
                notes: (publishedNotes) ?? row.notes,
            };
        });
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response: RequestResponse = await API.getObjectDetailsStatus(props.idSceneSO);

                const objectData: SceneQCData = {
                    idSystemObject: response.data.idSystemObject,
                    idScene: response.data.idScene,
                    publishedUrl: response.data.publishedUrl,
                    published: response.data.published,
                    license: response.data.license,
                    reviewed: response.data.reviewed,
                    scale: response.data.scale,
                    thumbnails: response.data.thumbnails,
                    baseModels: response.data.baseModels,
                    downloads: response.data.downloads,
                    arModels: response.data.arModels,
                    captureData: response.data.captureData,
                    edanRecordId: response.data.edanRecordId,
                    edanRecordIdRaw: response.data.edanRecordIdRaw,
                };
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
            const updatedData: SceneQCData = {
                idSystemObject: statusResponse.data.idSystemObject,
                idScene: statusResponse.data.idScene,
                publishedUrl: statusResponse.data.publishedUrl,
                published: statusResponse.data.published,
                license: statusResponse.data.license,
                reviewed: statusResponse.data.reviewed,
                scale: statusResponse.data.scale,
                thumbnails: statusResponse.data.thumbnails,
                baseModels: statusResponse.data.baseModels,
                downloads: statusResponse.data.downloads,
                arModels: statusResponse.data.arModels,
                captureData: statusResponse.data.captureData,
                edanRecordId: statusResponse.data.edanRecordId,
                edanRecordIdRaw: statusResponse.data.edanRecordIdRaw,
            };
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
                                    {row.property}
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
        </div>
    );
};

export default SceneDetailsStatus;
