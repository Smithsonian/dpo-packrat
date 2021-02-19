/**
 * Admin
 *
 * This component renders Admin UI and all the sub-components
 */
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import Checkbox from '@material-ui/core/Checkbox';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import IconButton from '@material-ui/core/IconButton';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import { BiSort } from 'react-icons/bi';
import { PrivateRoute } from '../../components';
import { HOME_ROUTES, ADMIN_ROUTE, ADMIN_ROUTES_TYPE, resolveRoute, resolveSubRoute, ADMIN_EDIT_USER } from '../../constants';
import React, { useState, useEffect } from 'react';
import { Redirect, useParams /* useHistory, useLocation */ } from 'react-router';
import { Link } from 'react-router-dom';
import { useGetUserQuery, useGetAllUsersQuery, User_Status /* useUpdateUserMutation, useCreateUserMutation */ } from '../../types/graphql';
import { GetAllUsersResult, User /* User */ } from '../../types/graphql';

// let sampleUserList: GetAllUsersResult['User'] = [
//     // let sampleUserList: User[] = [
//     {
//         idUser: 1,
//         Name: 'Jon Tyson',
//         EmailAddress: 'tysonj@si.edu',
//         Active: true,
//         DateActivated: '2021-02-03T22:36:39.000Z',
//         DateDisabled: null,
//         WorkflowNotificationTime: null,
//         EmailSettings: null,
//         SecurityID: 'TBD'
//     },
//     {
//         idUser: 2,
//         Name: 'Jon Blundell',
//         EmailAddress: 'blundellj@si.edu',
//         Active: true,
//         DateActivated: '2021-02-03T22:36:39.000Z',
//         DateDisabled: null,
//         WorkflowNotificationTime: null,
//         EmailSettings: null,
//         SecurityID: 'TBD'
//     },
//     {
//         idUser: 3,
//         Name: 'Vince Rossi',
//         EmailAddress: 'rossiv@si.edu',
//         Active: true,
//         DateActivated: '2021-02-03T22:36:39.000Z',
//         DateDisabled: null,
//         WorkflowNotificationTime: null,
//         EmailSettings: null,
//         SecurityID: 'TBD'
//     },
//     {
//         idUser: 4,
//         Name: 'Jamie Cope',
//         EmailAddress: 'copeg@si.edu',
//         Active: false,
//         DateActivated: '2021-02-03T22:36:39.000Z',
//         DateDisabled: null,
//         WorkflowNotificationTime: null,
//         EmailSettings: null,
//         SecurityID: 'TBD'
//     },
//     {
//         idUser: 5,
//         Name: 'Karan Pratap Singh',
//         EmailAddress: 'singhk@si.edu',
//         Active: true,
//         DateActivated: '2021-02-03T22:36:39.000Z',
//         DateDisabled: null,
//         WorkflowNotificationTime: null,
//         EmailSettings: null,
//         SecurityID: 'TBD'
//     },
//     {
//         idUser: 6,
//         Name: 'Test User',
//         EmailAddress: 'user@test.com',
//         Active: true,
//         DateActivated: '2021-02-03T22:36:39.000Z',
//         DateDisabled: null,
//         WorkflowNotificationTime: null,
//         EmailSettings: null,
//         SecurityID: 'TBD'
//     }
// ];

function extractISOMonthDateYear(iso, materialUI = false) {
    if (!iso) {
        return null;
    }
    const time = new Date(iso);
    if (materialUI) {
        let year = String(time.getFullYear());
        let month = String(time.getMonth());
        let date = String(time.getDate());
        //year-month-date
        if (Number(month) < 10) {
            month = '0' + month;
        }
        if (Number(date) < 10) {
            date = '0' + date;
        }
        const result = `${year}-${month}-${date}`;
        return result;
    }
    const result = `${time.getMonth()}/${time.getDate()}/${time.getFullYear()}`;
    return result;
}

const useStyles = makeStyles({
    AdminUsersViewContainer: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        overflow: 'auto',
        maxHeight: 'calc(100vh - 60px)',
        paddingLeft: '3%',
        paddingTop: '3%'
        // backgroundColor: 'grey'
    },
    //Will include the breadcrumbs have have that stacked on top
    AdminUsersListComponentsContainer: {
        maxWidth: '85%',
        maxHeight: '70%',
        display: 'flex',
        backgroundColor: '#FFFCD1',
        border: '1px solid #B7D2E5CC',
        alignItems: 'center'
    },
    formControl: {
        minWidth: 120
    },
    searchUsersFilterButton: {
        backgroundColor: '#687DDB',
        color: 'white'
    },
    AdminUsersSearchFilterContainer: {
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center'
    },
    AdminUserFormContainer: {
        display: 'flex',
        flexDirection: 'column',
        flexWrap: 'nowrap'
    },
    AdminUserFormRow: {
        display: 'flex'
    }
});

// AdminUsersFilter
// Filters out from the users stored in AdminUsersView
// Searchbar for key words
// Dropdown for active status
// Search button
// Add User button

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
        <Box className={classes.AdminUsersListComponentsContainer}>
            <Box className={classes.AdminUsersSearchFilterContainer}>
                <TextField label='Search Packrat User' type='search' value={searchFilter} id='searchFilter' onChange={handleSearchFilterChange} />
                <FormControl variant='outlined' className={classes.formControl}>
                    <InputLabel>Active</InputLabel>
                    <Select value={activeStatusFilter} onChange={handleActiveStatusFilterChange}>
                        <MenuItem value={'All'}>All</MenuItem>
                        <MenuItem value={'Active'}>Active</MenuItem>
                        <MenuItem value={'Inactive'}>Inactive</MenuItem>
                    </Select>
                </FormControl>
                <Button className={classes.searchUsersFilterButton} onClick={searchUsers}>
                    Search
                </Button>
            </Box>
            <Button className={classes.searchUsersFilterButton}>
                <Link to='/admin/user/create'>Create User</Link>
            </Button>
        </Box>
    );
}

// AdminUsersList
// Receives users from AdminUsersView and the filter in place AdminUsersFilter
// Columns with active, name, email, date activated, date deactivated, and edit
// Also has a way of sorting the users based on active, name, email, date activated, date deactivated
//AdminUsersListRow
// Checkbox, name, email, date, date, and edit link that guides to AdminUserForm
function AdminUsersListRow({ userData }: { userData: User }): React.ReactElement {
    const { idUser, Name, Active, EmailAddress, DateActivated, DateDisabled } = userData;

    return (
        <TableRow hover>
            <TableCell>
                <Checkbox checked={Active} disabled color='primary' />
            </TableCell>
            <TableCell>{Name}</TableCell>
            <TableCell>{EmailAddress}</TableCell>
            <TableCell>{extractISOMonthDateYear(DateActivated)}</TableCell>
            <TableCell>{extractISOMonthDateYear(DateDisabled)}</TableCell>
            <TableCell>
                <Link to={`/admin/user/${idUser}`}>edit</Link>
            </TableCell>
        </TableRow>
    );
}

function AdminUsersList({ users }: { users: GetAllUsersResult['User'] }): React.ReactElement {
    const classes = useStyles();

    return (
        <Box className={classes.AdminUsersListComponentsContainer}>
            <TableContainer component={Paper}>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell>
                                Active
                                <IconButton size='small'>
                                    <BiSort />
                                </IconButton>
                            </TableCell>
                            <TableCell align='left'>
                                Name
                                <IconButton size='small'>
                                    <BiSort />
                                </IconButton>
                            </TableCell>
                            <TableCell align='left'>
                                Email
                                <IconButton size='small'>
                                    <BiSort />
                                </IconButton>
                            </TableCell>
                            <TableCell align='left'>
                                DATE ACTIVATED
                                <IconButton size='small'>
                                    <BiSort />
                                </IconButton>
                            </TableCell>
                            <TableCell align='left'>
                                DATE DISABLED
                                <IconButton size='small'>
                                    <BiSort />
                                </IconButton>
                            </TableCell>
                            <TableCell>Action</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map(user => {
                            return <AdminUsersListRow userData={user} key={user?.EmailAddress} />;
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}

// AdminUsersView - should contain both AdminUsersFilter and AdminUsersList
// TODO write a hook or state store graphql api to retrieve users
// TODO will have a state store for both the search filter term
// TODO refactor using a state store instead
// Also handles create newUser and update upon that
// Passes both list of users and filter term to UsersList
function AdminUsersView(): React.ReactElement {
    const classes = useStyles();
    // let users: GetAllUsersResult = sampleUserList;
    // let users: User[];
    const [active, setActive] = useState('All');
    const [userSearchFilter, setUserSearchFilter] = useState('');

    const { data } = useGetAllUsersQuery({
        variables: {
            input: {
                search: '',
                active: User_Status.EAll
            }
        }
    });

    console.log('useGetAllUsers');
    // console.log('Usersarray', data?.getAllUsers.User);
    let users: GetAllUsersResult['User'] = data?.getAllUsers?.User || [];
    console.log('users', users);

    // useEffect(() => {
    //     console.log('data', data?.getAllUsers.User);
    //     if (data) {
    //         users = data?.getAllUsers.User;
    //     }
    // }, [data]);

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
                <AdminUsersFilter handleActiveUpdate={handleActiveUpdate} handleUsersSearchUpdate={handleUsersSearchUpdate} />
                <AdminUsersList users={filteredUsers} />
            </Box>
        </React.Fragment>
    );
}

// AdminUserForm
// TODO
function AdminUserForm(): React.ReactElement {
    const classes = useStyles();
    const parameters: { idUser: string } = useParams();
    const { idUser } = parameters;

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [active, setActive] = useState<boolean>(true);
    const [dateActivated, setDateActivated] = useState('');
    const [dateDisabled, setDateDisabled] = useState<string | null>('');
    // const [workflowNotificationType, setWorkflowNotificationType] = useState('');
    // const [workflowNotificationTime, setWorkflowNotificationTime] = useState('');

    let create: boolean = idUser === 'create';

    // const useGetUserQueryResponse = useGetUserQuery({
    //     variables: {
    //         input: {
    //             idUser: Number(idUser)
    //         }
    //     }
    // });

    // console.log('useGetUser', useGetUserQueryResponse);
    // let fetchedUser = useGetUserQueryResponse?.data?.getUser?.User;
    // console.log('useGetUserQuery', fetchedUser);
    // let fetchedUser = sampleUserList.find(individualUser => individualUser.idUser === Number(idUser));
    // console.log('fetchedUser before if', fetchedUser);

    let fetchedUser = useGetUserQuery({
        variables: {
            input: {
                idUser: Number(idUser)
            }
        }
    });

    console.log(fetchedUser);
    /**
     * Approach 1
     * change the return to null
     * then render until I get the query back
     */

    // useEffect(() => {
    //     if (fetchedUser) {
    //         console.log('fetchedUser before changing state', fetchedUser);
    //         setName(fetchedUser?.Name);
    //         setEmail(fetchedUser?.EmailAddress);
    //         setActive(fetchedUser?.Active);
    //         setDateActivated(fetchedUser?.DateActivated);
    //         setDateDisabled(fetchedUser?.DateDisabled);
    //         // setWorkflowNotificationType(fetchedUser?.EmailSettings);
    //         // setWorkflowNotificationTime(fetchedUser?.WorkflowNotificationTime || '');
    //         console.log('fetchedUser after changing state', fetchedUser);
    //     }
    // }, [fetchedUser]);

    // const submitCreateUser = async () => {
    //     const newUser = await useCreateUserMutation({
    //         variables: {
    //             input: {
    //                 EmailAddress: email,
    //                 Name: name
    //             }
    //         }
    //     });

    //     console.log(newUser);
    //     return newUser;
    // };

    // const submitUpdateUser = async () => {
    //     const updatedUser = await useUpdateUserMutation({
    //         variables: {
    //             input: {
    //                 idUser: Number(idUser),
    //                 Name: name,
    //                 EmailAddress: email,
    //                 Active: active,
    //                 EmailSettings: Number(workflowNotificationType),
    //                 WorkflowNotificationTime: workflowNotificationTime
    //             }
    //         }
    //     });
    //     console.log(updatedUser);
    //     return updatedUser;
    // };

    // Create 2 form variants based on create or edit user
    // Biggest difference should be the functionality of the button
    // Create will use graphQL api to create new user
    // Edit will mutate an exisiting user
    // if (fetchedUser) {
    //     invalidUser = false;
    // }

    // Performs graphql query to retrieve user information
    // if query returns user info,
    // redirect to adminuserform
    // else
    // redirect to users

    return (
        <React.Fragment>
            {!fetchedUser && !create && <Redirect to={resolveSubRoute(ADMIN_ROUTE.TYPE, ADMIN_ROUTE.ROUTES.USERS)} />}
            <Box className={classes.AdminUserFormContainer}>
                <Box className={classes.AdminUserFormRow}>
                    <p>Name</p>
                    <FormControl variant='outlined'>
                        <TextField
                            id='component-outlined'
                            variant='outlined'
                            value={name}
                            onChange={e => {
                                setName(e.target.value);
                            }}
                            placeholder='John Doe'
                            label='First, Last'
                            InputLabelProps={{
                                shrink: true
                            }}
                        />
                    </FormControl>
                </Box>
                <Box className={classes.AdminUserFormRow}>
                    <p>Email Address</p>
                    <TextField
                        id='outlined-basic'
                        variant='outlined'
                        value={email}
                        onChange={e => {
                            setEmail(e.target.value);
                        }}
                        placeholder='JDoe@example.com'
                    />
                </Box>
                <Box className={classes.AdminUserFormRow}>
                    <p>Active</p>
                    <Checkbox
                        color='primary'
                        inputProps={{ 'aria-label': 'secondary checkbox' }}
                        checked={active}
                        onChange={() => {
                            setActive(!active);
                        }}
                    />
                </Box>
                <Box className={classes.AdminUserFormRow}>
                    <p>Date Activated</p>
                    <TextField
                        id='date'
                        type='date'
                        disabled
                        onChange={e => {
                            setDateActivated(e.target.value);
                        }}
                        // value={extractISOMonthDateYear(fetchedUser?.DateActivated, true)}
                        value={extractISOMonthDateYear(dateActivated, true)}
                        InputLabelProps={{
                            shrink: true
                        }}
                    />
                </Box>
                <Box className={classes.AdminUserFormRow}>
                    <p>Date Disabled</p>
                    <TextField
                        id='date'
                        type='date'
                        disabled
                        onChange={e => {
                            setDateDisabled(e.target.value);
                        }}
                        value={extractISOMonthDateYear(dateDisabled, true)}
                        InputLabelProps={{
                            shrink: true
                        }}
                    />
                </Box>
                <Box className={classes.AdminUserFormRow}>
                    <p>Workflow Notification Type</p>
                    <Select value='Daily Digest'>
                        <MenuItem value={'Daily Digest'}>Daily Digest</MenuItem>
                        <MenuItem value={'Immediately'}>Immediately</MenuItem>
                        <MenuItem value={'Ehh'}>{/* workflowNotificationType */}</MenuItem>
                    </Select>
                </Box>
                <Box className={classes.AdminUserFormRow}>
                    <p>Workflow Notification Time</p>
                    <TextField
                        id='time'
                        type='time'
                        // defaultValue={workflowNotificationTime}
                        InputLabelProps={{
                            shrink: true
                        }}
                        inputProps={{
                            step: 300 // 5 min
                        }}
                        // onChange={e => {
                        //     setWorkflowNotificationTime(e.target.value);
                        // }}
                    />
                </Box>
                <Box>
                    <Button
                        color='primary'
                        onClick={() => {
                            create ? console.log('create') : console.log('update');
                        }}>
                        {create ? 'Create' : 'Update'}
                    </Button>
                    <Link to='/admin/users'>
                        <Button color='primary'>Cancel</Button>
                    </Link>
                </Box>
            </Box>
        </React.Fragment>
    );
}

function Admin(): React.ReactElement {
    const classes = useStyles();
    useEffect(() => {
        console.log('hi I am loaded');
        // async function getAllUsers() {
        //   const queryOptions = {
        //     query: getAllUsers,
        //     variables: {
        //       input: {
        //         search: '',
        //         active: 'eAll'
        //       }
        //     }
        //   };

        //   const { data, error } = await apolloClient.query(queryOptions);

        //   if (data && !error) {
        //     const { getAllUsers } = data;
        //     return getAllUsers;
        //   }
        // }
        // await getAllUser
        // let allUsers = await getAllUsers();
        // console.log(allUsers);
        // setUsers(allUsers);
    }, []);

    return (
        <React.Fragment>
            <Box className={classes.AdminUsersViewContainer}>
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
