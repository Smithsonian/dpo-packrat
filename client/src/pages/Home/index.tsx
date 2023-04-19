/**
 * Home
 *
 * This component renders Home page UI and all the sub routes like Dashboard, Ingestion,
 * Repository, Workflow.
 */
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { HOME_ROUTES, resolveRoute } from '../../constants';
import Ingestion from '../Ingestion';
import Repository from '../Repository';
import Workflow from '../Workflow';
import Admin from '../Admin';
import AdminSidebarMenu from '../Admin/components/AdminSidebarMenu';
import Audit from '../Audit';

const useStyles = makeStyles({
    adminContainer: {
        display: 'flex',
        font: 'var(--unnamed-font-style-normal) normal medium 11px/17px var(--unnamed-font-family-heebo)',
        width: '100%'
    },
    ingestionContainer: {
        display: 'flex',
        flex: 1
    }
});

function Home(): React.ReactElement {
    const classes = useStyles();

    return (
        <Routes>
            <Route path='/' element={<Navigate to={resolveRoute(HOME_ROUTES.REPOSITORY)} />}></Route>
            <Route path={`${resolveRoute(HOME_ROUTES.REPOSITORY)}/*`} element={<Repository />} />
            <Route path={resolveRoute(HOME_ROUTES.WORKFLOW)} element={<Workflow />} />
            <Route path={`${resolveRoute(HOME_ROUTES.ADMIN)}/*`} element={<Box className={classes.adminContainer}><AdminSidebarMenu /><Admin /></Box>} />
            <Route path={`${resolveRoute(HOME_ROUTES.INGESTION)}/*`} element={<Ingestion />} />
            <Route path={`${resolveRoute(HOME_ROUTES.AUDIT)}/*`} element={<Audit />} />
        </Routes>
    );
}

export default Home;