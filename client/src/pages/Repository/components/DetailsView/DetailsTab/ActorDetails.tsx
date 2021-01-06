/* eslint-disable react-hooks/exhaustive-deps */
/**
 * ActorDetails
 *
 * This component renders details tab for Actor specific details used in DetailsTab component.
 */
import { Box } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import { InputField, Loader } from '../../../../../components';
import { ActorDetailFields } from '../../../../../types/graphql';
import { DetailComponentProps } from './index';

function ActorDetails(props: DetailComponentProps): React.ReactElement {
    const { data, loading, disabled, onUpdateDetail, objectType } = props;

    const [details, setDetails] = useState<ActorDetailFields>({});

    useEffect(() => {
        if (data && !loading) {
            const { Actor } = data.getDetailsTabDataForObject;
            setDetails({
                OrganizationName: Actor?.OrganizationName,
            });
        }
    }, [data, loading]);

    useEffect(() => {
        onUpdateDetail(objectType, details);
    }, [details]);

    if (!data || loading) {
        return <Loader minHeight='15vh' />;
    }

    const onSetField = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setDetails(details => ({ ...details, [name]: value }));
    };

    return (
        <Box>
            <InputField
                viewMode
                required
                disabled={disabled}
                label='OrganizationName'
                value={details?.OrganizationName}
                name='OrganizationName'
                onChange={onSetField}
            />
        </Box>
    );
}

export default ActorDetails;