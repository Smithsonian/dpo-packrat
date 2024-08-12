/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * CaptureDataDetails
 *
 * This component renders details tab for CaptureData specific details used in DetailsTab component.
 */
import { Box, MenuItem, Select, Typography, Table, TableBody, TableCell, TableContainer, TableRow, Paper, Checkbox, Chip, Input } from '@material-ui/core';
import React, { useEffect } from 'react';
import { DateInputField, Loader } from '../../../../../components';
import { parseFoldersToState, StateFolder, useVocabularyStore } from '../../../../../store';
import { eVocabularySetID, eSystemObjectType } from '@dpo-packrat/common';
import { isFieldUpdated } from '../../../../../utils/repository';
import { withDefaultValueNumber } from '../../../../../utils/shared';
import AssetContents from '../../../../Ingestion/components/Metadata/Photogrammetry/AssetContents';
import { DetailComponentProps } from './index';
import { toast } from 'react-toastify';
import { useDetailTabStore } from '../../../../../store';
import { makeStyles, fade } from '@material-ui/core/styles';
import { DebounceInput } from 'react-debounce-input';
import { withDefaultValueBoolean } from '../../../../../utils/shared';
import clsx from 'clsx';
import { palette } from '../../../../../theme';
import { getNullableSelectEntries } from '../../../../../utils/controls';

export const useStyles = makeStyles(({ palette, typography, breakpoints }) => ({
    captureMethodTableContainer: {
        backgroundColor: palette.primary.light,
        padding: '4px 0px 10px 0px',
        width: 'fit-content',
        height: 'fit-content'
    },
    ingestContainer: {
        borderRadius: '0.5rem',
        border: `1px dashed ${palette.primary.main}`,
        overflow: 'hidden',
        backgroundColor: palette.primary.light,
        padding: 0,
        marginBottom: '1rem',
    },
    fieldTableContainer: {
        backgroundColor: 'rgb(255, 252, 209)',
        borderRadius: '5px',
        width: 'fit-content',
        height: 'fit-content',
        padding: '10px 0px 6px 0px'
    },
    fieldSizing: {
        width: '240px',
        padding: 0,
        boxSizing: 'border-box',
        textAlign: 'center'
    },
    fieldContainer: {
        borderRadius: '0.5rem',
        border: `1px dashed ${palette.primary.main}`,
        overflow: 'hidden',
        margin: '0.5rem',
        padding: '5px'
    },
    fieldLabel: {
        width: '11rem',
        textAlign: 'right'
    },
    table: {
    },
    tableRow: {
    },
    tableCell: {
        border: 'none',
        padding: '1px 10px'
    },
    lightLabelText: {
        color: palette.primary.dark,
        wordBreak: 'break-word',
        fontSize: '0.8rem'
    },
    labelText: {
        color: palette.primary.dark,
        fontSize: '0.8rem'
    },
    select: {
        height: 24,
        background: palette.background.paper,
        border: `1px solid ${fade(palette.primary.contrastText, 0.4)}`,
        borderRadius: 5,
        fontFamily: typography.fontFamily,
        fontSize: '0.8rem'
    },
    checkbox: {
        border: 'none !important',
        padding: '0px',
        height: '18px',
    },
    input: {
        height: 22,
        border: `1px solid ${fade(palette.primary.contrastText, 0.4)}`,
        fontFamily: typography.fontFamily,
        fontSize: '0.8rem',
        padding: '0px 10px',
        borderRadius: 5,
        background: palette.background.paper,
    },
    cdInputContainer: {
        display: 'flex',
        flexDirection: 'row',
        rowGap: '10px',
        columnGap: '10px',
        flexWrap: 'wrap',
        marginTop: '10px'
    },
    fieldTableBoxContainer: {
        width: 'fit-content',
        height: 'fit-content',
    },
    datasetTypeSelect: {
        [breakpoints.down('lg')]: {
            width: '240px'
        }
    },
    datasetFieldSelect: {
        width: '272px',
        [breakpoints.down('lg')]: {
            width: '212px'
        }
    },
    datasetFieldInput: {
        width: '250px',
        [breakpoints.down('lg')]: {
            width: '190px'
        }
    },
    valueText: {
        fontSize: '0.8rem',
        height: '24px',
        wordBreak: 'break-word'
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

function CaptureDataDetails(props: DetailComponentProps): React.ReactElement {
    const { data, loading, disabled, onUpdateDetail, objectType } = props;
    const classes = useStyles();
    const [CaptureDataDetails, updateDetailField] = useDetailTabStore(state => [state.CaptureDataDetails, state.updateDetailField]);

    const [getInitialEntry, getEntries] = useVocabularyStore(state => [state.getInitialEntry, state.getEntries]);

    useEffect(() => {
        onUpdateDetail(objectType, CaptureDataDetails);
    }, [CaptureDataDetails]);

    useEffect(() => {
        if (!data?.getDetailsTabDataForObject.CaptureData?.isValidData)
            toast.error('Invalid data detected', { autoClose: false });
    }, [data, loading]);

    if (!data || loading) {
        return <Loader minHeight='15vh' />;
    }

    const updateFolderVariant = (id, variantType) => {
        if (variantType === -1) variantType = null;
        const folders = [...CaptureDataDetails.folders];
        const folder = folders[id];
        folder.variantType = variantType;
        updateDetailField(eSystemObjectType.eCaptureData, 'folders', folders);
    };

    const onSetField = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        updateDetailField(eSystemObjectType.eCaptureData, name, value);
    };

    const setDateField = (name: string, value?: string | null): void => {
        if (value) {
            const date = new Date(value);
            updateDetailField(eSystemObjectType.eCaptureData, name, date);
        }
    };

    const setIdField = ({ target }): void => {
        const { name, value } = target;
        let idFieldValue: number | null = null;

        if (value) {
            idFieldValue = Number.parseInt(value, 10);
        }
        updateDetailField(eSystemObjectType.eCaptureData, name, idFieldValue);
    };

    const setDatasetUseField = (event) => {
        const  { value, name } = event.target;
        // make sure we got an array as value
        if(!Array.isArray(value))
            return console.error('did not receive array', value);

        // convert array into JSON array and feed to metadata update
        const arrayString = JSON.stringify(value);
        updateDetailField(eSystemObjectType.eCaptureData, name, arrayString);
    };

    const getSelectedIDsFromJSON = (value: string | undefined | null): number[] => {
        // used to extract array from JSON
        try {
            if(!value)
                throw new Error('[PACKRAT:ERROR] cannot get selected IDs. undefined value');

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

    const captureDataData = data.getDetailsTabDataForObject?.CaptureData;
    const cdMethods = getEntries(eVocabularySetID.eCaptureDataCaptureMethod);
    const captureMethodidVocabulary = withDefaultValueNumber(CaptureDataDetails?.captureMethod, getInitialEntry(eVocabularySetID.eCaptureDataCaptureMethod));
    const captureMethod = cdMethods.find(method => method.idVocabulary === captureMethodidVocabulary);

    const cdDetailsDate = new Date(CaptureDataDetails.dateCaptured as string);
    const cdDataDate = new Date(captureDataData?.dateCaptured as string);

    return (
        <Box>
            <Box className={classes.ingestContainer}>
                <TableContainer component={Paper} className={classes.captureMethodTableContainer} elevation={0} style={{ paddingTop: '10px', width: '100%' }}>
                    <Table className={classes.table}>
                        <TableBody>
                            <TableRow className={classes.tableRow}>
                                <TableCell className={clsx(classes.tableCell, classes.fieldLabel)}>
                                    <Typography className={classes.labelText}>Capture Method</Typography>
                                </TableCell>
                                <TableCell className={clsx(classes.tableCell, classes.valueText)}>
                                    <span style={{ paddingLeft: '10px' }}>
                                        {captureMethod?.Term || 'Unknown'}
                                    </span>
                                </TableCell>
                            </TableRow>

                            <TableRow className={classes.tableRow}>
                                <TableCell className={clsx(classes.tableCell, classes.fieldLabel)}>
                                    <Typography className={classes.labelText}>Dataset Type</Typography>
                                </TableCell>
                                <TableCell className={classes.tableCell}>
                                    <Select
                                        disabled={disabled}
                                        value={CaptureDataDetails?.datasetType}
                                        name='datasetType'
                                        onChange={setIdField}
                                        disableUnderline
                                        className={clsx(classes.select, classes.datasetTypeSelect)}
                                        style={{ ...updatedFieldStyling(isFieldUpdated(CaptureDataDetails, captureDataData, 'datasetType')) }}
                                        SelectDisplayProps={{ style: { paddingLeft: '10px', paddingRight: '10px', borderRadius: '5px' } }}
                                    >
                                        {getEntries(eVocabularySetID.eCaptureDataDatasetType).map(({ idVocabulary, Term }, index) => <MenuItem key={index} value={idVocabulary}>{Term}</MenuItem>)}
                                    </Select>
                                </TableCell>
                            </TableRow>

                            {   // TODO: explictly set to 6 (Photogrammetry Set). Check against enums/COMMON
                                CaptureDataDetails?.datasetType === 6 &&
                                <TableRow className={classes.tableRow}>
                                    <TableCell className={clsx(classes.tableCell, classes.fieldLabel)}>
                                        <Typography className={classes.labelText}>Dataset Use</Typography>
                                    </TableCell>
                                    <TableCell className={classes.tableCell}>
                                        <Select
                                            multiple
                                            value={getSelectedIDsFromJSON(CaptureDataDetails?.datasetUse)}
                                            name='datasetUse'
                                            onChange={setDatasetUseField}
                                            disableUnderline
                                            className={clsx(classes.select, classes.fieldSizing, classes.chipSelect)}
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

                            <TableRow className={classes.tableRow}>
                                <TableCell className={clsx(classes.tableCell, classes.fieldLabel)}>
                                    <Typography className={classes.labelText}>Dataset Field ID</Typography>
                                </TableCell>
                                <TableCell className={classes.tableCell}>
                                    <DebounceInput
                                        element='input'
                                        title='datasetFieldId-input'
                                        disabled={disabled}
                                        value={CaptureDataDetails.datasetFieldId || ''}
                                        type='number'
                                        name='datasetFieldId'
                                        onChange={setIdField}
                                        // className={clsx(classes.input, classes.fieldSizing)}
                                        className={clsx(classes.input, classes.datasetFieldInput)}
                                        style={{ ...updatedFieldStyling(isFieldUpdated(CaptureDataDetails, captureDataData, 'datasetFieldId')) }}
                                    />
                                </TableCell>
                            </TableRow>

                            <TableRow className={classes.tableRow}>
                                <TableCell className={clsx(classes.tableCell, classes.fieldLabel)}>
                                    <Typography className={classes.labelText}>Capture Notes</Typography>
                                </TableCell>
                                <TableCell className={clsx(classes.tableCell, classes.valueText)}>
                                    <DebounceInput
                                        id='description'
                                        element='textarea'
                                        name='description'
                                        value={CaptureDataDetails.description ?? ''}
                                        type='string'
                                        onChange={onSetField}
                                        disabled={disabled}
                                        className={clsx(classes.input, classes.fieldSizing)}
                                        updated={isFieldUpdated(CaptureDataDetails, captureDataData, 'description')}
                                        forceNotifyByEnter={false}
                                        debounceTimeout={400}
                                        style={{ width: '100%', minHeight: '4rem', textAlign: 'left', padding: '5px' }}
                                    />
                                </TableCell>
                            </TableRow>

                            <TableRow className={classes.tableRow}>
                                <TableCell className={clsx(classes.tableCell, classes.fieldLabel)}>
                                    <Typography className={classes.labelText}>Date Captured</Typography>
                                </TableCell>
                                <TableCell className={classes.tableCell}>
                                    <DateInputField
                                        updated={`${cdDataDate.getMonth()}/${cdDataDate.getDate()}/${cdDataDate.getFullYear()}` !== `${cdDetailsDate.getMonth()}/${cdDetailsDate.getDate()}/${cdDetailsDate.getFullYear()}`}
                                        value={new Date(CaptureDataDetails?.dateCaptured ?? Date.now())}
                                        disabled={disabled}
                                        onChange={(_, value) => setDateField('dateCaptured', value)}
                                        dateHeight='22px'
                                    />
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            <Box className={classes.ingestContainer}>
                <TableContainer className={classes.captureMethodTableContainer} style={{ paddingTop: '10px', width: '100%' }}>
                    <Table className={classes.table}>
                        <TableBody>
                            <TableRow className={classes.tableRow}>
                                <TableCell className={clsx(classes.tableCell, classes.fieldLabel)}>
                                    <Typography className={classes.labelText}>Item Position Type</Typography>
                                </TableCell>
                                <TableCell className={classes.tableCell}>
                                    <Select
                                        disabled={disabled}
                                        value={CaptureDataDetails?.itemPositionType ?? -1}
                                        name='itemPositionType'
                                        onChange={setIdField}
                                        disableUnderline
                                        className={clsx(classes.select, classes.datasetFieldSelect)}
                                        style={{ ...updatedFieldStyling(isFieldUpdated(CaptureDataDetails, captureDataData, 'itemPositionType')) }}
                                        SelectDisplayProps={{ style: { paddingLeft: '10px', paddingRight: '10px', borderRadius: '5px' } }}
                                    >
                                        {getNullableSelectEntries(getEntries(eVocabularySetID.eCaptureDataItemPositionType), 'idVocabulary', 'Term').map(({ value, label }, index) => <MenuItem key={index} value={value}>{label}</MenuItem>)}
                                    </Select>
                                </TableCell>
                            </TableRow>
                            <TableRow className={classes.tableRow}>
                                <TableCell className={clsx(classes.tableCell, classes.fieldLabel)}>
                                    <Typography className={classes.labelText}>Item Position Field ID</Typography>
                                </TableCell>
                                <TableCell className={classes.tableCell}>
                                    <DebounceInput
                                        element='input'
                                        title='itemPositionFieldId-input'
                                        disabled={disabled}
                                        value={CaptureDataDetails.itemPositionFieldId || ''}
                                        type='number'
                                        name='itemPositionFieldId'
                                        onChange={setIdField}
                                        className={clsx(classes.input, classes.datasetFieldInput)}
                                        style={{ ...updatedFieldStyling(isFieldUpdated(CaptureDataDetails, captureDataData, 'itemPositionFieldId')) }}
                                    />
                                </TableCell>
                            </TableRow>
                            <TableRow className={classes.tableRow}>
                                <TableCell className={clsx(classes.tableCell, classes.fieldLabel)}>
                                    <Typography className={classes.labelText}>Item Arrangement Field ID</Typography>
                                </TableCell>
                                <TableCell className={classes.tableCell}>
                                    <DebounceInput
                                        element='input'
                                        title='itemArrangementFieldId-input'
                                        disabled={disabled}
                                        value={CaptureDataDetails.itemArrangementFieldId || ''}
                                        type='number'
                                        name='itemArrangementFieldId'
                                        onChange={setIdField}
                                        className={clsx(classes.input, classes.datasetFieldInput)}
                                        style={{ ...updatedFieldStyling(isFieldUpdated(CaptureDataDetails, captureDataData, 'itemArrangementFieldId')) }}
                                    />
                                </TableCell>
                            </TableRow>

                            <TableRow className={classes.tableRow}>
                                {/* Spacer */}
                                <TableCell className={classes.tableCell}>
                                    <Typography className={classes.labelText} style={{ margin: '1rem' }}> </Typography>
                                </TableCell>
                            </TableRow>

                            <TableRow className={classes.tableRow}>
                                <TableCell className={clsx(classes.tableCell, classes.fieldLabel)}>
                                    <Typography className={classes.labelText}>Focus Type</Typography>
                                </TableCell>
                                <TableCell className={classes.tableCell}>
                                    <Select
                                        disabled={disabled}
                                        value={CaptureDataDetails?.focusType ?? -1}
                                        name='focusType'
                                        onChange={setIdField}
                                        disableUnderline
                                        className={clsx(classes.select, classes.datasetFieldSelect)}
                                        style={{ ...updatedFieldStyling(isFieldUpdated(CaptureDataDetails, captureDataData, 'focusType')) }}
                                        SelectDisplayProps={{ style: { paddingLeft: '10px', paddingRight: '10px', borderRadius: '5px' } }}
                                    >
                                        {getNullableSelectEntries(getEntries(eVocabularySetID.eCaptureDataFocusType), 'idVocabulary', 'Term').map(({ value, label }, index) => <MenuItem key={index} value={value}>{label}</MenuItem>)}
                                    </Select>
                                </TableCell>
                            </TableRow>
                            <TableRow className={classes.tableRow}>
                                <TableCell className={clsx(classes.tableCell, classes.fieldLabel)}>
                                    <Typography className={classes.labelText}>Light Source Type</Typography>
                                </TableCell>
                                <TableCell className={classes.tableCell}>
                                    <Select
                                        disabled={disabled}
                                        value={CaptureDataDetails?.lightsourceType ?? -1}
                                        name='lightsourceType'
                                        onChange={setIdField}
                                        disableUnderline
                                        className={clsx(classes.select, classes.datasetFieldSelect)}
                                        style={{ ...updatedFieldStyling(isFieldUpdated(CaptureDataDetails, captureDataData, 'lightsourceType')) }}
                                        SelectDisplayProps={{ style: { paddingLeft: '10px', paddingRight: '10px', borderRadius: '5px' } }}
                                    >
                                        {getNullableSelectEntries(getEntries(eVocabularySetID.eCaptureDataLightSourceType), 'idVocabulary', 'Term').map(({ value, label }, index) => <MenuItem key={index} value={value}>{label}</MenuItem>)}
                                    </Select>
                                </TableCell>
                            </TableRow>
                            <TableRow className={classes.tableRow}>
                                <TableCell className={clsx(classes.tableCell, classes.fieldLabel)}>
                                    <Typography className={classes.labelText}>Background Removal</Typography>
                                </TableCell>
                                <TableCell className={classes.tableCell}>
                                    <Select
                                        disabled={disabled}
                                        value={CaptureDataDetails?.backgroundRemovalMethod ?? -1}
                                        name='backgroundRemovalMethod'
                                        onChange={setIdField}
                                        disableUnderline
                                        className={clsx(classes.select, classes.datasetFieldSelect)}
                                        style={{ ...updatedFieldStyling(isFieldUpdated(CaptureDataDetails, captureDataData, 'backgroundRemovalMethod')) }}
                                        SelectDisplayProps={{ style: { paddingLeft: '10px', paddingRight: '10px', borderRadius: '5px' } }}
                                    >
                                        {getNullableSelectEntries(getEntries(eVocabularySetID.eCaptureDataBackgroundRemovalMethod), 'idVocabulary', 'Term').map(({ value, label }, index) => <MenuItem key={index} value={value}>{label}</MenuItem>)}
                                    </Select>
                                </TableCell>
                            </TableRow>

                            <TableRow className={classes.tableRow}>
                                {/* Spacer */}
                                <TableCell className={classes.tableCell}>
                                    <Typography className={classes.labelText} style={{ margin: '1rem' }}> </Typography>
                                </TableCell>
                            </TableRow>

                            <TableRow className={classes.tableRow}>
                                <TableCell className={clsx(classes.tableCell, classes.fieldLabel)}>
                                    <Typography className={classes.labelText}>Cluster Type</Typography>
                                </TableCell>
                                <TableCell className={classes.tableCell}>
                                    <Select
                                        disabled={disabled}
                                        value={CaptureDataDetails?.clusterType ?? -1}
                                        name='clusterType'
                                        onChange={setIdField}
                                        disableUnderline
                                        className={clsx(classes.select, classes.datasetFieldSelect)}
                                        style={{ ...updatedFieldStyling(isFieldUpdated(CaptureDataDetails, captureDataData, 'clusterType')) }}
                                        SelectDisplayProps={{ style: { paddingLeft: '10px', paddingRight: '10px', borderRadius: '5px' } }}
                                    >
                                        {getNullableSelectEntries(getEntries(eVocabularySetID.eCaptureDataClusterType), 'idVocabulary', 'Term').map(({ value, label }, index) => <MenuItem key={index} value={value}>{label}</MenuItem>)}
                                    </Select>
                                </TableCell>
                            </TableRow>
                            <TableRow className={classes.tableRow}>
                                <TableCell className={clsx(classes.tableCell, classes.fieldLabel)}>
                                    <Typography className={classes.labelText}>Cluster Geometry Field ID</Typography>
                                </TableCell>
                                <TableCell className={classes.tableCell}>
                                    <DebounceInput
                                        element='input'
                                        title='clusterGeometryFieldId-input'
                                        disabled={disabled}
                                        value={CaptureDataDetails.clusterGeometryFieldId || ''}
                                        type='number'
                                        name='clusterGeometryFieldId'
                                        onChange={setIdField}
                                        className={clsx(classes.input, classes.datasetFieldInput)}
                                        style={{ ...updatedFieldStyling(isFieldUpdated(CaptureDataDetails, captureDataData, 'clusterGeometryFieldId')) }}
                                    />
                                </TableCell>
                            </TableRow>
                            <TableRow className={classes.tableRow} style={{ height: '26px' }}>
                                <TableCell className={clsx(classes.tableCell, classes.fieldLabel)}>
                                    <Typography className={classes.labelText}>Camera Settings Uniform</Typography>
                                </TableCell>
                                <TableCell className={classes.tableCell} style={{ verticalAlign: 'middle' }}>
                                    <Checkbox
                                        className={classes.checkbox}
                                        disabled
                                        name='cameraSettingUniform'
                                        checked={withDefaultValueBoolean(CaptureDataDetails.cameraSettingUniform ?? false, false)}
                                        title='cameraSettingsUniform-input'
                                        size='small'
                                        style={{ ...updatedFieldStyling(isFieldUpdated(CaptureDataDetails, captureDataData, 'cameraSettingUniform')) }}
                                        color='primary'
                                    />
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            <Box className={classes.ingestContainer}>
                <AssetContents
                    viewMode
                    disabled={disabled}
                    folders={parseFoldersToState(CaptureDataDetails?.folders ?? [])}
                    options={getEntries(eVocabularySetID.eCaptureDataFileVariantType)}
                    onUpdate={updateFolderVariant}
                    originalFolders={data?.getDetailsTabDataForObject?.CaptureData?.folders as StateFolder[]}
                />
            </Box>
        </Box>
    );
}

export default CaptureDataDetails;


export const updatedFieldStyling = (isUpdated: boolean): React.CSSProperties => {
    return isUpdated ? { backgroundColor: palette.secondary.light, border: `1px solid ${fade(palette.secondary.main, 0.4)}` } : {};
};