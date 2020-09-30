/* eslint-disable @typescript-eslint/no-explicit-any */
import lodash from 'lodash';
import * as qs from 'query-string';
import { HOME_ROUTES } from '../constants';
import { RepositoryFilter } from '../pages/Repository';
import { NavigationResultEntry } from '../types/graphql';
import { eSystemObjectType } from '../types/server';

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
