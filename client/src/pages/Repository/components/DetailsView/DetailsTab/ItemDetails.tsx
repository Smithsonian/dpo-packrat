/**
 * ItemDetails
 *
 * This component renders details tab for Item specific details used in DetailsTab component.
 */
import { Box } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import { CheckboxField, Loader } from '../../../../../components';
import { GetDetailsTabDataForObjectQueryResult } from '../../../../../types/graphql';
import { SubjectDetailsFields, SubjectFields } from './SubjectDetails';

interface ItemDetailsProps extends GetDetailsTabDataForObjectQueryResult {
    disabled: boolean;
}

interface ItemDetailsFields extends SubjectDetailsFields {
    EntireSubject?: boolean;
}

function ItemDetails(props: ItemDetailsProps): React.ReactElement {
    const { data, loading, disabled, } = props;

    const [details, setDetails] = useState<ItemDetailsFields>({});

    useEffect(() => {
        if (data && !loading) {
            const { Item } = data.getDetailsTabDataForObject;
            setDetails({
                EntireSubject: Item?.EntireSubject,
                Latitude: Item?.GeoLocation?.Latitude,
                Longitude: Item?.GeoLocation?.Longitude,
                Altitude: Item?.GeoLocation?.Altitude,
                TS0: Item?.GeoLocation?.TS0,
                TS1: Item?.GeoLocation?.TS1,
                TS2: Item?.GeoLocation?.TS2,
                R0: Item?.GeoLocation?.R0,
                R1: Item?.GeoLocation?.R1,
                R2: Item?.GeoLocation?.R2,
                R3: Item?.GeoLocation?.R3
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