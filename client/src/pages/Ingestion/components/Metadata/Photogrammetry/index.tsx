/* eslint-disable react-hooks/exhaustive-deps */
import { Box, Checkbox, CircularProgress, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { useContext, useEffect, useState } from 'react';
import { FieldType } from '../../../../../components';
import DateFnsUtils from '@date-io/date-fns';
import { MuiPickersUtilsProvider, KeyboardDatePicker } from '@material-ui/pickers';
import { Colors } from '../../../../../theme';
import { StateMetadata, defaultPhotogrammetryFields, MetadataFieldValue, PhotogrammetryFields, AppContext, StateIdentifier } from '../../../../../context';
import useMetadata from '../../../hooks/useMetadata';
import { eVocabularySetID } from '../../../../../types/server';
import { Vocabulary } from '../../../../../types/graphql';
import useVocabularyEntries from '../../../hooks/useVocabularyEntries';
import Description from './Description';
import IdentifierList from './IdentifierList';
import SelectField from './SelectField';
import IdInputField from './IdInputField';

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
        width: 230,
        background: palette.background.paper,
        border: `1px solid ${palette.primary.contrastText}`,
        padding: '1px 8px',
        color: Colors.defaults.white,
        borderRadius: 5,
        fontFamily: typography.fontFamily
    }
}));

interface PhotogrammetryProps {
    metadataIndex: number;
}

export type VocabularyOption = Pick<Vocabulary, 'idVocabulary' | 'Term'>;

const IdentifierType = ['ARK'];

function Photogrammetry(props: PhotogrammetryProps): React.ReactElement {
    const { metadataIndex } = props;
    const { ingestion: { metadatas } } = useContext(AppContext);
    const classes = useStyles();

    const metadata: StateMetadata = metadatas[metadataIndex];

    const { getFieldErrors, updatePhotogrammetryFields } = useMetadata();

    const [values, setValues] = useState<PhotogrammetryFields>(defaultPhotogrammetryFields);
    const [vocabularyEntries, setVocabularyEntries] = useState<Map<eVocabularySetID, VocabularyOption[]>>(new Map<eVocabularySetID, Vocabulary[]>());

    const { vocabularyEntryData, vocabularyEntryLoading, vocabularyEntryError } = useVocabularyEntries();

    useEffect(() => {
        if (vocabularyEntryData && !vocabularyEntryLoading && !vocabularyEntryError) {
            const { getVocabularyEntries } = vocabularyEntryData;
            const { VocabularyEntries } = getVocabularyEntries;
            const updatedVocabularyEntries = new Map<eVocabularySetID, VocabularyOption[]>();

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

    const getEntries = (eVocabularySetID: eVocabularySetID): VocabularyOption[] => {
        const vocabularyEntry = vocabularyEntries.get(eVocabularySetID);

        let selectOptions: VocabularyOption[] = [];

        if (vocabularyEntry) {
            selectOptions = vocabularyEntry;
        }

        return selectOptions;
    };

    const getInitialEntry = (eVocabularySetID: eVocabularySetID): number | null => {
        const vocabularyEntry = vocabularyEntries.get(eVocabularySetID);

        if (vocabularyEntry) {
            return vocabularyEntry[0]?.idVocabulary;
        }

        return null;
    };

    const addIdentifer = () => {
        const { identifiers } = values;
        const newIdentifier: StateIdentifier = {
            id: identifiers.length + 1,
            identifier: '',
            identifierType: IdentifierType[0], // FIXME: initial identifier ark type
            selected: false
        };

        setValues(values => ({ ...values, identifiers: [...values.identifiers, newIdentifier] }));
    };

    const removeIdentifier = (id: number) => {
        setValues(values => {
            const { identifiers } = values;
            const updatedIdentifiers = [...identifiers].filter(identifier => identifier.id !== id);

            return {
                ...values,
                identifiers: updatedIdentifiers
            };
        });
    };

    const updateIdentifierFields = (id: number, name: string, value: string | number | boolean) => {
        setValues(values => {
            const { identifiers } = values;
            const updatedIdentifiers = [...identifiers].filter(identifier => {
                if (identifier.id === id) {
                    identifier[name] = value;
                }
                return true;
            });

            return {
                ...values,
                identifiers: updatedIdentifiers
            };
        });
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
                    <Box marginBottom='10px'>
                        <FieldType required label='Asset Identifier(s)'>
                            <Box className={classes.assetIdentifier}>
                                <Checkbox
                                    name='systemCreated'
                                    checked
                                    color='primary'
                                />
                                <Typography className={classes.systemCreatedText} variant='body1'>System will create an identifier</Typography>
                            </Box>
                            <IdentifierList identifiers={values.identifiers} onAdd={addIdentifer} onRemove={removeIdentifier} onUpdate={updateIdentifierFields} />
                        </FieldType>
                    </Box>

                    <Description value={values.description} onChange={setField} />

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

                            <SelectField
                                required
                                label='Dataset Type'
                                value={values.datasetType || getInitialEntry(eVocabularySetID.eCaptureDataDatasetType)}
                                name='datasetType'
                                onChange={setIdField}
                                options={getEntries(eVocabularySetID.eCaptureDataDatasetType)}
                            />
                        </Box>
                        <Box className={classes.divider} />
                        <Box display='flex' flex={1} flexDirection='column'>
                            <IdInputField label='Dataset Field ID' value={values.datasetFieldId || 0} name='datasetFieldId' onChange={setIdField} />
                            <SelectField
                                label='Item Position Type'
                                value={values.itemPositionType || getInitialEntry(eVocabularySetID.eCaptureDataItemPositionType)}
                                name='itemPositionType'
                                onChange={setIdField}
                                options={getEntries(eVocabularySetID.eCaptureDataItemPositionType)}
                            />
                            <IdInputField label='Item Position Field ID' value={values.itemPositionFieldId || 0} name='itemPositionFieldId' onChange={setIdField} />
                            <IdInputField label='Item Arrangement Field ID' value={values.itemArrangementFieldId || 0} name='itemArrangementFieldId' onChange={setIdField} />
                            <SelectField
                                label='Focus Type'
                                value={values.focusType || getInitialEntry(eVocabularySetID.eCaptureDataFocusType)}
                                name='focusType'
                                onChange={setIdField}
                                options={getEntries(eVocabularySetID.eCaptureDataFocusType)}
                            />

                            <SelectField
                                label='Light Source Type'
                                value={values.lightsourceType || getInitialEntry(eVocabularySetID.eCaptureDataLightSourceType)}
                                name='lightsourceType'
                                onChange={setIdField}
                                options={getEntries(eVocabularySetID.eCaptureDataLightSourceType)}
                            />

                            <SelectField
                                label='Background Removal Method'
                                value={values.backgroundRemovalMethod || getInitialEntry(eVocabularySetID.eCaptureDataBackgroundRemovalMethod)}
                                name='backgroundRemovalMethod'
                                onChange={setIdField}
                                options={getEntries(eVocabularySetID.eCaptureDataBackgroundRemovalMethod)}
                            />

                            <SelectField
                                label='Cluster Type'
                                value={values.clusterType || getInitialEntry(eVocabularySetID.eCaptureDataClusterType)}
                                name='clusterType'
                                onChange={setIdField}
                                options={getEntries(eVocabularySetID.eCaptureDataClusterType)}
                            />

                            <IdInputField label='Cluster Geometry Field ID' value={values.clusterGeometryFieldId || 0} name='clusterGeometryFieldId' onChange={setIdField} />
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

export default Photogrammetry;