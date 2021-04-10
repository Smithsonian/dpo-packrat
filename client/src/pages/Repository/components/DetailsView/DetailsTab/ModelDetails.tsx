/* eslint-disable react-hooks/exhaustive-deps */
/**
 * ModelDetails
 *
 * This component renders details tab for Model specific details used in DetailsTab component.
 */
import { Box, makeStyles, Typography } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import { CheckboxField, DateInputField, FieldType, Loader, SelectField } from '../../../../../components';
import { useVocabularyStore } from '../../../../../store';
import { ModelDetailFields } from '../../../../../types/graphql';
import { eVocabularySetID } from '../../../../../types/server';
import { isFieldUpdated } from '../../../../../utils/repository';
import { withDefaultValueNumber } from '../../../../../utils/shared';
import { formatBytes } from '../../../../../utils/upload';
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
    const [details, setDetails] = useState<ModelDetailFields>({ });

    const [getInitialEntry, getEntries] = useVocabularyStore(state => [state.getInitialEntry, state.getEntries]);

    useEffect(() => {
        onUpdateDetail(objectType, details);
    }, [details]);

    useEffect(() => {
        if (data && !loading) {
            const { Model } = data.getDetailsTabDataForObject;
            setDetails({
                size: Model?.size,
                master: Model?.master,
                authoritative: Model?.authoritative,
                creationMethod: Model?.creationMethod,
                modality: Model?.modality,
                purpose: Model?.purpose,
                units: Model?.units,
                dateCaptured: Model?.dateCaptured,
                modelFileType: Model?.modelFileType,
            });
        }
    }, [data, loading]);

    if (!data || loading) {
        return <Loader minHeight='15vh' />;
    }

    const setDateField = (name: string, value?: string | null): void => {
        if (value) {
            const date = new Date(value);
            setDetails(details => ({ ...details, [name]: date }));
        }
    };

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

    const rowFieldProps = { alignItems: 'center', justifyContent: 'space-between', style: { borderRadius: 0 } };

    const modelData = data.getDetailsTabDataForObject?.Model;

    return (
        <Box display='flex'>
            <Box display='flex' flex={1} flexDirection='column'>
                <FieldType
                    required
                    label='Total Size'
                    direction='row'
                    containerProps={rowFieldProps}
                    width='auto'
                >
                    <Typography className={classes.value}>{formatBytes(details?.size ?? 0)}</Typography>
                </FieldType>
                <FieldType
                    required
                    label='Date Captured'
                    direction='row'
                    width='auto'
                    containerProps={rowFieldProps}
                >
                    <DateInputField
                        value={new Date(details?.dateCaptured ?? Date.now())}
                        updated={isFieldUpdated(details, modelData, 'dateCaptured')}
                        disabled={disabled}
                        onChange={(_, value) => setDateField('dateCaptured', value)}
                    />
                </FieldType>

                <SelectField
                    viewMode
                    required
                    updated={isFieldUpdated(details, modelData, 'creationMethod')}
                    disabled={disabled}
                    label='Creation Method'
                    value={withDefaultValueNumber(details.creationMethod, getInitialEntry(eVocabularySetID.eModelCreationMethod))}
                    name='creationMethod'
                    onChange={setIdField}
                    options={getEntries(eVocabularySetID.eModelCreationMethod)}
                />

                <CheckboxField
                    viewMode
                    required
                    updated={isFieldUpdated(details, modelData, 'master')}
                    disabled={disabled}
                    name='master'
                    label='Master Model'
                    value={details.master ?? false}
                    onChange={setCheckboxField}
                />

                <CheckboxField
                    viewMode
                    required
                    updated={isFieldUpdated(details, modelData, 'authoritative')}
                    disabled={disabled}
                    name='authoritative'
                    label='Authoritative Model'
                    value={details.authoritative ?? false}
                    onChange={setCheckboxField}
                />

                <SelectField
                    viewMode
                    required
                    updated={isFieldUpdated(details, modelData, 'modality')}
                    disabled={disabled}
                    label='Modality'
                    value={withDefaultValueNumber(details.modality, getInitialEntry(eVocabularySetID.eModelModality))}
                    name='modality'
                    onChange={setIdField}
                    options={getEntries(eVocabularySetID.eModelModality)}
                />

                <SelectField
                    viewMode
                    required
                    updated={isFieldUpdated(details, modelData, 'units')}
                    disabled={disabled}
                    label='Units'
                    value={withDefaultValueNumber(details.units, getInitialEntry(eVocabularySetID.eModelUnits))}
                    name='units'
                    onChange={setIdField}
                    options={getEntries(eVocabularySetID.eModelUnits)}
                />

                <SelectField
                    viewMode
                    required
                    updated={isFieldUpdated(details, modelData, 'purpose')}
                    disabled={disabled}
                    label='Purpose'
                    value={withDefaultValueNumber(details.purpose, getInitialEntry(eVocabularySetID.eModelPurpose))}
                    name='purpose'
                    onChange={setIdField}
                    options={getEntries(eVocabularySetID.eModelPurpose)}
                />

                <SelectField
                    viewMode
                    required
                    updated={isFieldUpdated(details, modelData, 'modelFileType')}
                    disabled={disabled}
                    label='Model File Type'
                    value={withDefaultValueNumber(details.modelFileType, getInitialEntry(eVocabularySetID.eModelFileType))}
                    name='modelFileType'
                    onChange={setIdField}
                    options={getEntries(eVocabularySetID.eModelFileType)}
                />
            </Box>
        </Box>
    );
}

export default ModelDetails;