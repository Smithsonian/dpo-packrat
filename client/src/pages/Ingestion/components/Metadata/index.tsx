import React from 'react';
import { Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { resolveSubRoute, INGESTION_ROUTE, HOME_ROUTES } from '../../../../constants';
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

function Metadata(): React.ReactElement {
    const classes = useStyles();

    const onFinish = () => {
        alert('Finished');
    };

    return (
        <Box className={classes.container}>
            <Box className={classes.content}>
                <Typography variant='subtitle1'>Metadata</Typography>
            </Box>
            <SidebarBottomNavigator
                leftLabel='Previous'
                leftRoute={resolveSubRoute(HOME_ROUTES.INGESTION, INGESTION_ROUTE.ROUTES.SUBJECT_ITEM)}
                rightLabel='Finish'
                onClickRight={onFinish}
            />
        </Box>
    );
}

export default Metadata;