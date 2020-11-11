/**
 * Repository
 *
 * This component renders Repository UI and all the sub-components like Filter and
 * TreeView.
 */
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { useEffect, useState } from 'react';
import { Redirect, useHistory, useLocation } from 'react-router';
import { PrivateRoute } from '../../components';
import { HOME_ROUTES, REPOSITORY_ROUTE, resolveRoute, resolveSubRoute } from '../../constants';
import { useControlStore } from '../../store';
import { generateRepositoryUrl, parseRepositoryUrl } from '../../utils/repository';
import DetailsView from './components/DetailsView';
import RepositoryFilterView from './components/RepositoryFilterView';
import RepositoryTreeView from './components/RepositoryTreeView';

const useStyles = makeStyles(({ breakpoints }) => ({
    container: {
        display: 'flex',
        flex: 1,
        maxWidth: (sideBarExpanded: boolean) => sideBarExpanded ? '85vw' : '93vw',
        flexDirection: 'column',
        padding: 20,
        paddingBottom: 0,
        paddingRight: 0,
        [breakpoints.down('lg')]: {
            paddingRight: 20,
            maxWidth: (sideBarExpanded: boolean) => sideBarExpanded ? '85vw' : '92vw',
        }
    }
}));

export type RepositoryFilter = {
    units: boolean;
    projects: boolean;
};

function Repository(): React.ReactElement {
    const sideBarExpanded = useControlStore(state => state.sideBarExpanded);
    const classes = useStyles(sideBarExpanded);

    return (
        <Box className={classes.container}>
            <PrivateRoute path={resolveRoute(HOME_ROUTES.REPOSITORY)}>
                <PrivateRoute
                    exact
                    path={resolveSubRoute(REPOSITORY_ROUTE.TYPE, REPOSITORY_ROUTE.ROUTES.VIEW)}
                    component={TreeViewPage}
                />
                <PrivateRoute
                    exact
                    path={resolveSubRoute(REPOSITORY_ROUTE.TYPE, REPOSITORY_ROUTE.ROUTES.DETAILS)}
                    component={DetailsView}
                />
                <PrivateRoute exact path={resolveSubRoute(REPOSITORY_ROUTE.TYPE, 'details')}>
                    <Redirect to={resolveSubRoute(REPOSITORY_ROUTE.TYPE, REPOSITORY_ROUTE.ROUTES.VIEW)} />
                </PrivateRoute>
            </PrivateRoute>
        </Box>
    );
}

function TreeViewPage(): React.ReactElement {
    const history = useHistory();
    const { search } = useLocation();

    const queries = parseRepositoryUrl(search);

    const initialFilterState: RepositoryFilter = {
        units: true,
        projects: false
    };

    const defaultFilterState = Object.keys(queries).length ? queries : initialFilterState;

    const [filter] = useState<RepositoryFilter>(defaultFilterState);

    useEffect(() => {
        const route = generateRepositoryUrl(filter);
        history.push(route);
    }, [filter, history]);

    return (
        <React.Fragment>
            <RepositoryFilterView />
            <RepositoryTreeView />
        </React.Fragment>
    );
}

export default Repository;