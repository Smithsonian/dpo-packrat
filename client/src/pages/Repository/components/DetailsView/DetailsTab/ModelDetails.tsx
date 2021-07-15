/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable  react/jsx-max-props-per-line */

/**
 * ModelDetails
 *
 * This component renders details tab for Model specific details used in DetailsTab component.
 */
import { Typography, Box, makeStyles } from '@material-ui/core';
import React, { useEffect } from 'react';
import { DateInputField, FieldType, Loader, SelectField, ReadOnlyRow } from '../../../../../components';
import { useVocabularyStore, useDetailTabStore } from '../../../../../store';
import { eVocabularySetID } from '../../../../../types/server';
// import { isFieldUpdated } from '../../../../../utils/repository';
// import { withDefaultValueNumber } from '../../../../../utils/shared';
import { extractModelConstellation } from '../../../../../constants/helperfunctions';
import ObjectMeshTable from './../../../../Ingestion/components/Metadata/Model/ObjectMeshTable';
import { DetailComponentProps } from './index';
import { eSystemObjectType } from '../../../../../types/server';

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
            updateDetailField(eSystemObjectType.eModel, 'DateCaptured', newDate);
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
                            <DateInputField value={ModelDetails.DateCaptured} onChange={date => setDateField(date)} />
                        </FieldType>

                        <SelectField
                            required
                            label='Creation Method'
                            value={ModelDetails.idVCreationMethod}
                            name='idVCreationMethod'
                            onChange={setIdField}
                            options={getEntries(eVocabularySetID.eModelCreationMethod)}
                        />
                        <SelectField
                            required
                            label='Modality'
                            value={ModelDetails.idVModality}
                            name='idVModality'
                            onChange={setIdField}
                            options={getEntries(eVocabularySetID.eModelModality)}
                        />

                        <SelectField
                            required
                            label='Units'
                            value={ModelDetails.idVUnits}
                            name='idVUnits'
                            onChange={setIdField}
                            options={getEntries(eVocabularySetID.eModelUnits)}
                        />

                        <SelectField
                            required
                            label='Purpose'
                            value={ModelDetails.idVPurpose}
                            name='idVPurpose'
                            onChange={setIdField}
                            options={getEntries(eVocabularySetID.eModelPurpose)}
                        />

                        <SelectField
                            required
                            label='Model File Type'
                            value={ModelDetails.idVFileType}
                            name='idVFileType'
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
