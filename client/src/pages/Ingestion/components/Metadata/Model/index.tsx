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
import { RelatedObjectType } from '../../../../../types/graphql';
import { eSystemObjectType, eVocabularySetID } from '../../../../../types/server';
import { withDefaultValueNumber } from '../../../../../utils/shared';
import ObjectSelectModal from './ObjectSelectModal';
import RelatedObjectsList from './RelatedObjectsList';
import ObjectMeshTable from './ObjectMeshTable';
// import UVContents from './UVContents';
import AssetFilesTable from './AssetFilesTable';

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

    interface ObjectMesh {
        materialTypes: MaterialInfo[];
        pointCount: number;
        faceCount: number;
        colorChannelCount: number;
        textureCoordChannelCount: number;
        hasBones: boolean | null;
        hasFaceNormals: boolean | null;
        hasTangents: boolean | null;
        hasTextureCoordinates: boolean | null;
        hasVertexNormals: boolean | null;
        hasVertexColor: boolean | null;
        manifoldClosed: boolean | null;
        manifoldOpen: boolean | null;
        isWatertight: boolean | null;
        selfIntersecting: boolean | null;
        boundingValues: number[];
    }

    interface MaterialInfo {
        materialName: string;
        type: MaterialType[];
    }

    interface MaterialType {
        typeName: string;
        source: string;
        value: string;
        additional: string;
    }

    const sampleObjectMesh: ObjectMesh = {
        materialTypes: [
            {
                materialName: 'material1',
                type: [
                    {
                        typeName: 'diffuse1',
                        source: 'armstrong1.jpg',
                        value: '1.0',
                        additional: 'ior:1'
                    },
                    {
                        typeName: 'occlusion2',
                        source: 'armstrong2.jpg',
                        value: '2.0',
                        additional: ''
                    }
                ]
            },
            {
                materialName: 'material2',
                type: [
                    {
                        typeName: 'diffuse2',
                        source: 'garden.jpg',
                        value: '3.0',
                        additional: 'more info'
                    }
                ]
            }
        ],
        pointCount: 4,
        faceCount: 4,
        colorChannelCount: 5,
        textureCoordChannelCount: 2,
        hasBones: true,
        hasFaceNormals: true,
        hasTangents: true,
        hasTextureCoordinates: null,
        hasVertexNormals: true,
        hasVertexColor: null,
        manifoldClosed: true,
        manifoldOpen: false,
        isWatertight: true,
        selfIntersecting: false,
        boundingValues: [6, 1, 2, 3, 4, 5]
    };

    const sampleAssetFiles = [
        {
            assetName: 'armstrong.obj',
            assetType: 'geometry'
        },
        {
            assetName: 'ArmstrongBump.jpg',
            assetType: 'Texture: bump'
        },
        {
            assetName: 'another1.jpg',
            assetType: 'something'
        }
    ];

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

    useEffect(() => {
        setDefaultIngestionFilters(eSystemObjectType.eModel, '11-33-44');
    }, [setDefaultIngestionFilters]);

    const openSourceObjectModal = () => {
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

    console.log(subjects);

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
                        <ReadOnlyRow label='Point Count' value={77} />
                        <ReadOnlyRow label='Face Count' value={2} />
                        <ReadOnlyRow label='Animation Count' value={2} />
                        <ReadOnlyRow label='Camera Count' value={2} />
                        <ReadOnlyRow label='Light Count' value={2} />
                        <ReadOnlyRow label='Material Count' value={2} />
                        <ReadOnlyRow label='Mesh Count' value={2} />
                        <ReadOnlyRow label='Embedded Texture Count' value={2} />
                        <ReadOnlyRow label='Linked Texture Count' value={2} />
                        <ReadOnlyRow label='File Encoding' value={'Binary'} />
                    </Box>
                    {/* End of  model-level metrics form */}
                </Box>
                {/* start of object/mesh table */}
                {/* Start of asset files table */}
                <Box mb={2}>
                    <AssetFilesTable files={sampleAssetFiles} />
                </Box>
                {/* End of asset files table */}
                <Box display='flex' flexDirection='row' className={classes.objectMeshTable}>
                    <ObjectMeshTable material={sampleObjectMesh} />
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

{
    /* <CheckboxField name='isTwoManifoldUnbounded' label='Is Two Manifold Unbounded?' value={model.isTwoManifoldUnbounded} onChange={setCheckboxField} />
<CheckboxField name='isTwoManifoldBounded' label='Is Two Manifold Bounded?' value={model.isTwoManifoldBounded} onChange={setCheckboxField} />
<CheckboxField name='isWatertight' label='Is Watertight?' value={model.isWatertight} onChange={setCheckboxField} />
<CheckboxField name='hasNormals' label='Has Normals?' value={model.hasNormals} onChange={setCheckboxField} />
<CheckboxField name='hasVertexColor' label='Has Vertex Color?' value={model.hasVertexColor} onChange={setCheckboxField} />
<CheckboxField name='hasUVSpace' label='Has UV Space?' value={model.hasUVSpace} onChange={setCheckboxField} />
<CheckboxField name='selfIntersecting' label='Self Intersecting?' value={model.selfIntersecting} onChange={setCheckboxField} />
<BoundingBoxInput
    disabled
    boundingBoxP1X={model.boundingBoxP1X}
    boundingBoxP1Y={model.boundingBoxP1Y}
    boundingBoxP1Z={model.boundingBoxP1Z}
    boundingBoxP2X={model.boundingBoxP2X}
    boundingBoxP2Y={model.boundingBoxP2Y}
    boundingBoxP2Z={model.boundingBoxP2Z}
    onChange={setIdField}
/> */
}
