/* eslint-disable react-hooks/exhaustive-deps */
import { Box, Select, MenuItem, Checkbox, CircularProgress } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { useContext, useEffect, useState } from 'react';
import { FieldType } from '../../../../components';
import DateFnsUtils from '@date-io/date-fns';
import { MuiPickersUtilsProvider, KeyboardDatePicker } from '@material-ui/pickers';
import { Colors } from '../../../../theme';
import { StateMetadata, defaultPhotogrammetryFields, MetadataFieldValue, PhotogrammetryFields, AppContext } from '../../../../context';
import useMetadata from '../../hooks/useMetadata';
import { DebounceInput } from 'react-debounce-input';
import { eVocabularySetID } from '../../../../types/server';
import { GetVocabularyEntriesResult, Vocabulary } from '../../../../types/graphql';
import useVocabularyEntries from '../../hooks/useVocabularyEntries';

/**
 * TODO: CameraSettingUniform query?
 */
const useStyles = makeStyles(({ palette, typography }) => ({
    container: {
        marginTop: 20,
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
    description: {
        height: '10vh',
        width: '80%',
        padding: 10,
        resize: 'none',
        overflow: 'scroll',
        border: `1px solid ${palette.primary.contrastText}`,
        borderRadius: 5,
        fontFamily: typography.fontFamily
    },
    select: {
        minWidth: 240,
        padding: '0px 10px',
        background: palette.background.paper,
        border: `1px solid ${palette.primary.contrastText}`,
        borderRadius: 5,
        fontFamily: typography.fontFamily
    },
    input: {
        width: 220,
        outline: 'none',
        border: `1px solid ${palette.primary.contrastText}`,
        padding: '8px',
        borderRadius: 5,
        fontFamily: typography.fontFamily
    },
    date: {
        width: 260,
        background: palette.background.paper,
        border: `1px solid ${palette.primary.contrastText}`,
        padding: '1px 8px',
        color: Colors.defaults.white,
        borderRadius: 5,
        fontFamily: typography.fontFamily
    }
}));

interface PhotogrammetryMetadataProps {
    metadataIndex: number;
}

function PhotogrammetryMetadata(props: PhotogrammetryMetadataProps): React.ReactElement {
    const { metadataIndex } = props;
    const { ingestion: { metadatas } } = useContext(AppContext);
    const classes = useStyles();

    const metadata: StateMetadata = metadatas[metadataIndex];

    const { getFieldErrors, updatePhotogrammetryFields } = useMetadata();

    const [values, setValues] = useState<PhotogrammetryFields>(defaultPhotogrammetryFields);
    const [vocabularyEntries, setVocabularyEntries] = useState<Map<eVocabularySetID, Vocabulary[]>>(new Map<eVocabularySetID, Vocabulary[]>());

    const { vocabularyEntryData, vocabularyEntryLoading, vocabularyEntryError } = useVocabularyEntries();

    useEffect(() => {
        if (vocabularyEntryData && !vocabularyEntryLoading && !vocabularyEntryError) {
            const { getVocabularyEntries } = vocabularyEntryData;
            const { VocabularyEntries }: GetVocabularyEntriesResult = getVocabularyEntries;
            const updatedVocabularyEntries = new Map<eVocabularySetID, Vocabulary[]>();

            VocabularyEntries.forEach(({ eVocabSetID, Vocabulary }) => {
                updatedVocabularyEntries.set(eVocabSetID, Vocabulary);
            });

            setVocabularyEntries(updatedVocabularyEntries);
        }
    }, [vocabularyEntryData, vocabularyEntryLoading, vocabularyEntryError]);

    useEffect(() => {
        setValues(metadatas[metadataIndex].photogrammetry);
    }, [metadataIndex]);

    useEffect(() => {
        updatePhotogrammetryFields(metadataIndex, values);
    }, [values]);

    const errors = getFieldErrors(metadata);

    const setField = ({ target }): void => {
        const { name, value } = target;
        updateValues(name, value);
    };

    const setIdField = ({ target }): void => {
        const { name, value } = target;
        updateValues(name, Number.parseInt(value, 10));
    };

    const setDateField = (name: string, value: string | null | undefined): void => {
        if (value) {
            const date = new Date(value);
            updateValues(name, date);
        }
    };

    const setCheckboxField = ({ target }): void => {
        const { name, checked } = target;

        updateValues(name, checked);
    };

    const updateValues = (name: string, value: MetadataFieldValue) => setValues(values => ({ ...values, [name]: value }));

    const getEntries = (eVocabularySetID: eVocabularySetID): React.ReactElement | React.ReactElement[] => {
        const vocabularyEntry = vocabularyEntries.get(eVocabularySetID);

        let selectOptions: Vocabulary[] = [];

        if (vocabularyEntry) {
            selectOptions = vocabularyEntry;
        }

        return selectOptions.map(({ idVocabulary, Term }, index) => <MenuItem key={index} value={idVocabulary}>{Term}</MenuItem>);
    };

    const getInitialEntry = (eVocabularySetID: eVocabularySetID): number | null => {
        const vocabularyEntry = vocabularyEntries.get(eVocabularySetID);

        if (vocabularyEntry) {
            return vocabularyEntry[0]?.idVocabulary;
        }

        return null;
    };

    const rowFieldProps = { alignItems: 'center', justifyContent: 'space-between' };

    return (
        <Box className={classes.container}>
            {vocabularyEntryLoading ?
                <Box
                    display='flex'
                    flex={1}
                    alignItems='center'
                    justifyContent='center'
                    height='60vh'
                >
                    <CircularProgress color='primary' size={40} />
                </Box>
                : <>
                    <FieldType required label='Description' direction='row' containerProps={rowFieldProps}>
                        <DebounceInput
                            element='textarea'
                            className={classes.description}
                            name='description'
                            value={values.description}
                            onChange={setField}
                            forceNotifyByEnter={false}
                            debounceTimeout={400}
                        />
                    </FieldType>

                    <Box className={classes.fieldsContainer}>
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
                                        value={values.dateCaptured}
                                        className={classes.date}
                                        InputProps={{ disableUnderline: true }}
                                        onChange={(_, value) => setDateField('dateCaptured', value)}
                                    />
                                </MuiPickersUtilsProvider>
                            </FieldType>

                            <FieldType
                                required
                                label='Dataset Type'
                                direction='row'
                                containerProps={rowFieldProps}
                            >
                                <Select
                                    value={values.datasetType || getInitialEntry(eVocabularySetID.eCaptureDataDatasetType)}
                                    className={classes.select}
                                    name='datasetType'
                                    onChange={setField}
                                    disableUnderline
                                >
                                    {getEntries(eVocabularySetID.eCaptureDataDatasetType)}
                                </Select>
                            </FieldType>
                        </Box>
                        <Box className={classes.divider} />
                        <Box display='flex' flex={1} flexDirection='column'>
                            <FieldType required={false} label='Data Field ID' direction='row' containerProps={rowFieldProps}>
                                <DebounceInput
                                    element='input'
                                    value={values.datasetFieldId || 0}
                                    className={classes.input}
                                    type='number'
                                    name='datasetFieldId'
                                    onChange={setIdField}
                                    debounceTimeout={400}
                                />
                            </FieldType>
                            <FieldType required={false} label='Item Position Type' direction='row' containerProps={rowFieldProps}>
                                <Select
                                    value={values.itemPositionType || getInitialEntry(eVocabularySetID.eCaptureDataItemPositionType)}
                                    className={classes.select}
                                    name='itemPositionType'
                                    onChange={setField}
                                    disableUnderline
                                >
                                    {getEntries(eVocabularySetID.eCaptureDataItemPositionType)}
                                </Select>
                            </FieldType>
                            <FieldType required={false} label='Item Position Field ID' direction='row' containerProps={rowFieldProps}>
                                <DebounceInput
                                    element='input'
                                    value={values.itemPositionFieldId || 0}
                                    className={classes.input}
                                    type='number'
                                    name='itemPositionFieldId'
                                    onChange={setIdField}
                                    debounceTimeout={400}
                                />
                            </FieldType>
                            <FieldType required={false} label='Item Arrangement Field ID' direction='row' containerProps={rowFieldProps}>
                                <DebounceInput
                                    element='input'
                                    value={values.itemArrangementFieldId || 0}
                                    className={classes.input}
                                    type='number'
                                    name='itemArrangementFieldId'
                                    onChange={setIdField}
                                    debounceTimeout={400}
                                />
                            </FieldType>
                            <FieldType required={false} label='Focus Type' direction='row' containerProps={rowFieldProps}>
                                <Select
                                    value={values.focusType || getInitialEntry(eVocabularySetID.eCaptureDataFocusType)}
                                    className={classes.select}
                                    name='focusType'
                                    onChange={setField}
                                    disableUnderline
                                >
                                    {getEntries(eVocabularySetID.eCaptureDataFocusType)}
                                </Select>
                            </FieldType>
                            <FieldType required={false} label='Light Source Type' direction='row' containerProps={rowFieldProps}>
                                <Select
                                    value={values.lightsourceType || getInitialEntry(eVocabularySetID.eCaptureDataLightSourceType)}
                                    className={classes.select}
                                    name='lightsourceType'
                                    onChange={setField}
                                    disableUnderline
                                >
                                    {getEntries(eVocabularySetID.eCaptureDataLightSourceType)}
                                </Select>
                            </FieldType>
                            <FieldType required={false} label='Background Removal Method' direction='row' containerProps={rowFieldProps}>
                                <Select
                                    value={values.backgroundRemovalMethod || getInitialEntry(eVocabularySetID.eCaptureDataBackgroundRemovalMethod)}
                                    className={classes.select}
                                    name='backgroundRemovalMethod'
                                    onChange={setField}
                                    disableUnderline
                                >
                                    {getEntries(eVocabularySetID.eCaptureDataBackgroundRemovalMethod)}
                                </Select>
                            </FieldType>
                            <FieldType required={false} label='Cluster Type' direction='row' containerProps={rowFieldProps}>
                                <Select
                                    value={values.clusterType || getInitialEntry(eVocabularySetID.eCaptureDataClusterType)}
                                    className={classes.select}
                                    name='clusterType'
                                    onChange={setField}
                                    disableUnderline
                                >
                                    {getEntries(eVocabularySetID.eCaptureDataClusterType)}
                                </Select>
                            </FieldType>
                            <FieldType required={false} label='Cluster Geometry Field ID' direction='row' containerProps={rowFieldProps}>
                                <DebounceInput
                                    element='input'
                                    value={values.clusterGeometryFieldId || 0}
                                    className={classes.input}
                                    type='number'
                                    name='clusterGeometryFieldId'
                                    onChange={setIdField}
                                    debounceTimeout={400}
                                />
                            </FieldType>
                            <FieldType required={false} label='Camera Settings Uniform?' direction='row' containerProps={rowFieldProps}>
                                <Checkbox
                                    disabled
                                    name='cameraSettingUniform'
                                    checked={values.cameraSettingUniform}
                                    onChange={setCheckboxField}
                                    color='primary'
                                />
                            </FieldType>
                        </Box>
                    </Box>
                </>
            }
        </Box>
    );
}

export default PhotogrammetryMetadata;