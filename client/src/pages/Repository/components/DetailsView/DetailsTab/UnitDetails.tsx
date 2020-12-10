/**
 * UnitDetails
 *
 * This component renders details tab for Unit specific details used in DetailsTab component.
 */
import React from 'react';
import { Loader } from '../../../../../components';
import { GetDetailsTabDataForObjectQueryResult } from '../../../../../types/graphql';

interface UnitDetailsProps extends GetDetailsTabDataForObjectQueryResult {
    disabled: boolean;
}

function UnitDetails(props: UnitDetailsProps): React.ReactElement {
    const { data, loading } = props;

    if (!data || loading) {
        return <Loader minHeight='15vh' />;
    }

    return <span>Unit Details</span>;
}

export default UnitDetails;