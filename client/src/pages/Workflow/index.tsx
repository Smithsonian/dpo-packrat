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
        flexDirection: 'column',
        padding: 20,
        paddingBottom: 0,
        paddingRight: 0
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
                    <PrivateRoute path={resolveRoute(HOME_ROUTES.WORKFLOW)} component={WorkflowView} />
                </PrivateRoute>
            </Box>
        </React.Fragment>

    );
}

export default Workflow;
