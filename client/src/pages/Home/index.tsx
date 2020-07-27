import React, { useState } from 'react';
import { Box, } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import SidebarMenu from './components/SidebarMenu';
import { Route } from 'react-router';
import { DASHBOARD_TYPES, getRoute } from '../../constants';
import Ingestion from '../Ingestion';

const useStyles = makeStyles(() => ({
    container: {
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
            <SidebarMenu isExpanded={isExpanded} onToggle={onToggle} />
            <Route exact path={getRoute(DASHBOARD_TYPES.INGESTION)} component={Ingestion} />
        </Box>
    );
}

export default Home;