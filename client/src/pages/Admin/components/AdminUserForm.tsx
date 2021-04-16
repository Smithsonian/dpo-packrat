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
import { Box } from '@material-ui/core';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import { extractISOMonthDateYear, formatISOToHoursMinutes } from '../../../constants/index';
import { useParams, useLocation, useHistory } from 'react-router';
import { Link } from 'react-router-dom';
import { useGetUserQuery, CreateUserDocument, UpdateUserDocument, GetAllUsersDocument, User_Status } from '../../../types/graphql';
import { apolloClient } from '../../../graphql/index';
import { makeStyles } from '@material-ui/core/styles';
import GenericBreadcrumbsView from '../../../components/shared/GenericBreadcrumbsView';
import { toast } from 'react-toastify';
import * as yup from 'yup';

const useStyles = makeStyles({
    AdminUsersViewContainer: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        overflow: 'auto',
        maxHeight: 'calc(100vh - 60px)',
        paddingLeft: '1%',
        width: '1200px',
        margin: '0 auto'
    },
    formControl: {
        minWidth: 120
    },
    AdminUserFormContainer: {
        display: 'flex',
        flexDirection: 'column',
        flexWrap: 'nowrap',
        width: '500px',
        backgroundColor: '#EFF2FC',
        borderRadius: '4px',
        border: '1px solid #B7D2E5CC',
        boxShadow: '0 0 0 15px #75B3DF',
        letterSpacing: 'var(--unnamed-character-spacing-0)',
        textAlign: 'left',
        padding: '10px 20px',
        marginTop: '2%',
        marginLeft: '1%'
    },
    AdminUserFormRowLabel: {
        gridColumnStart: '1'
    },
    AdminUserFormRowInput: {
        gridColumnStart: '2'
    },
    AdminUserFormRow: {
        display: 'grid',
        gridTemplateColumns: '40% 60%',
        gridGap: '10px',
        alignItems: 'center',
        '&:not(:last-child)': {
            borderBottom: '1px solid #D8E5EE'
        }
    },
    AdminUserFormButtonGroup: {
        marginTop: '30px',
        '& Button': {
            marginRight: '30px'
        }
    },
    formField: {
        backgroundColor: 'white',
        borderRadius: '4px'
    },
    AdminBreadCrumbsContainer: {
        display: 'flex',
        alignItems: 'center',
        minHeight: '46px',
        paddingLeft: '20px',
        paddingRight: '20px',
        background: '#0079C482',
        color: '#3F536E',
        marginBottom: '2%',
        width: 'fit-content'
    },
    searchUsersFilterButton: {
        backgroundColor: '#687DDB',
        color: 'white',
        width: '90px',
        height: '30px'
    }
});

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

    // Performs graphql query to retrieve user information
    // if query returns user info,
    // redirect to adminuserform
    // else
    // redirect to users
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
            toast.warn(error);
        }
    };

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

        await apolloClient.mutate({
            mutation: UpdateUserDocument,
            variables: {
                input: {
                    idUser: Number(idUser),
                    EmailAddress: email,
                    Name: name,
                    Active: active,
                    EmailSettings: Number(workflowNotificationType),
                    WorkflowNotificationTime: manipulatedTime
                }
            },
            refetchQueries: [{ query: GetAllUsersDocument, variables: { input: { active: User_Status.EAll, search: '' } } }],
            awaitRefetchQueries: true
        });
        history.push('/admin/users');
    };

    const createNewUser = async () => {
        const validCreate = await validateFields();
        if (!validCreate) {
            toast.warn('Creation Failed. Please be sure to include a name and email');
            return;
        }

        await apolloClient.mutate({
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
        history.push('/admin/users');
    };

    return (
        <Box className={classes.AdminUsersViewContainer}>
            {/* {!create && <Redirect to={resolveSubRoute(ADMIN_ROUTE.TYPE, ADMIN_ROUTE.ROUTES.USERS)} />} */}
            <Box className={classes.AdminBreadCrumbsContainer}>
                <GenericBreadcrumbsView items={location.pathname.slice(1)} end={create ? null : `${fetchedUser?.Name} <${fetchedUser?.EmailAddress}>`} />
            </Box>
            <Box className={classes.AdminUserFormContainer}>
                <Box className={classes.AdminUserFormRow}>
                    <p className={classes.AdminUserFormRowLabel}>Name</p>
                    <FormControl variant='outlined'>
                        {validNameInput !== false ? (
                            <TextField
                                className={classes.formField}
                                style={{ width: '270px' }}
                                variant='outlined'
                                size='small'
                                value={name}
                                onChange={e => {
                                    setName(e.target.value);
                                }}
                                InputLabelProps={{
                                    shrink: true
                                }}
                            />
                        ) : (
                            <React.Fragment>
                                <TextField
                                    error
                                    className={classes.formField}
                                    style={{ width: '270px' }}
                                    variant='outlined'
                                    size='small'
                                    value={name}
                                    onChange={e => {
                                        setName(e.target.value);
                                    }}
                                    InputLabelProps={{
                                        shrink: true
                                    }}
                                />
                                <FormHelperText style={{ backgroundColor: '#EFF2FC', color: '#f44336' }}>Required</FormHelperText>
                            </React.Fragment>
                        )}
                    </FormControl>
                </Box>
                <Box className={classes.AdminUserFormRow}>
                    <p className={classes.AdminUserFormRowLabel}>Email Address</p>
                    <FormControl variant='outlined'>
                        {validEmailInput !== false ? (
                            <TextField
                                className={classes.formField}
                                style={{ width: '270px' }}
                                variant='outlined'
                                size='small'
                                value={email}
                                onChange={e => {
                                    setEmail(e.target.value);
                                }}
                            />
                        ) : (
                            <React.Fragment>
                                <TextField
                                    error
                                    className={classes.formField}
                                    style={{ width: '270px' }}
                                    variant='outlined'
                                    size='small'
                                    value={email}
                                    onChange={e => {
                                        setEmail(e.target.value);
                                    }}
                                />
                                <FormHelperText style={{ backgroundColor: '#EFF2FC', color: '#f44336' }}>Required</FormHelperText>
                            </React.Fragment>
                        )}
                    </FormControl>
                </Box>
                <Box className={classes.AdminUserFormRow}>
                    <p className={classes.AdminUserFormRowLabel}>Active</p>
                    <Checkbox
                        style={{ width: '10px', height: '10px' }}
                        color='primary'
                        checked={active}
                        onChange={() => {
                            setActive(!active);
                        }}
                    />
                </Box>
                <Box className={classes.AdminUserFormRow}>
                    <p className={classes.AdminUserFormRowLabel}>Date Activated</p>
                    <FormControl variant='outlined'>
                        {!dateActivated ? (
                            <TextField style={{ maxWidth: '180px' }} variant='outlined' size='small' disabled />
                        ) : (
                            <TextField
                                style={{ maxWidth: '180px' }}
                                variant='outlined'
                                type='date'
                                size='small'
                                disabled
                                onChange={e => {
                                    setDateActivated(e.target.value);
                                }}
                                value={extractISOMonthDateYear(dateActivated, true)}
                            />
                        )}
                    </FormControl>
                </Box>
                <Box className={classes.AdminUserFormRow}>
                    <p className={classes.AdminUserFormRowLabel}>Date Disabled</p>
                    <FormControl variant='outlined'>
                        {!dateDisabled ? (
                            <TextField style={{ maxWidth: '180px' }} variant='outlined' size='small' disabled />
                        ) : (
                            <TextField
                                style={{ maxWidth: '180px' }}
                                variant='outlined'
                                type='date'
                                size='small'
                                disabled
                                onChange={e => {
                                    setDateDisabled(e.target.value);
                                }}
                                value={extractISOMonthDateYear(dateDisabled, true)}
                            />
                        )}
                    </FormControl>
                </Box>
                <Box className={classes.AdminUserFormRow}>
                    <p className={classes.AdminUserFormRowLabel}>Workflow Notification Type</p>

                    <Select
                        value={typeof workflowNotificationType === 'number' ? workflowNotificationType : ''}
                        className={classes.formField}
                        variant='outlined'
                        onChange={e => {
                            if (typeof e.target.value === 'number') {
                                setWorkflowNotificationType(e.target.value);
                            }
                        }}
                        style={{ width: '160px', height: '40px' }}
                    >
                        <MenuItem value={0}>Daily Digest</MenuItem>
                        <MenuItem value={1}>Immediately</MenuItem>
                    </Select>
                </Box>
                <Box className={classes.AdminUserFormRow}>
                    <p className={classes.AdminUserFormRowLabel}>Workflow Notification Time</p>
                    {workflowNotificationType === 0 ? (
                        <FormControl variant='outlined'>
                            <TextField
                                className={classes.formField}
                                style={{ width: '160px' }}
                                type='time'
                                size='small'
                                variant='outlined'
                                value={workflowNotificationTime}
                                inputProps={{
                                    step: 300
                                }}
                                InputLabelProps={{
                                    shrink: true
                                }}
                                onChange={e => {
                                    if (e.target.value) {
                                        setWorkflowNotificationTime(e.target.value);
                                    }
                                }}
                            />
                        </FormControl>
                    ) : (
                        <FormControl variant='outlined'>
                            <TextField
                                disabled
                                className={classes.formField}
                                style={{ width: '160px' }}
                                type='time'
                                size='small'
                                variant='outlined'
                                value={workflowNotificationTime}
                                inputProps={{
                                    step: 300
                                }}
                                InputLabelProps={{
                                    shrink: true
                                }}
                                onChange={e => {
                                    if (e.target.value) {
                                        setWorkflowNotificationTime(e.target.value);
                                    }
                                }}
                            />
                        </FormControl>
                    )}
                </Box>
            </Box>
            <Box className={classes.AdminUserFormButtonGroup}>
                {create ? (
                    <Button variant='contained' className={classes.searchUsersFilterButton} onClick={createNewUser}>
                        Create
                    </Button>
                ) : (
                    <Button variant='contained' className={classes.searchUsersFilterButton} onClick={updateExistingUser}>
                        Update
                    </Button>
                )}

                <Link to='/admin/users' style={{ textDecoration: 'none' }}>
                    <Button variant='contained' className={classes.searchUsersFilterButton}>
                        Cancel
                    </Button>
                </Link>
            </Box>
        </Box>
    );
}

export default AdminUserForm;
