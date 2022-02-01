/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable  react/jsx-max-props-per-line */

/**
 * ModelDetails
 *
 * This component renders details tab for Model specific details used in DetailsTab component.
 */
import { Typography, Box, makeStyles, Select, MenuItem  } from '@material-ui/core';
import React, { useEffect } from 'react';
import { DateInputField, Loader, ReadOnlyRow } from '../../../../../components';
import { useVocabularyStore, useDetailTabStore } from '../../../../../store';
import { eVocabularySetID } from '../../../../../types/server';
import { extractModelConstellation } from '../../../../../constants/helperfunctions';
import ObjectMeshTable from './../../../../Ingestion/components/Metadata/Model/ObjectMeshTable';
import { DetailComponentProps } from './index';
import { eSystemObjectType } from '../../../../../types/server';
import { useStyles as useSelectStyles, SelectFieldProps } from '../../../../../components/controls/SelectField';

export const useStyles = makeStyles(({ palette }) => ({
    value: {
        fontSize: '0.8em',
        color: palette.primary.dark
    },
    notRequiredFields: {
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 5,
        backgroundColor: palette.secondary.light,
        width: 'max(200px, 10vw)',
        '& > *': {
            height: '20px',
            borderBottom: '0.5px solid #D8E5EE',
            borderTop: '0.5px solid #D8E5EE'
        }
    },
    dataEntry: {
        display: 'flex',
        flexDirection: 'column',
        width: 'fit-content',
        '& > *': {
            height: '20px',
            width: 'auto'
        },
        height: 'fit-content',
        backgroundColor: palette.secondary.light,
        paddingTop: '5px',
        paddingBottom: '5px'
    },
    ModelMetricsAndFormContainer: {
        borderRadius: 5,
        padding: 10,
        backgroundColor: palette.primary.light,
        width: 'calc(100% - 20px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'start'
    },
    modelMetricsAndForm: {
        display: 'flex',
        flexDirection: 'row',
        borderRadius: 5,
        backgroundColor: palette.primary.light,
        width: 'auto',
        justifyContent: 'space-around',
        columnGap: '10px'
    },
    captionContainer: {
        flex: '1 1 0%',
        width: '92%',
        display: 'flex',
        marginBottom: '8px',
        flexDirection: 'row',
        color: '#2C405A'
    },
    objectMeshTableContainer: {
        display: 'flex',
        justifyContent: 'start',
        width: '100%',
        backgroundColor: palette.primary.light,
        '& > *': {
            width: 'calc(100% - 20px)'
        }
    },
    detailsContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
    },
    label: {
        color: 'auto'
    }
}));

function ModelDetails(props: DetailComponentProps): React.ReactElement {
    const classes = useStyles();
    const { data, loading, onUpdateDetail, objectType } = props;

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

    return (
        <Box flex={1} className={classes.detailsContainer}>
            <Box className={classes.ModelMetricsAndFormContainer} mb={2}>
                <Box className={classes.captionContainer}>
                    <Typography variant='caption'>Model</Typography>
                </Box>

                <Box className={classes.modelMetricsAndForm}>
                    <Box display='flex' flexDirection='column' className={classes.dataEntry}>
                        <div style={{ display: 'grid', gridTemplateColumns: '120px calc(100% - 120px)', gridColumnGap: 5, padding: '3px 10px 3px 10px' }}>
                            <div style={{ gridColumnStart: 1, gridColumnEnd: 2 }}>
                                <Typography className={classes.label} variant='caption'>
                                    Date Created
                                </Typography>
                            </div>
                            <div style={{ gridColumnStart: 2, gridColumnEnd: 3 }}>
                                <DateInputField value={ModelDetails.DateCreated} onChange={date => setDateField(date)} dateHeight='22px' />
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
                        />

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
                        />
                    </Box>
                    <Box className={classes.notRequiredFields}>
                        <ReadOnlyRow label='Vertex Count' value={ingestionModel?.CountVertices} paddingString='3px 10px 3px 10px' />
                        <ReadOnlyRow label='Face Count' value={ingestionModel?.CountFaces} paddingString='3px 10px 3px 10px' />
                        <ReadOnlyRow label='Triangle Count' value={ingestionModel?.CountTriangles} paddingString='3px 10px 3px 10px' />
                        <ReadOnlyRow label='Animation Count' value={ingestionModel?.CountAnimations} paddingString='3px 10px 3px 10px' />
                        <ReadOnlyRow label='Camera Count' value={ingestionModel?.CountCameras} paddingString='3px 10px 3px 10px' />
                        <ReadOnlyRow label='Light Count' value={ingestionModel?.CountLights} paddingString='3px 10px 3px 10px' />
                        <ReadOnlyRow label='Material Count' value={ingestionModel?.CountMaterials} paddingString='3px 10px 3px 10px' />
                        <ReadOnlyRow label='Mesh Count' value={ingestionModel?.CountMeshes} paddingString='3px 10px 3px 10px' />
                        <ReadOnlyRow label='Embedded Texture Count' value={ingestionModel?.CountEmbeddedTextures} paddingString='3px 10px 3px 10px' />
                        <ReadOnlyRow label='Linked Texture Count' value={ingestionModel?.CountLinkedTextures} paddingString='3px 10px 3px 10px' />
                        <ReadOnlyRow label='File Encoding' value={ingestionModel?.FileEncoding} paddingString='3px 10px 3px 10px' />
                        <ReadOnlyRow label='Draco Compressed' value={ingestionModel?.IsDracoCompressed ? 'true' : 'false'} paddingString='3px 10px 3px 10px' />
                    </Box>
                </Box>
            </Box>
            <Box className={classes.objectMeshTableContainer}>
                <ObjectMeshTable modelObjects={modelObjects} />
            </Box>
        </Box>
    );
}

export default ModelDetails;


function SelectField(props: SelectFieldProps): React.ReactElement {
    const { value, name, options, onChange, disabled = false, label } = props;
    const classes = useSelectStyles(props);

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '120px calc(100% - 120px)', gridColumnGap: 5, padding: '3px 10px 3px 10px' }}>
            <div style={{ gridColumnStart: 1, gridColumnEnd: 2 }}>
                <Typography style={{ color: 'auto' }} variant='caption'>
                    {label}
                </Typography>
            </div>
            <Select value={value || ''} className={classes.select} name={name} onChange={onChange} disabled={disabled} disableUnderline inputProps={{ 'title': `${name} select`, style: { width: '100%' } }} style={{ minWidth: '100%', width: 'fit-content' }}>
                {options.map(({ idVocabulary, Term }, index) => (
                    <MenuItem key={index} value={idVocabulary}>
                        {Term}
                    </MenuItem>
                ))}
            </Select>
        </div>
    );
}