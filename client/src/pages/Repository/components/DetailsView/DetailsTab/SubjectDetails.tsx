/* eslint-disable react-hooks/exhaustive-deps, react/jsx-max-props-per-line, @typescript-eslint/no-explicit-any */

/**
 * SubjectDetails
 *
 * This component renders details tab for Subject specific details used in DetailsTab component.
 */
import { Box, Table, TableBody, TableCell, TableContainer, TableRow, Typography, Tooltip, Select, MenuItem } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import { Loader } from '../../../../../components';
import { SubjectDetailFields, ObjectPropertyResult } from '../../../../../types/graphql';
import { isFieldUpdated } from '../../../../../utils/repository';
import { DetailComponentProps } from './index';
import { eSystemObjectType } from '@dpo-packrat/common';
import { useDetailTabStore } from '../../../../../store';
import clsx from 'clsx';
import { DebounceInput } from 'react-debounce-input';
import { useStyles as useTableStyles } from '../../../../Repository/components/DetailsView/DetailsTab/CaptureDataDetails';
import { useStyles, updatedFieldStyling } from './CaptureDataDetails';

function SubjectDetails(props: DetailComponentProps): React.ReactElement {
    const { data, loading, disabled, onUpdateDetail, objectType, objectProperties } = props;
    const [SubjectDetails, updateDetailField] = useDetailTabStore(state => [state.SubjectDetails, state.updateDetailField]);

    useEffect(() => {
        onUpdateDetail(objectType, SubjectDetails);
    }, [SubjectDetails]);

    if (!data || loading) {
        return <Loader minHeight='15vh' />;
    }

    const onSetField = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = event.target;
        console.log('onChange: ',name,'-',value);

        updateDetailField(eSystemObjectType.eSubject, name, value);
    };
    const getSensitivityObjectProperty = (objectProperties: ObjectPropertyResult[] | null | undefined): ObjectPropertyResult | null => {

        if(!objectProperties || objectProperties.length===0)
            return null;

        const result: ObjectPropertyResult | undefined = objectProperties.find( p => p.propertyType==='sensitivity' );
        return result ?? null;
    };

    const subjectData = data.getDetailsTabDataForObject?.Subject;
    console.log('subject data: ',subjectData);
    console.log('SubjectDetails.objProps: ',objectProperties);

    return (
        <Box display='flex' gridGap={16}>
            {/* LEFT = existing geo/rotation UI */}
            <Box flex={1} minWidth={420}>
                <SubjectFields {...SubjectDetails} originalFields={subjectData} disabled={disabled} onChange={onSetField} />
            </Box>

            <Box flex={1} minWidth={420}>
                <ObjectPropertyFields objectProperty={ getSensitivityObjectProperty(objectProperties) } disabled={disabled} onChange={onSetField} />
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
            <TableCell style={{ border: 'none', padding: '1px 10px' }}>
                <TableCell className={clsx(tableClasses.tableCell, classes.fieldLabel)}>
                    <Typography className={tableClasses.labelText}>Rotation Origin</Typography>
                </TableCell>
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

//#region Sensitivity Fields
interface ObjectPropertyProps {
    objectProperty?: ObjectPropertyResult | null;
    disabled: boolean;
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}
export function ObjectPropertyFields(props: ObjectPropertyProps): React.ReactElement {
    const [currentLevel, setCurrentLevel] = useState(0);

    const classes = useStyles();
    const tableClasses = useTableStyles();

    const {
        objectProperty,
        disabled,
        onChange
    } = props;

    // if no object property provided, render nothing
    if(!objectProperty)
        return <>No Object Properties</>;

    const details = {
        propertyType: objectProperty.propertyType,
        level: objectProperty.level,
        rationale: objectProperty.rationale,
        contactName: objectProperty.contactName,
        contactEmail: objectProperty.contactEmail,
        contactDepartment: objectProperty.contactDepartment,
        contactUnit: objectProperty.contactUnit,
        disabled
    };

    const getLevelOptions = (propertyType: string): { label: string, value: number }[] => {
        switch(propertyType) {
            case 'sensitivity': {
                return [
                    { label: 'None', value: 0 },
                    { label: 'Sensitive', value: 1 },
                    { label: 'Restricted', value: 2 },
                ];
            } break;

            default:
                return [];
        }
    };
    const onLevelChange = (e: React.ChangeEvent<{ name?: string; value: unknown }>) => {
        setCurrentLevel(Number(e.target.value));

        // wrap the values to match what onChange expects
        onChange({
            target: { name: 'level', value: e.target.value }
        } as unknown as React.ChangeEvent<HTMLInputElement>);
    };

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
                                        <Select
                                            labelId={details.propertyType}
                                            label={`${details.propertyType} ${'Level'}`}
                                            disabled={disabled}
                                            value={currentLevel}
                                            onChange={onLevelChange}
                                            className={clsx(classes.select, classes.datasetFieldSelect)}
                                            SelectDisplayProps={{ style: { paddingLeft: '10px', paddingRight: '10px', borderRadius: '5px' } }}
                                        >
                                            { getLevelOptions(details.propertyType).map(opt => (
                                                <MenuItem key={opt.value} value={opt.value}>
                                                    {opt.label} ({opt.value})
                                                </MenuItem>
                                            )) }
                                        </Select>
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
                                                    disabled={disabled}
                                                    className={clsx(classes.input, classes.fieldSizing)}
                                                    // updated={isFieldUpdated(CaptureDataDetails, captureDataData, 'description')}
                                                    forceNotifyByEnter={false}
                                                    debounceTimeout={400}
                                                    style={{ width: '100%', minWidth: '10rem', minHeight: '2rem', textAlign: 'left', padding: '5px' }}
                                                />
                                            </TableCell>
                                        </TableRow>
                                        <TableRow className={tableClasses.tableRow}>
                                            <TableCell className={clsx(tableClasses.tableCell, classes.fieldLabel)}>
                                                <Typography className={tableClasses.labelText}>Contact Name</Typography>
                                            </TableCell>
                                            <TableCell className={clsx(tableClasses.tableCell)}>
                                                <DebounceInput
                                                    element='input'
                                                    title='ContactName-input'
                                                    disabled={disabled}
                                                    value={details.contactName || ''}
                                                    type='string'
                                                    name='contactName'
                                                    onChange={onChange}
                                                    className={clsx(classes.input, classes.datasetFieldInput)}
                                                    // style={{ ...updatedFieldStyling(isFieldUpdated(details, originalFields, 'Latitude')) }}
                                                />
                                            </TableCell>
                                        </TableRow>
                                        <TableRow className={tableClasses.tableRow}>
                                            <TableCell className={clsx(tableClasses.tableCell, classes.fieldLabel)}>
                                                <Typography className={tableClasses.labelText}>Contact Email</Typography>
                                            </TableCell>
                                            <TableCell className={clsx(tableClasses.tableCell)}>
                                                <DebounceInput
                                                    element='input'
                                                    title='ContactEmail-input'
                                                    disabled={disabled}
                                                    value={details.contactEmail || ''}
                                                    type='string'
                                                    name='contactEmail'
                                                    onChange={onChange}
                                                    className={clsx(classes.input, classes.datasetFieldInput)}
                                                    // style={{ ...updatedFieldStyling(isFieldUpdated(details, originalFields, 'Latitude')) }}
                                                />
                                            </TableCell>
                                        </TableRow>
                                        <TableRow className={tableClasses.tableRow}>
                                            <TableCell className={clsx(tableClasses.tableCell, classes.fieldLabel)}>
                                                <Typography className={tableClasses.labelText}>Contact Unit</Typography>
                                            </TableCell>
                                            <TableCell className={clsx(tableClasses.tableCell)}>
                                                Contact Unit
                                            </TableCell>
                                        </TableRow>
                                        <TableRow className={tableClasses.tableRow}>
                                            <TableCell className={clsx(tableClasses.tableCell, classes.fieldLabel)}>
                                                <Typography className={tableClasses.labelText}>Contact Department</Typography>
                                            </TableCell>
                                            <TableCell className={clsx(tableClasses.tableCell)}>
                                                <DebounceInput
                                                    element='input'
                                                    title='ContactDepartment-input'
                                                    disabled={disabled}
                                                    value={details.contactDepartment || ''}
                                                    type='string'
                                                    name='contactDepartment'
                                                    onChange={onChange}
                                                    className={clsx(classes.input, classes.datasetFieldInput)}
                                                    // style={{ ...updatedFieldStyling(isFieldUpdated(details, originalFields, 'Latitude')) }}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    </>
                                )}
                            </>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </React.Fragment>
    );
}

// type SensitivityForm = {
//     level: 0 | 1 | 2 | 3;
//     rationale: string;
//     contactName?: string | null;
//     contactEmail?: string | null;
//     contactDepartment?: string | null;
//     contactUnit?: number | null;
//     contactUserId?: number | null;
// };

// const SENSITIVITY_OPTIONS = [
//     { label: 'none',         value: 0 as const },
//     { label: 'sensitive',    value: 1 as const },
//     { label: 'restricted',   value: 2 as const },
//     { label: 'confidential', value: 3 as const },
// ];

// function pickSensitivity(ops: ObjectPropertyResult[] | null | undefined): ObjectPropertyResult | null {
//     if (!ops) return null;
//     return ops.find(op => op.propertyType?.toLowerCase() === 'sensitivity') ?? null;
// }

// function SensitivityEditor({
//     disabled,
//     objectProperties,
//     onChange
// }: {
//     disabled: boolean;
//     objectProperties: ObjectPropertyResult[];
//     onChange?: (ops: ObjectPropertyResult[] | null) => void;
// }) {
//     const existing = pickSensitivity(objectProperties);
//     const [form, setForm] = React.useState<SensitivityForm>({
//         level: (existing?.level ?? 0) as 0|1|2|3,
//         rationale: existing?.rationale ?? '',
//         contactName: existing?.contactName ?? '',
//         contactEmail: existing?.contactEmail ?? '',
//         contactDepartment: existing?.contactDepartment ?? '',
//         contactUnit: existing?.contactUnit ?? null,
//         contactUserId: existing?.contactUserId ?? null
//     });

//     // keep internal state in sync if parent props change
//     React.useEffect(() => {
//         const fresh = pickSensitivity(objectProperties);
//         setForm({
//             level: (fresh?.level ?? 0) as 0|1|2|3,
//             rationale: fresh?.rationale ?? '',
//             contactName: fresh?.contactName ?? '',
//             contactEmail: fresh?.contactEmail ?? '',
//             contactDepartment: fresh?.contactDepartment ?? '',
//             contactUnit: fresh?.contactUnit ?? null,
//             contactUserId: fresh?.contactUserId ?? null
//         });
//     }, [JSON.stringify(objectProperties)]);

//     const pushUp = (next: SensitivityForm) => {
//         if (!onChange) return;
//         // Build a NEW ObjectPropertyResult[] containing just the sensitivity property for now.
//         // Future: you can merge with other property types here.
//         const payload: ObjectPropertyResult = {
//             __typename: 'ObjectPropertyResult',
//             propertyType: 'sensitivity',
//             level: next.level,
//             rationale: next.rationale,
//             contactName: next.contactName ?? null,
//             contactEmail: next.contactEmail ?? null,
//             contactDepartment: next.contactDepartment ?? null,
//             contactUnit: next.contactUnit ?? null,
//             contactUserId: next.contactUserId ?? null
//         };
//         // Convention: if level === 0 (none), still send the property with level=0 so the server can clear it.
//         onChange([payload]);
//     };

//     const setField =
//         <K extends keyof SensitivityForm>(key: K) =>
//             (value: SensitivityForm[K]) => {
//                 const next = { ...form, [key]: value };
//                 setForm(next);
//                 pushUp(next);
//             };

//     const showExtra = form.level > 0;

//     return (
//         <Box style={{ background: 'rgba(236,245,253,0.6)', padding: 12, borderRadius: 8 }}>
//             <Typography variant='subtitle2' style={{ marginBottom: 8 }}>Sensitivity</Typography>

//             <Select
//                 value={form.level}
//                 onChange={(e) => setField('level')(e.target.value as 0|1|2|3)}
//                 disabled={disabled}
//                 fullWidth
//                 style={{ marginBottom: 12 }}
//             >
//                 {SENSITIVITY_OPTIONS.map(opt => (
//                     <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
//                 ))}
//             </Select>

//             {showExtra && (
//                 <>
//                     <LabelTooltipText label='Rationale' labelTooltipTxt='Why is this object sensitive?' />
//                     <input
//                         value={form.rationale}
//                         onChange={(e) => setField('rationale')(e.target.value)}
//                         disabled={disabled}
//                         className='MuiInputBase-input'
//                         style={{ width: '100%', height: 28, marginBottom: 12, border: '1px solid rgba(141,171,196,0.4)', borderRadius: 5, padding: '0 8px' }}
//                     />

//                     <LabelTooltipText label='Contact Name' labelTooltipTxt='Name for questions about access.' />
//                     <input
//                         value={form.contactName ?? ''}
//                         onChange={(e) => setField('contactName')(e.target.value)}
//                         disabled={disabled}
//                         className='MuiInputBase-input'
//                         style={{ width: '100%', height: 28, marginBottom: 12, border: '1px solid rgba(141,171,196,0.4)', borderRadius: 5, padding: '0 8px' }}
//                     />

//                     <LabelTooltipText label='Contact Email' labelTooltipTxt='Email for questions about access.' />
//                     <input
//                         value={form.contactEmail ?? ''}
//                         onChange={(e) => setField('contactEmail')(e.target.value)}
//                         disabled={disabled}
//                         className='MuiInputBase-input'
//                         style={{ width: '100%', height: 28, marginBottom: 12, border: '1px solid rgba(141,171,196,0.4)', borderRadius: 5, padding: '0 8px' }}
//                     />

//                     {/* Optional: if you surface a user picker later, wire it to contactUserId */}
//                     {/* <Hidden for now /> */}

//                     <LabelTooltipText label='Unit' labelTooltipTxt='Primary SI Unit for this contact.' />
//                     <Select
//                         value={form.contactUnit ?? ''}
//                         onChange={(e) => setField('contactUnit')(e.target.value === '' ? null : Number(e.target.value))}
//                         disabled={disabled}
//                         fullWidth
//                         displayEmpty
//                         style={{ marginBottom: 12 }}
//                     >
//                         <MenuItem value=''><em>Select unit…</em></MenuItem>
//                         {/* Populate these options from parent or a tiny Units hook if you have it */}
//                         {/* {units.map(u => <MenuItem key={u.idUnit} value={u.idUnit}>{u.Name}</MenuItem>)} */}
//                     </Select>

//                     <LabelTooltipText label='Department' labelTooltipTxt='Department within the unit.' />
//                     <input
//                         value={form.contactDepartment ?? ''}
//                         onChange={(e) => setField('contactDepartment')(e.target.value)}
//                         disabled={disabled}
//                         className='MuiInputBase-input'
//                         style={{ width: '100%', height: 28, border: '1px solid rgba(141,171,196,0.4)', borderRadius: 5, padding: '0 8px' }}
//                     />
//                 </>
//             )}
//         </Box>
//     );
// }
//#endregion

export default SubjectDetails;
