/**
 * ActorDetails
 *
 * This component renders details tab for Actor specific details used in DetailsTab component.
 */
import React from 'react';
import { Loader } from '../../../../../components';
import { GetDetailsTabDataForObjectQueryResult } from '../../../../../types/graphql';

interface ActorDetailsProps extends GetDetailsTabDataForObjectQueryResult {
    disabled: boolean;
}

function ActorDetails(props: ActorDetailsProps): React.ReactElement {
    const { data, loading } = props;

    if (!data || loading) {
        return <Loader minHeight='15vh' />;
    }

    return <span>Actor Details</span>;
}

export default ActorDetails;