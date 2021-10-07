/* eslint-disable camelcase */

import React, { useState, useEffect } from 'react';
import AdminUsersFilter from './AdminUsersFilter';
import AdminUsersList from './AdminUsersList';
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { useLocation } from 'react-router';
import { GetAllUsersDocument, User_Status } from '../../../types/graphql';
import { GetAllUsersResult } from '../../../types/graphql';
import { apolloClient } from '../../../graphql/index';
import GenericBreadcrumbsView from '../../../components/shared/GenericBreadcrumbsView';
import { Helmet } from 'react-helmet';
import { getHeaderTitle } from '../../../utils/shared';

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
    const [usersList, setUsersList] = useState<GetAllUsersResult['User'] | []>([]);
    const location = useLocation();

    useEffect(() => {
        async function fetchInitialUsersList() {
            const initialUsersListQuery = await apolloClient.query({
                query: GetAllUsersDocument,
                variables: {
                    input: {
                        active: User_Status.EAll,
                        search: ''
                    }
                }
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
            }
        });
        const {
            data: {
                getAllUsers: { User: queriedUsers }
            }
        } = newFilterQuery;
        setUsersList(queriedUsers);
    };

    const title = getHeaderTitle('Users | Admin');

    return (
        <React.Fragment>
            <Helmet>
                <title>{title}</title>
            </Helmet>
            <Box className={classes.AdminUsersViewContainer}>
                <Box className={classes.AdminBreadCrumbsContainer}>
                    <GenericBreadcrumbsView items={location.pathname.slice(1)} />
                </Box>
                <AdminUsersFilter queryUsersByFilter={queryUsersByFilter} />
                <AdminUsersList users={usersList} />
            </Box>
        </React.Fragment>
    );
}

export default AdminUsersView;
