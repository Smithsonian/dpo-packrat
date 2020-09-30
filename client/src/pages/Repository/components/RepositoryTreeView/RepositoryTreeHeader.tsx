import React from 'react';
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { MetadataView } from './StyledTreeItem';

const useStyles = makeStyles(({ palette, typography, breakpoints }) => ({
    container: {
        display: 'flex',
        height: 50,
        backgroundColor: palette.primary.light,
        borderRadius: 5,
        width: '100vw',
        margin: '0px 0px 5px 0px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        [breakpoints.down('lg')]: {
            height: 40
        }
    },
    treeView: {
        display: 'flex',
        flex: 1,
        position: 'sticky',
        left: 0,
        alignItems: 'center',
        color: palette.primary.dark,
        fontSize: typography.pxToRem(18),
        fontWeight: typography.fontWeightRegular,
        [breakpoints.down('lg')]: {
            fontSize: typography.pxToRem(15)
        }
    },
    treeViewText: {
        paddingLeft: 20,
        left: 20,
        width: '60%',
        backgroundColor: palette.primary.light,
        zIndex: 10
    }
}));

function RepositoryTreeHeader(): React.ReactElement {
    const classes = useStyles();
    const metadataHeaders = ['Unit', 'SubjectId', 'Item name'];

    return (
        <Box className={classes.container}>
            <Box className={classes.treeView}>
                <Box className={classes.treeViewText}>Tree view</Box>
            </Box>
            <MetadataView header metadata={metadataHeaders} />
        </Box>
    );
}

export default RepositoryTreeHeader;