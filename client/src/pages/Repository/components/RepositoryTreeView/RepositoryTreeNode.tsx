import React from 'react';
import StyledTreeItem from './StyledTreeItem';
import TreeViewContents from './TreeViewContents';
import { eSystemObjectType } from '../../../../types/server';
import { getRepositoryTreeNodeId, getSortedTreeEntries } from '../../../../utils/repository';
import { useGetObjectChildren } from '../../hooks/useRepository';
import { FiPackage, FiBox } from 'react-icons/fi';
import { BsArchive, BsBoundingBox } from 'react-icons/bs';
import { AiOutlineFileText } from 'react-icons/ai';
import { Colors } from '../../../../theme';
import { RepositoryColorVariant } from '../../../../theme/colors';

interface RepositoryTreeNodeProps {
    idSystemObject: number;
    idObject: number;
    name: string;
    color: string;
    objectType: eSystemObjectType;
    icon: React.ReactElement;
    metadata: string[];
}

function RepositoryTreeNode(props: RepositoryTreeNodeProps): React.ReactElement {
    const { idSystemObject, idObject, name, objectType, icon, color, metadata } = props;
    const nodeId = getRepositoryTreeNodeId(idSystemObject, idObject, objectType);

    const { getObjectChildren, getObjectChildrenData, getObjectChildrenLoading, getObjectChildrenError } = useGetObjectChildren(idSystemObject);

    const isEmpty = !getObjectChildrenData?.getObjectChildren?.entries.length ?? false;

    const entries = getSortedTreeEntries(getObjectChildrenData?.getObjectChildren?.entries ?? []);

    return (
        <StyledTreeItem
            icon={icon}
            color={color}
            onLabelClick={getObjectChildren}
            onIconClick={getObjectChildren}
            nodeId={nodeId}
            label={name}
            metadata={metadata}
        >
            <TreeViewContents name={name} loading={getObjectChildrenLoading && !getObjectChildrenError} isEmpty={isEmpty} objectType={objectType}>
                {entries.map((entry, index: number) => {
                    const { idSystemObject, name, objectType, idObject, metadata } = entry;
                    const variant = index % 2 ? RepositoryColorVariant.Light : RepositoryColorVariant.Dark;
                    const { icon, color } = getObjectInterfaceDetails(objectType, variant);

                    return (
                        <RepositoryTreeNode
                            key={index}
                            idSystemObject={idSystemObject}
                            name={name}
                            icon={icon}
                            color={color}
                            objectType={objectType}
                            idObject={idObject}
                            metadata={metadata}
                        />
                    );
                })}
            </TreeViewContents>
        </StyledTreeItem>
    );
}

type ObjectInterfaceDetails = {
    icon: React.ReactElement;
    color: string;
};

export function getObjectInterfaceDetails(objectType: eSystemObjectType, variant: RepositoryColorVariant): ObjectInterfaceDetails {
    const colorVariant = Colors.repository;

    switch (objectType) {
        case eSystemObjectType.eUnit:
            return { icon: <FiPackage />, color: colorVariant.unit[variant] };
        case eSystemObjectType.eProject:
            return { icon: <BsBoundingBox />, color: colorVariant.project[variant] };
        case eSystemObjectType.eSubject:
            return { icon: <BsArchive />, color: colorVariant.subject[variant] };
        case eSystemObjectType.eItem:
            return { icon: <FiBox />, color: colorVariant.item[variant] };
        case eSystemObjectType.eCaptureData:
            return { icon: <AiOutlineFileText />, color: colorVariant.captureData[variant] };

        default:
            return { icon: <AiOutlineFileText />, color: colorVariant.default[variant] };
    }
}

export default RepositoryTreeNode;
