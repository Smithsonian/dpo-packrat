import React from 'react';
import StyledTreeItem from './StyledTreeItem';
import ItemRepositoryTree from './ItemRepositoryTree';
import TreeViewContents from './TreeViewContents';

interface SubjectSubTreeProps {
    idSubject: number;
}

function SubjectSubTree({ idSubject }: SubjectSubTreeProps): React.ReactElement {
    const [loading, setLoading] = React.useState(true);

    const loadData = () => {
        setTimeout(() => {
            console.log('loading subjects for idSubject', idSubject);
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
                <ItemRepositoryTree idItem={1} />
                <ItemRepositoryTree idItem={2} />
                <ItemRepositoryTree idItem={3} />
            </TreeViewContents>
        </StyledTreeItem>
    );
}

export default SubjectSubTree;
