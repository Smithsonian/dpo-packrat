/**
 * AssetDetails
 *
 * This component renders details tab for Asset specific details used in DetailsTab component.
 */
import React from 'react';
import { Loader } from '../../../../../components';
import { GetDetailsTabDataForObjectQueryResult } from '../../../../../types/graphql';

interface AssetDetailsProps extends GetDetailsTabDataForObjectQueryResult {
    disabled: boolean;
}

function AssetDetails(props: AssetDetailsProps): React.ReactElement {
    const { data, loading } = props;

    if (!data || loading) {
        return <Loader minHeight='15vh' />;
    }

    return <span>Asset Details</span>;
}

export default AssetDetails;