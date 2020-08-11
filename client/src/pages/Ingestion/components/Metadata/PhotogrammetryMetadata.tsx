import { Box, Select, MenuItem, Checkbox } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { FieldType } from '../../../../components';
import DateFnsUtils from '@date-io/date-fns';
import { MuiPickersUtilsProvider, KeyboardDatePicker } from '@material-ui/pickers';
import { Colors } from '../../../../theme';
import { StateMetadata, AssetType } from '../../../../context';
import { PhotogrammetrySelectOptions } from '../../../../context';
import { FileId } from '../../../../context';
import useMetadata from '../../hooks/useMetadata';

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
    fileId: FileId;
    metadata: StateMetadata;
}

function PhotogrammetryMetadata(props: PhotogrammetryMetadataProps): React.ReactElement {
    const { fileId, metadata } = props;
    const classes = useStyles();
    const { DatasetType, ItemPositionType, FocusType, LightsourceType, BackgroundRemovalMethod, ClusterType } = PhotogrammetrySelectOptions;

    const { photogrammetry } = metadata;
    const { updateFields } = useMetadata();

    const dateCapturedError = photogrammetry.dateCaptured.toString() === 'Invalid Date';

    const setField = ({ target }): void => {
        const { name, value } = target;
        updateFields(fileId, name, value, AssetType.Photogrammetry);
    };

    const setDateField = (name: string, value: string | null | undefined): void => {
        if (value) {
            const date = new Date(value);
            updateFields(fileId, name, date, AssetType.Photogrammetry);
        }
    };

    const setCheckboxField = ({ target }): void => {
        const { name, checked } = target;
        updateFields(fileId, name, checked, AssetType.Photogrammetry);
    };

    const rowFieldProps = { alignItems: 'center', justifyContent: 'space-between' };

    return (
        <Box className={classes.container}>
            <FieldType required label='Description' direction='row' containerProps={rowFieldProps}>
                <textarea
                    className={classes.description}
                    name='description'
                    value={photogrammetry.description}
                    onChange={setField}
                />
            </FieldType>

            <Box className={classes.fieldsContainer}>
                <Box display='flex' flex={1} flexDirection='column'>
                    <FieldType
                        error={dateCapturedError}
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

                    <FieldType
                        required
                        label='Dataset Type'
                        direction='row'
                        containerProps={rowFieldProps}
                    >
                        <Select
                            value={photogrammetry.datasetType}
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
                        <input
                            value={photogrammetry.datasetFieldId}
                            className={classes.input}
                            type='number'
                            name='datasetFieldId'
                            onChange={setField}
                        />
                    </FieldType>
                    <FieldType required={false} label='Item Position Type' direction='row' containerProps={rowFieldProps}>
                        <Select
                            value={photogrammetry.itemPositionType}
                            className={classes.select}
                            name='itemPositionType'
                            onChange={setField}
                            disableUnderline
                        >
                            {ItemPositionType.map((type, index) => <MenuItem key={index} value={type}>{type}</MenuItem>)}
                        </Select>
                    </FieldType>
                    <FieldType required={false} label='Item Position Field ID' direction='row' containerProps={rowFieldProps}>
                        <input
                            value={photogrammetry.itemPositionFieldId}
                            className={classes.input}
                            type='number'
                            name='itemPositionFieldId'
                            onChange={setField}
                        />
                    </FieldType>
                    <FieldType required={false} label='Item Arrangement Field ID' direction='row' containerProps={rowFieldProps}>
                        <input
                            value={photogrammetry.itemArrangementFieldId}
                            className={classes.input}
                            type='number'
                            name='itemArrangementFieldId'
                            onChange={setField}
                        />
                    </FieldType>
                    <FieldType required={false} label='Focus Type' direction='row' containerProps={rowFieldProps}>
                        <Select
                            value={photogrammetry.focusType}
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
                            value={photogrammetry.lightsourceType}
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
                            value={photogrammetry.backgroundRemovalMethod}
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
                            value={photogrammetry.clusterType}
                            className={classes.select}
                            name='clusterType'
                            onChange={setField}
                            disableUnderline
                        >
                            {ClusterType.map((type, index) => <MenuItem key={index} value={type}>{type}</MenuItem>)}
                        </Select>
                    </FieldType>
                    <FieldType required={false} label='Cluster Geometry Field ID' direction='row' containerProps={rowFieldProps}>
                        <input
                            value={photogrammetry.clusterGeometryFieldId}
                            className={classes.input}
                            type='number'
                            name='clusterGeometryFieldId'
                            onChange={setField}
                        />
                    </FieldType>
                    <FieldType required={false} label='Camera Settings Uniform?' direction='row' containerProps={rowFieldProps}>
                        <Checkbox
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

export default PhotogrammetryMetadata;