/**
 * Metadata - Model
 *
 * This component renders the metadata fields specific to model asset.
 */
import { Box, Checkbox } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { AssetIdentifiers, DateInputField, FieldType, IdInputField, SelectField } from '../../../../../components';
import { StateIdentifier, useMetadataStore, useVocabularyStore } from '../../../../../store';
import { eVocabularySetID } from '../../../../../types/server';
import { withDefaultValueBoolean, withDefaultValueNumber } from '../../../../../utils/shared';
import BoundingBoxInput from './BoundingBoxInput';

const useStyles = makeStyles(() => ({
    container: {
        marginTop: 20
    },
}));

interface ModelProps {
    readonly metadataIndex: number;
}

function Model(props: ModelProps): React.ReactElement {
    const { metadataIndex } = props;
    const classes = useStyles();
    const metadata = useMetadataStore(state => state.metadatas[metadataIndex]);
    const { model } = metadata;
    const [updateModelField, getFieldErrors] = useMetadataStore(state => [state.updateModelField, state.getFieldErrors]);
    const [getEntries, getInitialEntry] = useVocabularyStore(state => [state.getEntries, state.getInitialEntry]);

    const errors = getFieldErrors(metadata);

    const onIdentifersChange = (identifiers: StateIdentifier[]): void => {
        updateModelField(metadataIndex, 'identifiers', identifiers);
    };

    const setCheckboxField = ({ target }): void => {
        const { name, checked } = target;
        updateModelField(metadataIndex, name, checked);
    };

    const setIdField = ({ target }): void => {
        const { name, value } = target;
        let idFieldValue: number | null = null;

        if (value) {
            idFieldValue = Number.parseInt(value, 10);
        }

        updateModelField(metadataIndex, name, idFieldValue);
    };


    const setDateField = (name: string, value?: string | null): void => {
        if (value) {
            const date = new Date(value);
            updateModelField(metadataIndex, name, date);
        }
    };

    const rowFieldProps = { alignItems: 'center', justifyContent: 'space-between' };

    return (
        <Box className={classes.container}>
            <AssetIdentifiers
                systemCreated={model.systemCreated}
                identifiers={model.identifiers}
                onSystemCreatedChange={setCheckboxField}
                onAddIdentifer={onIdentifersChange}
                onUpdateIdentifer={onIdentifersChange}
                onRemoveIdentifer={onIdentifersChange}
            />
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
                            name='masterModel'
                            checked={model.masterModel}
                            color='primary'
                            onChange={setCheckboxField}
                        />
                    </FieldType>

                    <FieldType required label='Authoritative' direction='row' containerProps={rowFieldProps}>
                        <Checkbox
                            name='authoritativeModel'
                            checked={model.authoritativeModel}
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
                </Box>
                <Box display='flex' flex={1} flexDirection='column' ml='30px'>
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
    );
}

export default Model;