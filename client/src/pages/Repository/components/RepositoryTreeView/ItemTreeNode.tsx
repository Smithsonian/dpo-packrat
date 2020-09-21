import React from 'react';
import StyledTreeItem from './StyledTreeItem';
import TreeViewContents, { RepositoryContentType } from './TreeViewContents';
import { AiOutlineFileZip } from 'react-icons/ai';
import { FiBox } from 'react-icons/fi';
import { useLazyQuery } from '@apollo/client';
import { GetObjectsForItemDocument } from '../../../../types/graphql';

interface ItemTreeNodeProps {
    idItem: number;
    Name: string;
}

function ItemTreeNode(props: ItemTreeNodeProps): React.ReactElement {
    const { idItem, Name } = props;
    const [getObjectsForItem, { data, loading, error }] = useLazyQuery(GetObjectsForItemDocument, {
        variables: {
            input: {
                idItem
            }
        }
    });

    const loadObjects = () => {
        getObjectsForItem();
    };

    const renderCaptureData = ({ idCaptureData }, index: number) => <StyledTreeItem key={index} icon={<AiOutlineFileZip />} nodeId={`capture-data-${idCaptureData}`} label={idCaptureData} />;

    const renderModel = ({ idModel }, index: number) => <StyledTreeItem key={index} icon={<AiOutlineFileZip />} nodeId={`model-${idModel}`} label={idModel} />;

    const renderScene = ({ idScene, Name }, index: number) => <StyledTreeItem key={index} icon={<AiOutlineFileZip />} nodeId={`scene-${idScene}`} label={Name} />;

    const renderIntermediaryFile = ({ idIntermediaryFile }, index: number) => <StyledTreeItem key={index} icon={<AiOutlineFileZip />} nodeId={`intermediary-file-${idIntermediaryFile}`} label={idIntermediaryFile} />;

    const renderProjectDocumentation = ({ idProjectDocumentation, Name }, index: number) => <StyledTreeItem key={index} icon={<AiOutlineFileZip />} nodeId={`project-documentation-${idProjectDocumentation}`} label={Name} />;

    const isEmpty = (!data?.getObjectsForItem?.CaptureData.length && !data?.getObjectsForItem?.Model.length && !data?.getObjectsForItem?.Scene.length && !data?.getObjectsForItem?.IntermediaryFile.length && !data?.getObjectsForItem?.ProjectDocumentation.length) ?? false;

    return (
        <StyledTreeItem
            onLabelClick={loadObjects}
            onIconClick={loadObjects}
            nodeId={`item-${idItem}`}
            icon={<FiBox size={20} />}
            label={Name}
        >
            <TreeViewContents loading={loading && !error} isEmpty={isEmpty} contentType={RepositoryContentType.data}>
                {data?.getObjectsForItem?.CaptureData.map(renderCaptureData)}
                {data?.getObjectsForItem?.Model.map(renderModel)}
                {data?.getObjectsForItem?.Scene.map(renderScene)}
                {data?.getObjectsForItem?.IntermediaryFile.map(renderIntermediaryFile)}
                {data?.getObjectsForItem?.ProjectDocumentation.map(renderProjectDocumentation)}
            </TreeViewContents>
        </StyledTreeItem>
    );
}

export default ItemTreeNode;
