/**
 * AssetDetails
 *
 * This component renders details tab for Asset specific details used in DetailsTab component.
 */
import { Box } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import { InputField, Loader, SelectField } from '../../../../../components';
import { useVocabularyStore } from '../../../../../store';
import { GetDetailsTabDataForObjectQueryResult } from '../../../../../types/graphql';
import { eVocabularySetID } from '../../../../../types/server';
import { withDefaultValueNumber } from '../../../../../utils/shared';

interface AssetDetailsProps extends GetDetailsTabDataForObjectQueryResult {
    disabled: boolean;
}

interface AssetDetailsFields {
    FilePath?: string | null;
    AssetType?: number | null;
}

function AssetDetails(props: AssetDetailsProps): React.ReactElement {
    const { data, loading, disabled, } = props;

    const [details, setDetails] = useState<AssetDetailsFields>({});
    const [getEntries, getInitialEntry] = useVocabularyStore(state => [state.getEntries, state.getInitialEntry]);

    useEffect(() => {
        if (data && !loading) {
            const { Asset } = data.getDetailsTabDataForObject;
            setDetails({
                FilePath: Asset?.FilePath,
                AssetType: Asset?.VAssetType?.idVocabulary
            });
        }
    }, [data, loading]);

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

    return (
        <Box>
            <SelectField
                required
                viewMode
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