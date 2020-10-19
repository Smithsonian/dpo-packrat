import { makeStyles } from '@material-ui/core/styles';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { TreeView } from '@material-ui/lab';
import React, { useCallback, useEffect } from 'react';
import { Loader } from '../../../../components';
import { treeRootKey, useControlStore, useRepositoryStore } from '../../../../store';
import { NavigationResultEntry } from '../../../../types/graphql';
import { getObjectInterfaceDetails, getRepositoryTreeNodeId, getTreeColorVariant, getTreeViewColumns, getTreeWidth } from '../../../../utils/repository';
import RepositoryTreeHeader from './RepositoryTreeHeader';
import StyledTreeItem from './StyledTreeItem';
import TreeLabel, { TreeLabelEmpty, TreeLabelLoading } from './TreeLabel';

const useStyles = makeStyles(({ breakpoints }) => ({
    container: {
        display: 'flex',
        flex: 5,
        maxHeight: ({ isExpanded }: StyleProps) => isExpanded ? '62vh' : '82vh',
        maxWidth: ({ sideBarExpanded }: StyleProps) => sideBarExpanded ? '85vw' : '93vw',
        flexDirection: 'column',
        overflow: 'auto',
        transition: '250ms height, width ease',
        [breakpoints.down('lg')]: {
            maxHeight: ({ isExpanded }: StyleProps) => isExpanded ? '54vh' : '79vh',
            maxWidth: ({ sideBarExpanded }: StyleProps) => sideBarExpanded ? '81.5vw' : '92vw'
        }
    },
    tree: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
    }
}));

type StyleProps = {
    sideBarExpanded: boolean;
    isExpanded: boolean;
};

function RepositoryTreeView(): React.ReactElement {
    const [loading, isExpanded] = useRepositoryStore(useCallback(state => [state.loading, state.isExpanded], []));
    const sideBarExpanded = useControlStore(state => state.sideBarExpanded);

    const classes = useStyles({ isExpanded, sideBarExpanded });

    const [tree, initializeTree, getChildren] = useRepositoryStore(state => [state.tree, state.initializeTree, state.getChildren]);
    const metadataColumns = useRepositoryStore(state => state.metadataToDisplay);

    useEffect(() => {
        initializeTree();
    }, [initializeTree]);

    const onNodeToggle = useCallback(async (_, nodeIds: string[]) => {
        if (!nodeIds.length) return;
        const [nodeId] = nodeIds.slice();
        getChildren(nodeId);
    }, [getChildren]);

    const renderTree = useCallback((children: NavigationResultEntry[] | undefined) => {
        if (!children) return null;
        return children.map((child: NavigationResultEntry, index: number) => {
            const { idSystemObject, objectType, idObject, name, metadata } = child;
            const nodeId: string = getRepositoryTreeNodeId(idSystemObject, objectType, idObject);
            const childNodes = tree.get(nodeId);

            let childNodesContent: React.ReactNode = <TreeLabelLoading />;

            if (childNodes) {
                if (childNodes.length) {
                    childNodesContent = renderTree(childNodes);
                } else {
                    childNodesContent = <TreeLabelEmpty label={name} objectType={objectType} />;
                }
            }

            const variant = getTreeColorVariant(index);
            const { icon, color } = getObjectInterfaceDetails(objectType, variant);
            const treeColumns = getTreeViewColumns(metadataColumns, false, metadata);

            const label: React.ReactNode = <TreeLabel label={name} objectType={objectType} color={color} treeColumns={treeColumns} />;

            return (
                <StyledTreeItem
                    key={idSystemObject}
                    nodeId={nodeId}
                    icon={icon}
                    color={color}
                    label={label}
                >
                    {childNodesContent}
                </StyledTreeItem>
            );
        });
    }, [tree, metadataColumns]);

    let content: React.ReactNode = <Loader maxWidth='85vw' size={20} />;

    if (!loading) {
        const treeColumns = getTreeViewColumns(metadataColumns, false);
        const width = getTreeWidth(treeColumns.length, sideBarExpanded);
        const children = tree.get(treeRootKey);

        content = (
            <TreeView
                className={classes.tree}
                defaultCollapseIcon={<ExpandMoreIcon />}
                defaultExpandIcon={<ChevronRightIcon />}
                onNodeToggle={onNodeToggle}
                style={{ width }}
            >
                <RepositoryTreeHeader metadataColumns={metadataColumns} />
                {renderTree(children)}
            </TreeView>
        );
    }

    return (
        <div className={classes.container}>
            {content}
        </div>
    );
}

export default React.memo(RepositoryTreeView);
