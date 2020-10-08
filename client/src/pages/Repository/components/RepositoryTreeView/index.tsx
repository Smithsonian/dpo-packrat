import { Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { TreeView } from '@material-ui/lab';
import lodash from 'lodash';
import React, { useState } from 'react';
import { BsChevronDown, BsChevronRight } from 'react-icons/bs';
import { Loader } from '../../../../components';
import { getSortedTreeEntries, getSystemObjectTypesForFilter, getTreeWidth } from '../../../../utils/repository';
import { useGetRootObjects } from '../../hooks/useRepository';
import { RepositoryFilter } from '../../index';
import RepositoryTreeHeader from './RepositoryTreeHeader';
import { ExpandedNodeMap, renderTreeNodes } from './RepositoryTreeNode';

const useStyles = makeStyles(({ palette, breakpoints }) => ({
    container: {
        display: 'flex',
        flex: 5,
        maxHeight: ({ isExpanded }: RepositoryTreeViewProps) => isExpanded ? '70vh' : '80vh',
        maxWidth: '83.5vw',
        flexDirection: 'column',
        overflow: 'auto',
        transition: '250ms height ease',
        [breakpoints.down('lg')]: {
            maxHeight: ({ isExpanded }: RepositoryTreeViewProps) => isExpanded ? '60vh' : '77vh',
            maxWidth: '81.5vw'
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
        color: palette.primary.dark,
        [breakpoints.down('lg')]: {
            maxHeight: ({ isExpanded }: RepositoryTreeViewProps) => isExpanded ? '60vh' : '77vh',
        }
    }
}));

interface RepositoryTreeViewProps {
    filter: RepositoryFilter;
    isExpanded: boolean;
}

function RepositoryTreeView(props: RepositoryTreeViewProps): React.ReactElement {
    const { filter } = props;
    const classes = useStyles(props);
    const [expandedNodes, setExpandedNodes] = useState<ExpandedNodeMap>(new Map() as ExpandedNodeMap);

    const objectTypes = getSystemObjectTypesForFilter(filter);
    const { getRootObjectsData, getRootObjectsLoading, getRootObjectsError } = useGetRootObjects(objectTypes, filter);

    const noFilter = !filter.units && !filter.projects;

    const entries = getSortedTreeEntries(getRootObjectsData?.getObjectChildren?.entries ?? []);
    const metadataColumns = getRootObjectsData?.getObjectChildren?.metadataColumns ?? [];
    const width = getTreeWidth(metadataColumns.length);

    let content: React.ReactNode = null;

    if (!getRootObjectsLoading && !getRootObjectsError) {
        content = renderTreeNodes(expandedNodes, filter, entries, metadataColumns);
    } else if (!noFilter) {
        content = <Loader maxWidth='83.5vw' size={30} />;
    }

    const onNodeToggle = (_, nodeIds: string[]) => {
        const keyValueArray: [string, undefined][] = lodash.map(nodeIds, (id: string) => [id, undefined]);
        const updatedMap: ExpandedNodeMap = new Map(keyValueArray);
        setExpandedNodes(updatedMap);
    };

    return (
        <Box className={classes.container}>
            <TreeView
                onNodeToggle={onNodeToggle}
                className={classes.tree}
                style={{ width }}
                defaultCollapseIcon={<BsChevronDown />}
                defaultExpandIcon={<BsChevronRight />}
            >
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