/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useEffect, useState } from 'react';
import { Box, Typography } from '@material-ui/core';
// import API, { RequestResponse } from '../../../../api';
import { AdminContactForm } from './AdminContactForm';
import { DataTableSelect } from '../shared/DataTableSelect';
import { ColumnHeader, DBReference } from '../shared/DataTypesStyles';

type Contact = DBReference & {
    email: string;
    unit: {
        idUnit: number,
        name: string,
        abbreviation: string
    };
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
            if(!c) return null;

            const id = c.idContact ?? -1;
            const name = c.Name ?? 'NA';
            const department = c.Department ?? 'NA';
            const email = c.EmailAddress ?? 'NA';
            const role = c.Title ?? 'NA';
            const unit = {
                idUnit: c.Unit.idUnit ?? -1,
                name: c.Unit.Name ?? 'NA',
                abbreviation: c.Unit.Abbreviation ?? 'NA'
            };

            return { id, name, email, unit, department, role } as Contact;
        }).filter((r) => r != null);
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
                { idContact: 1,  Name: 'Eric Maslowski',    Unit: { idUnit: 24, Name: 'Office of Digital Information', Abbreviation: 'ODI' }, Department: 'Digital Programs Office',     EmailAddress: 'maslowskiec@si.edu',  Title: 'Project Lead' },
                { idContact: 2,  Name: 'Karen Osborn',      Unit: { idUnit: 31, Name: 'Department of Paleobiology', Abbreviation: 'Paleo' }, Department: 'Paleobiology',               EmailAddress: 'osbornk@si.edu',      Title: 'Research Scientist' },
                { idContact: 4,  Name: 'William Moser',     Unit: { idUnit: 31, Name: 'Department of Invertebrate Zoology', Abbreviation: 'IZ' }, Department: 'Invertebrate Zoology',   EmailAddress: 'moserw@si.edu',       Title: 'Curator' },
                { idContact: 5,  Name: 'Yuuki Niimi',       Unit: { idUnit: 42, Name: 'Office of International Relations', Abbreviation: 'OIR' }, Department: 'Collections & International Programs', EmailAddress: 'niimiy@si.edu', Title: 'Collections Specialist' },
                { idContact: 7,  Name: 'Chris Meyer',       Unit: { idUnit: 31, Name: 'Department of Invertebrate Zoology', Abbreviation: 'IZ' }, Department: 'Invertebrate Zoology',   EmailAddress: 'meyerc@si.edu',       Title: 'Curator' },
                { idContact: 9,  Name: 'Cathy Maslowski',   Unit: { idUnit: 24, Name: 'Office of Digital Information', Abbreviation: 'ODI' }, Department: 'Digital Programs Office', EmailAddress: 'maslowskic@si.edu',   Title: 'Program Manager' },
                { idContact: 10, Name: 'David Johnson',     Unit: { idUnit: 37, Name: 'Archives Center', Abbreviation: 'ARCH' }, Department: 'Archives & Special Collections',          EmailAddress: 'johnsond@si.edu',     Title: 'Archivist' },
                { idContact: 12, Name: 'Sarah Lee',         Unit: { idUnit: 18, Name: 'Office of Communications & Marketing', Abbreviation: 'OCM' }, Department: 'Digital Media',      EmailAddress: 'lees@si.edu',         Title: 'Digital Media Specialist' },
                { idContact: 13, Name: 'James Smith',       Unit: { idUnit: 19, Name: 'National Museum of the American Indian', Abbreviation: 'NMAI' }, Department: 'Collections Management', EmailAddress: 'smithj@si.edu', Title: 'Registrar' },
                { idContact: 15, Name: 'Maria Garcia',      Unit: { idUnit: 22, Name: 'Hirshhorn Museum and Sculpture Garden', Abbreviation: 'HMSG' }, Department: 'Conservation',       EmailAddress: 'garciam@si.edu',      Title: 'Conservator' }
            ];

            setContacts(normalize(tempContacts)); //normalize(tempContacts ?? []));

        } catch (e: any) {
            setError(`Unexpected error: ${e?.message ?? e}`);
            setContacts([]);
        } finally {
            setIsLoading(false);
        }
    }, []);
    const getColumnHeader = (): ColumnHeader[] => {
        return [
            { key: 'id',        label: 'ID',        align: 'center', tooltip: 'System ID for the contact' },
            { key: 'name',      label: 'Name',      align: 'center', tooltip: 'Contact name' },
            { key: 'email',     label: 'Email',     align: 'center', tooltip: 'Primary email' },
            { key: 'role',      label: 'Role',      align: 'center', tooltip: 'Title / Role' },
            { key: 'unit.abbreviation',      label: 'Unit',      align: 'center', tooltip: 'Unit' },
            { key: 'department',label: 'Department',align: 'center', tooltip: 'Department' }
        ];
    };

    useEffect(() => {
        fetchContacts();
    }, [fetchContacts]);

    const expandedRowRenderer = (row): React.ReactNode => {
        console.log('expanded row renderer: ',row);
        // build a full UI for this row to display when expanded
        return (
            <>
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
            </>
        );
    };

    const onUpdateSelection = (selection: Contact[]) => {
        setSelected(selection);
        console.log('selection updated: ',selection);
    };
    const onRefresh = (contact, status, message) => {
        // keep UI snappy & clear selection to prevent acting on stale rows
        setResetSelection(true);
        setTimeout(() => setResetSelection(false), 0);
        fetchContacts();

        console.log('onRefresh: ',contact,status,message);
    };

    return (
        <Box display='flex' flexDirection='column' style={{ gap: '1rem', width: '95%' }}>

            {error && (
                <Typography variant='body2' color='error'>
                    {error}
                </Typography>
            )}

            <DataTableSelect<Contact>
                onUpdateSelection={onUpdateSelection}
                data={contacts}
                columns={getColumnHeader()}
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
