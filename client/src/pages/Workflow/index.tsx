import React from 'react';
import { Box } from '@material-ui/core';
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
                <WorkflowView />
            </Box>
        </React.Fragment>

    );
}

export default Workflow;
