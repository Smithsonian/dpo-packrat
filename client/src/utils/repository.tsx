/* eslint-disable @typescript-eslint/no-explicit-any */
import lodash from 'lodash';
import * as qs from 'query-string';
import React from 'react';
import { AiOutlineFileText } from 'react-icons/ai';
import { RepositoryIcon } from '../components';
import { HOME_ROUTES } from '../constants';
import { RepositoryFilter } from '../pages/Repository';
import { TreeViewColumn } from '../pages/Repository/components/RepositoryTreeView/MetadataView';
import Colors, { RepositoryColorVariant } from '../theme/colors';
import { NavigationResultEntry } from '../types/graphql';
import { eMetadata, eSystemObjectType } from '../types/server';

export function getSystemObjectTypesForFilter(filter: RepositoryFilter): eSystemObjectType[] {
    const objectTypes: eSystemObjectType[] = [];

    if (filter.units) {
        objectTypes.push(eSystemObjectType.eUnit);
    }

    if (filter.projects) {
        objectTypes.push(eSystemObjectType.eProject);
    }

    return objectTypes;
}

export function getTermForSystemObjectType(objectType: eSystemObjectType): string {
    switch (objectType) {
        case eSystemObjectType.eUnit:
            return 'unit';
        case eSystemObjectType.eProject:
            return 'project';
        case eSystemObjectType.eSubject:
            return 'subject';
        case eSystemObjectType.eItem:
            return 'item';
        case eSystemObjectType.eCaptureData:
            return 'capture data';
        case eSystemObjectType.eModel:
            return 'model';
        case eSystemObjectType.eScene:
            return 'scene';
        case eSystemObjectType.eIntermediaryFile:
            return 'intermediary file';
        case eSystemObjectType.eProjectDocumentation:
            return 'project documentation';
        case eSystemObjectType.eAsset:
            return 'asset';
        case eSystemObjectType.eAssetVersion:
            return 'asset version';
        case eSystemObjectType.eActor:
            return 'actor';
        case eSystemObjectType.eStakeholder:
            return 'stakeholder';
        default:
            return 'unknown';
    }
}

export function getRepositoryTreeNodeId(idSystemObject: number, objectType: eSystemObjectType, idObject: number): string {
    return `${idSystemObject}-${eSystemObjectType[objectType]}-${idObject}`;
}

type ParsedNodeId = {
    idSystemObject: number;
    idObject: number;
    objectType: eSystemObjectType;
};

export function parseRepositoryTreeNodeId(nodeId: string): ParsedNodeId {
    const [nodeSystemObjectId, nodeObjectType, nodeObjectId] = nodeId.split('-');
    const idSystemObject = Number.parseInt(nodeSystemObjectId, 10);
    const objectType = Number.parseInt(nodeObjectType, 10);
    const idObject = Number.parseInt(nodeObjectId, 10);

    return {
        idSystemObject,
        objectType,
        idObject
    };
}

export function getSortedTreeEntries(entries: NavigationResultEntry[]): NavigationResultEntry[] {
    return lodash.orderBy(entries, [(entry: NavigationResultEntry) => entry.name.toLowerCase()], 'asc');
}

export function trimmedMetadataField(value: string, start: number, end: number): string {
    const { length } = value;
    if (length < 30) return value;
    return `${value.substring(0, start)}...${value.substring(length - end, length)}`;
}

export function parseRepositoryUrl(search: string): any {
    return qs.parse(search, {
        parseBooleans: true,
        parseNumbers: true,
        arrayFormat: 'comma'
    });
}

export function generateRepositoryUrl(filter: RepositoryFilter): string {
    const validate = (value: unknown) => {
        if (lodash.isBoolean(value)) {
            return value === true;
        }

        return true;
    };

    const queryResult = lodash.pickBy(filter, validate);
    return `${HOME_ROUTES.REPOSITORY}?${qs.stringify(queryResult)}`;
}

export function getTreeWidth(columnSize: number, sideBarExpanded: boolean): string {
    const computedWidth = 50 + columnSize * 10;
    const isXLScreen = window.innerWidth >= 1600;

    if (computedWidth <= 80) {
        if (isXLScreen) {
            if (sideBarExpanded) return '85vw';
            return '93vw';
        } else {
            if (sideBarExpanded) return '81.5vw';
            return '91vw';
        }
    }

    return `${computedWidth}vw`;
}

export function getTreeColorVariant(index: number): RepositoryColorVariant {
    return index % 2 ? RepositoryColorVariant.light : RepositoryColorVariant.regular;
}

export function getTreeViewColumns(metadataColumns: eMetadata[], isHeader: boolean, values?: string[]): TreeViewColumn[] {
    const treeColumns: TreeViewColumn[] = [];
    const MIN_SIZE = 5;

    metadataColumns.forEach((metadataColumn, index: number) => {
        const treeColumn: TreeViewColumn = {
            metadataColumn,
            label: values ? values[index] : 'Unknown',
            size: MIN_SIZE
        };

        switch (metadataColumn) {
            case eMetadata.eUnitAbbreviation:
                if (isHeader) treeColumn.label = 'Unit';
                break;

            case eMetadata.eSubjectIdentifier:
                if (isHeader) treeColumn.label = 'Subject';
                treeColumn.size = MIN_SIZE * 3;
                break;

            case eMetadata.eItemName:
                if (isHeader) treeColumn.label = 'Item';
                treeColumn.size = MIN_SIZE * 3;
                break;

            default:
                break;
        }

        treeColumns.push(treeColumn);
    });

    return treeColumns;
}

export function computeMetadataViewWidth(treeColumns: TreeViewColumn[]): string {
    return `${treeColumns.reduce((prev, current) => prev + current.size, 0)}vw`;
}


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

export function sortEntriesAlphabetically(entries: NavigationResultEntry[]): NavigationResultEntry[] {
    return lodash.orderBy(entries, [entry => entry.name.toLowerCase().trim()], ['asc']);
}