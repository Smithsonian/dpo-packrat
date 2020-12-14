/**
 * AssetVersionDetails
 *
 * This component renders details tab for AssetVersion specific details used in DetailsTab component.
 */
import React from 'react';
import { Loader } from '../../../../../components';
import { GetDetailsTabDataForObjectQueryResult } from '../../../../../types/graphql';

interface AssetVersionDetailsProps extends GetDetailsTabDataForObjectQueryResult {
    disabled: boolean;
}

function AssetVersionDetails(props: AssetVersionDetailsProps): React.ReactElement {
    const { data, loading } = props;

    if (!data || loading) {
        return <Loader minHeight='15vh' />;
    }

    return <span>AssetVersion Details</span>;
}

export default AssetVersionDetails;