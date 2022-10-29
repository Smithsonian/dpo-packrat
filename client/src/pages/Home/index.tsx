/**
 * Home
 *
 * This component renders Home page UI and all the sub routes like Dashboard, Ingestion,
 * Repository, Workflow.
 */
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { /*useEffect*/ } from 'react';
import { Navigate, Route, Routes } from 'react-router';
// import { Header } from '../../components';
import { HOME_ROUTES, resolveRoute } from '../../constants';
// import { useControlStore } from '../../store';
import Ingestion from '../Ingestion';
import Repository from '../Repository';
import Workflow from '../Workflow';
import Admin from '../Admin';
import AdminSidebarMenu from '../Admin/components/AdminSidebarMenu';
// import SidePanel from './components/SidePanel';

// const useStyles = makeStyles(() => ({
//     container: {
//         display: 'flex',
//         flexDirection: 'column',
//         flex: 1,
//         width: 'fit-content',
//         minWidth: '100%'
//     },
//     content: {
//         display: 'flex',
//         flex: 1
//     }
// }));

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
    // const [sideBarExpanded, toggleSidebar, initializeSidebarPosition] = useControlStore(state => [state.sideBarExpanded, state.toggleSidebar, state.initializeSidebarPosition]);
    // const onToggle = (): void => toggleSidebar(!sideBarExpanded);

    // useEffect(() => {
    //     initializeSidebarPosition();
    // }, [initializeSidebarPosition]);

    return (
        <Routes>
            <Route path='/' element={<Navigate to={resolveRoute(HOME_ROUTES.REPOSITORY)} />}></Route>

            <Route path={`${resolveRoute(HOME_ROUTES.REPOSITORY)}/*`} element={<Repository />} />
            <Route path={resolveRoute(HOME_ROUTES.WORKFLOW)} element={<Workflow />} />
            <Route path={`${resolveRoute(HOME_ROUTES.ADMIN)}/*`} element={
                <Box className={classes.adminContainer}>
                    <AdminSidebarMenu />
                    <Admin />
                </Box>
            }/>
            <Route path={`${resolveRoute(HOME_ROUTES.INGESTION)}/*`} element={
                <Ingestion />
            } />
        </Routes>
    );
}

export default Home;