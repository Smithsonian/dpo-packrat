import React from 'react';
import { Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { HOME_ROUTES, resolveSubRoute, INGESTION_ROUTE } from '../../../../constants';
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

function SubjectItem(): React.ReactElement {
    const classes = useStyles();

    return (
        <Box className={classes.container}>
            <Box className={classes.content}>
                <Typography variant='subtitle1'>Subject and Item</Typography>
                <input />
            </Box>
            <SidebarBottomNavigator
                leftLabel='Previous'
                leftRoute={resolveSubRoute(HOME_ROUTES.INGESTION, INGESTION_ROUTE.ROUTES.FILES)}
                rightLabel='Next'
                rightRoute={resolveSubRoute(HOME_ROUTES.INGESTION, INGESTION_ROUTE.ROUTES.METADATA)}
            />
        </Box>
    );
}

export default SubjectItem;