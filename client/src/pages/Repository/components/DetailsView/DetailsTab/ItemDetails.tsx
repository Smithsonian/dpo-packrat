/**
 * ItemDetails
 *
 * This component renders details tab for Item specific details used in DetailsTab component.
 */
import { Box } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import { CheckboxField, Loader } from '../../../../../components';
import { GetDetailsTabDataForObjectQueryResult, SubjectDetailFields } from '../../../../../types/graphql';
import { SubjectFields } from './SubjectDetails';

interface ItemDetailsProps extends GetDetailsTabDataForObjectQueryResult {
    disabled: boolean;
}

interface ItemDetailFields extends SubjectDetailFields {
    EntireSubject?: boolean | null | undefined;
}

function ItemDetails(props: ItemDetailsProps): React.ReactElement {
    const { data, loading, disabled, } = props;

    const [details, setDetails] = useState<ItemDetailFields>({});

    useEffect(() => {
        if (data && !loading) {
            const { Item } = data.getDetailsTabDataForObject;
            setDetails({
                EntireSubject: Item?.EntireSubject,
                Latitude: Item?.Latitude,
                Longitude: Item?.Longitude,
                Altitude: Item?.Altitude,
                TS0: Item?.TS0,
                TS1: Item?.TS1,
                TS2: Item?.TS2,
                R0: Item?.R0,
                R1: Item?.R1,
                R2: Item?.R2,
                R3: Item?.R3
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

    const setCheckboxField = ({ target }): void => {
        const { name, checked } = target;
        setDetails(details => ({ ...details, [name]: checked }));
    };

    return (
        <Box>
            <CheckboxField
                viewMode
                required
                disabled={disabled}
                name='EntireSubject'
                label='Entire Subject'
                value={details?.EntireSubject ?? false}
                onChange={setCheckboxField}
            />
            <SubjectFields {...details} disabled={disabled} onChange={onSetField} />
        </Box>
    );
}

export default ItemDetails;