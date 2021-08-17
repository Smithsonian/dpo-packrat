/* eslint-disable react/jsx-max-props-per-line */

/**
 * RepositoryTreeView
 *
 * This component renders repository tree view along with metadata view
 * for the Repository UI.
 */
import { makeStyles } from '@material-ui/core/styles';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { TreeView } from '@material-ui/lab';
import React, { useCallback } from 'react';
import { Loader } from '../../../../components';
import { StateRelatedObject, treeRootKey, useControlStore, useRepositoryStore } from '../../../../store';
import { NavigationResultEntry } from '../../../../types/graphql';
import {
    getObjectInterfaceDetails,
    getRepositoryTreeNodeId,
    getTreeColorVariant,
    getTreeViewColumns,
    getTreeViewStyleHeight,
    getTreeViewStyleWidth,
    getTreeWidth,
    isRepositoryItemSelected
} from '../../../../utils/repository';
import RepositoryTreeHeader from './RepositoryTreeHeader';
import StyledTreeItem from './StyledTreeItem';
import TreeLabel, { TreeLabelEmpty, TreeLabelLoading } from './TreeLabel';
import InViewTreeItem from './InViewTreeItem';

const useStyles = makeStyles(({ breakpoints }) => ({
    container: {
        display: 'flex',
        flex: 5,
        maxHeight: ({ isExpanded, isModal }: StyleProps) => getTreeViewStyleHeight(isExpanded, isModal, 'xl'),
        maxWidth: ({ sideBarExpanded }: StyleProps) => getTreeViewStyleWidth(sideBarExpanded, 'xl'),
        flexDirection: 'column',
        overflow: 'auto',
        transition: '250ms height, width ease',
        [breakpoints.down('lg')]: {
            maxHeight: ({ isExpanded, isModal }: StyleProps) => getTreeViewStyleHeight(isExpanded, isModal, 'lg'),
            maxWidth: ({ sideBarExpanded }: StyleProps) => getTreeViewStyleWidth(sideBarExpanded, 'lg')
        }
    },
    tree: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1
    },
    fullWidth: {
        maxWidth: '95.5vw'
    }
}));

type StyleProps = {
    sideBarExpanded: boolean;
    isExpanded: boolean;
    isModal: boolean;
};

interface RepositoryTreeViewProps {
    isModal?: boolean;
    selectedItems?: StateRelatedObject[];
    onSelect?: (item: StateRelatedObject) => void;
    onUnSelect?: (id: number) => void;
}

function RepositoryTreeView(props: RepositoryTreeViewProps): React.ReactElement {
    const { isModal = false, selectedItems = [], onSelect, onUnSelect } = props;
    const [tree, getChildren, getMoreRoot, getMoreChildren, cursors] = useRepositoryStore(state => [
        state.tree,
        state.getChildren,
        state.getMoreRoot,
        state.getMoreChildren,
        state.cursors
    ]);
    const metadataColumns = useRepositoryStore(state => state.metadataToDisplay);

    const [loading, isExpanded] = useRepositoryStore(useCallback(state => [state.loading, state.isExpanded], []));
    const sideBarExpanded = useControlStore(state => state.sideBarExpanded);

    const classes = useStyles({ isExpanded, sideBarExpanded, isModal });

    const onNodeToggle = useCallback(
        async (_, nodeIds: string[]) => {
            if (!nodeIds.length) return;
            const [nodeId] = nodeIds.slice();
            const alreadyLoaded = tree.has(nodeId);

            if (!alreadyLoaded) {
                getChildren(nodeId);
            }
        },
        [tree, getChildren]
    );

    // recursive
    const renderTree = (children: NavigationResultEntry[] | undefined, isChild?: boolean, parentNodeId?: string) => {
        if (!children) return null;
        return children.map((child: NavigationResultEntry, index: number) => {
            const { idSystemObject, objectType, idObject, name, metadata } = child;

            const nodeId: string = getRepositoryTreeNodeId(idSystemObject, objectType, idObject);
            const childNodes = tree.get(nodeId);

            let childNodesContent: React.ReactNode = <TreeLabelLoading />;

            if (childNodes) {
                if (childNodes.length) {
                    childNodesContent = renderTree(childNodes, true, nodeId);
                } else {
                    childNodesContent = <TreeLabelEmpty label={name} objectType={objectType} />;
                }
            }

            const variant = getTreeColorVariant(index);
            const { icon, color } = getObjectInterfaceDetails(objectType, variant);
            const treeColumns = getTreeViewColumns(metadataColumns, false, metadata);
            const isSelected = isRepositoryItemSelected(nodeId, selectedItems);

            const select = (event: React.MouseEvent<SVGElement, MouseEvent>) => {
                if (onSelect) {
                    event.stopPropagation();
                    const repositoryItem: StateRelatedObject = {
                        idSystemObject,
                        name,
                        objectType,
                        identifier: ''
                    };
                    onSelect(repositoryItem);
                }
            };

            const unSelect = (event: React.MouseEvent<SVGElement, MouseEvent>) => {
                if (onUnSelect) {
                    event.stopPropagation();
                    onUnSelect(idSystemObject);
                }
            };

            const label: React.ReactNode = (
                <TreeLabel
                    idSystemObject={idSystemObject}
                    label={name}
                    renderSelected={isModal}
                    selected={isSelected}
                    onSelect={select}
                    onUnSelect={unSelect}
                    objectType={objectType}
                    color={color}
                    treeColumns={treeColumns}
                />
            );

            // non-root case for end of list
            if ((index + 1) % 300 === 0 && index + 1 === children.length && isChild) {
                return (
                    <InViewTreeItem
                        key={idSystemObject}
                        nodeId={nodeId}
                        icon={icon}
                        color={color}
                        label={label}
                        childNodesContent={childNodesContent}
                        triggerOnce
                        onView={async () => {
                            if (parentNodeId) {
                                const parentCursor = cursors.get(parentNodeId);
                                if (parentCursor && parentCursor.length) {
                                    await getMoreChildren(parentNodeId, parentCursor);
                                }
                            }
                        }}
                    />
                );
            }

            // root case for end of list
            if ((index + 1) % 300 === 0 && index + 1 === children.length) {
                return (
                    <InViewTreeItem
                        key={idSystemObject}
                        nodeId={nodeId}
                        icon={icon}
                        color={color}
                        label={label}
                        childNodesContent={childNodesContent}
                        triggerOnce
                        onView={async () => getMoreRoot()}
                    />
                );
            }

            // base case
            return (
                <StyledTreeItem key={idSystemObject} nodeId={nodeId} icon={icon} color={color} label={label}>
                    {childNodesContent}
                </StyledTreeItem>
            );
        });
    };

    let content: React.ReactNode = <Loader maxWidth='85vw' minHeight='40vh' size={20} />;

    if (!loading) {
        const treeColumns = getTreeViewColumns(metadataColumns, false);
        const width = getTreeWidth(treeColumns.length, sideBarExpanded, isModal);
        const children = tree.get(treeRootKey);

        content = (
            <TreeView className={classes.tree} defaultCollapseIcon={<ExpandMoreIcon />} defaultExpandIcon={<ChevronRightIcon />} onNodeToggle={onNodeToggle} style={{ width }}>
                <RepositoryTreeHeader fullWidth={isModal} metadataColumns={metadataColumns} />
                {renderTree(children)}
            </TreeView>
        );
    }

    const fullWidthStyles = isModal ? { maxWidth: '98vw' } : {};

    return (
        <div className={classes.container} style={fullWidthStyles}>
            {content}
        </div>
    );
}

export default React.memo(RepositoryTreeView);
