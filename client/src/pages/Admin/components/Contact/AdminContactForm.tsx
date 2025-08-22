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
import { getErrorString } from '../../../../utils/shared';

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

    const fetchUnits = useCallback(async () => {
        setUnitsLoading(true);
        setUnitsError(null);
        try {
            const resp: RequestResponse = await API.getUnits(); // no signal
            if (!resp?.success)
                throw new Error(resp?.message ?? 'Failed to fetch units.');

            const rows: any[] = Array.isArray(resp.data) ? resp.data : [];
            setUnits(normalizeUnits(rows));
        } catch (err: any) {
            setUnitsError(getErrorString(err));
            setUnits([]);
        } finally {
            setUnitsLoading(false);
        }
    }, []);
    useEffect(() => {
        // fetch our list of units
        fetchUnits();
    }, [fetchUnits]);

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
                                {u.abbreviation ? `${u.abbreviation} — ${u.name}` : u.name}
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
