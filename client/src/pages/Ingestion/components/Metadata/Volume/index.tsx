/* eslint-disable react/jsx-max-props-per-line */
/* eslint-disable react-hooks/exhaustive-deps */
/**
 * Metadata - Volume
 *
 * Renders the metadata fields for volumetric capture data ingestion (CT, MRI,
 * Micro CT, etc.). On mount, fetches the JobVolumeInspect result for the
 * relevant asset version and pre-fills any fields the inspection was able to
 * derive (file count, slice count, dimensions, voxel sizes, voltage, scanner
 * make/model when present in sidecar / DICOM headers). The user confirms or
 * overrides; required fields must be filled before ingest can proceed.
 *
 * `fileCount` is read-only — it comes from inspection's actual ZIP central-
 * directory count. The server-side ingest path also re-validates this to catch
 * any UI bypass.
 *
 * Source / derived object linking mirrors the photogrammetry form: an
 * ObjectSelectModal browses the repository to pick CaptureData / Model / Scene
 * objects to wire as parents (sources) or children (derivatives) at ingest time.
 */
import { Box, MenuItem, Paper, Select, Table, TableBody, TableCell, TableContainer, TableRow, Typography } from '@material-ui/core';
import { DebounceInput } from 'react-debounce-input';
import React, { useEffect, useState } from 'react';
import { AssetIdentifiers, DateInputField } from '../../../../../components';
import { MetadataType, StateIdentifier, useMetadataStore, useRepositoryStore, useSubjectStore, useVocabularyStore } from '../../../../../store';
import { eVocabularySetID, eSystemObjectType } from '@dpo-packrat/common';
import RelatedObjectsList from '../Model/RelatedObjectsList';
import ObjectSelectModal from '../Model/ObjectSelectModal';
import { useStyles as useTableStyles } from '../../../../Repository/components/DetailsView/DetailsTab/CaptureDataDetails';
import { makeStyles } from '@material-ui/core/styles';
import API from '../../../../../api';
import { parseFileId } from '../../../../../store/utils';
import { RelatedObjectType, GetSubjectDocument } from '../../../../../types/graphql';
import { apolloClient } from '../../../../../graphql/index';
import { StateRelatedObject } from '../../../../../store';
import clsx from 'clsx';

interface VolumeProps {
    readonly metadataIndex: number;
    readonly ingestionLoading: boolean;
}

const useStyles = makeStyles(({ palette }) => ({
    container: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
    },
    ingestContainer: {
        borderRadius: '0.5rem',
        border: `1px dashed ${palette.primary.main}`,
        overflow: 'hidden',
        backgroundColor: palette.primary.light,
        padding: 0,
        marginBottom: '1rem',
    },
    fieldSizing: {
        width: '240px',
        padding: 0,
        boxSizing: 'border-box',
        textAlign: 'center'
    },
    fieldLabel: {
        width: '12rem'
    },
}));

function Volume(props: VolumeProps): React.ReactElement {
    const { metadataIndex, ingestionLoading } = props;
    const classes = useStyles();
    const tableClasses = useTableStyles();

    const [metadatas, updateMetadataField] = useMetadataStore(state => [state.metadatas, state.updateMetadataField]);
    const getEntries = useVocabularyStore(state => state.getEntries);
    const [subjects] = useSubjectStore(state => [state.subjects]);
    const [setDefaultIngestionFilters, closeRepositoryBrowser, resetRepositoryBrowserRoot] = useRepositoryStore(state => [state.setDefaultIngestionFilters, state.closeRepositoryBrowser, state.resetRepositoryBrowserRoot]);
    const [modalOpen, setModalOpen] = useState(false);
    const [objectRelationship, setObjectRelationship] = useState<RelatedObjectType>(RelatedObjectType.Source);

    const metadata = metadatas[metadataIndex];
    const volume = metadata.volume;
    const { idAsset } = metadata.file;

    useEffect(() => {
        if (idAsset)
            updateMetadataField(metadataIndex, 'idAsset', idAsset, MetadataType.volume);
    }, [metadataIndex, idAsset, updateMetadataField]);

    // Pre-fill from inspection on mount. Empty fields stay empty so the user
    // can see what was extracted vs what was not; required-field validation
    // enforces critical values before submit.
    useEffect(() => {
        const idAssetVersion = parseFileId(metadata.file.id);
        if (!idAssetVersion) return;

        async function loadAutofill(): Promise<void> {
            const result = await API.getVolumetricInspectionResults(idAssetVersion);
            if (!result.success || !result.data) return;

            const m = result.data;
            if (m.fileCount !== undefined && volume.fileCount === null)
                updateMetadataField(metadataIndex, 'fileCount', m.fileCount, MetadataType.volume);
            if (m.sliceCount !== undefined && volume.sliceCount === null)
                updateMetadataField(metadataIndex, 'sliceCount', m.sliceCount, MetadataType.volume);
            if (m.dimensionsX !== undefined && volume.dimensionsX === null)
                updateMetadataField(metadataIndex, 'dimensionsX', m.dimensionsX, MetadataType.volume);
            if (m.dimensionsY !== undefined && volume.dimensionsY === null)
                updateMetadataField(metadataIndex, 'dimensionsY', m.dimensionsY, MetadataType.volume);
            if (m.dimensionsZ !== undefined && volume.dimensionsZ === null)
                updateMetadataField(metadataIndex, 'dimensionsZ', m.dimensionsZ, MetadataType.volume);
            if (m.bitDepth !== undefined && volume.bitDepth === null)
                updateMetadataField(metadataIndex, 'bitDepth', m.bitDepth, MetadataType.volume);
            if (m.voxelSizeX !== undefined && volume.voxelSizeX === null)
                updateMetadataField(metadataIndex, 'voxelSizeX', m.voxelSizeX, MetadataType.volume);
            if (m.voxelSizeY !== undefined && volume.voxelSizeY === null)
                updateMetadataField(metadataIndex, 'voxelSizeY', m.voxelSizeY, MetadataType.volume);
            if (m.voxelSizeZ !== undefined && volume.voxelSizeZ === null)
                updateMetadataField(metadataIndex, 'voxelSizeZ', m.voxelSizeZ, MetadataType.volume);
            if (m.voltageKV !== undefined && volume.voltageKV === null)
                updateMetadataField(metadataIndex, 'voltageKV', m.voltageKV, MetadataType.volume);
            if (m.amperageUA !== undefined && volume.amperageUA === null)
                updateMetadataField(metadataIndex, 'amperageUA', m.amperageUA, MetadataType.volume);
            if (m.scannerMakeModel !== undefined && volume.scannerMakeModel === '')
                updateMetadataField(metadataIndex, 'scannerMakeModel', m.scannerMakeModel, MetadataType.volume);

            if (m.voxelSizeUnit && volume.voxelSizeUnit === null) {
                const unitEntries = getEntries(eVocabularySetID.eCaptureDataVolumeVoxelSizeUnit);
                const match = unitEntries.find(e => e.Term === m.voxelSizeUnit);
                if (match) updateMetadataField(metadataIndex, 'voxelSizeUnit', match.idVocabulary, MetadataType.volume);
            }
            if (m.contentType && volume.contentType === null) {
                const ctEntries = getEntries(eVocabularySetID.eCaptureDataVolumeContentType);
                const targetTerm = m.contentType === 'TIFF_STACK' ? 'TIFF Stack' : m.contentType === 'DICOM' ? 'DICOM' : 'Other';
                const match = ctEntries.find(e => e.Term === targetTerm);
                if (match) updateMetadataField(metadataIndex, 'contentType', match.idVocabulary, MetadataType.volume);
            }
        }

        loadAutofill();
    }, [metadataIndex, metadata.file.id]);

    const getSubjectIdSystemObjects = async (): Promise<number[]> => {
        const validSubjects = subjects.filter((subject) => subject.id > 0);
        const idSystemObjects: number[] = [];
        for (const subject of validSubjects) {
            const { data } = await apolloClient.query({
                query: GetSubjectDocument,
                variables: { input: { idSubject: subject.id } }
            });
            const idSO = data?.getSubject?.Subject?.SystemObject?.idSystemObject;
            if (idSO) idSystemObjects.push(idSO);
        }
        return idSystemObjects;
    };

    const setField = ({ target }: React.ChangeEvent<HTMLInputElement>): void => {
        updateMetadataField(metadataIndex, target.name, target.value, MetadataType.volume);
    };
    const setNumberField = ({ target }: React.ChangeEvent<HTMLInputElement>): void => {
        const raw = target.value;
        const parsed = raw === '' ? null : Number(raw);
        updateMetadataField(metadataIndex, target.name, parsed, MetadataType.volume);
    };
    const setIdField = (event: React.ChangeEvent<{ name?: string; value: unknown }>): void => {
        const { name, value } = event.target;
        const idValue = value ? Number(value) : null;
        if (name) updateMetadataField(metadataIndex, name, idValue, MetadataType.volume);
    };
    const setDateField = (_date: unknown, value?: string | null): void => {
        if (value) updateMetadataField(metadataIndex, 'dateCaptured', new Date(value), MetadataType.volume);
    };
    const onIdentifersChange = (identifiers: StateIdentifier[]): void => {
        updateMetadataField(metadataIndex, 'identifiers', identifiers, MetadataType.volume);
    };
    const onSystemCreatedChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        updateMetadataField(metadataIndex, 'systemCreated', e.target.checked, MetadataType.volume);
    };

    const openSourceObjectModal = async (): Promise<void> => {
        const idRoots = await getSubjectIdSystemObjects();
        await setDefaultIngestionFilters(eSystemObjectType.eCaptureData, idRoots);
        setObjectRelationship(RelatedObjectType.Source);
        setModalOpen(true);
    };
    const openDerivedObjectModal = async (): Promise<void> => {
        const idRoots = await getSubjectIdSystemObjects();
        await setDefaultIngestionFilters(eSystemObjectType.eCaptureData, idRoots);
        setObjectRelationship(RelatedObjectType.Derived);
        setModalOpen(true);
    };
    const onRemoveSourceObject = (idSystemObject: number): void => {
        updateMetadataField(
            metadataIndex,
            'sourceObjects',
            volume.sourceObjects.filter(o => o.idSystemObject !== idSystemObject),
            MetadataType.volume
        );
    };
    const onRemoveDerivedObject = (idSystemObject: number): void => {
        updateMetadataField(
            metadataIndex,
            'derivedObjects',
            volume.derivedObjects.filter(o => o.idSystemObject !== idSystemObject),
            MetadataType.volume
        );
    };
    const onModalClose = (): void => {
        setModalOpen(false);
        setObjectRelationship(RelatedObjectType.Source);
        closeRepositoryBrowser();
        resetRepositoryBrowserRoot();
    };
    const onSelectedObjects = (selected: StateRelatedObject[]): void => {
        const fieldName = objectRelationship === RelatedObjectType.Source ? 'sourceObjects' : 'derivedObjects';
        updateMetadataField(metadataIndex, fieldName, selected, MetadataType.volume);
        onModalClose();
    };

    const renderSelectRow = (name: keyof typeof volume, vocabSet: eVocabularySetID, label: string, required: boolean): JSX.Element => (
        <TableRow className={tableClasses.tableRow}>
            <TableCell className={clsx(tableClasses.tableCell, classes.fieldLabel)}>
                <Typography className={tableClasses.labelText}>{label}{required && '*'}</Typography>
            </TableCell>
            <TableCell className={tableClasses.tableCell}>
                <Select
                    value={volume[name] ?? ''}
                    name={name as string}
                    onChange={setIdField as any /* eslint-disable-line @typescript-eslint/no-explicit-any */}
                    disabled={ingestionLoading}
                    disableUnderline
                    className={clsx(tableClasses.select, classes.fieldSizing)}
                    SelectDisplayProps={{ style: { paddingLeft: '10px', borderRadius: '5px' } }}
                >
                    {!required && <MenuItem value=''><em>—</em></MenuItem>}
                    {getEntries(vocabSet).map(({ idVocabulary, Term }, i) => (
                        <MenuItem key={i} value={idVocabulary}>{Term}</MenuItem>
                    ))}
                </Select>
            </TableCell>
        </TableRow>
    );

    const renderNumberRow = (name: keyof typeof volume, label: string, required: boolean, readOnly: boolean = false, step?: string): JSX.Element => (
        <TableRow className={tableClasses.tableRow}>
            <TableCell className={clsx(tableClasses.tableCell, classes.fieldLabel)}>
                <Typography className={tableClasses.labelText}>{label}{required && '*'}{readOnly && ' (from inspection)'}</Typography>
            </TableCell>
            <TableCell className={clsx(tableClasses.tableCell, tableClasses.valueText)}>
                <DebounceInput
                    element='input'
                    type='number'
                    name={name as string}
                    value={volume[name] === null ? '' : (volume[name] as number)}
                    onChange={setNumberField}
                    debounceTimeout={400}
                    disabled={ingestionLoading || readOnly}
                    className={clsx(tableClasses.input, classes.fieldSizing)}
                    {...(step ? { step } : {})}
                />
            </TableCell>
        </TableRow>
    );

    const renderTextRow = (name: keyof typeof volume, label: string, required: boolean = false): JSX.Element => (
        <TableRow className={tableClasses.tableRow}>
            <TableCell className={clsx(tableClasses.tableCell, classes.fieldLabel)}>
                <Typography className={tableClasses.labelText}>{label}{required && '*'}</Typography>
            </TableCell>
            <TableCell className={clsx(tableClasses.tableCell, tableClasses.valueText)}>
                <DebounceInput
                    element='input'
                    type='string'
                    name={name as string}
                    value={(volume[name] as string) ?? ''}
                    onChange={setField}
                    debounceTimeout={400}
                    disabled={ingestionLoading}
                    className={clsx(tableClasses.input, classes.fieldSizing)}
                />
            </TableCell>
        </TableRow>
    );

    return (
        <Box className={classes.container}>
            <Box className={classes.ingestContainer} style={{ padding: '10px', paddingBottom: '0' }}>
                <AssetIdentifiers
                    systemCreated={volume.systemCreated}
                    identifiers={volume.identifiers}
                    onSystemCreatedChange={onSystemCreatedChange}
                    onAddIdentifer={onIdentifersChange}
                    onUpdateIdentifer={onIdentifersChange}
                    onRemoveIdentifer={onIdentifersChange}
                    identifierName='Capture Data'
                    disabled={ingestionLoading}
                />
            </Box>

            {!idAsset && (
                <React.Fragment>
                    <Box className={classes.ingestContainer}>
                        <RelatedObjectsList
                            type={RelatedObjectType.Source}
                            relatedObjects={volume.sourceObjects}
                            onAdd={openSourceObjectModal}
                            onRemove={onRemoveSourceObject}
                            relationshipLanguage='Parents'
                            disabled={ingestionLoading}
                        />
                    </Box>
                    <Box className={classes.ingestContainer}>
                        <RelatedObjectsList
                            type={RelatedObjectType.Derived}
                            relatedObjects={volume.derivedObjects}
                            onAdd={openDerivedObjectModal}
                            onRemove={onRemoveDerivedObject}
                            relationshipLanguage='Children'
                            disabled={ingestionLoading}
                        />
                    </Box>
                </React.Fragment>
            )}

            <Box className={classes.ingestContainer} style={{ padding: '10px' }}>
                <TableContainer component={Paper} className={tableClasses.captureMethodTableContainer} elevation={0} style={{ paddingTop: '10px', width: '100%' }}>
                    <Table className={tableClasses.table}>
                        <TableBody>
                            {renderTextRow('name', 'Name', true)}
                            <TableRow className={tableClasses.tableRow}>
                                <TableCell className={clsx(tableClasses.tableCell, classes.fieldLabel)}>
                                    <Typography className={tableClasses.labelText}>Date Captured*</Typography>
                                </TableCell>
                                <TableCell className={tableClasses.tableCell}>
                                    <DateInputField
                                        value={volume.dateCaptured}
                                        onChange={setDateField}
                                        dateHeight='22px'
                                        disabled={ingestionLoading}
                                    />
                                </TableCell>
                            </TableRow>
                            <TableRow className={tableClasses.tableRow}>
                                <TableCell className={clsx(tableClasses.tableCell, classes.fieldLabel)}>
                                    <Typography className={tableClasses.labelText}>Description</Typography>
                                </TableCell>
                                <TableCell className={clsx(tableClasses.tableCell, tableClasses.valueText)}>
                                    <DebounceInput
                                        id='description'
                                        element='textarea'
                                        name='description'
                                        value={volume.description}
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

                            {renderSelectRow('modality', eVocabularySetID.eCaptureDataVolumeModality, 'Modality', true)}
                            {renderSelectRow('scanType', eVocabularySetID.eCaptureDataVolumeScanType, 'Scan Type', true)}
                            {renderSelectRow('contentType', eVocabularySetID.eCaptureDataVolumeContentType, 'Content Type', true)}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            <Box className={classes.ingestContainer} style={{ padding: '10px' }}>
                <TableContainer component={Paper} className={tableClasses.captureMethodTableContainer} elevation={0} style={{ paddingTop: '10px', width: '100%' }}>
                    <Table className={tableClasses.table}>
                        <TableBody>
                            {renderTextRow('scannerMakeModel', 'Scanner Make/Model')}
                            {renderNumberRow('voltageKV', 'Voltage (kV)', false, false, 'any')}
                            {renderNumberRow('amperageUA', 'Amperage (µA)', false, false, 'any')}
                            {renderTextRow('specimenPreparation', 'Specimen Preparation')}
                            {renderSelectRow('filterLocation', eVocabularySetID.eCaptureDataVolumeFilterLocation, 'Filter Location', false)}

                            {renderNumberRow('voxelSizeX', 'Voxel Size X', true, false, 'any')}
                            {renderNumberRow('voxelSizeY', 'Voxel Size Y', true, false, 'any')}
                            {renderNumberRow('voxelSizeZ', 'Voxel Size Z', true, false, 'any')}
                            {renderSelectRow('voxelSizeUnit', eVocabularySetID.eCaptureDataVolumeVoxelSizeUnit, 'Voxel Size Unit', true)}

                            {renderNumberRow('dimensionsX', 'Dimensions X', false)}
                            {renderNumberRow('dimensionsY', 'Dimensions Y', false)}
                            {renderNumberRow('dimensionsZ', 'Dimensions Z', false)}
                            {renderNumberRow('bitDepth', 'Bit Depth', false)}

                            {renderNumberRow('fileCount', 'File Count', true, true)}
                            {renderNumberRow('sliceCount', 'Slice Count', false, true)}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            <ObjectSelectModal
                open={modalOpen}
                onSelectedObjects={onSelectedObjects}
                onModalClose={onModalClose}
                selectedObjects={objectRelationship === RelatedObjectType.Source ? volume.sourceObjects : volume.derivedObjects}
                relationship={objectRelationship}
                objectType={eSystemObjectType.eCaptureData}
            />
        </Box>
    );
}

export default Volume;
