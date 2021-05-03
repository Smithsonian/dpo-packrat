/**
 * Metadata - Scene
 *
 * This component renders the metadata fields specific to scene asset.
 */
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { useEffect, useState } from 'react';
import { AssetIdentifiers } from '../../../../../components';
import { StateIdentifier, useMetadataStore } from '../../../../../store';
import { MetadataType } from '../../../../../store/metadata';
import ReferenceModels from './ReferenceModels';
import SceneDataGrid from './SceneDataGrid';
import { apolloClient } from '../../../../../graphql/index';
import { GetSceneForAssetVersionDocument } from '../../../../../types/graphql';

const useStyles = makeStyles(() => ({
    container: {
        marginTop: 20
    }
}));

interface SceneProps {
    readonly metadataIndex: number;
}

function Scene(props: SceneProps): React.ReactElement {
    const { metadataIndex } = props;
    const classes = useStyles();
    const metadata = useMetadataStore(state => state.metadatas[metadataIndex]);
    const { scene } = metadata;
    const updateMetadataField = useMetadataStore(state => state.updateMetadataField);
    // state responsible for ReferenceModels
    const [referenceModels, setReferenceModels] = useState([
        {
            BoundingBoxP1X: 0,
            BoundingBoxP1Y: 0,
            BoundingBoxP1Z: 0,
            BoundingBoxP2X: 0,
            BoundingBoxP2Y: 0,
            BoundingBoxP2Z: 0,
            FileSize: '',
            Model: null,
            Name: '',
            Quality: '',
            UVResolution: 0,
            Usage: '',
            idModel: -1,
            idModelSceneXref: 0,
            idScene: 0
        }
    ]);
    // state responsible for SceneDataGrid
    const [sceneData, setSceneData] = useState({
        idScene: 0,
        HasBeenQCd: false,
        idAssetThumbnail: 0,
        IsOriented: false,
        Name: '',
        CountScene: 0,
        CountNode: 0,
        CountCamera: 0,
        CountLight: 0,
        CountModel: 0,
        CountMeta: 0,
        CountSetup: 0,
        CountTour: 0
    });

    const urlParams = new URLSearchParams(window.location.search);
    const idAssetVersion = urlParams.get('fileId');

    useEffect(() => {
        async function fetchSceneConstellation() {
            const { data } = await apolloClient.query({
                query: GetSceneForAssetVersionDocument,
                variables: {
                    input: {
                        idAssetVersion: Number(idAssetVersion)
                    }
                }
            });
            setReferenceModels(data.getSceneForAssetVersion?.SceneConstellation?.ModelSceneXref);
            setSceneData(data.getSceneForAssetVersion?.SceneConstellation?.Scene);
        }

        fetchSceneConstellation();
    }, [idAssetVersion, metadataIndex]);

    const onIdentifersChange = (identifiers: StateIdentifier[]): void => {
        updateMetadataField(metadataIndex, 'identifiers', identifiers, MetadataType.scene);
    };

    const setCheckboxField = ({ target }): void => {
        const { name, checked } = target;
        updateMetadataField(metadataIndex, name, checked, MetadataType.scene);
    };

    const setNameField = ({ target }): void => {
        const { name, value } = target;
        updateMetadataField(metadataIndex, name, value, MetadataType.scene);
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
            <ReferenceModels referenceModels={referenceModels} />
            <SceneDataGrid
                sceneData={sceneData}
                setCheckboxField={setCheckboxField}
                setNameField={setNameField}
                name={scene.name}
                hasBeenQCd={scene.hasBeenQCd}
                isOriented={scene.isOriented}
            />
        </Box>
    );
}

export default Scene;
