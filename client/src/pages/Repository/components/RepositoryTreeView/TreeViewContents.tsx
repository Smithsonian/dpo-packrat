import React from 'react';
import { Box, CircularProgress, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { eSystemObjectType } from '../../../../types/server';
import { getTermForSystemObjectType } from '../../../../utils/repository';

const useStyles = makeStyles(({ palette, breakpoints }) => ({
    container: {
        display: 'flex',
        height: 40,
        marginLeft: 20,
        position: 'sticky',
        left: 20,
        alignItems: 'center',
        [breakpoints.down('lg')]: {
            height: 30,
        },
    },
    emptyList: {
        display: 'flex',
        height: 40,
        padding: '10px 15px',
        alignItems: 'center',
        color: palette.grey[400],
        [breakpoints.down('lg')]: {
            height: 25,
        },
    },
    emptyListText: {
        position: 'sticky',
        left: 15,
        [breakpoints.down('lg')]: {
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
