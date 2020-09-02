import React from 'react';
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import RepositoryTreeView from './components/RepositoryTreeView';

const useStyles = makeStyles(() => ({
    container: {
        display: 'flex',
        flex: 1,
        padding: '40px 0px 0px 40px'
    }
}));

function Repository(): React.ReactElement {
    const classes = useStyles();
    return (
        <Box className={classes.container}>
            <RepositoryTreeView />
        </Box>
    );
}

export default Repository;