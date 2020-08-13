/* eslint-disable react-hooks/exhaustive-deps */
import { Box, Select, MenuItem, Checkbox } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { useContext, useEffect, useState } from 'react';
import { FieldType } from '../../../../components';
import DateFnsUtils from '@date-io/date-fns';
import { MuiPickersUtilsProvider, KeyboardDatePicker } from '@material-ui/pickers';
import { Colors } from '../../../../theme';
import { StateMetadata, defaultPhotogrammetryFields, MetadataFieldValue, PhotogrammetryFields, AppContext } from '../../../../context';
import { PhotogrammetrySelectOptions } from '../../../../context';
import useMetadata from '../../hooks/useMetadata';
import { DebounceInput } from 'react-debounce-input';

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
    const { DatasetType, ItemPositionType, FocusType, LightsourceType, BackgroundRemovalMethod, ClusterType } = PhotogrammetrySelectOptions;

    const metadata: StateMetadata = metadatas[metadataIndex];

    const { getFieldErrors, updatePhotogrammetryFields } = useMetadata();

    const [values, setValues] = useState<PhotogrammetryFields>(defaultPhotogrammetryFields);

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

    const rowFieldProps = { alignItems: 'center', justifyContent: 'space-between' };

    return (
        <Box className={classes.container}>
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
                            value={values.datasetType}
                            className={classes.select}
                            name='datasetType'
                            onChange={setField}
                            disableUnderline
                        >
                            {DatasetType.map((type, index) => <MenuItem key={index} value={type}>{type}</MenuItem>)}
                        </Select>
                    </FieldType>
                </Box>
                <Box className={classes.divider} />
                <Box display='flex' flex={1} flexDirection='column'>
                    <FieldType required={false} label='Data Field ID' direction='row' containerProps={rowFieldProps}>
                        <DebounceInput
                            element='input'
                            value={values.datasetFieldId}
                            className={classes.input}
                            type='number'
                            name='datasetFieldId'
                            onChange={setField}
                            debounceTimeout={400}
                        />
                    </FieldType>
                    <FieldType required={false} label='Item Position Type' direction='row' containerProps={rowFieldProps}>
                        <Select
                            value={values.itemPositionType}
                            className={classes.select}
                            name='itemPositionType'
                            onChange={setField}
                            disableUnderline
                        >
                            {ItemPositionType.map((type, index) => <MenuItem key={index} value={type}>{type}</MenuItem>)}
                        </Select>
                    </FieldType>
                    <FieldType required={false} label='Item Position Field ID' direction='row' containerProps={rowFieldProps}>
                        <DebounceInput
                            element='input'
                            value={values.itemPositionFieldId}
                            className={classes.input}
                            type='number'
                            name='itemPositionFieldId'
                            onChange={setField}
                            debounceTimeout={400}
                        />
                    </FieldType>
                    <FieldType required={false} label='Item Arrangement Field ID' direction='row' containerProps={rowFieldProps}>
                        <DebounceInput
                            element='input'
                            value={values.itemArrangementFieldId}
                            className={classes.input}
                            type='number'
                            name='itemArrangementFieldId'
                            onChange={setField}
                            debounceTimeout={400}
                        />
                    </FieldType>
                    <FieldType required={false} label='Focus Type' direction='row' containerProps={rowFieldProps}>
                        <Select
                            value={values.focusType}
                            className={classes.select}
                            name='focusType'
                            onChange={setField}
                            disableUnderline
                        >
                            {FocusType.map((type, index) => <MenuItem key={index} value={type}>{type}</MenuItem>)}
                        </Select>
                    </FieldType>
                    <FieldType required={false} label='Light Source Type' direction='row' containerProps={rowFieldProps}>
                        <Select
                            value={values.lightsourceType}
                            className={classes.select}
                            name='lightsourceType'
                            onChange={setField}
                            disableUnderline
                        >
                            {LightsourceType.map((type, index) => <MenuItem key={index} value={type}>{type}</MenuItem>)}
                        </Select>
                    </FieldType>
                    <FieldType required={false} label='Background Removal Method' direction='row' containerProps={rowFieldProps}>
                        <Select
                            value={values.backgroundRemovalMethod}
                            className={classes.select}
                            name='backgroundRemovalMethod'
                            onChange={setField}
                            disableUnderline
                        >
                            {BackgroundRemovalMethod.map((type, index) => <MenuItem key={index} value={type}>{type}</MenuItem>)}
                        </Select>
                    </FieldType>
                    <FieldType required={false} label='Cluster Type' direction='row' containerProps={rowFieldProps}>
                        <Select
                            value={values.clusterType}
                            className={classes.select}
                            name='clusterType'
                            onChange={setField}
                            disableUnderline
                        >
                            {ClusterType.map((type, index) => <MenuItem key={index} value={type}>{type}</MenuItem>)}
                        </Select>
                    </FieldType>
                    <FieldType required={false} label='Cluster Geometry Field ID' direction='row' containerProps={rowFieldProps}>
                        <DebounceInput
                            element='input'
                            value={values.clusterGeometryFieldId}
                            className={classes.input}
                            type='number'
                            name='clusterGeometryFieldId'
                            onChange={setField}
                            debounceTimeout={400}
                        />
                    </FieldType>
                    <FieldType required={false} label='Camera Settings Uniform?' direction='row' containerProps={rowFieldProps}>
                        <Checkbox
                            name='cameraSettingUniform'
                            checked={values.cameraSettingUniform}
                            onChange={setCheckboxField}
                            color='primary'
                        />
                    </FieldType>
                </Box>
            </Box>
        </Box>
    );
}

export default PhotogrammetryMetadata;