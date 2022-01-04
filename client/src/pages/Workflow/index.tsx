import React from 'react';
import { Box } from '@material-ui/core';
import { PrivateRoute } from '../../components';
import { HOME_ROUTES, resolveRoute } from '../../constants';
import { makeStyles } from '@material-ui/core/styles';
import WorkflowView from './components/WorkflowView/index';
import { Helmet } from 'react-helmet';

const useStyles = makeStyles(() => ({
    container: {
        display: 'flex',
        flex: 1,
        // maxWidth: (sideBarExpanded: boolean) => (sideBarExpanded ? '85vw' : '93vw'),
        flexDirection: 'column',
        padding: 20,
        paddingBottom: 0,
        paddingRight: 0
        // [breakpoints.down('lg')]: {
        //     paddingRight: 20,
        //     maxWidth: (sideBarExpanded: boolean) => (sideBarExpanded ? '85vw' : '92vw')
        // }
    }
}));

function Workflow(): React.ReactElement {
    const classes = useStyles();

    return (
        <React.Fragment>
            <Helmet>
                <title>Workflow</title>
            </Helmet>
            <Box className={classes.container}>
                <PrivateRoute path={resolveRoute(HOME_ROUTES.WORKFLOW)}>
                    <PrivateRoute exact path={resolveRoute(HOME_ROUTES.WORKFLOW)} component={WorkflowView} />
                </PrivateRoute>
            </Box>
        </React.Fragment>

    );
}

export default Workflow;
