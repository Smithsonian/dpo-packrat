import { RepositoryFilter } from '../pages/Repository';
import { eSystemObjectType } from '../types/server';
import { NavigationResultEntry } from '../types/graphql';
import lodash from 'lodash';

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
