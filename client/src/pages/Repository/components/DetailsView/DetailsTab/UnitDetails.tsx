/* eslint-disable react-hooks/exhaustive-deps */
/**
 * UnitDetails
 *
 * This component renders details tab for Unit specific details used in DetailsTab component.
 */
import { Box } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import { InputField, Loader } from '../../../../../components';
import { UnitDetailFields } from '../../../../../types/graphql';
import { isFieldUpdated } from '../../../../../utils/repository';
import { DetailComponentProps } from './index';

function UnitDetails(props: DetailComponentProps): React.ReactElement {
    const { data, loading, disabled, onUpdateDetail, objectType } = props;
    const [details, setDetails] = useState<UnitDetailFields>({});

    useEffect(() => {
        onUpdateDetail(objectType, details);
    }, [details]);

    useEffect(() => {
        if (data && !loading) {
            const { Unit } = data.getDetailsTabDataForObject;
            setDetails({
                Abbreviation: Unit?.Abbreviation,
                ARKPrefix: Unit?.ARKPrefix
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

    const unitData = data.getDetailsTabDataForObject?.Unit;

    return (
        <Box>
            <InputField
                viewMode
                required
                updated={isFieldUpdated(details, unitData, 'Abbreviation')}
                disabled={disabled}
                label='Abbreviation'
                value={details?.Abbreviation}
                name='Abbreviation'
                onChange={onSetField}
            />
            <InputField
                viewMode
                required
                updated={isFieldUpdated(details, unitData, 'ARKPrefix')}
                disabled={disabled}
                label='ARKPrefix'
                value={details?.ARKPrefix}
                name='ARKPrefix'
                onChange={onSetField}
            />
        </Box>
    );
}

export default UnitDetails;