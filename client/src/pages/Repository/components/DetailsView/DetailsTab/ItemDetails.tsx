/* eslint-disable react-hooks/exhaustive-deps */
/**
 * ItemDetails
 *
 * This component renders details tab for Item specific details used in DetailsTab component.
 */
import { Box } from '@material-ui/core';
import React, { useEffect } from 'react';
import { CheckboxField, Loader } from '../../../../../components';
import { SubjectDetailFields } from '../../../../../types/graphql';
import { isFieldUpdated } from '../../../../../utils/repository';
import { DetailComponentProps } from './index';
import { SubjectFields } from './SubjectDetails';
import { eSystemObjectType } from '../../../../../types/server';
import { useDetailTabStore } from '../../../../../store';

export interface ItemDetailFields extends SubjectDetailFields {
    EntireSubject?: boolean | null | undefined;
}

function ItemDetails(props: DetailComponentProps): React.ReactElement {
    const { data, loading, disabled, onUpdateDetail, objectType } = props;
    const [ItemDetails, updateDetailField] = useDetailTabStore(state => [state.ItemDetails, state.updateDetailField]);

    useEffect(() => {
        onUpdateDetail(objectType, ItemDetails);
    }, [ItemDetails]);

    if (!data || loading) {
        return <Loader minHeight='15vh' />;
    }

    const onSetField = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;

        updateDetailField(eSystemObjectType.eItem, name, value);
    };

    const setCheckboxField = ({ target }): void => {
        const { name, checked } = target;
        updateDetailField(eSystemObjectType.eItem, name, checked);
    };

    const itemData = data.getDetailsTabDataForObject?.Item;

    return (
        <Box style={{ backgroundColor: 'rgb(236, 245, 253)' }}>
            <CheckboxField
                viewMode
                required
                updated={isFieldUpdated(ItemDetails, itemData, 'EntireSubject')}
                disabled={disabled}
                name='EntireSubject'
                label='Entire Subject'
                value={ItemDetails?.EntireSubject ?? false}
                onChange={setCheckboxField}
                valueLeftAligned
                gridLabel={2}
                padding='5px 10px 1px 10px'
            />
            <SubjectFields
                {...ItemDetails}
                originalFields={itemData}
                disabled={disabled}
                onChange={onSetField}
                noTopPadding
            />
        </Box>
    );
}

export default ItemDetails;
