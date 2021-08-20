/* eslint-disable react-hooks/exhaustive-deps */
/**
 * UnitDetails
 *
 * This component renders details tab for Unit specific details used in DetailsTab component.
 */
import { Box } from '@material-ui/core';
import React, { useEffect } from 'react';
import { InputField, Loader } from '../../../../../components';
import { isFieldUpdated } from '../../../../../utils/repository';
import { DetailComponentProps } from './index';
import { useDetailTabStore } from '../../../../../store';
import { eSystemObjectType } from '../../../../../types/server';

function UnitDetails(props: DetailComponentProps): React.ReactElement {
    const { data, loading, disabled, onUpdateDetail, objectType } = props;
    const [UnitDetails, updateDetailField] = useDetailTabStore(state => [state.UnitDetails, state.updateDetailField]);

    useEffect(() => {
        onUpdateDetail(objectType, UnitDetails);
    }, [UnitDetails]);

    if (!data || loading) {
        return <Loader minHeight='15vh' />;
    }

    const onSetField = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        updateDetailField(eSystemObjectType.eUnit, name, value);
    };

    const unitData = data.getDetailsTabDataForObject?.Unit;

    return (
        <Box>
            <InputField
                viewMode
                required
                updated={isFieldUpdated(UnitDetails, unitData, 'Abbreviation')}
                disabled={disabled}
                label='Abbreviation'
                value={UnitDetails?.Abbreviation}
                name='Abbreviation'
                onChange={onSetField}
            />
            <InputField
                viewMode
                required
                updated={isFieldUpdated(UnitDetails, unitData, 'ARKPrefix')}
                disabled={disabled}
                label='ARKPrefix'
                value={UnitDetails?.ARKPrefix}
                name='ARKPrefix'
                onChange={onSetField}
            />
        </Box>
    );
}

export default UnitDetails;
