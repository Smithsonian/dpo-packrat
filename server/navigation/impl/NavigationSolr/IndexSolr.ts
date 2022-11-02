/* eslint-disable @typescript-eslint/no-explicit-any */
import * as NAV from '../../interface';
import * as LOG from '../../../utils/logger';
import * as H from '../../../utils/helpers';
import * as CACHE from '../../../cache';
import * as DBAPI from '../../../db';
import { ObjectGraphDataEntry } from '../../../db';
import { SolrClient, eSolrCore } from './SolrClient';
import * as COMMON from '@dpo-packrat/common';

import * as NS from 'node-schedule';

export class IndexSolr implements NAV.IIndexer {
    private objectGraphDatabase: DBAPI.ObjectGraphDatabase = new DBAPI.ObjectGraphDatabase();
    private hierarchyNameMap: Map<number, string> = new Map<number, string>(); // map of idSystemObject -> object name
    private static fullIndexUnderway: boolean = false;
    private static reindexJob: NS.Job | null = null;

    private countUnit:                  number = 0;
    private countProject:               number = 0;
    private countSubject:               number = 0;
    private countItem:                  number = 0;
    private countCaptureData:           number = 0;
    private countModel:                 number = 0;
    private countScene:                 number = 0;
    private countIntermediaryFile:      number = 0;
    private countProjectDocumentation:  number = 0;
    private countAsset:                 number = 0;
    private countAssetVersion:          number = 0;
    private countActor:                 number = 0;
    private countStakeholder:           number = 0;
    private countUnknown:               number = 0;
    private countMetadata:              number = 0;

    constructor() {
        if (IndexSolr.reindexJob === null) {
            IndexSolr.reindexJob = NS.scheduleJob('Packrat Solr Full Reindex', '0 */4 * * *', IndexSolr.fullIndexScheduled);
            LOG.info('IndexSolr reindex job scheduled', LOG.LS.eNAV);
        }
    }

    async fullIndex(profiled?: boolean | undefined): Promise<boolean> {
        if (profiled)
            return this.fullIndexProfiled();

        if (IndexSolr.fullIndexUnderway) {
            LOG.error('IndexSolr.fullIndex() already underway; exiting this additional request early', LOG.LS.eNAV);
            return false;
        }

        let retValue: boolean = false;
        try {
            IndexSolr.fullIndexUnderway = true;
            retValue = await this.fullIndexWorker();
        } catch (error) {
            LOG.error('IndexSolr.fullIndex', LOG.LS.eNAV, error);
        } finally {
            IndexSolr.fullIndexUnderway = false;
        }
        return retValue;
    }

    async indexObject(idSystemObject: number): Promise<boolean> {
        // Compute full object graph for object
        // LOG.info(`IndexSolr.indexObject(${idSystemObject}) START`, LOG.LS.eNAV);
        if (!await this.objectGraphDatabase.fetchFromSystemObject(idSystemObject))
            LOG.error(`IndexSolr.indexObject(${idSystemObject}) failed computing ObjectGraph`, LOG.LS.eNAV);

        const OGDE: ObjectGraphDataEntry | undefined = this.objectGraphDatabase.objectMap.get(idSystemObject);
        if (!OGDE) {
            LOG.error(`IndexSolr.indexObject(${idSystemObject}) failed fetching ObjectGraphDataEntry from ObjectGraphDatabase`, LOG.LS.eNAV);
            return false;
        }

        const docs: Map<number, any> = new Map<number, any>();
        const doc: any = {};

        // LOG.info(`IndexSolr.indexObject(${idSystemObject}) OGDE ${JSON.stringify(OGDE, H.Helpers.saferStringify)}`, LOG.LS.eNAV);
        if (await this.handleObject(doc, OGDE)) {
            docs.set(doc.id, doc);
            // if (ObjectGraphDataEntry.SODebugSet.has(doc.id))
            //     LOG.info(`IndexSolr.indexObject(${idSystemObject}) ${JSON.stringify(doc, H.Helpers.saferStringify)}`, LOG.LS.eNAV);

            if (!await this.handleAncestors(docs, OGDE)) // updates docs, if there are ancestors and if OGDE has children data
                return false;

            // LOG.info(`IndexSolr.indexObject(${idSystemObject}) produced ${JSON.stringify(docs, H.Helpers.saferStringify)}`, LOG.LS.eNAV);
            const solrClient: SolrClient = new SolrClient(null, null, eSolrCore.ePackrat);
            try {
                let res: H.IOResults = await solrClient.add(Array.from(docs.values()));
                if (res.success)
                    res = await solrClient.commit();
                if (!res.success)
                    LOG.error(`IndexSolr.indexObject failed: ${res.error}, docs=${JSON.stringify(docs, H.Helpers.saferStringify)}`, LOG.LS.eNAV);
            } catch (error) {
                LOG.error(`IndexSolr.indexObject(${idSystemObject}) failed, docs=${JSON.stringify(docs, H.Helpers.saferStringify)}`, LOG.LS.eNAV, error);
                return false;
            }

            LOG.info(`IndexSolr.indexObject(${idSystemObject}) succeeded, updating ${docs.size} documents`, LOG.LS.eNAV);
        } else
            LOG.error(`IndexSolr.indexObject(${idSystemObject}) failed in handleObject`, LOG.LS.eNAV);

        return true;
    }

    /** Returns count of indexed metadata, or -1 if there's an error */
    async indexMetadata(metadataList: DBAPI.Metadata[]): Promise<boolean> {
        const solrClient: SolrClient = new SolrClient(null, null, eSolrCore.ePackratMeta);
        const documentCount: number = await this.indexMetadataWorker(solrClient, metadataList, false);
        if (documentCount >= -1) {
            LOG.info(`IndexSolr.indexMetadata succeeded, updating ${documentCount} documents`, LOG.LS.eNAV);
            return true;
        } else {
            LOG.error('IndexSolr.indexMetadata failed', LOG.LS.eNAV);
            return false;
        }
    }

    private async fullIndexProfiled(): Promise<boolean> {
        if (IndexSolr.fullIndexUnderway) {
            LOG.error('IndexSolr.fullIndexProfiled() already underway; exiting this additional request early', LOG.LS.eNAV);
            return false;
        }

        LOG.info('****************************************', LOG.LS.eNAV);
        LOG.info('IndexSolr.fullIndexProfiled() starting', LOG.LS.eNAV);
        return new Promise<boolean>((resolve) => {
            const inspector = require('inspector');
            const fs = require('fs');
            const session = new inspector.Session();
            session.connect();

            session.post('Profiler.enable', async () => {
                session.post('Profiler.start', async () => {
                    let retValue: boolean = false;
                    try {
                        IndexSolr.fullIndexUnderway = true;
                        retValue = await this.fullIndexWorker();
                    } catch (error) {
                        LOG.error('IndexSolr.fullIndexProfiled', LOG.LS.eNAV, error);
                    } finally {
                        IndexSolr.fullIndexUnderway = false;
                    }

                    LOG.info('IndexSolr.fullIndexProfiled() fullIndex() complete', LOG.LS.eNAV);
                    resolve(retValue);

                    // some time later...
                    session.post('Profiler.stop', (err, { profile }) => {
                        // Write profile to disk, upload, etc.
                        if (!err) {
                            LOG.info('IndexSolr.fullIndexProfiled() writing profile', LOG.LS.eNAV);
                            fs.writeFileSync('./profile.cpuprofile', JSON.stringify(profile));
                        }
                        LOG.info('IndexSolr.fullIndexProfiled() writing profile ending', LOG.LS.eNAV);
                    });
                });
            });
        });
    }

    private async handleAncestors(docs: Map<number, any>, OGDE: ObjectGraphDataEntry): Promise<boolean> {
        const OGDEHChildrenInfo: DBAPI.ObjectGraphDataEntryHierarchy = OGDE.extractChildrenHierarchy(null);
        if (OGDEHChildrenInfo.childrenInfoEmpty())
            return true;

        for (const idSystemObject of OGDE.ancestorObjectMap.keys()) {
            let doc: any | undefined = docs.get(idSystemObject);
            if (doc === undefined) {
                doc = {};
                docs.set(idSystemObject, doc);
            }
            // supply all required fields
            const oID: DBAPI.ObjectIDAndType | undefined = await CACHE.SystemObjectCache.getObjectFromSystem(idSystemObject);
            if (!oID) {
                LOG.error(`IndexSolr.handleAncestors unable to extract system object info for ${idSystemObject}`, LOG.LS.eNAV);
                continue;
            }

            doc.id                  = idSystemObject;
            doc.CommonObjectType    = DBAPI.SystemObjectTypeToName(oID.eObjectType as number);
            doc.CommonOTNumber      = oID.eObjectType;
            doc.CommonidObject      = oID.idObject;
            await this.extractCommonChildrenFields(doc, OGDEHChildrenInfo, false); // false means we're updating
            // LOG.info(`IndexSolr.handleAncestors prepping to update ${JSON.stringify(doc)}`, LOG.LS.eNAV);
        }
        return true;
    }

    private static async fullIndexScheduled(): Promise<boolean> {
        LOG.info('IndexSolr reindex job starting', LOG.LS.eNAV);
        const IS: IndexSolr = new IndexSolr();
        return IS.fullIndex();
    }

    private async fullIndexWorker(): Promise<boolean> {
        if (!await this.fullIndexWorkerOG())
            return false;

        return await this.fullIndexWorkerMeta();
    }

    private async fullIndexWorkerOG(): Promise<boolean> {
        const solrClient: SolrClient = new SolrClient(null, null, eSolrCore.ePackrat);

        if (!(await this.objectGraphDatabase.fetch())) {
            LOG.error('IndexSolr.fullIndexWorkerOG failed on ObjectGraphDatabase.fetch()', LOG.LS.eNAV);
            return false;
        }

        let documentCount: number = 0;
        let docs: any[] = [];
        for (const objectGraphDataEntry of this.objectGraphDatabase.objectMap.values()) {
            const doc: any = {};
            if (await this.handleObject(doc, objectGraphDataEntry)) {
                docs.push(doc);

                if (docs.length >= 1000) {
                    documentCount = await this.addDocumentsToSolr(solrClient, docs, documentCount, 'fullIndexWorkerOG');
                    if (documentCount === -1)
                        return false;
                    docs = [];
                }
            } else
                LOG.error('IndexSolr.fullIndexWorkerOG failed in handleObject', LOG.LS.eNAV);
        }

        if (docs.length > 0) {
            documentCount = await this.addDocumentsToSolr(solrClient, docs, documentCount, 'fullIndexWorkerOG');
            if (documentCount === -1)
                return false;
        }

        LOG.info(`IndexSolr.fullIndex indexed units: ${this.countUnit}`, LOG.LS.eNAV);
        LOG.info(`IndexSolr.fullIndex indexed projects: ${this.countProject}`, LOG.LS.eNAV);
        LOG.info(`IndexSolr.fullIndex indexed subjects: ${this.countSubject}`, LOG.LS.eNAV);
        LOG.info(`IndexSolr.fullIndex indexed items: ${this.countItem}`, LOG.LS.eNAV);
        LOG.info(`IndexSolr.fullIndex indexed capture data: ${this.countCaptureData}`, LOG.LS.eNAV);
        LOG.info(`IndexSolr.fullIndex indexed models: ${this.countModel}`, LOG.LS.eNAV);
        LOG.info(`IndexSolr.fullIndex indexed scenes: ${this.countScene}`, LOG.LS.eNAV);
        LOG.info(`IndexSolr.fullIndex indexed intermediary files: ${this.countIntermediaryFile}`, LOG.LS.eNAV);
        LOG.info(`IndexSolr.fullIndex indexed project documentation: ${this.countProjectDocumentation}`, LOG.LS.eNAV);
        LOG.info(`IndexSolr.fullIndex indexed assets: ${this.countAsset}`, LOG.LS.eNAV);
        LOG.info(`IndexSolr.fullIndex indexed asset versions: ${this.countAssetVersion}`, LOG.LS.eNAV);
        LOG.info(`IndexSolr.fullIndex indexed actors: ${this.countActor}`, LOG.LS.eNAV);
        LOG.info(`IndexSolr.fullIndex indexed stakeholders: ${this.countStakeholder}`, LOG.LS.eNAV);
        LOG.info(`IndexSolr.fullIndex indexed unknown: ${this.countUnknown}`, LOG.LS.eNAV);
        LOG.info(`IndexSolr.fullIndex committed ${documentCount} total documents`, LOG.LS.eNAV);
        return true;
    }

    private async fullIndexWorkerMeta(): Promise<boolean> {
        const solrClient: SolrClient = new SolrClient(null, null, eSolrCore.ePackratMeta);

        let result: boolean = true;
        let documentCount: number = 0;
        let idMetadataLast: number = 0;
        const createdSystemObjectSet: Set<number> = new Set<number>(); // system object IDs that have been "created"

        while (true) { // eslint-disable-line no-constant-condition
            const metadataList: DBAPI.Metadata[] | null = await DBAPI.Metadata.fetchAllByPage(idMetadataLast, 25000);
            if (!metadataList) {
                LOG.error('IndexSolr.fullIndexWorkerMeta could not fetch metadata', LOG.LS.eNAV);
                return false;
            }
            if (metadataList.length <= 0)
                break;

            documentCount = await this.indexMetadataWorker(solrClient, metadataList, true, createdSystemObjectSet, documentCount);
            if (documentCount === -1) {
                documentCount = 0;
                result = false;
            }
            idMetadataLast = metadataList[metadataList.length - 1].idMetadata;
        }

        LOG.info(`IndexSolr.fullIndex indexed metadata: ${this.countMetadata}`, LOG.LS.eNAV);
        return result;
    }

    private async indexMetadataWorker(solrClient: SolrClient, metadataList: DBAPI.Metadata[], create: boolean,
        createdSystemObjectSet?: Set<number> | undefined, documentCount?: number | undefined): Promise<number> {
        documentCount = documentCount ?? 0;
        if (metadataList.length <= 0)
            return documentCount;

        const metadataMap: Map<number, DBAPI.Metadata[]> = new Map<number, DBAPI.Metadata[]>(); // map of idSystemObject -> array of Metadata
        for (const metadata of metadataList) {
            if (!metadata.idSystemObject)
                continue;
            let metadataList: DBAPI.Metadata[] | undefined = metadataMap.get(metadata.idSystemObject);
            if (!metadataList) {
                metadataList = [];
                metadataMap.set(metadata.idSystemObject, metadataList);
            }
            metadataList.push(metadata);
        }

        const docs: any[] = [];
        for (const [idSystemObject, metadataList] of metadataMap) {
            const doc: any = {};
            const textGrabAll: string[] = [];
            let idSystemObjectParent: number = idSystemObject;

            // determine if we're creating this doc or adding to an existing one (created in past iterations through this function)
            let createDoc: boolean = create;
            if (createdSystemObjectSet) {
                if (createdSystemObjectSet.has(idSystemObject))
                    createDoc = false;
                else
                    createdSystemObjectSet.add(idSystemObject);
            }

            doc.id = idSystemObject;
            for (const metadata of metadataList) {
                if (metadata.idSystemObjectParent)
                    idSystemObjectParent = metadata.idSystemObjectParent;

                const key: string = `${metadata.Name.toLowerCase()}_v`;
                if (metadata.ValueShort) {
                    doc[key] = createDoc ? metadata.ValueShort : { 'set': metadata.ValueShort };
                    textGrabAll.push(metadata.ValueShort);
                } else if (metadata.ValueExtended) {
                    const value: string = metadata.ValueExtended.substring(0, 4096);
                    doc[key] = createDoc ? value : { 'set': value };
                    textGrabAll.push(value);
                }

                if (metadata.idVMetadataSource) {
                    const metadataSourceV: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.vocabulary(metadata.idVMetadataSource);
                    if (metadataSourceV)
                        doc.MetadataSource = createDoc ? metadataSourceV.Term : { 'set': metadataSourceV.Term };
                    else
                        LOG.error(`IndexSolr.fullIndexWorkerMeta could not fetch metadata source ${metadata.idVMetadataSource}`, LOG.LS.eNAV);
                }
            }
            doc.idSystemObjectParent = createDoc ? idSystemObjectParent : { 'set': idSystemObjectParent };
            if (!textGrabAll.length)
                textGrabAll.push('');
            doc._text_ = createDoc ? textGrabAll : { 'set': textGrabAll };

            docs.push(doc);
            this.countMetadata++;
        }

        return await this.addDocumentsToSolr(solrClient, docs, documentCount, 'indexObjectMetadata');
    }

    private async addDocumentsToSolr(solrClient: SolrClient, docs: any[], documentCount: number, callerForLog: string): Promise<number> {
        try {
            let res: H.IOResults = await solrClient.add(docs);
            if (res.success)
                res = await solrClient.commit();
            if (!res.success)
                LOG.error(`IndexSolr.${callerForLog} failed: ${res.error}`, LOG.LS.eNAV);
        } catch (error) {
            LOG.error(`IndexSolr.${callerForLog} failed`, LOG.LS.eNAV, error);
            return -1;
        }
        documentCount += docs.length;
        LOG.info(`IndexSolr.${callerForLog} committed ${documentCount} total documents to ${solrClient.core()}`, LOG.LS.eNAV);
        return documentCount;
    }

    private async handleObject(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<boolean> {
        await this.extractCommonFields(doc, objectGraphDataEntry);

        switch (objectGraphDataEntry.systemObjectIDType.eObjectType) {
            case COMMON.eSystemObjectType.eUnit:                   return await this.handleUnit(doc, objectGraphDataEntry);
            case COMMON.eSystemObjectType.eProject:                return await this.handleProject(doc, objectGraphDataEntry);
            case COMMON.eSystemObjectType.eSubject:                return await this.handleSubject(doc, objectGraphDataEntry);
            case COMMON.eSystemObjectType.eItem:                   return await this.handleItem(doc, objectGraphDataEntry);
            case COMMON.eSystemObjectType.eCaptureData:            return await this.handleCaptureData(doc, objectGraphDataEntry);
            case COMMON.eSystemObjectType.eModel:                  return await this.handleModel(doc, objectGraphDataEntry);
            case COMMON.eSystemObjectType.eScene:                  return await this.handleScene(doc, objectGraphDataEntry);
            case COMMON.eSystemObjectType.eIntermediaryFile:       return await this.handleIntermediaryFile(doc, objectGraphDataEntry);
            case COMMON.eSystemObjectType.eProjectDocumentation:   return await this.handleProjectDocumentation(doc, objectGraphDataEntry);
            case COMMON.eSystemObjectType.eAsset:                  return await this.handleAsset(doc, objectGraphDataEntry);
            case COMMON.eSystemObjectType.eAssetVersion:           return await this.handleAssetVersion(doc, objectGraphDataEntry);
            case COMMON.eSystemObjectType.eActor:                  return await this.handleActor(doc, objectGraphDataEntry);
            case COMMON.eSystemObjectType.eStakeholder:            return await this.handleStakeholder(doc, objectGraphDataEntry);

            default:
            case COMMON.eSystemObjectType.eUnknown:                return await this.handleUnknown(doc, objectGraphDataEntry);
        }
    }

    private async extractCommonFields(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<void> {
        const OGDEH: DBAPI.ObjectGraphDataEntryHierarchy = objectGraphDataEntry.extractHierarchy();

        doc.id = OGDEH.idSystemObject;
        doc.CommonRetired = OGDEH.retired;
        doc.CommonObjectType = DBAPI.SystemObjectTypeToName(OGDEH.eObjectType);
        doc.CommonOTNumber = OGDEH.eObjectType;
        doc.CommonidObject = OGDEH.idObject;
        doc.CommonIdentifier = await this.computeIdentifiers(objectGraphDataEntry.systemObjectIDType.idSystemObject);

        doc.HierarchyParentID = OGDEH.parents.length == 0 ? [0] : OGDEH.parents;
        doc.HierarchyChildrenID = OGDEH.children.length == 0 ? [0] : OGDEH.children;
        doc.HierarchyAncestorID = OGDEH.ancestors.length == 0 ? [0] : OGDEH.ancestors;

        let nameArray: string[] = [];
        let idArray: number[] = [];

        for (const objInfo of OGDEH.units) {
            let name: string | undefined = this.hierarchyNameMap.get(objInfo.idSystemObject);
            if (!name) {
                const unit: DBAPI.Unit | null = await DBAPI.Unit.fetch(objInfo.idObject);
                if (unit) {
                    name = unit.Abbreviation || 'Unknown';
                    this.hierarchyNameMap.set(objInfo.idSystemObject, name);
                } else {
                    name = 'Unknown';
                    LOG.error(`Unable to compute Unit for ${JSON.stringify(objInfo)}`, LOG.LS.eNAV);
                }
            }
            nameArray.push(name);
            idArray.push(objInfo.idSystemObject);
        }
        if (nameArray.length > 0) {
            doc.HierarchyUnit = nameArray;
            doc.HierarchyUnitID = idArray;
            nameArray = [];
            idArray = [];
        }

        for (const objInfo of OGDEH.projects) {
            let name: string | undefined = this.hierarchyNameMap.get(objInfo.idSystemObject);
            if (!name) {
                const project: DBAPI.Project | null = await DBAPI.Project.fetch(objInfo.idObject);
                if (project) {
                    name = project.Name;
                    this.hierarchyNameMap.set(objInfo.idSystemObject, name);
                } else {
                    name = 'Unknown';
                    LOG.error(`Unable to compute Project for ${JSON.stringify(objInfo)}`, LOG.LS.eNAV);
                }
            }
            nameArray.push(name);
            idArray.push(objInfo.idSystemObject);
        }
        if (nameArray.length > 0) {
            doc.HierarchyProject = nameArray;
            doc.HierarchyProjectID = idArray;
            nameArray = [];
            idArray = [];
        }

        for (const objInfo of OGDEH.subjects) {
            let name: string | undefined = this.hierarchyNameMap.get(objInfo.idSystemObject);
            if (!name) {
                const subject: DBAPI.Subject | null = await DBAPI.Subject.fetch(objInfo.idObject);
                if (subject) {
                    name = subject.Name;
                    this.hierarchyNameMap.set(objInfo.idSystemObject, name);
                } else {
                    name = 'Unknown';
                    LOG.error(`Unable to compute Subject for ${JSON.stringify(objInfo)}`, LOG.LS.eNAV);
                }
            }
            nameArray.push(name);
            idArray.push(objInfo.idSystemObject);
        }
        if (nameArray.length > 0) {
            doc.HierarchySubject = nameArray;
            doc.HierarchySubjectID = idArray;
            nameArray = [];
            idArray = [];
        }

        for (const objInfo of OGDEH.items) {
            let name: string | undefined = this.hierarchyNameMap.get(objInfo.idSystemObject);
            if (!name) {
                const item: DBAPI.Item | null = await DBAPI.Item.fetch(objInfo.idObject);
                if (item) {
                    name = item.Name;
                    this.hierarchyNameMap.set(objInfo.idSystemObject, name);
                } else {
                    name = 'Unknown';
                    LOG.error(`Unable to compute Item for ${JSON.stringify(objInfo)}`, LOG.LS.eNAV);
                }
            }
            nameArray.push(name);
            idArray.push(objInfo.idSystemObject);
        }
        if (nameArray.length > 0) {
            doc.HierarchyItem = nameArray;
            doc.HierarchyItemID = idArray;
            nameArray = [];
            idArray = [];
        }

        await this.extractCommonChildrenFields(doc, OGDEH, true);
    }

    private async extractCommonChildrenFields(doc: any, OGDEH: DBAPI.ObjectGraphDataEntryHierarchy, create: boolean): Promise<void> {
        const ChildrenObjectTypes: string[] = [];
        for (const childrenObjectType of OGDEH.childrenObjectTypes)
            ChildrenObjectTypes.push(DBAPI.SystemObjectTypeToName(childrenObjectType));
        if (ChildrenObjectTypes.length > 0)
            doc.ChildrenObjectTypes = create ? ChildrenObjectTypes : { 'add': ChildrenObjectTypes };

        let VocabList: string[] = [];
        VocabList = await this.computeVocabularyTerms(OGDEH.childrenCaptureMethods);
        if (VocabList.length > 0) {
            doc.ChildrenCaptureMethods = create ?  VocabList : { 'add': VocabList };
            VocabList = [];
        }

        VocabList = await this.computeVocabularyTerms(OGDEH.childrenVariantTypes);
        if (VocabList.length > 0) {
            doc.ChildrenVariantTypes = create ?  VocabList : { 'add': VocabList };
            VocabList = [];
        }

        VocabList = await this.computeVocabularyTerms(OGDEH.childrenModelPurposes);
        if (VocabList.length > 0) {
            doc.ChildrenModelPurposes = create ?  VocabList : { 'add': VocabList };
            VocabList = [];
        }

        VocabList = await this.computeVocabularyTerms(OGDEH.childrenModelFileTypes);
        if (VocabList.length > 0) {
            doc.ChildrenModelFileTypes = create ?  VocabList : { 'add': VocabList };
            VocabList = [];
        }

        if (OGDEH.childrenDateCreated.length > 0)
            doc.ChildrenDateCreated = create ? OGDEH.childrenDateCreated : { 'add': OGDEH.childrenDateCreated };

        // LOG.info(`IndexSolr.extractCommonChildrenFields doc=${JSON.stringify(doc, H.Helpers.saferStringify)}, OGDEH=${JSON.stringify(OGDEH, H.Helpers.saferStringify)}`, LOG.LS.eNAV);
    }

    private async computeVocabulary(idVocabulary: number | null): Promise<string | null> {
        const vocab: DBAPI.Vocabulary | undefined = idVocabulary ? await CACHE.VocabularyCache.vocabulary(idVocabulary) : undefined;
        return vocab ? vocab.Term : null;
    }

    private async computeVocabularyTerms(IDs: number[]): Promise<string[]> {
        const retValue: string[] = [];
        for (const ID of IDs) {
            const vocab: string | null = await this.computeVocabulary(ID);
            if (vocab) retValue.push(vocab);
        }
        return retValue;
    }

    private async handleUnit(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<boolean> {
        const unit: DBAPI.Unit | null = await DBAPI.Unit.fetch(objectGraphDataEntry.systemObjectIDType.idObject);
        if (!unit) {
            LOG.error(`IndexSolr.handleUnit failed to compute unit from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`, LOG.LS.eNAV);
            return false;
        }
        doc.CommonName = unit.Name;
        doc.UnitAbbreviation = unit.Abbreviation;
        doc.UnitARKPrefix = unit.ARKPrefix;
        this.countUnit++;
        return true;
    }

    private async handleProject(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<boolean> {
        const project: DBAPI.Project | null = await DBAPI.Project.fetch(objectGraphDataEntry.systemObjectIDType.idObject);
        if (!project) {
            LOG.error(`IndexSolr.handleProject failed to compute project from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`, LOG.LS.eNAV);
            return false;
        }
        doc.CommonName = project.Name;
        doc.CommonDescription = project.Description;
        this.countProject++;
        return true;
    }

    private async handleSubject(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<boolean> {
        const subject: DBAPI.Subject | null = await DBAPI.Subject.fetch(objectGraphDataEntry.systemObjectIDType.idObject);
        if (!subject) {
            LOG.error(`IndexSolr.handleSubject failed to compute subject from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`, LOG.LS.eNAV);
            return false;
        }

        doc.CommonName = subject.Name;
        if (subject.idIdentifierPreferred) {
            const ID: DBAPI.Identifier | null = await DBAPI.Identifier.fetch(subject.idIdentifierPreferred);
            if (ID)
                doc.SubjectIdentifierPreferred = ID.IdentifierValue;
        }
        this.countSubject++;
        return true;
    }

    private async handleItem(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<boolean> {
        const item: DBAPI.Item | null = await DBAPI.Item.fetch(objectGraphDataEntry.systemObjectIDType.idObject);
        if (!item) {
            LOG.error(`IndexSolr.handleItem failed to compute item from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`, LOG.LS.eNAV);
            return false;
        }
        doc.CommonName = item.Name;
        doc.ItemEntireSubject = item.EntireSubject;
        this.countItem++;
        return true;
    }

    private async handleCaptureData(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<boolean> {
        const captureData: DBAPI.CaptureData | null = await DBAPI.CaptureData.fetch(objectGraphDataEntry.systemObjectIDType.idObject);
        if (!captureData) {
            LOG.error(`IndexSolr.handleCaptureData failed to compute capture data from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`, LOG.LS.eNAV);
            return false;
        }
        const captureDataPhotos: DBAPI.CaptureDataPhoto[] | null = await DBAPI.CaptureDataPhoto.fetchFromCaptureData(captureData.idCaptureData);
        const captureDataPhoto: DBAPI.CaptureDataPhoto | null = (captureDataPhotos && captureDataPhotos.length > 0) ? captureDataPhotos[0] : null;

        doc.CommonName = captureData.Name;
        doc.CommonDescription = captureData.Description;
        doc.CommonDateCreated = captureData.DateCaptured;
        doc.ChildrenDateCreated = [captureData.DateCaptured];
        doc.CDCaptureMethod = await this.lookupVocabulary(captureData.idVCaptureMethod);
        if (captureDataPhoto) {
            doc.CDDatasetType = await this.lookupVocabulary(captureDataPhoto.idVCaptureDatasetType);
            doc.CDDatasetFieldID = captureDataPhoto.CaptureDatasetFieldID;
            doc.CDItemPositionType = await this.lookupVocabulary(captureDataPhoto.idVItemPositionType);
            doc.CDItemPositionFieldID = captureDataPhoto.ItemPositionFieldID;
            doc.CDItemArrangementFieldID = captureDataPhoto.ItemArrangementFieldID;
            doc.CDFocusType = await this.lookupVocabulary(captureDataPhoto.idVFocusType);
            doc.CDLightSourceType = await this.lookupVocabulary(captureDataPhoto.idVLightSourceType);
            doc.CDBackgroundRemovalMethod = await this.lookupVocabulary(captureDataPhoto.idVBackgroundRemovalMethod);
            doc.CDClusterType = await this.lookupVocabulary(captureDataPhoto.idVClusterType);
            doc.CDClusterGeometryFieldID = captureDataPhoto.ClusterGeometryFieldID;
            doc.CDCameraSettingsUniform = captureDataPhoto.CameraSettingsUniform;
        }

        const captureDataFiles: DBAPI.CaptureDataFile[] | null = await DBAPI.CaptureDataFile.fetchFromCaptureData(captureData.idCaptureData);
        if (captureDataFiles) {
            const variantTypeSet: Set<string> = new Set<string>();
            for (const captureDataFile of captureDataFiles) {
                const variantType: string | null = await this.lookupVocabulary(captureDataFile.idVVariantType);
                if (variantType)
                    variantTypeSet.add(variantType);
            }
            if (variantTypeSet.size > 0)
                doc.CDVariantType = [...variantTypeSet];
        }
        this.countCaptureData++;
        return true;
    }

    private async handleModel(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<boolean> {
        const modelConstellation: DBAPI.ModelConstellation | null = await DBAPI.ModelConstellation.fetch(objectGraphDataEntry.systemObjectIDType.idObject);
        if (!modelConstellation) {
            LOG.error(`IndexSolr.handleModel failed to compute ModelConstellation from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`, LOG.LS.eNAV);
            return false;
        }
        const model: DBAPI.Model = modelConstellation.Model;

        doc.CommonName = model.Name;
        doc.CommonDateCreated = model.DateCreated;
        doc.ChildrenDateCreated = [model.DateCreated];

        doc.ModelCreationMethod = await this.computeVocabulary(model.idVCreationMethod);
        doc.ModelModality = await this.computeVocabulary(model.idVModality);
        doc.ModelUnits = await this.computeVocabulary(model.idVUnits);
        doc.ModelPurpose = await this.computeVocabulary(model.idVPurpose);
        doc.ModelFileType = await this.computeVocabulary(model.idVFileType);

        doc.ModelCountAnimations = model.CountAnimations;
        doc.ModelCountCameras = model.CountCameras;
        doc.ModelCountFaces = model.CountFaces;
        doc.ModelCountTriangles = model.CountTriangles;
        doc.ModelCountLights = model.CountLights;
        doc.ModelCountMaterials = model.CountMaterials;
        doc.ModelCountMeshes = model.CountMeshes;
        doc.ModelCountVertices = model.CountVertices;
        doc.ModelCountEmbeddedTextures = model.CountEmbeddedTextures;
        doc.ModelCountLinkedTextures = model.CountLinkedTextures;
        doc.ModelFileEncoding = model.FileEncoding;
        doc.ModelIsDracoCompressed = model.IsDracoCompressed;

        const modelMaterialNameSet: Set<string> = new Set<string>();
        const modelMaterialChannelTypeSet: Set<string> = new Set<string>();
        const modelMaterialChannelTypeOtherSet: Set<string> = new Set<string>();
        const modelMaterialChannelUVMapEmbeddedSet: Set<boolean> = new Set<boolean>();
        const modelMaterialChannelPositionSet: Set<number> = new Set<number>();
        const modelMaterialChannelWidthSet: Set<number> = new Set<number>();
        const modelMaterialChannelValuesSet: Set<string> = new Set<string>();
        const modelMaterialChannelAdditionalAttributesSet: Set<string> = new Set<string>();
        const modelMaterialUVMapEdgeLengthSet: Set<number> = new Set<number>();
        const modelObjectBoundingBoxP1XSet: Set<number> = new Set<number>();
        const modelObjectBoundingBoxP1YSet: Set<number> = new Set<number>();
        const modelObjectBoundingBoxP1ZSet: Set<number> = new Set<number>();
        const modelObjectBoundingBoxP2XSet: Set<number> = new Set<number>();
        const modelObjectBoundingBoxP2YSet: Set<number> = new Set<number>();
        const modelObjectBoundingBoxP2ZSet: Set<number> = new Set<number>();
        const modelObjectCountVerticesSet: Set<number> = new Set<number>();
        const modelObjectCountFacesSet: Set<number> = new Set<number>();
        const modelObjectCountTrianglesSet: Set<number> = new Set<number>();
        const modelObjectCountColorChannelsSet: Set<number> = new Set<number>();
        const modelObjectCountTextureCoordinateChannelsSet: Set<number> = new Set<number>();
        const modelObjectHasBonesSet: Set<boolean> = new Set<boolean>();
        const modelObjectHasFaceNormalsSet: Set<boolean> = new Set<boolean>();
        const modelObjectHasTangentsSet: Set<boolean> = new Set<boolean>();
        const modelObjectHasTextureCoordinatesSet: Set<boolean> = new Set<boolean>();
        const modelObjectHasVertexNormalsSet: Set<boolean> = new Set<boolean>();
        const modelObjectHasVertexColorSet: Set<boolean> = new Set<boolean>();
        const modelObjectIsTwoManifoldUnboundedSet: Set<boolean> = new Set<boolean>();
        const modelObjectIsTwoManifoldBoundedSet: Set<boolean> = new Set<boolean>();
        const modelObjectIsWatertightSet: Set<boolean> = new Set<boolean>();
        const modelObjectSelfIntersectingSet: Set<boolean> = new Set<boolean>();

        if (modelConstellation.ModelMaterials) {
            for (const modelMaterial of modelConstellation.ModelMaterials) {
                if (modelMaterial.Name)
                    modelMaterialNameSet.add(modelMaterial.Name);
            }
        }

        if (modelConstellation.ModelMaterialChannels) {
            for (const modelMaterialChannel of modelConstellation.ModelMaterialChannels) {
                if (modelMaterialChannel.idVMaterialType) {
                    const materialType = await this.computeVocabulary(modelMaterialChannel.idVMaterialType);
                    if (materialType)
                        modelMaterialChannelTypeSet.add(materialType);
                }
                if (modelMaterialChannel.MaterialTypeOther) modelMaterialChannelTypeOtherSet.add(modelMaterialChannel.MaterialTypeOther);
                if (modelMaterialChannel.UVMapEmbedded !== null) modelMaterialChannelUVMapEmbeddedSet.add(modelMaterialChannel.UVMapEmbedded);
                if (modelMaterialChannel.ChannelPosition) modelMaterialChannelPositionSet.add(modelMaterialChannel.ChannelPosition);
                if (modelMaterialChannel.ChannelWidth) modelMaterialChannelWidthSet.add(modelMaterialChannel.ChannelWidth);

                let channelValue: string = [modelMaterialChannel.Scalar1, modelMaterialChannel.Scalar2,
                    modelMaterialChannel.Scalar3, modelMaterialChannel.Scalar4].join(', ');
                if (channelValue.indexOf(',') >= 0)
                    channelValue = `(${channelValue})`;
                if (channelValue) modelMaterialChannelValuesSet.add(channelValue);

                if (modelMaterialChannel.AdditionalAttributes) modelMaterialChannelAdditionalAttributesSet.add(modelMaterialChannel.AdditionalAttributes);
            }
        }

        if (modelConstellation.ModelMaterialUVMaps) {
            for (const modelMaterialUVMap of modelConstellation.ModelMaterialUVMaps)
                modelMaterialUVMapEdgeLengthSet.add(modelMaterialUVMap.UVMapEdgeLength);
        }

        const modelObjectsList: DBAPI.ModelObject[] = [];
        if (modelConstellation.ModelObjects)
            modelObjectsList.push(...modelConstellation.ModelObjects);
        for (const modelObject of modelObjectsList) {
            if (modelObject.BoundingBoxP1X) modelObjectBoundingBoxP1XSet.add(modelObject.BoundingBoxP1X);
            if (modelObject.BoundingBoxP1Y) modelObjectBoundingBoxP1YSet.add(modelObject.BoundingBoxP1Y);
            if (modelObject.BoundingBoxP1Z) modelObjectBoundingBoxP1ZSet.add(modelObject.BoundingBoxP1Z);
            if (modelObject.BoundingBoxP2X) modelObjectBoundingBoxP2XSet.add(modelObject.BoundingBoxP2X);
            if (modelObject.BoundingBoxP2Y) modelObjectBoundingBoxP2YSet.add(modelObject.BoundingBoxP2Y);
            if (modelObject.BoundingBoxP2Z) modelObjectBoundingBoxP2ZSet.add(modelObject.BoundingBoxP2Z);
            if (modelObject.CountVertices) modelObjectCountVerticesSet.add(modelObject.CountVertices);
            if (modelObject.CountFaces) modelObjectCountFacesSet.add(modelObject.CountFaces);
            if (modelObject.CountTriangles) modelObjectCountTrianglesSet.add(modelObject.CountTriangles);
            if (modelObject.CountColorChannels) modelObjectCountColorChannelsSet.add(modelObject.CountColorChannels);
            if (modelObject.CountTextureCoordinateChannels) modelObjectCountTextureCoordinateChannelsSet.add(modelObject.CountTextureCoordinateChannels);
            if (modelObject.HasBones) modelObjectHasBonesSet.add(modelObject.HasBones);
            if (modelObject.HasFaceNormals) modelObjectHasFaceNormalsSet.add(modelObject.HasFaceNormals);
            if (modelObject.HasTangents) modelObjectHasTangentsSet.add(modelObject.HasTangents);
            if (modelObject.HasTextureCoordinates) modelObjectHasTextureCoordinatesSet.add(modelObject.HasTextureCoordinates);
            if (modelObject.HasVertexNormals) modelObjectHasVertexNormalsSet.add(modelObject.HasVertexNormals);
            if (modelObject.HasVertexColor) modelObjectHasVertexColorSet.add(modelObject.HasVertexColor);
            if (modelObject.IsTwoManifoldUnbounded) modelObjectIsTwoManifoldUnboundedSet.add(modelObject.IsTwoManifoldUnbounded);
            if (modelObject.IsTwoManifoldBounded) modelObjectIsTwoManifoldBoundedSet.add(modelObject.IsTwoManifoldBounded);
            if (modelObject.IsWatertight) modelObjectIsWatertightSet.add(modelObject.IsWatertight);
            if (modelObject.SelfIntersecting) modelObjectSelfIntersectingSet.add(modelObject.SelfIntersecting);

        }
        doc.ModelMaterialName = [...modelMaterialNameSet];
        doc.ModelMaterialChannelType = [...modelMaterialChannelTypeSet];
        doc.ModelMaterialChannelTypeOther = [...modelMaterialChannelTypeOtherSet];
        doc.ModelMaterialChannelUVMapEmbedded = [...modelMaterialChannelUVMapEmbeddedSet];
        doc.ModelMaterialChannelPosition = [...modelMaterialChannelPositionSet];
        doc.ModelMaterialChannelWidth = [...modelMaterialChannelWidthSet];
        doc.ModelMaterialChannelValues = [...modelMaterialChannelValuesSet];
        doc.ModelMaterialChannelAdditionalAttributes = [...modelMaterialChannelAdditionalAttributesSet];
        doc.ModelMaterialUVMapEdgeLength = [...modelMaterialUVMapEdgeLengthSet];
        doc.ModelObjectBoundingBoxP1X = [...modelObjectBoundingBoxP1XSet];
        doc.ModelObjectBoundingBoxP1Y = [...modelObjectBoundingBoxP1YSet];
        doc.ModelObjectBoundingBoxP1Z = [...modelObjectBoundingBoxP1ZSet];
        doc.ModelObjectBoundingBoxP2X = [...modelObjectBoundingBoxP2XSet];
        doc.ModelObjectBoundingBoxP2Y = [...modelObjectBoundingBoxP2YSet];
        doc.ModelObjectBoundingBoxP2Z = [...modelObjectBoundingBoxP2ZSet];
        doc.ModelObjectCountVertices = [...modelObjectCountVerticesSet];
        doc.ModelObjectCountFaces = [...modelObjectCountFacesSet];
        doc.ModelObjectCountTriangles = [...modelObjectCountTrianglesSet];
        doc.ModelObjectCountColorChannels = [...modelObjectCountColorChannelsSet];
        doc.ModelObjectCountTextureCoordinateChannels = [...modelObjectCountTextureCoordinateChannelsSet];
        doc.ModelObjectHasBones = [...modelObjectHasBonesSet];
        doc.ModelObjectHasFaceNormals = [...modelObjectHasFaceNormalsSet];
        doc.ModelObjectHasTangents = [...modelObjectHasTangentsSet];
        doc.ModelObjectHasTextureCoordinates = [...modelObjectHasTextureCoordinatesSet];
        doc.ModelObjectHasVertexNormals = [...modelObjectHasVertexNormalsSet];
        doc.ModelObjectHasVertexColor = [...modelObjectHasVertexColorSet];
        doc.ModelObjectIsTwoManifoldUnbounded = [...modelObjectIsTwoManifoldUnboundedSet];
        doc.ModelObjectIsTwoManifoldBounded = [...modelObjectIsTwoManifoldBoundedSet];
        doc.ModelObjectIsWatertight = [...modelObjectIsWatertightSet];
        doc.ModelObjectSelfIntersecting = [...modelObjectSelfIntersectingSet];

        // TODO: should we turn multivalued metrics and bounding boxes into single valued attributes, and combine the multiple values in a meaningful way (e.g. add point and face counts, combine bounding boxes)
        this.countModel++;
        return true;
    }

    private async handleScene(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<boolean> {
        const scene: DBAPI.Scene | null = await DBAPI.Scene.fetch(objectGraphDataEntry.systemObjectIDType.idObject);
        if (!scene) {
            LOG.error(`IndexSolr.handleScene failed to compute scene from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`, LOG.LS.eNAV);
            return false;
        }
        doc.CommonName = scene.Name;
        doc.SceneCountScene = scene.CountScene;
        doc.SceneCountNode = scene.CountNode;
        doc.SceneCountCamera = scene.CountCamera;
        doc.SceneCountLight = scene.CountLight;
        doc.SceneCountModel = scene.CountModel;
        doc.SceneCountMeta = scene.CountMeta;
        doc.SceneCountSetup = scene.CountSetup;
        doc.SceneCountTour = scene.CountTour;
        doc.SceneEdanUUID = scene.EdanUUID;
        doc.ScenePosedAndQCd = scene.PosedAndQCd;
        doc.SceneApprovedForPublication = scene.ApprovedForPublication;

        // fetch assets, find preferred asset (svx.json), if found, find first version, use that date
        const SO: DBAPI.SystemObject | null = await DBAPI.SystemObject.fetch(objectGraphDataEntry.systemObjectIDType.idSystemObject);
        const assets: DBAPI.Asset[] | null = await DBAPI.Asset.fetchFromSystemObject(objectGraphDataEntry.systemObjectIDType.idSystemObject);
        if (SO && assets) {
            for (const asset of assets) {
                if (await CACHE.VocabularyCache.isPreferredAsset(asset.idVAssetType, SO)) {
                    const assetVersion: DBAPI.AssetVersion | null = await DBAPI.AssetVersion.fetchFirstFromAsset(asset.idAsset);
                    if (assetVersion) {
                        doc.CommonDateCreated = assetVersion.DateCreated;
                        doc.ChildrenDateCreated = [assetVersion.DateCreated];
                    }
                    break;
                }
            }
        }
        this.countScene++;
        return true;
    }

    private async handleIntermediaryFile(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<boolean> {
        const intermediaryFile: DBAPI.IntermediaryFile | null = await DBAPI.IntermediaryFile.fetch(objectGraphDataEntry.systemObjectIDType.idObject);
        if (!intermediaryFile) {
            LOG.error(`IndexSolr.handleIntermediaryFile failed to compute intermediaryFile from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`, LOG.LS.eNAV);
            return false;
        }
        doc.CommonName = `Intermediary File created ${intermediaryFile.DateCreated.toISOString()}`;
        doc.CommonDateCreated = intermediaryFile.DateCreated;
        doc.ChildrenDateCreated = [intermediaryFile.DateCreated];
        this.countIntermediaryFile++;
        return true;
    }

    private async handleProjectDocumentation(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<boolean> {
        const projectDocumentation: DBAPI.ProjectDocumentation | null = await DBAPI.ProjectDocumentation.fetch(objectGraphDataEntry.systemObjectIDType.idObject);
        if (!projectDocumentation) {
            LOG.error(`IndexSolr.handleProjectDocumentation failed to compute projectDocumentation from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`, LOG.LS.eNAV);
            return false;
        }
        doc.CommonName = projectDocumentation.Name;
        doc.CommonDescription = projectDocumentation.Description;
        this.countProjectDocumentation++;
        return true;
    }

    private async handleAsset(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<boolean> {
        const asset: DBAPI.Asset | null = await DBAPI.Asset.fetch(objectGraphDataEntry.systemObjectIDType.idObject);
        if (!asset) {
            LOG.error(`IndexSolr.handleAsset failed to compute asset from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`, LOG.LS.eNAV);
            return false;
        }

        doc.CommonName = asset.FileName;
        doc.AssetType = await this.lookupVocabulary(asset.idVAssetType);

        const assetVersion: DBAPI.AssetVersion | null = await DBAPI.AssetVersion.fetchFirstFromAsset(asset.idAsset);
        if (assetVersion) {
            doc.CommonDateCreated = assetVersion.DateCreated;
            doc.ChildrenDateCreated = [assetVersion.DateCreated];
        }

        this.countAsset++;
        return true;
    }

    private async handleAssetVersion(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<boolean> {
        const assetVersion: DBAPI.AssetVersion | null = await DBAPI.AssetVersion.fetch(objectGraphDataEntry.systemObjectIDType.idObject);
        if (!assetVersion) {
            LOG.error(`IndexSolr.handleAssetVersion failed to compute assetVersion from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`, LOG.LS.eNAV);
            return false;
        }

        const user: DBAPI.User | null = await DBAPI.User.fetch(assetVersion.idUserCreator);
        if (!user) {
            LOG.error(`IndexSolr.handleAssetVersion failed to compute idUserCreator from ${assetVersion.idUserCreator}`, LOG.LS.eNAV);
            return false;
        }
        doc.CommonName = `${assetVersion.FileName} v${assetVersion.Version}`;
        doc.CommonDateCreated = assetVersion.DateCreated;
        doc.ChildrenDateCreated = [assetVersion.DateCreated];
        doc.AVFileName = assetVersion.FileName;
        doc.AVFilePath = assetVersion.FilePath;
        doc.AVUserCreator = user.Name;
        doc.AVStorageHash = assetVersion.StorageHash;
        doc.AVStorageSize = Number(assetVersion.StorageSize);
        doc.AVIngested = assetVersion.Ingested;
        doc.AVBulkIngest = assetVersion.BulkIngest;
        this.countAssetVersion++;
        return true;
    }

    private async handleActor(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<boolean> {
        const actor: DBAPI.Actor | null = await DBAPI.Actor.fetch(objectGraphDataEntry.systemObjectIDType.idObject);
        if (!actor) {
            LOG.error(`IndexSolr.handleActor failed to compute actor from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`, LOG.LS.eNAV);
            return false;
        }
        doc.CommonName = actor.IndividualName;
        doc.CommonOrganizationName = actor.OrganizationName;
        this.countActor++;
        return true;
    }

    private async handleStakeholder(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<boolean> {
        const stakeholder: DBAPI.Stakeholder | null = await DBAPI.Stakeholder.fetch(objectGraphDataEntry.systemObjectIDType.idObject);
        if (!stakeholder) {
            LOG.error(`IndexSolr.handleStakeholder failed to compute stakeholder from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`, LOG.LS.eNAV);
            return false;
        }

        doc.CommonName = stakeholder.IndividualName;
        doc.CommonOrganizationName = stakeholder.OrganizationName;
        doc.StakeholderEmailAddress = stakeholder.EmailAddress;
        doc.StakeholderPhoneNumberMobile = stakeholder.PhoneNumberMobile;
        doc.StakeholderPhoneNumberOffice = stakeholder.PhoneNumberOffice;
        doc.StakeholderMailingAddress = stakeholder.MailingAddress;
        this.countStakeholder++;
        return true;
    }

    private async handleUnknown(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<boolean> {
        LOG.error(`IndexSolr.fullIndex called with unknown object type from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`, LOG.LS.eNAV);
        doc.CommonName = `Unknown ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`;
        this.countUnknown++;
        return false;
    }

    private async computeIdentifiers(idSystemObject: number): Promise<string[]> {
        const identifiersRet: string[] = [];
        const identifiers: DBAPI.Identifier[] | null = await DBAPI.Identifier.fetchFromSystemObject(idSystemObject);
        if (identifiers) {
            for (const identifier of identifiers)
                identifiersRet.push(identifier.IdentifierValue);
        }
        return identifiersRet;
    }

    private async lookupVocabulary(idVocabulary: number | null): Promise<string> {
        if (!idVocabulary) return '';
        const vocabulary: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.vocabulary(idVocabulary);
        return vocabulary ? vocabulary.Term : '';
    }
}
