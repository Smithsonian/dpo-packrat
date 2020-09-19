import React from 'react';
import StyledTreeItem from './StyledTreeItem';
import ItemTreeNode from './ItemTreeNode';
import TreeViewContents, { RepositoryContentType } from './TreeViewContents';
import { BsArchive } from 'react-icons/bs';
import { useLazyQuery } from '@apollo/client';
import { GetItemsForSubjectDocument } from '../../../../types/graphql';

interface SubjectTreeNodeProps {
    idSubject: number;
    Name: string;
}

function SubjectTreeNode(props: SubjectTreeNodeProps): React.ReactElement {
    const { idSubject, Name } = props;
    const [getItemsForSubject, { data, loading, error }] = useLazyQuery(GetItemsForSubjectDocument, {
        variables: {
            input: {
                idSubject
            }
        }
    });

    const loadItems = () => {
        getItemsForSubject();
    };

    const renderItem = ({ idItem, Name }, index: number) => <ItemTreeNode key={index} idItem={idItem} Name={Name} />;

    const isEmpty = !data?.getItemsForSubject?.Item.length ?? false;

    return (
        <StyledTreeItem
            onLabelClick={loadItems}
            onIconClick={loadItems}
            nodeId={`subject-${idSubject}`}
            icon={<BsArchive size={20} />}
            label={Name}
        >
            <TreeViewContents loading={loading && !error} isEmpty={isEmpty} contentType={RepositoryContentType.items}>
                {data?.getItemsForSubject?.Item.map(renderItem)}
            </TreeViewContents>
        </StyledTreeItem>
    );
}

export default SubjectTreeNode;
