import React from 'react';
import StyledTreeItem from './StyledTreeItem';
import TreeViewContents from './TreeViewContents';
import { eSystemObjectType } from '../../../../types/server';
import { getRepositoryTreeNodeId, getSortedTreeEntries } from '../../../../utils/repository';
import { useGetObjectChildren } from '../../hooks/useRepository';

interface RepositoryTreeNodeProps {
    idSystemObject: number;
    idObject: number;
    name: string;
    objectType: eSystemObjectType;
}

function RepositoryTreeNode(props: RepositoryTreeNodeProps): React.ReactElement {
    const { idSystemObject, idObject, name, objectType } = props;
    const nodeId = getRepositoryTreeNodeId(idSystemObject, idObject, objectType);

    const { getObjectChildren, getObjectChildrenData, getObjectChildrenLoading, getObjectChildrenError } = useGetObjectChildren(idSystemObject);

    const isEmpty = !getObjectChildrenData?.getObjectChildren?.entries.length ?? false;

    const entries = getSortedTreeEntries(getObjectChildrenData?.getObjectChildren?.entries ?? []);

    return (
        <StyledTreeItem
            onLabelClick={getObjectChildren}
            onIconClick={getObjectChildren}
            nodeId={nodeId}
            label={name}
        >
            <TreeViewContents name={name} loading={getObjectChildrenLoading && !getObjectChildrenError} isEmpty={isEmpty} objectType={objectType}>
                {entries.map((entry, index: number) => {
                    const { idSystemObject, name, objectType, idObject } = entry;
                    return (
                        <RepositoryTreeNode
                            key={index}
                            idSystemObject={idSystemObject}
                            name={name}
                            objectType={objectType}
                            idObject={idObject}
                        />
                    );
                })}
            </TreeViewContents>
        </StyledTreeItem>
    );
}

export default RepositoryTreeNode;
