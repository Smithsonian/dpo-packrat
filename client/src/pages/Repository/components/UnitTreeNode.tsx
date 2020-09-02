import React, { useState } from 'react';
import StyledTreeItem from './StyledTreeItem';
import SubjectTreeNode from './SubjectTreeNode';
import TreeViewContents from './TreeViewContents';
import mockRepositoryData from '../mock.repository';

const { subjects } = mockRepositoryData;

interface UnitTreeNodeProps {
    idUnit: number;
    Name: string;
}

function UnitTreeNode(props: UnitTreeNodeProps): React.ReactElement {
    const { idUnit, Name } = props;
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
            label={Name}
        >
            <TreeViewContents loading={loading}>
                {subjects.map(({ idSubject, Name }, index) => <SubjectTreeNode key={index} idSubject={idSubject} Name={Name} />)}
            </TreeViewContents>
        </StyledTreeItem>
    );
}

export default UnitTreeNode;
