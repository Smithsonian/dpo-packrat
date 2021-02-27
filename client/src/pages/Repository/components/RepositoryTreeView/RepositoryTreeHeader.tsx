/**
 * RepositoryTreeHeader
 *
 * This component renders header for RepositoryTreeView.
 */
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { useControlStore } from '../../../../store';
import { eMetadata } from '../../../../types/server';
import { getTreeViewColumns, getTreeWidth } from '../../../../utils/repository';
import MetadataView from './MetadataView';

const useStyles = makeStyles(({ palette, typography, breakpoints }) => ({
    container: {
        display: 'flex',
        height: 50,
        backgroundColor: palette.primary.light,
        borderRadius: 5,
        marginBottom: 5,
        position: 'sticky',
        top: 0,
        zIndex: 20,
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
        left: 20,
        height: 20,
        paddingLeft: 20,
        width: '60%',
        backgroundColor: palette.primary.light,
        [breakpoints.down('lg')]: {
            paddingLeft: 10,
            left: 10,
        }
    }
}));

interface RepositoryTreeHeaderProps {
    fullWidth?: boolean;
    metadataColumns: eMetadata[];
}

function RepositoryTreeHeader(props: RepositoryTreeHeaderProps): React.ReactElement {
    const { fullWidth = false, metadataColumns } = props;
    const classes = useStyles();

    const sideBarExpanded = useControlStore(state => state.sideBarExpanded);
    const treeColumns = getTreeViewColumns(metadataColumns, true);
    const width = getTreeWidth(treeColumns.length, sideBarExpanded, fullWidth);

    return (
        <Box className={classes.container} style={{ width }}>
            <Box className={classes.treeView}>
                <Box className={classes.treeViewText} />
            </Box>
            <MetadataView header treeColumns={treeColumns} />
        </Box>
    );
}

export default React.memo(RepositoryTreeHeader);