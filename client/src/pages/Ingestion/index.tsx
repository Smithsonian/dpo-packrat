import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { useContext, useEffect, useState } from 'react';
import { Redirect, useRouteMatch } from 'react-router';
import { PrivateRoute } from '../../components';
import { IngestionSidebarMenu, IngestionSidebarOption } from './components/IngestionSidebar';
import { HOME_ROUTES, INGESTION_ROUTE, INGESTION_ROUTES_TYPE, INGESTION_PARAMS_TYPE, resolveRoute, resolveSubRoute } from '../../constants';
import Uploads from './components/Uploads';
import Metadata from './components/Metadata';
import SubjectItem from './components/SubjectItem';
import { AppContext } from '../../context';

const useStyles = makeStyles(() => ({
    container: {
        display: 'flex',
        flex: 1,
    }
}));

function Ingestion(): React.ReactElement {
    const classes = useStyles();
    const { path } = useRouteMatch();
    const { ingestion: { metadata } } = useContext(AppContext);

    const [options, setOptions] = useState<IngestionSidebarOption[]>([]);
    const hasMetadata = !!metadata.length;

    useEffect(() => {
        const updatedOptions: IngestionSidebarOption[] = [];

        if (metadata.length) {
            updatedOptions.push({
                title: 'Subject & Item',
                route: INGESTION_ROUTE.ROUTES.SUBJECT_ITEM,
                enabled: false
            });

            metadata.forEach(({ file: { id, name, type } }) => {
                updatedOptions.push({
                    title: 'Metadata',
                    subtitle: name,
                    route: `${INGESTION_ROUTE.ROUTES.METADATA}?file=${id}&type=${type}`,
                    enabled: false
                });
            });
        }

        setOptions(updatedOptions);
    }, [metadata]);

    return (
        <Box className={classes.container}>
            <PrivateRoute exact path={path}>
                <Redirect to={resolveSubRoute(HOME_ROUTES.INGESTION, INGESTION_ROUTES_TYPE.UPLOADS)} />
            </PrivateRoute>

            <PrivateRoute path={resolveRoute(INGESTION_ROUTE.TYPE)}>

                {hasMetadata && (
                    <IngestionSidebarMenu
                        title='INGESTION'
                        paramIdentifier={INGESTION_PARAMS_TYPE.STEP}
                        options={options}
                    />
                )}

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
            </PrivateRoute>
        </Box>
    );
}

export default Ingestion;