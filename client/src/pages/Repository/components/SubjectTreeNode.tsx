import React, { useState } from 'react';
import StyledTreeItem from './StyledTreeItem';
import ItemTreeNode from './ItemTreeNode';
import TreeViewContents from './TreeViewContents';
import { BsArchive } from 'react-icons/bs';
import mockRepositoryData from '../mock.repository';

const { items } = mockRepositoryData;

interface SubjectTreeNodeProps {
    idSubject: number;
    Name: string;
}

function SubjectTreeNode(props: SubjectTreeNodeProps): React.ReactElement {
    const { idSubject, Name } = props;
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
            icon={<BsArchive size={20} />}
            label={Name}
        >
            <TreeViewContents loading={loading}>
                {items.map(({ idItem, Name }, index) => <ItemTreeNode key={index} idItem={idItem} Name={Name} />)}
            </TreeViewContents>
        </StyledTreeItem>
    );
}

export default SubjectTreeNode;
