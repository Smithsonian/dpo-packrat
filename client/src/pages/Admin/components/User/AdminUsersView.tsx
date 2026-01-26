/* eslint-disable camelcase */

import React, { useState, useEffect } from 'react';
import AdminUsersFilter from './AdminUsersFilter';
import AdminUsersList from './AdminUsersList';
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { useLocation } from 'react-router';
import { GetAllUsersDocument, User_Status } from '../../../../types/graphql';
import { GetAllUsersResult } from '../../../../types/graphql';
import { apolloClient } from '../../../../graphql/index';
import GenericBreadcrumbsView from '../../../../components/shared/GenericBreadcrumbsView';
import { Helmet } from 'react-helmet';
import { useUserStore } from '../../../../store';

const useStyles = makeStyles({
    AdminUsersViewContainer: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        overflow: 'auto',
        paddingBottom: '15px',
        paddingLeft: '15px',
        margin: '0 auto'
    },
    breadcrumbContainer: {
        display: 'flex',
        alignItems: 'center',
        minHeight: '46px',
        paddingLeft: '20px',
        paddingRight: '20px',
        background: '#ECF5FD',
        color: '#3F536E',
        marginBottom: '15px',
        width: 'fit-content'
    }
});

function AdminUsersView(): React.ReactElement {
    const classes = useStyles();
    const [usersList, setUsersList] = useState<GetAllUsersResult['User']>([]);
    const location = useLocation();
    const { user } = useUserStore();
    const isAuthorized = user?.isAdmin ?? false;

    useEffect(() => {
        async function fetchInitialUsersList() {
            const initialUsersListQuery = await apolloClient.query({
                query: GetAllUsersDocument,
                variables: {
                    input: {
                        active: User_Status.EAll,
                        search: ''
                    }
                },
                fetchPolicy: 'no-cache'
            });
            const {
                data: {
                    getAllUsers: { User: queriedUsers }
                }
            } = initialUsersListQuery;
            await setUsersList(queriedUsers);
        }

        fetchInitialUsersList();
    }, []);

    const queryUsersByFilter = async (newActive, newSearchText) => {
        const newFilterQuery = await apolloClient.query({
            query: GetAllUsersDocument,
            variables: {
                input: {
                    active: newActive,
                    search: newSearchText
                }
            },
            fetchPolicy: 'no-cache'
        });
        const {
            data: {
                getAllUsers: { User: queriedUsers }
            }
        } = newFilterQuery;
        setUsersList(queriedUsers);
    };

    return (
        <React.Fragment>
            <Helmet>
                <title>Users Admin</title>
            </Helmet>
            <Box className={classes.AdminUsersViewContainer}>
                <Box className={classes.breadcrumbContainer}>
                    <GenericBreadcrumbsView items={location.pathname.slice(1)} />
                </Box>
                {isAuthorized ? (
                    <>
                        <AdminUsersFilter queryUsersByFilter={queryUsersByFilter} />
                        <AdminUsersList users={usersList} />
                    </>
                ) : (
                    <p>You are <b>Not Authorized</b> to view this page. Admin access required.</p>
                )}
            </Box>
        </React.Fragment>
    );
}

export default AdminUsersView;
