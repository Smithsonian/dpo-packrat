/**
 * CaptureDataDetails
 *
 * This component renders details tab for CaptureData specific details used in DetailsTab component.
 */
import React from 'react';
import { Loader } from '../../../../../components';
import { GetDetailsTabDataForObjectQueryResult } from '../../../../../types/graphql';

interface CaptureDataDetailsProps extends GetDetailsTabDataForObjectQueryResult {
    disabled: boolean;
}

function CaptureDataDetails(props: CaptureDataDetailsProps): React.ReactElement {
    const { data, loading } = props;

    if (!data || loading) {
        return <Loader minHeight='15vh' />;
    }

    return <span>CaptureData Details</span>;
}

export default CaptureDataDetails;