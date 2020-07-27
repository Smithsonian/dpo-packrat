import React from 'react';
import { Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import IngestionSidebar from './components/IngestionSidebar';
import { useRouteMatch, Route, Redirect } from 'react-router';
import { resolveRoute, resolveSubRoute, HOME_ROUTES, INGESTION_ROUTE, INGESTION_ROUTES_TYPE } from '../../constants';

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
            <Route exact path={path}>
                <Redirect to={resolveSubRoute(HOME_ROUTES.INGESTION, INGESTION_ROUTES_TYPE.FILES)} />
            </Route>

            <Route path={resolveRoute(INGESTION_ROUTE.TYPE)}>
                <IngestionSidebar />
                <Route
                    exact
                    path={resolveSubRoute(HOME_ROUTES.INGESTION, INGESTION_ROUTES_TYPE.FILES)}
                    component={() => (
                        <Typography variant='subtitle1'>Files</Typography>
                    )}
                />

                <Route
                    exact
                    path={resolveSubRoute(HOME_ROUTES.INGESTION, INGESTION_ROUTES_TYPE.SUBJECT_ITEM)}
                    component={() => (
                        <Typography variant='subtitle1'>Subject</Typography>
                    )}
                />

                <Route
                    exact
                    path={resolveSubRoute(HOME_ROUTES.INGESTION, INGESTION_ROUTES_TYPE.METADATA)}
                    component={() => (
                        <Typography variant='subtitle1'>Metadata</Typography>
                    )}
                />
            </Route>

        </Box>
    );
}

export default Ingestion;