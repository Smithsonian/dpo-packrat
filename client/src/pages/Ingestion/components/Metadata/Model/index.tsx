/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * Metadata - Model
 *
 * This component renders the metadata fields specific to model asset.
 */
import { Box, makeStyles, Typography } from '@material-ui/core';
import React, { useState, useEffect } from 'react';
import { AssetIdentifiers, DateInputField, FieldType, InputField, SelectField, ReadOnlyRow, SidebarBottomNavigator, TextArea } from '../../../../../components';
import { StateIdentifier, StateRelatedObject, useSubjectStore, useMetadataStore, useVocabularyStore, useRepositoryStore } from '../../../../../store';
import { MetadataType } from '../../../../../store/metadata';
import { GetModelConstellationForAssetVersionDocument, RelatedObjectType, useGetSubjectQuery } from '../../../../../types/graphql';
import { eSystemObjectType, eVocabularySetID } from '../../../../../types/server';
import ObjectSelectModal from './ObjectSelectModal';
import RelatedObjectsList from './RelatedObjectsList';
import ObjectMeshTable from './ObjectMeshTable';
import AssetFilesTable from './AssetFilesTable';
import { extractModelConstellation } from '../../../../../constants';
import { apolloClient } from '../../../../../graphql/index';

const useStyles = makeStyles(theme => ({
    container: {
        marginTop: 20
    },
    notRequiredFields: {
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 5,
        backgroundColor: theme.palette.secondary.light,
        width: '350px',
        '& > *': {
            height: '20px',
            borderBottom: '0.5px solid #D8E5EE',
            borderTop: '0.5px solid #D8E5EE'
        }
    },
    dataEntry: {
        width: '350px',
        marginRight: '30px',
        '& > *': {
            height: '20px',
            borderBottom: '0.5px solid #D8E5EE',
            borderTop: '0.5px solid #D8E5EE',
            width: 'auto'
        },
        border: '1px solid #D8E5EE',
        height: 'fit-content'
    },
    ModelMetricsAndFormContainer: {
        borderRadius: 5,
        padding: 10,
        backgroundColor: theme.palette.primary.light,
        width: 'fit-content',
        display: 'flex',
        flexDirection: 'column'
    },
    modelMetricsAndForm: {
        display: 'flex',
        flexDirection: 'row',
        borderRadius: 5,
        backgroundColor: theme.palette.primary.light,
        width: 'auto',
        justifyContent: 'space-around'
    },
    captionContainer: {
        flex: '1 1 0%',
        width: '92%',
        display: 'flex',
        marginBottom: '8px',
        flexDirection: 'row',
        color: '#2C405A'
    }
}));

interface ModelProps {
    readonly metadataIndex: number;
    onPrevious: () => void;
    onClickRight: () => Promise<void>;
    isLast: boolean;
    rightLoading: boolean;
    disableNavigation: boolean;
}

function Model(props: ModelProps): React.ReactElement {
    const { metadataIndex, onPrevious, onClickRight, isLast, rightLoading, disableNavigation } = props;
    const classes = useStyles();
    const metadata = useMetadataStore(state => state.metadatas[metadataIndex]);
    const { model, file } = metadata;
    const { idAsset } = file;
    const [updateMetadataField, getFieldErrors] = useMetadataStore(state => [state.updateMetadataField, state.getFieldErrors]);
    const [getEntries] = useVocabularyStore(state => [state.getEntries]);
    const [setDefaultIngestionFilters, closeRepositoryBrowser, resetRepositoryBrowserRoot] = useRepositoryStore(state => [state.setDefaultIngestionFilters, state.closeRepositoryBrowser, state.resetRepositoryBrowserRoot]);
    const [subjects] = useSubjectStore(state => [state.subjects]);
    const [objectRelationship, setObjectRelationship] = useState<RelatedObjectType>(RelatedObjectType.Source);
    const [modalOpen, setModalOpen] = useState(false);
    const [ingestionModel, setIngestionModel] = useState<any>({
        CountVertices: null,
        CountFaces: null,
        CountAnimations: null,
        CountCameras: null,
        CountLights: null,
        CountMaterials: null,
        CountMeshes: null,
        CountEmbeddedTextures: null,
        CountLinkedTextures: null,
        FileEncoding: '',
        IsDracoCompressed: null,
        idVFileType: null
    });
    const [assetFiles, setAssetFiles] = useState([{ assetName: '', assetType: '' }]);
    const [modelObjects, setModelObjects] = useState<any>([
        {
            idModelObject: null,
            CountPoint: null,
            CountFace: null,
            CountColorChannel: null,
            CountTextureCoordinateChannel: null,
            HasBones: null,
            HasFaceNormals: null,
            HasTangents: null,
            HasTextureCoordinates: null,
            HasVertextNormals: null,
            HasVertexColor: null,
            IsTwoManifoldUnbounded: null,
            IsTwoManifoldBounded: null,
            IsWatertight: null,
            SelfIntersecting: null,
            BoundingBoxP1X: null,
            BoundingBoxP1Y: null,
            BoundingBoxP1Z: null,
            BoundingBoxP2X: null,
            BoundingBoxP2Y: null,
            BoundingBoxP2Z: null,
            ModelMaterials: []
        }
    ]);

    const urlParams = new URLSearchParams(window.location.search);
    const idAssetVersion = urlParams.get('fileId');

    useEffect(() => {
        if (idAsset)
            updateMetadataField(metadataIndex, 'idAsset', idAsset, MetadataType.model);
    }, [metadataIndex, idAsset, updateMetadataField]);

    useEffect(() => {
        async function fetchModelConstellation() {
            const { data } = await apolloClient.query({
                query: GetModelConstellationForAssetVersionDocument,
                variables: {
                    input: {
                        idAssetVersion: Number(idAssetVersion)
                    }
                }
            });
            if (data.getModelConstellationForAssetVersion.ModelConstellation) {
                const modelConstellation = data.getModelConstellationForAssetVersion.ModelConstellation;
                const { ingestionModel, modelObjects, assets } = extractModelConstellation(modelConstellation);
                updateMetadataField(metadataIndex, 'name', modelConstellation.Model.Name, MetadataType.model);

                // handles 0 and non-numeric idVFileTypes
                if (modelConstellation.Model.idVFileType) {
                    updateMetadataField(metadataIndex, 'modelFileType', Number(modelConstellation.Model.idVFileType), MetadataType.model);
                }
                setIngestionModel(ingestionModel);
                setModelObjects(modelObjects);
                setAssetFiles(assets);
            }
        }

        fetchModelConstellation();
    }, [idAssetVersion, metadataIndex, updateMetadataField]);

    // use subject's idSystemObject as the root to initialize the repository browser
    const validSubjectId = subjects.find((subject) => subject.id > 0)?.id ?? 0;
    const subjectIdSystemObject = useGetSubjectQuery({
        variables: {
            input: {
                idSubject: validSubjectId
            }
        }
    });
    const idSystemObject: number | undefined = subjects.length > 0 ? subjectIdSystemObject?.data?.getSubject?.Subject?.SystemObject?.idSystemObject : undefined;

    const errors = getFieldErrors(metadata);

    const onIdentifersChange = (identifiers: StateIdentifier[]): void => {
        updateMetadataField(metadataIndex, 'identifiers', identifiers, MetadataType.model);
    };

    const setCheckboxField = ({ target }): void => {
        const { name, checked } = target;
        updateMetadataField(metadataIndex, name, checked, MetadataType.model);
    };

    const setIdField = ({ target }): void => {
        const { name, value } = target;
        let idFieldValue: number | null = null;

        if (value) {
            idFieldValue = Number.parseInt(value, 10);
        }

        updateMetadataField(metadataIndex, name, idFieldValue, MetadataType.model);
    };

    const setDateField = (name: string, value?: string | null): void => {
        if (value) {
            const date = new Date(value);
            updateMetadataField(metadataIndex, name, date, MetadataType.model);
        }
    };

    const setNameField = ({ target }): void => {
        const { name, value } = target;
        updateMetadataField(metadataIndex, name, value, MetadataType.model);
    };

    const openSourceObjectModal = async () => {
        await setDefaultIngestionFilters(eSystemObjectType.eModel, idSystemObject);
        await setObjectRelationship(RelatedObjectType.Source);
        await setModalOpen(true);
    };

    const openDerivedObjectModal = async () => {
        await setDefaultIngestionFilters(eSystemObjectType.eModel, idSystemObject);
        await setObjectRelationship(RelatedObjectType.Derived);
        await setModalOpen(true);
    };

    const onRemoveSourceObject = (idSystemObject: number): void => {
        const { sourceObjects } = model;
        const updatedSourceObjects = sourceObjects.filter(sourceObject => sourceObject.idSystemObject !== idSystemObject);
        updateMetadataField(metadataIndex, 'sourceObjects', updatedSourceObjects, MetadataType.model);
    };

    const onRemoveDerivedObject = (idSystemObject: number): void => {
        const { derivedObjects } = model;
        const updatedDerivedObjects = derivedObjects.filter(sourceObject => sourceObject.idSystemObject !== idSystemObject);
        updateMetadataField(metadataIndex, 'derivedObjects', updatedDerivedObjects, MetadataType.model);
    };

    const onModalClose = () => {
        setModalOpen(false);
        setObjectRelationship(RelatedObjectType.Source);
        closeRepositoryBrowser();
        resetRepositoryBrowserRoot();
    };

    const onSelectedObjects = (newSourceObjects: StateRelatedObject[]) => {
        updateMetadataField(metadataIndex, objectRelationship === RelatedObjectType.Source ? 'sourceObjects' : 'derivedObjects', newSourceObjects, MetadataType.model);
        onModalClose();
    };

    const rowFieldProps = { alignItems: 'center', justifyContent: 'space-between' };
    return (
        <React.Fragment>
            <Box className={classes.container}>
                {idAsset && (
                    <Box mb={2}>
                        <TextArea label='Update Notes' value={model.updateNotes} name='updateNotes' onChange={setNameField} placeholder='Update notes...' />
                    </Box>
                )}

                <Box mb={2}>
                    <AssetIdentifiers
                        systemCreated={model.systemCreated}
                        identifiers={model.identifiers}
                        onSystemCreatedChange={setCheckboxField}
                        onAddIdentifer={onIdentifersChange}
                        onUpdateIdentifer={onIdentifersChange}
                        onRemoveIdentifer={onIdentifersChange}
                    />
                </Box>

                <Box mb={2}>
                    <RelatedObjectsList
                        type={RelatedObjectType.Source}
                        relatedObjects={model.sourceObjects}
                        onAdd={openSourceObjectModal}
                        onRemove={onRemoveSourceObject}
                        relationshipLanguage='Parent(s)'
                    />
                </Box>
                <Box mb={2}>
                    <RelatedObjectsList
                        type={RelatedObjectType.Derived}
                        relatedObjects={model.derivedObjects}
                        onAdd={openDerivedObjectModal}
                        onRemove={onRemoveDerivedObject}
                        relationshipLanguage='Child(ren)'
                    />
                </Box>
                <Box mb={2}>
                    <AssetFilesTable files={assetFiles} />
                </Box>
                {/* Start of data-entry form */}
                <Box className={classes.ModelMetricsAndFormContainer}>
                    <Box className={classes.captionContainer}>
                        <Typography variant='caption'>Model</Typography>
                    </Box>

                    <Box className={classes.modelMetricsAndForm}>
                        <Box display='flex' flexDirection='column' className={classes.dataEntry}>
                            <InputField required type='string' label='Name' value={model.name} name='name' onChange={setNameField} error={errors.model.name} />

                            <FieldType error={errors.model.dateCaptured} required label='Date Created' direction='row' containerProps={rowFieldProps}>
                                <DateInputField value={model.dateCaptured} onChange={(_, value) => setDateField('dateCaptured', value)} />
                            </FieldType>

                            <SelectField
                                required
                                label='Creation Method'
                                error={errors.model.creationMethod}
                                value={model.creationMethod}
                                name='creationMethod'
                                onChange={setIdField}
                                options={getEntries(eVocabularySetID.eModelCreationMethod)}
                            />
                            <SelectField
                                required
                                label='Modality'
                                error={errors.model.modality}
                                value={model.modality}
                                name='modality'
                                onChange={setIdField}
                                options={getEntries(eVocabularySetID.eModelModality)}
                            />

                            <SelectField
                                required
                                label='Units'
                                error={errors.model.units}
                                value={model.units}
                                name='units'
                                onChange={setIdField}
                                options={getEntries(eVocabularySetID.eModelUnits)}
                            />

                            <SelectField
                                required
                                label='Purpose'
                                error={errors.model.purpose}
                                value={model.purpose}
                                name='purpose'
                                onChange={setIdField}
                                options={getEntries(eVocabularySetID.eModelPurpose)}
                            />

                            <SelectField
                                required
                                label='Model File Type'
                                error={errors.model.modelFileType}
                                value={model.modelFileType}
                                name='modelFileType'
                                onChange={setIdField}
                                options={getEntries(eVocabularySetID.eModelFileType)}
                            />
                        </Box>
                        {/* End of data-entry form */}

                        {/* Start of model-level metrics form */}
                        <Box className={classes.notRequiredFields}>
                            <ReadOnlyRow label='Vertex Count' value={ingestionModel?.CountVertices} />
                            <ReadOnlyRow label='Face Count' value={ingestionModel?.CountFaces} />
                            <ReadOnlyRow label='Animation Count' value={ingestionModel?.CountAnimations} />
                            <ReadOnlyRow label='Camera Count' value={ingestionModel?.CountCameras} />
                            <ReadOnlyRow label='Light Count' value={ingestionModel?.CountLights} />
                            <ReadOnlyRow label='Material Count' value={ingestionModel?.CountMaterials} />
                            <ReadOnlyRow label='Mesh Count' value={ingestionModel?.CountMeshes} />
                            <ReadOnlyRow label='Embedded Texture Count' value={ingestionModel?.CountEmbeddedTextures} />
                            <ReadOnlyRow label='Linked Texture Count' value={ingestionModel?.CountLinkedTextures} />
                            <ReadOnlyRow label='File Encoding' value={ingestionModel?.FileEncoding} />
                            <ReadOnlyRow label='Draco Compressed' value={ingestionModel?.IsDracoCompressed ? 'true' : 'false'} />
                        </Box>
                        {/* End of  model-level metrics form */}
                    </Box>
                </Box>

                <SidebarBottomNavigator
                    rightLoading={rightLoading}
                    leftLabel='Previous'
                    onClickLeft={onPrevious}
                    rightLabel={isLast ? 'Finish' : 'Next'}
                    onClickRight={onClickRight}
                    disableNavigation={disableNavigation}
                />
                <ObjectMeshTable modelObjects={modelObjects} />
            </Box>
            <ObjectSelectModal
                open={modalOpen}
                onSelectedObjects={onSelectedObjects}
                onModalClose={onModalClose}
                selectedObjects={objectRelationship === RelatedObjectType.Source ? model.sourceObjects : model.derivedObjects}
                relationship={objectRelationship}
                objectType={eSystemObjectType.eModel}
            />
        </React.Fragment>
    );
}

export default Model;