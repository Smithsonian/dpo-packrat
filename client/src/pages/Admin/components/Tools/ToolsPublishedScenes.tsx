/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button } from '@material-ui/core';
import { toast } from 'react-toastify';
import { toastError } from '../../../../utils/toastError';
import API, { RequestResponse } from '../../../../api';
import { ColumnHeader, useStyles as useToolsStyles } from '../shared/DataTypesStyles';
import { DataTableSelect } from '../shared/DataTableSelect';

type PublishedSceneRow = {
    id: number;                 // idSystemObject — drives the details link and the row id
    name: string;
    name_link: string;
    publishedState: string;
    retired: string;
    edanUUID: string;
    _edanUUID: string | null;
};

const columns: ColumnHeader[] = [
    { key: 'name', label: 'Scene', align: 'left', link: true },
    { key: 'publishedState', label: 'Published State', align: 'center' },
    { key: 'retired', label: 'Retired', align: 'center' },
    { key: 'edanUUID', label: 'EDAN UUID', align: 'left' },
];

function ToolsPublishedScenes(): React.ReactElement {
    const classes = useToolsStyles();

    const [rows, setRows] = useState<PublishedSceneRow[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [total, setTotal] = useState<number>(0);
    const [orphanCount, setOrphanCount] = useState<number>(0);

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            const result: RequestResponse = await API.getPublishedScenes();
            if (!result?.success) {
                toastError(result, 'Failed to load published scenes');
                return;
            }
            const data = result.data ?? { scenes: [], total: 0, orphanCount: 0 };
            const mapped: PublishedSceneRow[] = (data.scenes ?? []).map((s: any) => ({
                id: s.idSystemObject,
                name: s.name ?? `Scene ${s.idScene}`,
                name_link: `/repository/details/${s.idSystemObject}`,
                publishedState: s.publishedState,
                retired: s.retired ? '⚠ Yes' : 'No',
                edanUUID: s.edanUUID ?? '',
                _edanUUID: s.edanUUID ?? null,
            }));
            setRows(mapped);
            setTotal(data.total ?? mapped.length);
            setOrphanCount(data.orphanCount ?? mapped.filter(m => m.retired.includes('Yes')).length);
        } catch (error) {
            console.error('[Packrat:ERROR] fetchPublishedScenes:', error);
            toast.error('Failed to load published scenes');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const noop = () => { /* DataTableSelect requires onUpdateSelection */ };

    return (
        <Box>
            <Typography variant='body1' gutterBottom>
                Scenes whose latest version is in a published EDAN state. Rows marked <b>⚠ Yes</b> under Retired are
                orphans — retired in Packrat but still live in EDAN — and should be unpublished from their details page.
            </Typography>
            <Typography variant='body2' gutterBottom>
                <b>{total}</b> published scene(s), <b>{orphanCount}</b> orphan(s).
            </Typography>

            <Box display='flex' mb={1}>
                <Button className={classes.btn} variant='contained' color='primary' onClick={fetchData}
                    style={{ width: 'auto', minWidth: 100, paddingLeft: 16, paddingRight: 16 }}
                >
                    Refresh
                </Button>
            </Box>

            <DataTableSelect
                columns={columns}
                data={rows}
                onUpdateSelection={noop}
                isLoading={isLoading}
                selectable={false}
                expandable
                renderExpanded={(row: PublishedSceneRow) => (
                    <Box p={1} display='flex' style={{ gap: 8 }}>
                        <Button size='small' variant='contained' color='primary' style={{ color: 'white' }}
                            onClick={() => { window.open(row.name_link, '_blank'); }}
                        >
                            Open in Repository
                        </Button>
                        <Button size='small' variant='contained' color='primary' style={{ color: 'white' }}
                            disabled={!row._edanUUID}
                            onClick={() => { if (row._edanUUID) { navigator.clipboard.writeText(row._edanUUID); toast.info('EDAN UUID copied'); } }}
                        >
                            Copy EDAN UUID
                        </Button>
                    </Box>
                )}
            />
        </Box>
    );
}

export default ToolsPublishedScenes;
