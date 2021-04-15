/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable  react/jsx-max-props-per-line */

/**
 * ModelDetails
 *
 * This component renders details tab for Model specific details used in DetailsTab component.
 */
import { Typography, Box, makeStyles, Checkbox } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import { DateInputField, FieldType, Loader, SelectField, InputField, ReadOnlyRow } from '../../../../../components';
import { useVocabularyStore } from '../../../../../store';
import { eVocabularySetID } from '../../../../../types/server';
// import { isFieldUpdated } from '../../../../../utils/repository';
// import { withDefaultValueNumber } from '../../../../../utils/shared';
import { extractModelConstellation } from '../../../../../constants/helperfunctions';
import ObjectMeshTable from './../../../../Ingestion/components/Metadata/Model/ObjectMeshTable';
import AssetFilesTable from './../../../../Ingestion/components/Metadata/Model/AssetFilesTable';
import { DetailComponentProps } from './index';

export const useStyles = makeStyles(theme => ({
    value: {
        fontSize: '0.8em',
        color: theme.palette.primary.dark
    },
    notRequiredFields: {
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 5,
        backgroundColor: theme.palette.secondary.light,
        width: '350px',
        '& > *': {
            height: '20px',
            borderBottom: '0.5px solid #D8E5EE',
            borderTop: '0.5px solid #D8E5EE'
        }
    },
    dataEntry: {
        display: 'flex',
        flexDirection: 'column',
        width: '350px',
        marginRight: '30px',
        '& > *': {
            height: '20px',
            borderBottom: '0.5px solid #D8E5EE',
            borderTop: '0.5px solid #D8E5EE',
            width: 'auto'
        },
        border: '1px solid #D8E5EE',
        height: 'fit-content'
    },
    ModelMetricsAndFormContainer: {
        borderRadius: 5,
        padding: 10,
        backgroundColor: theme.palette.primary.light,
        width: '90%',
        display: 'flex',
        flexDirection: 'column'
    },
    modelMetricsAndForm: {
        display: 'flex',
        flexDirection: 'row',
        borderRadius: 5,
        backgroundColor: theme.palette.primary.light,
        width: 'auto',
        justifyContent: 'space-around'
    },
    captionContainer: {
        flex: '1 1 0%',
        width: '92%',
        display: 'flex',
        marginBottom: '8px',
        flexDirection: 'row',
        color: '#2C405A'
    },
    assetFilesTable: {
        '& > *': {
            width: 'calc(90% + 20px)'
        }
    }
}));

function ModelDetails(props: DetailComponentProps): React.ReactElement {
    const classes = useStyles();
    const { data, loading, disabled, onUpdateDetail, objectType } = props;

    const { ingestionModel, modelObjects, assets } = extractModelConstellation(data?.getDetailsTabDataForObject?.Model);
    const [details, setDetails] = useState({});
    const [getInitialEntry, getEntries] = useVocabularyStore(state => [state.getInitialEntry, state.getEntries]);

    console.log(typeof classes, typeof disabled, typeof getInitialEntry);

    useEffect(() => {
        onUpdateDetail(objectType, details);
    }, [details]);

    useEffect(() => {
        if (data && !loading) {
            console.log('data', data);
        }
    }, [data, loading]);

    if (!data || loading) {
        return <Loader minHeight='15vh' />;
    }

    const setDateField = (value?: string | null): void => {
        if (value) {
            const date = new Date(value);
            setDetails(details => ({ ...details, creationDate: date }));
        }
        console.log(details);
    };

    const setIdField = ({ target }): void => {
        const { name, value } = target;
        let idFieldValue: number | null = null;

        if (value) {
            idFieldValue = Number.parseInt(value, 10);
        }

        setDetails(details => ({ ...details, [name]: idFieldValue }));
        console.log(details);
    };

    const setCheckboxField = ({ target }): void => {
        const { name, checked } = target;
        setDetails(details => ({ ...details, [name]: checked }));
        console.log(details);
    };

    const setNameField = ({ target }): void => {
        const { name, value } = target;
        setDetails(details => ({ ...details, [name]: value }));
        console.log(details);
    };

    const rowFieldProps = { alignItems: 'center', justifyContent: 'space-between', style: { borderRadius: 0 } };

    // const modelData = data.getDetailsTabDataForObject?.Model;

    console.log('creation', getEntries(eVocabularySetID.eModelCreationMethod));
    console.log('modality', getEntries(eVocabularySetID.eModelModality));
    console.log('unit', getEntries(eVocabularySetID.eModelUnits));
    console.log('purpose', getEntries(eVocabularySetID.eModelPurpose));
    console.log('filetype', getEntries(eVocabularySetID.eModelFileType));

    return (
        // <Box display='flex' style={{ backgroundColor: 'purple', width: 'fit-content' }}>
        <Box display='flex' flex={1} flexDirection='column' style={{ width: '100%' }}>
            <Box className={classes.ModelMetricsAndFormContainer}>
                <Box className={classes.captionContainer}>
                    <Typography variant='caption'>Model</Typography>
                </Box>

                <Box className={classes.modelMetricsAndForm}>
                    <Box display='flex' flexDirection='column' className={classes.dataEntry}>
                        <InputField required type='string' label='Name' value={ingestionModel.Name} name='name' onChange={setNameField} />

                        {/* <FieldType required label='Date Captured' direction='row' containerProps={rowFieldProps}>
    <DateInputField value={} onChange={(_, value) => setDateField('dateCaptured', value)} />
</FieldType> */}
                        <FieldType required label='Date Created' direction='row' containerProps={rowFieldProps}>
                            <DateInputField value={ingestionModel.DateCreated} onChange={(_, value) => setDateField(value)} />
                        </FieldType>

                        <FieldType required label='Master Model' direction='row' containerProps={rowFieldProps}>
                            <Checkbox name='master' checked={ingestionModel.Master} color='primary' onChange={setCheckboxField} />
                        </FieldType>

                        <FieldType required label='Authoritative' direction='row' containerProps={rowFieldProps}>
                            <Checkbox name='authoritative' checked={ingestionModel.Authoritative} color='primary' onChange={setCheckboxField} />
                        </FieldType>

                        <SelectField
                            required
                            label='Creation Method'
                            value={ingestionModel.idVCreationMethod}
                            name='creationMethod'
                            onChange={setIdField}
                            options={getEntries(eVocabularySetID.eModelCreationMethod)}
                        />
                        <SelectField
                            required
                            label='Modality'
                            value={ingestionModel.idVModality}
                            name='modality'
                            onChange={setIdField}
                            options={getEntries(eVocabularySetID.eModelModality)}
                        />

                        <SelectField required label='Units' value={ingestionModel.idVUnits} name='units' onChange={setIdField} options={getEntries(eVocabularySetID.eModelUnits)} />

                        <SelectField
                            required
                            label='Purpose'
                            value={ingestionModel.idVPurpose}
                            name='purpose'
                            onChange={setIdField}
                            options={getEntries(eVocabularySetID.eModelPurpose)}
                        />

                        <SelectField
                            required
                            label='Model File Type'
                            value={ingestionModel.idVFileType}
                            name='modelFileType'
                            onChange={setIdField}
                            options={getEntries(eVocabularySetID.eModelFileType)}
                        />
                    </Box>
                    <Box className={classes.notRequiredFields}>
                        <ReadOnlyRow label='Vertex Count' value={ingestionModel?.CountVertices} />
                        <ReadOnlyRow label='Face Count' value={ingestionModel?.CountFaces} />
                        <ReadOnlyRow label='Animation Count' value={ingestionModel?.CountAnimations} />
                        <ReadOnlyRow label='Camera Count' value={ingestionModel?.CountCameras} />
                        <ReadOnlyRow label='Light Count' value={ingestionModel?.CountLights} />
                        <ReadOnlyRow label='Material Count' value={ingestionModel?.CountMaterials} />
                        <ReadOnlyRow label='Mesh Count' value={ingestionModel?.CountMeshes} />
                        <ReadOnlyRow label='Embedded Texture Count' value={ingestionModel?.CountEmbeddedTextures} />
                        <ReadOnlyRow label='Linked Texture Count' value={ingestionModel?.CountLinkedTextures} />
                        <ReadOnlyRow label='File Encoding' value={ingestionModel?.FileEncoding} />
                    </Box>
                </Box>
            </Box>

            <Box className={classes.assetFilesTable}>
                <AssetFilesTable files={assets} />
            </Box>

            {/* <Box display='flex' flexDirection='row'> */}
            <ObjectMeshTable modelObjects={modelObjects} />
            {/* </Box> */}
        </Box>
        // </Box>
    );
}

export default ModelDetails;
