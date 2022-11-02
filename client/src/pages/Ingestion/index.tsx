/* eslint-disable react-hooks/exhaustive-deps */

/**
 * Ingestion
 *
 * This component renders Ingestion UI and all the sub routes like Uploads, Subject Item
 * and Metadata.
 */
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { useEffect, useState } from 'react';
import { Route, Routes, Navigate } from 'react-router';
import { INGESTION_PARAMS_TYPE, INGESTION_ROUTE,resolveRoute, INGESTION_ROUTES_TYPE, resolveSubRoute, HOME_ROUTES } from '../../constants';
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
                    title: 'Subject & Media Group',
                    route: INGESTION_ROUTE.ROUTES.SUBJECT_MEDIA_GROUP,
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

    // we want to reset the ingestion workflow state every time we mount/navigate to this component
    useEffect(() => {
        ingestionReset(true);
    }, []);

    // const routeChangeCheck = ({ pathname }): boolean | string => {
    //     let allowChange: boolean = true;
    //     const { href: url } = window.location;

    //     // reset when we navigate to any other part of the app from subject/item or metadata
    //     if (!pathname.includes(HOME_ROUTES.INGESTION)) {
    //         allowChange = !(url.includes(INGESTION_ROUTES_TYPE.METADATA) || url.includes(INGESTION_ROUTES_TYPE.SUBJECT_MEDIA_GROUP));
    //     }

    //     if (url.includes(INGESTION_ROUTES_TYPE.SUBJECT_MEDIA_GROUP)) {
    //         allowChange = pathname.includes(INGESTION_ROUTES_TYPE.SUBJECT_MEDIA_GROUP) || pathname.includes(INGESTION_ROUTES_TYPE.METADATA);
    //     }

    //     // handle case of use clicking on side panel options while in ingestion
    //     // without this block, router will redirect to uploads without confirming a reset
    //     if (pathname === '/ingestion' && (url.includes(INGESTION_ROUTES_TYPE.METADATA) || url.includes(INGESTION_ROUTES_TYPE.SUBJECT_MEDIA_GROUP) || url.includes(INGESTION_ROUTES_TYPE.UPLOADS))) {
    //         allowChange = false;
    //     }

    //     if (allowChange) return true;

    //     const isConfirmed = global.confirm('Are you sure you want to go to navigate away? Changes might be lost');

    //     if (isConfirmed) {
    //         ingestionReset(false);
    //     }

    //     return isConfirmed;
    // };

    return (
        <Box className={classes.container}>
            <IngestionSidebarMenu title='INGESTION' paramIdentifier={INGESTION_PARAMS_TYPE.STEP} options={options} />
            <Routes>
                <Route path={resolveRoute(INGESTION_ROUTES_TYPE.UPLOADS)} element={<Uploads />} />
                <Route path={resolveRoute(INGESTION_ROUTES_TYPE.SUBJECT_MEDIA_GROUP)} element={<SubjectItem />} />
                <Route path={resolveRoute(INGESTION_ROUTES_TYPE.METADATA)} element={<Metadata />} />
                <Route path='/' element={<Navigate to={resolveSubRoute(HOME_ROUTES.INGESTION, INGESTION_ROUTES_TYPE.UPLOADS)} />} />
            </Routes>
        </Box>
    );
}

export default Ingestion;
