import React from 'react';
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { MetadataView } from './StyledTreeItem';

const useStyles = makeStyles(({ palette, typography, breakpoints }) => ({
    container: {
        display: 'flex',
        height: 50,
        background: palette.primary.light,
        borderRadius: 5,
        margin: '10px 0px 5px 0px',
        [breakpoints.down('lg')]: {
            height: 40,
        }
    },
    treeView: {
        display: 'flex',
        flex: 1,
        alignItems: 'center',
        marginLeft: 20,
        color: palette.primary.dark,
        fontSize: typography.pxToRem(18),
        fontWeight: typography.fontWeightRegular,
        [breakpoints.down('lg')]: {
            fontSize: typography.pxToRem(15),
        }
    }
}));

function RepositoryTreeHeader(): React.ReactElement {
    const classes = useStyles();
    const metadataHeaders = ['Unit', 'SubjectId', 'Item name'];

    return (
        <Box className={classes.container}>
            <Box className={classes.treeView}>Tree view</Box>
            <MetadataView header metadata={metadataHeaders} />
        </Box>

    );
}

export default RepositoryTreeHeader;