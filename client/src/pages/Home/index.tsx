import React, { useState } from 'react';
import { Box, } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import SidePanel from './components/SidePanel';
import { Redirect, useRouteMatch } from 'react-router';
import Ingestion from '../Ingestion';
import { Header, PrivateRoute } from '../../components';
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
            <PrivateRoute exact path={path}>
                <Redirect to={resolveRoute(HOME_ROUTES.DASHBOARD)} />
            </PrivateRoute>
            <PrivateRoute path={HOME_ROUTE.TYPE}>
                <Header />
                <Box className={classes.content}>
                    <SidePanel isExpanded={isExpanded} onToggle={onToggle} />
                    <PrivateRoute path={resolveRoute(HOME_ROUTES.INGESTION)} component={Ingestion} />
                </Box>
            </PrivateRoute>
        </Box>
    );
}

export default Home;