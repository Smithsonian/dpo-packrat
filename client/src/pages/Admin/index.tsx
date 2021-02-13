/**
 * Repository
 *
 * This component renders Repository UI and all the sub-components like Filter and
 * TreeView.
 */
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
// import FormGroup from '@material-ui/core/FormGroup';
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
// import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import { BiSort } from 'react-icons/bi';
// import { GetAllUsers } from '../../types/graphql';
// import { QueryOptions } from '@apollo/client';
// import { apolloClient } from '../../graphql';
import { PrivateRoute } from '../../components';
import { HOME_ROUTES, ADMIN_ROUTE, resolveRoute, resolveSubRoute } from '../../constants';
import React, { useState, useEffect } from 'react';
import { Redirect /* useHistory, useLocation */ } from 'react-router';

interface UserData {
    idUser: number;
    Name: string;
    Active: boolean;
    EmailAddress: string;
    DateActivated: string;
    DateDisabled: string | null;
}

const sampleUserList = [
    {
        idUser: 1,
        Name: 'Jon Tyson',
        EmailAddress: 'tysonj@si.edu',
        Active: true,
        DateActivated: '2021-02-03T22:36:39.000Z',
        DateDisabled: null
    },
    {
        idUser: 2,
        Name: 'Jon Blundell',
        EmailAddress: 'blundellj@si.edu',
        Active: true,
        DateActivated: '2021-02-03T22:36:39.000Z',
        DateDisabled: null
    },
    {
        idUser: 3,
        Name: 'Vince Rossi',
        EmailAddress: 'rossiv@si.edu',
        Active: true,
        DateActivated: '2021-02-03T22:36:39.000Z',
        DateDisabled: null
    },
    {
        idUser: 4,
        Name: 'Jamie Cope',
        EmailAddress: 'copeg@si.edu',
        Active: true,
        DateActivated: '2021-02-03T22:36:39.000Z',
        DateDisabled: null
    },
    {
        idUser: 5,
        Name: 'Karan Pratap Singh',
        EmailAddress: 'singhk@si.edu',
        Active: true,
        DateActivated: '2021-02-03T22:36:39.000Z',
        DateDisabled: null
    },
    {
        idUser: 6,
        Name: 'Test User',
        EmailAddress: 'user@test.com',
        Active: true,
        DateActivated: '2021-02-03T22:36:39.000Z',
        DateDisabled: null
    }
];

function extractISOMonthDateYear(iso) {
    if (!iso) {
        return null;
    }
    const time = new Date(iso);
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
        paddingTop: '3%',
        backgroundColor: 'grey'
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
    }
});

// export type UserFilter = {
//   search: string;
//   status: string;
// };

// AdminUserForm
// TODO

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
        console.log(e.target.value);
    };

    const handleSearchFilterChange = e => {
        setSearchFilter(e.target.value);
        console.log(e.target.value);
    };

    const searchUsers = () => {
        handleActiveUpdate(activeStatusFilter);
        handleUsersSearchUpdate(searchFilter);
        console.log('searchUsers');
    };
    //2 buttons
    //textfield
    //select
    return (
        <Box className={classes.AdminUsersListComponentsContainer}>
            <Box className={classes.AdminUsersSearchFilterContainer}>
            	<TextField 
					label='Search Packrat User' 
					type='search' 
					value={searchFilter}                  
					id='searchFilter' 
					onChange={handleSearchFilterChange} 
				/>
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
            <Button className={classes.searchUsersFilterButton}>Add User</Button>
        </Box>
    );
}

// AdminUsersList
// Receives users from AdminUsersView and the filter in place AdminUsersFilter
// Columns with active, name, email, date activated, date deactivated, and edit
// Also has a way of sorting the users based on active, name, email, date activated, date deactivated
//AdminUsersListRow
// Checkbox, name, email, date, date, and edit link that guides to AdminUserForm
function AdminUsersListRow({ userData }: { userData: UserData }): React.ReactElement {
    const { Name, Active, EmailAddress, DateActivated, DateDisabled } = userData;

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
                <a href='/'>edit</a>
            </TableCell>
        </TableRow>
    );
}

function AdminUsersList({ users }: { users: UserData[] }): React.ReactElement {
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
                            return <AdminUsersListRow userData={user} key={user.EmailAddress} />;
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
    const users = sampleUserList;
    const [active, setActive] = useState('All');
    const [userSearchFilter, setUserSearchFilter] = useState('');

    const handleActiveUpdate = newActive => {
        setActive(newActive);
        console.log('successfully updated Active!');
    };

    const handleUsersSearchUpdate = newUserSearch => {
        setUserSearchFilter(newUserSearch);
        console.log('successfully updated Search!');
    };

    // filter by active and keyword
    let filteredUsers = users;

    switch (active) {
        case 'Active':
            filteredUsers = users.filter(user => user.Active);
            console.log('case: Active');
            break;
        case 'Inactive':
            filteredUsers = users.filter(user => !user.Active);
            console.log('case: Inactive');
            break;
        default:
            filteredUsers = users;
            console.log('case: All');
            break;
    }

    filteredUsers = filteredUsers.filter(user => {
        const lowerCaseSearch = userSearchFilter.toLowerCase();
        return user.EmailAddress.toLowerCase().includes(lowerCaseSearch) || user.Name.toLowerCase().includes(lowerCaseSearch);
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

export type UsersFilter = {
    search: string;
    activeStatus: string;
};

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

        // let allUsers = getAllUsers();
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
                    <PrivateRoute exact path={resolveSubRoute(ADMIN_ROUTE.TYPE, ADMIN_ROUTE.ROUTES.USERS)} component={AdminUsersView} />
                    {/* <PrivateRoute
                      exact
                      path={resolveSubRoute(ADMIN_ROUTE.TYPE, ADMIN_ROUTE.ROUTES.USER)}
                      component={AdminUserForm}
                  /> */}
                </PrivateRoute>
            </Box>
        </React.Fragment>
    );
}

export default Admin;
