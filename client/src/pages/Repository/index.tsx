/* eslint-disable react-hooks/exhaustive-deps */
/**
 * Repository
 *
 * This component renders Repository UI and all the sub-components like Filter and
 * TreeView.
 */
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { useEffect } from 'react';
import { Redirect, useHistory, useLocation } from 'react-router';
import { PrivateRoute } from '../../components';
import { HOME_ROUTES, REPOSITORY_ROUTE, resolveRoute, resolveSubRoute } from '../../constants';
import { useControlStore, useRepositoryStore } from '../../store';
import { eMetadata, eSystemObjectType } from '../../types/server';
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
    repositoryRootType: eSystemObjectType[];
    objectsToDisplay: eSystemObjectType[];
    metadataToDisplay: eMetadata[];
    units: number[];
    projects: number[];
    has: number;
    missing: number;
    captureMethod: number;
    variantType: number;
    modelPurpose: number;
    modelFileType: number;
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
    const {
        repositoryRootType,
        objectsToDisplay,
        metadataToDisplay,
        units,
        projects,
        has,
        missing,
        captureMethod,
        variantType,
        modelPurpose,
        modelFileType,
        updateRepositoryFilter
    } = useRepositoryStore();

    const queries: RepositoryFilter = parseRepositoryUrl(search);

    const filterState: RepositoryFilter = React.useMemo(() => ({
        repositoryRootType,
        objectsToDisplay,
        metadataToDisplay,
        units,
        projects,
        has,
        missing,
        captureMethod,
        variantType,
        modelPurpose,
        modelFileType,
    }), [
        repositoryRootType,
        objectsToDisplay,
        metadataToDisplay,
        units,
        projects,
        has,
        missing,
        captureMethod,
        variantType,
        modelPurpose,
        modelFileType,
    ]);

    const initialFilterState = Object.keys(queries).length ? queries : filterState;

    useEffect(() => {
        updateRepositoryFilter(initialFilterState);
    }, [updateRepositoryFilter]);

    useEffect(() => {
        const route = generateRepositoryUrl(filterState);
        history.push(route);
    }, [filterState, history]);

    return (
        <React.Fragment>
            <RepositoryFilterView />
            <RepositoryTreeView />
        </React.Fragment>
    );
}

export default Repository;