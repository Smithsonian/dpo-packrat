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
        LOG.logger.info(`NavigationSolr.computeSolrQuery ${JSON.stringify(filter)}`);
        let SQ: solr.Query = this._solrClient._client.query();

        // search: string;                         // search string from the user
        if (filter.search)
            SQ = SQ.q(`_text_:*${filter.search}*`);
        else
            SQ = SQ.q('*:*');

        // idRoot: number;                         // idSystemObject of item for which we should get children; 0 means get everything
        if (filter.idRoot)
            SQ = SQ.matchFilter('idSystemObject', filter.idRoot);

        // objectTypes: eSystemObjectType[];       // empty array means give all appropriate children types

        // objectsToDisplay: eSystemObjectType[];  // objects to display
        SQ = await this.computeFilterParamFromSystemObjectType(SQ, filter.objectsToDisplay, 'ObjectType', '||');

        // units: number[];                        // idSystemObject[] for units filter
        // projects: number[];                     // idSystemObject[] for projects filter

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
        const filterColumns: string[] = [];
        for (const metadataColumn of filter.metadataColumns) {
            switch (metadataColumn) {
                case eMetadata.eUnitAbbreviation:   filterColumns.push('Unit'); break;
                case eMetadata.eSubjectIdentifier:  filterColumns.push('Subject'); break;
                case eMetadata.eItemName:           filterColumns.push('Item'); break;
            }
        }

        if (filterColumns.length > 0)
            SQ = SQ.fl(filterColumns);

        return SQ;
    }

    private async computeFilterParamFromSystemObjectType(SQ: solr.Query, systemObjectTypes: eSystemObjectType[], filterSchema: string, operator: string): Promise<solr.Query> {
        const filterValueList: string[] | null = await this.transformSystemObjecTypeArrayToStrings(systemObjectTypes);
        return this.computeFilterParam(SQ, filterValueList, filterSchema, operator);
    }

    private async computeFilterParamFromVocabIDArray(SQ: solr.Query, vocabFilterIDs: number[], filterSchema: string): Promise<solr.Query> {
        const filterValueList: string[] | null = await this.transformVocabIDArrayToStrings(vocabFilterIDs);
        return this.computeFilterParam(SQ, filterValueList, filterSchema, '&&');
    }

    private computeFilterParam(SQ: solr.Query, filterValueList: string[] | null, filterSchema: string, operator: string): solr.Query  {
        if (!filterValueList)
            return SQ;

        let filterParam: string = '';
        for (const filterValue of filterValueList) {
            if (filterParam)
                filterParam += ` ${operator} ${filterSchema}:`; // TODO: does this work for && and ||?
            filterParam += `${filterValue}`;
        }
        return SQ.matchFilter(filterSchema, filterParam);
    }

    private async transformSystemObjecTypeArrayToStrings(systemObjectTypes: eSystemObjectType[]): Promise<string[] | null> {
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
        const entries: NAV.NavigationResultEntry[] = [];
        const queryResult: SolrQueryResult = await this.executeSolrQueryWorker(SQ);
        if (queryResult.error)
            return { success: false, error: `Solr Query Failure: ${JSON.stringify(queryResult.error)}`, entries, metadataColumns: filter.metadataColumns };
        /*
        const entry: NAV.NavigationResultEntry = {
            idSystemObject: sID.idSystemObject,
            name: unit.Abbreviation || '<UNKNOWN>',
            objectType: eSystemObjectType.eUnit,
            idObject: unit.idUnit,
            metadata: NavigationSolr.computeMetadataForUnit(unit, filter.metadataColumns)
        };
        */
        LOG.logger.info(JSON.stringify(queryResult.result));
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
    // #endregion
}
