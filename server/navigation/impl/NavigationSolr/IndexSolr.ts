/* eslint-disable @typescript-eslint/no-explicit-any */
import * as NAV from '../../interface';
import * as H from '../../../utils/helpers';
import * as CACHE from '../../../cache';
import * as DBAPI from '../../../db';
import { ObjectGraphDataEntry } from '../../../db';
import { SolrClient, eSolrCore } from './SolrClient';
import * as COMMON from '@dpo-packrat/common';
import { RecordKeeper as RK } from '../../../records/recordKeeper';

import * as NS from 'node-schedule';

export class IndexSolr implements NAV.IIndexer {
    private objectGraphDatabase: DBAPI.ObjectGraphDatabase = new DBAPI.ObjectGraphDatabase();
    private hierarchyNameMap: Map<number, string> = new Map<number, string>(); // map of idSystemObject -> object name
    private static fullIndexUnderway: boolean = false;
    private static reindexJob: NS.Job | null = null;
    private static regexARK: RegExp = new RegExp('ark:/(.*)/(.*)');

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
            RK.logInfo(RK.LogSection.eNAV,'reindex job scheduled',undefined,{},'Navigation.Solr.Index');
        }
    }

    async fullIndex(profiled?: boolean | undefined): Promise<boolean> {
        if (profiled)
            return this.fullIndexProfiled();

        if (IndexSolr.fullIndexUnderway) {
            RK.logWarning(RK.LogSection.eNAV,'full index failed','already underway; exiting this additional request early',{},'Navigation.Solr.Index');
            return false;
        }

        let retValue: boolean = false;
        try {
            IndexSolr.fullIndexUnderway = true;
            retValue = await this.fullIndexWorker();
        } catch (error) {
            RK.logError(RK.LogSection.eNAV,'full index failed',H.Helpers.getErrorString(error),{},'Navigation.Solr.Index');
        } finally {
            IndexSolr.fullIndexUnderway = false;
        }
        return retValue;
    }

    async indexObject(idSystemObject: number): Promise<boolean> {
        // Compute full object graph for object
        // LOG.info(`IndexSolr.indexObject(${idSystemObject}) START`, LOG.LS.eNAV);
        if (!await this.objectGraphDatabase.fetchFromSystemObject(idSystemObject))
            RK.logError(RK.LogSection.eNAV,'index object failed','failed computing ObjectGraph',{ idSystemObject },'Navigation.Solr.Index');

        const OGDE: ObjectGraphDataEntry | undefined = this.objectGraphDatabase.objectMap.get(idSystemObject);
        if (!OGDE) {
            RK.logError(RK.LogSection.eNAV,'index object failed','failed computing ObjectGraphDataEntry from ObjectGraphDatabase',{ idSystemObject },'Navigation.Solr.Index');
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
                    RK.logError(RK.LogSection.eNAV,'index object failed',res.error,{ idSystemObject, docs },'Navigation.Solr.Index');
            } catch (error) {
                RK.logError(RK.LogSection.eNAV,'index object failed',H.Helpers.getErrorString(error),{ idSystemObject, docs },'Navigation.Solr.Index');
                return false;
            }

            RK.logInfo(RK.LogSection.eNAV,'index object success',`updating ${docs.size} documents`,{ idSystemObject },'Navigation.Solr.Index');
        } else
            RK.logError(RK.LogSection.eNAV,'index object failed','failed in handleObject',{ idSystemObject },'Navigation.Solr.Index');

        return true;
    }

    /** Returns count of indexed metadata, or -1 if there's an error */
    async indexMetadata(metadataList: DBAPI.Metadata[]): Promise<boolean> {
        const solrClient: SolrClient = new SolrClient(null, null, eSolrCore.ePackratMeta);
        const documentCount: number = await this.indexMetadataWorker(solrClient, metadataList, false);
        if (documentCount >= -1) {
            RK.logInfo(RK.LogSection.eNAV,'index metadata success',`updating ${documentCount} documents`,undefined,'Navigation.Solr.Index');
            return true;
        } else {
            RK.logError(RK.LogSection.eNAV,'index metadata failed','metadata worker error',{ metadataList },'Navigation.Solr.Index');
            return false;
        }
    }

    private async fullIndexProfiled(): Promise<boolean> {
        if (IndexSolr.fullIndexUnderway) {
            RK.logWarning(RK.LogSection.eNAV,'full index profiled failed','already underway; exiting this additional request early',{},'Navigation.Solr.Index');
            return false;
        }

        const profilerKey: string = `solr index: ${H.Helpers.randomSlug()}`;
        RK.profile(profilerKey,RK.LogSection.eNAV,'full index profiled',undefined,'Navigation.Solr.Index');
        RK.logInfo(RK.LogSection.eNAV,'full index profiled start',undefined,{},'Navigation.Solr.Index');
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
                        RK.logError(RK.LogSection.eNAV,'full index profiled failed',H.Helpers.getErrorString(error),{},'Navigation.Solr.Index');
                    } finally {
                        IndexSolr.fullIndexUnderway = false;
                    }

                    RK.logInfo(RK.LogSection.eNAV,'full index profiled success',undefined,{},'Navigation.Solr.Index');
                    RK.profileEnd(profilerKey);
                    resolve(retValue);

                    // some time later...
                    session.post('Profiler.stop', (err, { profile }) => {
                        // Write profile to disk, upload, etc.
                        if (!err) {
                            RK.logDebug(RK.LogSection.eNAV,'full index profiled','writing profile',{},'Navigation.Solr.Index');
                            fs.writeFileSync('./profile.cpuprofile', JSON.stringify(profile));
                        } else {
                            RK.logError(RK.LogSection.eNAV,'full index profiled',H.Helpers.getErrorString(err),{},'Navigation.Solr.Index');
                        }
                        RK.logDebug(RK.LogSection.eNAV,'full index profiled','writing profile ending',{},'Navigation.Solr.Index');
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
                RK.logError(RK.LogSection.eNAV,'handle ancestors','unable to extract system object info',{ idSystemObject },'Navigation.Solr.Index');
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
        RK.logInfo(RK.LogSection.eNAV,'reindex job starting',undefined,{},'Navigation.Solr.Index');
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
            RK.logError(RK.LogSection.eNAV,'full index worker failed','cannot fetch object graph database',{},'Navigation.Solr.Index');
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
                RK.logError(RK.LogSection.eNAV,'full index worker failed','failed tto handle object',{ doc, objectGraphDataEntry },'Navigation.Solr.Index');
        }

        if (docs.length > 0) {
            documentCount = await this.addDocumentsToSolr(solrClient, docs, documentCount, 'fullIndexWorkerOG');
            if (documentCount === -1)
                return false;
        }

        RK.logInfo(RK.LogSection.eNAV,'index success',undefined,
            {
                units: this.countUnit,
                projects: this.countProject,
                subject: this.countSubject,
                items: this.countItem,
                captureData: this.countCaptureData,
                models: this.countModel,
                scenes: this.countScene,
                intermediaryFiles: this.countIntermediaryFile,
                documentation: this.countProjectDocumentation,
                assets: this.countAsset,
                assetVersions: this.countAssetVersion,
                actors: this.countActor,
                stakeholders: this.countStakeholder,
                unknown: this.countUnknown,
                committed: documentCount
            },'Navigation.Solr.Index');

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
                RK.logInfo(RK.LogSection.eNAV,'metadata worker failed','could not fetch metadata',{ idMetadataLast },'Navigation.Solr.Index');
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

        RK.logInfo(RK.LogSection.eNAV,'metadata worker',`indexed metadata: ${this.countMetadata}`,{},'Navigation.Solr.Index');
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
                        RK.logError(RK.LogSection.eNAV,'metadata worker failed','could not fetch metadata source',{ metadata },'Navigation.Solr.Index');
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
                RK.logError(RK.LogSection.eNAV,'add document to Solr failed',res.error,{ docs, callerForLog },'Navigation.Solr.Index');
        } catch (error) {
            RK.logError(RK.LogSection.eNAV,'add document to Solr failed',H.Helpers.getErrorString(error),{ docs, callerForLog },'Navigation.Solr.Index');
            return -1;
        }
        documentCount += docs.length;
        RK.logInfo(RK.LogSection.eNAV,'add document to Solr success',`committed ${documentCount} total documents`,{ solrCore: solrClient.core() },'Navigation.Solr.Index');
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
                    RK.logError(RK.LogSection.eNAV,'extract common fields failed','unable to compute Unit for object',{ ...objInfo },'Navigation.Solr.Index');
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
                    RK.logError(RK.LogSection.eNAV,'extract common fields failed','unable to compute Project for object',{ ...objInfo },'Navigation.Solr.Index');
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
                    RK.logError(RK.LogSection.eNAV,'extract common fields failed','unable to compute Subject for object',{ ...objInfo },'Navigation.Solr.Index');
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
                    RK.logError(RK.LogSection.eNAV,'extract common fields failed','unable to compute Item for object',{ ...objInfo },'Navigation.Solr.Index');
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
            RK.logError(RK.LogSection.eNAV,'handle unit failed','failed to compute unit',{ ...objectGraphDataEntry.systemObjectIDType },'Navigation.Solr.Index');
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
            RK.logError(RK.LogSection.eNAV,'handle project failed','failed to compute project',{ ...objectGraphDataEntry.systemObjectIDType },'Navigation.Solr.Index');
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
            RK.logError(RK.LogSection.eNAV,'handle subject failed','failed to compute subject',{ ...objectGraphDataEntry.systemObjectIDType },'Navigation.Solr.Index');
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
            RK.logError(RK.LogSection.eNAV,'handle item failed','failed to compute item',{ ...objectGraphDataEntry.systemObjectIDType },'Navigation.Solr.Index');
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
            RK.logError(RK.LogSection.eNAV,'handle capture data failed','failed to compute capture data',{ ...objectGraphDataEntry.systemObjectIDType },'Navigation.Solr.Index');
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
            RK.logError(RK.LogSection.eNAV,'handle model failed','failed to compute ModelConstellation',{ ...objectGraphDataEntry.systemObjectIDType },'Navigation.Solr.Index');
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
            RK.logError(RK.LogSection.eNAV,'handle scene failed','failed to compute Scene',{ ...objectGraphDataEntry.systemObjectIDType },'Navigation.Solr.Index');
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
            RK.logError(RK.LogSection.eNAV,'handle intermediary file failed','failed to compute IntermediaryFile',{ ...objectGraphDataEntry.systemObjectIDType },'Navigation.Solr.Index');
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
            RK.logError(RK.LogSection.eNAV,'handle project documentation failed','failed to compute ProjectDocumentation',{ ...objectGraphDataEntry.systemObjectIDType },'Navigation.Solr.Index');
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
            RK.logError(RK.LogSection.eNAV,'handle asset failed','failed to compute Asset',{ ...objectGraphDataEntry.systemObjectIDType },'Navigation.Solr.Index');
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
            RK.logError(RK.LogSection.eNAV,'handle asset version failed','failed to compute AssetVersion',{ ...objectGraphDataEntry.systemObjectIDType },'Navigation.Solr.Index');
            return false;
        }

        const user: DBAPI.User | null = await DBAPI.User.fetch(assetVersion.idUserCreator);
        if (!user) {
            RK.logError(RK.LogSection.eNAV,'handle asset version failed','failed to compute idUserCreator',{ idUserCreator: assetVersion.idUserCreator },'Navigation.Solr.Index');
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
            RK.logError(RK.LogSection.eNAV,'handle actor failed','failed to compute Actor',{ ...objectGraphDataEntry.systemObjectIDType },'Navigation.Solr.Index');
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
            RK.logError(RK.LogSection.eNAV,'handle stakeholder failed','failed to compute Stakeholder',{ ...objectGraphDataEntry.systemObjectIDType },'Navigation.Solr.Index');
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
        RK.logError(RK.LogSection.eNAV,'handle unknown','called with unknown object type',{ ...objectGraphDataEntry.systemObjectIDType },'Navigation.Solr.Index');

        doc.CommonName = `Unknown ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`;
        this.countUnknown++;
        return false;
    }

    private async computeIdentifiers(idSystemObject: number): Promise<string[]> {
        const identifiersRet: string[] = [];
        const identifiers: DBAPI.Identifier[] | null = await DBAPI.Identifier.fetchFromSystemObject(idSystemObject);
        if (identifiers) {
            for (const identifier of identifiers) {
                const idValue: string = identifier.IdentifierValue;
                identifiersRet.push(idValue);

                // find first :
                const firstColonIndex: number = idValue.indexOf(':');

                // if this is an ARK ID, extract the guid ... e.g. http://n2t.net/ark:/65665/ye3b2567e1b-5e76-4379-bf60-8dbb0fd8a2d1 -> ye3b2567e1b-5e76-4379-bf60-8dbb0fd8a2d1
                const ARKMatch: RegExpMatchArray | null = idValue.match(IndexSolr.regexARK);
                if (ARKMatch && ARKMatch.length >= 3)
                    identifiersRet.push(ARKMatch[2]);
                // else if we have a colon after the first character, extract trimmed text to the right of the colon ... e.g. edanmdm:dpo_3d_200032 -> dpo_3d_200032
                else if (firstColonIndex > 0) {
                    const trimmedID: string = idValue.substring(firstColonIndex + 1).trim();
                    if (trimmedID)
                        identifiersRet.push(trimmedID);
                }
            }
        }
        return identifiersRet;
    }

    private async lookupVocabulary(idVocabulary: number | null): Promise<string> {
        if (!idVocabulary) return '';
        const vocabulary: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.vocabulary(idVocabulary);
        return vocabulary ? vocabulary.Term : '';
    }
}
