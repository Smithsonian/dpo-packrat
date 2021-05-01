/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * CaptureDataDetails
 *
 * This component renders details tab for CaptureData specific details used in DetailsTab component.
 */
import { Box } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import { CheckboxField, DateInputField, FieldType, InputField, Loader, SelectField } from '../../../../../components';
import { parseFoldersToState, useVocabularyStore } from '../../../../../store';
import { CaptureDataDetailFields } from '../../../../../types/graphql';
import { eVocabularySetID } from '../../../../../types/server';
import { isFieldUpdated } from '../../../../../utils/repository';
import { withDefaultValueNumber } from '../../../../../utils/shared';
import AssetContents from '../../../../Ingestion/components/Metadata/Photogrammetry/AssetContents';
import Description from '../../../../Ingestion/components/Metadata/Photogrammetry/Description';
import { DetailComponentProps } from './index';
import ReadOnlyRow from '../../../../../components/controls/ReadOnlyRow';
import { toast } from 'react-toastify';

function CaptureDataDetails(props: DetailComponentProps): React.ReactElement {
    const { data, loading, disabled, onUpdateDetail, objectType } = props;

    const [details, setDetails] = useState<CaptureDataDetailFields>({
        folders: []
    });

    const [getInitialEntry, getEntries] = useVocabularyStore(state => [state.getInitialEntry, state.getEntries]);

    useEffect(() => {
        onUpdateDetail(objectType, details);
    }, [details]);

    useEffect(() => {
        if (data && !loading) {
            const { CaptureData } = data.getDetailsTabDataForObject;
            setDetails({
                captureMethod: CaptureData?.captureMethod,
                description: CaptureData?.description,
                dateCaptured: CaptureData?.dateCaptured,
                datasetType: CaptureData?.datasetType,
                folders: CaptureData?.folders || [],
                datasetFieldId: CaptureData?.datasetFieldId,
                itemPositionType: CaptureData?.itemPositionType,
                itemPositionFieldId: CaptureData?.itemPositionFieldId,
                itemArrangementFieldId: CaptureData?.itemArrangementFieldId,
                focusType: CaptureData?.focusType,
                lightsourceType: CaptureData?.lightsourceType,
                backgroundRemovalMethod: CaptureData?.backgroundRemovalMethod,
                clusterType: CaptureData?.clusterType,
                clusterGeometryFieldId: CaptureData?.clusterGeometryFieldId,
                cameraSettingUniform: CaptureData?.cameraSettingUniform
            });
        }
        if (!data?.getDetailsTabDataForObject.CaptureData?.isValidData) toast.error('Invalid data detected', { autoClose: false });
    }, [data, loading]);

    if (!data || loading) {
        return <Loader minHeight='15vh' />;
    }

    const updateFolderVariant = () => {
        alert('TODO: KARAN: Update Folder Variant');
    };

    const onSetField = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setDetails(details => ({ ...details, [name]: value }));
    };

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
    const captureDataData = data.getDetailsTabDataForObject?.CaptureData;
    const cdMethods = getEntries(eVocabularySetID.eCaptureDataCaptureMethod);
    const captureMethodidVocabulary = withDefaultValueNumber(details?.captureMethod, getInitialEntry(eVocabularySetID.eCaptureDataCaptureMethod));
    const captureMethod = cdMethods.find(method => method.idVocabulary === captureMethodidVocabulary);

    return (
        <Box>
            <ReadOnlyRow label='Capture Method' value={captureMethod?.Term || 'Unknown'} />
            <Description viewMode value={details.description ?? ''} onChange={onSetField} updated={isFieldUpdated(details, captureDataData, 'description')} disabled={disabled} />
            <Box display='flex' mt={1}>
                <Box display='flex' flex={1} flexDirection='column'>
                    <Box display='flex' flexDirection='column'>
                        <FieldType required label='Date Captured' direction='row' containerProps={rowFieldProps} width='auto'>
                            <DateInputField
                                updated={isFieldUpdated(details, captureDataData, 'dateCaptured')}
                                value={new Date(details?.dateCaptured ?? Date.now())}
                                disabled={disabled}
                                onChange={(_, value) => setDateField('dateCaptured', value)}
                            />
                        </FieldType>

                        <SelectField
                            required
                            viewMode
                            updated={isFieldUpdated(details, captureDataData, 'datasetType')}
                            disabled={disabled}
                            label='Dataset Type'
                            value={withDefaultValueNumber(details?.datasetType, getInitialEntry(eVocabularySetID.eCaptureDataDatasetType))}
                            name='datasetType'
                            onChange={setIdField}
                            options={getEntries(eVocabularySetID.eCaptureDataDatasetType)}
                        />
                    </Box>
                    <AssetContents
                        viewMode
                        disabled={disabled}
                        initialEntry={getInitialEntry(eVocabularySetID.eCaptureDataFileVariantType)}
                        folders={parseFoldersToState(details?.folders ?? [])}
                        options={getEntries(eVocabularySetID.eCaptureDataFileVariantType)}
                        onUpdate={updateFolderVariant}
                    />
                </Box>
                <Box display='flex' flex={1} flexDirection='column' ml={1}>
                    <InputField
                        viewMode
                        disabled={disabled}
                        updated={isFieldUpdated(details, captureDataData, 'datasetFieldId')}
                        type='number'
                        label='Dataset Field ID'
                        value={details.datasetFieldId}
                        name='datasetFieldId'
                        onChange={setIdField}
                    />
                    <SelectField
                        viewMode
                        updated={isFieldUpdated(details, captureDataData, 'itemPositionType')}
                        disabled={disabled}
                        label='Item Position Type'
                        value={withDefaultValueNumber(details.itemPositionType, getInitialEntry(eVocabularySetID.eCaptureDataItemPositionType))}
                        name='itemPositionType'
                        onChange={setIdField}
                        options={getEntries(eVocabularySetID.eCaptureDataItemPositionType)}
                    />
                    <InputField
                        viewMode
                        updated={isFieldUpdated(details, captureDataData, 'itemPositionFieldId')}
                        disabled={disabled}
                        type='number'
                        label='Item Position Field ID'
                        value={details.itemPositionFieldId}
                        name='itemPositionFieldId'
                        onChange={setIdField}
                    />
                    <InputField
                        viewMode
                        updated={isFieldUpdated(details, captureDataData, 'itemArrangementFieldId')}
                        disabled={disabled}
                        type='number'
                        label='Item Arrangement Field ID'
                        value={details.itemArrangementFieldId}
                        name='itemArrangementFieldId'
                        onChange={setIdField}
                    />
                    <SelectField
                        viewMode
                        updated={isFieldUpdated(details, captureDataData, 'focusType')}
                        disabled={disabled}
                        label='Focus Type'
                        value={withDefaultValueNumber(details.focusType, getInitialEntry(eVocabularySetID.eCaptureDataFocusType))}
                        name='focusType'
                        onChange={setIdField}
                        options={getEntries(eVocabularySetID.eCaptureDataFocusType)}
                    />

                    <SelectField
                        viewMode
                        updated={isFieldUpdated(details, captureDataData, 'lightsourceType')}
                        disabled={disabled}
                        label='Light Source Type'
                        value={withDefaultValueNumber(details.lightsourceType, getInitialEntry(eVocabularySetID.eCaptureDataLightSourceType))}
                        name='lightsourceType'
                        onChange={setIdField}
                        options={getEntries(eVocabularySetID.eCaptureDataLightSourceType)}
                    />

                    <SelectField
                        viewMode
                        updated={isFieldUpdated(details, captureDataData, 'backgroundRemovalMethod')}
                        disabled={disabled}
                        label='Background Removal Method'
                        value={withDefaultValueNumber(details.backgroundRemovalMethod, getInitialEntry(eVocabularySetID.eCaptureDataBackgroundRemovalMethod))}
                        name='backgroundRemovalMethod'
                        onChange={setIdField}
                        options={getEntries(eVocabularySetID.eCaptureDataBackgroundRemovalMethod)}
                    />

                    <SelectField
                        viewMode
                        updated={isFieldUpdated(details, captureDataData, 'clusterType')}
                        disabled={disabled}
                        label='Cluster Type'
                        value={withDefaultValueNumber(details.clusterType, getInitialEntry(eVocabularySetID.eCaptureDataClusterType))}
                        name='clusterType'
                        onChange={setIdField}
                        options={getEntries(eVocabularySetID.eCaptureDataClusterType)}
                    />

                    <InputField
                        viewMode
                        updated={isFieldUpdated(details, captureDataData, 'clusterGeometryFieldId')}
                        disabled={disabled}
                        type='number'
                        label='Cluster Geometry Field ID'
                        value={details.clusterGeometryFieldId}
                        name='clusterGeometryFieldId'
                        onChange={setIdField}
                    />
                    <CheckboxField
                        viewMode
                        updated={isFieldUpdated(details, captureDataData, 'cameraSettingUniform')}
                        disabled={disabled}
                        required={false}
                        name='cameraSettingUniform'
                        label='Camera Settings Uniform'
                        value={details.cameraSettingUniform ?? false}
                        onChange={setCheckboxField}
                    />
                </Box>
            </Box>
        </Box>
    );
}

export default CaptureDataDetails;
