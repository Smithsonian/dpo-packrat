import React, { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
    // Theme,
    createStyles
} from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import { makeStyles } from '@material-ui/core/styles';
import API, { RequestResponse } from '../../../../../api';

// Define TypeScript interfaces
interface QCStatus {
    status: string;
    level: 'pass' | 'warn' | 'fail' | 'critical' | 'info';
    notes: string;
}

interface SceneQCData {
    idSystemObject: number,
    idScene: number,
    isLive: boolean;
    liveUrl: string;
    published: QCStatus;
    license: QCStatus;
    reviewed: QCStatus;
    scale: QCStatus;
    thumbnails: QCStatus;
    baseModels: QCStatus;
    downloads: QCStatus;
    captureData: QCStatus;
    arModels: QCStatus;
    network: QCStatus;
}

interface QCRow {
    property: string;
    status: string;
    level: 'pass' | 'warn' | 'fail' | 'critical' | 'info';
    notes: string;
}

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
            '& a': {
                color: '#1976d2',
                textDecoration: 'none',
                '&:hover': {
                    textDecoration: 'underline',
                },
            },
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
    })
);

interface SceneDetailsStatusProps {
    idScene: number;
}

const SceneDetailsStatus = (props: SceneDetailsStatusProps): React.ReactElement => {
    const classes = useStyles();
    const [data, setData] = useState<SceneQCData | null>(null);
    const [rows, setRows] = useState<QCRow[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response: RequestResponse = await API.getObjectDetailsStatus(props.idScene);
                console.log('response: ',response.data);

                const objectData: SceneQCData = {
                    idSystemObject: response.data.idSystemObject,
                    idScene: response.data.idScene,
                    isLive: response.data.isLive,
                    liveUrl: response.data.liveUrl,
                    published: response.data.published,
                    license: response.data.license,
                    reviewed: response.data.reviewed,
                    scale: response.data.scale,
                    thumbnails: response.data.thumbnails,
                    baseModels: response.data.baseModels,
                    downloads: response.data.downloads,
                    arModels: response.data.arModels,
                    captureData: response.data.captureData,
                    network: response.data.network
                };
                setData(objectData);
                console.log('objectData: ',objectData);

                // map to rows
                const qcRows: QCRow[] = [
                    {
                        property: 'Is Live',
                        status: objectData.isLive ? 'Live' : 'Not Live',
                        level: objectData.isLive ? 'pass' : 'warn',
                        notes: objectData.isLive && objectData.liveUrl
                            ? `<a href="${objectData.liveUrl}" target="_blank" rel="noopener noreferrer">View on 3d.si.edu</a>`
                            : 'Scene is not currently live'
                    },
                    {
                        property: 'Published',
                        status: objectData.published.status,
                        level: objectData.published.level,
                        notes: objectData.published.notes
                    },
                    {
                        property: 'License',
                        status: objectData.license.status,
                        level: objectData.license.level,
                        notes: objectData.license.notes
                    },
                    {
                        property: 'Scene was Reviewed',
                        status: objectData.reviewed.status,
                        level: objectData.reviewed.level,
                        notes: objectData.reviewed.notes
                    },
                    {
                        property: 'Scene Scale',
                        status: objectData.scale.status,
                        level: objectData.scale.level,
                        notes: objectData.scale.notes
                    },
                    {
                        property: 'Thumbnails',
                        status: objectData.thumbnails.status,
                        level: objectData.thumbnails.level,
                        notes: objectData.thumbnails.notes
                    },
                    {
                        property: 'Base Models',
                        status: objectData.baseModels.status,
                        level: objectData.baseModels.level,
                        notes: objectData.baseModels.notes
                    },
                    {
                        property: 'Downloads',
                        status: objectData.downloads.status,
                        level: objectData.downloads.level,
                        notes: objectData.downloads.notes
                    },
                    {
                        property: 'Capture Data',
                        status: objectData.captureData.status,
                        level: objectData.captureData.level,
                        notes: objectData.captureData.notes
                    },
                    {
                        property: 'AR Models',
                        status: objectData.arModels.status,
                        level: objectData.arModels.level,
                        notes: objectData.arModels.notes
                    },
                    {
                        property: 'Network',
                        status: objectData.network.status,
                        level: objectData.network.level,
                        notes: objectData.network.notes
                    }
                ];
                setRows(qcRows);
            } catch (err) {
                setError('Failed to load QC data');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [props.idScene]);

    const getStatusClass = (level: 'pass' | 'warn' | 'fail' | 'critical' | 'info') => {
        switch (level) {
            case 'fail': return 'error';
            case 'warn': return 'warning';
            case 'pass': return 'pass';
            case 'critical': return 'critical';
            default: return 'info';
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
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    );
};

export default SceneDetailsStatus;