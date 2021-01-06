/* eslint-disable react-hooks/exhaustive-deps */
/**
 * ProjectDetails
 *
 * This component renders details tab for Actor specific details used in DetailsTab component.
 */
import React, { useEffect, useState } from 'react';
import { Loader } from '../../../../../components';
import { ProjectDetailFields } from '../../../../../types/graphql';
import Description from '../../../../Ingestion/components/Metadata/Photogrammetry/Description';
import { DetailComponentProps } from './index';

function ProjectDetails(props: DetailComponentProps): React.ReactElement {
    const { data, loading, disabled, onUpdateDetail, objectType } = props;

    const [details, setDetails] = useState<ProjectDetailFields>({});

    useEffect(() => {
        onUpdateDetail(objectType, details);
    }, [details]);

    useEffect(() => {
        if (data && !loading) {
            const { Project } = data.getDetailsTabDataForObject;
            setDetails({
                Description: Project?.Description
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

    return <Description disabled={disabled} viewMode value={details.Description ?? ''} onChange={onSetField} />;
}

export default ProjectDetails;