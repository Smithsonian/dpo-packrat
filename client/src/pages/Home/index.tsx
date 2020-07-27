import React, { useState } from 'react';
import { Box, } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import SidebarMenu from './components/SidebarMenu';
import { Route, Redirect, useRouteMatch } from 'react-router';
import Ingestion from '../Ingestion';
import { Header } from '../../components';
import { resolveRoute, HOME_ROUTES, HOME_ROUTE } from '../../constants';

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
    const [isExpanded, setExpanded] = useState(true);
    const { path } = useRouteMatch();

    const onToggle = (): void => setExpanded(setExpanded => !setExpanded);

    return (
        <Box className={classes.container}>
            <Route exact path={path}>
                <Redirect to={resolveRoute(HOME_ROUTES.DASHBOARD)} />
            </Route>
            <Route path={HOME_ROUTE.TYPE}>
                <Header />
                <Box className={classes.content}>
                    <SidebarMenu isExpanded={isExpanded} onToggle={onToggle} />
                    <Route path={resolveRoute(HOME_ROUTES.INGESTION)} component={Ingestion} />
                </Box>
            </Route>
        </Box>
    );
}

export default Home;