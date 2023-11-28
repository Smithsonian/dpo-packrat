/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Repository utilities
 *
 * Utilities for components associated with Repository UI.
 */
import { CheckboxProps } from '@material-ui/core';
import { Breakpoint } from '@material-ui/core/styles/createBreakpoints';
import lodash from 'lodash';
import * as qs from 'query-string';
import React from 'react';
import { AiOutlineFileText } from 'react-icons/ai';
import { RepositoryIcon, RepositoryIconProps } from '../components';
import { RepositoryFilter } from '../pages/Repository';
import { TreeViewColumn } from '../pages/Repository/components/RepositoryTreeView/MetadataView';
import { metadataToDisplayOptions } from '../pages/Repository/components/RepositoryFilterView/RepositoryFilterOptions';
import { StateRelatedObject } from '../store';
import { palette } from '../theme';
import Colors, { RepositoryColorVariant } from '../theme/colors';
import { NavigationResultEntry } from '../types/graphql';
import { eMetadata, eSystemObjectType } from '@dpo-packrat/common';
import { safeDate, convertLocalDateToUTC } from './shared';
import { ExistingRelationship } from '../types/graphql';

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

// prettier-ignore
export function getTermForSystemObjectType(objectType: eSystemObjectType): string {
    switch (objectType) {
        case eSystemObjectType.eUnit:                   return 'Unit';
        case eSystemObjectType.eProject:                return 'Project';
        case eSystemObjectType.eSubject:                return 'Subject';
        case eSystemObjectType.eItem:                   return 'Media Group';
        case eSystemObjectType.eCaptureData:            return 'Capture Data';
        case eSystemObjectType.eModel:                  return 'Model';
        case eSystemObjectType.eScene:                  return 'Scene';
        case eSystemObjectType.eIntermediaryFile:       return 'Intermediary File';
        case eSystemObjectType.eProjectDocumentation:   return 'Project Documentation';
        case eSystemObjectType.eAsset:                  return 'Asset';
        case eSystemObjectType.eAssetVersion:           return 'Asset Version';
        case eSystemObjectType.eActor:                  return 'Actor';
        case eSystemObjectType.eStakeholder:            return 'Stakeholder';
        default:                                        return 'Unknown';
    }
}

export function getRepositoryTreeNodeId(idSystemObject: number, objectType: eSystemObjectType, idObject: number, hierarchy: string): string {
    return `${idSystemObject}-${eSystemObjectType[objectType]}-${idObject}-${hierarchy}`;
}

type ParsedNodeId = {
    idSystemObject: number;
    idObject: number;
    objectType: eSystemObjectType;
    hierarchy: string;
};

export function parseRepositoryTreeNodeId(nodeId: string): ParsedNodeId {
    const [nodeSystemObjectId, nodeObjectType, nodeObjectId, hierarchy] = nodeId.split('-');
    const idSystemObject = Number.parseInt(nodeSystemObjectId, 10);
    const objectType = Number.parseInt(nodeObjectType, 10);
    const idObject = Number.parseInt(nodeObjectId, 10);

    return {
        idSystemObject,
        objectType,
        idObject,
        hierarchy
    };
}

export function getSortedTreeEntries(entries: NavigationResultEntry[]): NavigationResultEntry[] {
    return lodash.orderBy(entries, [(entry: NavigationResultEntry) => entry.name.toLowerCase()], 'asc');
}

export function trimmedMetadataField(value: string, start: number, end: number): string {
    if (!value)
        return '';
    const length = value.length;
    if (length < (start + end))
        return value;
    return `${value.substring(0, start)} ... ${value.substring(length - end, length)}`;
}

export function parseRepositoryUrl(search: string): any {
    const filter: any = qs.parse(search, {
        parseBooleans: true,
        parseNumbers: true,
        arrayFormat: 'comma'
    });

    // special handling for dates -- we want to convert these back from ISO strings
    const dateCreatedFromS: RegExpMatchArray | null = search.match(/dateCreatedFrom=(.*?)([&]|$)/);
    if (dateCreatedFromS && dateCreatedFromS.length >= 2) {
        const dateString: string = decodeURIComponent(dateCreatedFromS[1]);
        const dateCreatedFrom: Date = convertLocalDateToUTC(new Date(dateString));
        filter.dateCreatedFrom = safeDate(dateCreatedFrom);
    }

    const dateCreatedToS: RegExpMatchArray | null = search.match(/dateCreatedTo=(.*?)([&]|$)/);
    if (dateCreatedToS && dateCreatedToS.length >= 2) {
        const dateString: string = decodeURIComponent(dateCreatedToS[1]);
        const dateCreatedTo: Date = convertLocalDateToUTC(new Date(dateString));
        filter.dateCreatedTo = safeDate(dateCreatedTo);
    }

    const searchS: RegExpMatchArray | null = search.match(/search=(.*?)([&]|$)/);
    if (searchS && searchS.length >= 2) {
        const searchString: string = decodeURIComponent(searchS[1]);
        filter.search = searchString;
    }

    const keywordS: RegExpMatchArray | null = search.match(/keyword=(.*?)([&]|$)/);
    if (keywordS && keywordS.length >= 2) {
        const keywordString: string = decodeURIComponent(keywordS[1]);
        filter.keyword = keywordString;
    }
    return filter;
}

export function generateRepositoryUrl(filter: RepositoryFilter): string {
    let filterCopy: RepositoryFilter = filter;

    // special handling for dates -- we want to render these as ISO strings
    if (filterCopy.dateCreatedFrom || filterCopy.dateCreatedTo) {
        filterCopy = lodash.clone(filter);
        const dateCreatedFrom: Date | null = safeDate(filterCopy.dateCreatedFrom);
        delete filterCopy.dateCreatedFrom;
        if (dateCreatedFrom) filterCopy.dateCreatedFrom = dateCreatedFrom.toISOString().substring(0, 10);

        const dateCreatedTo: Date | null = safeDate(filterCopy.dateCreatedTo);
        delete filterCopy.dateCreatedTo;
        if (dateCreatedTo) filterCopy.dateCreatedTo = dateCreatedTo.toISOString().substring(0, 10);
    }

    const ret: string =
        '?' +
        qs.stringify(filterCopy, {
            arrayFormat: 'comma',
            skipEmptyString: true,
            skipNull: true
        });
    return ret;
}

export function getTreeWidth(columnSize: number, sideBarExpanded: boolean, fullWidth: boolean): string {
    const computedWidth = 50 + columnSize * 10;
    const isXLScreen = window.innerWidth >= 1600;

    if (fullWidth) {
        return '90vw';
    }

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

// cached data, computed once
let metadataTitleMap: Map<eMetadata, string> | null = null;

// prettier-ignore
export function getTreeViewColumns(metadataColumns: eMetadata[], isHeader: boolean, values?: string[]): TreeViewColumn[] {
    const treeColumns: TreeViewColumn[] = [];

    if (!metadataTitleMap) {
        metadataTitleMap = new Map<eMetadata, string>();
        for (const filterOption of metadataToDisplayOptions)
            metadataTitleMap.set(filterOption.value, filterOption.label);
    }

    const valuesCount: number = values ? values.length : 0;
    metadataColumns.forEach((metadataColumn, index: number) => {
        const treeColumn: TreeViewColumn = {
            metadataColumn,
            label: (values && valuesCount > index) ? values[index] : 'Unknown',
        };

        if (isHeader)
            treeColumn.label = metadataTitleMap ? (metadataTitleMap.get(metadataColumn) || 'Unknown') : 'Unknown';

        treeColumns.push(treeColumn);
    });

    return treeColumns;
}

type ObjectInterfaceDetails = {
    icon: React.ReactNode;
    color: string;
};

// prettier-ignore
export function getObjectInterfaceDetails(objectType: eSystemObjectType, variant: RepositoryColorVariant, makeStyles: any, idSystemObject: number): ObjectInterfaceDetails {
    const color: string = Colors.repository[objectType][variant];
    const textColor: string = Colors.defaults.white;
    const backgroundColor: string = Colors.repository[objectType][RepositoryColorVariant.dark] || Colors.repository.default[RepositoryColorVariant.dark];

    const iconProps: RepositoryIconProps = { objectType, backgroundColor, textColor, overrideText: undefined, idSystemObject };
    const fileIcon = (
        <a
            href={getDetailsUrlForObject(idSystemObject)}
            onClick={event => event.stopPropagation()}
            target='_blank'
            rel='noopener noreferrer'
            aria-label={`link to view system object of id ${idSystemObject}`}
            style={{ textDecoration: 'none', color: 'black' }}
        >
            <AiOutlineFileText style={{ verticalAlign: 'bottom' }} />
        </a>
    );

    switch (objectType) {
        default:                                        break;
        case eSystemObjectType.eIntermediaryFile:       iconProps.overrideText = 'IF'; break;
        case eSystemObjectType.eProjectDocumentation:   iconProps.overrideText = 'PD'; break;
        case eSystemObjectType.eActor:                  iconProps.overrideText = 'AC'; break;
        case eSystemObjectType.eStakeholder:            iconProps.overrideText = 'ST'; break;
        case eSystemObjectType.eItem:                   iconProps.overrideText = 'MG'; break;
        case eSystemObjectType.eSubject:                iconProps.overrideText = 'SU'; break;
        case eSystemObjectType.eCaptureData:            iconProps.overrideText = 'CD'; break;
        case eSystemObjectType.eAsset:
        case eSystemObjectType.eAssetVersion:
            return { icon: fileIcon, color };
    }

    return { icon: <RepositoryIcon {...iconProps} makeStyles={{ ...makeStyles, color, backgroundColor }} />, color };
}

export function sortEntriesAlphabetically(entries: NavigationResultEntry[]): NavigationResultEntry[] {
    return lodash.orderBy(entries, [entry => entry.name.toLowerCase().trim()], ['asc']);
}

export function isRepositoryItemSelected(nodeId: string, sourceObjects: StateRelatedObject[]): boolean {
    const { idSystemObject } = parseRepositoryTreeNodeId(nodeId);
    const idSystemObjects: number[] = sourceObjects.map(({ idSystemObject }) => idSystemObject);

    return idSystemObjects.includes(idSystemObject);
}

export function getDetailsUrlForObject(idSystemObject: number): string {
    return `/repository/details/${idSystemObject}`;
}

export function getDownloadAssetUrlForObject(serverEndPoint: string | undefined, idAsset: number): string {
    return `${serverEndPoint}/download?idAsset=${idAsset}`;
}

export function getDownloadAllAssetsUrlForObject(serverEndPoint: string | undefined, idSystemObject: number): string {
    return `${serverEndPoint}/download?idSystemObject=${idSystemObject}`;
}

export function getDownloadAssetVersionUrlForObject(serverEndPoint: string | undefined, idAssetVersion: number): string {
    return `${serverEndPoint}/download?idAssetVersion=${idAssetVersion}`;
}

export function getDownloadObjectVersionUrlForObject(serverEndPoint: string | undefined, idSystemObjectVersion: number): string {
    return `${serverEndPoint}/download?idSystemObjectVersion=${idSystemObjectVersion}`;
}

export function getDownloadValueForMetadata(serverEndPoint: string | undefined, idMetadata: number): string {
    return `${serverEndPoint}/download?idMetadata=${idMetadata}`;
}

export function getDownloadValueForWorkflowReport(serverEndPoint: string | undefined, WorkflowReport: number): string {
    return `${serverEndPoint}/download?idWorkflowReport=${WorkflowReport}`;
}

export function getDownloadValueForWorkflowSet(serverEndPoint: string | undefined, idWorkflowSet: number): string {
    return `${serverEndPoint}/download?idWorkflowSet=${idWorkflowSet}`;
}

export function getDownloadValueForJob(serverEndPoint: string | undefined, idJob: number): string {
    return `${serverEndPoint}/download?idJobRun=${idJob}`;
}

export enum eVoyagerStoryMode {
    eViewer,
    eEdit,
    eQC,
    eAuthor,
    eExpert,
}

export function getModeForVoyager(eMode?: eVoyagerStoryMode): string {
    switch (eMode) {
        default:
        case eVoyagerStoryMode.eViewer: return '';
        case eVoyagerStoryMode.eEdit:   return 'edit';
        case eVoyagerStoryMode.eQC:     return 'qc';
        case eVoyagerStoryMode.eAuthor: return 'author';
        case eVoyagerStoryMode.eExpert: return 'expert';
    }
}

export function getVoyagerModeFromParam(sMode: string): eVoyagerStoryMode {
    switch (sMode) {
        default:
        case '':        return eVoyagerStoryMode.eViewer;
        case 'edit':    return eVoyagerStoryMode.eEdit;
        case 'qc':      return eVoyagerStoryMode.eQC;
        case 'author':  return eVoyagerStoryMode.eAuthor;
        case 'expert':  return eVoyagerStoryMode.eExpert;
    }
}

export function getRootSceneDownloadUrlForVoyager(serverEndPoint: string | undefined, idSystemObject: number,
    path: string, eMode?: eVoyagerStoryMode | undefined): string {
    let dlPath: string = 'download';
    switch (eMode) {
        default:
        case eVoyagerStoryMode.eViewer: dlPath='download'; break;
        case eVoyagerStoryMode.eEdit:   dlPath='webdav'; break;
        case eVoyagerStoryMode.eQC:     dlPath='webdav'; break;
        case eVoyagerStoryMode.eAuthor: dlPath='webdav'; break;
        case eVoyagerStoryMode.eExpert: dlPath='webdav'; break;
    }
    const uri: string = `${serverEndPoint}/${dlPath}/idSystemObject-${idSystemObject}/${path ? path + '/' : ''}`;
    console.log(`>>> getRootSceneDownload:\n${uri}\n${encodeURIComponent(uri)}`);
    console.log(`>>> path: ${path}`);
    return uri; //encodeURIComponent(uri);
}

export function getVoyagerStoryUrl(serverEndPoint: string | undefined, idSystemObject: number,
    document: string, path: string, eMode?: eVoyagerStoryMode | undefined): string {

    const mode: string = getModeForVoyager(eMode);
    const root: string = getRootSceneDownloadUrlForVoyager(serverEndPoint, idSystemObject, path, eMode);
    const uri: string = `/repository/voyager/${idSystemObject}?mode=${mode}&root=${root}&document=${document}`;
    console.log(`>>> getVoyagerStoryURL:\n${uri}\n${encodeURIComponent(uri)}\n\n${encodeURIComponent(encodeURIComponent(uri))}`);
    console.log(`>>> path: ${path}`);
    return uri; //encodeURIComponent(uri);
}

// prettier-ignore
export function getTreeViewStyleHeight(isExpanded: boolean, isModal: boolean, breakpoint: Breakpoint): string {
    const isSmallScreen: boolean = breakpoint === 'lg';

    if (isExpanded) {
        if (isModal) return isSmallScreen ? '45vh' : '55vh';
        else return isSmallScreen ? '54vh' : '62vh';
    } else {
        if (isModal) return isSmallScreen ? '70vh' : '75vh';
        else return isSmallScreen ? '79vh' : '82vh';
    }
}

export function getTreeViewStyleWidth(sideBarExpanded: boolean, breakpoint: Breakpoint): string {
    const isSmallScreen: boolean = breakpoint === 'lg';

    if (sideBarExpanded) return isSmallScreen ? '81.5vw' : '85vw';
    else return isSmallScreen ? '92vw' : '93vw';
}

export function validateArray<T>(value: T[], defaultValue: T[]): T[] {
    const result: T[] = [];

    if (!value) {
        result.push(...defaultValue);
    } else if (Array.isArray(value)) {
        result.push(...value);
    } else {
        result.push(value);
    }

    return result;
}

export function isFieldUpdated(updatedData: any, originalData: any, fieldName: string): boolean {
    return originalData?.[fieldName] !== updatedData?.[fieldName];
}

export function getUpdatedCheckboxProps(updated: boolean): CheckboxProps {
    return {
        style: { border: `1px solid ${updated ? palette.secondary.main : 'transparent'}` },
        color: updated ? 'secondary' : 'primary'
    };
}

export function isValidParentChildRelationship(
    parent: number,
    child: number,
    selected: ExistingRelationship[],
    existingParentRelationships: ExistingRelationship[],
    _isAddingSource: boolean
): boolean {
    let result = false;
    /*
        *NOTE: when updating this relationship validation function,
        make sure to also apply changes to the server-side version located at
        ingestData.ts to maintain consistency; ObjectGraph.ts also has it's own version of this logic,
        in a different form.
        **NOTE: this client-side validation function will be validating a selected item BEFORE adding it,
        which means the maximum connection count will be different from those seen in ingestData.ts
    */

    const existingAndNewRelationships = [...existingParentRelationships, ...selected];
    switch (child) {
        case eSystemObjectType.eUnit:
        case eSystemObjectType.eProject:
        case eSystemObjectType.eSubject:
        case eSystemObjectType.eAsset:
        case eSystemObjectType.eAssetVersion:
            break;

        case eSystemObjectType.eItem:
            if (parent === eSystemObjectType.eSubject)
                result = true;
            else if (parent === eSystemObjectType.eProject)
                result = maximumConnections(existingAndNewRelationships, eSystemObjectType.eProject, 1);
            break;

        case eSystemObjectType.eCaptureData:
            if (parent === eSystemObjectType.eCaptureData || parent === eSystemObjectType.eItem)
                result = true;
            break;

        case eSystemObjectType.eModel:
            if (parent === eSystemObjectType.eScene)
                result = maximumConnections(existingAndNewRelationships, eSystemObjectType.eScene, 1);
            else if (parent === eSystemObjectType.eCaptureData || parent === eSystemObjectType.eModel || parent === eSystemObjectType.eItem)
                result = true;
            break;

        case eSystemObjectType.eScene:
            if (parent === eSystemObjectType.eItem || parent === eSystemObjectType.eModel)
                result = true;
            break;

        case eSystemObjectType.eIntermediaryFile:
            if (parent === eSystemObjectType.eItem)
                result = true;
            break;

        case eSystemObjectType.eProjectDocumentation:
            if (parent === eSystemObjectType.eProject)
                result = true;
            break;

        case eSystemObjectType.eActor:
            if (parent === eSystemObjectType.eCaptureData ||
                parent === eSystemObjectType.eModel ||
                parent === eSystemObjectType.eScene ||
                parent === eSystemObjectType.eIntermediaryFile ||
                parent === eSystemObjectType.eUnit)
                result = true;
            break;

        case eSystemObjectType.eStakeholder:
            if (parent === eSystemObjectType.eUnit || parent === eSystemObjectType.eProject)
                result = true;
            break;
    }

    return result;
}

const maximumConnections = (relationships: ExistingRelationship[], objectType: number, limit: number) =>
    relationships.filter(relationship => relationship.objectType === objectType).length < limit;
