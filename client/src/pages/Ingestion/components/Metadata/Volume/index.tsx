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
import { Box, MenuItem, Paper, Select, Table, TableBody, TableCell, TableContainer, TableRow, Tooltip, Typography } from '@material-ui/core';
import { DebounceInput } from 'react-debounce-input';
import React, { useEffect, useRef, useState } from 'react';
import { AssetIdentifiers, DateInputField } from '../../../../../components';
import { MetadataType, StateIdentifier, useMetadataStore, useRepositoryStore, useSubjectStore, useVocabularyStore } from '../../../../../store';
import { eVocabularySetID, eSystemObjectType } from '@dpo-packrat/common';
import RelatedObjectsList from '../Model/RelatedObjectsList';
import ObjectSelectModal from '../Model/ObjectSelectModal';
import { useStyles as useTableStyles } from '../../../../Repository/components/DetailsView/DetailsTab/CaptureDataDetails';
import { makeStyles } from '@material-ui/core/styles';
import API from '../../../../../api';
import WarningRoundedIcon from '@material-ui/icons/WarningRounded';
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

// Maps an inspection warning to the metadata field it concerns, so it can be shown as an icon
// next to that field. Warnings that match no rule are shown in a general indicator above the
// fields. Add a rule here to bind a new warning kind to its field.
const WARNING_FIELD_RULES: { field: string; test: RegExp }[] = [
    { field: 'sliceCount', test: /^Slice count mismatch/i },
];

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
    // Inspection warnings surfaced inline: those bound to a field (via WARNING_FIELD_RULES) show as
    // an icon next to it; the rest show in a general indicator above the fields.
    const [fieldWarnings, setFieldWarnings] = useState<Record<string, string>>({});
    const [generalWarnings, setGeneralWarnings] = useState<string[]>([]);

    const metadata = metadatas[metadataIndex];
    const volume = metadata.volume;
    const { idAsset } = metadata.file;

    useEffect(() => {
        if (idAsset)
            updateMetadataField(metadataIndex, 'idAsset', idAsset, MetadataType.volume);
    }, [metadataIndex, idAsset, updateMetadataField]);

    // Pre-fill from inspection, re-derived once per uploaded asset version. When
    // the user uploads a corrected ZIP (a new version), the new inspection's
    // values overwrite the previous ones — mirroring how a model/scene update
    // re-derives metadata from the new bytes. The ref guards re-runs so user
    // edits made within a single version are preserved. Fields the inspection
    // could not derive are left as-is for the user to complete.
    const lastAutofillVersion = useRef<number | null>(null);
    useEffect(() => {
        const idAssetVersion = parseFileId(metadata.file.id);
        if (!idAssetVersion || lastAutofillVersion.current === idAssetVersion) return;

        async function loadAutofill(): Promise<void> {
            const result = await API.getVolumetricInspectionResults(idAssetVersion);
            if (!result.success || !result.data) return;
            lastAutofillVersion.current = idAssetVersion;       // applied once per version

            const m = result.data;

            // Categorize inspection warnings for inline display: field-bound warnings become an
            // icon next to their field, the rest become a general indicator above the fields.
            const nextFieldWarnings: Record<string, string> = {};
            const nextGeneralWarnings: string[] = [];
            if (Array.isArray(m.warnings)) {
                for (const w of m.warnings as string[]) {
                    const rule = WARNING_FIELD_RULES.find(r => r.test.test(w));
                    if (rule)
                        nextFieldWarnings[rule.field] = nextFieldWarnings[rule.field] ? `${nextFieldWarnings[rule.field]}\n\n${w}` : w;
                    else
                        nextGeneralWarnings.push(w);
                }
            }
            setFieldWarnings(nextFieldWarnings);
            setGeneralWarnings(nextGeneralWarnings);

            if (m.fileCount !== undefined) updateMetadataField(metadataIndex, 'fileCount', m.fileCount, MetadataType.volume);
            if (m.sliceCount !== undefined) updateMetadataField(metadataIndex, 'sliceCount', m.sliceCount, MetadataType.volume);
            if (m.dimensionsX !== undefined) updateMetadataField(metadataIndex, 'dimensionsX', m.dimensionsX, MetadataType.volume);
            if (m.dimensionsY !== undefined) updateMetadataField(metadataIndex, 'dimensionsY', m.dimensionsY, MetadataType.volume);
            const dimensionsZResolved = m.dimensionsZ ?? m.sliceCount;   // mirrors ingest: falls back to slice count when depth absent from headers
            if (dimensionsZResolved !== undefined) updateMetadataField(metadataIndex, 'dimensionsZ', dimensionsZResolved, MetadataType.volume);
            if (m.bitDepth !== undefined) updateMetadataField(metadataIndex, 'bitDepth', m.bitDepth, MetadataType.volume);
            if (m.voxelSizeX !== undefined) updateMetadataField(metadataIndex, 'voxelSizeX', m.voxelSizeX, MetadataType.volume);
            if (m.voxelSizeY !== undefined) updateMetadataField(metadataIndex, 'voxelSizeY', m.voxelSizeY, MetadataType.volume);
            if (m.voxelSizeZ !== undefined) updateMetadataField(metadataIndex, 'voxelSizeZ', m.voxelSizeZ, MetadataType.volume);
            if (m.voltageKV !== undefined) updateMetadataField(metadataIndex, 'voltageKV', m.voltageKV, MetadataType.volume);
            if (m.amperageUA !== undefined) updateMetadataField(metadataIndex, 'amperageUA', m.amperageUA, MetadataType.volume);
            if (m.scannerMakeModel !== undefined) updateMetadataField(metadataIndex, 'scannerMakeModel', m.scannerMakeModel, MetadataType.volume);

            if (m.voxelSizeUnit) {
                const unitEntries = getEntries(eVocabularySetID.eCaptureDataVolumeVoxelSizeUnit);
                const match = unitEntries.find(e => e.Term === m.voxelSizeUnit);
                if (match) updateMetadataField(metadataIndex, 'voxelSizeUnit', match.idVocabulary, MetadataType.volume);
            }
            if (m.contentType) {
                const ctEntries = getEntries(eVocabularySetID.eCaptureDataVolumeContentType);
                const targetTerm = m.contentType === 'IMAGE_STACK' ? 'Image Stack' : m.contentType === 'DICOM' ? 'DICOM' : 'Other';
                const match = ctEntries.find(e => e.Term === targetTerm);
                if (match) updateMetadataField(metadataIndex, 'contentType', match.idVocabulary, MetadataType.volume);
            }
            if (m.modality) {
                // DICOM Modality (0008,0060) is a coarse 2–4 char code. Map to the
                // closest Packrat vocabulary term. "CT" defaults to "Micro CT"
                // because that's the most common use case at SI; user can change.
                const modalityEntries = getEntries(eVocabularySetID.eCaptureDataVolumeModality);
                const code: string = m.modality.toUpperCase();
                const targetTerm: string | null =
                        code === 'CT' ? 'Micro CT' :
                            code === 'MR' ? 'MRI' :
                                null;
                if (targetTerm) {
                    const match = modalityEntries.find(e => e.Term === targetTerm);
                    if (match) updateMetadataField(metadataIndex, 'modality', match.idVocabulary, MetadataType.volume);
                }
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
        // Stain Substance only applies to a Stained preparation; clear it when the
        // preparation is anything else so a hidden value is not ingested.
        if (name === 'specimenPreparation') {
            const term = getEntries(eVocabularySetID.eCaptureDataVolumeSpecimenPreparation).find(e => e.idVocabulary === idValue)?.Term;
            if (term !== 'Stained')
                updateMetadataField(metadataIndex, 'stainSubstance', null, MetadataType.volume);
        }
        // Filter Material only applies when a filter is present; clear it when the
        // filter location is None or unset so a hidden value is not ingested.
        if (name === 'filterLocation') {
            const term = getEntries(eVocabularySetID.eCaptureDataVolumeFilterLocation).find(e => e.idVocabulary === idValue)?.Term;
            if (!term || term === 'None')
                updateMetadataField(metadataIndex, 'filterMaterial', null, MetadataType.volume);
        }
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

    const renderSelectRow = (name: keyof typeof volume, vocabSet: eVocabularySetID, label: string, required: boolean, tooltip?: string): JSX.Element => {
        const labelNode = (
            <Typography className={tableClasses.labelText}>{label}{required && '*'}</Typography>
        );
        return (
            <TableRow className={tableClasses.tableRow}>
                <TableCell className={clsx(tableClasses.tableCell, classes.fieldLabel)}>
                    {tooltip ? <Tooltip title={tooltip} arrow placement='top-start'>{labelNode}</Tooltip> : labelNode}
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
                        {!required && !getEntries(vocabSet).some(e => e.Term === 'None') && <MenuItem value=''><em>—</em></MenuItem>}
                        {getEntries(vocabSet).map(({ idVocabulary, Term }, i) => (
                            <MenuItem key={i} value={idVocabulary}>{Term}</MenuItem>
                        ))}
                    </Select>
                </TableCell>
            </TableRow>
        );
    };

    const renderNumberRow = (name: keyof typeof volume, label: string, required: boolean, readOnly: boolean = false, step?: string, warning?: string, tooltip?: string): JSX.Element => {
        const labelNode = <Typography className={tableClasses.labelText}>{label}{required && '*'}</Typography>;
        return (
            <TableRow className={tableClasses.tableRow}>
                <TableCell className={clsx(tableClasses.tableCell, classes.fieldLabel)}>
                    <Box display='flex' alignItems='center'>
                        {tooltip ? <Tooltip title={tooltip} arrow placement='top-start'>{labelNode}</Tooltip> : labelNode}
                        {warning &&
                        <Tooltip title={<span style={{ whiteSpace: 'pre-line' }}>{warning}</span>} arrow placement='top-start'>
                            <WarningRoundedIcon style={{ fontSize: 18, color: '#b58105', marginLeft: 4, cursor: 'default' }} />
                        </Tooltip>}
                    </Box>
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
                        style={readOnly ? { backgroundColor: '#e8e8e8', color: '#555' } : undefined}
                        {...(step ? { step } : {})}
                    />
                </TableCell>
            </TableRow>
        );
    };

    const renderTextRow = (name: keyof typeof volume, label: string, required: boolean = false, tooltip?: string): JSX.Element => {
        const labelNode = <Typography className={tableClasses.labelText}>{label}{required && '*'}</Typography>;
        return (
            <TableRow className={tableClasses.tableRow}>
                <TableCell className={clsx(tableClasses.tableCell, classes.fieldLabel)}>
                    {tooltip ? <Tooltip title={tooltip} arrow placement='top-start'>{labelNode}</Tooltip> : labelNode}
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
    };

    const specimenPrepEntries = getEntries(eVocabularySetID.eCaptureDataVolumeSpecimenPreparation);
    const isStained: boolean = specimenPrepEntries.find(e => e.idVocabulary === volume.specimenPreparation)?.Term === 'Stained';
    const filterLocationTerm: string | undefined = getEntries(eVocabularySetID.eCaptureDataVolumeFilterLocation).find(e => e.idVocabulary === volume.filterLocation)?.Term;
    const showFilterMaterial: boolean = !!filterLocationTerm && filterLocationTerm !== 'None';
    const modalityTerm: string | undefined = getEntries(eVocabularySetID.eCaptureDataVolumeModality).find(e => e.idVocabulary === volume.modality)?.Term;
    const xrayModality: boolean = !!modalityTerm && ['Medical CT', 'Micro CT', 'Nano CT', 'Synchrotron'].includes(modalityTerm);

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

                            {renderSelectRow('modality', eVocabularySetID.eCaptureDataVolumeModality, 'Modality', true, 'The scanning technology used (e.g., Micro CT, Medical CT, Nano CT, Synchrotron, MRI).')}
                            {renderSelectRow('scanType', eVocabularySetID.eCaptureDataVolumeScanType, 'Scan Type', true, 'Whether the archive holds raw projection images or a reconstructed volume.')}
                            {renderSelectRow('contentType', eVocabularySetID.eCaptureDataVolumeContentType, 'Content Type', true, 'Archive data format — DICOM series or image stack. Detected during inspection.')}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            <Box className={classes.ingestContainer} style={{ padding: '10px' }}>
                <TableContainer component={Paper} className={tableClasses.captureMethodTableContainer} elevation={0} style={{ paddingTop: '10px', width: '100%' }}>
                    <Table className={tableClasses.table}>
                        <TableBody>
                            {generalWarnings.length > 0 &&
                                <TableRow className={tableClasses.tableRow}>
                                    <TableCell className={tableClasses.tableCell} colSpan={2}>
                                        <Box display='flex' alignItems='center'>
                                            <WarningRoundedIcon style={{ fontSize: 18, color: '#b58105', marginRight: 6 }} />
                                            <Tooltip title={<span style={{ whiteSpace: 'pre-line' }}>{generalWarnings.join('\n\n')}</span>} arrow placement='top-start'>
                                                <Typography variant='caption' style={{ color: '#b58105', cursor: 'default' }}>Inspection warnings — hover for details</Typography>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                </TableRow>}
                            {renderTextRow('scannerMakeModel', 'Scanner Make/Model', false, 'Manufacturer and model of the scanner used for the capture.')}
                            {renderNumberRow('voltageKV', 'Voltage (kV)', xrayModality, false, 'any', undefined, 'X-ray tube voltage, in kilovolts. Required for X-ray modalities.')}
                            {renderNumberRow('amperageUA', 'Amperage (µA)', xrayModality, false, 'any', undefined, 'X-ray tube current, in microamps. Required for X-ray modalities.')}
                            {renderSelectRow('specimenPreparation', eVocabularySetID.eCaptureDataVolumeSpecimenPreparation, 'Specimen Preparation', false, 'Use the Description field above to enter additional details (stain, concentration, fixative, embedding medium, etc.).')}
                            {isStained && renderSelectRow('stainSubstance', eVocabularySetID.eCaptureDataVolumeStainSubstance, 'Stain Substance', false, 'Iodine-based: Lugol\'s iodine (I₂KI / IKI), alcoholic iodine (I₂E, I₂M). Heteropolyacid: phosphotungstic acid (PTA), phosphomolybdic acid (PMA). Osmium-based: osmium tetroxide (OsO₄).')}
                            {renderSelectRow('filterLocation', eVocabularySetID.eCaptureDataVolumeFilterLocation, 'Filter Location', false, 'Where the beam filter sits in the beam path (source side, detector side, both, or collimator).')}
                            {showFilterMaterial && renderSelectRow('filterMaterial', eVocabularySetID.eCaptureDataVolumeFilterMaterial, 'Filter Material', false, 'Material of the beam filter (e.g., Zinc, Iron, or a combination).')}

                            {renderNumberRow('voxelSizeX', 'Voxel Size X', true, false, 'any', undefined, 'Physical size of one voxel along the X axis, in the selected unit.')}
                            {renderNumberRow('voxelSizeY', 'Voxel Size Y', true, false, 'any', undefined, 'Physical size of one voxel along the Y axis, in the selected unit.')}
                            {renderNumberRow('voxelSizeZ', 'Voxel Size Z', true, false, 'any', undefined, 'Physical size of one voxel along the Z axis (slice pitch), in the selected unit.')}
                            {renderSelectRow('voxelSizeUnit', eVocabularySetID.eCaptureDataVolumeVoxelSizeUnit, 'Voxel Size Unit', true, 'Unit for the voxel size values (micrometer, millimeter, or nanometer).')}

                            {renderNumberRow('dimensionsX', 'Dimensions X', false, false, undefined, undefined, 'Number of voxels along the X axis.')}
                            {renderNumberRow('dimensionsY', 'Dimensions Y', false, false, undefined, undefined, 'Number of voxels along the Y axis.')}
                            {renderNumberRow('dimensionsZ', 'Dimensions Z', false, true, undefined, undefined, 'Number of voxels along the Z axis (number of slices). Derived from inspection and not editable.')}
                            {renderNumberRow('bitDepth', 'Bit Depth', false, false, undefined, undefined, 'Bits stored per voxel (e.g., 8 or 16).')}

                            {renderNumberRow('fileCount', 'File Count', true, true, undefined, undefined, 'Number of files in the archive. Derived from inspection and not editable.')}
                            {renderNumberRow('sliceCount', 'Slice Count', false, true, undefined, fieldWarnings['sliceCount'], 'Number of image slices in the volume. Derived from inspection and not editable.')}
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
