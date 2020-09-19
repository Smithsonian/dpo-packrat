import React from 'react';
import { Box, CircularProgress, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(({ palette }) => ({
    container: {
        display: 'flex',
        height: 50,
        alignItems: 'center',
    },
    emptyList: {
        display: 'flex',
        height: 50,
        width: '20%',
        alignItems: 'center',
        justifyContent: 'center',
        color: palette.grey[400],
    }
}));

export enum RepositoryContentType {
    projects = 'projects',
    units = 'units',
    subjects = 'subjects',
    items = 'items',
    data = 'data',
}

interface TreeViewContentsProps {
    loading: boolean;
    isEmpty: boolean;
    contentType: RepositoryContentType;
    children: React.ReactElement | React.ReactElement[]
}

function TreeViewContents(props: TreeViewContentsProps): React.ReactElement {
    const { loading, isEmpty, contentType, children } = props;
    const classes = useStyles();

    return (
        <>
            {loading ? (
                <Box className={classes.container}>
                    <CircularProgress size={20} />
                </Box>
            ) : isEmpty ? (
                <Box className={classes.emptyList}>
                    <Typography variant='body2' color='inherit'>No {contentType} found</Typography>
                </Box>
            ) : children}
        </>
    );
}

export default TreeViewContents;
