/* eslint-disable react-hooks/exhaustive-deps */
/**
 * ProjectDocumentationDetails
 *
 * This component renders details tab for Actor specific details used in DetailsTab component.
 */
import React, { useEffect } from 'react';
import { Loader } from '../../../../../components';
import { isFieldUpdated } from '../../../../../utils/repository';
import Description from '../../../../Ingestion/components/Metadata/Photogrammetry/Description';
import { DetailComponentProps } from './index';
import { eSystemObjectType } from '../../../../../types/server';
import { useDetailTabStore } from '../../../../../store';

function ProjectDocumentationDetails(props: DetailComponentProps): React.ReactElement {
    const { data, loading, disabled, onUpdateDetail, objectType } = props;
    const [ProjectDocumentationDetails, updateDetailField] = useDetailTabStore(state => [state.ProjectDocumentationDetails, state.updateDetailField]);

    useEffect(() => {
        onUpdateDetail(objectType, ProjectDocumentationDetails);
    }, [ProjectDocumentationDetails]);

    if (!data || loading) {
        return <Loader minHeight='15vh' />;
    }

    const onSetField = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = event.target;
        updateDetailField(eSystemObjectType.eProjectDocumentation, 'Description', value);
    };

    const projectDocumentationData = data.getDetailsTabDataForObject?.ProjectDocumentation;

    return (
        <Description
            updated={isFieldUpdated(ProjectDocumentationDetails, projectDocumentationData, 'description')}
            disabled={disabled}
            viewMode
            value={ProjectDocumentationDetails.Description ?? ''}
            onChange={onSetField}
        />
    );
}

export default ProjectDocumentationDetails;
