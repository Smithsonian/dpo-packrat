import React, { useState } from 'react';
import StyledTreeItem from './StyledTreeItem';
import TreeViewContents from './TreeViewContents';

interface ItemTreeNodeProps {
    idItem: number;
}

function ItemTreeNode({ idItem }: ItemTreeNodeProps): React.ReactElement {
    const [loading, setLoading] = useState(true);

    const loadData = () => {
        console.log('Loading data for idItem', idItem);
        setTimeout(() => {
            setLoading(false);
        }, 2000);
    };

    return (
        <StyledTreeItem
            onLabelClick={loadData}
            onIconClick={loadData}
            nodeId={`item-${idItem}`}
            label={`item-${idItem}`}
        >
            <TreeViewContents loading={loading}>
                <StyledTreeItem nodeId='9' label='Capture Data' />
                <StyledTreeItem nodeId='10' label='Models' />
                <StyledTreeItem nodeId='11' label='Scenes' />
            </TreeViewContents>
        </StyledTreeItem>
    );
}

export default ItemTreeNode;
