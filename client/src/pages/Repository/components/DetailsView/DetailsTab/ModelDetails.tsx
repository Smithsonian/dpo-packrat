/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable  react/jsx-max-props-per-line */

/**
 * ModelDetails
 *
 * This component renders details tab for Model specific details used in DetailsTab component.
 */
import { Typography, Box, makeStyles } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import { DateInputField, FieldType, Loader, SelectField, ReadOnlyRow } from '../../../../../components';
import { useVocabularyStore, useRepositoryDetailsFormStore } from '../../../../../store';
import { eVocabularySetID } from '../../../../../types/server';
// import { isFieldUpdated } from '../../../../../utils/repository';
// import { withDefaultValueNumber } from '../../../../../utils/shared';
import { extractModelConstellation } from '../../../../../constants/helperfunctions';
import ObjectMeshTable from './../../../../Ingestion/components/Metadata/Model/ObjectMeshTable';
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
        width: 'calc(100% - 20px)',
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
    objectMeshTableContainer: {
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
        '& > *': {
            width: 'calc(100% - 20px)'
        }
    },
    detailsContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
    }
}));

function ModelDetails(props: DetailComponentProps): React.ReactElement {
    const classes = useStyles();
    const { data, loading, onUpdateDetail, objectType } = props;

    const { ingestionModel, modelObjects } = extractModelConstellation(data?.getDetailsTabDataForObject?.Model);
    const [details] = useState({});
    const [setFormField, setFormDateField, dateCaptured, creationMethod, modality, purpose, units, fileType] = useRepositoryDetailsFormStore(state => [
        state.setFormField,
        state.setFormDateField,
        state.dateCaptured,
        state.creationMethod,
        state.modality,
        state.purpose,
        state.units,
        state.fileType
    ]);
    const [getEntries] = useVocabularyStore(state => [state.getEntries]);

    useEffect(() => {
        onUpdateDetail(objectType, details);
    }, [details]);

    useEffect(() => {
        if (data && !loading) {
            if (data.getDetailsTabDataForObject?.Model?.Model) {
                const { DateCreated, idVCreationMethod, idVModality, idVPurpose, idVUnits, idVFileType } = data.getDetailsTabDataForObject.Model.Model;

                if (DateCreated) {
                    setFormDateField(new Date(DateCreated));
                }
                if (idVCreationMethod) setFormField('creationMethod', idVCreationMethod);
                if (idVModality) setFormField('modality', idVModality);
                if (idVPurpose) setFormField('purpose', idVPurpose);
                if (idVUnits) setFormField('units', idVUnits);
                if (idVFileType) setFormField('fileType', idVFileType);
            }
        }
    }, [data, loading]);

    if (!data || loading) {
        return <Loader minHeight='15vh' />;
    }

    const setDateField = (value?: string | null): void => {
        if (value) {
            const date = new Date(value);
            setFormDateField(date);
        }
    };

    const setIdField = ({ target }): void => {
        const { name, value } = target;
        let idFieldValue: number | null = null;

        if (value) {
            idFieldValue = Number.parseInt(value, 10);
        }
        setFormField(name, idFieldValue);
    };

    const rowFieldProps = { alignItems: 'center', justifyContent: 'space-between', style: { borderRadius: 0 } };

    return (
        <Box flex={1} className={classes.detailsContainer}>
            <Box className={classes.ModelMetricsAndFormContainer} mb={2}>
                <Box className={classes.captionContainer}>
                    <Typography variant='caption'>Model</Typography>
                </Box>

                <Box className={classes.modelMetricsAndForm}>
                    <Box display='flex' flexDirection='column' className={classes.dataEntry}>
                        <FieldType required label='Date Created' direction='row' containerProps={rowFieldProps}>
                            <DateInputField value={dateCaptured} onChange={(_, value) => setDateField(value)} />
                        </FieldType>

                        <SelectField
                            required
                            label='Creation Method'
                            value={creationMethod}
                            name='creationMethod'
                            onChange={setIdField}
                            options={getEntries(eVocabularySetID.eModelCreationMethod)}
                        />
                        <SelectField required label='Modality' value={modality} name='modality' onChange={setIdField} options={getEntries(eVocabularySetID.eModelModality)} />

                        <SelectField required label='Units' value={units} name='units' onChange={setIdField} options={getEntries(eVocabularySetID.eModelUnits)} />

                        <SelectField required label='Purpose' value={purpose} name='purpose' onChange={setIdField} options={getEntries(eVocabularySetID.eModelPurpose)} />

                        <SelectField
                            required
                            label='Model File Type'
                            value={fileType}
                            name='fileType'
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
                        <ReadOnlyRow label='Draco Compressed' value={ingestionModel?.IsDracoCompressed ? 'true' : 'false'} />
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
