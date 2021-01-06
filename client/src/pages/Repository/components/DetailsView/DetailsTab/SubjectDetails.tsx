/* eslint-disable react-hooks/exhaustive-deps */
/**
 * SubjectDetails
 *
 * This component renders details tab for Subject specific details used in DetailsTab component.
 */
import { Box } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import { DebounceNumberInput, FieldType, InputField, Loader } from '../../../../../components';
import { SubjectDetailFields } from '../../../../../types/graphql';
import { DetailComponentProps } from './index';

function SubjectDetails(props: DetailComponentProps): React.ReactElement {
    const { data, loading, disabled, onUpdateDetail, objectType } = props;

    const [details, setDetails] = useState<SubjectDetailFields>({});

    useEffect(() => {
        onUpdateDetail(objectType, details);
    }, [details]);

    useEffect(() => {
        if (data && !loading) {
            const { Subject } = data.getDetailsTabDataForObject;
            setDetails({
                Latitude: Subject?.Latitude,
                Longitude: Subject?.Longitude,
                Altitude: Subject?.Altitude,
                TS0: Subject?.TS0,
                TS1: Subject?.TS1,
                TS2: Subject?.TS2,
                R0: Subject?.R0,
                R1: Subject?.R1,
                R2: Subject?.R2,
                R3: Subject?.R3
            });
        }
    }, [data, loading]);

    if (!data || loading) {
        return <Loader minHeight='15vh' />;
    }

    const onSetField = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setDetails(details => ({ ...details, [name]: value }));
    };

    return (
        <Box>
            <SubjectFields {...details} disabled={disabled} onChange={onSetField} />
        </Box>
    );
}

interface SubjectFieldsProps extends SubjectDetailFields {
    disabled: boolean;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function SubjectFields(props: SubjectFieldsProps): React.ReactElement {
    const {
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
        onChange
    } = props;

    return (
        <React.Fragment>
            <InputField
                viewMode
                required
                type='number'
                disabled={disabled}
                label='Latitude'
                value={Latitude}
                name='Latitude'
                onChange={onChange}
            />
            <InputField
                viewMode
                required
                type='number'
                disabled={disabled}
                label='Longitude'
                value={Longitude}
                name='Longitude'
                onChange={onChange}
            />
            <InputField
                viewMode
                required
                type='number'
                disabled={disabled}
                label='Altitude'
                value={Altitude}
                name='Altitude'
                onChange={onChange}
            />
            <RotationOriginInput
                TS0={TS0}
                TS1={TS1}
                TS2={TS2}
                onChange={onChange}
            />
            <RotationQuaternionInput
                R0={R0}
                R1={R1}
                R2={R2}
                R3={R3}
                onChange={onChange}
            />
        </React.Fragment>
    );
}

interface RotationOriginInputProps {
    TS0?: number | null;
    TS1?: number | null;
    TS2?: number | null;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

function RotationOriginInput(props: RotationOriginInputProps): React.ReactElement {
    const { TS0, TS1, TS2, onChange } = props;

    const rowFieldProps = { justifyContent: 'space-between', style: { borderRadius: 0 } };

    return (
        <FieldType
            required
            label='Rotation Origin'
            direction='row'
            containerProps={rowFieldProps}
            width='auto'
        >
            <Box display='flex' flex={1} flexDirection='column'>
                <Box display='flex' justifyContent='flex-end'>
                    <DebounceNumberInput value={TS0} name='TS0' onChange={onChange} />
                    <DebounceNumberInput value={TS1} name='TS1' onChange={onChange} />
                    <DebounceNumberInput value={TS2} name='TS2' onChange={onChange} />
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
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

function RotationQuaternionInput(props: RotationQuaternionInputProps): React.ReactElement {
    const { R0, R1, R2, R3, onChange } = props;

    const rowFieldProps = { justifyContent: 'space-between', style: { borderRadius: 0 } };

    return (
        <FieldType
            required
            label='Rotation Quaternion'
            direction='row'
            containerProps={rowFieldProps}
            width='auto'
        >
            <Box display='flex' flex={1} flexDirection='column'>
                <Box display='flex' justifyContent='flex-end'>
                    <DebounceNumberInput value={R0} name='R0' onChange={onChange} />
                    <DebounceNumberInput value={R1} name='R1' onChange={onChange} />
                    <DebounceNumberInput value={R2} name='R2' onChange={onChange} />
                    <DebounceNumberInput value={R3} name='R3' onChange={onChange} />
                </Box>
            </Box>
        </FieldType>
    );
}

export default SubjectDetails;