/* eslint-disable react-hooks/exhaustive-deps */
/**
 * StakeholderDetails
 *
 * This component renders details tab for Stakeholder specific details used in DetailsTab component.
 */
import { Box } from '@material-ui/core';
import React, { useEffect } from 'react';
import { InputField, Loader } from '../../../../../components';
import { isFieldUpdated } from '../../../../../utils/repository';
import { DetailComponentProps } from './index';
import { eSystemObjectType } from '../../../../../types/server';
import { useDetailTabStore } from '../../../../../store';

function StakeholderDetails(props: DetailComponentProps): React.ReactElement {
    const { data, loading, disabled, onUpdateDetail, objectType } = props;
    const [StakeholderDetails, updateDetailField] = useDetailTabStore(state => [state.StakeholderDetails, state.updateDetailField]);

    useEffect(() => {
        onUpdateDetail(objectType, StakeholderDetails);
    }, [StakeholderDetails]);

    if (!data || loading) {
        return <Loader minHeight='15vh' />;
    }

    const onSetField = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        updateDetailField(eSystemObjectType.eStakeholder, name, value);
    };

    const stakeholderData = data.getDetailsTabDataForObject?.Stakeholder;

    return (
        <Box>
            <InputField
                viewMode
                required
                updated={isFieldUpdated(StakeholderDetails, stakeholderData, 'OrganizationName')}
                disabled={disabled}
                label='OrganizationName'
                value={StakeholderDetails?.OrganizationName}
                name='OrganizationName'
                onChange={onSetField}
            />
            <InputField
                viewMode
                required
                updated={isFieldUpdated(StakeholderDetails, stakeholderData, 'EmailAddress')}
                disabled={disabled}
                label='EmailAddress'
                value={StakeholderDetails?.EmailAddress}
                name='EmailAddress'
                onChange={onSetField}
            />
            <InputField
                viewMode
                required
                updated={isFieldUpdated(StakeholderDetails, stakeholderData, 'PhoneNumberMobile')}
                disabled={disabled}
                label='PhoneNumberMobile'
                value={StakeholderDetails?.PhoneNumberMobile}
                name='PhoneNumberMobile'
                onChange={onSetField}
            />
            <InputField
                viewMode
                required
                updated={isFieldUpdated(StakeholderDetails, stakeholderData, 'PhoneNumberOffice')}
                disabled={disabled}
                label='PhoneNumberOffice'
                value={StakeholderDetails?.PhoneNumberOffice}
                name='PhoneNumberOffice'
                onChange={onSetField}
            />
            <InputField
                viewMode
                required
                updated={isFieldUpdated(StakeholderDetails, stakeholderData, 'MailingAddress')}
                disabled={disabled}
                label='MailingAddress'
                value={StakeholderDetails?.MailingAddress}
                name='MailingAddress'
                onChange={onSetField}
            />
        </Box>
    );
}

export default StakeholderDetails;
