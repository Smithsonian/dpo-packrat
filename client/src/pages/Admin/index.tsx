/**
 * Admin
 *
 * This component renders Admin UI and all the sub-components
 * The structure is as follows:
 * Admin
 * - AdminSidebarMenu
 * - AdminUserForm
 * - AdminUsersView
 * -- AdminUsersFilter
 * -- AdminUsersList
 *
 * Current implementation has AdminUsersView make request for user
 * information and then pass the list + AdminUsersFilter terms down to
 * AdminUsersList.
 *
 */
import React from 'react';
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { PrivateRoute } from '../../components';
import { HOME_ROUTES, ADMIN_ROUTE, ADMIN_ROUTES_TYPE, resolveRoute, resolveSubRoute, ADMIN_EDIT_USER } from '../../constants';
import { Redirect } from 'react-router';
import AdminUsersView from './components/AdminUsersView';
import AdminUserForm from './components/AdminUserForm';
import AdminSidebarMenu from './components/AdminSidebarMenu';

const useStyles = makeStyles({
    AdminPageContainer: {
        display: 'flex',
        font: 'var(--unnamed-font-style-normal) normal medium 11px/17px var(--unnamed-font-family-heebo)'
    }
});

function Admin(): React.ReactElement {
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
