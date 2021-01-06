/* eslint-disable react-hooks/exhaustive-deps */
/**
 * StakeholderDetails
 *
 * This component renders details tab for Stakeholder specific details used in DetailsTab component.
 */
import { Box } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import { InputField, Loader } from '../../../../../components';
import { StakeholderDetailFields } from '../../../../../types/graphql';
import { DetailComponentProps } from './index';

function StakeholderDetails(props: DetailComponentProps): React.ReactElement {
    const { data, loading, disabled, onUpdateDetail, objectType } = props;

    const [details, setDetails] = useState<StakeholderDetailFields>({});

    useEffect(() => {
        onUpdateDetail(objectType, details);
    }, [details]);

    useEffect(() => {
        if (data && !loading) {
            const { Stakeholder } = data.getDetailsTabDataForObject;
            setDetails({
                OrganizationName: Stakeholder?.OrganizationName,
                EmailAddress: Stakeholder?.EmailAddress,
                PhoneNumberMobile: Stakeholder?.PhoneNumberMobile,
                PhoneNumberOffice: Stakeholder?.PhoneNumberOffice,
                MailingAddress: Stakeholder?.MailingAddress,
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
                label='OrganizationName'
                value={details?.OrganizationName}
                name='OrganizationName'
                onChange={onSetField}
            />
            <InputField
                viewMode
                required
                disabled={disabled}
                label='EmailAddress'
                value={details?.EmailAddress}
                name='EmailAddress'
                onChange={onSetField}
            />
            <InputField
                viewMode
                required
                disabled={disabled}
                label='PhoneNumberMobile'
                value={details?.PhoneNumberMobile}
                name='PhoneNumberMobile'
                onChange={onSetField}
            />
            <InputField
                viewMode
                required
                disabled={disabled}
                label='PhoneNumberOffice'
                value={details?.PhoneNumberOffice}
                name='PhoneNumberOffice'
                onChange={onSetField}
            />
            <InputField
                viewMode
                required
                disabled={disabled}
                label='MailingAddress'
                value={details?.MailingAddress}
                name='MailingAddress'
                onChange={onSetField}
            />
        </Box>
    );
}

export default StakeholderDetails;