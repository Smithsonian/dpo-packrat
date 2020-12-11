/**
 * ProjectDocumentationDetails
 *
 * This component renders details tab for Actor specific details used in DetailsTab component.
 */
import React, { useEffect, useState } from 'react';
import { Loader } from '../../../../../components';
import { GetDetailsTabDataForObjectQueryResult } from '../../../../../types/graphql';
import Description from '../../../../Ingestion/components/Metadata/Photogrammetry/Description';

interface ProjectDocumentationDetailsProps extends GetDetailsTabDataForObjectQueryResult {
    disabled: boolean;
}

interface ProjectDocumentationDetailsFields {
    Description?: string | null;
}

function ProjectDocumentationDetails(props: ProjectDocumentationDetailsProps): React.ReactElement {
    const { data, loading } = props;
    const [details, setDetails] = useState<ProjectDocumentationDetailsFields>({});

    useEffect(() => {
        if (data && !loading) {
            const { ProjectDocumentation } = data.getDetailsTabDataForObject;
            setDetails({
                Description: ProjectDocumentation?.Description
            });
        }
    }, [data, loading]);

    if (!data || loading) {
        return <Loader minHeight='15vh' />;
    }

    const onSetField = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = event.target;
        setDetails(details => ({ ...details, Description: value }));
    };

    return <Description viewMode value={details.Description ?? ''} onChange={onSetField} />;
}

export default ProjectDocumentationDetails;