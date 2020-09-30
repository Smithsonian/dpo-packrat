import React from 'react';
import StyledTreeItem from './StyledTreeItem';
import TreeViewContents from './TreeViewContents';
import { eSystemObjectType } from '../../../../types/server';
import { getRepositoryTreeNodeId, getSortedTreeEntries } from '../../../../utils/repository';
import { useGetObjectChildren } from '../../hooks/useRepository';
import { AiOutlineFileText } from 'react-icons/ai';
import { Colors } from '../../../../theme';
import { RepositoryColorVariant } from '../../../../theme/colors';
import { RepositoryIcon } from '../../../../components';

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
            objectType={objectType}
            nodeId={nodeId}
            label={name}
            metadata={metadata}
        >
            <TreeViewContents name={name} loading={getObjectChildrenLoading && !getObjectChildrenError} isEmpty={isEmpty} objectType={objectType}>
                {entries.map((entry, index: number) => {
                    const { idSystemObject, name, objectType, idObject, metadata } = entry;
                    const variant = index % 2 ? RepositoryColorVariant.light : RepositoryColorVariant.regular;
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
    const color: string = Colors.repository[objectType][variant];
    const textColor: string = Colors.defaults.white;
    const backgroundColor: string = Colors.repository[objectType][RepositoryColorVariant.dark] || Colors.repository.default[RepositoryColorVariant.dark];

    const iconProps = { objectType, backgroundColor, textColor };

    switch (objectType) {
        case eSystemObjectType.eUnit:
            return { icon: <RepositoryIcon {...iconProps} />, color };
        case eSystemObjectType.eProject:
            return { icon: <RepositoryIcon {...iconProps} />, color };
        case eSystemObjectType.eSubject:
            return { icon: <RepositoryIcon {...iconProps} />, color };
        case eSystemObjectType.eItem:
            return { icon: <RepositoryIcon {...iconProps} />, color };
        case eSystemObjectType.eCaptureData:
            return { icon: <AiOutlineFileText />, color };

        default:
            return { icon: <AiOutlineFileText />, color: Colors.repository.default[variant] };
    }
}

export default RepositoryTreeNode;
