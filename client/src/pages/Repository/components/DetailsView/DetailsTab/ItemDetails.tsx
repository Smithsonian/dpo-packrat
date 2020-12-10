/**
 * ItemDetails
 *
 * This component renders details tab for Item specific details used in DetailsTab component.
 */
import React from 'react';
import { Loader } from '../../../../../components';
import { GetDetailsTabDataForObjectQueryResult } from '../../../../../types/graphql';

interface ItemDetailsProps extends GetDetailsTabDataForObjectQueryResult {
    disabled: boolean;
}

function ItemDetails(props: ItemDetailsProps): React.ReactElement {
    const { data, loading } = props;

    if (!data || loading) {
        return <Loader minHeight='15vh' />;
    }

    return <span>Item Details</span>;
}

export default ItemDetails;