/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Button, Typography } from '@material-ui/core';
// import API, { RequestResponse } from '../../../../api';
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
            // const resp: RequestResponse = await API.request('api/contact', { method: 'GET' });
            // if (!resp?.success) {
            //     setContacts([]);
            //     setError(resp?.message ?? 'Failed to fetch contacts.');
            // } else {
            //     setContacts(normalize(resp.data ?? []));
            // }
            const tempContacts = [
                { idContact: 1,  Name: 'Eric Maslowski',    idUnit: 24, Department: 'ODI',   EmailAddress: 'maslowskiec@si.edu',  Title: 'Project Lead' },
                { idContact: 2,  Name: 'Karen Osborn',      idUnit: 31, Department: 'NMNH',  EmailAddress: 'osbornk@si.edu',      Title: 'Research Scientist' },
                { idContact: 4,  Name: 'William Moser',     idUnit: 31, Department: 'NMNH',  EmailAddress: 'moserw@si.edu',       Title: 'Curator' },
                { idContact: 5,  Name: 'Yuuki Niimi',       idUnit: 42, Department: 'NMAH',  EmailAddress: 'niimiy@si.edu',       Title: 'Collections Specialist' },
                { idContact: 7,  Name: 'Chris Meyer',       idUnit: 31, Department: 'NMNH',  EmailAddress: 'meyerc@si.edu',       Title: 'Curator' },
                { idContact: 9,  Name: 'Catherine Maslowski', idUnit: 24, Department: 'ODI', EmailAddress: 'maslowskic@si.edu',   Title: 'Program Manager' },
                { idContact: 10, Name: 'David Johnson',     idUnit: 37, Department: 'NMAfA', EmailAddress: 'johnsond@si.edu',     Title: 'Archivist' },
                { idContact: 12, Name: 'Sarah Lee',         idUnit: 18, Department: 'NPG',   EmailAddress: 'lees@si.edu',         Title: 'Digital Media Specialist' },
                { idContact: 13, Name: 'James Smith',       idUnit: 19, Department: 'NMAI',  EmailAddress: 'smithj@si.edu',       Title: 'Registrar' },
                { idContact: 15, Name: 'Maria Garcia',      idUnit: 22, Department: 'HMSG',  EmailAddress: 'garciam@si.edu',      Title: 'Conservator' }
            ];
            setContacts(normalize(tempContacts ?? []));

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

    const expandedRowRenderer = (row): React.ReactNode => {
        console.log('expanded row renderer: ',row);
        // build a full UI for this row to display when expanded
        return (
            <>
                <strong>{row.name}</strong>
                <div style={{ marginTop: 8 }}>
                    <button onClick={(e) => { e.stopPropagation(); console.log('saving row: ',row); }}>
                        Update
                    </button>
                </div>
            </>
        );
    };
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
        <Box display='flex' flexDirection='column' style={{ gap: '1rem', width: '95%' }}>
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
                selectable={false}
                expandable
                renderExpanded={expandedRowRenderer}
            />

            <Typography variant='caption' color='textSecondary'>
                Selected: {selected.length}
            </Typography>
        </Box>
    );
};

export default AdminContactView;
