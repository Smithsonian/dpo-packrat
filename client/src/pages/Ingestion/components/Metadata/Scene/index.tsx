/**
 * Metadata - Scene
 *
 * This component renders the metadata fields specific to scene asset.
 */
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { useEffect, useState } from 'react';
import { AssetIdentifiers } from '../../../../../components';
import { StateIdentifier, useMetadataStore, StateRelatedObject, useRepositoryStore, useSubjectStore } from '../../../../../store';
import { MetadataType } from '../../../../../store/metadata';
import ReferenceModels from './ReferenceModels';
import SceneDataForm from './SceneDataForm';
import { apolloClient } from '../../../../../graphql/index';
import { GetSceneForAssetVersionDocument, RelatedObjectType, useGetSubjectQuery } from '../../../../../types/graphql';
import { eSystemObjectType } from '../../../../../types/server';
import { toast } from 'react-toastify';
import RelatedObjectsList from '../Model/RelatedObjectsList';
import ObjectSelectModal from '../Model/ObjectSelectModal';
import { TextArea } from '../../../../../components';

const useStyles = makeStyles(() => ({
    container: {
        marginTop: 20
    }
}));

interface SceneProps {
    readonly metadataIndex: number;
    setInvalidMetadataStep: (valid: boolean) => void;
}

function Scene(props: SceneProps): React.ReactElement {
    const { metadataIndex, setInvalidMetadataStep } = props;
    const classes = useStyles();
    const metadata = useMetadataStore(state => state.metadatas[metadataIndex]);
    const { scene, file } = metadata;
    const { idAsset } = file;
    const updateMetadataField = useMetadataStore(state => state.updateMetadataField);
    const [setDefaultIngestionFilters, closeRepositoryBrowser, resetRepositoryBrowserRoot] = useRepositoryStore(state => [state.setDefaultIngestionFilters, state.closeRepositoryBrowser, state.resetRepositoryBrowserRoot]);
    const [subjects] = useSubjectStore(state => [state.subjects]);

    // state responsible for ReferenceModels
    const [referenceModels, setReferenceModels] = useState([
        {
            BoundingBoxP1X: 0,
            BoundingBoxP1Y: 0,
            BoundingBoxP1Z: 0,
            BoundingBoxP2X: 0,
            BoundingBoxP2Y: 0,
            BoundingBoxP2Z: 0,
            FileSize: 0,
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
    // state responsible for SceneDataForm
    const [sceneData, setSceneData] = useState({
        idScene: 0,
        idAssetThumbnail: 0,
        Name: '',
        CountScene: 0,
        CountNode: 0,
        CountCamera: 0,
        CountLight: 0,
        CountModel: 0,
        CountMeta: 0,
        CountSetup: 0,
        CountTour: 0,
        EdanUUID: '',
        ApprovedForPublication: false,
        PosedAndQCd: false,
        UpdateNotes: ''
    });
    const [modalOpen, setModalOpen] = useState(false);
    const [objectRelationship, setObjectRelationship] = useState<RelatedObjectType>(RelatedObjectType.Source);

    const urlParams = new URLSearchParams(window.location.search);
    const idAssetVersion = urlParams.get('fileId');

    useEffect(() => {
        async function fetchSceneConstellation() {
            const { data } = await apolloClient.query({
                query: GetSceneForAssetVersionDocument,
                variables: {
                    input: {
                        idAssetVersion: Number(idAssetVersion),
                        directory: scene.directory
                    }
                }
            });
            setReferenceModels(data.getSceneForAssetVersion?.SceneConstellation?.ModelSceneXref);
            setSceneData(data.getSceneForAssetVersion?.SceneConstellation?.Scene);
            const invalidMetadataStep = data.getSceneForAssetVersion?.SceneConstellation?.ModelSceneXref.some(reference => reference.idModel === 0);
            setInvalidMetadataStep(invalidMetadataStep);
            if (invalidMetadataStep) toast.warning('Unable to ingest scene because reference models cannot be found', { autoClose: false });
        }

        fetchSceneConstellation();
    }, [idAssetVersion, metadataIndex, setInvalidMetadataStep, scene.directory]);

    const validSubjectId = subjects.find((subject) => subject.id > 0)?.id ?? 0;
    const subjectIdSystemObject = useGetSubjectQuery({
        variables: {
            input: {
                idSubject: validSubjectId
            }
        }
    });
    const idSystemObject: number | undefined = subjectIdSystemObject?.data?.getSubject?.Subject?.SystemObject?.idSystemObject;

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

    const openSourceObjectModal = async () => {
        await setDefaultIngestionFilters(eSystemObjectType.eScene, idSystemObject);
        await setObjectRelationship(RelatedObjectType.Source);
        await setModalOpen(true);
    };

    const openDerivedObjectModal = async () => {
        await setDefaultIngestionFilters(eSystemObjectType.eScene, idSystemObject);
        await setObjectRelationship(RelatedObjectType.Derived);
        await setModalOpen(true);
    };

    const onRemoveSourceObject = (idSystemObject: number): void => {
        const { sourceObjects } = scene;
        const updatedSourceObjects = sourceObjects.filter(sourceObject => sourceObject.idSystemObject !== idSystemObject);
        updateMetadataField(metadataIndex, 'sourceObjects', updatedSourceObjects, MetadataType.scene);
    };

    const onRemoveDerivedObject = (idSystemObject: number): void => {
        const { derivedObjects } = scene;
        const updatedDerivedObjects = derivedObjects.filter(sourceObject => sourceObject.idSystemObject !== idSystemObject);
        updateMetadataField(metadataIndex, 'derivedObjects', updatedDerivedObjects, MetadataType.scene);
    };

    const onModalClose = () => {
        setModalOpen(false);
        setObjectRelationship(RelatedObjectType.Source);
        closeRepositoryBrowser();
        resetRepositoryBrowserRoot();
    };

    const onSelectedObjects = (newSourceObjects: StateRelatedObject[]) => {
        updateMetadataField(metadataIndex, objectRelationship === RelatedObjectType.Source ? 'sourceObjects' : 'derivedObjects', newSourceObjects, MetadataType.scene);
        onModalClose();
    };

    return (
        <Box className={classes.container}>
            <Box mb={2}>
                {/* TODO: 454 make sure state is hooked up properly and that it's validated and it's conditional */}
                {idAsset && <TextArea label='Update Notes' value={scene.updateNotes} name={'updateNotes'} onChange={setNameField} />}
            </Box>
            <AssetIdentifiers
                systemCreated={scene.systemCreated}
                identifiers={scene.identifiers}
                onSystemCreatedChange={setCheckboxField}
                onAddIdentifer={onIdentifersChange}
                onUpdateIdentifer={onIdentifersChange}
                onRemoveIdentifer={onIdentifersChange}
            />
            <Box mb={2}>
                <RelatedObjectsList
                    type={RelatedObjectType.Source}
                    relatedObjects={scene.sourceObjects}
                    onAdd={openSourceObjectModal}
                    onRemove={onRemoveSourceObject}
                    relationshipLanguage='Parent(s)'
                />
            </Box>
            <Box mb={2}>
                <RelatedObjectsList
                    type={RelatedObjectType.Derived}
                    relatedObjects={scene.derivedObjects}
                    onAdd={openDerivedObjectModal}
                    onRemove={onRemoveDerivedObject}
                    relationshipLanguage='Child(ren)'
                />
            </Box>
            <ReferenceModels referenceModels={referenceModels} idAssetVersion={Number(idAssetVersion)} />
            <SceneDataForm
                sceneData={sceneData}
                setCheckboxField={setCheckboxField}
                setNameField={setNameField}
                name={scene.name}
                approvedForPublication={scene.approvedForPublication}
                posedAndQCd={scene.posedAndQCd}
                EdanUUID={scene.EdanUUID}
                idAssetVersion={Number(idAssetVersion)}
            />

            <ObjectSelectModal
                open={modalOpen}
                onSelectedObjects={onSelectedObjects}
                onModalClose={onModalClose}
                selectedObjects={objectRelationship === RelatedObjectType.Source ? scene.sourceObjects : scene.derivedObjects}
                relationship={objectRelationship}
                objectType={eSystemObjectType.eScene}
            />
        </Box>
    );
}

export default Scene;