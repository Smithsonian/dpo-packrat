/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * CaptureDataDetails
 *
 * This component renders details tab for CaptureData specific details used in DetailsTab component.
 */
import { Box, MenuItem, Select, Typography, Table, TableBody, TableCell, TableContainer, TableRow, Paper, Checkbox } from '@material-ui/core';
import React, { useEffect } from 'react';
import { DateInputField, Loader } from '../../../../../components';
import { parseFoldersToState, useVocabularyStore } from '../../../../../store';
import { eVocabularySetID, eSystemObjectType } from '@dpo-packrat/common';
import { isFieldUpdated } from '../../../../../utils/repository';
import { withDefaultValueNumber } from '../../../../../utils/shared';
import AssetContents from '../../../../Ingestion/components/Metadata/Photogrammetry/AssetContents';
import Description from '../../../../Ingestion/components/Metadata/Photogrammetry/Description';
import { DetailComponentProps } from './index';
import { toast } from 'react-toastify';
import { useDetailTabStore } from '../../../../../store';
import { makeStyles, fade } from '@material-ui/core/styles';
import { DebounceInput } from 'react-debounce-input';
import { withDefaultValueBoolean } from '../../../../../utils/shared';
import clsx from 'clsx';
import { palette } from '../../../../../theme';

export const useStyles = makeStyles(({ palette, typography, breakpoints }) => ({
    captureMethodTableContainer: {
        backgroundColor: palette.primary.light,
        padding: '4px 0px 10px 0px',
        width: 'fit-content',
        height: 'fit-content'
    },
    fieldTableContainer: {
        backgroundColor: 'rgb(255, 252, 209)',
        borderRadius: '5px',
        width: 'fit-content',
        height: 'fit-content',
        padding: '10px 0px 6px 0px'
    },
    table: {
        width: 'fit-content'
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
        color: 'auto',
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
        if (!data?.getDetailsTabDataForObject.CaptureData?.isValidData) toast.error('Invalid data detected', { autoClose: false });
    }, [data, loading]);

    if (!data || loading) {
        return <Loader minHeight='15vh' />;
    }

    const updateFolderVariant = (id, variantType) => {
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

    const setCheckboxField = ({ target }): void => {
        const { name, checked } = target;
        updateDetailField(eSystemObjectType.eCaptureData, name, checked);
    };

    const captureDataData = data.getDetailsTabDataForObject?.CaptureData;
    const cdMethods = getEntries(eVocabularySetID.eCaptureDataCaptureMethod);
    const captureMethodidVocabulary = withDefaultValueNumber(CaptureDataDetails?.captureMethod, getInitialEntry(eVocabularySetID.eCaptureDataCaptureMethod));
    const captureMethod = cdMethods.find(method => method.idVocabulary === captureMethodidVocabulary);

    return (
        <Box>
            <Description
                viewMode
                value={CaptureDataDetails.description ?? ''}
                onChange={onSetField}
                updated={isFieldUpdated(CaptureDataDetails, captureDataData, 'description')}
                disabled={disabled}
                containerProps={{ style: { paddingTop: '5px', paddingBottom: '5px' } }}
            />
            <Box className={classes.cdInputContainer}>
                <TableContainer component={Paper} className={classes.captureMethodTableContainer} elevation={0}>
                    <Table className={classes.table}>
                        <TableBody>
                            <TableRow className={classes.tableRow}>
                                <TableCell className={classes.tableCell}>
                                    <Typography className={classes.labelText}>Capture Method</Typography>
                                </TableCell>
                                <TableCell className={clsx(classes.tableCell, classes.valueText)}>
                                    <span style={{ paddingLeft: '10px' }}>
                                        {captureMethod?.Term || 'Unknown'}
                                    </span>
                                </TableCell>
                            </TableRow>
                            <TableRow className={classes.tableRow}>
                                <TableCell className={classes.tableCell}>
                                    <Typography className={classes.labelText}>
                                        Date Captured
                                    </Typography>
                                </TableCell>
                                <TableCell className={classes.tableCell}>
                                    <DateInputField
                                        updated={isFieldUpdated(CaptureDataDetails, captureDataData, 'dateCaptured')}
                                        value={new Date(CaptureDataDetails?.dateCaptured ?? Date.now())}
                                        disabled={disabled}
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
                                        disabled={disabled}
                                        value={withDefaultValueNumber(CaptureDataDetails?.datasetType, getInitialEntry(eVocabularySetID.eCaptureDataDatasetType))}
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
                        </TableBody>
                    </Table>
                </TableContainer>

                <AssetContents
                    viewMode
                    disabled={disabled}
                    initialEntry={getInitialEntry(eVocabularySetID.eCaptureDataFileVariantType)}
                    folders={parseFoldersToState(CaptureDataDetails?.folders ?? [])}
                    options={getEntries(eVocabularySetID.eCaptureDataFileVariantType)}
                    onUpdate={updateFolderVariant}
                />

                <Box className={classes.fieldTableBoxContainer}>
                    <TableContainer className={classes.fieldTableContainer}>
                        <Table className={classes.table}>
                            <TableRow className={classes.tableRow}>
                                <TableCell className={classes.tableCell}>
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
                                        className={clsx(classes.input, classes.datasetFieldInput)}
                                        style={{ ...updatedFieldStyling(isFieldUpdated(CaptureDataDetails, captureDataData, 'datasetFieldId')) }}
                                    />
                                </TableCell>
                            </TableRow>
                            <TableRow className={classes.tableRow}>
                                <TableCell className={classes.tableCell}>
                                    <Typography className={classes.labelText}>Item Position Type</Typography>
                                </TableCell>
                                <TableCell className={classes.tableCell}>
                                    <Select
                                        disabled={disabled}
                                        value={withDefaultValueNumber(CaptureDataDetails.itemPositionType, getInitialEntry(eVocabularySetID.eCaptureDataItemPositionType))}
                                        name='itemPositionType'
                                        onChange={setIdField}
                                        disableUnderline
                                        className={clsx(classes.select, classes.datasetFieldSelect)}
                                        style={{ ...updatedFieldStyling(isFieldUpdated(CaptureDataDetails, captureDataData, 'itemPositionType')) }}
                                        SelectDisplayProps={{ style: { paddingLeft: '10px', paddingRight: '10px', borderRadius: '5px' } }}
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
                                <TableCell className={classes.tableCell}>
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
                                <TableCell className={classes.tableCell}>
                                    <Typography className={classes.labelText}>Focus Type</Typography>
                                </TableCell>
                                <TableCell className={classes.tableCell}>
                                    <Select
                                        disabled={disabled}
                                        value={withDefaultValueNumber(CaptureDataDetails.focusType, getInitialEntry(eVocabularySetID.eCaptureDataFocusType))}
                                        name='focusType'
                                        onChange={setIdField}
                                        disableUnderline
                                        className={clsx(classes.select, classes.datasetFieldSelect)}
                                        style={{ ...updatedFieldStyling(isFieldUpdated(CaptureDataDetails, captureDataData, 'focusType')) }}
                                        SelectDisplayProps={{ style: { paddingLeft: '10px', paddingRight: '10px', borderRadius: '5px' } }}
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
                                        disabled={disabled}
                                        value={withDefaultValueNumber(CaptureDataDetails.lightsourceType, getInitialEntry(eVocabularySetID.eCaptureDataLightSourceType))}
                                        name='lightsourceType'
                                        onChange={setIdField}
                                        disableUnderline
                                        className={clsx(classes.select, classes.datasetFieldSelect)}
                                        style={{ ...updatedFieldStyling(isFieldUpdated(CaptureDataDetails, captureDataData, 'lightsourceType')) }}
                                        SelectDisplayProps={{ style: { paddingLeft: '10px', paddingRight: '10px', borderRadius: '5px' } }}
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
                                        disabled={disabled}
                                        value={withDefaultValueNumber(CaptureDataDetails.backgroundRemovalMethod, getInitialEntry(eVocabularySetID.eCaptureDataBackgroundRemovalMethod))}
                                        name='backgroundRemovalMethod'
                                        onChange={setIdField}
                                        disableUnderline
                                        className={clsx(classes.select, classes.datasetFieldSelect)}
                                        style={{ ...updatedFieldStyling(isFieldUpdated(CaptureDataDetails, captureDataData, 'backgroundRemovalMethod')) }}
                                        SelectDisplayProps={{ style: { paddingLeft: '10px', paddingRight: '10px', borderRadius: '5px' } }}
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
                                        disabled={disabled}
                                        value={withDefaultValueNumber(CaptureDataDetails.clusterType, getInitialEntry(eVocabularySetID.eCaptureDataClusterType))}
                                        name='clusterType'
                                        onChange={setIdField}
                                        disableUnderline
                                        className={clsx(classes.select, classes.datasetFieldSelect)}
                                        style={{ ...updatedFieldStyling(isFieldUpdated(CaptureDataDetails, captureDataData, 'clusterType')) }}
                                        SelectDisplayProps={{ style: { paddingLeft: '10px', paddingRight: '10px', borderRadius: '5px' } }}
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
                                <TableCell className={classes.tableCell}>
                                    <Typography className={classes.labelText}>Camera Settings Uniform</Typography>
                                </TableCell>
                                <TableCell className={classes.tableCell} style={{ verticalAlign: 'middle' }}>
                                    <Checkbox
                                        className={classes.checkbox}
                                        name='cameraSettingUniform'
                                        onChange={setCheckboxField}
                                        checked={withDefaultValueBoolean(CaptureDataDetails.cameraSettingUniform ?? false, false)}
                                        title='cameraSettingsUniform-input'
                                        disabled={disabled}
                                        size='small'
                                        style={{ ...updatedFieldStyling(isFieldUpdated(CaptureDataDetails, captureDataData, 'cameraSettingUniform')) }}
                                        color='primary'
                                    />
                                </TableCell>
                            </TableRow>
                        </Table>
                    </TableContainer>
                </Box>
            </Box>
        </Box>
    );
}

export default CaptureDataDetails;


export const updatedFieldStyling = (isUpdated: boolean): React.CSSProperties => {
    return isUpdated ? { backgroundColor: palette.secondary.light, border: `1px solid ${fade(palette.secondary.main, 0.4)}` } : {};
};