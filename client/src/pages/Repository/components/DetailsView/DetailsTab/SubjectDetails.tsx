/* eslint-disable react-hooks/exhaustive-deps, react/jsx-max-props-per-line, @typescript-eslint/no-explicit-any */

/**
 * SubjectDetails
 *
 * This component renders details tab for Subject specific details used in DetailsTab component.
 */
import React, { useEffect, useState } from 'react';
import { Box, Table, TableBody, TableCell, TableContainer, TableRow, Typography, Tooltip, MenuItem, TextField } from '@material-ui/core';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import { AdminContactForm } from '../../../../Admin/components/Contact/AdminContactForm'; // adjust path if needed

import { Loader } from '../../../../../components';
import { SubjectDetailFields, ObjectPropertyResult } from '../../../../../types/graphql';
import { isFieldUpdated } from '../../../../../utils/repository';
import { DetailComponentProps } from './index';
import { eSystemObjectType } from '@dpo-packrat/common';
import { useDetailTabStore } from '../../../../../store';
import clsx from 'clsx';
import { DebounceInput } from 'react-debounce-input';
import API from '../../../../../api';
import { useStyles as useTableStyles } from '../../../../Repository/components/DetailsView/DetailsTab/CaptureDataDetails';
import { useStyles, updatedFieldStyling } from './CaptureDataDetails';
import { useContactStore, Contact } from '../../../../../store/contact';

function SubjectDetails(props: DetailComponentProps): React.ReactElement {
    const { data, loading, disabled, onUpdateDetail, objectType, idSystemObject } = props;
    const [ SubjectDetails, updateDetailField, updateObjectProperty ] = useDetailTabStore(s => [
        s.SubjectDetails,
        s.updateDetailField,
        s.updateObjectProperty
    ]);
    const ops = useDetailTabStore(s => s.ObjectPropertiesBySO[idSystemObject] ?? []);
    console.log('[SubjectDetails] render', { idSO: idSystemObject, ops: ops.map(p => p.propertyType) });
    const sensitivity = ops.find(p => p.propertyType === 'sensitivity') ?? {
        propertyType: 'sensitivity',
        level: 0,
        rationale: '',
        idContact: null,
    };
    console.log('[SubjectDetails] derived sensitivity:', sensitivity);
    const onFieldBlur = () => onUpdateDetail(objectType, SubjectDetails);

    useEffect(() => {
        onUpdateDetail(objectType, SubjectDetails);
    }, [SubjectDetails]);

    if (!data || loading) {
        return <Loader minHeight='15vh' />;
    }

    const onSetField = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = event.target;

        // if the field is part of the sensitivity ObjectProperty, update it generically
        if (name === 'level' || name === 'rationale' || name === 'idContact') {
            const normalized =
                name === 'level' ? Number(value) :
                    name === 'idContact' ? ((value === '' || value == null) ? null : Number(value)) :
                        value;

            // insert if missing, merge if present
            updateObjectProperty(idSystemObject, 'sensitivity', { [name]: normalized });
            return;
        }

        // keep the store in sync for regular Subject fields
        updateDetailField(eSystemObjectType.eSubject, name, value);
    };
    const subjectData = data.getDetailsTabDataForObject?.Subject;

    return (
        <Box display='flex' gridGap={16}>
            {/* LEFT = existing geo/rotation UI */}
            <Box flex={1} minWidth={420}>
                <SubjectFields {...SubjectDetails} originalFields={subjectData} disabled={disabled} onChange={onSetField} />
            </Box>

            <Box flex={1} minWidth={420}>
                <ObjectPropertyFields
                    objectProperty={ sensitivity }
                    disabled={disabled}
                    onChange={onSetField}
                    onBlurRefresh={onFieldBlur}
                />
            </Box>
        </Box>
    );
}

//#region Subject Fields
interface SubjectFieldsProps extends SubjectDetailFields {
    disabled: boolean;
    originalFields?: SubjectDetailFields | null;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}
export function SubjectFields(props: SubjectFieldsProps): React.ReactElement {
    const {
        originalFields,
        Latitude,
        Longitude,
        Altitude,
        TS0,
        TS1,
        TS2,
        R0,
        R1,
        R2,
        R3,
        disabled,
        onChange,
    } = props;
    const classes = useStyles();
    const tableClasses = useTableStyles();
    const details = {
        Latitude,
        Longitude,
        Altitude,
        TS0,
        TS1,
        TS2,
        R0,
        R1,
        R2,
        R3
    };

    return (
        <React.Fragment>
            <Box minWidth='fit-content' style={{ backgroundColor: 'rgb(236, 245, 253)' }}>
                <TableContainer style={{ width: 'fit-content', paddingTop: '5px', paddingBottom: '5px' }}>
                    <Table className={classes.table}>
                        <TableBody>
                            <>
                                <TableRow className={tableClasses.tableRow}>
                                    <TableCell className={clsx(tableClasses.tableCell, classes.fieldLabel)}>
                                        <Typography className={tableClasses.labelText}>Latitude</Typography>
                                    </TableCell>
                                    <TableCell className={clsx(tableClasses.tableCell)}>
                                        <DebounceInput
                                            element='input'
                                            title='Latitude-input'
                                            disabled={disabled}
                                            value={details.Latitude || ''}
                                            type='number'
                                            name='Latitude'
                                            onChange={onChange}
                                            className={clsx(classes.input, classes.datasetFieldInput)}
                                            style={{ ...updatedFieldStyling(isFieldUpdated(details, originalFields, 'Latitude')) }}
                                        />
                                    </TableCell>
                                </TableRow>
                                <TableRow className={tableClasses.tableRow}>
                                    <TableCell className={clsx(tableClasses.tableCell, classes.fieldLabel)}>
                                        <Typography className={tableClasses.labelText}>Longtitude</Typography>
                                    </TableCell>
                                    <TableCell className={clsx(tableClasses.tableCell)}>
                                        <DebounceInput
                                            element='input'
                                            title='Longitude-input'
                                            disabled={disabled}
                                            value={details.Longitude || ''}
                                            type='number'
                                            name='Longitude'
                                            onChange={onChange}
                                            className={clsx(classes.input, classes.datasetFieldInput)}
                                            style={{ ...updatedFieldStyling(isFieldUpdated(details, originalFields, 'Longitude')) }}
                                        />
                                    </TableCell>
                                </TableRow>
                                <TableRow className={tableClasses.tableRow}>
                                    <TableCell className={clsx(tableClasses.tableCell, classes.fieldLabel)}>
                                        <Typography className={tableClasses.labelText}>Altitude</Typography>
                                    </TableCell>
                                    <TableCell className={clsx(tableClasses.tableCell)}>
                                        <DebounceInput
                                            element='input'
                                            title='Altitude-input'
                                            disabled={disabled}
                                            value={details.Altitude || ''}
                                            type='number'
                                            name='Altitude'
                                            onChange={onChange}
                                            className={clsx(classes.input, classes.datasetFieldInput)}
                                            style={{ ...updatedFieldStyling(isFieldUpdated(details, originalFields, 'Altitude')) }}
                                        />
                                    </TableCell>
                                </TableRow>

                                <RotationOriginInput originalFields={originalFields} TS0={details.TS0} TS1={details.TS1} TS2={details.TS2} onChange={onChange} />
                                <RotationQuaternionInput originalFields={originalFields} R0={details.R0} R1={details.R1} R2={details.R2} R3={details.R3} onChange={onChange} />
                            </>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </React.Fragment>
    );
}
interface RotationOriginInputProps {
    TS0?: number | null;
    TS1?: number | null;
    TS2?: number | null;
    originalFields?: SubjectDetailFields | null;
    ignoreUpdate?: boolean;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}
export function RotationOriginInput(props: RotationOriginInputProps): React.ReactElement {
    const { TS0, TS1, TS2, onChange, originalFields, ignoreUpdate } = props;
    const details = {
        TS0,
        TS1,
        TS2
    };
    const classes = useStyles();
    const tableClasses = useTableStyles();

    return (
        <TableRow className={tableClasses.tableRow}>
            <TableCell className={clsx(tableClasses.tableCell, classes.fieldLabel)}>
                <Typography className={tableClasses.labelText}>Rotation Origin</Typography>
            </TableCell>
            <TableCell style={{ border: 'none', padding: '1px 10px' }}>
                <Box display='flex' flex={1}>
                    <Box display='flex'>
                        <DebounceInput
                            element='input'
                            title='TS0-input'
                            value={details.TS0 || ''}
                            type='number'
                            name='TS0'
                            onChange={onChange}
                            style={{
                                width: '50px',
                                height: 22,
                                fontSize: '0.8rem',
                                padding: '0px 10px',
                                borderRadius: 5,
                                border: '1px solid rgba(141, 171, 196, 0.4)',
                                ...updatedFieldStyling(isFieldUpdated(ignoreUpdate ? false : details, originalFields, 'TS0'))
                            }}
                            className={clsx(classes.input, classes.datasetFieldInput)}
                        />
                        <DebounceInput
                            element='input'
                            title='TS1-input'
                            value={details.TS1 || ''}
                            type='number'
                            name='TS1'
                            onChange={onChange}
                            style={{
                                width: '50px',
                                height: 22,
                                fontSize: '0.8rem',
                                padding: '0px 10px',
                                borderRadius: 5,
                                border: '1px solid rgba(141, 171, 196, 0.4)',
                                ...updatedFieldStyling(isFieldUpdated(ignoreUpdate ? false : details, originalFields, 'TS1'))
                            }}
                            className={clsx(classes.input, classes.datasetFieldInput)}
                        />
                        <DebounceInput
                            element='input'
                            title='TS2-input'
                            value={details.TS2 || ''}
                            type='number'
                            name='TS2'
                            onChange={onChange}
                            style={{
                                width: '50px',
                                height: 22,
                                fontSize: '0.8rem',
                                padding: '0px 10px',
                                borderRadius: 5,
                                border: '1px solid rgba(141, 171, 196, 0.4)',
                                ...updatedFieldStyling(isFieldUpdated(ignoreUpdate ? false : details, originalFields, 'TS2'))
                            }}
                            className={clsx(classes.input, classes.datasetFieldInput)}
                        />
                    </Box>
                </Box>
            </TableCell>
        </TableRow>
    );
}
interface RotationQuaternionInputProps {
    R0?: number | null;
    R1?: number | null;
    R2?: number | null;
    R3?: number | null;
    originalFields?: SubjectDetailFields | null;
    ignoreUpdate?: boolean;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    classes?: string;
}
export function RotationQuaternionInput(props: RotationQuaternionInputProps): React.ReactElement {
    const { R0, R1, R2, R3, onChange, originalFields, ignoreUpdate } = props;
    const details = {
        R0,
        R1,
        R2,
        R3
    };
    const classes = useStyles();
    const tableClasses = useTableStyles();

    return (
        <TableRow className={tableClasses.tableRow}>
            <TableCell className={clsx(tableClasses.tableCell, classes.fieldLabel)}>
                <Typography className={tableClasses.labelText}>Rotation Quaternion</Typography>
            </TableCell>
            <TableCell style={{ border: 'none', padding: '1px 10px' }}>
                <Box display='flex' flex={1}>
                    <Box display='flex'>
                        <DebounceInput
                            element='input'
                            title='R0-input'
                            value={details.R0 || ''}
                            type='number'
                            name='R0'
                            onChange={onChange}
                            style={{
                                width: '50px',
                                height: 22,
                                fontSize: '0.8rem',
                                padding: '0px 10px',
                                borderRadius: 5,
                                border: '1px solid rgba(141, 171, 196, 0.4)',
                                ...updatedFieldStyling(isFieldUpdated(ignoreUpdate ? false : details, originalFields, 'R0'))
                            }}
                            className={clsx(classes.input, classes.datasetFieldInput)}
                        />
                        <DebounceInput
                            element='input'
                            title='R1-input'
                            value={details.R1 || ''}
                            type='number'
                            name='R1'
                            onChange={onChange}
                            style={{
                                width: '50px',
                                height: 22,
                                fontSize: '0.8rem',
                                padding: '0px 10px',
                                borderRadius: 5,
                                border: '1px solid rgba(141, 171, 196, 0.4)',
                                ...updatedFieldStyling(isFieldUpdated(ignoreUpdate ? false : details, originalFields, 'R1'))
                            }}
                            className={clsx(classes.input, classes.datasetFieldInput)}
                        />
                        <DebounceInput
                            element='input'
                            title='R2-input'
                            value={details.R2 || ''}
                            type='number'
                            name='R2'
                            onChange={onChange}
                            style={{
                                width: '50px',
                                height: 22,
                                fontSize: '0.8rem',
                                padding: '0px 10px',
                                borderRadius: 5,
                                border: '1px solid rgba(141, 171, 196, 0.4)',
                                ...updatedFieldStyling(isFieldUpdated(ignoreUpdate ? false : details, originalFields, 'R2'))
                            }}
                            className={clsx(classes.input, classes.datasetFieldInput)}
                        />
                        <DebounceInput
                            element='input'
                            title='R3-input'
                            value={details.R3 || ''}
                            type='number'
                            name='R3'
                            onChange={onChange}
                            style={{
                                width: '50px',
                                height: 22,
                                fontSize: '0.8rem',
                                padding: '0px 10px',
                                borderRadius: 5,
                                border: '1px solid rgba(141, 171, 196, 0.4)',
                                ...updatedFieldStyling(isFieldUpdated(ignoreUpdate ? false : details, originalFields, 'R3'))
                            }}
                            className={clsx(classes.input, classes.datasetFieldInput)}
                        />
                    </Box>
                </Box>
            </TableCell>
        </TableRow>
    );
}
//#endregion

//#region ObjectProperty Fields
interface ObjectPropertyProps {
    objectProperty?: ObjectPropertyResult | null;
    disabled: boolean;
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    onBlurRefresh?: () => void;
}
export function ObjectPropertyFields(props: ObjectPropertyProps): React.ReactElement {

    type UnitOption = { idUnit: number; Name: string; Abbreviation?: string | null };

    const [currentLevel, setCurrentLevel] = useState(0);
    const contacts = useContactStore(s => s.all);
    const getContact = useContactStore(s => s.get);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

    const [units, setUnits] = useState<UnitOption[]>([]);

    // modal state for "Create Contact"
    const [createOpen, setCreateOpen] = useState(false);
    const [createResetKey, setCreateResetKey] = useState(0);
    const onOpenCreate = () => setCreateOpen(true);
    const onCloseCreate = () => setCreateOpen(false);

    // map AdminContactForm result -> ContactOption + persist idContact
    const onCreateFinished = (created: {
        id: number;
        name: string;
        email: string;
        role: string;
        department: string;
        unit: { idUnit: number; name: string; abbreviation: string };
    } | null, status: 'create' | 'update', message: string) => {
        if (status === 'create' && created && created.id > 0) {
            const newContact: Contact = {
                idContact: created.id,
                Name: created.name,
                EmailAddress: created.email,
                Title: created.role,
                Department: created.department,
                idUnit: created.unit?.idUnit ?? null,
            };

            console.log(`[Packrat:Status] created contact in context: ${newContact.Name} (${newContact.idContact})`,message);

            // put into the cache and store selected
            useContactStore.getState().upsertOne(newContact);
            setSelectedContact(newContact);

            // propagate numeric id to the data model (banner will update via store + ops)
            onChange({ target: { name: 'idContact', value: newContact.idContact } } as unknown as React.ChangeEvent<HTMLInputElement>);

            onBlurRefresh?.();
            setCreateOpen(false);
        }
    };

    const classes = useStyles();
    const tableClasses = useTableStyles();

    const {
        objectProperty,
        disabled,
        onChange,
        onBlurRefresh
    } = props;
    const details = {
        propertyType: objectProperty?.propertyType ?? '',
        level: objectProperty?.level ?? -1,
        rationale: objectProperty?.rationale ?? '',
        idContact: objectProperty?.idContact ?? -1,
        disabled
    };

    const getLevelOptions = (propertyType: string): { label: string, value: number }[] => {
        switch(propertyType) {
            case 'sensitivity': {
                return [
                    { label: 'None', value: 0 },
                    { label: 'Sensitive', value: 1 },
                    { label: 'Confidential', value: 2 },
                ];
            } break;

            default:
                return [];
        }
    };
    const onLevelChange = (e: React.ChangeEvent<{ name?: string; value: unknown }>) => {
        const next = Number(e.target.value);
        setCurrentLevel(next);

        // Update level
        onChange({ target: { name: 'level', value: next } } as unknown as React.ChangeEvent<HTMLInputElement>);

        if (next === 0) {
            // Clear subordinate fields when not sensitive
            onChange({ target: { name: 'rationale', value: '' } } as unknown as React.ChangeEvent<HTMLInputElement>);
            onChange({ target: { name: 'idContact', value: null } } as unknown as React.ChangeEvent<HTMLInputElement>);
            setSelectedContact(null);
        }

        onBlurRefresh?.(); // update notice on change+blur
    };
    const unitFor = (id?: number | null): string => {
        if (!id) return '';
        const u = units.find(u => u.idUnit === id);
        return u ? (u.Abbreviation || u.Name) : '';
    };
    const onContactChange = (e: React.ChangeEvent<{ name?: string; value: unknown }>) => {
        const id = e.target.value === '' || e.target.value == null ? null : Number(e.target.value);
        const found = id ? (getContact(id) ?? null) : null;
        setSelectedContact(found);

        // propagate numeric id (compact + server-friendly)
        onChange({ target: { name: 'idContact', value: id } } as unknown as React.ChangeEvent<HTMLInputElement>);
        onBlurRefresh?.();
    };


    useEffect(() => {
        setCurrentLevel(objectProperty?.level ?? 0);
    }, [objectProperty?.level]);
    useEffect(() => {
        let mounted = true;

        // hydrate the contact store once (cached afterwards)
        useContactStore.getState().loadAll();

        const loadUnits = async () => {
            const uRes = await API.getUnits();
            if (!mounted) return;
            const uList: UnitOption[] = uRes?.data ?? [];
            setUnits(uList);
        };

        loadUnits();
        return () => { mounted = false; };
    }, []);
    useEffect(() => {
        const id = props.objectProperty?.idContact ?? null;
        setSelectedContact(id ? (getContact(id) ?? null) : null);
    }, [props.objectProperty?.idContact, getContact]);

    // if no object property provided, render nothing
    if(!objectProperty)
        return <>No Object Properties</>;

    return (
        <React.Fragment>
            <Box minWidth='fit-content' style={{ backgroundColor: 'rgb(236, 245, 253)' }}>
                <Tooltip title='Is this subject sensitive and require additional approvals?'>
                    <Typography style={{ color: 'black', paddingLeft: '1rem' }}>Object Sensitivity</Typography>
                </Tooltip>
                <TableContainer style={{ width: 'fit-content', paddingTop: '5px', paddingBottom: '5px' }}>
                    <Table className={classes.table}>
                        <TableBody>
                            <>
                                <TableRow className={tableClasses.tableRow}>
                                    <TableCell className={clsx(tableClasses.tableCell, classes.fieldLabel)}>
                                        <Typography className={tableClasses.labelText}>Level</Typography>
                                    </TableCell>
                                    <TableCell className={clsx(tableClasses.tableCell)}>
                                        <TextField
                                            select
                                            variant='outlined'
                                            size='small'
                                            fullWidth
                                            // label={`${details.propertyType} ${'Level'}`}
                                            disabled={disabled}
                                            value={currentLevel}
                                            onChange={onLevelChange}
                                            onBlur={onBlurRefresh}
                                            InputLabelProps={{ shrink: true, style: { color: '#333333' } }}
                                            InputProps={{ style: { backgroundColor: 'white', fontSize: '0.9rem', height: '2rem' } }}
                                        >
                                            { getLevelOptions(details.propertyType).map(opt => (
                                                <MenuItem key={opt.value} value={opt.value}>
                                                    {opt.label} ({opt.value})
                                                </MenuItem>
                                            )) }
                                        </TextField>
                                    </TableCell>
                                </TableRow>

                                {currentLevel > 0 && (
                                    <>
                                        <TableRow className={tableClasses.tableRow}>
                                            <TableCell className={clsx(tableClasses.tableCell, classes.fieldLabel)}>
                                                <Typography className={tableClasses.labelText}>Rationale</Typography>
                                            </TableCell>
                                            <TableCell className={clsx(tableClasses.tableCell)}>
                                                <DebounceInput
                                                    id='rationale'
                                                    element='textarea'
                                                    name='rationale'
                                                    title='Rationale-input'
                                                    value={details.rationale ?? ''}
                                                    type='string'
                                                    onChange={onChange}
                                                    onBlur={onBlurRefresh}      // ← add this
                                                    disabled={disabled}
                                                    className={clsx(classes.input, classes.fieldSizing)}
                                                    forceNotifyByEnter={false}
                                                    debounceTimeout={400}
                                                    style={{ fontSize: '0.9rem', width: '100%', minWidth: '15rem', minHeight: '5rem', textAlign: 'left', padding: '5px' }}
                                                />
                                            </TableCell>
                                        </TableRow>

                                        <TableRow className={tableClasses.tableRow}>
                                            <TableCell className={clsx(tableClasses.tableCell, classes.fieldLabel)}>
                                                <Typography className={tableClasses.labelText}>Contact</Typography>
                                            </TableCell>
                                            <TableCell className={clsx(tableClasses.tableCell)}>
                                                <Box display='flex' alignItems='center' gridGap={8}>
                                                    <TextField
                                                        select
                                                        variant='outlined'
                                                        size='small'
                                                        fullWidth
                                                        disabled={disabled || currentLevel === 0}
                                                        value={selectedContact?.idContact ?? ''}
                                                        onChange={onContactChange}
                                                        onBlur={onBlurRefresh}
                                                        InputLabelProps={{ shrink: true, style: { color: '#333333' } }}
                                                        InputProps={{ style: { backgroundColor: 'white', fontSize: '0.9rem', height: '2rem' } }}
                                                        style={{ flex: 1 }}
                                                    >
                                                        <MenuItem value=''><em>None</em></MenuItem>
                                                        {contacts.map(c => (
                                                            <MenuItem key={c.idContact} value={c.idContact}>
                                                                {c.Name}{unitFor(c.idUnit) ? ` — ${unitFor(c.idUnit)}` : ''}
                                                            </MenuItem>
                                                        ))}
                                                    </TextField>

                                                    {/* little "+" button */}
                                                    <IconButton
                                                        aria-label='Create new contact'
                                                        size='small'
                                                        onClick={onOpenCreate}
                                                        disabled={disabled || currentLevel === 0}
                                                        title='Create new contact'
                                                    >
                                                        <AddIcon fontSize='small' />
                                                    </IconButton>
                                                </Box>
                                            </TableCell>
                                        </TableRow>

                                        {selectedContact && (
                                            <TableRow className={tableClasses.tableRow}>
                                                <TableCell className={clsx(tableClasses.tableCell, classes.fieldLabel)}>
                                                    <Typography className={tableClasses.labelText}></Typography>
                                                </TableCell>
                                                <TableCell className={clsx(tableClasses.tableCell)}>
                                                    <Box display='flex' flexDirection='column' style={{ lineHeight: 1.4, padding: '5px', borderRadius: '5px', border: '1px solid lightgrey' }}>
                                                        <Typography>{selectedContact.Name}</Typography>
                                                        {selectedContact.EmailAddress && (
                                                            <Typography>{selectedContact.EmailAddress}</Typography>
                                                        )}
                                                        <Typography>{selectedContact.Title}</Typography>
                                                        {selectedContact.Department && (
                                                            <Typography>{selectedContact.Department}, {unitFor(selectedContact.idUnit) || '—'}</Typography>
                                                        )}
                                                        <Typography>{}</Typography>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </>
                                )}
                            </>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            <Dialog
                open={createOpen}
                onClose={onCloseCreate}
                aria-labelledby='create-contact-title'
                fullWidth
                maxWidth='md'
                keepMounted
                onExited={() => setCreateResetKey(k => k + 1)}
            >
                <DialogTitle id='create-contact-title'>Create Contact</DialogTitle>
                <DialogContent dividers>
                    <AdminContactForm
                        key={createResetKey}
                        mode='create'
                        onUpdate={onCreateFinished}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={onCloseCreate}>Close</Button>
                </DialogActions>
            </Dialog>

        </React.Fragment>
    );
}
//#endregion

export default SubjectDetails;
