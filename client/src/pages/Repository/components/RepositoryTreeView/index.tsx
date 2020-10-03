import { Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { TreeView } from '@material-ui/lab';
import React from 'react';
import { BsChevronDown, BsChevronRight } from 'react-icons/bs';
import { Loader } from '../../../../components';
import { getSortedTreeEntries, getSystemObjectTypesForFilter, getTreeWidth } from '../../../../utils/repository';
import { useGetRootObjects } from '../../hooks/useRepository';
import { RepositoryFilter } from '../../index';
import RepositoryTreeHeader from './RepositoryTreeHeader';
import { renderTreeNodes } from './RepositoryTreeNode';

const useStyles = makeStyles(({ palette, breakpoints }) => ({
    container: {
        display: 'flex',
        flex: 5,
        maxHeight: '72vh',
        maxWidth: '83.5vw',
        flexDirection: 'column',
        overflow: 'auto',
        [breakpoints.down('lg')]: {
            maxHeight: '71vh',
            maxWidth: '80.5vw'
        }
    },
    tree: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1
    },
    fullView: {
        display: 'flex',
        flex: 1,
        maxWidth: '83.5vw',
        alignItems: 'center',
        justifyContent: 'center',
        color: palette.primary.dark
    }
}));

interface RepositoryTreeViewProps {
    filter: RepositoryFilter;
}

function RepositoryTreeView(props: RepositoryTreeViewProps): React.ReactElement {
    const { filter } = props;
    const classes = useStyles();

    const objectTypes = getSystemObjectTypesForFilter(filter);
    const { getRootObjectsData, getRootObjectsLoading, getRootObjectsError } = useGetRootObjects(objectTypes, filter);

    const noFilter = !filter.units && !filter.projects;

    const entries = getSortedTreeEntries(getRootObjectsData?.getObjectChildren?.entries ?? []);
    const metadataColumns = getRootObjectsData?.getObjectChildren?.metadataColumns ?? [];
    const width = getTreeWidth(metadataColumns.length);

    let content: React.ReactElement | React.ReactElement[] | null = null;

    if (!getRootObjectsLoading && !getRootObjectsError) {
        content = renderTreeNodes(filter, entries, metadataColumns);
    } else if (!noFilter) {
        content = <Loader maxWidth='83.5vw' size={30} />;
    }

    return (
        <Box className={classes.container}>
            <TreeView className={classes.tree} style={{ width }} defaultCollapseIcon={<BsChevronDown />} defaultExpandIcon={<BsChevronRight />}>
                <RepositoryTreeHeader metadataColumns={metadataColumns} />
                {noFilter && (
                    <Box className={classes.fullView}>
                        <Typography variant='caption'>Please select a valid filter</Typography>
                    </Box>
                )}
                {content}
            </TreeView>
        </Box>
    );
}

export default RepositoryTreeView;