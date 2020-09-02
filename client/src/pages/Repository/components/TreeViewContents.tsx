import React from 'react';
import { Box, CircularProgress } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles({
    container: {
        display: 'flex',
        height: 50,
        alignItems: 'center',
    }
});

interface TreeViewContents {
    loading: boolean;
    children: React.ReactElement | React.ReactElement[]
}

function TreeViewContents(props: TreeViewContents): React.ReactElement {
    const { loading, children } = props;
    const classes = useStyles();

    return (
        <>
            {loading ? (
                <Box className={classes.container}>
                    <CircularProgress size={15} />
                </Box>
            ) : children}
        </>
    );
}

export default TreeViewContents;
