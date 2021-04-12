/* eslint-disable react-hooks/exhaustive-deps */
/**
 * Metadata - Photogrammetry
 *
 * This component renders the metadata fields specific to photogrammetry asset.
 */
import { Box, Checkbox } from '@material-ui/core';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import React from 'react';
import { AssetIdentifiers, DateInputField, FieldType, InputField, SelectField } from '../../../../../components';
import { MetadataType, StateIdentifier, StateMetadata, useMetadataStore, useVocabularyStore } from '../../../../../store';
import { eVocabularySetID } from '../../../../../types/server';
import { withDefaultValueNumber } from '../../../../../utils/shared';
import AssetContents from './AssetContents';
import Description from './Description';

const useStyles = makeStyles(() => ({
    container: {
        marginTop: 20
    },
}));

interface PhotogrammetryProps {
    readonly metadataIndex: number;
}

function Photogrammetry(props: PhotogrammetryProps): React.ReactElement {
    const { metadataIndex } = props;
    const classes = useStyles();

    const [getFieldErrors, updateMetadataField] = useMetadataStore(state => [state.getFieldErrors, state.updateMetadataField]);
    const metadata: StateMetadata = useMetadataStore(state => state.metadatas[metadataIndex]);
    const errors = getFieldErrors(metadata);

    const { photogrammetry } = metadata;
    const [getEntries, getInitialEntry] = useVocabularyStore(state => [state.getEntries, state.getInitialEntry]);

    const setField = ({ target }): void => {
        const { name, value } = target;
        updateMetadataField(metadataIndex, name, value, MetadataType.photogrammetry);
    };

    const setIdField = ({ target }): void => {
        const { name, value } = target;
        let idFieldValue: number | null = null;

        if (value) {
            idFieldValue = Number.parseInt(value, 10);
        }

        updateMetadataField(metadataIndex, name, idFieldValue, MetadataType.photogrammetry);
    };

    const setDateField = (name: string, value?: string | null): void => {
        if (value) {
            const date = new Date(value);
            updateMetadataField(metadataIndex, name, date, MetadataType.photogrammetry);
        }
    };

    const setNameField = ({ target }): void => {
        const { name, value } = target;
        if (value)
            updateMetadataField(metadataIndex, name, value, MetadataType.photogrammetry);
    };

    const setCheckboxField = ({ target }): void => {
        const { name, checked } = target;
        updateMetadataField(metadataIndex, name, checked, MetadataType.photogrammetry);
    };

    const onIdentifersChange = (identifiers: StateIdentifier[]): void => {
        updateMetadataField(metadataIndex, 'identifiers', identifiers, MetadataType.photogrammetry);
    };

    const updateFolderVariant = (folderId: number, variantType: number) => {
        const { folders } = photogrammetry;
        const updatedFolders = folders.map(folder => {
            if (folderId === folder.id) {
                return {
                    ...folder,
                    variantType
                };
            }
            return folder;
        });
        updateMetadataField(metadataIndex, 'folders', updatedFolders, MetadataType.photogrammetry);
    };

    const rowFieldProps = { alignItems: 'center', justifyContent: 'space-between' };

    return (
        <Box className={classes.container}>
            <AssetIdentifiers
                systemCreated={photogrammetry.systemCreated}
                identifiers={photogrammetry.identifiers}
                onSystemCreatedChange={setCheckboxField}
                onAddIdentifer={onIdentifersChange}
                onUpdateIdentifer={onIdentifersChange}
                onRemoveIdentifer={onIdentifersChange}
            />

            <Description value={photogrammetry.description} onChange={setField} />

            <Box display='flex' flexDirection='row' mt={1}>
                <Box display='flex' flex={1} flexDirection='column'>
                    <InputField required type='string' label='Name'
                        name='name' value={photogrammetry.name} onChange={setNameField}
                    />
                    <FieldType
                        error={errors.photogrammetry.dateCaptured}
                        required
                        label='Date Captured'
                        direction='row'
                        containerProps={rowFieldProps}
                    >
                        <DateInputField value={photogrammetry.dateCaptured} onChange={(_, value) => setDateField('dateCaptured', value)} />
                    </FieldType>

                    <SelectField
                        required
                        label='Dataset Type'
                        value={withDefaultValueNumber(photogrammetry.datasetType, getInitialEntry(eVocabularySetID.eCaptureDataDatasetType))}
                        name='datasetType'
                        onChange={setIdField}
                        options={getEntries(eVocabularySetID.eCaptureDataDatasetType)}
                    />
                    <AssetContents
                        initialEntry={getInitialEntry(eVocabularySetID.eCaptureDataFileVariantType)}
                        folders={photogrammetry.folders}
                        options={getEntries(eVocabularySetID.eCaptureDataFileVariantType)}
                        onUpdate={updateFolderVariant}
                    />
                </Box>
                <Box display='flex' flex={1} flexDirection='column' ml='30px'>
                    <InputField
                        type='number'
                        label='Dataset Field ID'
                        value={photogrammetry.datasetFieldId}
                        name='datasetFieldId'
                        onChange={setIdField}
                    />
                    <SelectField
                        label='Item Position Type'
                        value={withDefaultValueNumber(photogrammetry.itemPositionType, getInitialEntry(eVocabularySetID.eCaptureDataItemPositionType))}
                        name='itemPositionType'
                        onChange={setIdField}
                        options={getEntries(eVocabularySetID.eCaptureDataItemPositionType)}
                    />
                    <InputField
                        type='number'
                        label='Item Position Field ID'
                        value={photogrammetry.itemPositionFieldId}
                        name='itemPositionFieldId'
                        onChange={setIdField}
                    />
                    <InputField
                        type='number'
                        label='Item Arrangement Field ID'
                        value={photogrammetry.itemArrangementFieldId}
                        name='itemArrangementFieldId'
                        onChange={setIdField}
                    />
                    <SelectField
                        label='Focus Type'
                        value={withDefaultValueNumber(photogrammetry.focusType, getInitialEntry(eVocabularySetID.eCaptureDataFocusType))}
                        name='focusType'
                        onChange={setIdField}
                        options={getEntries(eVocabularySetID.eCaptureDataFocusType)}
                    />

                    <SelectField
                        label='Light Source Type'
                        value={withDefaultValueNumber(photogrammetry.lightsourceType, getInitialEntry(eVocabularySetID.eCaptureDataLightSourceType))}
                        name='lightsourceType'
                        onChange={setIdField}
                        options={getEntries(eVocabularySetID.eCaptureDataLightSourceType)}
                    />

                    <SelectField
                        label='Background Removal Method'
                        value={withDefaultValueNumber(photogrammetry.backgroundRemovalMethod, getInitialEntry(eVocabularySetID.eCaptureDataBackgroundRemovalMethod))}
                        name='backgroundRemovalMethod'
                        onChange={setIdField}
                        options={getEntries(eVocabularySetID.eCaptureDataBackgroundRemovalMethod)}
                    />

                    <SelectField
                        label='Cluster Type'
                        value={withDefaultValueNumber(photogrammetry.clusterType, getInitialEntry(eVocabularySetID.eCaptureDataClusterType))}
                        name='clusterType'
                        onChange={setIdField}
                        options={getEntries(eVocabularySetID.eCaptureDataClusterType)}
                    />

                    <InputField
                        type='number'
                        label='Cluster Geometry Field ID'
                        value={photogrammetry.clusterGeometryFieldId}
                        name='clusterGeometryFieldId'
                        onChange={setIdField}
                    />
                    <FieldType required={false} label='Camera Settings Uniform?' direction='row' containerProps={rowFieldProps}>
                        <CustomCheckbox
                            disabled
                            name='cameraSettingUniform'
                            checked={photogrammetry.cameraSettingUniform}
                            onChange={setCheckboxField}
                            color='primary'
                        />
                    </FieldType>
                </Box>
            </Box>
        </Box>
    );
}

const checkboxStyles = ({ palette }) => ({
    root: {
        color: palette.primary.main,
        '&$checked': {
            color: palette.primary.main,
        },
        '&$disabled': {
            color: palette.primary.main,
        }
    },
    checked: {},
    disabled: {}
});

const CustomCheckbox = withStyles(checkboxStyles)(Checkbox);

export default Photogrammetry;