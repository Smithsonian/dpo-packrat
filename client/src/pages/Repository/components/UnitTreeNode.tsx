import React, { useState } from 'react';
import StyledTreeItem from './StyledTreeItem';
import SubjectTreeNode from './SubjectTreeNode';
import TreeViewContents from './TreeViewContents';

interface UnitTreeNodeProps {
    idUnit: number;
}

function UnitTreeNode({ idUnit }: UnitTreeNodeProps): React.ReactElement {
    const [loading, setLoading] = useState(true);

    const loadData = () => {
        console.log('Loading subjects for idUnit', idUnit);
        setTimeout(() => {
            setLoading(false);
        }, 2000);
    };

    return (
        <StyledTreeItem
            onLabelClick={loadData}
            onIconClick={loadData}
            nodeId={`unit-${idUnit}`}
            label={`unit-${idUnit}`}
        >
            <TreeViewContents loading={loading}>
                <SubjectTreeNode idSubject={1} />
                <SubjectTreeNode idSubject={2} />
                <SubjectTreeNode idSubject={3} />
            </TreeViewContents>
        </StyledTreeItem>
    );
}

export default UnitTreeNode;
