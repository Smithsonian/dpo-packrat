import React from 'react';
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import RepositoryFilterView from './components/RepositoryFilterView';
import RepositoryTreeView from './components/RepositoryTreeView';
import RepositoryMetadataView from './components/RepositoryMetadataView';

const useStyles = makeStyles(() => ({
    container: {
        display: 'flex',
        flex: 1,
        padding: 40
    }
}));

function Repository(): React.ReactElement {
    const classes = useStyles();
    return (
        <Box className={classes.container}>
            <RepositoryFilterView />
            <RepositoryTreeView />
            <RepositoryMetadataView />
        </Box>
    );
}

export default Repository;