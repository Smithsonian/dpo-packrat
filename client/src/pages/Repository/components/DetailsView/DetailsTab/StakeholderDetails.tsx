/* eslint-disable react-hooks/exhaustive-deps */
/**
 * StakeholderDetails
 *
 * This component renders details tab for Stakeholder specific details used in DetailsTab component.
 */
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableRow } from '@material-ui/core';
import React, { useEffect } from 'react';
import { Loader } from '../../../../../components';
import { isFieldUpdated } from '../../../../../utils/repository';
import { DetailComponentProps } from './index';
import { eSystemObjectType } from '@dpo-packrat/common';
import { useDetailTabStore } from '../../../../../store';
import { DebounceInput } from 'react-debounce-input';
import { useStyles, updatedFieldStyling } from './CaptureDataDetails';
import clsx from 'clsx';

function StakeholderDetails(props: DetailComponentProps): React.ReactElement {
    const { data, loading, disabled, onUpdateDetail, objectType } = props;
    const classes = useStyles();
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
        <Box minWidth='fit-content' style={{ backgroundColor: 'rgb(236, 245, 253)', paddingTop: '5px', paddingBottom: '5px' }}>
            <TableContainer>
                <Table className={classes.table}>
                    <TableBody>
                        <TableRow>
                            <TableCell className={classes.tableCell}>
                                <Typography className={classes.labelText}>
                                    Organization Name
                                </Typography>
                            </TableCell>
                            <TableCell className={classes.tableCell}>
                                <DebounceInput
                                    element='input'
                                    title='OrganizationName-input'
                                    disabled={disabled}
                                    value={StakeholderDetails?.OrganizationName || ''}
                                    type='string'
                                    name='OrganizationName'
                                    onChange={onSetField}
                                    className={clsx(classes.input, classes.datasetFieldInput)}
                                    style={{ ...updatedFieldStyling(isFieldUpdated(StakeholderDetails, stakeholderData, 'OrganizationName')) }}
                                />
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className={classes.tableCell}>
                                <Typography className={classes.labelText}>
                                    Email Address
                                </Typography>
                            </TableCell>
                            <TableCell className={classes.tableCell}>
                                <DebounceInput
                                    element='input'
                                    title='EmailAddress-input'
                                    disabled={disabled}
                                    value={StakeholderDetails?.EmailAddress || ''}
                                    type='string'
                                    name='EmailAddress'
                                    onChange={onSetField}
                                    className={clsx(classes.input, classes.datasetFieldInput)}
                                    style={{ ...updatedFieldStyling(isFieldUpdated(StakeholderDetails, stakeholderData, 'EmailAddress')) }}
                                />
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className={classes.tableCell}>
                                <Typography className={classes.labelText}>
                                    Phone Number Mobile
                                </Typography>
                            </TableCell>
                            <TableCell className={classes.tableCell}>
                                <DebounceInput
                                    element='input'
                                    title='PhoneNumberMobile-input'
                                    disabled={disabled}
                                    value={StakeholderDetails?.PhoneNumberMobile || ''}
                                    type='string'
                                    name='PhoneNumberMobile'
                                    onChange={onSetField}
                                    className={clsx(classes.input, classes.datasetFieldInput)}
                                    style={{ ...updatedFieldStyling(isFieldUpdated(StakeholderDetails, stakeholderData, 'PhoneNumberMobile')) }}
                                />
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className={classes.tableCell}>
                                <Typography className={classes.labelText}>
                                    Phone Number Office
                                </Typography>
                            </TableCell>
                            <TableCell className={classes.tableCell}>
                                <DebounceInput
                                    element='input'
                                    title='PhoneNumberOffice-input'
                                    disabled={disabled}
                                    value={StakeholderDetails?.PhoneNumberOffice || ''}
                                    type='string'
                                    name='PhoneNumberOffice'
                                    onChange={onSetField}
                                    className={clsx(classes.input, classes.datasetFieldInput)}
                                    style={{ ...updatedFieldStyling(isFieldUpdated(StakeholderDetails, stakeholderData, 'PhoneNumberOffice')) }}
                                />
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className={classes.tableCell}>
                                <Typography className={classes.labelText}>
                                    Mailing Address
                                </Typography>
                            </TableCell>
                            <TableCell className={classes.tableCell}>
                                <DebounceInput
                                    element='input'
                                    title='MailingAddress-input'
                                    disabled={disabled}
                                    value={StakeholderDetails?.MailingAddress || ''}
                                    type='string'
                                    name='MailingAddress'
                                    onChange={onSetField}
                                    className={clsx(classes.input, classes.datasetFieldInput)}
                                    style={{ ...updatedFieldStyling(isFieldUpdated(StakeholderDetails, stakeholderData, 'MailingAddress')) }}
                                />
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}

export default StakeholderDetails;
