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

interface QCStatus {
    name: string;
    status: string;
    level: 'pass' | 'warn' | 'fail' | 'critical' | 'info';
    notes: string;
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
    // network: QCStatus;
}
interface QCRow {
    property: string;
    status: string;
    level: 'pass' | 'warn' | 'fail' | 'critical' | 'info';
    notes: string;
}
interface SceneDetailsStatusProps {
    idSceneSO: number;
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

const SceneDetailsStatus = (props: SceneDetailsStatusProps): React.ReactElement => {
    const classes = useStyles();
    const [data, setData] = useState<SceneQCData | null>(null);
    const [rows, setRows] = useState<QCRow[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response: RequestResponse = await API.getObjectDetailsStatus(props.idSceneSO);
                console.log('response: ',response.data);

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
                    // network: response.data.network
                };
                setData(objectData);
                console.log('objectData: ',objectData);

                // define rows to be included in the table
                const qcRowKeys: (keyof SceneQCData)[] = [
                    'published',
                    'license',
                    'reviewed',
                    // 'thumbnails',
                    'baseModels',
                    'downloads',
                    'arModels',
                    'captureData'
                ];

                // map to rows
                const qcRows: QCRow[] = qcRowKeys.map((key) => {
                    const row = objectData[key] as QCStatus;

                    // adjust the publish one with a link, if available
                    let publishedNotes: string | null = null;
                    if(key==='published') {
                        publishedNotes = row.notes;
                        if(objectData.publishedUrl && objectData.publishedUrl.length>0)
                            publishedNotes += ` (<a href='${objectData.publishedUrl}'><b>Link</b></a>)`;
                    }

                    return {
                        property: row.name,
                        status: row.status,
                        level: row.level,
                        notes: (publishedNotes) ?? row.notes,
                    };
                });
                setRows(qcRows);
            } catch (err) {
                setError('Failed to load QC data');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [props.idSceneSO]);

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