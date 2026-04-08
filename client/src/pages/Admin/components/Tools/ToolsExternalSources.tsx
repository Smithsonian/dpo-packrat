/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button, TextField, Switch, FormControlLabel, Dialog, DialogTitle, DialogContent, DialogActions } from '@material-ui/core';
import { toast } from 'react-toastify';
import API, { RequestResponse } from '../../../../api';
import { ColumnHeader, useStyles as useToolsStyles } from '../shared/DataTypesStyles';
import { DataTableSelect } from '../shared/DataTableSelect';

type ExternalSourceRow = {
    id: number;
    name: string;
    clientId: string;
    contactName: string;
    referrerPattern: string;
    isActive: string;
    dateCreated: string;
    // raw values for editing
    _idExternalSource: number;
    _idContact: number | null;
    _isActive: boolean;
    _referrerPattern: string | null;
};

const columns: ColumnHeader[] = [
    { key: 'name', label: 'Name', align: 'left' },
    { key: 'clientId', label: 'Client ID', align: 'left' },
    { key: 'contactName', label: 'Contact', align: 'center' },
    { key: 'referrerPattern', label: 'Referrer Pattern', align: 'left' },
    { key: 'isActive', label: 'Active', align: 'center' },
    { key: 'dateCreated', label: 'Created', align: 'center' },
];

function ToolsExternalSources(): React.ReactElement {
    const classes = useToolsStyles();

    const [rows, setRows] = useState<ExternalSourceRow[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Add form state
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [addName, setAddName] = useState('');
    const [addReferrer, setAddReferrer] = useState('');

    // Edit form state
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [editRow, setEditRow] = useState<ExternalSourceRow | null>(null);
    const [editName, setEditName] = useState('');
    const [editReferrer, setEditReferrer] = useState('');
    const [editActive, setEditActive] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            const result: RequestResponse = await API.getExternalSources();
            if (!result.success) {
                toast.error(result.message ?? 'Failed to load external sources');
                return;
            }
            const sources = result.data ?? [];
            const mapped: ExternalSourceRow[] = sources.map((s: any) => ({
                id: s.idExternalSource,
                name: s.Name,
                clientId: s.ClientId,
                contactName: s.ContactName ?? '',
                referrerPattern: s.ReferrerPattern ?? '',
                isActive: s.isActive ? 'Yes' : 'No',
                dateCreated: s.DateCreated ? new Date(s.DateCreated).toLocaleDateString() : '',
                _idExternalSource: s.idExternalSource,
                _idContact: s.idContact,
                _isActive: s.isActive,
                _referrerPattern: s.ReferrerPattern,
            }));
            setRows(mapped);
        } catch (error) {
            console.error('[Packrat:ERROR] fetchExternalSources:', error);
            toast.error('Failed to load external sources');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleAdd = async () => {
        if (!addName.trim()) {
            toast.warn('Name is required');
            return;
        }
        try {
            const result: RequestResponse = await API.createExternalSource({
                Name: addName.trim(),
                ReferrerPattern: addReferrer.trim() || null,
            });
            if (!result.success) {
                toast.error(result.message ?? 'Failed to create external source');
                return;
            }
            const newSource = result.data;
            if (newSource) {
                toast.success(`Created "${newSource.Name}" — Client ID: ${newSource.ClientId}`);
            }
            setShowAddDialog(false);
            setAddName('');
            setAddReferrer('');
            fetchData();
        } catch (error: any) {
            toast.error(`Failed to create: ${error.message ?? 'unknown error'}`);
        }
    };

    const openEdit = (row: ExternalSourceRow) => {
        setEditRow(row);
        setEditName(row.name);
        setEditReferrer(row._referrerPattern ?? '');
        setEditActive(row._isActive);
        setShowEditDialog(true);
    };

    const handleUpdate = async () => {
        if (!editRow) return;
        if (!editName.trim()) {
            toast.warn('Name is required');
            return;
        }
        try {
            const result: RequestResponse = await API.updateExternalSource(editRow._idExternalSource, {
                Name: editName.trim(),
                ReferrerPattern: editReferrer.trim() || null,
                isActive: editActive,
            });
            if (!result.success) {
                toast.error(result.message ?? 'Failed to update external source');
                return;
            }
            toast.success('External source updated');
            setShowEditDialog(false);
            setEditRow(null);
            fetchData();
        } catch (error: any) {
            toast.error(`Failed to update: ${error.message ?? 'unknown error'}`);
        }
    };

    const handleToggleActive = async (row: ExternalSourceRow) => {
        try {
            const result: RequestResponse = await API.updateExternalSource(row._idExternalSource, {
                isActive: !row._isActive,
            });
            if (!result.success) {
                toast.error(result.message ?? 'Failed to toggle active state');
                return;
            }
            toast.success(`${row.name} ${row._isActive ? 'deactivated' : 'activated'}`);
            fetchData();
        } catch (error: any) {
            toast.error(`Failed to toggle: ${error.message ?? 'unknown error'}`);
        }
    };

    const noop = () => { /* DataTableSelect requires onUpdateSelection */ };

    return (
        <Box>
            <Typography variant='body1' gutterBottom>
                Manage approved external systems that can access Packrat preview pages and other external integrations.
            </Typography>

            <Box display='flex' mb={1}>
                <Button className={classes.btn} variant='contained' color='primary' onClick={() => setShowAddDialog(true)}
                    style={{ width: 'auto', minWidth: 100, paddingLeft: 16, paddingRight: 16 }}
                >
                    Add Source
                </Button>
                <Button className={classes.btn} variant='contained' color='primary' onClick={fetchData}
                    style={{ marginLeft: 8 }}
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
                renderExpanded={(row: ExternalSourceRow) => (
                    <Box p={1} display='flex' style={{ gap: 8 }}>
                        <Button size='small' variant='contained' color='primary' style={{ color: 'white' }}
                            onClick={() => openEdit(row)}
                        >Edit</Button>
                        <Button size='small' variant='contained'
                            style={row._isActive ? { backgroundColor: '#c62828', color: 'white' } : { color: 'white' }}
                            color={row._isActive ? 'inherit' : 'primary'}
                            onClick={() => handleToggleActive(row)}
                        >
                            {row._isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button size='small' variant='contained' color='primary' style={{ color: 'white' }}
                            onClick={() => { navigator.clipboard.writeText(row.clientId); toast.info('Client ID copied'); }}
                        >
                            Copy Client ID
                        </Button>
                    </Box>
                )}
            />

            {/* Add Dialog */}
            <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)} maxWidth='sm' fullWidth>
                <DialogTitle>Add External Source</DialogTitle>
                <DialogContent>
                    <TextField label='Name' value={addName} onChange={e => setAddName(e.target.value)}
                        fullWidth margin='dense' required autoFocus
                    />
                    <TextField label='Referrer Pattern' value={addReferrer} onChange={e => setAddReferrer(e.target.value)}
                        fullWidth margin='dense' helperText='Optional URL pattern for referrer validation'
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowAddDialog(false)}>Cancel</Button>
                    <Button onClick={handleAdd} color='primary' variant='contained'>Create</Button>
                </DialogActions>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={showEditDialog} onClose={() => setShowEditDialog(false)} maxWidth='sm' fullWidth>
                <DialogTitle>Edit External Source</DialogTitle>
                <DialogContent>
                    <TextField label='Client ID' value={editRow?.clientId ?? ''} fullWidth margin='dense'
                        disabled
                    />
                    <TextField label='Name' value={editName} onChange={e => setEditName(e.target.value)}
                        fullWidth margin='dense' required
                    />
                    <TextField label='Referrer Pattern' value={editReferrer} onChange={e => setEditReferrer(e.target.value)}
                        fullWidth margin='dense'
                    />
                    <FormControlLabel
                        control={<Switch checked={editActive} onChange={e => setEditActive(e.target.checked)} color='primary' />}
                        label='Active'
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowEditDialog(false)}>Cancel</Button>
                    <Button onClick={handleUpdate} color='primary' variant='contained'>Save</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default ToolsExternalSources;
