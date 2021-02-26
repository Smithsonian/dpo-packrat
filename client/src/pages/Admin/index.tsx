/**
 * Admin
 *
 * This component renders Admin UI and all the sub-components
 */
import React, { useState, useEffect } from 'react';
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import Checkbox from '@material-ui/core/Checkbox';
import Tooltip from '@material-ui/core/Tooltip';
import ClearIcon from '@material-ui/icons/Clear';
import CheckIcon from '@material-ui/icons/Check';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import MenuList from '@material-ui/core/MenuList';
import Typography from '@material-ui/core/Typography';
import FormHelperText from '@material-ui/core/FormHelperText';
import { DataGrid, Columns } from '@material-ui/data-grid';
import { PrivateRoute } from '../../components';
import { HOME_ROUTES, ADMIN_ROUTE, ADMIN_ROUTES_TYPE, resolveRoute, resolveSubRoute, ADMIN_EDIT_USER } from '../../constants';
import { Redirect, useParams, useLocation, useHistory } from 'react-router';
import { Link } from 'react-router-dom';
import { useGetUserQuery, useGetAllUsersQuery, User_Status, CreateUserDocument, UpdateUserDocument } from '../../types/graphql';
import { GetAllUsersResult /* , User */ } from '../../types/graphql';
import { apolloClient } from '../../graphql/index';
import GenericBreadcrumbsView from '../../components/shared/GenericBreadcrumbsView';
import { toast } from 'react-toastify';
import * as yup from 'yup';

/* Utility functions */
function toTitleCase(str) {
    return str.replace(/\w\S*/g, txt => {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

function formatISOToHoursMinutes(time): string {
    const newTime = new Date(time);
    let hours = String(newTime.getHours());
    let minutes = String(newTime.getMinutes());
    if (Number(hours) < 10) {
        hours = '0' + hours;
    }
    if (Number(minutes) < 10) {
        minutes = '0' + minutes;
    }
    return `${hours}:${minutes}`;
}

function extractISOMonthDateYear(iso, materialUI = false): string | null {
    if (!iso) {
        return null;
    }
    const time = new Date(iso);
    if (materialUI) {
        // year-month-date
        let year = String(time.getFullYear());
        let month = String(time.getMonth() + 1);
        let date = String(time.getDate());
        if (Number(month) < 10) {
            month = '0' + month;
        }
        if (Number(date) < 10) {
            date = '0' + date;
        }
        const result = `${year}-${month}-${date}`;
        return result;
    }
    const result = `${time.getMonth() + 1}/${time.getDate()}/${time.getFullYear()}`;
    return result;
}

const useStyles = makeStyles({
    AdminPageContainer: {
        display: 'flex'
    },
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
    AdminUsersListContainer: {
        marginTop: '2%',
        width: '1000px',
        padding: '20px',
        height: 'calc(100% - 120px)',
        display: 'flex',
        border: '1px solid #B7D2E5CC',
        margin: '1px solid #B7D2E5CC',
        alignItems: 'center',
        backgroundColor: '#687DDB1A',
        borderRadius: '4px'
    },
    formControl: {
        minWidth: 120
    },
    UsersListDataGrid: {
        letterSpacing: '1.7px',
        color: '#8DABC4',
        font: 'var(--unnamed-font-style-normal) normal medium 11px/17px var(--unnamed-font-family-heebo)',
        border: '1px solid #B7D2E5CC',
        borderRadius: '2px',
        backgroundColor: 'white'
    },
    searchUsersFilterButton: {
        backgroundColor: '#687DDB',
        color: 'white',
        width: '90px',
        height: '30px'
    },
    AdminUsersSearchFilterContainer: {
        display: 'flex',
        justifyContent: 'space-around',
        height: '70px',
        width: '900px',
        backgroundColor: '#FFFCD1',
        paddingLeft: '20px',
        paddingRight: '20px'
    },
    AdminUsersSearchFilterSettingsContainer: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '100%',
        width: '80%'
    },
    AdminUsersSearchFilterSettingsContainer2: {
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        height: '100%',
        width: '20%'
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
        font: 'var(--unnamed-font-style-normal) normal var(--unnamed-font-weight-normal) 13px/19px var(--unnamed-font-family-heebo)',
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
        borderBottom: '1px solid #D8E5EE'
    },
    AdminUserFormButtonGroup: {
        marginTop: '30px',
        '& Button': {
            marginRight: '30px'
        }
    },
    AdminSidebarMenuRow: {
        maxHeight: '100%',
        background: '#ECF5FD 0% 0% no-repeat padding-box',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        flexDirection: 'column',
        padding: '0.8rem',
        width: 160,
        transition: 'all 250ms ease-in',
        textDecoration: 'none',
        overflow: 'hidden',
        borderRadius: 5,
        marginTop: 2
    },
    AdminSidebarMenuContainer: {
        display: 'flex',
        flexDirection: 'column',
        border: '2px solid #C5D9E8',
        padding: '1em 1em'
    },
    searchFilter: {
        width: '380px'
    },
    formField: {
        backgroundColor: 'white',
        font: 'var(--unnamed-font-style-normal) normal var(--unnamed-font-weight-normal) 13px/19px var(--unnamed-font-family-heebo);',
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
    }
});

function AdminSidebarMenuRow({ path }: { path: string }) {
    const classes = useStyles();

    return (
        <Link style={{ textDecoration: 'none', color: '#0093EE' }} to={`/admin/${path}`}>
            <MenuItem className={classes.AdminSidebarMenuRow}>
                <Typography variant='inherit' noWrap>
                    {toTitleCase(path)}
                </Typography>
            </MenuItem>
        </Link>
    );
}

function AdminSidebarMenu() {
    const classes = useStyles();
    const adminRoutes = ['users'];

    return (
        <Box className={classes.AdminSidebarMenuContainer}>
            <MenuList>
                {adminRoutes.map(route => {
                    return <AdminSidebarMenuRow path={route} key={route} />;
                })}
            </MenuList>
        </Box>
    );
}

function AdminUsersFilter({
    handleActiveUpdate,
    handleUsersSearchUpdate
}: {
    handleActiveUpdate: (input: string) => void;
    handleUsersSearchUpdate: (input: string) => void;
}): React.ReactElement {
    const [searchFilter, setSearchFilter] = useState('');
    const [activeStatusFilter, setActiveStatusFilter] = useState('All');
    const classes = useStyles();

    const handleActiveStatusFilterChange = e => {
        setActiveStatusFilter(e.target.value);
    };

    const handleSearchFilterChange = e => {
        setSearchFilter(e.target.value);
    };

    const searchUsers = () => {
        handleActiveUpdate(activeStatusFilter);
        handleUsersSearchUpdate(searchFilter);
    };

    return (
        <Box className={classes.AdminUsersSearchFilterContainer}>
            <Box className={classes.AdminUsersSearchFilterSettingsContainer}>
                <TextField
                    className={classes.searchFilter}
                    placeholder='Search Packrat User'
                    type='search'
                    value={searchFilter}
                    id='searchFilter'
                    onChange={handleSearchFilterChange}
                />
                <p>Active</p>
                <FormControl variant='outlined'>
                    <Select value={activeStatusFilter} className={classes.formField} style={{ height: '30px', width: '100px' }} onChange={handleActiveStatusFilterChange}>
                        <MenuItem value={'All'}>All</MenuItem>
                        <MenuItem value={'Active'}>Active</MenuItem>
                        <MenuItem value={'Inactive'}>Inactive</MenuItem>
                    </Select>
                </FormControl>
                <Button className={classes.searchUsersFilterButton} onClick={searchUsers}>
                    Search
                </Button>
            </Box>
            <Box className={classes.AdminUsersSearchFilterSettingsContainer2}>
                <Link style={{ textDecoration: 'none', color: '#F5F6FA' }} to='/admin/user/create'>
                    <Button className={classes.searchUsersFilterButton}>Add User</Button>
                </Link>
            </Box>
        </Box>
    );
}

function AdminUsersList({ users }: { users: GetAllUsersResult['User'] }): React.ReactElement {
    const classes = useStyles();

    const usersWithId: any = users.map(user => {
        const { idUser, Active, DateActivated, EmailAddress, Name, SecurityID, DateDisabled, EmailSettings, WorkflowNotificationTime } = user;

        return {
            id: idUser,
            idUser,
            Active,
            DateActivated,
            EmailAddress,
            Name,
            SecurityID,
            DateDisabled,
            EmailSettings,
            WorkflowNotificationTime
        };
    });

    const columnHeader: Columns = [
        {
            field: 'Active',
            headerName: 'Active',
            flex: 1,
            headerAlign: 'center',
            renderCell: params => (Boolean(params.getValue('Active')) ? <CheckIcon color='primary' /> : <ClearIcon color='error' />)
        },
        {
            field: 'Name',
            headerName: 'Name',
            flex: 1.7,
            renderCell: params => (
                <Tooltip placement='left' title={`${params.getValue('Name')}`} arrow>
                    <div>{`${params.getValue('Name')}`}</div>
                </Tooltip>
            )
        },
        {
            field: 'EmailAddress',
            headerName: 'Email',
            flex: 1.7,
            renderCell: params => (
                <Tooltip placement='left' title={`${params.getValue('EmailAddress')}`} arrow>
                    <div>{`${params.getValue('EmailAddress')}`}</div>
                </Tooltip>
            )
        },
        {
            field: 'DateActivated',
            headerName: 'Date Activated',
            type: 'string',
            flex: 1.7,
            valueFormatter: params => extractISOMonthDateYear(params.value)
        },
        {
            field: 'DateDisabled',
            headerName: 'Date Disabled',
            type: 'string',
            flex: 1.6,
            valueFormatter: params => extractISOMonthDateYear(params.value)
        },
        {
            field: 'Action',
            headerName: 'Action',
            flex: 1,
            sortable: false,
            renderCell: params => <Link to={`/admin/user/${[params.row.idUser]}`}>Edit</Link>
        }
    ];

    return (
        <Box className={classes.AdminUsersListContainer}>
            <DataGrid
                className={classes.UsersListDataGrid}
                rows={usersWithId}
                columns={columnHeader}
                rowHeight={55}
                scrollbarSize={5}
                density='compact'
                disableSelectionOnClick={true}
                disableColumnResize={undefined}
                hideFooter={true}
            />
        </Box>
    );
}

// AdminUserForm
// TODO
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
    let create: boolean = idUser === 'create';

    const schema = yup.object().shape({
        fullName: yup.string().min(1),
        email: yup.string().email().min(1)
    });

    let request = useGetUserQuery({
        variables: {
            input: {
                idUser: Number(idUser)
            }
        }
    });

    const fetchedUser = request.data?.getUser.User;
    console.log('fetchedUser', fetchedUser);
    /**
     * Approach 1
     * change the return to null
     * then render until I get the query back
     */

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

    // Performs graphql query to retrieve user information
    // if query returns user info,
    // redirect to adminuserform
    // else
    // redirect to users

    const validateFields = async (): Promise<boolean | void> => {
        try {
            let validNameResponse = await schema.isValid({ fullName: name });
            setValidNameInput(validNameResponse);
            let validEmailResponse = await schema.isValid({ email });
            setValidEmailInput(validEmailResponse);
            return validNameResponse && validEmailResponse;
        } catch (error) {
            toast.warn(error);
            console.log('error', error);
        }
    };

    const updateExistingUser = async () => {
        let validUpdate = await validateFields();
        if (!validUpdate) {
            toast.warn('Update Failed. Please double-check your form inputs');
            return;
        }
        let manipulatedTime = new Date();
        const newHours = workflowNotificationTime?.slice(0, 2);
        const newMinutes = workflowNotificationTime?.slice(3);
        manipulatedTime.setHours(Number(newHours));
        manipulatedTime.setMinutes(Number(newMinutes));

        let updating = await apolloClient.mutate({
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
            }
        });
        history.push('/admin/users');
        window.location.reload();
        return updating;
    };

    const createNewUser = async () => {
        let validCreate = await validateFields();
        if (!validCreate) {
            toast.warn('Creation Failed. Please be sure to include a name and email');
            return;
        }
        let creating = await apolloClient.mutate({
            mutation: CreateUserDocument,
            variables: {
                input: {
                    EmailAddress: email,
                    Name: name
                }
            }
        });

        history.push('/admin/users');
        window.location.reload();
        return creating;
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
                        style={{ width: '160px', height: '40px' }}
                        onChange={e => {
                            if (typeof e.target.value === 'number') {
                                setWorkflowNotificationType(e.target.value);
                            }
                        }}>
                        <MenuItem value={0}>Daily Digest</MenuItem>
                        <MenuItem value={1}>Immediately</MenuItem>
                    </Select>
                </Box>
                <Box className={classes.AdminUserFormRow}>
                    <p className={classes.AdminUserFormRowLabel}>Workflow Notification Time</p>
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
                                console.log('e.target.value', e.target.value);
                                if (e.target.value) {
                                    setWorkflowNotificationTime(e.target.value);
                                }
                            }}
                        />
                    </FormControl>
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

// AdminUsersView - should contain both AdminUsersFilter and AdminUsersList
// Also handles create newUser and update upon that
// Passes both list of users and filter term to UsersList
function AdminUsersView(): React.ReactElement {
    const classes = useStyles();
    const [active, setActive] = useState('All');
    const [userSearchFilter, setUserSearchFilter] = useState('');
    const location = useLocation();

    const { data } = useGetAllUsersQuery({
        variables: {
            input: {
                search: '',
                active: User_Status.EAll
            }
        }
    });

    let users: GetAllUsersResult['User'] = data?.getAllUsers?.User || [];

    const handleActiveUpdate = newActive => {
        setActive(newActive);
    };

    const handleUsersSearchUpdate = newUserSearch => {
        setUserSearchFilter(newUserSearch);
    };

    // filter by active and keyword
    let filteredUsers = users;

    switch (active) {
        case 'Active':
            filteredUsers = users.filter(user => user?.Active);
            break;
        case 'Inactive':
            filteredUsers = users.filter(user => !user?.Active);
            break;
        default:
            filteredUsers = users;
            break;
    }

    filteredUsers = filteredUsers.filter(user => {
        const lowerCaseSearch = userSearchFilter.toLowerCase();
        return user?.EmailAddress.toLowerCase().includes(lowerCaseSearch) || user?.Name.toLowerCase().includes(lowerCaseSearch);
    });

    return (
        <React.Fragment>
            <Box className={classes.AdminUsersViewContainer}>
                <Box className={classes.AdminBreadCrumbsContainer}>
                    <GenericBreadcrumbsView items={location.pathname.slice(1)} />
                </Box>
                <AdminUsersFilter handleActiveUpdate={handleActiveUpdate} handleUsersSearchUpdate={handleUsersSearchUpdate} />
                <AdminUsersList users={filteredUsers} />
            </Box>
        </React.Fragment>
    );
}

function Admin(): React.ReactElement {
    // Responsible for handling the routing to various admin components
    const classes = useStyles();

    return (
        <React.Fragment>
            <Box className={classes.AdminPageContainer}>
                <AdminSidebarMenu />
                <PrivateRoute path={resolveRoute(HOME_ROUTES.ADMIN)}>
                    <PrivateRoute exact path={resolveRoute(ADMIN_ROUTE.TYPE)}>
                        <Redirect to={resolveSubRoute(ADMIN_ROUTE.TYPE, ADMIN_ROUTE.ROUTES.USERS)} />
                    </PrivateRoute>
                    <PrivateRoute exact path={resolveSubRoute(ADMIN_ROUTE.TYPE, ADMIN_ROUTES_TYPE.USER)}>
                        <Redirect to={resolveSubRoute(ADMIN_ROUTE.TYPE, ADMIN_ROUTE.ROUTES.USERS)} />
                    </PrivateRoute>
                    <PrivateRoute exact path={resolveSubRoute(ADMIN_ROUTE.TYPE, ADMIN_ROUTE.ROUTES.USERS)} component={AdminUsersView} />
                    <PrivateRoute path={resolveSubRoute(ADMIN_ROUTE.TYPE, ADMIN_ROUTES_TYPE.USER)}>
                        <PrivateRoute path={resolveSubRoute(ADMIN_ROUTE.TYPE, ADMIN_EDIT_USER.USER)} component={AdminUserForm} />
                    </PrivateRoute>
                </PrivateRoute>
            </Box>
        </React.Fragment>
    );
}

export default Admin;
