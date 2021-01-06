/**
 * SceneDetails
 *
 * This component renders details tab for Scene specific details used in DetailsTab component.
 */
import React from 'react';
import { Loader } from '../../../../../components';
import { GetDetailsTabDataForObjectQueryResult } from '../../../../../types/graphql';

interface SceneDetailsProps extends GetDetailsTabDataForObjectQueryResult {
    disabled: boolean;
}
// TODO: KARAN: implement SceneDetails
function SceneDetails(props: SceneDetailsProps): React.ReactElement {
    const { data, loading } = props;

    if (!data || loading) {
        return <Loader minHeight='15vh' />;
    }

    return <span>Scene Details</span>;
}

export default SceneDetails;