/* eslint-disable react-hooks/exhaustive-deps */
/**
 * AssetDetails
 *
 * This component renders details tab for Asset specific details used in DetailsTab component.
 */
import { Box } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import { InputField, Loader, SelectField } from '../../../../../components';
import { useVocabularyStore } from '../../../../../store';
import { AssetDetailFields } from '../../../../../types/graphql';
import { eVocabularySetID } from '../../../../../types/server';
import { isFieldUpdated } from '../../../../../utils/repository';
import { withDefaultValueNumber } from '../../../../../utils/shared';
import { DetailComponentProps } from './index';

function AssetDetails(props: DetailComponentProps): React.ReactElement {
    const { data, loading, disabled, onUpdateDetail, objectType } = props;

    const [details, setDetails] = useState<AssetDetailFields>({});
    const [getEntries, getInitialEntry] = useVocabularyStore(state => [state.getEntries, state.getInitialEntry]);

    useEffect(() => {
        if (data && !loading) {
            const { Asset } = data.getDetailsTabDataForObject;
            setDetails({
                FilePath: Asset?.FilePath,
                AssetType: Asset?.AssetType
            });
        }
    }, [data, loading]);

    useEffect(() => {
        onUpdateDetail(objectType, details);
    }, [details]);

    if (!data || loading) {
        return <Loader minHeight='15vh' />;
    }

    const onSetField = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setDetails(details => ({ ...details, [name]: value }));
    };

    const setIdField = ({ target }): void => {
        const { name, value } = target;
        let idFieldValue: number | null = null;

        if (value) {
            idFieldValue = Number.parseInt(value, 10);
        }

        setDetails(details => ({ ...details, [name]: idFieldValue }));
    };

    const assetData = data.getDetailsTabDataForObject?.Asset;

    return (
        <Box>
            <SelectField
                required
                viewMode
                updated={isFieldUpdated(details, assetData, 'AssetType')}
                disabled={disabled}
                label='Asset Type'
                value={withDefaultValueNumber(details?.AssetType as never, getInitialEntry(eVocabularySetID.eAssetAssetType))}
                name='AssetType'
                onChange={setIdField}
                options={getEntries(eVocabularySetID.eAssetAssetType)}
            />
            <InputField
                viewMode
                required
                updated={isFieldUpdated(details, assetData, 'FilePath')}
                disabled={disabled}
                label='FilePath'
                value={details?.FilePath}
                name='FilePath'
                onChange={onSetField}
            />
        </Box>
    );
}

export default AssetDetails;