/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Metadata - Scene
 *
 * This component renders the metadata fields specific to scene asset.
 */
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { useEffect, useState, Fragment } from 'react';
import { AssetIdentifiers } from '../../../../../components';
import { StateIdentifier, useMetadataStore, StateRelatedObject, useRepositoryStore, useSubjectStore } from '../../../../../store';
import { FieldErrors, MetadataType } from '../../../../../store/metadata';
import ReferenceModels from './ReferenceModels';
import NonModelAssets from './NonModelAssets';
import SceneDataForm from './SceneDataForm';
import { apolloClient } from '../../../../../graphql/index';
import { GetSceneForAssetVersionDocument, RelatedObjectType, useGetSubjectQuery, GetIngestTitleDocument, GetIngestTitleQuery } from '../../../../../types/graphql';
import { eSystemObjectType } from '@dpo-packrat/common';
import { toast } from 'react-toastify';
import RelatedObjectsList from '../Model/RelatedObjectsList';
import ObjectSelectModal from '../Model/ObjectSelectModal';
import { TextArea } from '../../../../../components';
// import clsx from 'clsx';
import lodash from 'lodash';
import SubtitleControl from '../Control/SubtitleControl';
import { ApolloQueryResult } from '@apollo/client';
import { parseSubtitlesToState } from '../../../../../store/utils';

const useStyles = makeStyles(() => ({
    container: {
        marginTop: 20
    }
}));

interface SceneProps {
    readonly metadataIndex: number;
    setInvalidMetadataStep: (valid: boolean) => void;
    fieldErrors?: FieldErrors;
    readonly ingestionLoading: boolean;
}

function Scene(props: SceneProps): React.ReactElement {
    const { metadataIndex, setInvalidMetadataStep, fieldErrors, ingestionLoading } = props;
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

    // state responsible for non-model assets
    const [nonModelAssets, setNonModelAssets] = useState([
        {
            uri: '',
            type: '',
            description: undefined,
            size: undefined,
            idAssetVersion: undefined,
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
        CanBeQCd: false,
        UpdateNotes: ''
    });
    const [modalOpen, setModalOpen] = useState(false);
    const [objectRelationship, setObjectRelationship] = useState<RelatedObjectType>(RelatedObjectType.Source);

    const urlParams = new URLSearchParams(window.location.search);
    const idAssetVersion = urlParams.get('fileId');

    useEffect(() => {
        if (idAsset)
            updateMetadataField(metadataIndex, 'idAsset', idAsset, MetadataType.scene);
    }, [metadataIndex, idAsset, updateMetadataField]);

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
            if (!data.getSceneForAssetVersion.success) {
                toast.error(`Error: unable to fetch scene; Message ${data.getSceneForAssetVersion.message}`, { autoClose: false });
            }
            const ModelSceneXref: any = data.getSceneForAssetVersion?.SceneConstellation?.ModelSceneXref;
            const SvxNonModelAssets: any = data.getSceneForAssetVersion?.SceneConstellation?.SvxNonModelAssets;

            setReferenceModels(ModelSceneXref);
            setNonModelAssets(SvxNonModelAssets);
            setSceneData(data.getSceneForAssetVersion?.SceneConstellation?.Scene);

            const missingModels: boolean = ModelSceneXref ? ModelSceneXref.some(reference => reference.idModel === 0) : false;
            const missingNonModelAssets: boolean = SvxNonModelAssets ? SvxNonModelAssets.some(reference => (reference.idAssetVersion ?? 0) === 0) : false;
            const invalidMetadataStep: boolean = missingModels || missingNonModelAssets;
            setInvalidMetadataStep(invalidMetadataStep || !data.getSceneForAssetVersion.success);
            if (invalidMetadataStep)
                toast.warning('Unable to ingest scene because some or all referenced assets cannot be found', { autoClose: false });
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

    const onRemoveSourceObject = async (idSystemObject: number): Promise<void> => {
        const { sourceObjects } = scene;
        const updatedSourceObjects = sourceObjects.filter(sourceObject => sourceObject.idSystemObject !== idSystemObject);
        updateMetadataField(metadataIndex, 'sourceObjects', updatedSourceObjects, MetadataType.scene);

        const { data: { getIngestTitle: { ingestTitle } } }: ApolloQueryResult<GetIngestTitleQuery> = await apolloClient.query({
            query: GetIngestTitleDocument,
            variables: {
                input: {
                    sourceObjects: updatedSourceObjects
                }
            },
            fetchPolicy: 'no-cache'
        });

        if (!ingestTitle) {
            toast.error('Failed to fetch titles for ingestion items');
            return;
        }

        const subtitleState = parseSubtitlesToState(ingestTitle);
        updateMetadataField(metadataIndex, 'subtitles', subtitleState, MetadataType.scene);
        updateMetadataField(metadataIndex, 'name', ingestTitle.title, MetadataType.scene);
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

    const onSelectedObjects = async (newSourceObjects: StateRelatedObject[]) => {
        updateMetadataField(metadataIndex, objectRelationship === RelatedObjectType.Source ? 'sourceObjects' : 'derivedObjects', newSourceObjects, MetadataType.scene);

        if (objectRelationship === RelatedObjectType.Source) {
            const { data: { getIngestTitle: { ingestTitle } } }: ApolloQueryResult<GetIngestTitleQuery> = await apolloClient.query({
                query: GetIngestTitleDocument,
                variables: {
                    input: {
                        sourceObjects: newSourceObjects
                    }
                },
                fetchPolicy: 'no-cache'
            });

            if (!ingestTitle) {
                toast.error('Failed to fetch titles for ingestion items');
                return;
            }

            const subtitleState = parseSubtitlesToState(ingestTitle);
            updateMetadataField(metadataIndex, 'subtitles', subtitleState, MetadataType.scene);
            updateMetadataField(metadataIndex, 'name', ingestTitle.title, MetadataType.scene);
        }

        onModalClose();
    };

    const onSelectSubtitle = (id: number) => {
        const updatedSubtitles = scene.subtitles.map((subtitle) => {
            return {
                id: subtitle.id,
                value: subtitle.value,
                subtitleOption: subtitle.subtitleOption,
                selected: id === subtitle.id
            };
        });
        updateMetadataField(metadataIndex, 'subtitles', updatedSubtitles, MetadataType.scene);
    };

    const onUpdateCustomSubtitle = (event: React.ChangeEvent<HTMLInputElement>, id: number) => {
        const subtitlesCopy = lodash.cloneDeep(scene.subtitles);
        const targetSubtitle = subtitlesCopy.find(subtitle => subtitle.id === id);

        if (!targetSubtitle) {
            toast.warn('Something went wrong with updating the subtitle. Please try again');
            return;
        }

        targetSubtitle.value = event.target.value;
        updateMetadataField(metadataIndex, 'subtitles', subtitlesCopy, MetadataType.scene);
    };

    return (
        <Box className={classes.container}>
            {idAsset && (
                <Box mb={2}>
                    <TextArea
                        label='Update Notes'
                        value={scene.updateNotes}
                        name='updateNotes'
                        onChange={setNameField}
                        placeholder='Update notes...'
                        disabled={ingestionLoading}
                    />
                </Box>
            )}
            <Box width='52vw'>
                <AssetIdentifiers
                    systemCreated={scene.systemCreated}
                    identifiers={scene.identifiers}
                    onSystemCreatedChange={setCheckboxField}
                    onAddIdentifer={onIdentifersChange}
                    onUpdateIdentifer={onIdentifersChange}
                    onRemoveIdentifer={onIdentifersChange}
                    identifierName='Scene'
                    disabled={ingestionLoading}
                />
            </Box>
            {!idAsset && (
                <Fragment>
                    <Box mb={2}>
                        <RelatedObjectsList
                            type={RelatedObjectType.Source}
                            relatedObjects={scene.sourceObjects}
                            onAdd={openSourceObjectModal}
                            onRemove={onRemoveSourceObject}
                            relationshipLanguage='Parents'
                            disabled={ingestionLoading}
                        />
                    </Box>
                    <Box mb={2}>
                        <RelatedObjectsList
                            type={RelatedObjectType.Derived}
                            relatedObjects={scene.derivedObjects}
                            onAdd={openDerivedObjectModal}
                            onRemove={onRemoveDerivedObject}
                            relationshipLanguage='Children'
                            disabled={ingestionLoading}
                        />
                    </Box>
                    <ReferenceModels referenceModels={referenceModels} idAssetVersion={Number(idAssetVersion)} />
                    <NonModelAssets nonModelAssets={nonModelAssets} idAssetVersion={Number(idAssetVersion)} />

                    <Box mb={1.25}>
                        <SubtitleControl
                            subtitles={scene.subtitles}
                            objectName={scene.name}
                            onSelectSubtitle={onSelectSubtitle}
                            onUpdateCustomSubtitle={onUpdateCustomSubtitle}
                            hasPrimaryTheme
                            hasError={fieldErrors?.scene.subtitles ?? false}
                            disabled={ingestionLoading}
                        />
                    </Box>
                </Fragment>
            )}
            <SceneDataForm
                sceneData={sceneData}
                setCheckboxField={setCheckboxField}
                approvedForPublication={scene.approvedForPublication}
                posedAndQCd={scene.posedAndQCd}
                canBeQCd={scene.canBeQCd}
                EdanUUID={scene.EdanUUID}
                disabled={ingestionLoading}
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