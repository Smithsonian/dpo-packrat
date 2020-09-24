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

const useStyles = makeStyles(({ palette }) => ({
    container: {
        display: 'flex',
        flex: 1,
        maxHeight: '70vh',
        flexDirection: 'column',
        overflow: 'auto'
    },
    fullView: {
        display: 'flex',
        flex: 1,
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
        <TreeView
            className={classes.container}
            defaultCollapseIcon={<BsChevronDown />}
            defaultExpandIcon={<BsChevronRight />}
        >
            {noFilter && (
                <Box className={classes.fullView}>
                    <Typography variant='caption'>Please select a valid filter</Typography>
                </Box>
            )}
            {!getRootObjectsLoading && !getRootObjectsError ? (
                <>
                    {entries.map((entry, index: number) => {
                        const { idSystemObject, name, objectType, idObject } = entry;
                        const variant = index % 2 ? RepositoryColorVariant.Light : RepositoryColorVariant.Dark;
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
    );
}

export default RepositoryTreeView;