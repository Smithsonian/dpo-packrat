import React from 'react';
import { Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { resolveRoute, HOME_ROUTES, resolveSubRoute, INGESTION_ROUTE } from '../../../../constants';
import { SidebarBottomNavigator } from '../../../../components';

const useStyles = makeStyles(() => ({
    container: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column'
    },
    content: {
        display: 'flex',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
}));

function Files(): React.ReactElement {
    const classes = useStyles();

    return (
        <Box className={classes.container}>
            <Box className={classes.content}>
                <Typography variant='subtitle1'>Files</Typography>
            </Box>
            <SidebarBottomNavigator
                leftLabel='Cancel'
                leftRoute={resolveRoute(HOME_ROUTES.DASHBOARD)}
                rightLabel='Next'
                rightRoute={resolveSubRoute(HOME_ROUTES.INGESTION, INGESTION_ROUTE.ROUTES.SUBJECT_ITEM)}
            />
        </Box>
    );
}

export default Files;