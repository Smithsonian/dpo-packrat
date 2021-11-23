/**
 * Ingestion
 *
 * This component renders Ingestion UI and all the sub routes like Uploads, Subject Item
 * and Metadata.
 */
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { useEffect, useState } from 'react';
import { Redirect, useRouteMatch } from 'react-router';
import { Prompt } from 'react-router-dom';
import { PrivateRoute } from '../../components';
import { HOME_ROUTES, INGESTION_PARAMS_TYPE, INGESTION_ROUTE, INGESTION_ROUTES_TYPE, resolveRoute, resolveSubRoute } from '../../constants';
import { useMetadataStore } from '../../store';
import { IngestionSidebarMenu, IngestionSidebarOption } from './components/IngestionSidebar';
import Metadata from './components/Metadata';
import SubjectItem from './components/SubjectItem';
import Uploads from './components/Uploads';
import useIngest from './hooks/useIngest';

const useStyles = makeStyles(() => ({
    container: {
        display: 'flex',
        flex: 1
    }
}));

function Ingestion(): React.ReactElement {
    const classes = useStyles();
    const { path } = useRouteMatch();
    const { metadatas } = useMetadataStore();
    const { ingestionReset } = useIngest();

    const [options, setOptions] = useState<IngestionSidebarOption[]>([]);

    // check metadata. if every entry is update (idAsset) or attachment (idSOAttachment) then we want to skip the subject/item step
    const includeSubjectItem = !metadatas.every((metadata) => metadata.file.idAsset || metadata.file.idSOAttachment);

    useEffect(() => {
        const updatedOptions: IngestionSidebarOption[] = [];

        if (metadatas.length) {
            if (includeSubjectItem) {
                updatedOptions.push({
                    title: 'Subject & Item',
                    route: INGESTION_ROUTE.ROUTES.SUBJECT_ITEM,
                    enabled: false
                });
            }

            metadatas.forEach(({ file: { id, name, type } }) => {
                const route = `${INGESTION_ROUTE.ROUTES.METADATA}?fileId=${id}&type=${type}`;
                updatedOptions.push({
                    title: 'Metadata',
                    subtitle: name,
                    route,
                    enabled: false
                });
            });
        }

        setOptions(updatedOptions);
    }, [metadatas, includeSubjectItem]);

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
                <IngestionSidebarMenu title='INGESTION' paramIdentifier={INGESTION_PARAMS_TYPE.STEP} options={options} />

                <PrivateRoute exact path={resolveSubRoute(HOME_ROUTES.INGESTION, INGESTION_ROUTES_TYPE.UPLOADS)} component={Uploads} />

                <PrivateRoute exact path={resolveSubRoute(HOME_ROUTES.INGESTION, INGESTION_ROUTES_TYPE.SUBJECT_ITEM)} component={SubjectItem} />

                <PrivateRoute exact path={resolveSubRoute(HOME_ROUTES.INGESTION, INGESTION_ROUTES_TYPE.METADATA)} component={Metadata} />
            </PrivateRoute>
        </Box>
    );
}

export default Ingestion;
