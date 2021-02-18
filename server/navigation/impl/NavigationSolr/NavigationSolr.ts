/* eslint-disable @typescript-eslint/no-explicit-any */

import solr from 'solr-client';
import { ClientRequest } from 'http';

import * as NAV from '../../interface';
import * as LOG from '../../../utils/logger';
import * as CACHE from '../../../cache';
import * as DBAPI from '../../../db';
// import * as H from '../../../utils/helpers';
import { eSystemObjectType } from '../../../db';
import { SolrClient } from './SolrClient';
import { Vocabulary } from '../../../types/graphql';
import { eMetadata } from '../../interface';

interface SolrQueryResult {
    result: any;
    error: any;
}

export class NavigationSolr implements NAV.INavigation {
    private _solrClient: SolrClient;

    constructor() {
        this._solrClient = new SolrClient(null, null, null);
    }

    // #region INavigation interface
    async getObjectChildren(filter: NAV.NavigationFilter): Promise<NAV.NavigationResult> {
        const SQ: solr.Query = await this.computeSolrQuery(filter);
        return await this.executeSolrQuery(filter, SQ);
    }
    // #endregion

    // #region Compute Query
    private async computeSolrQuery(filter: NAV.NavigationFilter): Promise<solr.Query> {
        let SQ: solr.Query = this._solrClient._client.query();

        // search: string;                         // search string from the user
        if (filter.search)
            SQ = SQ.q(`_text_:*${filter.search}*`);
        else
            SQ = SQ.q('*:*');

        // idRoot: number;                         // idSystemObject of item for which we should get children; 0 means get everything
        if (filter.idRoot) {
            SQ = SQ.matchFilter('HierarchyParentID', filter.idRoot);
            // objectsToDisplay: eSystemObjectType[];  // objects to display
            SQ = await this.computeFilterParamFromSystemObjectType(SQ, filter.objectsToDisplay, 'CommonObjectType', '||');
        } else {
            // objectTypes: eSystemObjectType[];       // empty array means give all appropriate children types
            const objectTypes: eSystemObjectType[] = filter.objectTypes;
            if (objectTypes.length == 0)
                objectTypes.push(eSystemObjectType.eUnit);
            SQ = await this.computeFilterParamFromSystemObjectType(SQ, objectTypes, 'CommonObjectType', '||');
        }

        // units: number[];                        // idSystemObject[] for units filter
        SQ = await this.computeFilterParamFromNumbers(SQ, filter.units, 'HierarchyUnitID', '||');

        // projects: number[];                     // idSystemObject[] for projects filter
        SQ = await this.computeFilterParamFromNumbers(SQ, filter.projects, 'HierarchyProjectID', '||');

        // has: eSystemObjectType[];               // has system object filter
        SQ = await this.computeFilterParamFromSystemObjectType(SQ, filter.has, 'ChildrenObjectTypes', '&&');

        // missing: eSystemObjectType[];           // missing system object filter
        SQ = await this.computeFilterParamFromSystemObjectType(SQ, filter.missing, '!ChildrenObjectTypes', '&&'); // TODO: does ! work here?

        // captureMethod: number[];                // idVocabulary[] for capture method filter
        // variantType: number[];                  // idVocabulary[] for variant type filter
        // modelPurpose: number[];                 // idVocabulary[] for model purpose filter
        // modelFileType: number[];                // idVocabulary[] for model file type filter
        SQ = await this.computeFilterParamFromVocabIDArray(SQ, filter.captureMethod, 'ChildrenCaptureMethods');
        SQ = await this.computeFilterParamFromVocabIDArray(SQ, filter.variantType, 'ChildrenVariantTypes');
        SQ = await this.computeFilterParamFromVocabIDArray(SQ, filter.modelPurpose, 'ChildrenModelPurposes');
        SQ = await this.computeFilterParamFromVocabIDArray(SQ, filter.modelFileType, 'ChildrenModelFileTypes');

        // metadataColumns: eMetadata[];           // empty array means give no metadata
        const filterColumns: string[] = ['idSystemObject', 'CommonObjectType', 'CommonidObject', 'CommonName']; // fetch standard fields // don't need ChildrenID
        for (const metadataColumn of filter.metadataColumns) {
            const filterColumn: string = eMetadata[metadataColumn];
            if (filterColumn)
                filterColumns.push(filterColumn.substring(1)); // strip of "e" prefix (eHierarchyUnit -> HierarchyUnit)
            else
                LOG.logger.error(`NavigationSolr.computeSolrQuery called with unexpected metadata column ${metadataColumn}`);
        }

        if (filterColumns.length > 0)
            SQ = SQ.fl(filterColumns);

        SQ = SQ.rows(100);
        LOG.logger.info(`NavigationSolr.computeSolrQuery ${JSON.stringify(filter)}: ${SQ.build()}`);
        return SQ;
    }

    private async computeFilterParamFromSystemObjectType(SQ: solr.Query, systemObjectTypes: eSystemObjectType[], filterSchema: string, operator: string): Promise<solr.Query> {
        const filterValueList: string[] | null = await this.transformSystemObjectTypeArrayToStrings(systemObjectTypes);
        return this.computeFilterParamFromStrings(SQ, filterValueList, filterSchema, operator);
    }

    private async computeFilterParamFromVocabIDArray(SQ: solr.Query, vocabFilterIDs: number[], filterSchema: string): Promise<solr.Query> {
        const filterValueList: string[] | null = await this.transformVocabIDArrayToStrings(vocabFilterIDs);
        return this.computeFilterParamFromStrings(SQ, filterValueList, filterSchema, '&&');
    }

    private computeFilterParamFromStrings(SQ: solr.Query, filterValueList: string[] | null, filterSchema: string, operator: string): solr.Query  {
        if (!filterValueList || filterValueList.length == 0)
            return SQ;

        let filterParam: string = '';
        for (const filterValue of filterValueList) {
            if (filterParam)
                filterParam += ` ${operator} ${filterSchema}:`;
            filterParam += `"${filterValue}"`;
        }
        return SQ.matchFilter(filterSchema, filterParam);
    }

    private computeFilterParamFromNumbers(SQ: solr.Query, filterValueList: number[] | null, filterSchema: string, operator: string): solr.Query  {
        if (!filterValueList || filterValueList.length == 0)
            return SQ;

        let filterParam: string = '';
        for (const filterValue of filterValueList) {
            if (filterParam)
                filterParam += ` ${operator} ${filterSchema}:`;
            filterParam += `${filterValue}`;
        }
        return SQ.matchFilter(filterSchema, filterParam);
    }

    private async transformSystemObjectTypeArrayToStrings(systemObjectTypes: eSystemObjectType[]): Promise<string[] | null> {
        const termList: string[] = [];
        for (const systemObjectType of systemObjectTypes) {
            const filterValue = DBAPI.SystemObjectTypeToName(systemObjectType);
            if (!filterValue) {
                LOG.logger.error(`NavigationSolr.computeSolrQuery handling invalid system object type ${systemObjectType}`);
                continue;
            }
            termList.push(filterValue);
        }

        return (termList.length > 0) ? termList : null;
    }

    private async transformVocabIDArrayToStrings(vocabFilterIDs: number[]): Promise<string[] | null> {
        const termList: string[] = [];
        for (const idVocabFilter of vocabFilterIDs) {
            const vocabFilter: Vocabulary | undefined = await CACHE.VocabularyCache.vocabulary(idVocabFilter);
            if (!vocabFilter) {
                LOG.logger.error(`NavigationSolr.computeSolrQuery handling invalid vocabulary value ${idVocabFilter}`);
                continue;
            }
            termList.push(vocabFilter.Term);
        }

        return (termList.length > 0) ? termList : null;
    }
    // #endregion

    // #region Execute Query
    private async executeSolrQuery(filter: NAV.NavigationFilter, SQ: solr.Query): Promise<NAV.NavigationResult> {
        LOG.logger.info('NavigationSolr.executeSolrQuery');
        let error: string = '';
        const entries: NAV.NavigationResultEntry[] = [];
        const queryResult: SolrQueryResult = await this.executeSolrQueryWorker(SQ);
        if (queryResult.error) {
            error = `Solr Query Failure: ${JSON.stringify(queryResult.error)}`;
            LOG.logger.error(`NavigationSolr.executeSolrQuery: ${error}`);
            return { success: false, error, entries, metadataColumns: filter.metadataColumns };
        }
        if (!queryResult.result || !queryResult.result.response || queryResult.result.response.numFound === undefined ||
            (queryResult.result.response.numFound > 0 && !queryResult.result.response.docs)) {
            error = `Solr Query Response malformed: ${JSON.stringify(queryResult.result)}`;
            LOG.logger.error(`NavigationSolr.executeSolrQuery: ${error}`);
            return { success: false, error, entries, metadataColumns: filter.metadataColumns };
        }

        for (const doc of queryResult.result.response.docs) {
            if (!doc.idSystemObject || !doc.CommonObjectType || !doc.CommonidObject || !doc.CommonName) {
                LOG.logger.error(`NavigationSolr.executeSolrQuery: malformed query response document ${JSON.stringify(doc)}`);
                continue;
            }

            const entry: NAV.NavigationResultEntry = {
                idSystemObject: parseInt(doc.idSystemObject),
                name: doc.CommonName || '<UNKNOWN>',
                objectType: DBAPI.SystemObjectNameToType(doc.CommonObjectType),
                idObject: doc.CommonidObject,
                metadata: this.computeMetadata(doc, filter.metadataColumns)
            };

            entries.push(entry);
        }

        // LOG.logger.info(`NavigationSolr.executeSolrQuery: ${JSON.stringify(queryResult.result)}`);
        return { success: true, error: '', entries, metadataColumns: filter.metadataColumns };
    }

    private executeSolrQueryWorker(SQ: solr.Query): Promise<SolrQueryResult> {
        return new Promise<any>((resolve) => {
            const request: ClientRequest = this._solrClient._client.search(SQ,
                function (err, obj) {
                    if (err) {
                        LOG.logger.error('NavigationSolr.executeSolrQueryWorker', err);
                        resolve({ result: null, error: err });
                    } else
                        resolve({ result: obj, error: null });
                });
            request;
        });
    }

    private computeMetadata(doc: any, metadataColumns: NAV.eMetadata[]): string[] {
        const metadata: string[] = [];
        for (const metadataColumn of metadataColumns) {
            switch (metadataColumn) {
                case NAV.eMetadata.eCommonName:                         metadata.push(this.computeMetadataFromString(doc.CommonName)); break;
                case NAV.eMetadata.eCommonDescription:                  metadata.push(this.computeMetadataFromString(doc.CommonDescription)); break;
                case NAV.eMetadata.eCommonIdentifier:                   metadata.push(this.computeMetadataFromStringArray(doc.CommonIdentifier)); break;
                case NAV.eMetadata.eCommonDateCreated:                  metadata.push(this.computeMetadataFromDate(doc.CommonDateCreated)); break;
                case NAV.eMetadata.eCommonOrganizationName:             metadata.push(this.computeMetadataFromString(doc.CommonOrganizationName)); break;
                case NAV.eMetadata.eHierarchyUnit:                      metadata.push(this.computeMetadataFromStringArray(doc.HierarchyUnit)); break;
                case NAV.eMetadata.eHierarchyProject:                   metadata.push(this.computeMetadataFromStringArray(doc.HierarchyProject)); break;
                case NAV.eMetadata.eHierarchyItem:                      metadata.push(this.computeMetadataFromStringArray(doc.HierarchyItem)); break;
                case NAV.eMetadata.eHierarchySubject:                   metadata.push(this.computeMetadataFromStringArray(doc.HierarchySubject)); break;
                case NAV.eMetadata.eUnitARKPrefix:                      metadata.push(this.computeMetadataFromString(doc.UnitARKPrefix)); break;
                case NAV.eMetadata.eSubjectIdentifierPreferred:         metadata.push(this.computeMetadataFromString(doc.SubjectIdentifierPreferred)); break;
                case NAV.eMetadata.eItemEntireSubject:                  metadata.push(this.computeMetadataFromBoolean(doc.ItemEntireSubject)); break;
                case NAV.eMetadata.eCDCaptureMethod:                    metadata.push(this.computeMetadataFromString(doc.CDCaptureMethod)); break;
                case NAV.eMetadata.eCDDatasetType:                      metadata.push(this.computeMetadataFromString(doc.CDCaptureDatasetType)); break;
                case NAV.eMetadata.eCDDatasetFieldID:                   metadata.push(this.computeMetadataFromNumber(doc.CDCaptureDatasetFieldID)); break;
                case NAV.eMetadata.eCDItemPositionType:                 metadata.push(this.computeMetadataFromString(doc.CDItemPositionType)); break;
                case NAV.eMetadata.eCDItemPositionFieldID:              metadata.push(this.computeMetadataFromNumber(doc.CDItemPositionFieldID)); break;
                case NAV.eMetadata.eCDItemArrangementFieldID:           metadata.push(this.computeMetadataFromNumber(doc.CDItemArrangementFieldID)); break;
                case NAV.eMetadata.eCDFocusType:                        metadata.push(this.computeMetadataFromString(doc.CDFocusType)); break;
                case NAV.eMetadata.eCDLightSourceType:                  metadata.push(this.computeMetadataFromString(doc.CDLightSourceType)); break;
                case NAV.eMetadata.eCDBackgroundRemovalMethod:          metadata.push(this.computeMetadataFromString(doc.CDBackgroundRemovalMethod)); break;
                case NAV.eMetadata.eCDClusterType:                      metadata.push(this.computeMetadataFromString(doc.CDClusterType)); break;
                case NAV.eMetadata.eCDClusterGeometryFieldID:           metadata.push(this.computeMetadataFromNumber(doc.CDClusterGeometryFieldID)); break;
                case NAV.eMetadata.eCDCameraSettingsUniform:            metadata.push(this.computeMetadataFromBoolean(doc.CDCameraSettingsUniform)); break;
                case NAV.eMetadata.eCDVariantType:                      metadata.push(this.computeMetadataFromStringArray(doc.CDVariantType)); break;
                case NAV.eMetadata.eModelCreationMethod:                metadata.push(this.computeMetadataFromString(doc.ModelCreationMethod)); break;
                case NAV.eMetadata.eModelMaster:                        metadata.push(this.computeMetadataFromBoolean(doc.ModelMaster)); break;
                case NAV.eMetadata.eModelAuthoritative:                 metadata.push(this.computeMetadataFromBoolean(doc.ModelAuthoritative)); break;
                case NAV.eMetadata.eModelModality:                      metadata.push(this.computeMetadataFromString(doc.ModelModality)); break;
                case NAV.eMetadata.eModelUnits:                         metadata.push(this.computeMetadataFromString(doc.ModelUnits)); break;
                case NAV.eMetadata.eModelPurpose:                       metadata.push(this.computeMetadataFromString(doc.ModelPurpose)); break;
                case NAV.eMetadata.eModelFileType:                      metadata.push(this.computeMetadataFromStringArray(doc.ModelFileType)); break;
                case NAV.eMetadata.eModelRoughness:                     metadata.push(this.computeMetadataFromNumberArray(doc.ModelRoughness)); break;
                case NAV.eMetadata.eModelMetalness:                     metadata.push(this.computeMetadataFromNumberArray(doc.ModelMetalness)); break;
                case NAV.eMetadata.eModelPointCount:                    metadata.push(this.computeMetadataFromNumberArray(doc.ModelPointCount)); break;
                case NAV.eMetadata.eModelFaceCount:                     metadata.push(this.computeMetadataFromNumberArray(doc.ModelFaceCount)); break;
                case NAV.eMetadata.eModelIsWatertight:                  metadata.push(this.computeMetadataFromBooleanArray(doc.ModelIsWatertight)); break;
                case NAV.eMetadata.eModelHasNormals:                    metadata.push(this.computeMetadataFromBooleanArray(doc.ModelHasNormals)); break;
                case NAV.eMetadata.eModelHasVertexColor:                metadata.push(this.computeMetadataFromBooleanArray(doc.ModelHasVertexColor)); break;
                case NAV.eMetadata.eModelHasUVSpace:                    metadata.push(this.computeMetadataFromBooleanArray(doc.ModelHasUVSpace)); break;
                case NAV.eMetadata.eModelBoundingBoxP1X:                metadata.push(this.computeMetadataFromNumberArray(doc.ModelBoundingBoxP1X)); break;
                case NAV.eMetadata.eModelBoundingBoxP1Y:                metadata.push(this.computeMetadataFromNumberArray(doc.ModelBoundingBoxP1Y)); break;
                case NAV.eMetadata.eModelBoundingBoxP1Z:                metadata.push(this.computeMetadataFromNumberArray(doc.ModelBoundingBoxP1Z)); break;
                case NAV.eMetadata.eModelBoundingBoxP2X:                metadata.push(this.computeMetadataFromNumberArray(doc.ModelBoundingBoxP2X)); break;
                case NAV.eMetadata.eModelBoundingBoxP2Y:                metadata.push(this.computeMetadataFromNumberArray(doc.ModelBoundingBoxP2Y)); break;
                case NAV.eMetadata.eModelBoundingBoxP2Z:                metadata.push(this.computeMetadataFromNumberArray(doc.ModelBoundingBoxP2Z)); break;
                case NAV.eMetadata.eModelUVMapEdgeLength:               metadata.push(this.computeMetadataFromNumberArray(doc.ModelUVMapEdgeLength)); break;
                case NAV.eMetadata.eModelChannelPosition:               metadata.push(this.computeMetadataFromNumberArray(doc.ModelChannelPosition)); break;
                case NAV.eMetadata.eModelChannelWidth:                  metadata.push(this.computeMetadataFromNumberArray(doc.ModelChannelWidth)); break;
                case NAV.eMetadata.eModelUVMapType:                     metadata.push(this.computeMetadataFromStringArray(doc.ModelUVMapType)); break;
                case NAV.eMetadata.eSceneIsOriented:                    metadata.push(this.computeMetadataFromBoolean(doc.SceneIsOriented)); break;
                case NAV.eMetadata.eSceneHasBeenQCd:                    metadata.push(this.computeMetadataFromBoolean(doc.SceneHasBeenQCd)); break;
                case NAV.eMetadata.eAssetFileName:                      metadata.push(this.computeMetadataFromStringArray(doc.AssetFileName)); break;
                case NAV.eMetadata.eAssetFilePath:                      metadata.push(this.computeMetadataFromString(doc.AssetFilePath)); break;
                case NAV.eMetadata.eAssetType:                          metadata.push(this.computeMetadataFromString(doc.AssetType)); break;
                case NAV.eMetadata.eAVUserCreator:                      metadata.push(this.computeMetadataFromString(doc.AVUserCreator)); break;
                case NAV.eMetadata.eAVStorageHash:                      metadata.push(this.computeMetadataFromString(doc.AVStorageHash)); break;
                case NAV.eMetadata.eAVStorageSize:                      metadata.push(this.computeMetadataFromNumber(doc.AVStorageSize)); break;
                case NAV.eMetadata.eAVIngested:                         metadata.push(this.computeMetadataFromBoolean(doc.AVIngested)); break;
                case NAV.eMetadata.eAVBulkIngest:                       metadata.push(this.computeMetadataFromBoolean(doc.AVBulkIngest)); break;
                case NAV.eMetadata.eStakeholderEmailAddress:            metadata.push(this.computeMetadataFromString(doc.StakeholderEmailAddress)); break;
                case NAV.eMetadata.eStakeholderPhoneNumberMobile:       metadata.push(this.computeMetadataFromString(doc.StakeholderPhoneNumberMobile)); break;
                case NAV.eMetadata.eStakeholderPhoneNumberOffice:       metadata.push(this.computeMetadataFromString(doc.StakeholderPhoneNumberOffice)); break;
                case NAV.eMetadata.eStakeholderMailingAddress:          metadata.push(this.computeMetadataFromString(doc.StakeholderMailingAddress)); break;
                    break;
            }
        }
        return metadata;
    }

    private computeMetadataFromString(value: string | undefined): string {
        return value || '';
    }

    private computeMetadataFromNumber(value: number | undefined): string {
        return (value == undefined) ? '' : value.toString();
    }

    private computeMetadataFromBoolean(value: boolean | undefined): string {
        return (value == undefined) ? '' : value ? 'true' : 'false';
    }

    private computeMetadataFromDate(value: Date | undefined): string {
        return (value == undefined) ? '' : value.toISOString().substring(0, 10);
    }

    private computeMetadataFromStringArray(values: string[] | undefined): string {
        return (values) ? values.sort().join(', ') : '';
    }

    private computeMetadataFromNumberArray(values: number[] | undefined): string {
        return (values) ? values.sort().join(', ') : '';
    }

    private computeMetadataFromBooleanArray(values: boolean[] | undefined): string {
        if (!values)
            return '';
        let hasFalse: boolean = false;
        let hasTrue: boolean = false;

        for (const value of values) {
            if (value)
                hasTrue = true;
            else
                hasFalse = true;
        }

        if (hasFalse && hasTrue)
            return 'false, true';
        if (hasFalse)
            return 'false';
        if (hasTrue)
            return 'true'; /* istanbul ignore next */
        return ''; // should never get here!
    }
    // #endregion
}
