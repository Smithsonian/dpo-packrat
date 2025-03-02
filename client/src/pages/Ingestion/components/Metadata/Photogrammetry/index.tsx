/* eslint-disable react/jsx-max-props-per-line */
/* eslint-disable react-hooks/exhaustive-deps */
/**
 * Metadata - Photogrammetry
 *
 * This component renders the metadata fields specific to photogrammetry asset.
 */
import { Box, Table, TableBody, TableCell, TableContainer, TableRow, Paper, Typography, Select, MenuItem, Checkbox, Chip, Input } from '@material-ui/core';
import { DebounceInput } from 'react-debounce-input';
import React, { useState, useEffect } from 'react';
import { AssetIdentifiers, DateInputField, TextArea } from '../../../../../components';
import { MetadataType, StateIdentifier, StateMetadata, useMetadataStore, useVocabularyStore, useRepositoryStore, useSubjectStore, StateRelatedObject } from '../../../../../store';
import { eVocabularySetID, eSystemObjectType } from '@dpo-packrat/common';
import { withDefaultValueNumber, withDefaultValueBoolean } from '../../../../../utils/shared';
import AssetContents from './AssetContents';
import RelatedObjectsList from '../Model/RelatedObjectsList';
import ObjectSelectModal from '../Model/ObjectSelectModal';
import { RelatedObjectType, useGetSubjectQuery } from '../../../../../types/graphql';
import clsx from 'clsx';
import { useStyles as useTableStyles } from '../../../../Repository/components/DetailsView/DetailsTab/CaptureDataDetails';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import { getNullableSelectEntries } from '../../../../../utils/controls';

interface PhotogrammetryProps {
    readonly metadataIndex: number;
    readonly ingestionLoading: boolean;
}

function Photogrammetry(props: PhotogrammetryProps): React.ReactElement {
    const { metadataIndex, ingestionLoading } = props;
    const tableClasses = useTableStyles();

    const useStyles = makeStyles(({ palette }) => ({
        container: {
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
        },
        content: {
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
            padding: 20,
            paddingBottom: 0
        },
        filesLabel: {
            color: palette.primary.dark,
            marginRight: 20,
            fontWeight: 'bold',
            fontSize: '1em',
        },
        fieldContainer: {
            borderRadius: '0.5rem',
            border: `1px dashed ${palette.primary.main}`,
            overflow: 'hidden',
            margin: '0.5rem',
            padding: 0
        },
        fieldSizing: {
            width: '240px',
            padding: 0,
            boxSizing: 'border-box',
            textAlign: 'center'
        },
        fileChip: {
            marginRight: 10
        },
        ingestContainer: {
            borderRadius: '0.5rem',
            border: `1px dashed ${palette.primary.main}`,
            // overflow: 'hidden',
            backgroundColor: palette.primary.light,
            padding: 0,
            marginBottom: '1rem',
        },
        splitView: {
            display: 'flex',
            flexWrap: 'wrap',
            flexDirection: 'row',
            justifyContent: 'space-between',
            overflow: 'hidden'
        },
        assetContents: {
            // marginLeft: '1rem',
            // borderLeft: '1px solid black'
        },
        modelDetailsAndSubtitleContainer: {
            padding: '10px',
            backgroundColor: palette.primary.light,
            // width: 'fit-content',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRadius: '0.5rem', // 5
            border: `1px dashed ${palette.primary.main}`,
        },
        modelDetailsContainer: {
            display: 'flex',
            flexDirection: 'row',
            borderRadius: 5,
            backgroundColor: palette.primary.light,
            width: '100%',
            columnGap: 10,
            rowGap: 10,
            flexWrap: 'wrap',
            justifyContent: 'center'
        },
        fieldLabel: {
            width: '7rem'
        },
        chips: {
            display: 'flex',
            flexWrap: 'wrap',
        },
        chip: {
            margin: 2,
            height: 'auto',
        },
        chipSelect: {
            width: 'auto',
            minWidth: '240px'
        }
    }));
    const classes = useStyles();

    const [getFieldErrors, updateMetadataField] = useMetadataStore(state => [state.getFieldErrors, state.updateMetadataField]);
    const metadata: StateMetadata = useMetadataStore(state => state.metadatas[metadataIndex]);
    const [getEntries, getInitialEntry] = useVocabularyStore(state => [state.getEntries, state.getInitialEntry, state.getVocabularyId]);
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

    const setDatasetUseField = (event) => {
        const  { value, name } = event.target;
        // make sure we got an array as value
        if(!Array.isArray(value))
            return console.error('did not receive array', value);

        // convert array into JSON array and feed to metadata update
        const arrayString = JSON.stringify(value);
        updateMetadataField(metadataIndex, name, arrayString, MetadataType.photogrammetry);
    };

    const onIdentifersChange = (identifiers: StateIdentifier[]): void => {
        updateMetadataField(metadataIndex, 'identifiers', identifiers, MetadataType.photogrammetry);
    };

    const updateFolderVariant = (folderId: number, variantType: number | null) => {
        const { folders } = photogrammetry;
        if (variantType === -1) variantType = null;
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

    const getSelectedIDsFromJSON = (value: string): number[] => {
        // used to extract array from JSON
        try {
            const data = JSON.parse(value);
            if(Array.isArray(data) === false)
                throw new Error(`[PACKRAT:ERROR] value is not an array. (${data})`);
            return data.sort();
        } catch(error) {
            console.log(`[PACKRAT:ERROR] invalid JSON stored in property. (${value})`);
        }

        console.log(`[PACKRAT:ERROR] cannot get selected IDs for Dataset Use. Unsupported value. (${value})`);
        return [];
    };

    // console.log('>>> Metadata Photogrammetry index.ts ', photogrammetry);
    // console.log('vocabulary id: ', getVocabularyID(eVocabularyID.eAssetAssetTypeCaptureDataSetPhotogrammetry));

    return (
        <Box className={classes.container}>
            {idAsset && (
                <Box mb={2}>
                    <TextArea
                        label='Update Notes'
                        value={photogrammetry.updateNotes}
                        name='updateNotes'
                        onChange={setNameField}
                        placeholder='Update notes...'
                        disabled={ingestionLoading}
                    />
                </Box>
            )}
            <Box className={ classes.ingestContainer } style={{ padding: '10px', paddingBottom: '0' }}>
                <AssetIdentifiers
                    systemCreated={photogrammetry.systemCreated}
                    identifiers={photogrammetry.identifiers}
                    onSystemCreatedChange={setCheckboxField}
                    onAddIdentifer={onIdentifersChange}
                    onUpdateIdentifer={onIdentifersChange}
                    onRemoveIdentifer={onIdentifersChange}
                    identifierName='Capture Data'
                    disabled={ingestionLoading}
                />
            </Box>
            {!idAsset && (
                <React.Fragment>
                    <Box className={ classes.ingestContainer } >
                        <RelatedObjectsList
                            type={RelatedObjectType.Source}
                            relatedObjects={photogrammetry.sourceObjects}
                            onAdd={openSourceObjectModal}
                            onRemove={onRemoveSourceObject}
                            relationshipLanguage='Parents'
                            disabled={ingestionLoading}
                        />
                    </Box>
                    <Box  className={ classes.ingestContainer } >
                        <RelatedObjectsList
                            type={RelatedObjectType.Derived}
                            relatedObjects={photogrammetry.derivedObjects}
                            onAdd={openDerivedObjectModal}
                            onRemove={onRemoveDerivedObject}
                            relationshipLanguage='Children'
                            disabled={ingestionLoading}
                        />
                    </Box>
                </React.Fragment>
            )}

            <Box  className={ classes.ingestContainer } style={{ padding: '10px' }}>
                <TableContainer component={Paper} className={tableClasses.captureMethodTableContainer}  elevation={0} style={{ paddingTop: '10px', width: '100%' }}>
                    <Table className={tableClasses.table}>
                        <TableBody>
                            <TableRow className={tableClasses.tableRow}>
                                <TableCell className={clsx(tableClasses.tableCell, classes.fieldLabel)}>
                                    <Typography className={tableClasses.labelText}>Dataset Type</Typography>
                                </TableCell>
                                <TableCell className={tableClasses.tableCell}>
                                    <Select
                                        value={withDefaultValueNumber(photogrammetry.datasetType, getInitialEntry(eVocabularySetID.eCaptureDataDatasetType))}
                                        name='datasetType'
                                        onChange={setIdField}
                                        disableUnderline
                                        className={clsx(tableClasses.select, classes.fieldSizing)}
                                        SelectDisplayProps={{ style: { paddingLeft: '10px', borderRadius: '5px' } }}
                                        disabled={ingestionLoading}
                                    >
                                        {getEntries(eVocabularySetID.eCaptureDataDatasetType).map(({ idVocabulary, Term }, index) => <MenuItem key={index} value={idVocabulary}>{Term}</MenuItem>)}
                                    </Select>
                                </TableCell>
                            </TableRow>

                            {   // TODO: explictly set to 6 (Photogrammetry Set). Check against enums/COMMON
                                photogrammetry.datasetType === 6 &&
                                <TableRow className={tableClasses.tableRow}>
                                    <TableCell className={clsx(tableClasses.tableCell, classes.fieldLabel)}>
                                        <Typography className={tableClasses.labelText}>Dataset Use*</Typography>
                                    </TableCell>
                                    <TableCell className={tableClasses.tableCell}>
                                        <Select
                                            multiple
                                            value={getSelectedIDsFromJSON(photogrammetry.datasetUse)}
                                            name='datasetUse'
                                            onChange={setDatasetUseField}
                                            disableUnderline
                                            className={clsx(tableClasses.select, classes.fieldSizing, classes.chipSelect)}
                                            input={<Input id='select-multiple-chip' />}
                                            renderValue={(selected) => {
                                                // get our entries and cycle through what's selected drawing as Chips,
                                                // and pulling the name from the entries.
                                                const entries = getEntries(eVocabularySetID.eCaptureDataDatasetUse);
                                                return (<div className={classes.chips}>
                                                    {(selected as number[]).map((value) => {
                                                        const entry = entries.find(entry => entry.idVocabulary === value);
                                                        return (<Chip key={value} label={entry ? entry.Term : value} className={classes.chip} />);
                                                    })}
                                                </div>);
                                            }}
                                            disabled={ingestionLoading}
                                        >
                                            { getEntries(eVocabularySetID.eCaptureDataDatasetUse)
                                                .map(({ idVocabulary, Term }, index) =>
                                                    <MenuItem key={index} value={idVocabulary}>
                                                        {Term}
                                                    </MenuItem>)}
                                        </Select>
                                    </TableCell>
                                </TableRow>
                            }

                            {/* <TableRow className={tableClasses.tableRow}>
                                <TableCell className={tableClasses.tableCell}>
                                    <Typography className={tableClasses.labelText}>Dataset Field ID</Typography>
                                </TableCell>
                                <TableCell className={tableClasses.tableCell}>
                                    <DebounceInput
                                        element='input'
                                        title='datasetFieldId-input'
                                        value={photogrammetry.datasetFieldId || ''}
                                        type='number'
                                        name='datasetFieldId'
                                        onChange={setIdField}
                                        className={clsx(tableClasses.input, classes.fieldSizing)}
                                        disabled={ingestionLoading}
                                    />
                                </TableCell>
                            </TableRow> */}

                            <TableRow className={tableClasses.tableRow}>
                                <TableCell className={tableClasses.tableCell}>
                                    <Typography className={tableClasses.labelText}>Name*</Typography>
                                </TableCell>
                                <TableCell className={clsx(tableClasses.tableCell, tableClasses.valueText)}>
                                    <DebounceInput
                                        element='input'
                                        title='itemPositionFieldId-input'
                                        value={photogrammetry.name}
                                        type='string'
                                        name='name'
                                        onChange={setNameField}
                                        className={clsx(tableClasses.input, classes.fieldSizing)}
                                        disabled={ingestionLoading}
                                    />
                                </TableCell>
                            </TableRow>

                            <TableRow className={tableClasses.tableRow}>
                                <TableCell className={tableClasses.tableCell}>
                                    <Typography className={tableClasses.labelText}>Capture Notes</Typography>
                                </TableCell>
                                <TableCell className={clsx(tableClasses.tableCell, tableClasses.valueText)}>
                                    <DebounceInput
                                        id='description'
                                        element='textarea'
                                        name='description'
                                        value={photogrammetry.description}
                                        type='string'
                                        onChange={setField}
                                        className={clsx(tableClasses.input, classes.fieldSizing)}
                                        forceNotifyByEnter={false}
                                        debounceTimeout={400}
                                        style={{ width: '100%', minHeight: '4rem', textAlign: 'left', padding: '5px' }}
                                        disabled={ingestionLoading}
                                    />
                                </TableCell>
                            </TableRow>

                            <TableRow className={tableClasses.tableRow} style={{ ...errorFieldStyling(errors.photogrammetry.dateCaptured) }}>
                                <TableCell className={tableClasses.tableCell}>
                                    <Typography className={tableClasses.labelText}>
                                        Date Captured*
                                    </Typography>
                                </TableCell>
                                <TableCell className={tableClasses.tableCell}>
                                    <DateInputField
                                        value={photogrammetry.dateCaptured}
                                        onChange={(_, value) => setDateField('dateCaptured', value)}
                                        dateHeight='22px'
                                        disabled={ingestionLoading}
                                    />
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            <Box className={clsx(classes.ingestContainer, classes.splitView)}>
                <TableContainer component={Paper} className={tableClasses.captureMethodTableContainer}  elevation={0} style={{ paddingTop: '10px', width: '30rem' }}>
                    <Table className={tableClasses.table}>
                        <TableBody>
                            <TableRow className={tableClasses.tableRow}>
                                <TableCell className={tableClasses.tableCell}>
                                    <Typography className={tableClasses.labelText}>Item Position Type</Typography>
                                </TableCell>
                                <TableCell className={tableClasses.tableCell}>
                                    <Select
                                        value={photogrammetry.itemPositionType ?? -1}
                                        name='itemPositionType'
                                        onChange={setIdField}
                                        disableUnderline
                                        className={clsx(tableClasses.select, classes.fieldSizing)}
                                        SelectDisplayProps={{ style: { paddingLeft: '10px', borderRadius: '5px' } }}
                                        disabled={ingestionLoading}
                                    >
                                        {getNullableSelectEntries(getEntries(eVocabularySetID.eCaptureDataItemPositionType), 'idVocabulary', 'Term').map(({ value, label }, index) => <MenuItem key={index} value={value}>{label}</MenuItem>)}
                                    </Select>
                                </TableCell>
                            </TableRow>
                            {/* <TableRow className={tableClasses.tableRow}>
                                <TableCell className={tableClasses.tableCell}>
                                    <Typography className={tableClasses.labelText}>Item Position Field ID</Typography>
                                </TableCell>
                                <TableCell className={tableClasses.tableCell}>
                                    <DebounceInput
                                        element='input'
                                        title='itemPositionFieldId-input'
                                        value={photogrammetry.itemPositionFieldId || ''}
                                        type='number'
                                        name='itemPositionFieldId'
                                        onChange={setIdField}
                                        className={clsx(tableClasses.input, classes.fieldSizing)}
                                        disabled={ingestionLoading}
                                    />
                                </TableCell>
                            </TableRow> */}
                            {/* <TableRow className={tableClasses.tableRow}>
                                <TableCell className={tableClasses.tableCell}>
                                    <Typography className={tableClasses.labelText}>Item Arrangement Field ID</Typography>
                                </TableCell>
                                <TableCell className={tableClasses.tableCell}>
                                    <DebounceInput
                                        element='input'
                                        title='itemArrangementFieldId-input'
                                        value={photogrammetry.itemArrangementFieldId || ''}
                                        type='number'
                                        name='itemArrangementFieldId'
                                        onChange={setIdField}
                                        className={clsx(tableClasses.input, classes.fieldSizing)}
                                        disabled={ingestionLoading}
                                    />
                                </TableCell>
                            </TableRow> */}
                            <TableRow className={tableClasses.tableRow}>
                                {/* Spacer */}
                                <TableCell className={tableClasses.tableCell}>
                                    <Typography className={tableClasses.labelText} style={{ margin: '1rem' }}> </Typography>
                                </TableCell>
                            </TableRow>
                            <TableRow className={tableClasses.tableRow}>
                                <TableCell className={tableClasses.tableCell}>
                                    <Typography className={tableClasses.labelText}>Focus Type</Typography>
                                </TableCell>
                                <TableCell className={tableClasses.tableCell}>
                                    <Select
                                        value={photogrammetry?.focusType ?? -1}
                                        name='focusType'
                                        onChange={setIdField}
                                        disableUnderline
                                        className={clsx(tableClasses.select, classes.fieldSizing)}
                                        SelectDisplayProps={{ style: { paddingLeft: '10px', borderRadius: '5px' } }}
                                        disabled={ingestionLoading}
                                    >
                                        {getNullableSelectEntries(getEntries(eVocabularySetID.eCaptureDataFocusType), 'idVocabulary', 'Term').map(({ value, label }, index) => <MenuItem key={index} value={value}>{label}</MenuItem>)}
                                    </Select>
                                </TableCell>
                            </TableRow>
                            <TableRow className={tableClasses.tableRow}>
                                <TableCell className={tableClasses.tableCell}>
                                    <Typography className={tableClasses.labelText}>Light Source Type</Typography>
                                </TableCell>
                                <TableCell className={tableClasses.tableCell}>
                                    <Select
                                        value={photogrammetry.lightsourceType ?? -1}
                                        name='lightsourceType'
                                        onChange={setIdField}
                                        disableUnderline
                                        className={clsx(tableClasses.select, classes.fieldSizing)}
                                        SelectDisplayProps={{ style: { paddingLeft: '10px', borderRadius: '5px' } }}
                                        disabled={ingestionLoading}
                                    >
                                        {getNullableSelectEntries(getEntries(eVocabularySetID.eCaptureDataLightSourceType), 'idVocabulary', 'Term').map(({ value, label }, index) => <MenuItem key={index} value={value}>{label}</MenuItem>)}
                                    </Select>
                                </TableCell>
                            </TableRow>
                            <TableRow className={tableClasses.tableRow}>
                                <TableCell className={tableClasses.tableCell}>
                                    <Typography className={tableClasses.labelText}>Background Removal Method</Typography>
                                </TableCell>
                                <TableCell className={tableClasses.tableCell}>
                                    <Select
                                        value={photogrammetry.backgroundRemovalMethod ?? -1}
                                        name='backgroundRemovalMethod'
                                        onChange={setIdField}
                                        disableUnderline
                                        className={clsx(tableClasses.select, classes.fieldSizing)}
                                        SelectDisplayProps={{ style: { paddingLeft: '10px', borderRadius: '5px' } }}
                                        disabled={ingestionLoading}
                                    >
                                        {getNullableSelectEntries(getEntries(eVocabularySetID.eCaptureDataBackgroundRemovalMethod), 'idVocabulary', 'Term').map(({ value, label }, index) => <MenuItem key={index} value={value}>{label}</MenuItem>)}
                                    </Select>
                                </TableCell>
                            </TableRow>
                            <TableRow className={tableClasses.tableRow}>
                                {/* Spacer */}
                                <TableCell className={tableClasses.tableCell}>
                                    <Typography className={tableClasses.labelText} style={{ margin: '1rem' }}> </Typography>
                                </TableCell>
                            </TableRow>
                            <TableRow className={tableClasses.tableRow}>
                                <TableCell className={tableClasses.tableCell}>
                                    <Typography className={tableClasses.labelText}>Cluster Type</Typography>
                                </TableCell>
                                <TableCell className={tableClasses.tableCell}>
                                    <Select
                                        value={photogrammetry.clusterType ?? -1}
                                        name='clusterType'
                                        onChange={setIdField}
                                        disableUnderline
                                        className={clsx(tableClasses.select, classes.fieldSizing)}
                                        SelectDisplayProps={{ style: { paddingLeft: '10px', borderRadius: '5px' } }}
                                        disabled={ingestionLoading}
                                    >
                                        {getNullableSelectEntries(getEntries(eVocabularySetID.eCaptureDataClusterType), 'idVocabulary', 'Term').map(({ value, label }, index) => <MenuItem key={index} value={value}>{label}</MenuItem>)}
                                    </Select>
                                </TableCell>
                            </TableRow>
                            {/* <TableRow className={tableClasses.tableRow}>
                                <TableCell className={tableClasses.tableCell}>
                                    <Typography className={tableClasses.labelText}>Cluster Geometry Field ID</Typography>
                                </TableCell>
                                <TableCell className={tableClasses.tableCell}>
                                    <DebounceInput
                                        element='input'
                                        title='clusterGeometryFieldId-input'
                                        value={photogrammetry.clusterGeometryFieldId || ''}
                                        type='number'
                                        name='clusterGeometryFieldId'
                                        onChange={setIdField}
                                        className={clsx(tableClasses.input, classes.fieldSizing)}
                                        disabled={ingestionLoading}
                                    />
                                </TableCell>
                            </TableRow> */}
                            <TableRow className={tableClasses.tableRow} style={{ height: '26px' }}>
                                <TableCell className={tableClasses.tableCell}>
                                    <Typography className={tableClasses.labelText}>Camera Settings Uniform</Typography>
                                </TableCell>
                                <TableCell className={tableClasses.tableCell}>
                                    <CustomCheckbox
                                        className={tableClasses.checkbox}
                                        disabled
                                        name='cameraSettingUniform'
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

            <Box className={clsx(classes.ingestContainer, classes.assetContents)}>
                <AssetContents
                    folders={photogrammetry.folders}
                    originalFolders={[...photogrammetry.folders]}
                    options={getEntries(eVocabularySetID.eCaptureDataFileVariantType)}
                    onUpdate={updateFolderVariant}
                    disabled={ingestionLoading}
                />
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