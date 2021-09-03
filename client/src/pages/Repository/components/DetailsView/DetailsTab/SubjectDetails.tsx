/* eslint-disable react-hooks/exhaustive-deps, react/jsx-max-props-per-line */

/**
 * SubjectDetails
 *
 * This component renders details tab for Subject specific details used in DetailsTab component.
 */
import { Box } from '@material-ui/core';
import React, { useEffect } from 'react';
import { DebounceNumberInput, FieldType, InputField, Loader } from '../../../../../components';
import { ItemDetailFields, SubjectDetailFields } from '../../../../../types/graphql';
import { isFieldUpdated } from '../../../../../utils/repository';
import { DetailComponentProps } from './index';
import { eSystemObjectType } from '../../../../../types/server';
import { useDetailTabStore } from '../../../../../store';

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
}

export function SubjectFields(props: SubjectFieldsProps): React.ReactElement {
    const { originalFields, Latitude, Longitude, Altitude, TS0, TS1, TS2, R0, R1, R2, R3, disabled, onChange } = props;

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
            <InputField
                viewMode
                required
                type='number'
                updated={isFieldUpdated(details, originalFields, 'Latitude')}
                disabled={disabled}
                label='Latitude'
                value={details.Latitude}
                name='Latitude'
                onChange={onChange}
            />
            <InputField
                viewMode
                required
                type='number'
                updated={isFieldUpdated(details, originalFields, 'Longitude')}
                disabled={disabled}
                label='Longitude'
                value={details.Longitude}
                name='Longitude'
                onChange={onChange}
            />
            <InputField
                viewMode
                required
                type='number'
                updated={isFieldUpdated(details, originalFields, 'Altitude')}
                disabled={disabled}
                label='Altitude'
                value={details.Altitude}
                name='Altitude'
                onChange={onChange}
            />
            <RotationOriginInput originalFields={originalFields} TS0={details.TS0} TS1={details.TS1} TS2={details.TS2} onChange={onChange} />
            <RotationQuaternionInput originalFields={originalFields} R0={details.R0} R1={details.R1} R2={details.R2} R3={details.R3} onChange={onChange} />
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

    const rowFieldProps = { justifyContent: 'space-between', style: { borderRadius: 0 } };

    const details = {
        TS0,
        TS1,
        TS2
    };

    return (
        <FieldType required label='Rotation Origin' direction='row' containerProps={rowFieldProps} width='auto'>
            <Box display='flex' flex={1} flexDirection='column'>
                <Box display='flex' justifyContent='flex-end'>
                    <DebounceNumberInput updated={ignoreUpdate ? false : isFieldUpdated(details, originalFields, 'TS0')} value={TS0} name='TS0' onChange={onChange} />
                    <DebounceNumberInput updated={ignoreUpdate ? false : isFieldUpdated(details, originalFields, 'TS1')} value={TS1} name='TS1' onChange={onChange} />
                    <DebounceNumberInput updated={ignoreUpdate ? false : isFieldUpdated(details, originalFields, 'TS2')} value={TS2} name='TS2' onChange={onChange} />
                </Box>
            </Box>
        </FieldType>
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
}

export function RotationQuaternionInput(props: RotationQuaternionInputProps): React.ReactElement {
    const { R0, R1, R2, R3, onChange, originalFields, ignoreUpdate } = props;

    const rowFieldProps = { justifyContent: 'space-between', style: { borderRadius: 0 } };

    const details = {
        R0,
        R1,
        R2,
        R3
    };
    return (
        <FieldType required label='Rotation Quaternion' direction='row' containerProps={rowFieldProps} width='auto'>
            <Box display='flex' flex={1} flexDirection='column'>
                <Box display='flex' justifyContent='flex-end'>
                    <DebounceNumberInput updated={ignoreUpdate ? false : isFieldUpdated(details, originalFields, 'R0')} value={R0} name='R0' onChange={onChange} />
                    <DebounceNumberInput updated={ignoreUpdate ? false : isFieldUpdated(details, originalFields, 'R1')} value={R1} name='R1' onChange={onChange} />
                    <DebounceNumberInput updated={ignoreUpdate ? false : isFieldUpdated(details, originalFields, 'R2')} value={R2} name='R2' onChange={onChange} />
                    <DebounceNumberInput updated={ignoreUpdate ? false : isFieldUpdated(details, originalFields, 'R3')} value={R3} name='R3' onChange={onChange} />
                </Box>
            </Box>
        </FieldType>
    );
}

export default SubjectDetails;
