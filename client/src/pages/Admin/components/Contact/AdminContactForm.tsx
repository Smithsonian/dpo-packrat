/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useEffect, useState } from 'react';
import {
    Box,
    Button,
    Grid,
    Paper,
    TextField,
    MenuItem,
    Typography,
    CircularProgress,
} from '@material-ui/core';
import API, { RequestResponse } from '../../../../api'; // adjust path as needed
import { DBReference } from '../shared/DataTypesStyles';

type Mode = 'create' | 'update';
export type UpdateResult = {
    contact: Contact;
    status: 'created' | 'updated';
    message: string;
};

export type UnitOption = { id: number; name: string; abbreviation: string };
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
type ContactFormProps = {
    mode?: Mode;                       // NEW: defaults to 'update'
    contact?: Contact;                 // now optional (create mode can start empty)
    onUpdate?: (contact: Contact, status: 'created' | 'updated', message: string) => void;  // NEW preferred callback
};
const EMPTY_BASELINE: Contact = {
    id: -1,
    name: '',
    email: '',
    role: '',
    department: '',
    unit: { idUnit: -1, name: '', abbreviation: '' },
};

const emailRegex =
  // reasonably strict but not overbearing
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const AdminContactForm: React.FC<ContactFormProps> = ({
    mode = 'update',
    contact,
    onUpdate
}: ContactFormProps) => {


    // baseline for create mode: empty/placeholder
    const initial = mode === 'create'
        ? EMPTY_BASELINE
        : (contact ?? EMPTY_BASELINE);

    const [baseline, setBaseline] = useState<Contact>({ ...initial });
    const [name, setName] = useState(initial.name);
    const [email, setEmail] = useState(initial.email);
    const [role, setRole] = useState(initial.role);
    const [department, setDepartment] = useState(initial.department);

    const [unitId, setUnitId] = useState<number>(initial.unit?.idUnit ?? -1);
    const [units, setUnits] = useState<UnitOption[]>([]);
    const [unitsLoading, setUnitsLoading] = useState<boolean>(false);
    const [unitsError, setUnitsError] = useState<string | null>(null);

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const dirty =
    name !== baseline.name ||
    email !== baseline.email ||
    role !== baseline.role ||
    department !== baseline.department ||
    unitId !== (baseline.unit?.idUnit ?? -1);

    const valid =
    name.trim().length > 0 &&
    emailRegex.test(email.trim()) &&
    department.trim().length > 0 &&
    role.trim().length > 0 &&
    Number.isFinite(unitId) &&
    unitId > 0;

    const onReset = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        const base = (mode === 'create') ? EMPTY_BASELINE : (baseline); // for update, baseline is latest saved
        setName(base.name);
        setEmail(base.email);
        setRole(base.role);
        setDepartment(base.department);
        setUnitId(base.unit?.idUnit ?? -1);
        setError(null);
        setSuccessMsg(null);
    }, [baseline, mode]);

    const onUpdateClick = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (mode !== 'update') return;
        if (!valid || !dirty) return;

        setSubmitting(true);
        setError(null);
        setSuccessMsg(null);
        try {
            const payload = {
                idContact: baseline.id,
                Name: name.trim(),
                EmailAddress: email.trim(),
                Title: role.trim(),
                Department: department.trim(),
                idUnit: unitId,
            };

            const resp: RequestResponse = await API.request(`api/contact/${baseline.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!resp?.success) {
                const message = resp?.message ?? 'Failed to update contact.';
                setError(message);
                onUpdate?.(baseline, 'updated', message);
            } else {
                const message = 'Contact Updated';
                setSuccessMsg(message);

                const selectedUnit =
                units.find((u) => u.id === unitId) ??
                (baseline.unit
                    ? { id: baseline.unit.idUnit, name: baseline.unit.name, abbreviation: baseline.unit.abbreviation }
                    : { id: unitId, name: `Unit ${unitId}`, abbreviation: '' });

                const updated: Contact = {
                    id: baseline.id,
                    name: payload.Name,
                    email: payload.EmailAddress,
                    role: payload.Title,
                    department: payload.Department,
                    unit: {
                        idUnit: selectedUnit.id,
                        name: selectedUnit.name,
                        abbreviation: selectedUnit.abbreviation,
                    },
                };

                // refresh baseline so dirty becomes false
                setBaseline(updated);
                setName(updated.name);
                setEmail(updated.email);
                setRole(updated.role);
                setDepartment(updated.department);
                setUnitId(updated.unit.idUnit);

                // NEW unified update callback
                onUpdate?.(updated, 'updated', message);
            }
        } catch (ex: any) {
            const message = `Unexpected error: ${ex?.message ?? ex}`;
            setError(message);
            onUpdate?.(baseline, 'updated', message);
        } finally {
            setSubmitting(false);
        }
    }, [baseline, department, dirty, email, mode, name, onUpdate, role, unitId, units, valid]);

    const onCreateClick = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (mode !== 'create') return;
        if (!valid) return; // must be valid to create

        setSubmitting(true);
        setError(null);
        setSuccessMsg(null);
        try {
            const payload = {
                Name: name.trim(),
                EmailAddress: email.trim(),
                Title: role.trim(),
                Department: department.trim(),
                idUnit: unitId,
            };

            const resp: RequestResponse = await API.request('api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const message = resp?.message ?? (resp?.success ? 'Contact Created' : 'Failed to create contact.');

            if (!resp?.success) {
                setError(message);
                // still report to parent so it can notify
                onUpdate?.(baseline, 'created', message);
            } else {
                // infer id & unit from server if present; fallback to our local selection
                const server = (resp.data ?? {}) as any;
                const newId = server.idContact ?? server.id ?? baseline.id;
                const selectedUnit =
                units.find((u) => u.id === unitId) ??
                { id: unitId, name: `Unit ${unitId}`, abbreviation: '' };

                const created: Contact = {
                    id: newId,
                    name: payload.Name,
                    email: payload.EmailAddress,
                    role: payload.Title,
                    department: payload.Department,
                    unit: {
                        idUnit: selectedUnit.id,
                        name: selectedUnit.name,
                        abbreviation: selectedUnit.abbreviation,
                    },
                };

                setSuccessMsg(message);
                setBaseline(created);
                setName(created.name);
                setEmail(created.email);
                setRole(created.role);
                setDepartment(created.department);
                setUnitId(created.unit.idUnit);

                // report to new unified callback
                onUpdate?.(created, 'created', message);
            }
        } catch (ex: any) {
            const message = `Unexpected error: ${ex?.message ?? ex}`;
            setError(message);
            onUpdate?.(baseline, 'created', message);
        } finally {
            setSubmitting(false);
        }
    }, [baseline, department, email, mode, name, onUpdate, role, unitId, units, valid]);

    const normalizeUnits = (units): UnitOption[] => {
        const result = units.map((u)=> {
            return {
                id: u.idUnit ?? -1,
                name: u.Name ?? 'NA',
                abbreviation: u.Abbreviation ?? 'NA',
            };
        });
        return result;
    };

    useEffect(() => {
        // let mounted = true;
        // (async () => {
        //     setUnitsLoading(true);
        //     setUnitsError(null);
        //     try {
        //         const resp: RequestResponse = await API.request('api/unit', { method: 'GET' });
        //         if (!resp?.success) {
        //             if (mounted) {
        //                 setUnits([]);
        //                 setUnitsError(resp?.message ?? 'Failed to fetch units.');
        //             }
        //         } else {
        //             const rows: any[] = Array.isArray(resp.data) ? resp.data : [];
        //             const opts: UnitOption[] = rows.map((u) => ({
        //                 id: u.idUnit,
        //                 name: u.Name,
        //                 abbreviation: u.Abbreviation,
        //             }));
        //             if (mounted) setUnits(opts);
        //         }
        //     } catch (ex: any) {
        //         if (mounted) setUnitsError(`Unexpected error: ${ex?.message ?? ex}`);
        //     } finally {
        //         if (mounted) setUnitsLoading(false);
        //     }
        // })();
        // return () => { mounted = false; };
        setUnitsLoading(true);
        setUnitsError(null);
        const tempUnits = [
            { idUnit: 1, Name: 'Anacostia Community Museum', Abbreviation: 'ACM' },
            { idUnit: 2, Name: 'Architectural History and Historic Preservation', Abbreviation: 'AHHP' },
            { idUnit: 3, Name: 'Archives of American Art', Abbreviation: 'AAA' },
            { idUnit: 4, Name: 'Center for Folklife and Cultural Heritage', Abbreviation: 'CFCH' },
            { idUnit: 5, Name: 'Cooper-Hewitt, National Design Museum', Abbreviation: 'C-HNDM' },
            { idUnit: 6, Name: 'Freer Gallery of Art and Arthur M. Sackler Gallery', Abbreviation: 'FSG' },
            { idUnit: 7, Name: 'Hirshhorn Museum and Sculpture Garden', Abbreviation: 'HMSG' },
            { idUnit: 8, Name: 'Horticulture Services Division', Abbreviation: 'HSD' },
            { idUnit: 9, Name: 'Human Resources Research Organization', Abbreviation: 'HumRRO' },
            { idUnit: 10, Name: 'Museum Conservation Institute', Abbreviation: 'MCI' },
            { idUnit: 11, Name: 'National Air and Space Museum', Abbreviation: 'NASM' },
            { idUnit: 12, Name: 'National Collections Program', Abbreviation: 'NCP' },
            { idUnit: 13, Name: 'National Museum of African American History and Culture', Abbreviation: 'NMAAHC' },
            { idUnit: 14, Name: 'National Museum of African Art', Abbreviation: 'NMAfA' },
            { idUnit: 15, Name: 'National Museum of American History', Abbreviation: 'NMAH' },
            { idUnit: 16, Name: 'National Museum of Natural History', Abbreviation: 'NMNH' },
            { idUnit: 17, Name: 'National Museum of the American Indian', Abbreviation: 'NMAI' },
            { idUnit: 18, Name: 'National Museum of the American Latino', Abbreviation: 'NMAL' },
            { idUnit: 19, Name: 'National Portrait Gallery', Abbreviation: 'NPG' },
            { idUnit: 20, Name: 'National Postal Museum', Abbreviation: 'NPM' },
            { idUnit: 21, Name: 'National Zoological Park', Abbreviation: 'NZP' },
            { idUnit: 22, Name: 'Office of Digital Transformation', Abbreviation: 'ODT' },
            { idUnit: 23, Name: 'Office of Policy and Analysis', Abbreviation: 'OP&A' },
            { idUnit: 24, Name: 'Office of the Chief Information Officer', Abbreviation: 'OCIO' },
            { idUnit: 25, Name: 'Smithsonian American Art Museum', Abbreviation: 'SAAM' },
            { idUnit: 26, Name: 'Smithsonian Asian Pacific American Center', Abbreviation: 'APAC' },
            { idUnit: 27, Name: 'Smithsonian Astrophysical Observatory', Abbreviation: 'SAO' },
            { idUnit: 28, Name: 'Smithsonian Center for Materials Research and Education', Abbreviation: 'SCMRE' },
            { idUnit: 29, Name: 'Smithsonian Environmental Research Center', Abbreviation: 'SERC' },
            { idUnit: 30, Name: 'Smithsonian Gardens', Abbreviation: 'SG' },
            { idUnit: 31, Name: 'Smithsonian Institution Archives', Abbreviation: 'SIA' },
            { idUnit: 32, Name: 'Smithsonian Libraries', Abbreviation: 'SIL' },
            { idUnit: 33, Name: 'Smithsonian Tropical Research Institute', Abbreviation: 'STRI' }
        ];
        setUnits(normalizeUnits(tempUnits));
        setUnitsLoading(false);
    }, []);

    useEffect(() => {
        if (mode === 'create') {
            setBaseline({ ...EMPTY_BASELINE });
            setName('');
            setEmail('');
            setRole('');
            setDepartment('');
            setUnitId(-1);
        } else if (contact) {
            setBaseline({ ...contact });
            setName(contact.name);
            setEmail(contact.email);
            setRole(contact.role);
            setDepartment(contact.department);
            setUnitId(contact.unit?.idUnit ?? -1);
        }
    }, [contact, mode]);

    return (
        <Paper
            elevation={0}
            style={{
                padding: 16,
                background: 'rgba(255,255,255,0.3)',
                border: '1px solid rgba(0,0,0,0.08)',
            }}
            onClick={(e) => e.stopPropagation()} // keep row from collapsing when clicking inside
        >
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                    <TextField
                        label='Name'
                        variant='outlined'
                        size='small'
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        fullWidth
                        required
                        error={name.trim().length === 0}
                        helperText={name.trim().length === 0 ? 'Required' : ' '}
                        InputLabelProps={{ shrink: true, style: { color: '#333333' } }}
                        InputProps={{ style: { backgroundColor: 'white' }, }}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                    <TextField
                        label='Email'
                        variant='outlined'
                        size='small'
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        fullWidth
                        required
                        error={email.trim().length > 0 && !emailRegex.test(email.trim())}
                        helperText={
                            email.trim().length > 0 && !emailRegex.test(email.trim())
                                ? 'Invalid email format'
                                : ' '
                        }
                        InputLabelProps={{ shrink: true, style: { color: '#333333' } }}
                        InputProps={{ style: { backgroundColor: 'white' }, }}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                    <TextField
                        label='Title / Role'
                        variant='outlined'
                        size='small'
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        fullWidth
                        required
                        error={role.trim().length === 0}
                        helperText={role.trim().length === 0 ? 'Required' : ' '}
                        InputLabelProps={{ shrink: true, style: { color: '#333333' } }}
                        InputProps={{ style: { backgroundColor: 'white' }, }}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                    <TextField
                        label='Department'
                        variant='outlined'
                        size='small'
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        fullWidth
                        required
                        error={department.trim().length === 0}
                        helperText={department.trim().length === 0 ? 'Required' : ' '}
                        InputLabelProps={{ shrink: true, style: { color: '#333333' } }}
                        InputProps={{ style: { backgroundColor: 'white' }, }}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                    <TextField
                        select
                        label='Unit'
                        variant='outlined'
                        size='small'
                        value={units.length > 0 ? (unitId > 0 ? unitId : '') : ''}
                        onChange={(e) => setUnitId(Number(e.target.value))}
                        fullWidth
                        required
                        disabled={unitsLoading || units.length === 0}
                        helperText={
                            unitsError
                                ? unitsError
                                : unitsLoading
                                    ? 'Loading units…'
                                    : units.length === 0
                                        ? 'No units available'
                                        : ' '
                        }
                        InputLabelProps={{ shrink: true, style: { color: '#333333' } }}
                        InputProps={{ style: { backgroundColor: 'white' } }}
                    >
                        {units.map((u) => (
                            <MenuItem key={u.id} value={u.id}>
                                {u.abbreviation ? `${u.abbreviation} — ${u.name}` : u.name} ({u.id})
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>

                <Grid item xs={12}>
                    <Box display='flex' alignItems='center' justifyContent='space-between'>
                        <Box display='flex' alignItems='center' style={{ gap: 8 }}>
                            <Button
                                variant='outlined'
                                onClick={onReset}
                                disabled={!dirty || submitting}
                            >
                                Reset
                            </Button>
                            <Button
                                variant='contained'
                                color='primary'
                                disableElevation
                                onClick={mode === 'create' ? onCreateClick : onUpdateClick}
                                disabled={
                                    submitting ||
                                    (mode === 'create' ? !valid : (!dirty || !valid))
                                }
                                startIcon={submitting ? <CircularProgress size={18} /> : undefined}
                                style={{ color: `${((mode === 'create' ? valid : (dirty && valid)) ? 'white' : 'darkgrey')}` }}
                            >
                                {submitting
                                    ? (mode === 'create' ? 'Creating…' : 'Updating…')
                                    : (mode === 'create' ? 'Create' : 'Update')}
                            </Button>
                        </Box>
                        <Box>
                            {error && (
                                <Typography variant='body2' color='error'>
                                    {error}
                                </Typography>
                            )}
                            {!error && successMsg && (
                                <Typography variant='body2' style={{ color: '#2e7d32' }}>
                                    {successMsg}
                                </Typography>
                            )}
                        </Box>
                    </Box>
                </Grid>
            </Grid>
        </Paper>
    );
};

export default AdminContactForm;
