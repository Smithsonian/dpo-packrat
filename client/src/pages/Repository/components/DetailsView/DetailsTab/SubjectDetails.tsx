/* eslint-disable react-hooks/exhaustive-deps, react/jsx-max-props-per-line, @typescript-eslint/no-explicit-any */

/**
 * SubjectDetails
 *
 * This component renders details tab for Subject specific details used in DetailsTab component.
 */
import { Box, Table, TableBody, TableCell, TableContainer, TableRow, Checkbox } from '@material-ui/core';
import React, { useEffect } from 'react';
import { Loader } from '../../../../../components';
import { ItemDetailFields, SubjectDetailFields } from '../../../../../types/graphql';
import { isFieldUpdated } from '../../../../../utils/repository';
import { DetailComponentProps } from './index';
import { eSystemObjectType } from '@dpo-packrat/common';
import { useDetailTabStore } from '../../../../../store';
import clsx from 'clsx';
import { DebounceInput } from 'react-debounce-input';
import { useStyles, updatedFieldStyling } from './CaptureDataDetails';
import LabelTooltipText from '../../../../../components/controls/LabelTooltipText';

function SubjectDetails(props: DetailComponentProps): React.ReactElement {
    const { data, loading, disabled, onUpdateDetail, objectType } = props;
    const [SubjectDetails, updateDetailField] = useDetailTabStore(state => [state.SubjectDetails, state.updateDetailField]);

    useEffect(() => {
        onUpdateDetail(objectType, SubjectDetails);
    }, [SubjectDetails]);

    if (!data || loading) {
        return <Loader minHeight='15vh' />;
    }

    const onSetField = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;

        updateDetailField(eSystemObjectType.eSubject, name, value);
    };

    const subjectData = data.getDetailsTabDataForObject?.Subject;
    return (
        <Box>
            <SubjectFields {...SubjectDetails} originalFields={subjectData} disabled={disabled} onChange={onSetField} />
        </Box>
    );
}

interface SubjectFieldsProps extends SubjectDetailFields {
    disabled: boolean;
    originalFields?: SubjectDetailFields | ItemDetailFields | null;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    isItemView?: boolean;
    setCheckboxField?: (event) => void;
    ItemDetails?: any;
    itemData?: any;
    subtitle?: string;
    originalSubtitle?: string;
    onSubtitleUpdate?: (event: React.ChangeEvent<HTMLInputElement>) => void;
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
        isItemView = false,
        setCheckboxField,
        ItemDetails,
        itemData,
        subtitle,
        originalSubtitle,
        onSubtitleUpdate
    } = props;
    const classes = useStyles();
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
        R3,
        subtitle
    };

    return (
        <React.Fragment>
            <Box minWidth='fit-content' style={{ backgroundColor: 'rgb(236, 245, 253)' }}>
                <TableContainer style={{ width: 'fit-content', paddingTop: '5px', paddingBottom: '5px' }}>
                    <Table className={classes.table}>
                        <TableBody>
                            {(isItemView && setCheckboxField && ItemDetails && itemData) && (
                                <React.Fragment>
                                    <TableRow>
                                        <TableCell className={classes.tableCell}>
                                            {/* <Typography className={classes.labelText}>Subtitle</Typography> */}
                                            <LabelTooltipText
                                                label='Subtitle'
                                                labelTooltipTxt='This is the subtitle of this media asset.'
                                            />
                                        </TableCell>
                                        <TableCell className={classes.tableCell}>
                                            <DebounceInput
                                                element='input'
                                                title='Subtitle-input'
                                                value={subtitle}
                                                type='string'
                                                name='Subtitle'
                                                onChange={onSubtitleUpdate as (event: React.ChangeEvent<HTMLInputElement>) => void}
                                                className={clsx(classes.input, classes.datasetFieldInput)}
                                                style={{
                                                    height: 22,
                                                    fontSize: '0.8rem',
                                                    padding: '0px 10px',
                                                    borderRadius: 5,
                                                    border: '1px solid rgba(141, 171, 196, 0.4)',
                                                    ...updatedFieldStyling(subtitle !== originalSubtitle)
                                                }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className={classes.tableCell}>
                                            {/* <Typography className={classes.labelText}>Entire Subject</Typography> */}
                                            <LabelTooltipText
                                                label='Entire Subject'
                                                labelTooltipTxt='This is the assigned subject of the media asset'
                                            />
                                        </TableCell>
                                        <TableCell className={classes.tableCell} style={{ verticalAlign: 'middle' }}>
                                            <Checkbox
                                                className={classes.checkbox}
                                                name='EntireSubject'
                                                onChange={setCheckboxField}
                                                checked={ItemDetails?.EntireSubject}
                                                title='EntireSubject-input'
                                                disabled={disabled}
                                                size='small'
                                                style={{ ...updatedFieldStyling(isFieldUpdated(ItemDetails, itemData, 'EntireSubject')) }}
                                                color='primary'
                                            />
                                        </TableCell>
                                    </TableRow>
                                </React.Fragment>
                            )}
                            {
                                isItemView ? null : (
                                    <>
                                        <TableRow className={classes.tableRow}>
                                            <TableCell className={classes.tableCell}>
                                                {/* <Typography className={classes.labelText}>Latitude</Typography> */}
                                                <LabelTooltipText
                                                    label='Lattitude'
                                                    labelTooltipTxt='This is the Lattitude of the Subject.'
                                                />
                                            </TableCell>
                                            <TableCell className={clsx(classes.tableCell, classes.valueText)}>
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
                                        <TableRow className={classes.tableRow}>
                                            <TableCell className={classes.tableCell}>
                                                {/* <Typography className={classes.labelText}>Longitude</Typography> */}
                                                <LabelTooltipText
                                                    label='Longitude'
                                                    labelTooltipTxt='This is the Longitude of the Subject.'
                                                />
                                            </TableCell>
                                            <TableCell className={clsx(classes.tableCell, classes.valueText)}>
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
                                        <TableRow className={classes.tableRow}>
                                            <TableCell className={classes.tableCell}>
                                                {/* <Typography className={classes.labelText}>Altitude</Typography> */}
                                                <LabelTooltipText
                                                    label='Altitude'
                                                    labelTooltipTxt='This is the altitude of the subject.'
                                                />
                                            </TableCell>
                                            <TableCell className={clsx(classes.tableCell, classes.valueText)}>
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
                                )
                            }
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
    originalFields?: SubjectDetailFields | ItemDetailFields | null;
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

    return (
        <TableRow>
            <TableCell style={{ border: 'none', padding: '1px 10px' }}>
                {/* <Typography style={{ fontSize: '0.8rem' }}>Rotation Origin</Typography> */}
                <LabelTooltipText
                    label='Rotation Origin'
                    labelTooltipTxt='This is the Rotation Origin of the subject.'
                />
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
    originalFields?: SubjectDetailFields | ItemDetailFields | null;
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
    return (
        <TableRow>
            <TableCell style={{ border: 'none', padding: '1px 10px' }}>
                {/* <Typography style={{ fontSize: '0.8rem' }}>Rotation Quaternion</Typography> */}
                <LabelTooltipText
                    label='Rotation Quaternion'
                    labelTooltipTxt='This is the Rotation Quaternion of the subject.'
                />
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
                        />
                    </Box>
                </Box>
            </TableCell>
        </TableRow>
    );
}

export default SubjectDetails;
