/**
 * ProjectDetails
 *
 * This component renders details tab for Actor specific details used in DetailsTab component.
 */
import React from 'react';
import { Loader } from '../../../../../components';
import { GetDetailsTabDataForObjectQueryResult } from '../../../../../types/graphql';

interface ProjectDetailsProps extends GetDetailsTabDataForObjectQueryResult {
    disabled: boolean;
}

function ProjectDetails(props: ProjectDetailsProps): React.ReactElement {
    const { data, loading } = props;

    if (!data || loading) {
        return <Loader minHeight='15vh' />;
    }

    return <span>Project Details</span>;
}

export default ProjectDetails;