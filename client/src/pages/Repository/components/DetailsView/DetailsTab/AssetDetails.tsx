/* eslint-disable react-hooks/exhaustive-deps */
/**
 * AssetDetails
 *
 * This component renders details tab for Asset specific details used in DetailsTab component.
 */
import { Box } from '@material-ui/core';
import React, { useEffect } from 'react';
import { InputField, Loader, SelectField } from '../../../../../components';
import { useVocabularyStore } from '../../../../../store';
import { eVocabularySetID, eSystemObjectType } from '../../../../../types/server';
import { isFieldUpdated } from '../../../../../utils/repository';
import { withDefaultValueNumber } from '../../../../../utils/shared';
import { DetailComponentProps } from './index';
import { useDetailTabStore } from '../../../../../store';

function AssetDetails(props: DetailComponentProps): React.ReactElement {
    const { data, loading, disabled, onUpdateDetail, objectType } = props;
    const [getEntries, getInitialEntry] = useVocabularyStore(state => [state.getEntries, state.getInitialEntry]);
    const [AssetDetails, updateDetailField] = useDetailTabStore(state => [state.AssetDetails, state.updateDetailField]);

    useEffect(() => {
        onUpdateDetail(objectType, AssetDetails);
    }, [AssetDetails]);

    if (!data || loading) {
        return <Loader minHeight='15vh' />;
    }

    const onSetField = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        updateDetailField(eSystemObjectType.eAsset, name, value);
    };

    const setIdField = ({ target }): void => {
        const { name, value } = target;
        let idFieldValue: number | null = null;

        if (value) {
            idFieldValue = Number.parseInt(value, 10);
        }

        updateDetailField(eSystemObjectType.eAsset, name, idFieldValue);
    };

    const assetData = data.getDetailsTabDataForObject?.Asset;

    return (
        <Box>
            <SelectField
                required
                viewMode
                updated={isFieldUpdated(AssetDetails, assetData, 'AssetType')}
                disabled={disabled}
                label='Asset Type'
                value={withDefaultValueNumber(AssetDetails.AssetType as never, getInitialEntry(eVocabularySetID.eAssetAssetType))}
                name='AssetType'
                onChange={setIdField}
                options={getEntries(eVocabularySetID.eAssetAssetType)}
            />
            <InputField
                viewMode
                required
                updated={isFieldUpdated(AssetDetails, assetData, 'FilePath')}
                disabled={disabled}
                label='FilePath'
                value={AssetDetails?.FilePath}
                name='FilePath'
                onChange={onSetField}
            />
        </Box>
    );
}

export default AssetDetails;
