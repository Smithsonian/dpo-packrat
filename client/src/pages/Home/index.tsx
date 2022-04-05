/**
 * Home
 *
 * This component renders Home page UI and all the sub routes like Dashboard, Ingestion,
 * Repository, Workflow.
 */
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { useEffect } from 'react';
import { Redirect } from 'react-router';
import { Header, PrivateRoute } from '../../components';
import { HOME_ROUTE, HOME_ROUTES, resolveRoute } from '../../constants';
import { useControlStore } from '../../store';
import Ingestion from '../Ingestion';
import Repository from '../Repository';
import Workflow from '../Workflow';
import Admin from '../Admin';
import SidePanel from './components/SidePanel';

const useStyles = makeStyles(() => ({
    container: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        width: 'fit-content',
        minWidth: '100%'
    },
    content: {
        display: 'flex',
        flex: 1
    }
}));

function Home(): React.ReactElement {
    const classes = useStyles();
    const [sideBarExpanded, toggleSidebar, initializeSidebarPosition] = useControlStore(state => [state.sideBarExpanded, state.toggleSidebar, state.initializeSidebarPosition]);
    const onToggle = (): void => toggleSidebar(!sideBarExpanded);

    useEffect(() => {
        initializeSidebarPosition();
    }, []);

    return (
        <Box className={classes.container}>
            <PrivateRoute exact path='/'>
                <Redirect to={resolveRoute(HOME_ROUTES.REPOSITORY)} />
            </PrivateRoute>
            <PrivateRoute path={HOME_ROUTE.TYPE}>
                <Header />
                <Box className={classes.content}>
                    <SidePanel isExpanded={sideBarExpanded} onToggle={onToggle} />
                    <PrivateRoute path={resolveRoute(HOME_ROUTES.REPOSITORY)} component={Repository} />
                    <PrivateRoute path={resolveRoute(HOME_ROUTES.INGESTION)} component={Ingestion} />
                    <PrivateRoute path={resolveRoute(HOME_ROUTES.WORKFLOW)} component={Workflow} />
                    <PrivateRoute path={resolveRoute(HOME_ROUTES.ADMIN)} component={Admin} />
                </Box>
            </PrivateRoute>
        </Box>
    );
}

export default Home;
