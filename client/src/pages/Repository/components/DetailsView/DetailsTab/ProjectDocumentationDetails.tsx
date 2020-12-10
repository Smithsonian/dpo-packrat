/**
 * ProjectDocumentationDetails
 *
 * This component renders details tab for ProjectDocumentation specific details used in DetailsTab component.
 */
import React from 'react';
import { Loader } from '../../../../../components';
import { GetDetailsTabDataForObjectQueryResult } from '../../../../../types/graphql';

interface ProjectDocumentationDetailsProps extends GetDetailsTabDataForObjectQueryResult {
    disabled: boolean;
}

function ProjectDocumentationDetails(props: ProjectDocumentationDetailsProps): React.ReactElement {
    const { data, loading } = props;

    if (!data || loading) {
        return <Loader minHeight='15vh' />;
    }

    return <span>ProjectDocumentation Details</span>;
}

export default ProjectDocumentationDetails;