import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { useEffect, useState } from 'react';
import { Redirect, useRouteMatch } from 'react-router';
import { PrivateRoute } from '../../components';
import { IngestionSidebarMenu, IngestionSidebarOption } from './components/IngestionSidebar';
import { HOME_ROUTES, INGESTION_ROUTE, INGESTION_ROUTES_TYPE, INGESTION_PARAMS_TYPE, resolveRoute, resolveSubRoute } from '../../constants';
import Uploads from './components/Uploads';
import Metadata from './components/Metadata';
import SubjectItem from './components/SubjectItem';
import { Prompt } from 'react-router-dom';
import useIngest from './hooks/useIngest';
import { useMetadata } from '../../store';

const useStyles = makeStyles(() => ({
    container: {
        display: 'flex',
        flex: 1,
    }
}));

function Ingestion(): React.ReactElement {
    const classes = useStyles();
    const { path } = useRouteMatch();
    const { metadatas } = useMetadata();
    const { ingestionReset } = useIngest();

    const [options, setOptions] = useState<IngestionSidebarOption[]>([]);

    useEffect(() => {
        const updatedOptions: IngestionSidebarOption[] = [];

        if (metadatas.length) {
            updatedOptions.push({
                title: 'Subject & Item',
                route: INGESTION_ROUTE.ROUTES.SUBJECT_ITEM,
                enabled: false
            });

            metadatas.forEach(({ file: { name } }) => {
                updatedOptions.push({
                    title: 'Metadata',
                    subtitle: name,
                    route: INGESTION_ROUTE.ROUTES.METADATA,
                    enabled: false
                });
            });
        }

        setOptions(updatedOptions);
    }, [metadatas]);

    const routeChangeCheck = ({ pathname }): boolean | string => {
        let allowChange: boolean = true;
        const { href: url } = window.location;

        if (url.includes(INGESTION_ROUTES_TYPE.SUBJECT_ITEM)) {
            allowChange = pathname.includes(INGESTION_ROUTES_TYPE.SUBJECT_ITEM) || pathname.includes(INGESTION_ROUTES_TYPE.METADATA);
        }

        if (url.includes(INGESTION_ROUTES_TYPE.METADATA)) {
            if (url.includes('last=true')) return true;
            allowChange = pathname.includes(INGESTION_ROUTES_TYPE.METADATA) || pathname.includes(INGESTION_ROUTES_TYPE.SUBJECT_ITEM);
        }

        if (allowChange) return true;

        const isConfirmed = global.confirm('Are you sure you want to go to navigate away? changes might be lost');

        if (isConfirmed) {
            ingestionReset();
        }

        return isConfirmed;
    };

    return (
        <Box className={classes.container}>
            <Prompt message={routeChangeCheck} />
            <PrivateRoute exact path={path}>
                <Redirect to={resolveSubRoute(HOME_ROUTES.INGESTION, INGESTION_ROUTES_TYPE.UPLOADS)} />
            </PrivateRoute>

            <PrivateRoute path={resolveRoute(INGESTION_ROUTE.TYPE)}>
                <IngestionSidebarMenu
                    title='INGESTION'
                    paramIdentifier={INGESTION_PARAMS_TYPE.STEP}
                    options={options}
                />

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