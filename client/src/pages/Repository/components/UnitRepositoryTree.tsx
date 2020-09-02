import React from 'react';
import StyledTreeItem from './StyledTreeItem';
import SubjectRepositoryTree from './SubjectRepositoryTree';
import TreeViewContents from './TreeViewContents';

interface UnitSubTreeProps {
    idUnit: number;
}

function UnitSubTree({ idUnit }: UnitSubTreeProps): React.ReactElement {
    const [loading, setLoading] = React.useState(true);

    const loadData = () => {
        setTimeout(() => {
            console.log('loading units for idUnit', idUnit);
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
                <SubjectRepositoryTree idSubject={1} />
                <SubjectRepositoryTree idSubject={2} />
                <SubjectRepositoryTree idSubject={3} />
            </TreeViewContents>
        </StyledTreeItem>
    );
}

export default UnitSubTree;
