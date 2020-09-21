import React from 'react';
import StyledTreeItem from './StyledTreeItem';
import SubjectTreeNode from './SubjectTreeNode';
import TreeViewContents, { RepositoryContentType } from './TreeViewContents';
import { useLazyQuery } from '@apollo/client';
import { GetSubjectsForUnitDocument } from '../../../../types/graphql';

interface UnitTreeNodeProps {
    idUnit: number;
    Name: string;
}

function UnitTreeNode(props: UnitTreeNodeProps): React.ReactElement {
    const { idUnit, Name } = props;
    const [getSubjectsForUnit, { data, loading, error }] = useLazyQuery(GetSubjectsForUnitDocument, {
        variables: {
            input: {
                idUnit
            }
        }
    });

    const loadSubjects = () => {
        getSubjectsForUnit();
    };

    const renderSubject = ({ idSubject, Name }, index: number) => <SubjectTreeNode key={index} idSubject={idSubject} Name={Name} />;

    const isEmpty = !data?.getSubjectsForUnit?.Subject.length ?? false;

    return (
        <StyledTreeItem
            onLabelClick={loadSubjects}
            onIconClick={loadSubjects}
            nodeId={`unit-${idUnit}`}
            label={Name}
        >
            <TreeViewContents loading={loading && !error} isEmpty={isEmpty} contentType={RepositoryContentType.subjects}>
                {data?.getSubjectsForUnit?.Subject.map(renderSubject)}
            </TreeViewContents>
        </StyledTreeItem>
    );
}

export default UnitTreeNode;
