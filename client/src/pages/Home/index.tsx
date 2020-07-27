import React, { useState } from 'react';
import { Box, } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import SidebarMenu from './components/SidebarMenu';
import { Route } from 'react-router';
import { DASHBOARD_TYPES, resolveRoute } from '../../constants';
import Ingestion from '../Ingestion';
import { Header } from '../../components';

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

    const onToggle = (): void => setExpanded(setExpanded => !setExpanded);

    return (
        <Box className={classes.container}>
            <Header />
            <Box className={classes.content}>
                <SidebarMenu isExpanded={isExpanded} onToggle={onToggle} />
                <Route exact path={resolveRoute(DASHBOARD_TYPES.INGESTION)} component={Ingestion} />
            </Box>
        </Box>
    );
}

export default Home;