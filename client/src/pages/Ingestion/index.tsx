import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { Redirect, useRouteMatch } from 'react-router';
import { PrivateRoute } from '../../components';
import { HOME_ROUTES, INGESTION_ROUTE, INGESTION_ROUTES_TYPE, resolveRoute, resolveSubRoute } from '../../constants';
import Files from './components/Files';
import SubjectItem from './components/SubjectItem';
import Metadata from './components/Metadata';
import IngestionSidebar from './components/sidebar/IngestionSidebar';

const useStyles = makeStyles(() => ({
    container: {
        display: 'flex',
        flex: 1,
    }
}));

function Ingestion(): React.ReactElement {
    const classes = useStyles();
    const { path } = useRouteMatch();

    return (
        <Box className={classes.container}>
            <PrivateRoute exact path={path}>
                <Redirect to={resolveSubRoute(HOME_ROUTES.INGESTION, INGESTION_ROUTES_TYPE.FILES)} />
            </PrivateRoute>

            <PrivateRoute path={resolveRoute(INGESTION_ROUTE.TYPE)}>
                <IngestionSidebar />
                <PrivateRoute
                    exact
                    path={resolveSubRoute(HOME_ROUTES.INGESTION, INGESTION_ROUTES_TYPE.FILES)}
                    component={Files}
                />

                <PrivateRoute
                    exact
                    path={resolveSubRoute(HOME_ROUTES.INGESTION, INGESTION_ROUTES_TYPE.SUBJECT_ITEM)}
                    component={SubjectItem}
                />

                <PrivateRoute
                    exact
                    path={resolveSubRoute(HOME_ROUTES.INGESTION, INGESTION_ROUTES_TYPE.METADATA)}
                    component={Metadata}
                />
            </PrivateRoute>

        </Box>
    );
}

export default Ingestion;