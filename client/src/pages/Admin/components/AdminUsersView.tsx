/* eslint-disable camelcase */

import React, { useState } from 'react';
import AdminUsersFilter from './AdminUsersFilter';
import AdminUsersList from './AdminUsersList';
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { useLocation } from 'react-router';
import { useGetAllUsersQuery, User_Status } from '../../../types/graphql';
import { GetAllUsersResult } from '../../../types/graphql';
import GenericBreadcrumbsView from '../../../components/shared/GenericBreadcrumbsView';

const useStyles = makeStyles({
    AdminPageContainer: {
        display: 'flex',
        font: 'var(--unnamed-font-style-normal) normal medium 11px/17px var(--unnamed-font-family-heebo)'
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

    const users: GetAllUsersResult['User'] = data?.getAllUsers?.User || [];

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

export default AdminUsersView;
