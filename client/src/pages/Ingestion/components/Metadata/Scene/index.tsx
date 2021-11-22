/**
 * Metadata - Scene
 *
 * This component renders the metadata fields specific to scene asset.
 */
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { useEffect, useState } from 'react';
import { AssetIdentifiers } from '../../../../../components';
import { StateIdentifier, useMetadataStore, StateRelatedObject, useRepositoryStore, useSubjectStore, useAttachmentStore, eAttachmentType, SceneAttachment } from '../../../../../store';
import { MetadataType } from '../../../../../store/metadata';
import ReferenceModels from './ReferenceModels';
import SceneDataGrid from './SceneDataGrid';
import { apolloClient } from '../../../../../graphql/index';
import { GetSceneForAssetVersionDocument, RelatedObjectType, useGetSubjectQuery } from '../../../../../types/graphql';
import { eSystemObjectType } from '../../../../../types/server';
import { toast } from 'react-toastify';
import RelatedObjectsList from '../Model/RelatedObjectsList';
import ObjectSelectModal from '../Model/ObjectSelectModal';
import AttachmentMetadataForm, { metadataRow } from '../AttachmentMetadataForm';
import { eVocabularySetID } from '../../../../../types/server';

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
    const { idSOAttachment } = file;
    const updateMetadataField = useMetadataStore(state => state.updateMetadataField);
    const [setDefaultIngestionFilters, closeRepositoryBrowser, resetRepositoryBrowserRoot] = useRepositoryStore(state => [state.setDefaultIngestionFilters, state.closeRepositoryBrowser, state.resetRepositoryBrowserRoot]);
    const [subjects] = useSubjectStore(state => [state.subjects]);
    const [createNewAttachmentEntry, updateAttachmentEntry, getAttachmentEntry] = useAttachmentStore(state => [state.createNewAttachmentEntry, state.updateAttachmentEntry, state.getAttachmentEntry]);

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
    // state responsible for SceneDataGrid
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
        PosedAndQCd: false
    });
    const [modalOpen, setModalOpen] = useState(false);
    const [objectRelationship, setObjectRelationship] = useState<RelatedObjectType>(RelatedObjectType.Source);

    const urlParams = new URLSearchParams(window.location.search);
    const idAssetVersion = urlParams.get('fileId');
    const [attachment, setAttachment] = useState<SceneAttachment>({
        idAssetVersion: Number(idAssetVersion),
        type: null,
        units: null,
        modelType: null,
        fileType: null,
        category: null,
        title: '',
        gltfStandardized: false,
        dracoCompressed: false,
        systemCreated: false,
        identifiers: [] as StateIdentifier[]
    });

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


    useEffect(() => {
        if (idSOAttachment) {
            createNewAttachmentEntry(Number(idAssetVersion), eAttachmentType.eScene);
            const newAttachment = getAttachmentEntry(Number(idAssetVersion), eAttachmentType.eScene);
            if (newAttachment) setAttachment(newAttachment);
        }
    }, [idSOAttachment, createNewAttachmentEntry, getAttachmentEntry, idAssetVersion]);


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

    const onAttachmentIdentifierChange = (identifiers: StateIdentifier[]) => {
        updateAttachmentEntry(Number(idAssetVersion), eAttachmentType.eScene, 'identifiers', identifiers);
    };

    const setCheckboxField = ({ target }): void => {
        const { name, checked } = target;
        updateMetadataField(metadataIndex, name, checked, MetadataType.scene);
    };

    const setAttachmentCheckboxField = ({ target }): void => {
        const { name, checked } = target;
        updateAttachmentEntry(Number(idAssetVersion), eAttachmentType.eScene, name, checked);
    };

    const setNameField = ({ target }): void => {
        const { name, value } = target;
        updateMetadataField(metadataIndex, name, value, MetadataType.scene);
    };

    const setAttachmentNameField = ({ target }): void => {
        const { name, value } = target;
        updateAttachmentEntry(Number(idAssetVersion), eAttachmentType.eScene, name, value);
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

    let content: JSX.Element = (
        <React.Fragment>
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
            <SceneDataGrid
                sceneData={sceneData}
                setCheckboxField={setCheckboxField}
                setNameField={setNameField}
                name={scene.name}
                approvedForPublication={scene.approvedForPublication}
                posedAndQCd={scene.posedAndQCd}
                EdanUUID={scene.EdanUUID}
            />

            <ObjectSelectModal
                open={modalOpen}
                onSelectedObjects={onSelectedObjects}
                onModalClose={onModalClose}
                selectedObjects={objectRelationship === RelatedObjectType.Source ? scene.sourceObjects : scene.derivedObjects}
                relationship={objectRelationship}
                objectType={eSystemObjectType.eScene}
            />
        </React.Fragment>
    );

    if (idSOAttachment) {
        const attachmentArr: metadataRow[] = [
            { name: 'type', label: 'Type', type: 'index', index: eVocabularySetID.eEdan3DResourceType },
            { name: 'category', label: 'Category', type: 'index', index: eVocabularySetID.eEdan3DResourceCategory },
            { name: 'units', label: 'Units', type: 'index', index: eVocabularySetID.eEdan3DResourceAttributeUnits },
            { name: 'modelType', label: 'Model Type', type: 'index', index: eVocabularySetID.eEdan3DResourceAttributeModelFileType },
            { name: 'fileType', label: 'File Type', type: 'index', index: eVocabularySetID.eEdan3DResourceAttributeFileType },
            { name: 'gltfStandardized', label: 'glTF Standardized', type: 'boolean' },
            { name: 'dracoCompressed', label: 'Draco Compressed', type: 'boolean' },
            { name: 'title', label: 'Title', type: 'string' }
        ];

        const {
            type,
            category,
            units,
            modelType,
            fileType,
            gltfStandardized,
            dracoCompressed,
            title
        } = attachment;

        const attachmentMetadata = {
            type,
            category,
            units,
            modelType,
            fileType,
            gltfStandardized,
            dracoCompressed,
            title
        };

        content = (
            <React.Fragment>
                <AssetIdentifiers
                    systemCreated={attachment.systemCreated}
                    identifiers={attachment.identifiers}
                    onSystemCreatedChange={setAttachmentCheckboxField}
                    onAddIdentifer={onAttachmentIdentifierChange}
                    onUpdateIdentifer={onAttachmentIdentifierChange}
                    onRemoveIdentifer={onAttachmentIdentifierChange}
                />
                <AttachmentMetadataForm
                    metadatas={attachmentArr}
                    metadataState={attachmentMetadata}
                    setNameField={setAttachmentNameField}
                    setCheckboxField={setAttachmentCheckboxField}
                />
            </React.Fragment>
        );
    }

    return (
        <Box className={classes.container}>
            {content}
        </Box>
    );
}

export default Scene;