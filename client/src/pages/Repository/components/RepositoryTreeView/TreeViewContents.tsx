import React from 'react';
import { Box, CircularProgress, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { eSystemObjectType } from '../../../../types/server';
import { getTermForSystemObjectType } from '../../../../utils/repository';

const useStyles = makeStyles(({ palette, breakpoints }) => ({
    container: {
        display: 'flex',
        height: 50,
        width: '10%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyList: {
        display: 'flex',
        padding: '10px 5px',
        alignItems: 'center',
        color: palette.grey[400],
        [breakpoints.down('md')]: {
            height: 40,
        },
    },
    emptyListText: {
        [breakpoints.down('md')]: {
            fontSize: 12,
        },
    }
}));

interface TreeViewContentsProps {
    name: string;
    loading: boolean;
    isEmpty: boolean;
    objectType: eSystemObjectType;
    children: React.ReactElement | React.ReactElement[] | Element[] | undefined
}

function TreeViewContents(props: TreeViewContentsProps): React.ReactElement {
    const { name, loading, isEmpty, objectType, children } = props;
    const classes = useStyles();

    const contentTerm = getTermForSystemObjectType(objectType);

    return (
        <>
            {loading ? (
                <Box className={classes.container}>
                    <CircularProgress size={20} />
                </Box>
            ) : isEmpty ? (
                <Box className={classes.emptyList}>
                    <Typography className={classes.emptyListText} variant='caption' color='inherit'>No objects found for {contentTerm} {name}</Typography>
                </Box>
            ) : children}
        </>
    );
}

export default TreeViewContents;
