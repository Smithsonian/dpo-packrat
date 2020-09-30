import { makeStyles } from '@material-ui/core/styles';
import { Box, Typography, CircularProgress } from '@material-ui/core';
import { TreeView } from '@material-ui/lab';
import React from 'react';
import { BsChevronDown, BsChevronRight } from 'react-icons/bs';
import RepositoryTreeNode, { getObjectInterfaceDetails } from './RepositoryTreeNode';
import { RepositoryFilter } from '../../index';
import { useGetRootObjects } from '../../hooks/useRepository';
import { getSystemObjectTypesForFilter, getSortedTreeEntries } from '../../../../utils/repository';
import { RepositoryColorVariant } from '../../../../theme/colors';
import RepositoryTreeHeader from './RepositoryTreeHeader';

const useStyles = makeStyles(({ palette, breakpoints }) => ({
    container: {
        display: 'flex',
        flex: 5,
        maxHeight: '72vh',
        maxWidth: '83vw',
        flexDirection: 'column',
        overflow: 'auto',
        [breakpoints.down('lg')]: {
            maxHeight: '71vh',
            maxWidth: '80vw'
        }
    },
    tree: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        width: '100vw'
    },
    fullView: {
        display: 'flex',
        flex: 1,
        maxWidth: '83vw',
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
    const { getRootObjectsData, getRootObjectsLoading, getRootObjectsError } = useGetRootObjects(objectTypes);

    const noFilter = !filter.units && !filter.projects;

    const entries = getSortedTreeEntries(getRootObjectsData?.getObjectChildren?.entries ?? []);

    return (
        <Box className={classes.container}>

            <TreeView
                className={classes.tree}
                defaultCollapseIcon={<BsChevronDown />}
                defaultExpandIcon={<BsChevronRight />}
            >
                <RepositoryTreeHeader />
                {noFilter && (
                    <Box className={classes.fullView}>
                        <Typography variant='caption'>Please select a valid filter</Typography>
                    </Box>
                )}
                {!getRootObjectsLoading && !getRootObjectsError ? (
                    <>
                        {entries.map((entry, index: number) => {
                            const { idSystemObject, name, objectType, idObject, metadata } = entry;
                            const variant = index % 2 ? RepositoryColorVariant.light : RepositoryColorVariant.regular;
                            const { icon, color } = getObjectInterfaceDetails(objectType, variant);

                            return (
                                <RepositoryTreeNode
                                    key={index}
                                    idSystemObject={idSystemObject}
                                    name={name}
                                    icon={icon}
                                    color={color}
                                    objectType={objectType}
                                    idObject={idObject}
                                    metadata={metadata}
                                />
                            );
                        })}
                    </>
                )
                    : (
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