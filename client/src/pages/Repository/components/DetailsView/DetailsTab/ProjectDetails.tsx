/* eslint-disable react-hooks/exhaustive-deps */
/**
 * ProjectDetails
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

function ProjectDetails(props: DetailComponentProps): React.ReactElement {
    const { data, loading, disabled, onUpdateDetail, objectType } = props;
    const [ProjectDetails, updateDetailField] = useDetailTabStore(state => [state.ProjectDetails, state.updateDetailField]);

    useEffect(() => {
        onUpdateDetail(objectType, ProjectDetails);
    }, [ProjectDetails]);

    if (!data || loading) {
        return <Loader minHeight='15vh' />;
    }

    const onSetField = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = event.target;
        updateDetailField(eSystemObjectType.eProject, 'Description', value);
    };

    const projectData = data.getDetailsTabDataForObject?.Project;

    return (
        <Description
            updated={isFieldUpdated(ProjectDetails, projectData, 'Description')}
            disabled={disabled}
            viewMode
            value={ProjectDetails?.Description ?? ''}
            onChange={onSetField}
        />
    );
}

export default ProjectDetails;
