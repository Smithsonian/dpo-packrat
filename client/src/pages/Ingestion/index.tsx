import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { Redirect, useRouteMatch } from 'react-router';
import { PrivateRoute, SidebarMenu, SidebarOption } from '../../components';
import { HOME_ROUTES, INGESTION_ROUTE, INGESTION_ROUTES_TYPE, INGESTION_PARAMS_TYPE, resolveRoute, resolveSubRoute } from '../../constants';
import Uploads from './components/Uploads';
import Metadata from './components/Metadata';
import SubjectItem from './components/SubjectItem';

const useStyles = makeStyles(() => ({
    container: {
        display: 'flex',
        flex: 1,
    }
}));

function Ingestion(): React.ReactElement {
    const classes = useStyles();
    const { path } = useRouteMatch();

    const options: SidebarOption[] = [
        {
            label: 'Uploads',
            type: INGESTION_ROUTE.ROUTES.UPLOADS
        },
        {
            label: 'Files',
            type: INGESTION_ROUTE.ROUTES.FILES
        },
        {
            label: 'Subject & Item',
            type: INGESTION_ROUTE.ROUTES.SUBJECT_ITEM
        },
        {
            label: 'Metadata',
            type: INGESTION_ROUTE.ROUTES.METADATA
        }
    ];

    return (
        <Box className={classes.container}>
            <PrivateRoute exact path={path}>
                <Redirect to={resolveSubRoute(HOME_ROUTES.INGESTION, INGESTION_ROUTES_TYPE.FILES)} />
            </PrivateRoute>

            <PrivateRoute path={resolveRoute(INGESTION_ROUTE.TYPE)}>
                <SidebarMenu
                    title='INGESTION'
                    paramIdentifier={INGESTION_PARAMS_TYPE.STEP}
                    options={options}
                >
                    <PrivateRoute
                        exact
                        path={resolveSubRoute(HOME_ROUTES.INGESTION, INGESTION_ROUTES_TYPE.UPLOADS)}
                        component={Uploads}
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
                </SidebarMenu>
            </PrivateRoute>
        </Box>
    );
}

export default Ingestion;