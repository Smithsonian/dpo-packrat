/**
 * IntermediaryFileDetails
 *
 * This component renders details tab for IntermediaryFile specific details used in DetailsTab component.
 */
import React from 'react';
import { Loader } from '../../../../../components';
import { GetDetailsTabDataForObjectQueryResult } from '../../../../../types/graphql';

interface IntermediaryFileDetailsProps extends GetDetailsTabDataForObjectQueryResult {
    disabled: boolean;
}

function IntermediaryFileDetails(props: IntermediaryFileDetailsProps): React.ReactElement {
    const { data, loading } = props;

    if (!data || loading) {
        return <Loader minHeight='15vh' />;
    }

    return <span>IntermediaryFile Details</span>;
}

export default IntermediaryFileDetails;