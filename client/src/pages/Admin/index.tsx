/**
 * Admin
 *
 * This component renders Admin UI and all the sub-components
 */
import React, { useState, useEffect } from 'react';
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
// import Table from '@material-ui/core/Table';
// import TableBody from '@material-ui/core/TableBody';
// import TableCell from '@material-ui/core/TableCell';
// import TableContainer from '@material-ui/core/TableContainer';
// import TableHead from '@material-ui/core/TableHead';
// import TableRow from '@material-ui/core/TableRow';
// import Paper from '@material-ui/core/Paper';
import Checkbox from '@material-ui/core/Checkbox';
import { CheckBox, CheckBoxOutlineBlank } from '@material-ui/icons';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import MenuList from '@material-ui/core/MenuList';
import Typography from '@material-ui/core/Typography';
import { DataGrid } from '@material-ui/data-grid';
import { PrivateRoute } from '../../components';
import { HOME_ROUTES, ADMIN_ROUTE, ADMIN_ROUTES_TYPE, resolveRoute, resolveSubRoute, ADMIN_EDIT_USER } from '../../constants';
import { Redirect, useParams, useLocation, useHistory } from 'react-router';
import { Link } from 'react-router-dom';
import { useGetUserQuery, useGetAllUsersQuery, User_Status, CreateUserDocument, UpdateUserDocument } from '../../types/graphql';
import { GetAllUsersResult /* , User */ } from '../../types/graphql';
import { apolloClient } from '../../graphql/index';
// import GenericBreadcrumbsView from '../../components/shared/GenericBreadcrumbsView';

/* Utility functions */

// function descendingComparator(a, b, orderBy) {
//     if (b[orderBy] < a[orderBy]) {
//         return -1;
//     }
//     if (b[orderBy] > a[orderBy]) {
//         return 1;
//     }
//         return 0;
//   }

//   function getComparator(order, orderBy) {
//     return order === 'desc'
//         ? (a, b) => descendingComparator(a, b, orderBy)
//         : (a, b) => -descendingComparator(a, b, orderBy);
//   }

// function stableSort(array, comparator) {
//     const stabilizedThis = array.map((el, index) => [el, index]);
//     stabilizedThis.sort((a, b) => {
//         const order = comparator(a[0], b[0]);
//         if (order !== 0) return order;
//         return a[1] - b[1];
//     });
//     return stabilizedThis.map((el) => el[0]);
// }

function toTitleCase(str) {
    return str.replace(/\w\S*/g, txt => {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

function extractISOMonthDateYear(iso, materialUI = false) {
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
        paddingLeft: '3%',
        paddingTop: '3%',
        width: '1000px',
        backgroundColor: 'pink'
    },
    //Will include the breadcrumbs have have that stacked on top
    AdminUsersListContainer: {
        maxWidth: '85%',
        maxHeight: '70%',
        display: 'flex',
        backgroundColor: '#FFFCD1',
        border: '1px solid #B7D2E5CC',
        alignItems: 'center'
    },
    //This is for any admin component to the right of the sidebar menu
    AdminToolsViewContainer: {
        display: 'flex',
        flexDirection: 'column'
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
        alignItems: 'center',
        height: '100px'
    },
    AdminUserFormContainer: {
        display: 'flex',
        flexDirection: 'column',
        flexWrap: 'nowrap'
    },
    AdminUserFormRow: {
        display: 'flex'
    },
    AdminSidebarMenuRow: {
        width: '100%',
        // backgroundColor: 'green',
        maxHeight: '100%',
        background: '#ECF5FD 0% 0% no-repeat padding-box'
    },
    AdminSidebarMenuContainer: {
        display: 'flex',
        flexDirection: 'column',
        width: '15%',
        border: '2px solid #C5D9E8'
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
        <Box className={classes.AdminUsersListContainer}>
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
                <Link style={{ textDecoration: 'none', color: '#F5F6FA' }} to='/admin/user/create'>
                    Create User
                </Link>
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
// function AdminUsersListRow({ userData }: { userData: User }): React.ReactElement {
//     const { idUser, Name, Active, EmailAddress, DateActivated, DateDisabled } = userData;

//     return (
//         <TableRow hover>
//             <TableCell>
//                 <Checkbox checked={Active} disabled color='primary' />
//             </TableCell>
//             <TableCell>{Name}</TableCell>
//             <TableCell>{EmailAddress}</TableCell>
//             <TableCell>{extractISOMonthDateYear(DateActivated)}</TableCell>
//             <TableCell>{extractISOMonthDateYear(DateDisabled)}</TableCell>
//             <TableCell>
//                 <Link to={`/admin/user/${idUser}`}>edit</Link>
//             </TableCell>
//         </TableRow>
//     );
// }

function AdminUsersList({ users }: { users: GetAllUsersResult['User'] }): React.ReactElement {
    const classes = useStyles();

    const usersWithId: any = users.map(user => {
        const { idUser, Active, DateActivated, EmailAddress, Name, SecurityID, DateDisabled, EmailSettings, WorkflowNotificationTime } = user;

        return {
            id: idUser,
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

    const columnHeader = [
        {
            field: 'Active',
            headerName: 'ACTIVE',
            width: 120,
            // valueGetter: params => (params.getValue('Active') ? 'Active' : 'Inactive'),
            renderCell: params => (Boolean(params.getValue('Active')) ? <CheckBox /> : <CheckBoxOutlineBlank />)
        },
        { field: 'Name', headerName: 'NAME', width: 130 },
        { field: 'EmailAddress', headerName: 'EMAIL', width: 130 },
        {
            field: 'DateActivated',
            headerName: 'DATE ACTIVATED',
            type: 'string',
            width: 180,
            valueFormatter: params => extractISOMonthDateYear(params.value)
        },
        {
            field: 'DateDisabled',
            headerName: 'DATE DISABLED',
            type: 'string',
            width: 160,
            valueFormatter: params => extractISOMonthDateYear(params.value)
        },
        {
            field: 'Action',
            headerName: 'Action',
            width: 300,
            renderCell: params => <Link to={`/admin/user/${[params.getValue('id')]}`}>Edit</Link>
        }
    ];

    return (
        <Box className={classes.AdminUsersListContainer}>
            {/* <TableContainer component={Paper}>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell>Active</TableCell>
                            <TableCell align='left'>Name</TableCell>
                            <TableCell align='left'>Email</TableCell>
                            <TableCell align='left'>DATE ACTIVATED</TableCell>
                            <TableCell align='left'>DATE DISABLED</TableCell>
                            <TableCell>Action</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map(user => {
                            return <AdminUsersListRow userData={user} key={user?.EmailAddress} />;
                        })}
                    </TableBody>
                </Table>
            </TableContainer> */}

            <div style={{ height: 400, width: '100%' }}>
                <DataGrid rows={usersWithId} columns={columnHeader} rowHeight={45} scrollbarSize={10} disableSelectionOnClick={true} />
            </div>
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
    // const [workflowNotificationType] = useState('');
    // const [workflowNotificationTime] = useState('');

    let create: boolean = idUser === 'create';

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
            console.log('fetchedUser before changing state', fetchedUser);
            setName(fetchedUser?.Name);
            setEmail(fetchedUser?.EmailAddress);
            setActive(fetchedUser?.Active);
            setDateActivated(fetchedUser?.DateActivated);
            setDateDisabled(fetchedUser?.DateDisabled);
            // setWorkflowNotificationType(fetchedUser?.EmailSettings);
            // setWorkflowNotificationTime(fetchedUser?.WorkflowNotificationTime || '');
            console.log('fetchedUser after changing state', fetchedUser);
        }
    }, [fetchedUser]);

    // Performs graphql query to retrieve user information
    // if query returns user info,
    // redirect to adminuserform
    // else
    // redirect to users

    const updateExistingUser = async () => {
        let updating = await apolloClient.mutate({
            mutation: UpdateUserDocument,
            variables: {
                input: {
                    idUser: Number(idUser),
                    EmailAddress: email,
                    Name: name,
                    Active: active,
                    EmailSettings: 1,
                    WorkflowNotificationTime: '2017-11-25T23:55:35.116Z'
                }
            }
        });
        console.log('updated', updating);
        history.push('/admin/users');
        window.location.reload();
    };

    const createNewUser = async () => {
        let creating = await apolloClient.mutate({
            mutation: CreateUserDocument,
            variables: {
                input: {
                    EmailAddress: email,
                    Name: name
                }
            }
        });

        console.log('yayyyyyyy', creating);
        history.push('/admin/users');
        window.location.reload();
    };

    return (
        <Box className={classes.AdminUsersViewContainer}>
            {/* {!create && <Redirect to={resolveSubRoute(ADMIN_ROUTE.TYPE, ADMIN_ROUTE.ROUTES.USERS)} />} */}
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
                    {create ? (
                        <Button color='primary' onClick={createNewUser}>
                            Create
                        </Button>
                    ) : (
                        <Button color='primary' onClick={updateExistingUser}>
                            Update
                        </Button>
                    )}
                    <Link to='/admin/users' style={{ textDecoration: 'none' }}>
                        <Button color='primary'>Cancel</Button>
                    </Link>
                </Box>
            </Box>
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

    // handle for redirects as well
    // might need to refactor using useEffects
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
                <AdminUsersFilter handleActiveUpdate={handleActiveUpdate} handleUsersSearchUpdate={handleUsersSearchUpdate} />
                <AdminUsersList users={filteredUsers} />
            </Box>
        </React.Fragment>
    );
}

function Admin(): React.ReactElement {
    // Responsible for handling the routing to various admin components
    const classes = useStyles();
    const parameters = useLocation();

    console.log('adminparams', parameters);

    return (
        <React.Fragment>
            <Box className={classes.AdminPageContainer}>
                {/* <GenericBreadcrumbsView items={parameters.pathname} /> */}
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
