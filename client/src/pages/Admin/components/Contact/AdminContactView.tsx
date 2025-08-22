/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useEffect, useState } from 'react';
import { Box, Typography } from '@material-ui/core';
import API, { RequestResponse } from '../../../../api';
import { AdminContactForm } from './AdminContactForm';
import { DataTableSelect } from '../shared/DataTableSelect';
import { ColumnHeader, DBReference } from '../shared/DataTypesStyles';
import { getErrorString } from '../../../../utils/shared';

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

    const normalizeContacts = (rows: any[]): Contact[] => {
        // Map server results to the shape DataTableSelect expects (must include id & name)
        return rows.map((c) => {
            if(!c) return null;

            const id = c.idContact ?? -1;
            const name = c.Name ?? 'NA';
            const department = c.Department ?? 'NA';
            const email = c.EmailAddress ?? 'NA';
            const role = c.Title ?? 'NA';
            const unit = {
                idUnit: c.idUnit ?? -1,
                name: 'NA',
                abbreviation: 'NA'
            };

            return { id, name, email, unit, department, role } as Contact;
        }).filter((r) => r != null);
    };
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

    const fetchContacts = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const contactResponse: RequestResponse = await API.getContacts(); // no signal
            if (!contactResponse?.success)
                throw new Error(contactResponse?.message ?? 'Failed to fetch units.');

            // extract our contacts and normalize them (units filled in next)
            const rows: any[] = Array.isArray(contactResponse.data) ? contactResponse.data : [];
            const normalized: Contact[] = normalizeContacts(rows);

            // get our units since we need to match their details so we can populate the table
            // with something other than their IDs.
            const unitResponse: RequestResponse = await API.getUnits();
            const units = Array.isArray(unitResponse.data) ? unitResponse.data : [];
            if(unitResponse.success && units.length>0) {

                // build a map from the ids. we do this to ensure safety indepedent of sorting
                const unitById = new Map<number, { name: string; abbreviation: string }>();
                for (const u of units) {
                    const id = Number(u?.idUnit);
                    if (Number.isFinite(id)) {
                        unitById.set(id, {
                            name: String(u?.Name ?? 'NA'),
                            abbreviation: String(u?.Abbreviation ?? 'NA'),
                        });
                    }
                }

                // cycle through contacts updating units
                normalized.forEach((c)=>{
                    const u = unitById.get(c.unit.idUnit);
                    if (u) {
                        c.unit.name = u.name;
                        c.unit.abbreviation = u.abbreviation;
                    }
                });
            }

            setContacts(normalized);
        } catch (err) {
            setError(getErrorString(err));
            setContacts([]);
        } finally {
            setIsLoading(false);
        }
    }, []);
    useEffect(() => {
        fetchContacts();
    }, [fetchContacts]);

    const expandedRowRenderer = (row): React.ReactNode => {
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
