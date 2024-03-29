/* eslint-disable react-hooks/exhaustive-deps */
/**
 * AssetDetails
 *
 * This component renders details tab for Asset specific details used in DetailsTab component.
 */
import { Box } from '@material-ui/core';
import React, { useEffect } from 'react';
import { Loader, SelectField } from '../../../../../components';
import { useVocabularyStore } from '../../../../../store';
import { eVocabularySetID, eSystemObjectType } from '@dpo-packrat/common';
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
        <Box style={{ backgroundColor: 'rgb(236, 245, 253)' }}>
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
                valueLeftAligned
                gridLabel={2}
                padding='5px 10px'
                selectFitContent
            />
        </Box>

    );
}

export default AssetDetails;
