import React from 'react';
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';


const useStyles = makeStyles(() => ({
    container: {
        display: 'flex',
        flex: 1,
        padding: 40
    }
}));

function RepositoryMetadataView(): React.ReactElement {
    const classes = useStyles();
    return (
        <Box className={classes.container}>
        </Box>
    );
}

export default RepositoryMetadataView;
