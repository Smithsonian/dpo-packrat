/* eslint-disable react-hooks/exhaustive-deps */
import { Box, Checkbox, Typography } from '@material-ui/core';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import React from 'react';
import { FieldType } from '../../../../../components';
import DateFnsUtils from '@date-io/date-fns';
import { MuiPickersUtilsProvider, KeyboardDatePicker } from '@material-ui/pickers';
import { Colors } from '../../../../../theme';
import { StateMetadata, useVocabulary, useMetadata, StateIdentifier } from '../../../../../store';
import { eVocabularySetID } from '../../../../../types/server';
import Description from './Description';
import IdentifierList from './IdentifierList';
import SelectField from './SelectField';
import IdInputField from './IdInputField';
import lodash from 'lodash';
import AssetContents from './AssetContents';

const useStyles = makeStyles(({ palette, typography, spacing }) => ({
    container: {
        marginTop: 20
    },
    assetIdentifier: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: 10,
    },
    systemCreatedText: {
        marginLeft: spacing(2),
        fontStyle: 'italic',
        color: palette.primary.contrastText
    },
    fieldsContainer: {
        display: 'flex',
        marginTop: 10
    },
    divider: {
        display: 'flex',
        height: 20,
        width: 30
    },
    date: {
        width: '50%',
        background: palette.background.paper,
        border: `1px solid ${palette.primary.contrastText}`,
        padding: '1px 8px',
        color: Colors.defaults.white,
        borderRadius: 5,
        fontFamily: typography.fontFamily
    }
}));

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

interface PhotogrammetryProps {
    metadataIndex: number;
}

function Photogrammetry(props: PhotogrammetryProps): React.ReactElement {
    const { metadataIndex } = props;
    const classes = useStyles();

    const { getFieldErrors, updatePhotogrammetryField } = useMetadata();
    const metadata: StateMetadata = useMetadata(state => state.metadatas[metadataIndex]);
    const errors = getFieldErrors(metadata);

    const { photogrammetry } = metadata;
    const { getEntries, getInitialEntry } = useVocabulary();

    const setField = ({ target }): void => {
        const { name, value } = target;
        updatePhotogrammetryField(metadataIndex, name, value);
    };

    const setIdField = ({ target }): void => {
        const { name, value } = target;
        let idFieldValue: number | null = null;
        if (value) {
            idFieldValue = Number.parseInt(value, 10);
        }

        updatePhotogrammetryField(metadataIndex, name, idFieldValue);
    };

    const setDateField = (name: string, value: string | null | undefined): void => {
        if (value) {
            const date = new Date(value);
            updatePhotogrammetryField(metadataIndex, name, date);
        }
    };

    const setCheckboxField = ({ target }): void => {
        const { name, checked } = target;

        updatePhotogrammetryField(metadataIndex, name, checked);
    };

    const addIdentifer = (initialEntry: number | null) => {
        const { identifiers } = photogrammetry;
        const newIdentifier: StateIdentifier = {
            id: identifiers.length + 1,
            identifier: '',
            identifierType: getInitialEntry(eVocabularySetID.eIdentifierIdentifierType) || initialEntry,
            selected: false
        };

        const updatedIdentifiers = lodash.concat(identifiers, [newIdentifier]);
        updatePhotogrammetryField(metadataIndex, 'identifiers', updatedIdentifiers);
    };

    const removeIdentifier = (id: number) => {
        const { identifiers } = photogrammetry;
        const updatedIdentifiers = lodash.filter(identifiers, identifier => identifier.id !== id);
        updatePhotogrammetryField(metadataIndex, 'identifiers', updatedIdentifiers);
    };

    const updateIdentifierFields = (id: number, name: string, value: string | number | boolean) => {
        const { identifiers } = photogrammetry;
        const updatedIdentifiers = identifiers.map(identifier => {
            if (identifier.id === id) {
                return {
                    ...identifier,
                    [name]: value
                };
            }
            return identifier;
        });
        updatePhotogrammetryField(metadataIndex, 'identifiers', updatedIdentifiers);
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
        updatePhotogrammetryField(metadataIndex, 'folders', updatedFolders);
    };

    const rowFieldProps = { alignItems: 'center', justifyContent: 'space-between' };

    return (
        <Box className={classes.container}>
            <Box marginBottom='10px'>
                <FieldType required label='Asset Identifier(s)'>
                    <Box className={classes.assetIdentifier}>
                        <Checkbox
                            name='systemCreated'
                            checked={photogrammetry.systemCreated}
                            color='primary'
                            onChange={setCheckboxField}
                        />
                        <Typography className={classes.systemCreatedText} variant='body1'>System will create an identifier</Typography>
                    </Box>
                    <IdentifierList
                        identifiers={photogrammetry.identifiers}
                        identifierTypes={getEntries(eVocabularySetID.eIdentifierIdentifierType)}
                        onAdd={addIdentifer}
                        onRemove={removeIdentifier}
                        onUpdate={updateIdentifierFields}
                    />
                </FieldType>
            </Box>

            <Description value={photogrammetry.description} onChange={setField} />

            <Box className={classes.fieldsContainer} flexDirection='row'>
                <Box display='flex' flex={1} flexDirection='column'>
                    <FieldType
                        error={errors.photogrammetry.dateCaptured}
                        required
                        label='Date Captured'
                        direction='row'
                        containerProps={rowFieldProps}
                    >
                        <MuiPickersUtilsProvider utils={DateFnsUtils}>
                            <KeyboardDatePicker
                                disableToolbar
                                variant='inline'
                                format='MM/dd/yyyy'
                                margin='normal'
                                value={photogrammetry.dateCaptured}
                                className={classes.date}
                                InputProps={{ disableUnderline: true }}
                                onChange={(_, value) => setDateField('dateCaptured', value)}
                            />
                        </MuiPickersUtilsProvider>
                    </FieldType>

                    <SelectField
                        required
                        label='Dataset Type'
                        value={photogrammetry.datasetType || getInitialEntry(eVocabularySetID.eCaptureDataDatasetType)}
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
                <Box className={classes.divider} />
                <Box display='flex' flex={1} flexDirection='column'>
                    <IdInputField label='Dataset Field ID' value={photogrammetry.datasetFieldId} name='datasetFieldId' onChange={setIdField} />
                    <SelectField
                        label='Item Position Type'
                        value={photogrammetry.itemPositionType || getInitialEntry(eVocabularySetID.eCaptureDataItemPositionType)}
                        name='itemPositionType'
                        onChange={setIdField}
                        options={getEntries(eVocabularySetID.eCaptureDataItemPositionType)}
                    />
                    <IdInputField label='Item Position Field ID' value={photogrammetry.itemPositionFieldId} name='itemPositionFieldId' onChange={setIdField} />
                    <IdInputField label='Item Arrangement Field ID' value={photogrammetry.itemArrangementFieldId} name='itemArrangementFieldId' onChange={setIdField} />
                    <SelectField
                        label='Focus Type'
                        value={photogrammetry.focusType || getInitialEntry(eVocabularySetID.eCaptureDataFocusType)}
                        name='focusType'
                        onChange={setIdField}
                        options={getEntries(eVocabularySetID.eCaptureDataFocusType)}
                    />

                    <SelectField
                        label='Light Source Type'
                        value={photogrammetry.lightsourceType || getInitialEntry(eVocabularySetID.eCaptureDataLightSourceType)}
                        name='lightsourceType'
                        onChange={setIdField}
                        options={getEntries(eVocabularySetID.eCaptureDataLightSourceType)}
                    />

                    <SelectField
                        label='Background Removal Method'
                        value={photogrammetry.backgroundRemovalMethod || getInitialEntry(eVocabularySetID.eCaptureDataBackgroundRemovalMethod)}
                        name='backgroundRemovalMethod'
                        onChange={setIdField}
                        options={getEntries(eVocabularySetID.eCaptureDataBackgroundRemovalMethod)}
                    />

                    <SelectField
                        label='Cluster Type'
                        value={photogrammetry.clusterType || getInitialEntry(eVocabularySetID.eCaptureDataClusterType)}
                        name='clusterType'
                        onChange={setIdField}
                        options={getEntries(eVocabularySetID.eCaptureDataClusterType)}
                    />

                    <IdInputField label='Cluster Geometry Field ID' value={photogrammetry.clusterGeometryFieldId} name='clusterGeometryFieldId' onChange={setIdField} />
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

export default Photogrammetry;