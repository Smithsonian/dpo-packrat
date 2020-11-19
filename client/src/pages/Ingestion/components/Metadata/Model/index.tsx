/**
 * Metadata - Model
 *
 * This component renders the metadata fields specific to model asset.
 */
import { Box, Checkbox } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { useState } from 'react';
import { AssetIdentifiers, DateInputField, FieldType, IdInputField, SelectField } from '../../../../../components';
import { StateIdentifier, StateRelatedObject, useMetadataStore, useVocabularyStore } from '../../../../../store';
import { MetadataType } from '../../../../../store/metadata';
import { RelatedObjectType } from '../../../../../types/graphql';
import { eVocabularySetID } from '../../../../../types/server';
import { withDefaultValueBoolean, withDefaultValueNumber } from '../../../../../utils/shared';
import BoundingBoxInput from './BoundingBoxInput';
import ObjectSelectModal from './ObjectSelectModal';
import RelatedObjectsList from './RelatedObjectsList';
import UVContents from './UVContents';

const useStyles = makeStyles(({ palette, typography }) => ({
    container: {
        marginTop: 20
    },
    notRequiredFields: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        marginLeft: 30,
        borderRadius: 5,
        backgroundColor: palette.secondary.light
    },
    noteText: {
        marginTop: 10,
        fontSize: '0.8em',
        fontWeight: typography.fontWeightLight,
        fontStyle: 'italic',
        textAlign: 'center'
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

    const updateUVMapsVariant = (uvMapId: number, mapType: number) => {
        const { uvMaps } = model;
        const updatedUVMaps = uvMaps.map(uvMap => {
            if (uvMapId === uvMap.id) {
                return {
                    ...uvMap,
                    mapType
                };
            }
            return uvMap;
        });
        updateMetadataField(metadataIndex, 'uvMaps', updatedUVMaps, MetadataType.model);
    };

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

    const noteLabelProps = { style: { fontStyle: 'italic' } };
    const noteFieldProps = { alignItems: 'center', style: { paddingBottom: 0 } };
    const rowFieldProps = { alignItems: 'center', justifyContent: 'space-between' };

    return (
        <React.Fragment>
            <Box className={classes.container}>
                <AssetIdentifiers
                    systemCreated={model.systemCreated}
                    identifiers={model.identifiers}
                    onSystemCreatedChange={setCheckboxField}
                    onAddIdentifer={onIdentifersChange}
                    onUpdateIdentifer={onIdentifersChange}
                    onRemoveIdentifer={onIdentifersChange}
                />
                <RelatedObjectsList type={RelatedObjectType.Source} relatedObjects={model.sourceObjects} onAdd={openSourceObjectModal} onRemove={onRemoveSourceObject} />
                <Box display='flex' flexDirection='row' mt={1}>
                    <Box display='flex' flex={1} flexDirection='column'>
                        <FieldType
                            error={errors.model.dateCaptured}
                            required
                            label='Date Captured'
                            direction='row'
                            containerProps={rowFieldProps}
                        >
                            <DateInputField value={model.dateCaptured} onChange={(_, value) => setDateField('dateCaptured', value)} />
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

                        <FieldType required label='Master' direction='row' containerProps={rowFieldProps}>
                            <Checkbox
                                name='master'
                                checked={model.master}
                                color='primary'
                                onChange={setCheckboxField}
                            />
                        </FieldType>

                        <FieldType required label='Authoritative' direction='row' containerProps={rowFieldProps}>
                            <Checkbox
                                name='authoritative'
                                checked={model.authoritative}
                                color='primary'
                                onChange={setCheckboxField}
                            />
                        </FieldType>

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
                            value={withDefaultValueNumber(model.modelFileType, getInitialEntry(eVocabularySetID.eModelGeometryFileModelFileType))}
                            name='modelFileType'
                            onChange={setIdField}
                            options={getEntries(eVocabularySetID.eModelGeometryFileModelFileType)}
                        />
                        <UVContents
                            initialEntry={getInitialEntry(eVocabularySetID.eModelUVMapChannelUVMapType)}
                            uvMaps={model.uvMaps}
                            options={getEntries(eVocabularySetID.eModelUVMapChannelUVMapType)}
                            onUpdate={updateUVMapsVariant}
                        />
                    </Box>
                    <Box className={classes.notRequiredFields}>
                        <FieldType required={false} label='(These values may be updated by Cook during ingestion)' labelProps={noteLabelProps} containerProps={noteFieldProps} />
                        <IdInputField label='Roughness' value={model.roughness} name='roughness' onChange={setIdField} />
                        <IdInputField label='Metalness' value={model.metalness} name='metalness' onChange={setIdField} />
                        <IdInputField label='Point Count' value={model.pointCount} name='pointCount' onChange={setIdField} />
                        <IdInputField label='Face Count' value={model.faceCount} name='faceCount' onChange={setIdField} />

                        <FieldType required={false} label='Is Watertight?' direction='row' containerProps={rowFieldProps}>
                            <Checkbox
                                name='isWatertight'
                                checked={withDefaultValueBoolean(model.isWatertight, false)}
                                color='primary'
                                onChange={setCheckboxField}
                            />
                        </FieldType>

                        <FieldType required={false} label='Has Normals?' direction='row' containerProps={rowFieldProps}>
                            <Checkbox
                                name='hasNormals'
                                checked={withDefaultValueBoolean(model.hasNormals, false)}
                                color='primary'
                                onChange={setCheckboxField}
                            />
                        </FieldType>


                        <FieldType required={false} label='Has Vertex Color?' direction='row' containerProps={rowFieldProps}>
                            <Checkbox
                                name='hasVertexColor'
                                checked={withDefaultValueBoolean(model.hasVertexColor, false)}
                                color='primary'
                                onChange={setCheckboxField}
                            />
                        </FieldType>

                        <FieldType required={false} label='Has UV Space?' direction='row' containerProps={rowFieldProps}>
                            <Checkbox
                                name='hasUVSpace'
                                checked={withDefaultValueBoolean(model.hasUVSpace, false)}
                                color='primary'
                                onChange={setCheckboxField}
                            />
                        </FieldType>

                        <BoundingBoxInput model={model} onChange={setIdField} />
                    </Box>
                </Box>
            </Box>
            <ObjectSelectModal open={modalOpen} onSelectedObjects={onSelectedObjects} onModalClose={onModalClose} selectedObjects={model.sourceObjects} />
        </React.Fragment>
    );
}

export default Model;