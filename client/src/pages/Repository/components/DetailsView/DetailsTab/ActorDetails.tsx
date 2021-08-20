/* eslint-disable react-hooks/exhaustive-deps */
/**
 * ActorDetails
 *
 * This component renders details tab for Actor specific details used in DetailsTab component.
 */
import { Box } from '@material-ui/core';
import React, { useEffect } from 'react';
import { InputField, Loader } from '../../../../../components';
import { isFieldUpdated } from '../../../../../utils/repository';
import { DetailComponentProps } from './index';
import { eSystemObjectType } from '../../../../../types/server';
import { useDetailTabStore } from '../../../../../store';

function ActorDetails(props: DetailComponentProps): React.ReactElement {
    const { data, loading, disabled, onUpdateDetail, objectType } = props;
    const [ActorDetails, updateDetailField] = useDetailTabStore(state => [state.ActorDetails, state.updateDetailField]);

    useEffect(() => {
        onUpdateDetail(objectType, ActorDetails);
    }, [ActorDetails]);

    if (!data || loading) {
        return <Loader minHeight='15vh' />;
    }

    const onSetField = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        updateDetailField(eSystemObjectType.eActor, name, value);
    };

    const actorData = data.getDetailsTabDataForObject?.Actor;

    return (
        <Box>
            <InputField
                viewMode
                required
                updated={isFieldUpdated(ActorDetails, actorData, 'OrganizationName')}
                disabled={disabled}
                label='OrganizationName'
                value={ActorDetails?.OrganizationName}
                name='OrganizationName'
                onChange={onSetField}
            />
        </Box>
    );
}

export default ActorDetails;
