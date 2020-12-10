/**
 * StakeholderDetails
 *
 * This component renders details tab for Stakeholder specific details used in DetailsTab component.
 */
import React from 'react';
import { Loader } from '../../../../../components';
import { GetDetailsTabDataForObjectQueryResult } from '../../../../../types/graphql';

interface StakeholderDetailsProps extends GetDetailsTabDataForObjectQueryResult {
    disabled: boolean;
}

function StakeholderDetails(props: StakeholderDetailsProps): React.ReactElement {
    const { data, loading } = props;

    if (!data || loading) {
        return <Loader minHeight='15vh' />;
    }

    return <span>Stakeholder Details</span>;
}

export default StakeholderDetails;