import React, { useState } from 'react';
import StyledTreeItem from './StyledTreeItem';
import ItemTreeNode from './ItemTreeNode';
import TreeViewContents from './TreeViewContents';

interface SubjectTreeNodeProps {
    idSubject: number;
}

function SubjectTreeNode({ idSubject }: SubjectTreeNodeProps): React.ReactElement {
    const [loading, setLoading] = useState(true);

    const loadData = () => {
        console.log('Loading items for idSubject', idSubject);
        setTimeout(() => {
            setLoading(false);
        }, 2000);
    };

    return (
        <StyledTreeItem
            onLabelClick={loadData}
            onIconClick={loadData}
            nodeId={`subject-${idSubject}`}
            label={`subject-${idSubject}`}
        >
            <TreeViewContents loading={loading}>
                <ItemTreeNode idItem={1} />
                <ItemTreeNode idItem={2} />
                <ItemTreeNode idItem={3} />
            </TreeViewContents>
        </StyledTreeItem>
    );
}

export default SubjectTreeNode;
