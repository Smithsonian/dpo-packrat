/* eslint-disable camelcase */

/**
 * This component is a link from AdminUsersList
 * Upon mounting/rendering, it will make a GraphQL request
 * to retrieve the appropriate user and render the information.
 *
 * Component also responsible for user-related updating and creating GraphQL mutations
 */

import Checkbox from '@material-ui/core/Checkbox';
import FormHelperText from '@material-ui/core/FormHelperText';
import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Select, MenuItem, InputLabel, FormControl } from '@material-ui/core';
import { extractISOMonthDateYear, formatISOToHoursMinutes } from '../../../constants/index';
import { useParams, useLocation, useHistory } from 'react-router';
import { useGetUserQuery, CreateUserDocument, UpdateUserDocument, GetAllUsersDocument, User_Status } from '../../../types/graphql';
import { apolloClient } from '../../../graphql/index';
import { makeStyles } from '@material-ui/core/styles';
import GenericBreadcrumbsView from '../../../components/shared/GenericBreadcrumbsView';
import { toast } from 'react-toastify';
import * as yup from 'yup';
import { useUsersStore } from '../../../store';
import { Helmet } from 'react-helmet';
import { DebounceInput } from 'react-debounce-input';

const useStyles = makeStyles(({ typography }) => ({
    container: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        overflow: 'auto',
        paddingLeft: '15px',
        margin: '0 auto'
    },
    formContainer: {
        display: 'flex',
        flexDirection: 'column',
        flexWrap: 'nowrap',
        width: '500px',
        backgroundColor: '#EFF2FC',
        borderRadius: '10px',
        border: '1px solid #B7D2E5CC',
        boxShadow: '0 0 0 5px #75B3DF',
        letterSpacing: 'var(--unnamed-character-spacing-0)',
        textAlign: 'left',
        padding: '5px',
        marginTop: '15px',
        marginLeft: '5px'

    },
    formLabel: {
        gridColumnStart: '1',
        fontSize: '0.8rem',
        color: 'black'
    },
    row: {
        minHeight: 30,
        display: 'grid',
        padding: '0px 5px',
        gridTemplateColumns: '40% 60%',
        gridGap: '10px',
        alignItems: 'center',
        '&:not(:last-child)': {
            borderBottom: '1px solid #D8E5EE'
        }
    },
    buttonGroup: {
        marginTop: '15px',
        // marginLeft: '20px',
        columnGap: 30,
        display: 'flex'
    },
    formField: {
        backgroundColor: 'white',
        borderRadius: '5px',
        border: '1px solid rgb(118,118,118)',
        width: '95%',
        fontWeight: typography.fontWeightRegular,
        fontFamily: typography.fontFamily,
        fontSize: '0.8rem',
        height: '20px'
    },
    AdminBreadCrumbsContainer: {
        display: 'flex',
        alignItems: 'center',
        minHeight: '46px',
        paddingLeft: '20px',
        paddingRight: '20px',
        background: '#ECF5FD',
        color: '#3F536E',
        width: 'fit-content'
    },
    styledBtn: {
        backgroundColor: '#3854d0',
        color: 'white',
        width: '90px',
        height: '30px',
        outline: '2px hidden #8DABC4',
        '& :focus': {
            outline: '2px solid #8DABC4',
        }
    },
    select: {
        width: '60%',
        minWidth: 'fit-content',
        height: '24px',
        padding: '0px 5px',
        fontWeight: typography.fontWeightRegular,
        fontFamily: typography.fontFamily,
        fontSize: '0.8rem',
        color: 'black',
        borderRadius: 5,
        border: '1px solid rgb(118,118,118)',
        backgroundColor: 'white'
    }
}));

function AdminUserForm(): React.ReactElement {
    const classes = useStyles();
    const history = useHistory();
    const parameters: { idUser: string } = useParams();
    const { idUser } = parameters;
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [active, setActive] = useState<boolean>(true);
    const [dateActivated, setDateActivated] = useState('');
    const [dateDisabled, setDateDisabled] = useState<string | null>('');
    const [workflowNotificationType, setWorkflowNotificationType] = useState<number | null | undefined>(undefined);
    const [workflowNotificationTime, setWorkflowNotificationTime] = useState<string | null | undefined>('17:00');
    const [validNameInput, setValidNameInput] = useState<boolean | null>(null);
    const [validEmailInput, setValidEmailInput] = useState<boolean | null>(null);
    const updateUsersEntries = useUsersStore(state => state.updateUsersEntries);

    const location = useLocation();
    const create: boolean = idUser === 'create';

    const schema = yup.object().shape({
        fullName: yup.string().min(1),
        email: yup.string().email().min(1)
    });

    const request = useGetUserQuery({
        fetchPolicy: 'no-cache',
        variables: {
            input: {
                idUser: Number(idUser)
            }
        }
    });

    const fetchedUser = request.data?.getUser.User;

    useEffect(() => {
        if (fetchedUser) {
            setName(fetchedUser?.Name);
            setEmail(fetchedUser?.EmailAddress);
            setActive(fetchedUser?.Active);
            setDateActivated(fetchedUser?.DateActivated);
            setDateDisabled(fetchedUser?.DateDisabled);
            setWorkflowNotificationType(fetchedUser?.EmailSettings);
            setWorkflowNotificationTime(formatISOToHoursMinutes(fetchedUser?.WorkflowNotificationTime));
        }
    }, [fetchedUser]);

    const validateFields = async (): Promise<boolean | void> => {
        try {
            const validNameResponse = await schema.isValid({ fullName: name });
            setValidNameInput(validNameResponse);
            const validEmailResponse = await schema.isValid({ email });
            setValidEmailInput(validEmailResponse);
            return validNameResponse && validEmailResponse;
        } catch (error) {
            const message: string = (error instanceof Error) ? error.message : 'Validation Failure';
            toast.warn(message);
        }
    };

    const updateWorkflowNotificationType = (e) => setWorkflowNotificationType(e.target.value >= 0 ? e.target.value : null);

    const updateExistingUser = async () => {
        const validUpdate = await validateFields();
        if (!validUpdate) {
            toast.warn('Update Failed. Please double-check your form inputs');
            return;
        }
        const manipulatedTime = new Date();
        const newHours = workflowNotificationTime?.slice(0, 2);
        const newMinutes = workflowNotificationTime?.slice(3);
        manipulatedTime.setHours(Number(newHours));
        manipulatedTime.setMinutes(Number(newMinutes));
        try {
            const { data } = await apolloClient.mutate({
                mutation: UpdateUserDocument,
                variables: {
                    input: {
                        idUser: Number(idUser),
                        EmailAddress: email,
                        Name: name,
                        Active: active,
                        EmailSettings: workflowNotificationType,
                        WorkflowNotificationTime: manipulatedTime
                    }
                },
                refetchQueries: [{ query: GetAllUsersDocument, variables: { input: { active: User_Status.EAll, search: '' } } }],
                awaitRefetchQueries: true
            });
            await updateUsersEntries();
            if (data?.updateUser) {
                toast.success('User updated successfully');
                history.push('/admin/users');
            } else {
                throw new Error('Update request returned success: false');
            }
        } catch (error) {
            toast.error(`Failed to update user: error ${error}`);
        }
    };

    const createNewUser = async () => {
        const validCreate = await validateFields();
        if (!validCreate) {
            toast.warn('Creation Failed. Please double-check your form inputs');
            return;
        }

        try {
            console.log('notificationType', workflowNotificationType);
            const { data } = await apolloClient.mutate({
                mutation: CreateUserDocument,
                variables: {
                    input: {
                        EmailAddress: email,
                        Name: name,
                        EmailSettings: workflowNotificationType
                    }
                },
                refetchQueries: [{ query: GetAllUsersDocument, variables: { input: { active: User_Status.EAll, search: '' } } }],
                awaitRefetchQueries: true
            });
            updateUsersEntries();
            if (data?.createUser) {
                toast.success('User created successfully');
                history.push('/admin/users');
            } else {
                throw new Error('Create request returned success: false');
            }
        } catch (error) {
            toast.error(`Failed to create user: error ${error}`);
        }
    };

    return (
        <Box className={classes.container}>
            <Helmet>
                <title>Create User</title>
            </Helmet>
            <Box className={classes.AdminBreadCrumbsContainer}>
                <GenericBreadcrumbsView items={location.pathname.slice(1)} end={create ? null : `${fetchedUser?.Name} <${fetchedUser?.EmailAddress}>`} />
            </Box>
            <Box className={classes.formContainer}>
                <Box className={classes.row}>
                    <InputLabel htmlFor='userName' className={classes.formLabel}>Name</InputLabel>
                    <FormControl>
                        <DebounceInput
                            id='userName'
                            className={classes.formField}
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />
                        {validNameInput === false && <FormHelperText style={{ backgroundColor: '#EFF2FC', color: '#f44336' }}>Required</FormHelperText>}
                    </FormControl>
                </Box>
                <Box className={classes.row}>
                    <InputLabel htmlFor='userEmail' className={classes.formLabel}>Email Address</InputLabel>
                    <FormControl>
                        <DebounceInput
                            id='userEmail'
                            className={classes.formField}
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                        {validEmailInput === false && <FormHelperText style={{ backgroundColor: '#EFF2FC', color: '#f44336' }}>Required</FormHelperText>}
                    </FormControl>
                </Box>
                <Box className={classes.row}>
                    <InputLabel htmlFor='userActive' className={classes.formLabel}>Active</InputLabel>
                    <Checkbox
                        id='userActive'
                        style={{ width: '0px', height: '0px' }}
                        color='primary'
                        checked={active}
                        onChange={() => setActive(!active)}
                        size='small'
                    />
                </Box>
                <Box className={classes.row}>
                    <InputLabel htmlFor='dateActivated' className={classes.formLabel}>Date Activated</InputLabel>
                    {!dateActivated ? (
                        <TextField
                            id='dateActivated'
                            style={{ maxWidth: '50%', alignSelf: 'flex-end', paddingBottom: 4 }}
                            disabled
                            inputProps={{ style: { fontSize: '0.8rem' } }}

                        />
                    ) : (
                        <TextField
                            id='dateActivated'
                            style={{ maxWidth: '50%', alignSelf: 'flex-end', paddingBottom: 4 }}
                            type='date'
                            disabled
                            onChange={e => {
                                setDateActivated(e.target.value);
                            }}
                            value={extractISOMonthDateYear(dateActivated, true)}
                            inputProps={{ style: { fontSize: '0.8rem' } }}
                        />
                    )}
                </Box>
                <Box className={classes.row}>
                    <InputLabel htmlFor='dateDisabled' className={classes.formLabel}>Date Disabled</InputLabel>
                    {!dateDisabled ? (
                        <TextField
                            id='dateDisabled'
                            style={{ maxWidth: '50%', alignSelf: 'flex-end', paddingBottom: 4 }}
                            disabled
                            inputProps={{ style: { fontSize: '0.8rem' } }}
                        />
                    ) : (
                        <TextField
                            id='dateDisabled'
                            style={{ maxWidth: '50%', alignSelf: 'flex-end', paddingBottom: 4 }}
                            type='date'
                            disabled
                            onChange={e => {
                                setDateDisabled(e.target.value);
                            }}
                            value={extractISOMonthDateYear(dateDisabled, true)}
                            inputProps={{ style: { fontSize: '0.8rem' } }}

                        />
                    )}
                </Box>
                <Box className={classes.row}>
                    <InputLabel htmlFor='notificationType' className={classes.formLabel}>Workflow Notification Type</InputLabel>
                    <Select
                        id='notificationType'
                        value={typeof workflowNotificationType === 'number' ? workflowNotificationType : -1}
                        className={classes.select}
                        disableUnderline
                        inputProps={{ 'aria-label': 'notificationTypeSelect' }}
                        onChange={updateWorkflowNotificationType}
                    >
                        <MenuItem value={-1}>(No Selection)</MenuItem>
                        <MenuItem value={0}>Daily Digest</MenuItem>
                        <MenuItem value={1}>Immediately</MenuItem>
                    </Select>
                </Box>
                <Box className={classes.row}>
                    <InputLabel htmlFor='notificationTime' className={classes.formLabel}>Workflow Notification Time</InputLabel>
                    <TextField
                        id='notificationTime'
                        disabled={workflowNotificationType === 0 ? false : true}
                        type='time'
                        size='small'
                        style={{ width: '50%', alignSelf: 'flex-end', paddingBottom: 4 }}
                        value={workflowNotificationTime}
                        inputProps={{
                            step: 300,
                            style: { fontSize: '0.8rem' }
                        }}
                        InputLabelProps={{
                            shrink: true,
                        }}
                        onChange={e => {
                            if (e.target.value) {
                                setWorkflowNotificationTime(e.target.value);
                            }
                        }}
                    />
                </Box>
            </Box>
            <Box className={classes.buttonGroup}>
                {create ? (
                    <Button variant='contained' className={classes.styledBtn} onClick={createNewUser} disableElevation>
                        Create
                    </Button>
                ) : (
                    <Button variant='contained' className={classes.styledBtn} onClick={updateExistingUser} disableElevation>
                        Update
                    </Button>
                )}
                <Button variant='contained' className={classes.styledBtn} onClick={() => history.push('/admin/users')} disableElevation>
                    Cancel
                </Button>
            </Box>
        </Box>
    );
}

export default AdminUserForm;
