import { makeStyles } from '@material-ui/core/styles';
import { Box, Typography, CircularProgress } from '@material-ui/core';
import { TreeView } from '@material-ui/lab';
import React from 'react';
import { BsChevronDown, BsChevronRight } from 'react-icons/bs';
import RepositoryTreeNode, { getObjectInterfaceDetails } from './RepositoryTreeNode';
import { RepositoryFilter } from '../../index';
import { useGetRootObjects } from '../../hooks/useRepository';
import { getSystemObjectTypesForFilter, getSortedTreeEntries, getTreeWidth, getTreeColorVariant, getTreeViewColumns } from '../../../../utils/repository';
import RepositoryTreeHeader from './RepositoryTreeHeader';

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

    return (
        <Box className={classes.container}>
            <TreeView className={classes.tree} style={{ width }} defaultCollapseIcon={<BsChevronDown />} defaultExpandIcon={<BsChevronRight />}>
                <RepositoryTreeHeader metadataColumns={metadataColumns} />
                {noFilter && (
                    <Box className={classes.fullView}>
                        <Typography variant='caption'>Please select a valid filter</Typography>
                    </Box>
                )}
                {!getRootObjectsLoading && !getRootObjectsError ? (
                    <>
                        {entries.map((entry, index: number) => {
                            const { idSystemObject, name, objectType, idObject, metadata } = entry;
                            const variant = getTreeColorVariant(index);
                            const { icon, color } = getObjectInterfaceDetails(objectType, variant);
                            const treeColumns = getTreeViewColumns(metadataColumns, false, metadata);

                            return (
                                <RepositoryTreeNode
                                    key={index}
                                    filter={filter}
                                    idSystemObject={idSystemObject}
                                    name={name}
                                    icon={icon}
                                    color={color}
                                    objectType={objectType}
                                    idObject={idObject}
                                    treeColumns={treeColumns}
                                />
                            );
                        })}
                    </>
                ) : (
                    <>
                        {!noFilter && (
                            <Box className={classes.fullView}>
                                <CircularProgress size={30} />
                            </Box>
                        )}
                    </>
                )}
            </TreeView>
        </Box>
    );
}

export default RepositoryTreeView;