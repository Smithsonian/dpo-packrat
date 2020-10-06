import React from 'react';
import { AiOutlineFileText } from 'react-icons/ai';
import { RepositoryFilter } from '../..';
import { RepositoryIcon } from '../../../../components';
import { Colors } from '../../../../theme';
import { RepositoryColorVariant } from '../../../../theme/colors';
import { NavigationResultEntry } from '../../../../types/graphql';
import { eMetadata, eSystemObjectType } from '../../../../types/server';
import { getRepositoryTreeNodeId, getSortedTreeEntries, getTreeColorVariant, getTreeViewColumns } from '../../../../utils/repository';
import { useGetObjectChildren } from '../../hooks/useRepository';
import StyledTreeItem, { TreeViewColumn } from './StyledTreeItem';
import TreeViewContents from './TreeViewContents';

export type ExpandedNodeMap = Map<string, void>;

interface RepositoryTreeNodeProps {
    idSystemObject: number;
    idObject: number;
    name: string;
    color: string;
    objectType: eSystemObjectType;
    icon: React.ReactNode;
    treeColumns: TreeViewColumn[];
    filter: RepositoryFilter;
    expandedNodes: ExpandedNodeMap;
}

function RepositoryTreeNode(props: RepositoryTreeNodeProps): React.ReactElement {
    const { idSystemObject, idObject, name, objectType, icon, color, treeColumns, filter, expandedNodes } = props;
    const {
        getObjectChildren,
        getObjectChildrenData,
        getObjectChildrenLoading,
        getObjectChildrenError,
    } = useGetObjectChildren(idSystemObject, filter);

    const queryData = getObjectChildrenData?.getObjectChildren;

    const nodeId = getRepositoryTreeNodeId(idSystemObject, idObject, objectType);
    const isEmpty = !queryData?.entries.length ?? true;
    const entries = getSortedTreeEntries(queryData?.entries ?? []);
    const metadataColumns = queryData?.metadataColumns ?? [];
    const loading = getObjectChildrenLoading && !getObjectChildrenError;

    const loadData = expandedNodes.has(nodeId);

    React.useEffect(() => {
        if (loadData) {
            getObjectChildren();
        }
    }, [loadData, getObjectChildren]);

    return (
        <StyledTreeItem
            icon={icon}
            color={color}
            objectType={objectType}
            nodeId={nodeId}
            label={name}
            treeColumns={treeColumns}
        >
            <TreeViewContents name={name} loading={loading} isEmpty={isEmpty} objectType={objectType}>
                {renderTreeNodes(expandedNodes, filter, entries, metadataColumns)}
            </TreeViewContents>
        </StyledTreeItem>
    );
}

export const renderTreeNodes = (expandedNodes: ExpandedNodeMap, filter: RepositoryFilter, entries: NavigationResultEntry[], metadataColumns: eMetadata[]): React.ReactNode =>
    entries.map((entry, index: number) => {
        const { idSystemObject, name, objectType, idObject, metadata } = entry;
        const variant = getTreeColorVariant(index);
        const { icon, color } = getObjectInterfaceDetails(objectType, variant);
        const treeColumns = getTreeViewColumns(metadataColumns, false, metadata);

        return (
            <RepositoryTreeNode
                key={index}
                idSystemObject={idSystemObject}
                name={name}
                icon={icon}
                color={color}
                objectType={objectType}
                idObject={idObject}
                treeColumns={treeColumns}
                filter={filter}
                expandedNodes={expandedNodes}
            />
        );
    });

type ObjectInterfaceDetails = {
    icon: React.ReactNode;
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
