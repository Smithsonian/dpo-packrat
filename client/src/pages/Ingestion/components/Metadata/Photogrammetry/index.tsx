/* eslint-disable react/jsx-max-props-per-line */
/* eslint-disable react-hooks/exhaustive-deps */
/**
 * Metadata - Photogrammetry
 *
 * This component renders the metadata fields specific to photogrammetry asset.
 */
import { Box, Checkbox, Table, TableBody, TableCell, TableContainer, TableRow, Paper, Typography, Select, MenuItem } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import React, { useState, useEffect } from 'react';
import { AssetIdentifiers, DateInputField, TextArea } from '../../../../../components';
import { MetadataType, StateIdentifier, StateMetadata, useMetadataStore, useVocabularyStore, useRepositoryStore, useSubjectStore, StateRelatedObject } from '../../../../../store';
import { eVocabularySetID, eSystemObjectType } from '@dpo-packrat/common';
import { withDefaultValueNumber, withDefaultValueBoolean } from '../../../../../utils/shared';
import AssetContents from './AssetContents';
import Description from './Description';
import RelatedObjectsList from '../Model/RelatedObjectsList';
import ObjectSelectModal from '../Model/ObjectSelectModal';
import { RelatedObjectType, useGetSubjectQuery } from '../../../../../types/graphql';
import clsx from 'clsx';
import { DebounceInput } from 'react-debounce-input';
import { useStyles } from '../../../../Repository/components/DetailsView/DetailsTab/CaptureDataDetails';


interface PhotogrammetryProps {
    readonly metadataIndex: number;
}

function Photogrammetry(props: PhotogrammetryProps): React.ReactElement {
    const { metadataIndex } = props;
    const classes = useStyles();

    const [getFieldErrors, updateMetadataField] = useMetadataStore(state => [state.getFieldErrors, state.updateMetadataField]);
    const metadata: StateMetadata = useMetadataStore(state => state.metadatas[metadataIndex]);
    const [getEntries, getInitialEntry] = useVocabularyStore(state => [state.getEntries, state.getInitialEntry]);
    const [subjects] = useSubjectStore(state => [state.subjects]);
    const [setDefaultIngestionFilters, closeRepositoryBrowser, resetRepositoryBrowserRoot] = useRepositoryStore(state => [state.setDefaultIngestionFilters, state.closeRepositoryBrowser, state.resetRepositoryBrowserRoot]);
    const [modalOpen, setModalOpen] = useState(false);
    const [objectRelationship, setObjectRelationship] = useState<RelatedObjectType>(RelatedObjectType.Source);
    const { photogrammetry, file } = metadata;
    const { idAsset } = file;
    const errors = getFieldErrors(metadata);

    useEffect(() => {
        if (idAsset)
            updateMetadataField(metadataIndex, 'idAsset', idAsset, MetadataType.photogrammetry);
    }, [metadataIndex, idAsset, updateMetadataField]);

    const validSubjectId = subjects.find((subject) => subject.id > 0)?.id ?? 0;
    const subjectIdSystemObject = useGetSubjectQuery({
        variables: {
            input: {
                idSubject: validSubjectId
            }
        }
    });

    const idSystemObject: number | undefined = subjectIdSystemObject?.data?.getSubject?.Subject?.SystemObject?.idSystemObject;
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
        if (value) updateMetadataField(metadataIndex, name, value, MetadataType.photogrammetry);
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

    const openSourceObjectModal = async () => {
        await setDefaultIngestionFilters(eSystemObjectType.eCaptureData, idSystemObject);
        await setObjectRelationship(RelatedObjectType.Source);
        await setModalOpen(true);
    };

    const openDerivedObjectModal = async () => {
        await setDefaultIngestionFilters(eSystemObjectType.eCaptureData, idSystemObject);
        await setObjectRelationship(RelatedObjectType.Derived);
        await setModalOpen(true);
    };

    const onRemoveSourceObject = (idSystemObject: number): void => {
        const { sourceObjects } = photogrammetry;
        const updatedSourceObjects = sourceObjects.filter(sourceObject => sourceObject.idSystemObject !== idSystemObject);
        updateMetadataField(metadataIndex, 'sourceObjects', updatedSourceObjects, MetadataType.photogrammetry);
    };

    const onRemoveDerivedObject = (idSystemObject: number): void => {
        const { derivedObjects } = photogrammetry;
        const updatedDerivedObjects = derivedObjects.filter(sourceObject => sourceObject.idSystemObject !== idSystemObject);
        updateMetadataField(metadataIndex, 'derivedObjects', updatedDerivedObjects, MetadataType.photogrammetry);
    };

    const onModalClose = () => {
        setModalOpen(false);
        setObjectRelationship(RelatedObjectType.Source);
        closeRepositoryBrowser();
        resetRepositoryBrowserRoot();
    };

    const onSelectedObjects = (newSourceObjects: StateRelatedObject[]) => {
        updateMetadataField(metadataIndex, objectRelationship === RelatedObjectType.Source ? 'sourceObjects' : 'derivedObjects', newSourceObjects, MetadataType.photogrammetry);
        onModalClose();
    };

    return (
        <Box>
            {idAsset && (
                <Box mb={2}>
                    <TextArea
                        label='Update Notes'
                        value={photogrammetry.updateNotes}
                        name='updateNotes'
                        onChange={setNameField}
                        placeholder='Update notes...'
                    />
                </Box>
            )}
            <Box width='52vw'>
                <AssetIdentifiers
                    systemCreated={photogrammetry.systemCreated}
                    identifiers={photogrammetry.identifiers}
                    onSystemCreatedChange={setCheckboxField}
                    onAddIdentifer={onIdentifersChange}
                    onUpdateIdentifer={onIdentifersChange}
                    onRemoveIdentifer={onIdentifersChange}
                />
            </Box>
            {!idAsset && (
                <React.Fragment>
                    <Box mb={2}>
                        <RelatedObjectsList
                            type={RelatedObjectType.Source}
                            relatedObjects={photogrammetry.sourceObjects}
                            onAdd={openSourceObjectModal}
                            onRemove={onRemoveSourceObject}
                            relationshipLanguage='Parents'
                        />
                    </Box>
                    <Box mb={2}>
                        <RelatedObjectsList
                            type={RelatedObjectType.Derived}
                            relatedObjects={photogrammetry.derivedObjects}
                            onAdd={openDerivedObjectModal}
                            onRemove={onRemoveDerivedObject}
                            relationshipLanguage='Children'
                        />
                    </Box>
                </React.Fragment>
            )}
            <Box style={{ width: '70%' }}>
                <Description value={photogrammetry.description} onChange={setField} />
            </Box>

            <Box className={classes.cdInputContainer}>
                <TableContainer component={Paper} className={classes.captureMethodTableContainer} elevation={0} style={{ paddingTop: '10px' }}>
                    <Table className={classes.table}>
                        <TableBody>
                            <TableRow className={classes.tableRow}>
                                <TableCell className={classes.tableCell}>
                                    <Typography className={classes.labelText}>Name</Typography>
                                </TableCell>
                                <TableCell className={clsx(classes.tableCell, classes.valueText)}>
                                    <DebounceInput
                                        element='input'
                                        title='itemPositionFieldId-input'
                                        value={photogrammetry.name}
                                        type='string'
                                        name='name'
                                        onChange={setNameField}
                                        className={clsx(classes.input, classes.datasetFieldInput)}
                                    />
                                </TableCell>
                            </TableRow>
                            <TableRow className={classes.tableRow} style={{ ...errorFieldStyling(errors.photogrammetry.dateCaptured) }}>
                                <TableCell className={classes.tableCell}>
                                    <Typography className={classes.labelText}>
                                        Date Captured
                                    </Typography>
                                </TableCell>
                                <TableCell className={classes.tableCell}>
                                    <DateInputField
                                        value={photogrammetry.dateCaptured}
                                        onChange={(_, value) => setDateField('dateCaptured', value)}
                                        dateHeight='22px'
                                    />
                                </TableCell>
                            </TableRow>
                            <TableRow className={classes.tableRow}>
                                <TableCell className={classes.tableCell}>
                                    <Typography className={classes.labelText}>Dataset Type</Typography>
                                </TableCell>
                                <TableCell className={classes.tableCell}>
                                    <Select
                                        value={withDefaultValueNumber(photogrammetry.datasetType, getInitialEntry(eVocabularySetID.eCaptureDataDatasetType))}
                                        name='datasetType'
                                        onChange={setIdField}
                                        disableUnderline
                                        className={clsx(classes.select, classes.datasetTypeSelect)}
                                        SelectDisplayProps={{ style: { paddingLeft: '10px', borderRadius: '5px' } }}
                                    >
                                        {getEntries(eVocabularySetID.eCaptureDataDatasetType).map(({ idVocabulary, Term }, index) => <MenuItem key={index} value={idVocabulary}>{Term}</MenuItem>)}
                                    </Select>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>

                <AssetContents
                    initialEntry={getInitialEntry(eVocabularySetID.eCaptureDataFileVariantType)}
                    folders={photogrammetry.folders}
                    options={getEntries(eVocabularySetID.eCaptureDataFileVariantType)}
                    onUpdate={updateFolderVariant}
                />

                <Box className={classes.fieldTableBoxContainer}>
                    <TableContainer className={classes.fieldTableContainer}>
                        <Table className={classes.table}>
                            <TableBody>
                                <TableRow className={classes.tableRow}>
                                    <TableCell className={classes.tableCell}>
                                        <Typography className={classes.labelText}>Dataset Field ID</Typography>
                                    </TableCell>
                                    <TableCell className={classes.tableCell}>
                                        <DebounceInput
                                            element='input'
                                            title='datasetFieldId-input'
                                            value={photogrammetry.datasetFieldId || ''}
                                            type='number'
                                            name='datasetFieldId'
                                            onChange={setIdField}
                                            className={clsx(classes.input, classes.datasetFieldInput)}
                                        />
                                    </TableCell>
                                </TableRow>
                                <TableRow className={classes.tableRow}>
                                    <TableCell className={classes.tableCell}>
                                        <Typography className={classes.labelText}>Item Position Type</Typography>
                                    </TableCell>
                                    <TableCell className={classes.tableCell}>
                                        <Select
                                            value={withDefaultValueNumber(photogrammetry.itemPositionType, getInitialEntry(eVocabularySetID.eCaptureDataItemPositionType))}
                                            name='itemPositionType'
                                            onChange={setIdField}
                                            disableUnderline
                                            className={clsx(classes.select, classes.datasetFieldSelect)}
                                            SelectDisplayProps={{ style: { paddingLeft: '10px', borderRadius: '5px' } }}
                                        >
                                            {getEntries(eVocabularySetID.eCaptureDataItemPositionType).map(({ idVocabulary, Term }, index) => <MenuItem key={index} value={idVocabulary}>{Term}</MenuItem>)}
                                        </Select>
                                    </TableCell>
                                </TableRow>
                                <TableRow className={classes.tableRow}>
                                    <TableCell className={classes.tableCell}>
                                        <Typography className={classes.labelText}>Item Position Field ID</Typography>
                                    </TableCell>
                                    <TableCell className={classes.tableCell}>
                                        <DebounceInput
                                            element='input'
                                            title='itemPositionFieldId-input'
                                            value={photogrammetry.itemPositionFieldId || ''}
                                            type='number'
                                            name='itemPositionFieldId'
                                            onChange={setIdField}
                                            className={clsx(classes.input, classes.datasetFieldInput)}
                                        />
                                    </TableCell>
                                </TableRow>
                                <TableRow className={classes.tableRow}>
                                    <TableCell className={classes.tableCell}>
                                        <Typography className={classes.labelText}>Item Arrangement Field ID</Typography>
                                    </TableCell>
                                    <TableCell className={classes.tableCell}>
                                        <DebounceInput
                                            element='input'
                                            title='itemArrangementFieldId-input'
                                            value={photogrammetry.itemArrangementFieldId || ''}
                                            type='number'
                                            name='itemArrangementFieldId'
                                            onChange={setIdField}
                                            className={clsx(classes.input, classes.datasetFieldInput)}
                                        />
                                    </TableCell>
                                </TableRow>
                                <TableRow className={classes.tableRow}>
                                    <TableCell className={classes.tableCell}>
                                        <Typography className={classes.labelText}>Focus Type</Typography>
                                    </TableCell>
                                    <TableCell className={classes.tableCell}>
                                        <Select
                                            value={withDefaultValueNumber(photogrammetry.focusType, getInitialEntry(eVocabularySetID.eCaptureDataFocusType))}
                                            name='focusType'
                                            onChange={setIdField}
                                            disableUnderline
                                            className={clsx(classes.select, classes.datasetFieldSelect)}
                                            SelectDisplayProps={{ style: { paddingLeft: '10px', borderRadius: '5px' } }}
                                        >
                                            {getEntries(eVocabularySetID.eCaptureDataFocusType).map(({ idVocabulary, Term }, index) => <MenuItem key={index} value={idVocabulary}>{Term}</MenuItem>)}
                                        </Select>
                                    </TableCell>
                                </TableRow>
                                <TableRow className={classes.tableRow}>
                                    <TableCell className={classes.tableCell}>
                                        <Typography className={classes.labelText}>Light Source Type</Typography>
                                    </TableCell>
                                    <TableCell className={classes.tableCell}>
                                        <Select
                                            value={withDefaultValueNumber(photogrammetry.lightsourceType, getInitialEntry(eVocabularySetID.eCaptureDataLightSourceType))}
                                            name='lightsourceType'
                                            onChange={setIdField}
                                            disableUnderline
                                            className={clsx(classes.select, classes.datasetFieldSelect)}
                                            SelectDisplayProps={{ style: { paddingLeft: '10px', borderRadius: '5px' } }}
                                        >
                                            {getEntries(eVocabularySetID.eCaptureDataLightSourceType).map(({ idVocabulary, Term }, index) => <MenuItem key={index} value={idVocabulary}>{Term}</MenuItem>)}
                                        </Select>
                                    </TableCell>
                                </TableRow>
                                <TableRow className={classes.tableRow}>
                                    <TableCell className={classes.tableCell}>
                                        <Typography className={classes.labelText}>Background Removal Method</Typography>
                                    </TableCell>
                                    <TableCell className={classes.tableCell}>
                                        <Select
                                            value={withDefaultValueNumber(photogrammetry.backgroundRemovalMethod, getInitialEntry(eVocabularySetID.eCaptureDataBackgroundRemovalMethod))}
                                            name='backgroundRemovalMethod'
                                            onChange={setIdField}
                                            disableUnderline
                                            className={clsx(classes.select, classes.datasetFieldSelect)}
                                            SelectDisplayProps={{ style: { paddingLeft: '10px', borderRadius: '5px' } }}
                                        >
                                            {getEntries(eVocabularySetID.eCaptureDataBackgroundRemovalMethod).map(({ idVocabulary, Term }, index) => <MenuItem key={index} value={idVocabulary}>{Term}</MenuItem>)}
                                        </Select>
                                    </TableCell>
                                </TableRow>
                                <TableRow className={classes.tableRow}>
                                    <TableCell className={classes.tableCell}>
                                        <Typography className={classes.labelText}>Cluster Type</Typography>
                                    </TableCell>
                                    <TableCell className={classes.tableCell}>
                                        <Select
                                            value={withDefaultValueNumber(photogrammetry.clusterType, getInitialEntry(eVocabularySetID.eCaptureDataClusterType))}
                                            name='clusterType'
                                            onChange={setIdField}
                                            disableUnderline
                                            className={clsx(classes.select, classes.datasetFieldSelect)}
                                            SelectDisplayProps={{ style: { paddingLeft: '10px', borderRadius: '5px' } }}
                                        >
                                            {getEntries(eVocabularySetID.eCaptureDataClusterType).map(({ idVocabulary, Term }, index) => <MenuItem key={index} value={idVocabulary}>{Term}</MenuItem>)}
                                        </Select>
                                    </TableCell>
                                </TableRow>
                                <TableRow className={classes.tableRow}>
                                    <TableCell className={classes.tableCell}>
                                        <Typography className={classes.labelText}>Cluster Geometry Field ID</Typography>
                                    </TableCell>
                                    <TableCell className={classes.tableCell}>
                                        <DebounceInput
                                            element='input'
                                            title='clusterGeometryFieldId-input'
                                            value={photogrammetry.clusterGeometryFieldId || ''}
                                            type='number'
                                            name='clusterGeometryFieldId'
                                            onChange={setIdField}
                                            className={clsx(classes.input, classes.datasetFieldInput)}
                                        />
                                    </TableCell>
                                </TableRow>
                                <TableRow className={classes.tableRow} style={{ height: '26px' }}>
                                    <TableCell className={classes.tableCell}>
                                        <Typography className={classes.labelText}>Camera Settings Uniform</Typography>
                                    </TableCell>
                                    <TableCell className={classes.tableCell}>
                                        <CustomCheckbox
                                            className={classes.checkbox}
                                            name='cameraSettingUniform'
                                            onChange={setCheckboxField}
                                            checked={withDefaultValueBoolean(photogrammetry.cameraSettingUniform ?? false, false)}
                                            title='cameraSettingsUniform-input'
                                            size='small'
                                        />
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            </Box>

            <ObjectSelectModal
                open={modalOpen}
                onSelectedObjects={onSelectedObjects}
                onModalClose={onModalClose}
                selectedObjects={objectRelationship === RelatedObjectType.Source ? photogrammetry.sourceObjects : photogrammetry.derivedObjects}
                relationship={objectRelationship}
                objectType={eSystemObjectType.eCaptureData}
            />
        </Box>
    );
}

const checkboxStyles = ({ palette }) => ({
    root: {
        color: palette.primary.main,
        '&$checked': {
            color: palette.primary.main
        },
        '&$disabled': {
            color: palette.primary.main
        }
    },
    checked: {},
    disabled: {}
});

const CustomCheckbox = withStyles(checkboxStyles)(Checkbox);

export default Photogrammetry;

export const errorFieldStyling = (isError: boolean): React.CSSProperties => {
    return isError ? { backgroundColor: '#e57373' } : {};
};