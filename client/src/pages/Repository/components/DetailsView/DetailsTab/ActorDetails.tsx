/**
 * ActorDetails
 *
 * This component renders details tab for Actor specific details used in DetailsTab component.
 */
import { Box } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import { InputField, Loader } from '../../../../../components';
import { GetDetailsTabDataForObjectQueryResult } from '../../../../../types/graphql';

interface ActorDetailsProps extends GetDetailsTabDataForObjectQueryResult {
    disabled: boolean;
}

interface ActorDetailsFields {
    OrganizationName?: string | null;
}

function ActorDetails(props: ActorDetailsProps): React.ReactElement {
    const { data, loading, disabled, } = props;

    const [details, setDetails] = useState<ActorDetailsFields>({});

    useEffect(() => {
        if (data && !loading) {
            const { Actor } = data.getDetailsTabDataForObject;
            setDetails({
                OrganizationName: Actor?.OrganizationName,
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