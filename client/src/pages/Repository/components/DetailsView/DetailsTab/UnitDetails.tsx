/**
 * UnitDetails
 *
 * This component renders details tab for Unit specific details used in DetailsTab component.
 */
import { Box } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import { Loader, InputField } from '../../../../../components';
import { GetDetailsTabDataForObjectQueryResult } from '../../../../../types/graphql';

interface UnitDetailsProps extends GetDetailsTabDataForObjectQueryResult {
    disabled: boolean;
}

interface UnitDetailsFields {
    Abbreviation?: string | null;
    ARKPrefix?: string | null;
}

function UnitDetails(props: UnitDetailsProps): React.ReactElement {
    const { data, loading, disabled } = props;
    const [details, setDetails] = useState<UnitDetailsFields>({});

    useEffect(() => {
        if (data && !loading) {
            const { Unit } = data.getDetailsTabDataForObject;
            setDetails({
                Abbreviation: Unit?.Abbreviation,
                ARKPrefix: Unit?.ARKPrefix
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

    return (
        <Box>
            <InputField
                viewMode
                required
                disabled={disabled}
                label='Abbreviation'
                value={details?.Abbreviation}
                name='Abbreviation'
                onChange={onSetField}
            />
            <InputField
                viewMode
                required
                disabled={disabled}
                label='ARKPrefix'
                value={details?.ARKPrefix}
                name='ARKPrefix'
                onChange={onSetField}
            />
        </Box>
    );
}

export default UnitDetails;