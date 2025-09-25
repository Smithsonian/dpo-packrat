/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@material-ui/core';
import API from '../../../../api';
import { AdminContactForm } from './AdminContactForm';
import { DataTableSelect, DataTableSelectHandle } from '../shared/DataTableSelect';
import { ColumnHeader, DBReference } from '../shared/DataTypesStyles';
import { useContactStore } from '../../../../store/contact';

type Contact = DBReference & {
    email: string;
    unit: { idUnit: number; name: string; abbreviation: string };
    role: string;
    department: string;
};

const AdminContactView: React.FC = () => {
    const tableRef = useRef<DataTableSelectHandle<Contact>>(null);

    // ⬇️ store hooks
    const storeContacts = useContactStore((s) => s.all);
    const loadAll = useContactStore((s) => s.loadAll);

    // local UI state
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [resetSelection, setResetSelection] = useState<boolean>(false);
    const [createOpen, setCreateOpen] = useState(false);
    const [resetKey, setResetKey] = useState(0);
    const [unitsById, setUnitsById] = useState<Map<number, { name: string; abbreviation: string }>>(new Map());

    // columns
    const getColumnHeader = (): ColumnHeader[] => [
        { key: 'id', label: 'ID', align: 'center', tooltip: 'System ID for the contact' },
        { key: 'name', label: 'Name', align: 'center', tooltip: 'Contact name' },
        { key: 'email', label: 'Email', align: 'center', tooltip: 'Primary email' },
        { key: 'role', label: 'Role', align: 'center', tooltip: 'Title / Role' },
        { key: 'department', label: 'Department', align: 'center', tooltip: 'Department' },
        { key: 'unit.abbreviation', label: 'Unit', align: 'center', tooltip: 'Unit' },
    ];

    // translate store rows -> table rows, enriching unit labels
    const rows: Contact[] = useMemo(() => {
        if (!storeContacts?.length) return [];
        return storeContacts.map((c) => {
            const u = c.idUnit ? unitsById.get(c.idUnit) : undefined;
            return {
                id: c.idContact ?? -1,
                name: c.Name ?? 'NA',
                email: c.EmailAddress ?? 'NA',
                role: c.Title ?? 'NA',
                department: c.Department ?? 'NA',
                unit: {
                    idUnit: c.idUnit ?? -1,
                    name: u?.name ?? 'NA',
                    abbreviation: u?.abbreviation ?? 'NA',
                },
            };
        });
    }, [storeContacts, unitsById]);

    const refreshAll = useCallback(async () => {
        setIsLoading(true);
        try {
            // 1) hydrate contacts via store
            await loadAll();

            // 2) fetch units once & memoize a map for quick lookups
            const unitResp = await API.getUnits();
            const units = Array.isArray(unitResp?.data) ? unitResp.data : [];
            const map = new Map<number, { name: string; abbreviation: string }>();
            for (const u of units) {
                const id = Number(u?.idUnit);
                if (Number.isFinite(id)) {
                    map.set(id, {
                        name: String(u?.Name ?? 'NA'),
                        abbreviation: String(u?.Abbreviation ?? 'NA'),
                    });
                }
            }
            setUnitsById(map);
        } finally {
            setIsLoading(false);
        }
    }, [loadAll]);

    useEffect(() => {
        refreshAll();
    }, [refreshAll]);

    const expandedRowRenderer = (row: Contact): React.ReactNode => (
        <AdminContactForm
            mode='update'
            contact={{
                id: row.id,
                name: row.name,
                email: row.email,
                role: row.role,
                department: row.department,
                unit: row.unit,
            }}
            onUpdate={onRefresh}
        />
    );

    const onRefresh = () => {
        // clear selection & close expanded
        setResetSelection(true);
        setTimeout(() => setResetSelection(false), 0);
        tableRef.current?.closeAll();
        refreshAll();
    };
    const onRefreshClick = () => onRefresh();

    const onOpenCreate = () => setCreateOpen(true);
    const onCloseCreate = () => setCreateOpen(false);
    const onCreateFinished = (contact: Contact | null, status: 'create' | 'update') => {
        if (status === 'create' && contact?.id && contact.id > 0) {
            onCloseCreate();
            refreshAll();
        }
    };

    return (
        <Box display='flex' flexDirection='column' style={{ gap: '1rem', width: '95%' }}>
            <Box display='flex' alignItems='center' flexDirection='column'>
                <Typography variant='h6'>Contacts</Typography>
                <Typography align='center' style={{ padding: '1rem' }}>
                    This page lets administrators view, edit, and add contacts in a single interface. It provides a table of
                    existing contacts with inline editing and a modal form for creating new ones.
                </Typography>
            </Box>

            <DataTableSelect
                ref={tableRef}
                onUpdateSelection={() => {}}
                data={rows}
                columns={getColumnHeader()}
                resetSelection={resetSelection}
                isLoading={isLoading}
                selectable={false}
                expandable
                renderExpanded={expandedRowRenderer}
            />

            <Box display='flex' alignItems='center' justifyContent='center' style={{ marginTop: '-5rem' }}>
                <Button
                    variant='contained'
                    color='primary'
                    disableElevation
                    onClick={onRefreshClick}
                    style={{ margin: '1rem', color: 'white' }}
                >
                    Refresh
                </Button>
                <Button
                    variant='contained'
                    color='primary'
                    disableElevation
                    onClick={onOpenCreate}
                    style={{ margin: '1rem', color: 'white' }}
                >
                    Create
                </Button>
            </Box>

            <Dialog
                open={createOpen}
                onClose={onCloseCreate}
                aria-labelledby='create-contact-title'
                fullWidth
                maxWidth='md'
                keepMounted
                onExited={() => setResetKey((k) => k + 1)}
            >
                <DialogTitle id='create-contact-title'>Create Contact</DialogTitle>
                <DialogContent dividers>
                    <AdminContactForm key={resetKey} mode='create' onUpdate={onCreateFinished} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={onCloseCreate}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AdminContactView;
