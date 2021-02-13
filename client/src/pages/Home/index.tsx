/**
 * Home
 *
 * This component renders Home page UI and all the sub routes like Dashboard, Ingestion,
 * Repository, Workflow.
 */
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { Redirect, useRouteMatch } from 'react-router';
import { Header, PrivateRoute } from '../../components';
import { HOME_ROUTE, HOME_ROUTES, resolveRoute } from '../../constants';
import { useControlStore } from '../../store';
import Ingestion from '../Ingestion';
import Repository from '../Repository';
import SidePanel from './components/SidePanel';
import Admin from '../Admin';

const useStyles = makeStyles(() => ({
    container: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1
    },
    content: {
        display: 'flex',
        flex: 1
    }
}));

function Home(): React.ReactElement {
    const classes = useStyles();
    const [sideBarExpanded, toggleSidebar] = useControlStore(state => [state.sideBarExpanded, state.toggleSidebar]);
    const { path } = useRouteMatch();

    const onToggle = (): void => toggleSidebar(!sideBarExpanded);

    return (
        <Box className={classes.container}>
            <PrivateRoute exact path={path}>
                <Redirect to={resolveRoute(HOME_ROUTES.DASHBOARD)} />
            </PrivateRoute>
            <PrivateRoute path={HOME_ROUTE.TYPE}>
                <Header />
                <Box className={classes.content}>
                    <SidePanel isExpanded={sideBarExpanded} onToggle={onToggle} />
                    <PrivateRoute path={resolveRoute(HOME_ROUTES.REPOSITORY)} component={Repository} />
                    <PrivateRoute path={resolveRoute(HOME_ROUTES.INGESTION)} component={Ingestion} />
                    <PrivateRoute path={resolveRoute(HOME_ROUTES.ADMIN)} component={Admin} />
                </Box>
            </PrivateRoute>
        </Box>
    );
}

export default Home;
