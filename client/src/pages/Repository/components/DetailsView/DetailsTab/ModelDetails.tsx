/**
 * ModelDetails
 *
 * This component renders details tab for Model specific details used in DetailsTab component.
 */
import React from 'react';
import { Loader } from '../../../../../components';
import { GetDetailsTabDataForObjectQueryResult } from '../../../../../types/graphql';

interface ModelDetailsProps extends GetDetailsTabDataForObjectQueryResult {
    disabled: boolean;
}

function ModelDetails(props: ModelDetailsProps): React.ReactElement {
    const { data, loading } = props;

    if (!data || loading) {
        return <Loader minHeight='15vh' />;
    }

    return <span>Model Details</span>;
}

export default ModelDetails;