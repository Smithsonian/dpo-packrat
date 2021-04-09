/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * Metadata - Model
 *
 * This component renders the metadata fields specific to model asset.
 */
import { Box, Checkbox } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { useState, useEffect } from 'react';
import { AssetIdentifiers, DateInputField, FieldType, InputField, SelectField, ReadOnlyRow } from '../../../../../components';
import { StateIdentifier, StateRelatedObject, useSubjectStore, useMetadataStore, useVocabularyStore, useRepositoryStore } from '../../../../../store';
import { MetadataType } from '../../../../../store/metadata';
import { RelatedObjectType, useGetSubjectQuery /*, useGetModelConstellationQuery */ } from '../../../../../types/graphql';
import { eSystemObjectType, eVocabularySetID } from '../../../../../types/server';
import { withDefaultValueNumber } from '../../../../../utils/shared';
import ObjectSelectModal from './ObjectSelectModal';
import RelatedObjectsList from './RelatedObjectsList';
import ObjectMeshTable from './ObjectMeshTable';
// import UVContents from './UVContents';
import AssetFilesTable from './AssetFilesTable';
import { extractModelConstellation } from '../../../../../constants';

const useStyles = makeStyles(({ palette }) => ({
    container: {
        marginTop: 20
    },
    notRequiredFields: {
        display: 'flex',
        flexDirection: 'column',
        marginLeft: 30,
        borderRadius: 5,
        backgroundColor: palette.secondary.light,
        width: '35%',
        '& > *': {
            height: '20px',
            borderBottom: '0.5px solid #D8E5EE',
            borderTop: '0.5px solid #D8E5EE'
        }
    },
    dataEntry: {
        '& > *': {
            height: '20px',
            borderBottom: '0.5px solid #D8E5EE',
            borderTop: '0.5px solid #D8E5EE'
        },
        width: '35%'
    },
    objectMeshTable: {
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 5,
        padding: 10,
        backgroundColor: palette.primary.light,
        width: '73%'
    }
}));

interface ModelProps {
    readonly metadataIndex: number;
}

function Model(props: ModelProps): React.ReactElement {
    const { metadataIndex } = props;
    const classes = useStyles();
    const metadata = useMetadataStore(state => state.metadatas[metadataIndex]);
    const { model } = metadata;
    const [updateMetadataField, getFieldErrors] = useMetadataStore(state => [state.updateMetadataField, state.getFieldErrors]);
    const [getEntries, getInitialEntry] = useVocabularyStore(state => [state.getEntries, state.getInitialEntry]);
    const [setDefaultIngestionFilters] = useRepositoryStore(state => [state.setDefaultIngestionFilters]);
    const [subjects] = useSubjectStore(state => [state.subjects]);
    const [modalOpen, setModalOpen] = useState(false);
    const [ingestionModel, setIngestionModel] = useState<any>({
        CountVertices: 0,
        CountFaces: 0,
        CountAnimations: 0,
        CountCameras: 0,
        CountLights: 0,
        CountMaterials: 0,
        CountMeshes: 0,
        CountEmbeddedTextures: 0,
        CountLinkedTextures: 0,
        FileEncoding: ''
    });
    const [assetFiles, setAssetFiles] = useState([{ assetName: '', assetType: '' }]);
    const [modelObjects, setModelObjects] = useState<any>([
        {
            idModelObject: 0,
            CountPoint: 0,
            CountFace: 0,
            CountColorChannel: 0,
            CountTextureCoordinateChannel: 0,
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
            BoundingBoxP1X: 0,
            BoundingBoxP1Y: 0,
            BoundingBoxP1Z: 0,
            BoundingBoxP2X: 0,
            BoundingBoxP2Y: 0,
            BoundingBoxP2Z: 0,
            ModelMaterials: [
                {
                    idModelMaterial: 0,
                    Name: '',
                    ModelMaterialChannel: [
                        {
                            idModelMaterialChannel: 0,
                            Type: '',
                            Source: '',
                            Value: '',
                            Additional: ''
                        }
                    ]
                }
            ]
        }
    ]);

    useEffect(() => {
        const data: any = {
            Model: {
                Name: '',
                Master: true,
                Authoritative: true,
                DateCreated: '2021-04-01T00:00:00.000Z',
                idVCreationMethod: 0,
                idVModality: 0,
                idVUnits: 0,
                idVPurpose: 0,
                idVFileType: 0,
                idAssetThumbnail: null,
                CountAnimations: 0,
                CountCameras: 0,
                CountFaces: 149999,
                CountLights: 0,
                CountMaterials: 1,
                CountMeshes: 1,
                CountVertices: 74796,
                CountEmbeddedTextures: 0,
                CountLinkedTextures: 1,
                FileEncoding: 'BINARY',
                idModel: 1,
                idAssetThumbnailOrig: null
            },
            ModelObjects: [
                {
                    idModelObject: 1,
                    idModel: 1,
                    BoundingBoxP1X: -892.2620849609375,
                    BoundingBoxP1Y: -2167.86767578125,
                    BoundingBoxP1Z: -971.3925170898438,
                    BoundingBoxP2X: 892.2653198242188,
                    BoundingBoxP2Y: 2167.867919921875,
                    BoundingBoxP2Z: 971.3912963867188,
                    CountPoint: 74796,
                    CountFace: 149999,
                    CountColorChannel: 0,
                    CountTextureCoorinateChannel: 1,
                    HasBones: false,
                    HasFaceNormals: true,
                    HasTangents: null,
                    HasTextureCoordinates: true,
                    HasVertexNormals: null,
                    HasVertexColor: false,
                    IsTwoManifoldUnbounded: false,
                    IsTwoManifoldBounded: false,
                    IsWatertight: false,
                    SelfIntersecting: true
                },
                {
                    idModelObject: 2,
                    idModel: 2,
                    BoundingBoxP1X: -892.2620849609375,
                    BoundingBoxP1Y: -2167.86767578125,
                    BoundingBoxP1Z: -971.3925170898438,
                    BoundingBoxP2X: 892.2653198242188,
                    BoundingBoxP2Y: 2167.867919921875,
                    BoundingBoxP2Z: 971.3912963867188,
                    CountPoint: 74796,
                    CountFace: 149999,
                    CountColorChannel: 0,
                    CountTextureCoorinateChannel: 1,
                    HasBones: false,
                    HasFaceNormals: true,
                    HasTangents: null,
                    HasTextureCoordinates: true,
                    HasVertexNormals: null,
                    HasVertexColor: false,
                    IsTwoManifoldUnbounded: false,
                    IsTwoManifoldBounded: false,
                    IsWatertight: false,
                    SelfIntersecting: true
                }
            ],
            ModelMaterials: [
                {
                    idModelMaterial: 1,
                    Name: 'material_0'
                },
                {
                    idModelMaterial: 2,
                    Name: 'material_1'
                }
            ],
            ModelMaterialChannels: [
                {
                    idModelMaterialChannel: 1,
                    idModelMaterial: 1,
                    idVMaterialType: 64,
                    MaterialTypeOther: null,
                    idModelMaterialUVMap: 1,
                    UVMapEmbedded: false,
                    ChannelPosition: 0,
                    ChannelWidth: 3,
                    Scalar1: 0.8,
                    Scalar2: 0.8,
                    Scalar3: 0.8,
                    Scalar4: null,
                    AdditionalAttributes: null,
                    idVMaterialTypeOrig: 64,
                    idModelMaterialUVMapOrig: 1,
                    Type: '',
                    Source: '',
                    Value: ''
                },
                {
                    idModelMaterialChannel: 2,
                    idModelMaterial: 1,
                    idVMaterialType: 65,
                    MaterialTypeOther: null,
                    idModelMaterialUVMap: null,
                    UVMapEmbedded: false,
                    ChannelPosition: null,
                    ChannelWidth: null,
                    Scalar1: 0.8,
                    Scalar2: 0.8,
                    Scalar3: 0.8,
                    Scalar4: null,
                    AdditionalAttributes: null,
                    idVMaterialTypeOrig: 65,
                    idModelMaterialUVMapOrig: null,
                    Type: '',
                    Source: '',
                    Value: ''
                },
                {
                    idModelMaterialChannel: 3,
                    idModelMaterial: 1,
                    idVMaterialType: 66,
                    MaterialTypeOther: null,
                    idModelMaterialUVMap: null,
                    UVMapEmbedded: false,
                    ChannelPosition: null,
                    ChannelWidth: null,
                    Scalar1: 0,
                    Scalar2: 0,
                    Scalar3: 0,
                    Scalar4: null,
                    AdditionalAttributes: null,
                    idVMaterialTypeOrig: 66,
                    idModelMaterialUVMapOrig: null,
                    Type: '',
                    Source: '',
                    Value: ''
                },
                {
                    idModelMaterialChannel: 4,
                    idModelMaterial: 1,
                    idVMaterialType: 67,
                    MaterialTypeOther: null,
                    idModelMaterialUVMap: null,
                    UVMapEmbedded: false,
                    ChannelPosition: null,
                    ChannelWidth: null,
                    Scalar1: 0,
                    Scalar2: 0,
                    Scalar3: 0,
                    Scalar4: null,
                    AdditionalAttributes: null,
                    idVMaterialTypeOrig: 67,
                    idModelMaterialUVMapOrig: null,
                    Type: 'random',
                    Source: 'random',
                    Value: 'random'
                },
                {
                    idModelMaterialChannel: 5,
                    idModelMaterial: 1,
                    idVMaterialType: 70,
                    MaterialTypeOther: null,
                    idModelMaterialUVMap: null,
                    UVMapEmbedded: false,
                    ChannelPosition: null,
                    ChannelWidth: null,
                    Scalar1: 0,
                    Scalar2: null,
                    Scalar3: null,
                    Scalar4: null,
                    AdditionalAttributes: null,
                    idVMaterialTypeOrig: 70,
                    idModelMaterialUVMapOrig: null,
                    Type: 'text',
                    Source: 'text',
                    Value: 'text'
                },
                {
                    idModelMaterialChannel: 6,
                    idModelMaterial: 1,
                    idVMaterialType: 71,
                    MaterialTypeOther: null,
                    idModelMaterialUVMap: null,
                    UVMapEmbedded: false,
                    ChannelPosition: null,
                    ChannelWidth: null,
                    Scalar1: 1,
                    Scalar2: null,
                    Scalar3: null,
                    Scalar4: null,
                    AdditionalAttributes: 'string',
                    idVMaterialTypeOrig: 71,
                    idModelMaterialUVMapOrig: null,
                    Type: '',
                    Source: '',
                    Value: ''
                },
                {
                    idModelMaterialChannel: 7,
                    idModelMaterial: 1,
                    idVMaterialType: 74,
                    MaterialTypeOther: null,
                    idModelMaterialUVMap: null,
                    UVMapEmbedded: false,
                    ChannelPosition: null,
                    ChannelWidth: null,
                    Scalar1: 0,
                    Scalar2: null,
                    Scalar3: null,
                    Scalar4: null,
                    AdditionalAttributes: null,
                    idVMaterialTypeOrig: 74,
                    idModelMaterialUVMapOrig: null,
                    Type: '',
                    Source: '',
                    Value: ''
                },
                {
                    idModelMaterialChannel: 8,
                    idModelMaterial: 2,
                    idVMaterialType: 74,
                    MaterialTypeOther: null,
                    idModelMaterialUVMap: null,
                    UVMapEmbedded: false,
                    ChannelPosition: null,
                    ChannelWidth: null,
                    Scalar1: 0,
                    Scalar2: null,
                    Scalar3: null,
                    Scalar4: null,
                    AdditionalAttributes: null,
                    idVMaterialTypeOrig: 74,
                    idModelMaterialUVMapOrig: null,
                    Type: '',
                    Source: '',
                    Value: ''
                }
            ],
            ModelMaterialUVMaps: [
                {
                    idModel: 1,
                    idAsset: 2,
                    UVMapEdgeLength: 0,
                    idModelMaterialUVMap: 1
                }
            ],
            ModelObjectModelMaterialXref: [
                {
                    idModelObjectModelMaterialXref: 1,
                    idModelObject: 1,
                    idModelMaterial: 1
                },
                {
                    idModelObjectModelMaterialXref: 2,
                    idModelObject: 1,
                    idModelMaterial: 2
                },
                {
                    idModelObjectModelMaterialXref: 3,
                    idModelObject: 2,
                    idModelMaterial: 1
                }
            ],
            ModelAssets: [
                {
                    Asset: {
                        FileName: 'eremotherium_laurillardi-150k-4096.fbx',
                        FilePath: '',
                        idAssetGroup: null,
                        idVAssetType: 0,
                        idSystemObject: null,
                        StorageKey: null,
                        idAsset: 1,
                        idAssetGroupOrig: null,
                        idSystemObjectOrig: null
                    },
                    AssetVersion: {
                        idAsset: 1,
                        Version: 1,
                        FileName: 'eremotherium_laurillardi-150k-4096.fbx',
                        idUserCreator: 0,
                        DateCreated: '2021-04-01T00:00:00.000Z',
                        StorageHash: '',
                        StorageSize: '0',
                        StorageKeyStaging: '',
                        Ingested: false,
                        BulkIngest: false,
                        idAssetVersion: 1
                    },
                    AssetName: 'eremotherium_laurillardi-150k-4096.fbx',
                    AssetType: 'Model'
                },
                {
                    Asset: {
                        FileName:
                            '/Users/blundellj/OneDrive - Smithsonian Institution/Packrat demo files/model validation demo files/eremotherium_laurillardi-150k-4096-obj/eremotherium_laurillardi-150k-4096-diffuse.jpg',
                        FilePath: '',
                        idAssetGroup: null,
                        idVAssetType: 0,
                        idSystemObject: null,
                        StorageKey: null,
                        idAsset: 2,
                        idAssetGroupOrig: null,
                        idSystemObjectOrig: null
                    },
                    AssetVersion: {
                        idAsset: 2,
                        Version: 1,
                        FileName:
                            '/Users/blundellj/OneDrive - Smithsonian Institution/Packrat demo files/model validation demo files/eremotherium_laurillardi-150k-4096-obj/eremotherium_laurillardi-150k-4096-diffuse.jpg',
                        idUserCreator: 0,
                        DateCreated: '2021-04-01T00:00:00.000Z',
                        StorageHash: '',
                        StorageSize: '0',
                        StorageKeyStaging: '',
                        Ingested: false,
                        BulkIngest: false,
                        idAssetVersion: 2
                    },
                    AssetName:
                        '/Users/blundellj/OneDrive - Smithsonian Institution/Packrat demo files/model validation demo files/eremotherium_laurillardi-150k-4096-obj/eremotherium_laurillardi-150k-4096-diffuse.jpg',
                    AssetType: 'Texture Map diffuse'
                }
            ]
        };

        const { ingestionModel, modelObjects, assets } = extractModelConstellation(data);
        setIngestionModel(ingestionModel);
        setModelObjects(modelObjects);
        setAssetFiles(assets);
    }, []);

    /*
    2 Approaches to gettingModelConstellation
    //fetch the idSystemObject of the subject so that it can be used
    const modelIngestionDetails = useGetModelConstellationForAssetVersionQuery({
        variables: {
            input: {
                idAssetVersion: 1
            }
        }
    })

    const {data, error} = useGetModelConstellationForAssetVersionQuery({variables: {input: {idAssetVersion}}})
*/

    // as the root to initialize the repository browser
    const subjectIdSystemObject = useGetSubjectQuery({
        variables: {
            input: {
                idSubject: subjects[0]?.id
            }
        }
    });
    const idSystemObject: number | undefined = subjectIdSystemObject?.data?.getSubject?.Subject?.SystemObject?.idSystemObject;

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

    // const updateUVMapsVariant = (uvMapId: number, mapType: number) => {
    //     const { uvMaps } = model;
    //     const updatedUVMaps = uvMaps.map(uvMap => {
    //         if (uvMapId === uvMap.id) {
    //             return {
    //                 ...uvMap,
    //                 mapType
    //             };
    //         }
    //         return uvMap;
    //     });
    //     updateMetadataField(metadataIndex, 'uvMaps', updatedUVMaps, MetadataType.model);
    // };

    const openSourceObjectModal = () => {
        setDefaultIngestionFilters(eSystemObjectType.eModel, idSystemObject);
        setModalOpen(true);
    };

    const onRemoveSourceObject = (idSystemObject: number): void => {
        const { sourceObjects } = model;
        const updatedSourceObjects = sourceObjects.filter(sourceObject => sourceObject.idSystemObject !== idSystemObject);
        updateMetadataField(metadataIndex, 'sourceObjects', updatedSourceObjects, MetadataType.model);
    };

    const onModalClose = () => {
        setModalOpen(false);
    };

    const onSelectedObjects = (newSourceObjects: StateRelatedObject[]) => {
        updateMetadataField(metadataIndex, 'sourceObjects', newSourceObjects, MetadataType.model);
        onModalClose();
    };

    const rowFieldProps = { alignItems: 'center', justifyContent: 'space-between' };

    return (
        <React.Fragment>
            <Box className={classes.container}>
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
                    <RelatedObjectsList type={RelatedObjectType.Source} relatedObjects={model.sourceObjects} onAdd={openSourceObjectModal} onRemove={onRemoveSourceObject} />
                </Box>

                {/* Start of data-entry form */}
                <Box display='flex' flexDirection='row' mb={2}>
                    <Box display='flex' flexDirection='column' className={classes.dataEntry} mr={2}>
                        <InputField required type='string' label='Name' value={model.name} name='name' onChange={setNameField} />

                        <FieldType error={errors.model.dateCaptured} required label='Date Captured' direction='row' containerProps={rowFieldProps}>
                            <DateInputField value={model.dateCaptured} onChange={(_, value) => setDateField('dateCaptured', value)} />
                        </FieldType>

                        <FieldType required label='Master Model' direction='row' containerProps={rowFieldProps}>
                            <Checkbox name='master' checked={model.master} color='primary' onChange={setCheckboxField} />
                        </FieldType>

                        <FieldType required label='Authoritative' direction='row' containerProps={rowFieldProps}>
                            <Checkbox name='authoritative' checked={model.authoritative} color='primary' onChange={setCheckboxField} />
                        </FieldType>

                        <SelectField
                            required
                            label='Creation Method'
                            error={errors.model.creationMethod}
                            value={withDefaultValueNumber(model.creationMethod, getInitialEntry(eVocabularySetID.eModelCreationMethod))}
                            name='creationMethod'
                            onChange={setIdField}
                            options={getEntries(eVocabularySetID.eModelCreationMethod)}
                        />
                        <SelectField
                            required
                            label='Modality'
                            error={errors.model.modality}
                            value={withDefaultValueNumber(model.modality, getInitialEntry(eVocabularySetID.eModelModality))}
                            name='modality'
                            onChange={setIdField}
                            options={getEntries(eVocabularySetID.eModelModality)}
                        />

                        <SelectField
                            required
                            label='Units'
                            error={errors.model.units}
                            value={withDefaultValueNumber(model.units, getInitialEntry(eVocabularySetID.eModelUnits))}
                            name='units'
                            onChange={setIdField}
                            options={getEntries(eVocabularySetID.eModelUnits)}
                        />

                        <SelectField
                            required
                            label='Purpose'
                            error={errors.model.purpose}
                            value={withDefaultValueNumber(model.purpose, getInitialEntry(eVocabularySetID.eModelPurpose))}
                            name='purpose'
                            onChange={setIdField}
                            options={getEntries(eVocabularySetID.eModelPurpose)}
                        />

                        <SelectField
                            required
                            label='Model File Type'
                            error={errors.model.modelFileType}
                            value={withDefaultValueNumber(model.modelFileType, getInitialEntry(eVocabularySetID.eModelFileType))}
                            name='modelFileType'
                            onChange={setIdField}
                            options={getEntries(eVocabularySetID.eModelFileType)}
                        />
                    </Box>
                    {/* End of data-entry form */}
                    {/* Start of model-level metrics form */}
                    <Box className={classes.notRequiredFields}>
                        <ReadOnlyRow label='Vertex Count' value={ingestionModel?.CountVertices || 'unknown'} />
                        <ReadOnlyRow label='Face Count' value={ingestionModel?.CountFaces || 'unknown'} />
                        <ReadOnlyRow label='Animation Count' value={ingestionModel?.CountAnimations || 'unknown'} />
                        <ReadOnlyRow label='Camera Count' value={ingestionModel?.CountCameras || 'unknown'} />
                        <ReadOnlyRow label='Light Count' value={ingestionModel?.CountLights || 'unknown'} />
                        <ReadOnlyRow label='Material Count' value={ingestionModel?.CountMaterials || 'unknown'} />
                        <ReadOnlyRow label='Mesh Count' value={ingestionModel?.CountMeshes || 'unknown'} />
                        <ReadOnlyRow label='Embedded Texture Count' value={ingestionModel?.CountEmbeddedTextures || 'unknown'} />
                        <ReadOnlyRow label='Linked Texture Count' value={ingestionModel?.CountLinkedTextures || 'unknown'} />
                        <ReadOnlyRow label='File Encoding' value={ingestionModel?.FileEncoding || 'unknown'} />
                    </Box>
                    {/* End of  model-level metrics form */}
                </Box>
                {/* start of object/mesh table */}
                {/* Start of asset files table */}
                <Box mb={2}>
                    <AssetFilesTable files={assetFiles} />
                </Box>
                {/* End of asset files table */}
                <Box display='flex' flexDirection='row' className={classes.objectMeshTable}>
                    <ObjectMeshTable modelObjects={modelObjects} />
                </Box>
            </Box>
            <ObjectSelectModal open={modalOpen} onSelectedObjects={onSelectedObjects} onModalClose={onModalClose} selectedObjects={model.sourceObjects} />
        </React.Fragment>
    );
}

export default Model;

{
    /* <UVContents
    initialEntry={getInitialEntry(eVocabularySetID.eModelMaterialChannelMaterialType)}
    uvMaps={model.uvMaps}
    options={getEntries(eVocabularySetID.eModelMaterialChannelMaterialType)}
    onUpdate={updateUVMapsVariant}
/> */
}

{
    /* <InputField disabled type='number' label='Roughness' value={model.roughness} name='roughness' onChange={setIdField} />
<InputField disabled type='number' label='Metalness' value={model.metalness} name='metalness' onChange={setIdField} /> */
}
