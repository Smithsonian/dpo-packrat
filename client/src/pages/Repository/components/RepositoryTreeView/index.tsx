import { makeStyles } from '@material-ui/core/styles';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { TreeView } from '@material-ui/lab';
import React, { useEffect, useState } from 'react';
import { Loader } from '../../../../components';
import { useRepositoryFilterStore } from '../../../../store';
import { NavigationResultEntry } from '../../../../types/graphql';
import { eMetadata, eSystemObjectType } from '../../../../types/server';
import { getObjectInterfaceDetails, getRepositoryTreeNodeId, getTreeColorVariant, getTreeViewColumns, parseRepositoryTreeNodeId } from '../../../../utils/repository';
import { getObjectChildren, useGetRootObjects } from '../../hooks/useRepository';
import RepositoryTreeHeader from './RepositoryTreeHeader';
import StyledTreeItem from './StyledTreeItem';
import TreeLabel, { TreeLabelEmpty, TreeLabelLoading } from './TreeLabel';

const useStyles = makeStyles(({ breakpoints }) => ({
    container: {
        display: 'flex',
        flex: 5,
        maxHeight: (isExpanded: boolean) => isExpanded ? '64vh' : '82vh',
        maxWidth: '83.5vw',
        flexDirection: 'column',
        overflow: 'auto',
        transition: '250ms height ease',
        [breakpoints.down('lg')]: {
            maxHeight: (isExpanded: boolean) => isExpanded ? '50vh' : '80vh',
            maxWidth: '81.5vw'
        }
    },
    tree: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1
    }
}));

function RepositoryTreeView(): React.ReactElement {
    const { isExpanded } = useRepositoryFilterStore();
    const classes = useStyles(isExpanded);
    const metadataColumns: eMetadata[] = [eMetadata.eUnitAbbreviation, eMetadata.eSubjectIdentifier, eMetadata.eItemName];

    const { data, loading, error } = useGetRootObjects([eSystemObjectType.eUnit], metadataColumns);

    const [tree, setTree] = useState<Map<string | number, NavigationResultEntry[]>>(() => new Map([['root', []]]));

    useEffect(() => {
        if (data && !loading && !error) {
            const { getObjectChildren } = data;
            const { entries } = getObjectChildren;
            const updatedRootMap = new Map([['root', entries]]);
            setTree(updatedRootMap);
        }
    }, [data, loading, error]);

    const onNodeToggle = async (_, nodeIds: string[]) => {
        if (!nodeIds.length) return;
        const [nodeId] = nodeIds.slice();
        const { idSystemObject } = parseRepositoryTreeNodeId(nodeId);
        const { data, error } = await getObjectChildren(idSystemObject, metadataColumns);

        if (data && !error) {
            const { getObjectChildren } = data;
            const { entries } = getObjectChildren;
            const updatedTree = new Map(tree);
            updatedTree.set(nodeId, entries);
            setTree(updatedTree);
        }
    };

    const renderTree = (children: NavigationResultEntry[] | undefined) => {
        if (!children) return null;
        return children.map((child: NavigationResultEntry, index: number) => {
            const { idSystemObject, objectType, idObject, name, metadata } = child;
            const nodeId: string = getRepositoryTreeNodeId(idSystemObject, objectType, idObject);
            const childNodes = tree.get(nodeId);

            let childNodesContent: React.ReactNode = <TreeLabelLoading />;

            if (childNodes) {
                if (childNodes.length > 0) {
                    childNodesContent = renderTree(childNodes);
                } else {
                    childNodesContent = <TreeLabelEmpty label={name} objectType={objectType} />;
                }
            }

            const variant = getTreeColorVariant(index);
            const { icon, color } = getObjectInterfaceDetails(objectType, variant);
            const treeColumns = getTreeViewColumns(metadataColumns, false, metadata);

            return (
                <StyledTreeItem
                    key={idSystemObject}
                    nodeId={nodeId}
                    icon={icon}
                    color={color}
                    label={<TreeLabel label={name} objectType={objectType} color={color} treeColumns={treeColumns} />}
                >
                    {childNodesContent}
                </StyledTreeItem>
            );
        });
    };

    let content: React.ReactNode = <Loader maxWidth='83.5vw' size={30} />;

    if (!loading) {
        content = (
            <TreeView
                className={classes.tree}
                defaultCollapseIcon={<ExpandMoreIcon />}
                defaultExpandIcon={<ChevronRightIcon />}
                onNodeToggle={onNodeToggle}
            >
                <RepositoryTreeHeader metadataColumns={metadataColumns} />
                {renderTree(tree.get('root'))}
            </TreeView>
        );
    }

    return (
        <div className={classes.container}>
            {content}
        </div>
    );
}

export default RepositoryTreeView;
