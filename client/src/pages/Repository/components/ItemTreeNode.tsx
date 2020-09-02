import React, { useState } from 'react';
import StyledTreeItem from './StyledTreeItem';
import TreeViewContents from './TreeViewContents';
import { AiOutlineFileZip } from 'react-icons/ai';
import { FiBox } from 'react-icons/fi';

interface ItemTreeNodeProps {
    idItem: number;
    Name: string;
}

function ItemTreeNode(props: ItemTreeNodeProps): React.ReactElement {
    const { idItem, Name } = props;
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
            icon={<FiBox size={20} />}
            label={Name}
        >
            <TreeViewContents loading={loading}>
                <StyledTreeItem icon={<AiOutlineFileZip />} nodeId='9' label='Capture Data' />
                <StyledTreeItem icon={<AiOutlineFileZip />} nodeId='10' label='Models' />
                <StyledTreeItem icon={<AiOutlineFileZip />} nodeId='11' label='Scenes' />
            </TreeViewContents>
        </StyledTreeItem>
    );
}

export default ItemTreeNode;
