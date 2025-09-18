/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable  react/jsx-max-props-per-line */

/**
 * ModelDetails
 *
 * This component renders details tab for Model specific details used in DetailsTab component.
 */
import { Typography, Box, makeStyles, Select, MenuItem, fade, createStyles, Chip, Input } from '@material-ui/core';
import React, { useEffect } from 'react';
import { DateInputField, Loader, ReadOnlyRow, } from '../../../../../components';
import { useVocabularyStore, useDetailTabStore } from '../../../../../store';
import { eVocabularySetID, eSystemObjectType } from '@dpo-packrat/common';
import { extractModelConstellation } from '../../../../../constants/helperfunctions';
import { DetailComponentProps } from './index';
import { useStyles as useSelectStyles, SelectFieldProps } from '../../../../../components/controls/SelectField';
import { DebounceInput } from 'react-debounce-input';
import ObjectMeshTable from '../../../../Ingestion/components/Metadata/Model/ObjectMeshTable';
import { updatedFieldStyling } from './CaptureDataDetails';
import { isFieldUpdated } from '../../../../../utils/repository';

export const useStyles = makeStyles(({ palette, typography }) => createStyles({
    notRequiredFields: {
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 5,
        backgroundColor: palette.secondary.light,
        width: 'fit-content',
        height: 'fit-content',
        padding: '5px',
        outline: '1px solid rgba(141, 171, 196, 0.4)'
    },
    dataEntry: {
        display: 'flex',
        flexDirection: 'column',
        width: 'fit-content',
        height: 'fit-content',
        backgroundColor: palette.secondary.light,
        paddingTop: '5px',
        paddingBottom: '5px',
        borderRadius: 5,
        outline: '1px solid rgba(141, 171, 196, 0.4)'
    },
    modelDetailsContainer: {
        borderRadius: 5,
        padding: 10,
        backgroundColor: palette.primary.light,
        width: 'calc(100% - 20px)',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'start',
        flexWrap: 'wrap',
        columnGap: 10,
        rowGap: 10
    },
    caption: {
        flex: '1 1 0%',
        width: '100%',
        display: 'flex',
        marginBottom: '8px',
        flexDirection: 'row',
        color: 'grey',
    },
    detailsContainer: {
    },
    label: {
        color: palette.primary.dark
    },
    input: {
        width: 'fit-content',
        border: `1px solid ${fade(palette.primary.contrastText, 0.4)}`,
        backgroundColor: palette.background.paper,
        padding: 9,
        borderRadius: 5,
        fontWeight: 400,
        fontFamily: typography.fontFamily,
        fontSize: '0.8em',
        height: 3
    },
    readOnlyRowsContainer: {
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: palette.secondary.light,
        width: '200px'
    },
}));

function ModelDetails(props: DetailComponentProps): React.ReactElement {
    const classes = useStyles();
    const { data, loading, onUpdateDetail, objectType, subtitle, onSubtitleUpdate, originalSubtitle } = props;

    const { ingestionModel, modelObjects } = extractModelConstellation(data?.getDetailsTabDataForObject?.Model);
    const [ModelDetails, updateDetailField] = useDetailTabStore(state => [state.ModelDetails, state.updateDetailField]);
    const [getEntries] = useVocabularyStore(state => [state.getEntries]);

    useEffect(() => {
        onUpdateDetail(objectType, ModelDetails);
    }, [ModelDetails]);

    if (!data || loading) {
        return <Loader minHeight='15vh' />;
    }

    const setDateField = (date: Date | string | null): void => {
        if (date) {
            const newDate = new Date(date);
            updateDetailField(eSystemObjectType.eModel, 'DateCreated', newDate);
        }
    };

    const setIdField = ({ target }): void => {
        const { name, value } = target;
        let idFieldValue: number | null = null;

        if (value) {
            idFieldValue = Number.parseInt(value, 10);
        }
        updateDetailField(eSystemObjectType.eModel, name, idFieldValue);
    };

    const setVariantField = (event) => {
        const  { value, name } = event.target;
        // make sure we got an array as value
        if(!Array.isArray(value))
            return console.error('did not receive array', value);

        // convert array into JSON array and feed to metadata update
        const arrayString = JSON.stringify(value);
        updateDetailField(eSystemObjectType.eModel, name, arrayString);
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

        console.log(`[PACKRAT:ERROR] cannot get selected IDs for Model Variant. Unsupported value. (${value})`);
        return [];
    };

    const isMasterModel = (): boolean => {
        // hard coding the value since common constants does not align with the DB values
        // (constants) eVocabularyID.eModelPurposeMaster = 85
        // (database) idVocabulary.Master = 45
        return (ModelDetails.idVPurpose===45);
    };

    const readOnlyContainerProps: React.CSSProperties = {
        height: 26,
        alignItems: 'center'
    };

    return (
        <Box flex={1} className={classes.detailsContainer}>
            <Box className={classes.modelDetailsContainer}>
                <Box display='flex' flexDirection='column' className={classes.dataEntry}>
                    <div style={{ display: 'grid', gridTemplateColumns: '120px calc(100% - 120px)', gridColumnGap: 5, padding: '3px 10px 3px 10px', height: 20 }}>
                        <div style={{ gridColumnStart: 1, gridColumnEnd: 2 }}>
                            <Typography className={classes.label} variant='caption'>
                                Subtitle
                            </Typography>
                        </div>
                        <div style={{ gridColumnStart: 2, gridColumnEnd: 3 }}>
                            <DebounceInput value={subtitle} onChange={onSubtitleUpdate} className={classes.input} style={{ ...updatedFieldStyling(subtitle !== originalSubtitle) }} />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '120px calc(100% - 120px)', gridColumnGap: 5, padding: '3px 10px 3px 10px', height: 20 }}>
                        <div style={{ gridColumnStart: 1, gridColumnEnd: 2 }}>
                            <Typography className={classes.label} variant='caption'>
                                Date Created
                            </Typography>
                        </div>
                        <div style={{ gridColumnStart: 2, gridColumnEnd: 3 }} >
                            <DateInputField value={ModelDetails.DateCreated} onChange={date => setDateField(date)} dateHeight='22px' updated={new Date(ingestionModel.DateCreated).toString() !== new Date(ModelDetails?.DateCreated as string)?.toString()} />
                        </div>
                    </div>
                    <SelectField
                        required
                        label='Creation Method'
                        value={ModelDetails.idVCreationMethod}
                        name='idVCreationMethod'
                        onChange={setIdField}
                        options={getEntries(eVocabularySetID.eModelCreationMethod)}
                        selectHeight='24px'
                        valueLeftAligned
                        selectFitContent
                        updated={isFieldUpdated(ModelDetails, ingestionModel, 'idVCreationMethod')}
                    />
                    <SelectField
                        required
                        label='Modality'
                        value={ModelDetails.idVModality}
                        name='idVModality'
                        onChange={setIdField}
                        options={getEntries(eVocabularySetID.eModelModality)}
                        selectHeight='24px'
                        valueLeftAligned
                        selectFitContent
                        updated={isFieldUpdated(ModelDetails, ingestionModel, 'idVModality')}
                    />
                    <SelectField
                        required
                        label='Units'
                        value={ModelDetails.idVUnits}
                        name='idVUnits'
                        onChange={setIdField}
                        options={getEntries(eVocabularySetID.eModelUnits)}
                        selectHeight='24px'
                        valueLeftAligned
                        selectFitContent
                        updated={isFieldUpdated(ModelDetails, ingestionModel, 'idVUnits')}
                    />
                    <SelectField
                        required
                        label='Purpose'
                        value={ModelDetails.idVPurpose}
                        name='idVPurpose'
                        onChange={setIdField}
                        options={getEntries(eVocabularySetID.eModelPurpose)}
                        selectHeight='24px'
                        valueLeftAligned
                        selectFitContent
                        updated={isFieldUpdated(ModelDetails, ingestionModel, 'idVPurpose')}
                    />
                    { isMasterModel() &&
                        <SelectMultiField
                            required
                            label='Model Variant'
                            value={getSelectedIDsFromJSON(ModelDetails.Variant)}
                            name='Variant'
                            onChange={setVariantField}
                            options={getEntries(eVocabularySetID.eModelVariant)}
                            selectHeight='24px'
                            valueLeftAligned
                            selectFitContent
                            updated={isFieldUpdated(ModelDetails, ingestionModel, 'Variant')}
                        />
                    }
                    <SelectField
                        required
                        label='Model File Type'
                        value={ModelDetails.idVFileType}
                        name='idVFileType'
                        onChange={setIdField}
                        options={getEntries(eVocabularySetID.eModelFileType)}
                        selectHeight='24px'
                        valueLeftAligned
                        selectFitContent
                        updated={isFieldUpdated(ModelDetails, ingestionModel, 'idVFileType')}
                    />
                </Box>

                <Box className={classes.notRequiredFields}>
                    <Box className={classes.caption}>
                        <Typography variant='caption'>Model</Typography>
                    </Box>
                    <Box className={classes.readOnlyRowsContainer}>
                        <ReadOnlyRow label='Vertex Count' value={ingestionModel?.CountVertices} paddingString='0px' containerStyle={readOnlyContainerProps} />
                        <ReadOnlyRow label='Face Count' value={ingestionModel?.CountFaces} paddingString='0px' containerStyle={readOnlyContainerProps} />
                        <ReadOnlyRow label='Triangle Count' value={ingestionModel?.CountTriangles} paddingString='0px' containerStyle={readOnlyContainerProps} />
                        <ReadOnlyRow label='Animation Count' value={ingestionModel?.CountAnimations} paddingString='0px' containerStyle={readOnlyContainerProps} />
                        <ReadOnlyRow label='Camera Count' value={ingestionModel?.CountCameras} paddingString='0px' containerStyle={readOnlyContainerProps} />
                        <ReadOnlyRow label='Light Count' value={ingestionModel?.CountLights} paddingString='0px' containerStyle={readOnlyContainerProps} />
                        <ReadOnlyRow label='Material Count' value={ingestionModel?.CountMaterials} paddingString='0px' containerStyle={readOnlyContainerProps} />
                        <ReadOnlyRow label='Mesh Count' value={ingestionModel?.CountMeshes} paddingString='0px' containerStyle={readOnlyContainerProps} />
                        <ReadOnlyRow label='Embedded Texture Count' value={ingestionModel?.CountEmbeddedTextures} paddingString='0px' containerStyle={readOnlyContainerProps} />
                        <ReadOnlyRow label='Linked Texture Count' value={ingestionModel?.CountLinkedTextures} paddingString='0px' containerStyle={readOnlyContainerProps} />
                        <ReadOnlyRow label='File Encoding' value={ingestionModel?.FileEncoding} paddingString='0px' containerStyle={readOnlyContainerProps} />
                        <ReadOnlyRow label='Draco Compressed' value={ingestionModel?.IsDracoCompressed ? 'true' : 'false'} paddingString='0px' containerStyle={readOnlyContainerProps} />
                    </Box>
                </Box>

                <ObjectMeshTable modelObjects={modelObjects} />
            </Box>
        </Box>
    );
}

export default ModelDetails;

function SelectField(props: SelectFieldProps): React.ReactElement {
    const { value, name, options, onChange, disabled = false, label, updated = false } = props;
    const classes = useSelectStyles(props);

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '120px calc(100% - 120px)', gridColumnGap: 5, padding: '3px 10px 3px 10px', height: 20 }}>
            <div style={{ gridColumnStart: 1, gridColumnEnd: 2 }}>
                <Typography style={{ color: 'black' }} variant='caption'>
                    {label}
                </Typography>
            </div>
            <Select
                value={value || ''}
                className={classes.select}
                name={name}
                onChange={onChange}
                disabled={disabled}
                disableUnderline
                inputProps={{ 'title': `${name} select`, style: { width: '100%' } }}
                style={{ minWidth: '100%', width: 'fit-content', ...updatedFieldStyling(updated) }}
                SelectDisplayProps={{ style: { paddingLeft: '10px', borderRadius: '5px' } }}
            >
                {options.map(({ idVocabulary, Term }, index) => (
                    <MenuItem key={index} value={idVocabulary}>
                        {Term}
                    </MenuItem>
                ))}
            </Select>
        </div>
    );
}
function SelectMultiField(props: SelectFieldProps): React.ReactElement {
    const { value, name, options, onChange, disabled = false, label, updated = false } = props;
    const classes = useSelectStyles(props);

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '120px calc(100% - 120px)', gridColumnGap: 5, padding: '3px 10px 3px 10px', height: 20 }}>
            <div style={{ gridColumnStart: 1, gridColumnEnd: 2 }}>
                <Typography style={{ color: 'black' }} variant='caption'>
                    {label}
                </Typography>
            </div>

            <Select
                multiple
                value={value || []}
                name='Variant'
                onChange={onChange}
                disabled={disabled}
                disableUnderline
                className={classes.select}
                inputProps={{ 'title': `${name} select`, style: { width: '100%' } }}
                input={<Input id='select-multiple-chip' />}
                style={{ minWidth: '100%', width: 'fit-content', ...updatedFieldStyling(updated) }}
                renderValue={(selected) => {
                    // get our entries and cycle through what's selected drawing as Chips,
                    // and pulling the name from the entries.
                    const entries = options;
                    return (<div className={classes.chips}>
                        {(selected as number[]).map((value) => {
                            const entry = entries.find(entry => entry.idVocabulary === value);
                            return (<Chip key={value} label={entry ? entry.Term : value} className={classes.chip} />);
                        })}
                    </div>);
                }}
            >
                {options.map(({ idVocabulary, Term }, index) => (
                    <MenuItem key={index} value={idVocabulary}>
                        {Term}
                    </MenuItem>
                ))}
            </Select>
        </div>
    );
}
