/* eslint-disable react/jsx-max-props-per-line */
/* eslint-disable react-hooks/exhaustive-deps */

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
import React, { useCallback, useEffect } from 'react';
import { Loader } from '../../../../components';
import { StateRelatedObject, treeRootKey, useControlStore, useRepositoryStore, useTreeColumnsStore } from '../../../../store';
import { NavigationResultEntry } from '../../../../types/graphql';
import {
    getObjectInterfaceDetails,
    getRepositoryTreeNodeId,
    getTreeColorVariant,
    getTreeViewColumns,
    isRepositoryItemSelected
} from '../../../../utils/repository';
import RepositoryTreeHeader from './RepositoryTreeHeader';
import StyledTreeItem from './StyledTreeItem';
import TreeLabel, { TreeLabelEmpty, TreeLabelLoading } from './TreeLabel';
import InViewTreeItem from './InViewTreeItem';
import { repositoryRowCount } from '@dpo-packrat/common';

const repositoryRowPrefetchThreshold = 75;

const useStyles = makeStyles(({ breakpoints, typography, palette }) => ({
    container: {
        display: 'flex',
        flex: 5,
        height: '100%',
        overflowY: 'auto',
        width: 'fit-content',
        flexDirection: 'column',
        transition: '250ms height, width ease',
        [breakpoints.down('lg')]: {
            paddingRight: 10
        },
        paddingBottom: 10,
        direction: 'rtl'
    },
    tree: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        width: 'fit-content',
        direction: 'ltr',
        '&:focus': {
            outline: 'none'
        }
    },
    fullWidth: {
        maxWidth: '95.5vw'
    },
    iconContainer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 18,
        width: 18,
        borderRadius: 2.5,
        [breakpoints.down('lg')]: {
            height: 15,
            width: 15,
        },
    },
    iconInitial: {
        fontSize: 10,
        fontWeight: typography.fontWeightMedium,
        alignSelf: 'center',
        justifySelf: 'center'
    },
    // TreeLabel
    treeLabelContainer: {
        display: 'flex',
    },
    label: {
        display: 'flex',
        alignItems: 'center',
        // position: 'sticky',
        left: 45,
        [breakpoints.down('lg')]: {
            left: 30
        },
        flex: 1,
        width: 'min-content'
    },
    labelText: {
        color: 'rgb(44,64,90)',
        fontWeight: 400,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        wordBreak: 'break-all',
        zIndex: 10,
        fontSize: '0.9em'
    },
    column: {
        display: 'flex',
        alignItems: 'center',
        padding: '0px 10px',
        fontSize: undefined,
        color: palette.grey[900],
        fontWeight: typography.fontWeightLight,
        overflow: 'hidden',
        textOverflow: 'ellipsis'
    },
    text: {
        color: 'rgb(44,64,90)',
        fontWeight: 400,
        fontSize: '0.9em'
    },
    options: {
        display: 'flex',
        alignItems: 'center',
        position: 'sticky',
        left: 0,
        width: 120
    },
    option: {
        display: 'flex',
        alignItems: 'center'
    },
    link: {
        color: palette.primary.dark,
        textDecoration: 'none'
    }
}));

interface RepositoryTreeViewProps {
    isModal?: boolean;
    selectedItems?: StateRelatedObject[];
    onSelect?: (item: StateRelatedObject) => void;
    onUnSelect?: (id: number) => void;
}

function RepositoryTreeView(props: RepositoryTreeViewProps): React.ReactElement {
    const { isModal = false, selectedItems = [], onSelect, onUnSelect } = props;
    const [tree, getChildren, getMoreRoot, getMoreChildren, cursors, loadingMore] = useRepositoryStore(state => [
        state.tree,
        state.getChildren,
        state.getMoreRoot,
        state.getMoreChildren,
        state.cursors,
        state.loadingMore
    ]);
    const metadataColumns = useRepositoryStore(state => state.metadataToDisplay);
    const [initializeWidths, initializeOrder, columnOrder] = useTreeColumnsStore((state) => [state.initializeWidth, state.initializeOrder, state.order]);
    const [loading, isExpanded] = useRepositoryStore(useCallback(state => [state.loading, state.isExpanded], []));
    const sideBarExpanded = useControlStore(state => state.sideBarExpanded);
    const classes = useStyles({ isExpanded, sideBarExpanded, isModal });

    useEffect(() => {
        initializeWidths();
        initializeOrder();
    }, [tree]);

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
            const { icon, color } = getObjectInterfaceDetails(objectType, variant, { container: classes.iconContainer, initial: classes.iconInitial }, idSystemObject);

            const treeColumns = getTreeViewColumns(metadataColumns, false, metadata);
            if (columnOrder)
                treeColumns.sort((a, b) => Number(columnOrder[a.metadataColumn]) - Number(columnOrder[b.metadataColumn]));

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
                    makeStyles={{ container: classes.treeLabelContainer, label: classes.label, labelText: classes.labelText, column: classes.column, text: classes.text, options: classes.options, option: classes.option, link: classes.link }}
                />
            );

            // non-root case for end of list
            if ((index + 1 + repositoryRowPrefetchThreshold) % repositoryRowCount === 0 && index + 1 + repositoryRowPrefetchThreshold === children.length && isChild) {
                return (
                    <InViewTreeItem
                        id={`repository row id ${idSystemObject}`}
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
            if ((index + 1 + repositoryRowPrefetchThreshold) % repositoryRowCount === 0 && index + 1 + repositoryRowPrefetchThreshold === children.length) {
                return (
                    <InViewTreeItem
                        id={`repository row id ${idSystemObject}`}
                        key={idSystemObject}
                        nodeId={nodeId}
                        icon={icon}
                        color={color}
                        label={label}
                        childNodesContent={childNodesContent}
                        triggerOnce
                        onView={async () => await getMoreRoot()}
                    />
                );
            }

            // base case
            return (
                <StyledTreeItem
                    id={`repository row id ${idSystemObject}`}
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
    };

    let content: React.ReactNode = <Loader maxWidth='85vw' minHeight='40vh' width='40vw' size={40} />;
    if (!loading) {
        const children = tree.get(treeRootKey);
        content = (
            <TreeView
                className={classes.tree}
                defaultCollapseIcon={<ExpandMoreIcon />}
                defaultExpandIcon={<ChevronRightIcon />}
                onNodeToggle={onNodeToggle}
                id='treeView'
                tabIndex={0}
            >
                <RepositoryTreeHeader fullWidth={isModal} metadataColumns={metadataColumns} />
                {renderTree(children)}
                {loadingMore && <TreeLabelLoading />}
            </TreeView>
        );
    }

    const fullWidthStyles = isModal ? { minWidth: '90%' } : {};

    return (
        <div id='treeContainer' className={classes.container} style={fullWidthStyles}>
            {content}
        </div>
    );
}

export default React.memo(RepositoryTreeView);