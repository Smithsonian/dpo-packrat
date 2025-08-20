/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Button, Typography } from '@material-ui/core';
import API, { RequestResponse } from '../../../../api';
import { DataTableSelect } from '../shared/DataTableSelect';
import { ColumnHeader, DBReference } from '../shared/DataTypesStyles';

type Contact = DBReference & {
    email: string;
    unit: string;
    role: string;
    department: string;
};

const AdminContactView: React.FC = () => {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [selected, setSelected] = useState<Contact[]>([]);
    const [resetSelection, setResetSelection] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const normalize = (rows: any[]): Contact[] => {
    // Map server results to the shape DataTableSelect expects (must include id & name)
        return rows.map((c) => {
            const id = c?.idContact ?? -1;
            const name = c?.Name ?? 'NA';
            const unit = c?.idUnit ?? -1;
            const department = c?.Department ?? 'NA';
            const email = c?.EmailAddress ?? 'NA';
            const role = c?.Title ?? 'NA';

            return { id, name, email, unit, department, role } as Contact;
        }).filter((r) => r.id != null);
    };

    const fetchContacts = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const resp: RequestResponse = await API.request('api/contact', { method: 'GET' });
            if (!resp?.success) {
                setContacts([]);
                setError(resp?.message ?? 'Failed to fetch contacts.');
            } else {
                setContacts(normalize(resp.data ?? []));
            }
        } catch (e: any) {
            setError(`Unexpected error: ${e?.message ?? e}`);
            setContacts([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchContacts();
    }, [fetchContacts]);

    const columns: ColumnHeader[] = useMemo(
        () => [
            { key: 'id',        label: 'ID',        align: 'center', tooltip: 'System ID for the contact' },
            { key: 'name',      label: 'Name',      align: 'center', tooltip: 'Contact name' },
            { key: 'email',     label: 'Email',     align: 'center', tooltip: 'Primary email' },
            { key: 'unit',      label: 'Unit',      align: 'center', tooltip: 'Unit' },
            { key: 'department',label: 'Department',align: 'center', tooltip: 'Department' },
            { key: 'role',      label: 'Role',      align: 'center', tooltip: 'Title / Role' },
        ],
        []
    );

    const onUpdateSelection = (selection: Contact[]) => {
        setSelected(selection);
    };

    const onRefresh = () => {
    // keep UI snappy & clear selection to prevent acting on stale rows
        setResetSelection(true);
        setTimeout(() => setResetSelection(false), 0);
        fetchContacts();
    };

    return (
        <Box display='flex' flexDirection='column' style={{ gap: '1rem' }}>
            <Box display='flex' alignItems='center' justifyContent='space-between'>
                <Typography variant='h6'>Contacts</Typography>
                <Box>
                    <Button
                        variant='contained'
                        color='primary'
                        onClick={onRefresh}
                        disableElevation
                    >
                        Refresh
                    </Button>
                </Box>
            </Box>

            {error && (
                <Typography variant='body2' color='error'>
                    {error}
                </Typography>
            )}

            <DataTableSelect<Contact>
                onUpdateSelection={onUpdateSelection}
                data={contacts}
                columns={columns}
                resetSelection={resetSelection}
                isLoading={isLoading}
            />

            <Typography variant='caption' color='textSecondary'>
                Selected: {selected.length}
            </Typography>
        </Box>
    );
};

export default AdminContactView;
