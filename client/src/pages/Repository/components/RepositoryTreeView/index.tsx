/* eslint-disable react/jsx-max-props-per-line */
/* eslint-disable react-hooks/exhaustive-deps */

/**
 * RepositoryTreeView
 *
 * This component renders repository tree view along with metadata view
 * for the Repository UI.
 */
import { makeStyles, createStyles } from '@material-ui/core/styles';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { TreeView } from '@material-ui/lab';
import React, { useCallback, useEffect, useState } from 'react';
import { Loader } from '../../../../components';
import { StateRelatedObject, treeRootKey, useControlStore, useRepositoryStore, useTreeColumnsStore, NavigationResultEntryState } from '../../../../store';
import {
    getObjectInterfaceDetails,
    getRepositoryTreeNodeId,
    parseRepositoryTreeNodeId,
    getTreeColorVariant,
    getTreeViewColumns,
    isRepositoryItemSelected
} from '../../../../utils/repository';
import RepositoryTreeHeader from './RepositoryTreeHeader';
import StyledTreeItem from './StyledTreeItem';
import TreeLabel, { TreeLabelEmpty, TreeLabelLoading } from './TreeLabel';

// Root-level pagination: selectable page sizes, and the minimum number of root
// objects at which the pager (with its size selector) is shown.
const ROOT_PAGE_SIZE_OPTIONS = [10, 25, 100];
const ROOT_PAGER_MIN_ITEMS = 10;

const useStyles = makeStyles(({ breakpoints, palette }) => createStyles({
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
        paddingBottom: 10
    },
    tree: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        '&:focus': {
            outline: 'none'
        },
        height: '100%',
        overflowY: 'auto',
        width: '100%'
    },
    treeViewContainer: {
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        width: '100%',
        // Note: this is to help relocate the scrollbar to the left
        direction: 'rtl'
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
        fontWeight: 500,
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
        fontWeight: 300,
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
    },
    pager: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '6px 8px',
        flexShrink: 0
    },
    pagerButton: {
        cursor: 'pointer',
        fontSize: '0.8em',
        padding: '2px 10px',
        borderRadius: 4,
        border: `1px solid ${palette.primary.main}`,
        backgroundColor: palette.background.paper,
        color: palette.primary.dark,
        '&:disabled': { opacity: 0.4, cursor: 'default' }
    },
    pagerLabel: {
        fontSize: '0.8em',
        color: palette.primary.dark
    },
    pagerInput: {
        width: 48,
        fontSize: '0.8em',
        padding: '2px 4px',
        borderRadius: 4,
        border: `1px solid ${palette.primary.main}`
    },
    pagerSelect: {
        fontSize: '0.8em',
        padding: '2px 4px',
        borderRadius: 4,
        border: `1px solid ${palette.primary.main}`,
        backgroundColor: palette.background.paper,
        color: palette.primary.dark,
        cursor: 'pointer'
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
    const [tree, getChildren, deleteChildren, setExpandedCount] = useRepositoryStore(state => [
        state.tree,
        state.getChildren,
        state.deleteChildren,
        state.setExpandedCount
    ]);
    const [rootPage, rootPageSize, rootTotal, setRootPage, setRootPageSize] = useRepositoryStore(state => [
        state.rootPage,
        state.rootPageSize,
        state.rootTotal,
        state.setRootPage,
        state.setRootPageSize
    ]);
    const metadataColumns = useRepositoryStore(state => state.metadataToDisplay);
    const [initializeWidths, initializeOrder, columnOrder] = useTreeColumnsStore((state) => [state.initializeWidth, state.initializeOrder, state.order]);
    const [loading, isExpanded] = useRepositoryStore(useCallback(state => [state.loading, state.isExpanded], []));
    const sideBarExpanded = useControlStore(state => state.sideBarExpanded);
    const classes = useStyles({ isExpanded, sideBarExpanded, isModal });

    const [jumpValue, setJumpValue] = useState('');
    const totalRootPages = Math.max(1, Math.ceil(rootTotal / rootPageSize));
    const showPager = !isModal && rootTotal > ROOT_PAGER_MIN_ITEMS;
    const goToPage = (): void => {
        const page = parseInt(jumpValue, 10);
        if (!isNaN(page) && page >= 1 && page <= totalRootPages && page !== rootPage)
            setRootPage(page);
        setJumpValue('');
    };

    useEffect(() => {
        initializeWidths();
        initializeOrder();
    }, [tree]);

    const onNodeToggle = useCallback(
        async (_, nodeIds: string[]) => {
            if (!nodeIds.length)
                return;
            const [nodeId] = nodeIds.slice(); // when expanding, nodeId is from the most recently expanded node. When contracting, nodeId is from the last expanded node that is still expanded.
            const expanded: boolean = setExpandedCount(nodeIds.length);
            // console.log(`onNodeToggle nodeId=${nodeId} expanded=${expanded} nodeIds=${JSON.stringify(nodeIds)}`);
            if (expanded)
                deleteChildren(nodeId);

            getChildren(nodeId);
        },
        [tree, getChildren, deleteChildren]
    );

    // recursive
    const renderTree = (children: NavigationResultEntryState[] | undefined, _isChild?: boolean, parentNodeId?: string) => {

        if (!children) return null;
        const items = children.map((child: NavigationResultEntryState, index: number) => {
            const { idSystemObject, objectType, idObject, name, metadata, hierarchy } = child;
            let idSystemObjectParent: number = 0;
            if (parentNodeId) {
                const { idSystemObject: idSystemObjectParentUpdated } = parseRepositoryTreeNodeId(parentNodeId);
                idSystemObjectParent = idSystemObjectParentUpdated;
            }

            const nodeId: string = getRepositoryTreeNodeId(idSystemObject, objectType, idObject,
                (hierarchy ? hierarchy + '|' : '') + idSystemObjectParent.toString() );
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
                        identifier: '',
                        retired: false
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
                    nodeId={nodeId}
                    makeStyles={{ container: classes.treeLabelContainer, label: classes.label, labelText: classes.labelText, column: classes.column, text: classes.text, options: classes.options, option: classes.option, link: classes.link }}
                />
            );

            // loader case
            if (idSystemObject === -1)
                return <TreeLabelLoading key={idSystemObject} />;

            return (
                <StyledTreeItem
                    id={nodeId}
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

        return items;
    };

    let content: React.ReactNode = <Loader maxWidth='85vw' minHeight='40vh' width='40vw' size={40} />;
    if (!loading) {
        const children = tree.get(treeRootKey);
        content = (
            <>
                <RepositoryTreeHeader fullWidth={isModal} metadataColumns={metadataColumns} />
                <div className={classes.treeViewContainer}>
                    <TreeView
                        className={classes.tree}
                        defaultCollapseIcon={<ExpandMoreIcon />}
                        defaultExpandIcon={<ChevronRightIcon />}
                        onNodeToggle={onNodeToggle}
                        id='treeView'
                        tabIndex={0}
                    >
                        {renderTree(children)}
                    </TreeView>
                </div>
                {showPager && (
                    <div className={classes.pager}>
                        <button className={classes.pagerButton} disabled={rootPage <= 1} onClick={() => setRootPage(rootPage - 1)}>Prev</button>
                        <span className={classes.pagerLabel}>{`Page ${rootPage} of ${totalRootPages}`}</span>
                        <button className={classes.pagerButton} disabled={rootPage >= totalRootPages} onClick={() => setRootPage(rootPage + 1)}>Next</button>
                        <input
                            className={classes.pagerInput}
                            type='number'
                            min={1}
                            max={totalRootPages}
                            placeholder='Go to'
                            value={jumpValue}
                            onChange={(e) => setJumpValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') goToPage(); }}
                            onBlur={goToPage}
                        />
                        <select className={classes.pagerSelect} value={rootPageSize} onChange={(e) => setRootPageSize(Number(e.target.value))}>
                            {ROOT_PAGE_SIZE_OPTIONS.map(size => <option key={size} value={size}>{`${size} / page`}</option>)}
                        </select>
                    </div>
                )}
            </>
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