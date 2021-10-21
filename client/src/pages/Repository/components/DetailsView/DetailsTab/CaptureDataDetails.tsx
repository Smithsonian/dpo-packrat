/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * CaptureDataDetails
 *
 * This component renders details tab for CaptureData specific details used in DetailsTab component.
 */
import { Box } from '@material-ui/core';
import React, { useEffect } from 'react';
import { CheckboxField, DateInputField, FieldType, InputField, Loader, SelectField } from '../../../../../components';
import { parseFoldersToState, useVocabularyStore } from '../../../../../store';
import { eVocabularySetID, eSystemObjectType } from '../../../../../types/server';
import { isFieldUpdated } from '../../../../../utils/repository';
import { withDefaultValueNumber } from '../../../../../utils/shared';
import AssetContents from '../../../../Ingestion/components/Metadata/Photogrammetry/AssetContents';
import Description from '../../../../Ingestion/components/Metadata/Photogrammetry/Description';
import { DetailComponentProps } from './index';
import ReadOnlyRow from '../../../../../components/controls/ReadOnlyRow';
import { toast } from 'react-toastify';
import { useDetailTabStore } from '../../../../../store';

function CaptureDataDetails(props: DetailComponentProps): React.ReactElement {
    const { data, loading, disabled, onUpdateDetail, objectType } = props;
    const [CaptureDataDetails, updateDetailField] = useDetailTabStore(state => [state.CaptureDataDetails, state.updateDetailField]);

    const [getInitialEntry, getEntries] = useVocabularyStore(state => [state.getInitialEntry, state.getEntries]);

    useEffect(() => {
        onUpdateDetail(objectType, CaptureDataDetails);
    }, [CaptureDataDetails]);

    useEffect(() => {
        if (!data?.getDetailsTabDataForObject.CaptureData?.isValidData) toast.error('Invalid data detected', { autoClose: false });
    }, [data, loading]);

    if (!data || loading) {
        return <Loader minHeight='15vh' />;
    }

    const updateFolderVariant = (id, variantType) => {
        const folders = [...CaptureDataDetails.folders];
        const folder = folders[id];
        folder.variantType = variantType;
        updateDetailField(eSystemObjectType.eCaptureData, 'folders', folders);
    };

    const onSetField = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        updateDetailField(eSystemObjectType.eCaptureData, name, value);
    };

    const setDateField = (name: string, value?: string | null): void => {
        if (value) {
            const date = new Date(value);
            updateDetailField(eSystemObjectType.eCaptureData, name, date);
        }
    };

    const setIdField = ({ target }): void => {
        const { name, value } = target;
        let idFieldValue: number | null = null;

        if (value) {
            idFieldValue = Number.parseInt(value, 10);
        }
        updateDetailField(eSystemObjectType.eCaptureData, name, idFieldValue);
    };

    const setCheckboxField = ({ target }): void => {
        const { name, checked } = target;
        updateDetailField(eSystemObjectType.eCaptureData, name, checked);
    };

    const rowFieldProps = { alignItems: 'center', justifyContent: 'space-between', style: { borderRadius: 0 } };
    const captureDataData = data.getDetailsTabDataForObject?.CaptureData;
    const cdMethods = getEntries(eVocabularySetID.eCaptureDataCaptureMethod);
    const captureMethodidVocabulary = withDefaultValueNumber(CaptureDataDetails?.captureMethod, getInitialEntry(eVocabularySetID.eCaptureDataCaptureMethod));
    const captureMethod = cdMethods.find(method => method.idVocabulary === captureMethodidVocabulary);

    return (
        <Box>
            <ReadOnlyRow label='Capture Method' value={captureMethod?.Term || 'Unknown'} width='calc(100% - 20px)' />
            <Description
                viewMode
                value={CaptureDataDetails.description ?? ''}
                onChange={onSetField}
                updated={isFieldUpdated(CaptureDataDetails, captureDataData, 'description')}
                disabled={disabled}
            />
            <Box display='flex' mt={1}>
                <Box display='flex' flex={1} flexDirection='column'>
                    <Box display='flex' flexDirection='column'>
                        <FieldType required label='Date Captured' direction='row' containerProps={rowFieldProps} width='auto'>
                            <DateInputField
                                updated={isFieldUpdated(CaptureDataDetails, captureDataData, 'dateCaptured')}
                                value={new Date(CaptureDataDetails?.dateCaptured ?? Date.now())}
                                disabled={disabled}
                                onChange={(_, value) => setDateField('dateCaptured', value)}
                            />
                        </FieldType>

                        <SelectField
                            required
                            viewMode
                            updated={isFieldUpdated(CaptureDataDetails, captureDataData, 'datasetType')}
                            disabled={disabled}
                            label='Dataset Type'
                            value={withDefaultValueNumber(CaptureDataDetails?.datasetType, getInitialEntry(eVocabularySetID.eCaptureDataDatasetType))}
                            name='datasetType'
                            onChange={setIdField}
                            options={getEntries(eVocabularySetID.eCaptureDataDatasetType)}
                        />
                    </Box>
                    <AssetContents
                        viewMode
                        disabled={disabled}
                        initialEntry={getInitialEntry(eVocabularySetID.eCaptureDataFileVariantType)}
                        folders={parseFoldersToState(CaptureDataDetails?.folders ?? [])}
                        options={getEntries(eVocabularySetID.eCaptureDataFileVariantType)}
                        onUpdate={updateFolderVariant}
                    />
                </Box>
                <Box display='flex' flex={1} flexDirection='column' ml={1}>
                    <InputField
                        viewMode
                        disabled={disabled}
                        updated={isFieldUpdated(CaptureDataDetails, captureDataData, 'datasetFieldId')}
                        type='number'
                        label='Dataset Field ID'
                        value={CaptureDataDetails.datasetFieldId}
                        name='datasetFieldId'
                        onChange={setIdField}
                    />
                    <SelectField
                        viewMode
                        updated={isFieldUpdated(CaptureDataDetails, captureDataData, 'itemPositionType')}
                        disabled={disabled}
                        label='Item Position Type'
                        value={withDefaultValueNumber(CaptureDataDetails.itemPositionType, getInitialEntry(eVocabularySetID.eCaptureDataItemPositionType))}
                        name='itemPositionType'
                        onChange={setIdField}
                        options={getEntries(eVocabularySetID.eCaptureDataItemPositionType)}
                    />
                    <InputField
                        viewMode
                        updated={isFieldUpdated(CaptureDataDetails, captureDataData, 'itemPositionFieldId')}
                        disabled={disabled}
                        type='number'
                        label='Item Position Field ID'
                        value={CaptureDataDetails.itemPositionFieldId}
                        name='itemPositionFieldId'
                        onChange={setIdField}
                    />
                    <InputField
                        viewMode
                        updated={isFieldUpdated(CaptureDataDetails, captureDataData, 'itemArrangementFieldId')}
                        disabled={disabled}
                        type='number'
                        label='Item Arrangement Field ID'
                        value={CaptureDataDetails.itemArrangementFieldId}
                        name='itemArrangementFieldId'
                        onChange={setIdField}
                    />
                    <SelectField
                        viewMode
                        updated={isFieldUpdated(CaptureDataDetails, captureDataData, 'focusType')}
                        disabled={disabled}
                        label='Focus Type'
                        value={withDefaultValueNumber(CaptureDataDetails.focusType, getInitialEntry(eVocabularySetID.eCaptureDataFocusType))}
                        name='focusType'
                        onChange={setIdField}
                        options={getEntries(eVocabularySetID.eCaptureDataFocusType)}
                    />

                    <SelectField
                        viewMode
                        updated={isFieldUpdated(CaptureDataDetails, captureDataData, 'lightsourceType')}
                        disabled={disabled}
                        label='Light Source Type'
                        value={withDefaultValueNumber(CaptureDataDetails.lightsourceType, getInitialEntry(eVocabularySetID.eCaptureDataLightSourceType))}
                        name='lightsourceType'
                        onChange={setIdField}
                        options={getEntries(eVocabularySetID.eCaptureDataLightSourceType)}
                    />

                    <SelectField
                        viewMode
                        updated={isFieldUpdated(CaptureDataDetails, captureDataData, 'backgroundRemovalMethod')}
                        disabled={disabled}
                        label='Background Removal Method'
                        value={withDefaultValueNumber(CaptureDataDetails.backgroundRemovalMethod, getInitialEntry(eVocabularySetID.eCaptureDataBackgroundRemovalMethod))}
                        name='backgroundRemovalMethod'
                        onChange={setIdField}
                        options={getEntries(eVocabularySetID.eCaptureDataBackgroundRemovalMethod)}
                    />

                    <SelectField
                        viewMode
                        updated={isFieldUpdated(CaptureDataDetails, captureDataData, 'clusterType')}
                        disabled={disabled}
                        label='Cluster Type'
                        value={withDefaultValueNumber(CaptureDataDetails.clusterType, getInitialEntry(eVocabularySetID.eCaptureDataClusterType))}
                        name='clusterType'
                        onChange={setIdField}
                        options={getEntries(eVocabularySetID.eCaptureDataClusterType)}
                    />

                    <InputField
                        viewMode
                        updated={isFieldUpdated(CaptureDataDetails, captureDataData, 'clusterGeometryFieldId')}
                        disabled={disabled}
                        type='number'
                        label='Cluster Geometry Field ID'
                        value={CaptureDataDetails.clusterGeometryFieldId}
                        name='clusterGeometryFieldId'
                        onChange={setIdField}
                    />
                    <CheckboxField
                        viewMode
                        updated={isFieldUpdated(CaptureDataDetails, captureDataData, 'cameraSettingUniform')}
                        disabled={disabled}
                        required={false}
                        name='cameraSettingUniform'
                        label='Camera Settings Uniform'
                        value={CaptureDataDetails.cameraSettingUniform ?? false}
                        onChange={setCheckboxField}
                    />
                </Box>
            </Box>
        </Box>
    );
}

export default CaptureDataDetails;
