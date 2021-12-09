/* eslint-disable @typescript-eslint/no-explicit-any */

import solr from 'solr-client';
import { ClientRequest } from 'http';

import * as NAV from '../../interface';
import * as LOG from '../../../utils/logger';
import * as CACHE from '../../../cache';
import * as DBAPI from '../../../db';
import * as H from '../../../utils/helpers';
import { eSystemObjectType } from '../../../db';
import { SolrClient, eSolrCore } from './SolrClient';
import { IndexSolr } from './IndexSolr';
import { Vocabulary } from '../../../types/graphql';
import { eMetadata } from '../../interface';

interface SolrQueryResult {
    result: any;
    error: any;
}

export class NavigationSolr implements NAV.INavigation {
    private _solrClientPackrat: SolrClient;
    private _solrClientMeta: SolrClient;

    constructor() {
        this._solrClientPackrat = new SolrClient(null, null, eSolrCore.ePackrat);
        this._solrClientMeta = new SolrClient(null, null, eSolrCore.ePackratMeta);
    }

    // #region INavigation interface
    async getObjectChildren(filter: NAV.NavigationFilter): Promise<NAV.NavigationResult> {
        const SQ: solr.Query = await this.computeSolrNavQuery(filter);
        return await this.executeSolrNavQuery(filter, SQ);
    }

    async getMetadata(filter: NAV.MetadataFilter): Promise<NAV.MetadataResult> {
        const SQ: solr.Query = await this.computeSolrMetaQuery(filter);
        return await this.executeSolrMetaQuery(filter, SQ);
    }

    async getIndexer(): Promise<NAV.IIndexer | null> {
        return new IndexSolr();
    }
    // #endregion

    // #region Compute Nav Query
    private async computeSolrNavQuery(filter: NAV.NavigationFilter): Promise<solr.Query> {
        let SQ: solr.Query = this._solrClientPackrat._client.query().edismax();    // use edismax query parser instead of lucene default

        // For now, do not show retired assets to anyone:
        SQ = SQ.matchFilter('CommonRetired', 0);

        // search: string;                         // search string from the user -- for now, only apply to root-level queries, as well as queries of units, projects, and subjects
        if (filter.search && !filter.idRoot) {     // if we have a search string, apply it to root-level queries (i.e. with no specified filter root ID)
            SQ = SQ.q(filter.search.replace(/:/g, '\\:'));      // search text, escaping :
            if (!this.testSearchStringForArkID(filter.search))
                SQ = SQ.qf({ CommonIdentifier: 5, _text_: 1 }); // match both common identifiers, boosted, and general text, unboosted
            else
                SQ = SQ.qf({ CommonIdentifier: 5 });            // match only common identifiers
            SQ = SQ.sort({ CommonOTNumber: 'asc', score: 'desc' }); // sort by the object type enumeration, then by Solr score pseudofield
        } else {
            SQ = SQ.q('*:*');
            SQ = SQ.sort({ CommonOTNumber: 'asc', CommonName: 'asc', id: 'asc' }); // sort by the object type enumeration, then by name, then by id (idSystemObject)
            SQ = SQ.cursorMark(filter.cursorMark ? filter.cursorMark : '*'); // c.f. https://lucene.apache.org/solr/guide/6_6/pagination-of-results.html#using-cursors
        }

        // idRoot: number;                          // idSystemObject of item for which we should get children; 0 means get everything
        if (filter.idRoot) {                        // objectsToDisplay: eSystemObjectType[];  // objects to display
            // if we have no explicit object types to display, show the children
            if (!filter.objectsToDisplay || filter.objectsToDisplay.length == 0)
                SQ = SQ.matchFilter('HierarchyParentID', filter.idRoot);
            else {  // if we have explicit object types to display, show all objects of the type specified that have idRoot as an ancestor
                SQ = SQ.matchFilter('HierarchyAncestorID', filter.idRoot);
                SQ = await this.computeFilterParamFromSystemObjectType(SQ, filter.objectsToDisplay, 'CommonObjectType', '||');
            }
        } else {
            // objectTypes: eSystemObjectType[];       // empty array means give all appropriate children types
            const objectTypes: eSystemObjectType[] = filter.objectTypes;
            if (objectTypes.length == 0 && !filter.search)  // if we have no root specified, and we have no keyword search,
                objectTypes.push(eSystemObjectType.eUnit);  // then restrict children types to "Units"
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

        // dateCreatedFrom: Date | null;           // Date Created filter
        // dateCreatedTo: Date | null;             // Date Created filter
        if (filter.dateCreatedFrom || filter.dateCreatedTo) {
            let fromDate: Date | null = filter.dateCreatedFrom;
            let toDate: Date | null = filter.dateCreatedTo;
            if (fromDate && toDate && fromDate > toDate) { // swap dates if they are provided out of order
                const oldFromDate: Date = fromDate;
                fromDate = toDate;
                toDate = oldFromDate;
            }
            const fromFilter: string = H.Helpers.safeDate(fromDate) ? fromDate!.toISOString().substring(0, 10) : '*'; // eslint-disable-line @typescript-eslint/no-non-null-assertion
            const toFilter: string = H.Helpers.safeDate(toDate) ? toDate!.toISOString().substring(0, 10) : '*'; // eslint-disable-line @typescript-eslint/no-non-null-assertion
            if (fromFilter != '*' || toFilter != '*')
                SQ = SQ.rangeFilter([{ field: 'ChildrenDateCreated', start: fromFilter, end: toFilter }]);
        }

        // metadataColumns: eMetadata[];           // empty array means give no metadata
        const filterColumns: string[] = ['id', 'CommonObjectType', 'CommonidObject', 'CommonName']; // fetch standard fields // don't need ChildrenID
        for (const metadataColumn of filter.metadataColumns) {
            const filterColumn: string = eMetadata[metadataColumn];
            if (filterColumn)
                filterColumns.push(filterColumn.substring(1)); // strip of "e" prefix (eHierarchyUnit -> HierarchyUnit)
            else
                LOG.error(`NavigationSolr.computeSolrNavQuery called with unexpected metadata column ${metadataColumn}`, LOG.LS.eNAV);
        }

        if (filterColumns.length > 0)
            SQ = SQ.fl(filterColumns);

        if (filter.rows > 0)
            SQ = SQ.rows(filter.rows);
        LOG.info(`NavigationSolr.computeSolrNavQuery ${JSON.stringify(filter)}:\n${this._solrClientPackrat.solrUrl()}/select?${SQ.build()}`, LOG.LS.eNAV);
        return SQ;
    }

    /** returns true if search appears to only be an ARKID (no whitespace, starts with ark:/ or starts with http://n2t.net/ark: ) */
    private testSearchStringForArkID(search: string): boolean {
        // http://n2t.net/ark:/65665/ye38ff23cd0-11a9-4b72-a24b-fdcc267dd296
        const searchNormalized: string = search.toLowerCase();
        if (!searchNormalized.startsWith('http://n2t.net/ark:/') && !searchNormalized.startsWith('ark:/'))
            return false;
        if (search.indexOf(' ') != -1)
            return false;
        return true;
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
                LOG.error(`NavigationSolr.transformSystemObjectTypeArrayToStrings handling invalid system object type ${systemObjectType}`, LOG.LS.eNAV);
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
                LOG.error(`NavigationSolr.transformVocabIDArrayToStrings handling invalid vocabulary value ${idVocabFilter}`, LOG.LS.eNAV);
                continue;
            }
            termList.push(vocabFilter.Term);
        }

        return (termList.length > 0) ? termList : null;
    }
    // #endregion

    // #region Execute Nav Query
    private async executeSolrNavQuery(filter: NAV.NavigationFilter, SQ: solr.Query): Promise<NAV.NavigationResult> {
        let error: string = '';
        const entries: NAV.NavigationResultEntry[] = [];
        const queryResult: SolrQueryResult = await this.executeSolrQueryWorker(this._solrClientPackrat, SQ);
        if (queryResult.error) {
            error = `Solr Nav Query Failure: ${JSON.stringify(queryResult.error)}`;
            LOG.error(`NavigationSolr.executeSolrNavQuery: ${error}`, LOG.LS.eNAV);
            return { success: false, error, entries, metadataColumns: filter.metadataColumns };
        }
        if (!queryResult.result || !queryResult.result.response || queryResult.result.response.numFound === undefined ||
            (queryResult.result.response.numFound > 0 && !queryResult.result.response.docs)) {
            error = `Solr Nav Query Response malformed: ${JSON.stringify(queryResult.result)}`;
            LOG.error(`NavigationSolr.executeSolrNavQuery: ${error}`, LOG.LS.eNAV);
            return { success: false, error, entries, metadataColumns: filter.metadataColumns };
        }

        LOG.info(`NavigationSolr.executeSolrNavQuery: { numFound: ${queryResult.result.response.numFound}, ` +
            `start: ${queryResult.result.response.start}, docsCount: ${queryResult.result.response.docs.length}, ` +
            `nextCursorMark: ${queryResult.result.nextCursorMark} }`, LOG.LS.eNAV);
        // let docNumber: number = 1;
        for (const doc of queryResult.result.response.docs) {
            if (!doc.id || !doc.CommonObjectType || !doc.CommonidObject || (doc.CommonName === null)) {
                LOG.error(`NavigationSolr.executeSolrNavQuery: malformed query response document ${JSON.stringify(doc)}`, LOG.LS.eNAV);
                continue;
            }
            // LOG.info(`NavigationSolr.executeSolrNavQuery [${docNumber++}]: ${JSON.stringify(doc)}`, LOG.LS.eNAV);

            const entry: NAV.NavigationResultEntry = {
                idSystemObject: parseInt(doc.id),
                name: doc.CommonName || '<UNKNOWN>',
                objectType: DBAPI.SystemObjectNameToType(doc.CommonObjectType),
                idObject: doc.CommonidObject,
                metadata: this.computeNavMetadata(doc, filter.metadataColumns)
            };

            entries.push(entry);
        }

        let cursorMark: string | null = queryResult.result.nextCursorMark ? queryResult.result.nextCursorMark : null;
        if (cursorMark == filter.cursorMark)    // solr returns the same cursorMark as the initial query when there are no more results; if so, clear out cursorMark
            cursorMark = null;
        // LOG.info(`NavigationSolr.executeSolrQuery: ${JSON.stringify(queryResult.result)}`, LOG.LS.eNAV);
        return { success: true, entries, metadataColumns: filter.metadataColumns, cursorMark };
    }

    private computeNavMetadata(doc: any, metadataColumns: NAV.eMetadata[]): string[] {
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
                case NAV.eMetadata.eSceneEdanUUID:                      metadata.push(this.computeMetadataFromBoolean(doc.SceneEdanUUID)); break;
                case NAV.eMetadata.eScenePosedAndQCd:                   metadata.push(this.computeMetadataFromBoolean(doc.ScenePosedAndQCd)); break;
                case NAV.eMetadata.eSceneApprovedForPublication:        metadata.push(this.computeMetadataFromBoolean(doc.SceneApprovedForPublication)); break;
                case NAV.eMetadata.eSceneCountScene:                    metadata.push(this.computeMetadataFromNumber(doc.SceneCountScene)); break;
                case NAV.eMetadata.eSceneCountNode:                     metadata.push(this.computeMetadataFromNumber(doc.SceneCountNode)); break;
                case NAV.eMetadata.eSceneCountCamera:                   metadata.push(this.computeMetadataFromNumber(doc.SceneCountCamera)); break;
                case NAV.eMetadata.eSceneCountLight:                    metadata.push(this.computeMetadataFromNumber(doc.SceneCountLight)); break;
                case NAV.eMetadata.eSceneCountModel:                    metadata.push(this.computeMetadataFromNumber(doc.SceneCountModel)); break;
                case NAV.eMetadata.eSceneCountMeta:                     metadata.push(this.computeMetadataFromNumber(doc.SceneCountMeta)); break;
                case NAV.eMetadata.eSceneCountSetup:                    metadata.push(this.computeMetadataFromNumber(doc.SceneCountSetup)); break;
                case NAV.eMetadata.eSceneCountTour:                     metadata.push(this.computeMetadataFromNumber(doc.SceneCountTour)); break;
                case NAV.eMetadata.eAssetType:                          metadata.push(this.computeMetadataFromString(doc.AssetType)); break;
                case NAV.eMetadata.eAVFileName:                         metadata.push(this.computeMetadataFromStringArray(doc.AVFileName)); break;
                case NAV.eMetadata.eAVFilePath:                         metadata.push(this.computeMetadataFromString(doc.AVFilePath)); break;
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
    // #endregion

    // #region Compute Meta Query
    private async computeSolrMetaQuery(filter: NAV.MetadataFilter): Promise<solr.Query> {
        let SQ: solr.Query = this._solrClientMeta._client.query().edismax();    // use edismax query parser instead of lucene default
        SQ = SQ.q('*:*');

        // idRoot: number;                         // idSystemObject for whom to fetch metadata, either its own metadata (forAssetChildren === false) or that of its asset version childrens' metadata (forAssetChildren === true)
        // forAssetChildren: boolean;              // true means metadata of asset version children; false means metadata of idRoot. True is typically desired when fetching a set of metadata for an asset grid.
        if (!filter.forAssetChildren)
            SQ = SQ.matchFilter('id', filter.idRoot);
        else
            SQ = SQ.matchFilter('idSystemObjectParent', filter.idRoot);

        // metadataColumns: string[];              // empty array means retrieve no metadata, which is an error condition
        const filterColumns: string[] = ['id', 'idSystemObjectParent']; // fetch standard fields
        for (const metadataColumn of filter.metadataColumns)
            filterColumns.push(metadataColumn.toLowerCase() + '_v');
        SQ = SQ.fl(filterColumns);

        // request up to filter.rows entries, sorted by id desc, and use the cursor mark, if any is provided
        if (filter.rows > 0)
            SQ = SQ.rows(filter.rows);
        SQ = SQ.sort({ id: 'desc' }); // sort by id desc (idSystemObject)
        SQ = SQ.cursorMark(filter.cursorMark ? filter.cursorMark : '*'); // c.f. https://lucene.apache.org/solr/guide/6_6/pagination-of-results.html#using-cursors

        LOG.info(`NavigationSolr.computeSolrMetaQuery ${JSON.stringify(filter)}:\n${this._solrClientMeta.solrUrl()}/select?${SQ.build()}`, LOG.LS.eNAV);
        return SQ;
    }
    // #endregion

    // #region Execute Meta Query
    async executeSolrMetaQuery(filter: NAV.MetadataFilter, SQ: solr.Query): Promise<NAV.MetadataResult> {
        let error: string = '';
        const entries: NAV.MetadataResultEntry[] = [];
        const queryResult: SolrQueryResult = await this.executeSolrQueryWorker(this._solrClientMeta, SQ);
        if (queryResult.error) {
            error = `Solr Meta Query Failure: ${JSON.stringify(queryResult.error)}`;
            LOG.error(`NavigationSolr.executeSolrMetaQuery: ${error}`, LOG.LS.eNAV);
            return { success: false, error, entries, metadataColumns: filter.metadataColumns };
        }
        if (!queryResult.result || !queryResult.result.response || queryResult.result.response.numFound === undefined ||
            (queryResult.result.response.numFound > 0 && !queryResult.result.response.docs)) {
            error = `Solr Meta Query Response malformed: ${JSON.stringify(queryResult.result)}`;
            LOG.error(`NavigationSolr.executeSolrMetaQuery: ${error}`, LOG.LS.eNAV);
            return { success: false, error, entries, metadataColumns: filter.metadataColumns };
        }

        LOG.info(`NavigationSolr.executeSolrMetaQuery: { numFound: ${queryResult.result.response.numFound}, ` +
            `start: ${queryResult.result.response.start}, docsCount: ${queryResult.result.response.docs.length} }`, LOG.LS.eNAV);
        // let docNumber: number = 1;
        for (const doc of queryResult.result.response.docs) {
            if (!doc.id || !doc.idSystemObjectParent) {
                LOG.error(`NavigationSolr.executeSolrMetaQuery: malformed query response document ${JSON.stringify(doc)}`, LOG.LS.eNAV);
                continue;
            }
            // LOG.info(`NavigationSolr.executeSolrMetaQuery [${docNumber++}]: ${JSON.stringify(doc)}`, LOG.LS.eNAV);

            const entry: NAV.MetadataResultEntry = {
                idSystemObject: parseInt(doc.id),
                idSystemObjectParent: parseInt(doc.idSystemObjectParent),
                metadata: this.computeMetaMetadata(doc, filter.metadataColumns)
            };

            entries.push(entry);
        }

        let cursorMark: string | null = queryResult.result.nextCursorMark ? queryResult.result.nextCursorMark : null;
        if (cursorMark == filter.cursorMark)    // solr returns the same cursorMark as the initial query when there are no more results; if so, clear out cursorMark
            cursorMark = null;

        // LOG.info(`NavigationSolr.executeSolrMetaQuery: ${JSON.stringify(queryResult.result)}`, LOG.LS.eNAV);
        // LOG.info(`NavigationSolr.executeSolrMetaQuery: ${JSON.stringify(entries)}`, LOG.LS.eNAV);
        return { success: true, entries, metadataColumns: filter.metadataColumns, cursorMark };
    }

    private computeMetaMetadata(doc: any, metadataColumns: string[]): string [] {
        const metadata: string[] = [];
        for (const metadataColumn of metadataColumns)
            metadata.push(this.computeMetadataFromString(doc[metadataColumn + '_v']));

        return metadata;
    }
    // #endregion

    // #region Execute Nav Helpers
    private executeSolrQueryWorker(solrClient: SolrClient, SQ: solr.Query): Promise<SolrQueryResult> {
        return new Promise<any>((resolve) => {
            const request: ClientRequest = solrClient._client.search(SQ,
                function (err, obj) {
                    if (err) {
                        LOG.error('NavigationSolr.executeSolrQueryWorker', LOG.LS.eNAV, err);
                        resolve({ result: null, error: err });
                    } else
                        resolve({ result: obj });
                });
            request;
        });
    }

    private computeMetadataFromString(value: string | undefined): string {
        return value || '';
    }

    private computeMetadataFromNumber(value: number | undefined): string {
        return (value === undefined) ? '' : value.toString();
    }

    private computeMetadataFromBoolean(value: boolean | undefined): string {
        return (value === undefined) ? '' : value ? 'true' : 'false';
    }

    private computeMetadataFromDate(value: string | undefined): string {
        if (value === undefined)
            return '';
        const date: Date | null = H.Helpers.safeDate(value);
        return (!date) ? '' : date.toISOString().substring(0, 10);
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
