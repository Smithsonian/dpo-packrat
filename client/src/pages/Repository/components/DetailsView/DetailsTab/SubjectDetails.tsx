/**
 * SubjectDetails
 *
 * This component renders details tab for Actor specific details used in DetailsTab component.
 */
import React from 'react';
import { Loader } from '../../../../../components';
import { GetDetailsTabDataForObjectQueryResult } from '../../../../../types/graphql';

interface SubjectDetailsProps extends GetDetailsTabDataForObjectQueryResult {
    disabled: boolean;
}

function SubjectDetails(props: SubjectDetailsProps): React.ReactElement {
    const { data, loading } = props;

    if (!data || loading) {
        return <Loader minHeight='15vh' />;
    }

    return <span>Subject Details</span>;
}

export default SubjectDetails;