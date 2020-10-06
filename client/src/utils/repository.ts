/* eslint-disable @typescript-eslint/no-explicit-any */
import lodash from 'lodash';
import * as qs from 'query-string';
import { HOME_ROUTES } from '../constants';
import { RepositoryFilter } from '../pages/Repository';
import { TreeViewColumn } from '../pages/Repository/components/RepositoryTreeView/StyledTreeItem';
import { RepositoryColorVariant } from '../theme/colors';
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

export function getRepositoryTreeNodeId(idSystemObject: number, idObject: number, objectType: eSystemObjectType): string {
    return `${idSystemObject}-${eSystemObjectType[objectType]}-${idObject}`;
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

export function getTreeWidth(columnSize: number): string {
    const width = 50 + columnSize * 10;
    if (width <= 80) {
        return '83.5vw';
    }

    return `${width}vw`;
}

export function getTreeColorVariant(index: number): RepositoryColorVariant {
    return index % 2 ? RepositoryColorVariant.light : RepositoryColorVariant.regular;
}

export function getTreeViewColumns(metadataColumns: eMetadata[], isHeader: boolean, values?: string[]): TreeViewColumn[] {
    const treeColumns: TreeViewColumn[] = [];
    const MIN_SIZE = 10;

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
                if (isHeader) treeColumn.label = 'SubjectId';
                treeColumn.size = MIN_SIZE * 2;
                break;

            case eMetadata.eItemName:
                if (isHeader) treeColumn.label = 'Item name';
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
