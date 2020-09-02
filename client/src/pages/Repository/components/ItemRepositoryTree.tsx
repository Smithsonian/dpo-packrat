import React from 'react';
import StyledTreeItem from './StyledTreeItem';
import TreeViewContents from './TreeViewContents';

interface ItemSubTreeProps {
    idItem: number;
}

function ItemSubTree({ idItem }: ItemSubTreeProps): React.ReactElement {
    const [loading, setLoading] = React.useState(true);

    const loadData = () => {
        setTimeout(() => {
            console.log('loading items for idItem', idItem);
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

export default ItemSubTree;
