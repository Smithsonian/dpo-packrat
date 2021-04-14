/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable  react/jsx-max-props-per-line */

/**
 * ModelDetails
 *
 * This component renders details tab for Model specific details used in DetailsTab component.
 */
import { Box, makeStyles, Checkbox } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import { /*DateInputField,*/ FieldType, Loader, SelectField, InputField, ReadOnlyRow } from '../../../../../components';
import { useVocabularyStore } from '../../../../../store';
import { eVocabularySetID } from '../../../../../types/server';
// import { isFieldUpdated } from '../../../../../utils/repository';
// import { withDefaultValueNumber } from '../../../../../utils/shared';
import { extractModelConstellation } from '../../../../../constants/helperfunctions';
import ObjectMeshTable from './../../../../Ingestion/components/Metadata/Model/ObjectMeshTable';
import AssetFilesTable from './../../../../Ingestion/components/Metadata/Model/AssetFilesTable';
import { DetailComponentProps } from './index';

export const useStyles = makeStyles(({ palette }) => ({
    value: {
        fontSize: '0.8em',
        color: palette.primary.dark
    }
}));

function ModelDetails(props: DetailComponentProps): React.ReactElement {
    const classes = useStyles();
    const { data, loading, disabled, onUpdateDetail, objectType } = props;

    const { ingestionModel, modelObjects, assets } = extractModelConstellation(data?.getDetailsTabDataForObject?.Model);
    const [details, setDetails] = useState({});
    const [getInitialEntry, getEntries] = useVocabularyStore(state => [state.getInitialEntry, state.getEntries]);

    console.log(classes, disabled, getInitialEntry);

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

    // const setDateField = (name: string, value?: string | null): void => {
    //     if (value) {
    //         const date = new Date(value);
    //         setDetails(details => ({ ...details, [name]: date }));
    //     }
    // };

    const setIdField = ({ target }): void => {
        const { name, value } = target;
        let idFieldValue: number | null = null;

        if (value) {
            idFieldValue = Number.parseInt(value, 10);
        }

        setDetails(details => ({ ...details, [name]: idFieldValue }));
    };

    const setCheckboxField = ({ target }): void => {
        const { name, checked } = target;
        setDetails(details => ({ ...details, [name]: checked }));
    };

    const setNameField = ({ target }): void => {
        const { name, value } = target;
        console.log(name, value);
        // setdetails for name
    };

    const rowFieldProps = { alignItems: 'center', justifyContent: 'space-between', style: { borderRadius: 0 } };

    // const modelData = data.getDetailsTabDataForObject?.Model;

    return (
        <Box display='flex'>
            <Box display='flex' flex={1} flexDirection='column'>
                <InputField required type='string' label='Name' value={null} name='name' onChange={setNameField} />

                {/* <FieldType required label='Date Captured' direction='row' containerProps={rowFieldProps}>
    <DateInputField value={} onChange={(_, value) => setDateField('dateCaptured', value)} />
</FieldType> */}

                <FieldType required label='Master Model' direction='row' containerProps={rowFieldProps}>
                    <Checkbox name='master' checked color='primary' onChange={setCheckboxField} />
                </FieldType>

                <FieldType required label='Authoritative' direction='row' containerProps={rowFieldProps}>
                    <Checkbox name='authoritative' checked color='primary' onChange={setCheckboxField} />
                </FieldType>

                <SelectField
                    required
                    label='Creation Method'
                    value={null}
                    name='creationMethod'
                    onChange={setIdField}
                    options={getEntries(eVocabularySetID.eModelCreationMethod)}
                />
                <SelectField required label='Modality' value={null} name='modality' onChange={setIdField} options={getEntries(eVocabularySetID.eModelModality)} />

                <SelectField required label='Units' value={null} name='units' onChange={setIdField} options={getEntries(eVocabularySetID.eModelUnits)} />

                <SelectField required label='Purpose' value={null} name='purpose' onChange={setIdField} options={getEntries(eVocabularySetID.eModelPurpose)} />

                <SelectField required label='Model File Type' value={null} name='modelFileType' onChange={setIdField} options={getEntries(eVocabularySetID.eModelFileType)} />
                <Box>
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

                <Box>
                    <AssetFilesTable files={assets} />
                </Box>

                <Box display='flex' flexDirection='row'>
                    <ObjectMeshTable modelObjects={modelObjects} />
                </Box>
            </Box>
        </Box>
    );
}

export default ModelDetails;

// {/* <FieldType
//     required
//     label='Total Size'
//     direction='row'
//     containerProps={rowFieldProps}
//     width='auto'
// >
//     <Typography className={classes.value}>{formatBytes(details?.size ?? 0)}</Typography>
// </FieldType>
// <FieldType
//     required
//     label='Date Captured'
//     direction='row'
//     width='auto'
//     containerProps={rowFieldProps}
// >
//     <DateInputField
//         value={''}
//         updated={isFieldUpdated(details, modelData, 'dateCaptured')}
//         disabled={disabled}
//         onChange={(_, value) => setDateField('dateCaptured', value)}
//     />
// </FieldType>

// <SelectField
//     viewMode
//     required
//     updated={isFieldUpdated(details, modelData, 'creationMethod')}
//     disabled={disabled}
//     label='Creation Method'
//     value={withDefaultValueNumber(details.creationMethod, getInitialEntry(eVocabularySetID.eModelCreationMethod))}
//     name='creationMethod'
//     onChange={setIdField}
//     options={getEntries(eVocabularySetID.eModelCreationMethod)}
// />

// <CheckboxField
//     viewMode
//     required
//     updated={isFieldUpdated(details, modelData, 'master')}
//     disabled={disabled}
//     name='master'
//     label='Master Model'
//     value={details.master ?? false}
//     onChange={setCheckboxField}
// />

// <CheckboxField
//     viewMode
//     required
//     updated={isFieldUpdated(details, modelData, 'authoritative')}
//     disabled={disabled}
//     name='authoritative'
//     label='Authoritative Model'
//     value={details.authoritative ?? false}
//     onChange={setCheckboxField}
// />

// <SelectField
//     viewMode
//     required
//     updated={isFieldUpdated(details, modelData, 'modality')}
//     disabled={disabled}
//     label='Modality'
//     value={withDefaultValueNumber(details.modality, getInitialEntry(eVocabularySetID.eModelModality))}
//     name='modality'
//     onChange={setIdField}
//     options={getEntries(eVocabularySetID.eModelModality)}
// />

// <SelectField
//     viewMode
//     required
//     updated={isFieldUpdated(details, modelData, 'units')}
//     disabled={disabled}
//     label='Units'
//     value={withDefaultValueNumber(details.units, getInitialEntry(eVocabularySetID.eModelUnits))}
//     name='units'
//     onChange={setIdField}
//     options={getEntries(eVocabularySetID.eModelUnits)}
// />

// <SelectField
//     viewMode
//     required
//     updated={isFieldUpdated(details, modelData, 'purpose')}
//     disabled={disabled}
//     label='Purpose'
//     value={withDefaultValueNumber(details.purpose, getInitialEntry(eVocabularySetID.eModelPurpose))}
//     name='purpose'
//     onChange={setIdField}
//     options={getEntries(eVocabularySetID.eModelPurpose)}
// />

// <SelectField
//     viewMode
//     required
//     updated={isFieldUpdated(details, modelData, 'modelFileType')}
//     disabled={disabled}
//     label='Model File Type'
//     value={withDefaultValueNumber(details.modelFileType, getInitialEntry(eVocabularySetID.eModelFileType))}
//     name='modelFileType'
//     onChange={setIdField}
//     options={getEntries(eVocabularySetID.eModelFileType)}
// /> */}
