import React from 'react';
import { Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { eSystemObjectType } from '../../../../types/server';
import { getTermForSystemObjectType } from '../../../../utils/repository';
import { Progress } from '../../../../components';

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
        alignItems: 'center',
        color: palette.grey[400],
        [breakpoints.down('lg')]: {
            height: 30,
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

type ReactChildren = React.ReactElement | React.ReactElement[] | Element[] | undefined;

interface TreeViewContentsProps {
    name: string;
    loading: boolean;
    isEmpty: boolean;
    objectType: eSystemObjectType;
    children: ReactChildren
}

function TreeViewContents(props: TreeViewContentsProps): React.ReactElement {
    const { name, loading, isEmpty, objectType, children } = props;
    const classes = useStyles();

    const contentTerm = getTermForSystemObjectType(objectType);

    let content: ReactChildren = (
        <Box className={classes.container}>
            <Progress size={20} />
        </Box>
    );

    if (!loading) {
        if (isEmpty) {
            content = (
                <Box className={classes.emptyList}>
                    <Typography className={classes.emptyListText} variant='caption' color='inherit'>No objects found for {contentTerm} {name}</Typography>
                </Box>
            );
        } else {
            content = children;
        }
    }

    return (
        <React.Fragment>
            {content}
        </React.Fragment>
    );
}

export default TreeViewContents;
