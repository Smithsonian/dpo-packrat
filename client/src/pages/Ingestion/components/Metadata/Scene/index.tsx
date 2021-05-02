/**
 * Metadata - Scene
 *
 * This component renders the metadata fields specific to scene asset.
 */
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { AssetIdentifiers } from '../../../../../components';
import { StateIdentifier, useMetadataStore } from '../../../../../store';
import { MetadataType } from '../../../../../store/metadata';
import ReferenceModels from './ReferenceModels';
import SceneDataGrid from './SceneDataGrid';

const useStyles = makeStyles(() => ({
    container: {
        marginTop: 20
    }
}));

interface SceneProps {
    readonly metadataIndex: number;
}

const sampleSceneData = {
    hasBeenQCd: false,
    isOriented: false,
    sceneCount: 10,
    nodeCount: 11,
    cameraCount: 12,
    lightCount: 13,
    modelCount: 15,
    metaCount: 16,
    setupCount: 17,
    tourCount: 18
};

function Scene(props: SceneProps): React.ReactElement {
    const { metadataIndex } = props;
    const classes = useStyles();
    const metadata = useMetadataStore(state => state.metadatas[metadataIndex]);
    const { scene } = metadata;
    const updateMetadataField = useMetadataStore(state => state.updateMetadataField);

    const onIdentifersChange = (identifiers: StateIdentifier[]): void => {
        updateMetadataField(metadataIndex, 'identifiers', identifiers, MetadataType.scene);
    };

    const setCheckboxField = ({ target }): void => {
        const { name, checked } = target;
        updateMetadataField(metadataIndex, name, checked, MetadataType.scene);
    };

    return (
        <Box className={classes.container}>
            <AssetIdentifiers
                systemCreated={scene.systemCreated}
                identifiers={scene.identifiers}
                onSystemCreatedChange={setCheckboxField}
                onAddIdentifer={onIdentifersChange}
                onUpdateIdentifer={onIdentifersChange}
                onRemoveIdentifer={onIdentifersChange}
            />
            <ReferenceModels />
            <SceneDataGrid sceneData={sampleSceneData} />
        </Box>
    );
}

export default Scene;
