import { Actor, Asset, AssetVersion, CaptureData, IntermediaryFile, Item, Model,
    Project, ProjectDocumentation, Scene, Stakeholder, Subject, SystemObject,
    SystemObjectPairs, Unit, eSystemObjectType } from '../..';
import * as LOG from '../../../utils/logger';
import * as L from 'lodash';
import { ObjectGraphDatabase } from './ObjectGraphDatabase';
import { ObjectGraphDataEntry } from './ObjectGraphDataEntry';

export type SystemObjectIDType = {
    idSystemObject: number;
    idObject: number;
    eObjectType: eSystemObjectType;
};

export enum eObjectGraphMode {
    eAncestors,
    eDescendents,
    eAll
}

export class ObjectGraph {
    idSystemObject: number = 0;
    eMode: eObjectGraphMode = eObjectGraphMode.eAncestors;

    unit: Unit[] | null = null;
    project: Project[] | null = null;
    subject: Subject[] | null = null;
    item: Item[] | null = null;
    captureData: CaptureData[] | null = null;
    model: Model[] | null = null;
    scene: Scene[] | null = null;
    intermediaryFile: IntermediaryFile[] | null = null;
    projectDocumentation: ProjectDocumentation[] | null = null;
    asset: Asset[] | null = null;
    assetVersion: AssetVersion[] | null = null;
    actor: Actor[] | null = null;
    stakeholder: Stakeholder[] | null = null;

    validHierarchy: boolean = true;
    noCycles: boolean = true;

    pushCount: number = 0;
    maxPushCount: number = 500;
    depth: number = 32;

    systemObjectList: number[] = []; // array of idSystemObjects to be processed
    systemObjectProcessed: Map<number, SystemObjectIDType> = new Map<number, SystemObjectIDType>(); // map from idSystemObject -> { idSystemObject, id of database object, type of database object}
    systemObjectAdded: Map<number, SystemObjectIDType> = new Map<number, SystemObjectIDType>(); // map from idSystemObject -> { idSystemObject, id of database object, type of database object}
    objectGraphDatabase: ObjectGraphDatabase | null = null; // non-null means we'll record relationship and hierarchy data in this object

    constructor(idSystemObject: number, eMode: eObjectGraphMode, depth: number = 32, objectGraphDatabase: ObjectGraphDatabase | null = null) {
        this.idSystemObject = idSystemObject;
        this.eMode = eMode;
        this.depth = depth;
        this.objectGraphDatabase = objectGraphDatabase;
    }

    async fetch(): Promise<boolean> {
        if (!this.idSystemObject)
            return true;
        // LOG.logger.info(`OA: ${this.idSystemObject}`);
        switch (this.eMode) {
            case eObjectGraphMode.eAncestors:
            case eObjectGraphMode.eDescendents:
                return await this.fetchWorker(this.idSystemObject, null, this.eMode, this.depth);
            case eObjectGraphMode.eAll: {
                /* istanbul ignore if */
                if (!await this.fetchWorker(this.idSystemObject, null, eObjectGraphMode.eAncestors, this.depth))
                    return false;
                this.systemObjectProcessed.clear();
                return await this.fetchWorker(this.idSystemObject, null, eObjectGraphMode.eDescendents, this.depth);
            }
        }
    }

    // Expected types of hierarchies:
    // Unit -> Project -> Subject -> Item -> CaptureData / Model / Scene / IntermediaryFile
    // Unit -> Project -> ProjectDocumentation
    // Unit -> Subject -> Item -> CaptureData / Model / Scene / IntermediaryFile

    // SystemObjectXref allows us to model any graph of SystemObjects, including ones that
    // are cyclic and/or do not adhere to the expected object hierarchies described above.
    // This method will extract all ancestors, as well as look for invalid hierarchies and (invalid) cycles.

    // relatedType is child when eMode == eObjectGraphMode.eAncestors
    // relatedType is parent when eMode == eObjectGraphMode.eDescendents
    private async fetchWorker(idSystemObject: number, relatedType: SystemObjectIDType | null, eMode: eObjectGraphMode, recurseDepth: number): Promise<boolean> {
        try {
            /* istanbul ignore if */
            if (eMode != eObjectGraphMode.eAncestors && eMode != eObjectGraphMode.eDescendents) {
                LOG.logger.error(`DBAPI.ObjectGraph.fetchWorker called with invalid mode ${eMode}`);
                return true;
            }
            // detect cycle; if so, record and short-circuit
            if (relatedType && idSystemObject == this.idSystemObject) {
                this.noCycles = false;
                this.validHierarchy = false;
                LOG.logger.error(`DBAPI.ObjectGraph.fetchWorker Detected Cycle via ${idSystemObject}`);
                return true;
            }

            /* istanbul ignore if */
            if (this.pushCount++ >= this.maxPushCount)
                return true;

            let sourceType: SystemObjectIDType = {
                idSystemObject,
                idObject: 0,
                eObjectType: eSystemObjectType.eUnknown
            };

            // short-circuit if we're building an ObjectGraphDatabase and we've already processed this object
            if (this.objectGraphDatabase && this.objectGraphDatabase.alreadyProcessed(idSystemObject, relatedType)) {
                if (relatedType) {
                    const OBDE: ObjectGraphDataEntry | undefined = this.objectGraphDatabase.objectMap.get(idSystemObject);
                    if (OBDE) {
                        sourceType = OBDE.systemObjectIDType;
                        if (eMode == eObjectGraphMode.eAncestors)
                            await this.objectGraphDatabase.recordRelationship(sourceType, relatedType);
                        else
                            await this.objectGraphDatabase.recordRelationship(relatedType, sourceType);
                    }
                }
                return true;
            }

            const SOP: SystemObjectPairs | null = await SystemObjectPairs.fetch(idSystemObject);
            /* istanbul ignore next */
            if (!SOP) {
                LOG.logger.error(`DBAPI.ObjectGraph.fetchWorker Unidentified SystemObject ${idSystemObject}`);
                return true;
            } else {
                // Determine what kind of object this is; perform type-specific validity checks; push to the appropriate list; gather explicitly related objects
                if (SOP.Unit && !await this.pushUnit(SOP.Unit, sourceType, relatedType, eMode))
                    return true;
                else if (SOP.Project && !await this.pushProject(SOP.Project, sourceType, relatedType, eMode))
                    return true;
                else if (SOP.Subject && !await this.pushSubject(SOP.Subject, sourceType, relatedType, eMode))
                    return true;
                else if (SOP.Item && !await this.pushItem(SOP.Item, sourceType, relatedType, eMode))
                    return true;
                else if (SOP.CaptureData && !await this.pushCaptureData(SOP.CaptureData, sourceType, relatedType, eMode))
                    return true;
                else if (SOP.Model && !await this.pushModel(SOP.Model, sourceType, relatedType, eMode))
                    return true;
                else if (SOP.Scene && !await this.pushScene(SOP.Scene, sourceType, relatedType, eMode))
                    return true;
                else if (SOP.IntermediaryFile && !await this.pushIntermediaryFile(SOP.IntermediaryFile, sourceType, relatedType, eMode))
                    return true;
                else if (SOP.ProjectDocumentation && !await this.pushProjectDocumentation(SOP.ProjectDocumentation, sourceType, relatedType, eMode))
                    return true;
                else if (SOP.Asset && !await this.pushAsset(SOP.Asset, sourceType, relatedType, eMode))
                    return true;
                else if (SOP.AssetVersion && !await this.pushAssetVersion(SOP.AssetVersion, sourceType, relatedType, eMode))
                    return true;
                else if (SOP.Actor && !await this.pushActor(SOP.Actor, sourceType, relatedType, eMode))
                    return true;
                else if (SOP.Stakeholder && !await this.pushStakeholder(SOP.Stakeholder, sourceType, relatedType, eMode))
                    return true;
            }

            /* istanbul ignore if */
            if (sourceType.eObjectType == eSystemObjectType.eUnknown)
                LOG.logger.error(`DBAPI.ObjectGraph.fetchWorker Unidentified SystemObject type ${JSON.stringify(SOP)}`);

            this.systemObjectProcessed.set(idSystemObject, sourceType);
            this.systemObjectAdded.set(idSystemObject, sourceType);

            // record relationship
            if (this.objectGraphDatabase) {
                if (relatedType) {
                    if (eMode == eObjectGraphMode.eAncestors)
                        await this.objectGraphDatabase.recordRelationship(sourceType, relatedType);
                    else
                        await this.objectGraphDatabase.recordRelationship(relatedType, sourceType);
                }
            }

            /*
            const valid: string = (this.validHierarchy ? '' : ' INVALID HIERARCHY') + (this.noCycles ? '' : ' CYCLE');
            const sourceDesc: string = `${eSystemObjectType[sourceType.eObjectType]} ${sourceType.idObject}/${sourceType.idSystemObject}`;
            const relatedDesc: string = (relatedType) ? `${eSystemObjectType[relatedType.eObjectType]} ${relatedType.idObject}/${relatedType.idSystemObject}` : 'root';
            const traverseType: string = (eMode == eObjectGraphMode.eAncestors) ? '^^' : 'vv';
            const prefix: string = `OA [${this.pushCount.toString().padStart(3, '0')} ${traverseType}]: `;
            if (eMode == eObjectGraphMode.eAncestors)
                LOG.logger.info(`${prefix}${sourceDesc} -> ${relatedDesc}${valid}$`);
            else
                LOG.logger.info(`${prefix}${relatedDesc} -> ${sourceDesc}${valid}$`);
            */

            // gather using master/derived systemobjectxref's
            const SORelated: SystemObject[] | null = (eMode == eObjectGraphMode.eAncestors)
                ? await SystemObject.fetchMasterFromXref(idSystemObject)
                : await SystemObject.fetchDerivedFromXref(idSystemObject);
            /* istanbul ignore else */
            if (SORelated) {
                for (const SO of SORelated)
                    this.systemObjectList.push(SO.idSystemObject);
            }

            // gather asset children
            if (eMode == eObjectGraphMode.eDescendents) {
                const ASList: Asset[] | null = await Asset.fetchFromSystemObject(idSystemObject);
                /* istanbul ignore else */
                if (ASList) {
                    for (const asset of ASList) {
                        const SO: SystemObject | null = await SystemObject.fetchFromAssetID(asset.idAsset);
                        /* istanbul ignore else */
                        if (SO)
                            this.systemObjectList.push(SO.idSystemObject);
                        else
                            LOG.logger.error(`Missing SystemObject for asset ${JSON.stringify(asset)}`);
                    }
                }
            }

            // can we continue down?
            if (recurseDepth > 0) {
                // handle all gathered objects
                const RelatedList: number[] = L.clone(this.systemObjectList);
                this.systemObjectList = [];
                for (const idSystemObject of RelatedList) {
                    /* istanbul ignore if */
                    if (!await this.fetchWorker(idSystemObject, sourceType, eMode, recurseDepth - 1)) // recurse
                        return false;
                }
            }
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.ObjectGraph.fetchWorker', error);
            return false;
        }

        return true;
    }

    private async pushActor(actor: Actor, sourceType: SystemObjectIDType,
        relatedType: SystemObjectIDType | null, eMode: eObjectGraphMode): Promise<boolean> {
        sourceType.idObject = actor.idActor;
        sourceType.eObjectType = eSystemObjectType.eActor;
        if (eMode == eObjectGraphMode.eAncestors) { // allowable children
            if (relatedType)
                this.validHierarchy = false;
        } else { // if (eMode == eObjectGraphMode.eDescendents) { // allowable parents
            if (relatedType &&
                (relatedType.eObjectType != eSystemObjectType.eCaptureData &&
                 relatedType.eObjectType != eSystemObjectType.eModel &&
                 relatedType.eObjectType != eSystemObjectType.eScene &&
                 relatedType.eObjectType != eSystemObjectType.eIntermediaryFile &&
                 relatedType.eObjectType != eSystemObjectType.eUnit))
                this.validHierarchy = false;
        }

        /* istanbul ignore if */
        if (this.systemObjectProcessed.has(sourceType.idSystemObject))
            return false;

        /* istanbul ignore next */
        if (!this.systemObjectAdded.has(sourceType.idSystemObject)) {
            if (!this.actor)
                this.actor = [];
            this.actor.push(actor);
        }

        if (eMode == eObjectGraphMode.eAncestors) { // parents
            if (actor.idUnit) {
                const SO: SystemObject | null = await SystemObject.fetchFromUnitID(actor.idUnit);
                /* istanbul ignore else */
                if (SO)
                    this.systemObjectList.push(SO.idSystemObject);
                else
                    LOG.logger.error(`Missing SystemObject for unit ${actor.idUnit} linked from ${JSON.stringify(actor)}`);
            }
        } // else ... no children
        return true;
    }

    private async pushAsset(asset: Asset, sourceType: SystemObjectIDType,
        relatedType: SystemObjectIDType | null, eMode: eObjectGraphMode): Promise<boolean> {
        sourceType.idObject = asset.idAsset;
        sourceType.eObjectType = eSystemObjectType.eAsset;
        if (eMode == eObjectGraphMode.eAncestors) { // allowable children
            if (relatedType && relatedType.eObjectType != eSystemObjectType.eAssetVersion)
                this.validHierarchy = false;
        } // allowable parents -- any system object can have an asset

        /* istanbul ignore if */
        if (this.systemObjectProcessed.has(sourceType.idSystemObject))
            return false;

        /* istanbul ignore next */
        if (!this.systemObjectAdded.has(sourceType.idSystemObject)) {
            if (!this.asset)
                this.asset = [];
            this.asset.push(asset);
        }

        if (eMode == eObjectGraphMode.eAncestors) { // parents
            /* istanbul ignore else */
            if (asset.idSystemObject) // Follow link from asset back to owning system object
                this.systemObjectList.push(asset.idSystemObject);
        } else { // if (eMode == eObjectGraphMode.eDescendents) { // children
            const AVList: AssetVersion[] | null = await AssetVersion.fetchFromAsset(asset.idAsset);
            /* istanbul ignore else */
            if (AVList) {
                for (const assetVersion of AVList) {
                    const SO: SystemObject | null = await assetVersion.fetchSystemObject();
                    /* istanbul ignore else */
                    if (SO)
                        this.systemObjectList.push(SO.idSystemObject);
                    else
                        LOG.logger.error(`Missing SystemObject for assetVersion ${assetVersion.idAssetVersion} linked from ${JSON.stringify(assetVersion)}`);
                }
            }
        }
        return true;
    }

    private async pushAssetVersion(assetVersion: AssetVersion, sourceType: SystemObjectIDType,
        relatedType: SystemObjectIDType | null, eMode: eObjectGraphMode): Promise<boolean> {
        sourceType.idObject = assetVersion.idAsset;
        sourceType.eObjectType = eSystemObjectType.eAssetVersion;
        if (eMode == eObjectGraphMode.eAncestors) { // allowable children
            if (relatedType)
                this.validHierarchy = false;
        } else { // if (eMode == eObjectGraphMode.eDescendents) { // allowable parents
            if (relatedType && relatedType.eObjectType != eSystemObjectType.eAsset)
                this.validHierarchy = false;
        }

        /* istanbul ignore if */
        if (this.systemObjectProcessed.has(sourceType.idSystemObject))
            return false;

        /* istanbul ignore next */
        if (!this.systemObjectAdded.has(sourceType.idSystemObject)) {
            if (!this.assetVersion)
                this.assetVersion = [];
            this.assetVersion.push(assetVersion);
        }

        /* istanbul ignore else */
        if (eMode == eObjectGraphMode.eAncestors) { // parents
            const SO: SystemObject | null = await SystemObject.fetchFromAssetID(assetVersion.idAsset);
            /* istanbul ignore else */
            if (SO)
                this.systemObjectList.push(SO.idSystemObject);
            else
                LOG.logger.error(`Missing SystemObject for asset ${assetVersion.idAsset} linked from ${JSON.stringify(assetVersion)}`);
        } // else ... no children
        return true;
    }

    private async pushCaptureData(captureData: CaptureData, sourceType: SystemObjectIDType,
        relatedType: SystemObjectIDType | null, eMode: eObjectGraphMode): Promise<boolean> {
        sourceType.idObject = captureData.idCaptureData;
        sourceType.eObjectType = eSystemObjectType.eCaptureData;
        if (eMode == eObjectGraphMode.eAncestors) { // allowable children
            if (relatedType &&
                (relatedType.eObjectType != eSystemObjectType.eAsset &&
                relatedType.eObjectType != eSystemObjectType.eModel &&
                relatedType.eObjectType != eSystemObjectType.eActor))
                this.validHierarchy = false;
        } else { // if (eMode == eObjectGraphMode.eDescendents) { // allowable parents
            if (relatedType && relatedType.eObjectType != eSystemObjectType.eItem)
                this.validHierarchy = false;
        }

        /* istanbul ignore if */
        if (this.systemObjectProcessed.has(sourceType.idSystemObject))
            return false;

        /* istanbul ignore next */
        if (!this.systemObjectAdded.has(sourceType.idSystemObject)) {
            if (!this.captureData)
                this.captureData = [];
            this.captureData.push(captureData);
        }

        // all parents via SystemObjectXref
        /* istanbul ignore else */
        if (eMode == eObjectGraphMode.eDescendents) { // children
            if (captureData.idAssetThumbnail) {
                const SO: SystemObject | null = await SystemObject.fetchFromAssetID(captureData.idAssetThumbnail);
                /* istanbul ignore else */
                if (SO)
                    this.systemObjectList.push(SO.idSystemObject);
                else
                    LOG.logger.error(`Missing SystemObject for asset ${captureData.idAssetThumbnail} linked from ${JSON.stringify(captureData)}`);
            }
        }
        return true;
    }

    private async pushIntermediaryFile(intermediaryFile: IntermediaryFile, sourceType: SystemObjectIDType,
        relatedType: SystemObjectIDType | null, eMode: eObjectGraphMode): Promise<boolean> {
        sourceType.idObject = intermediaryFile.idIntermediaryFile;
        sourceType.eObjectType = eSystemObjectType.eIntermediaryFile;
        if (eMode == eObjectGraphMode.eAncestors) { // allowable children
            if (relatedType &&
                (relatedType.eObjectType != eSystemObjectType.eAsset &&
                relatedType.eObjectType != eSystemObjectType.eActor))
                this.validHierarchy = false;
        } else { // if (eMode == eObjectGraphMode.eDescendents) { // allowable parents
            if (relatedType && relatedType.eObjectType != eSystemObjectType.eItem)
                this.validHierarchy = false;
        }

        /* istanbul ignore if */
        if (this.systemObjectProcessed.has(sourceType.idSystemObject))
            return false;

        /* istanbul ignore next */
        if (!this.systemObjectAdded.has(sourceType.idSystemObject)) {
            if (!this.intermediaryFile)
                this.intermediaryFile = [];
            this.intermediaryFile.push(intermediaryFile);
        }

        // all parents and children via SystemObjectXref
        return true;
    }

    private async pushItem(item: Item, sourceType: SystemObjectIDType,
        relatedType: SystemObjectIDType | null, eMode: eObjectGraphMode): Promise<boolean> {
        sourceType.idObject = item.idItem;
        sourceType.eObjectType = eSystemObjectType.eItem;
        if (eMode == eObjectGraphMode.eAncestors) { // allowable children
            if (relatedType &&
                (relatedType.eObjectType != eSystemObjectType.eAsset &&
                relatedType.eObjectType != eSystemObjectType.eCaptureData &&
                relatedType.eObjectType != eSystemObjectType.eModel &&
                relatedType.eObjectType != eSystemObjectType.eScene &&
                relatedType.eObjectType != eSystemObjectType.eIntermediaryFile))
                this.validHierarchy = false;
        } else { // if (eMode == eObjectGraphMode.eDescendents) { // allowable parents
            if (relatedType && relatedType.eObjectType != eSystemObjectType.eSubject)
                this.validHierarchy = false;
        }

        /* istanbul ignore if */
        if (this.systemObjectProcessed.has(sourceType.idSystemObject))
            return false;

        /* istanbul ignore next */
        if (!this.systemObjectAdded.has(sourceType.idSystemObject)) {
            if (!this.item)
                this.item = [];
            this.item.push(item);
        }

        // all parents via SystemObjectXref
        /* istanbul ignore else */
        if (eMode == eObjectGraphMode.eDescendents) { // children
            if (item.idAssetThumbnail) {
                const SO: SystemObject | null = await SystemObject.fetchFromAssetID(item.idAssetThumbnail);
                /* istanbul ignore else */
                if (SO)
                    this.systemObjectList.push(SO.idSystemObject);
                else
                    LOG.logger.error(`Missing SystemObject for asset ${item.idAssetThumbnail} linked from ${JSON.stringify(item)}`);
            }
        }

        return true;
    }

    private async pushModel(model: Model, sourceType: SystemObjectIDType,
        relatedType: SystemObjectIDType | null, eMode: eObjectGraphMode): Promise<boolean> {
        sourceType.idObject = model.idModel;
        sourceType.eObjectType = eSystemObjectType.eModel;
        if (eMode == eObjectGraphMode.eAncestors) { // allowable children
            if (relatedType &&
                (relatedType.eObjectType != eSystemObjectType.eAsset &&
                relatedType.eObjectType != eSystemObjectType.eScene &&
                relatedType.eObjectType != eSystemObjectType.eModel &&
                relatedType.eObjectType != eSystemObjectType.eActor))
                this.validHierarchy = false;
        } else { // if (eMode == eObjectGraphMode.eDescendents) { // allowable parents
            if (relatedType &&
                (relatedType.eObjectType != eSystemObjectType.eItem &&
                relatedType.eObjectType != eSystemObjectType.eCaptureData &&
                relatedType.eObjectType != eSystemObjectType.eModel &&
                relatedType.eObjectType != eSystemObjectType.eScene))
                this.validHierarchy = false;
        }

        /* istanbul ignore if */
        if (this.systemObjectProcessed.has(sourceType.idSystemObject))
            return false;

        /* istanbul ignore next */
        if (!this.systemObjectAdded.has(sourceType.idSystemObject)) {
            if (!this.model)
                this.model = [];
            this.model.push(model);
        }

        // all parents via SystemObjectXref
        /* istanbul ignore else */
        if (eMode == eObjectGraphMode.eDescendents) { // children
            if (model.idAssetThumbnail) {
                const SO: SystemObject | null = await SystemObject.fetchFromAssetID(model.idAssetThumbnail);
                /* istanbul ignore else */
                if (SO)
                    this.systemObjectList.push(SO.idSystemObject);
                else
                    LOG.logger.error(`Missing SystemObject for asset ${model.idAssetThumbnail} linked from ${JSON.stringify(model)}`);
            }
        }
        return true;
    }

    private async pushProject(project: Project, sourceType: SystemObjectIDType,
        relatedType: SystemObjectIDType | null, eMode: eObjectGraphMode): Promise<boolean> {
        sourceType.idObject = project.idProject;
        sourceType.eObjectType = eSystemObjectType.eProject;
        if (eMode == eObjectGraphMode.eAncestors) { // allowable children
            if (relatedType &&
                (relatedType.eObjectType != eSystemObjectType.eSubject &&
                relatedType.eObjectType != eSystemObjectType.eProjectDocumentation &&
                relatedType.eObjectType != eSystemObjectType.eStakeholder))
                this.validHierarchy = false;
        } else { // if (eMode == eObjectGraphMode.eDescendents) { // allowable parents
            if (relatedType && relatedType.eObjectType != eSystemObjectType.eUnit)
                this.validHierarchy = false;
        }

        /* istanbul ignore if */
        if (this.systemObjectProcessed.has(sourceType.idSystemObject))
            return false;

        /* istanbul ignore next */
        if (!this.systemObjectAdded.has(sourceType.idSystemObject)) {
            if (!this.project)
                this.project = [];
            this.project.push(project);
        }

        // all parents via SystemObjectXref
        /* istanbul ignore else */
        if (eMode == eObjectGraphMode.eDescendents) { // children
            const PDList: ProjectDocumentation[] | null = await ProjectDocumentation.fetchFromProject(project.idProject);
            /* istanbul ignore else */
            if (PDList) {
                for (const PD of PDList) {
                    const SO: SystemObject | null = await SystemObject.fetchFromProjectDocumentationID(PD.idProjectDocumentation);
                    /* istanbul ignore else */
                    if (SO)
                        this.systemObjectList.push(SO.idSystemObject);
                    else
                        LOG.logger.error(`Missing SystemObject for project documentation ${JSON.stringify(PD)}`);
                }
            }
        }
        return true;
    }

    private async pushProjectDocumentation(projectDocumentation: ProjectDocumentation, sourceType: SystemObjectIDType,
        relatedType: SystemObjectIDType | null, eMode: eObjectGraphMode): Promise<boolean> {
        sourceType.idObject = projectDocumentation.idProjectDocumentation;
        sourceType.eObjectType = eSystemObjectType.eProjectDocumentation;
        if (eMode == eObjectGraphMode.eAncestors) { // allowable children
            if (relatedType && relatedType.eObjectType != eSystemObjectType.eAsset)
                this.validHierarchy = false;
        } else { // if (eMode == eObjectGraphMode.eDescendents) { // allowable parents
            if (relatedType && relatedType.eObjectType != eSystemObjectType.eProject)
                this.validHierarchy = false;
        }

        /* istanbul ignore if */
        if (this.systemObjectProcessed.has(sourceType.idSystemObject))
            return false;

        /* istanbul ignore next */
        if (!this.systemObjectAdded.has(sourceType.idSystemObject)) {
            if (!this.projectDocumentation)
                this.projectDocumentation = [];
            this.projectDocumentation.push(projectDocumentation);
        }

        /* istanbul ignore else */
        if (eMode == eObjectGraphMode.eAncestors) { // parents
            const SO: SystemObject | null = await SystemObject.fetchFromProjectID(projectDocumentation.idProject);
            /* istanbul ignore else */
            if (SO)
                this.systemObjectList.push(SO.idSystemObject);
            else
                LOG.logger.error(`Missing SystemObject for project ${projectDocumentation.idProject} linked from ${JSON.stringify(projectDocumentation)}`);
        } // else ... no children
        return true;
    }

    private async pushScene(scene: Scene, sourceType: SystemObjectIDType,
        relatedType: SystemObjectIDType | null, eMode: eObjectGraphMode): Promise<boolean> {
        sourceType.idObject = scene.idScene;
        sourceType.eObjectType = eSystemObjectType.eScene;
        if (eMode == eObjectGraphMode.eAncestors) { // allowable children
            if (relatedType &&
                (relatedType.eObjectType != eSystemObjectType.eAsset &&
                relatedType.eObjectType != eSystemObjectType.eModel &&
                relatedType.eObjectType != eSystemObjectType.eActor))
                this.validHierarchy = false;
        } else { // if (eMode == eObjectGraphMode.eDescendents) { // allowable parents
            if (relatedType &&
                (relatedType.eObjectType != eSystemObjectType.eItem &&
                relatedType.eObjectType != eSystemObjectType.eModel))
                this.validHierarchy = false;
        }

        /* istanbul ignore if */
        if (this.systemObjectProcessed.has(sourceType.idSystemObject))
            return false;

        /* istanbul ignore next */
        if (!this.systemObjectAdded.has(sourceType.idSystemObject)) {
            if (!this.scene)
                this.scene = [];
            this.scene.push(scene);
        }

        // all parents via SystemObjectXref
        /* istanbul ignore else */
        if (eMode == eObjectGraphMode.eDescendents) { // children
            /* istanbul ignore else */
            if (scene.idAssetThumbnail) {
                const SO: SystemObject | null = await SystemObject.fetchFromAssetID(scene.idAssetThumbnail);
                /* istanbul ignore else */
                if (SO)
                    this.systemObjectList.push(SO.idSystemObject);
                else
                    LOG.logger.error(`Missing SystemObject for asset ${scene.idAssetThumbnail} linked from ${JSON.stringify(scene)}`);
            }
        }

        return true;
    }

    private async pushStakeholder(stakeholder: Stakeholder, sourceType: SystemObjectIDType,
        relatedType: SystemObjectIDType | null, eMode: eObjectGraphMode): Promise<boolean> {
        sourceType.idObject = stakeholder.idStakeholder;
        sourceType.eObjectType = eSystemObjectType.eStakeholder;
        if (eMode == eObjectGraphMode.eAncestors) { // allowable children
            if (relatedType)
                this.validHierarchy = false;
        } else { // if (eMode == eObjectGraphMode.eDescendents) { // allowable parents
            if (relatedType &&
               (relatedType.eObjectType != eSystemObjectType.eUnit &&
                relatedType.eObjectType != eSystemObjectType.eProject))
                this.validHierarchy = false;
        }

        /* istanbul ignore if */
        if (this.systemObjectProcessed.has(sourceType.idSystemObject))
            return false;

        /* istanbul ignore next */
        if (!this.systemObjectAdded.has(sourceType.idSystemObject)) {
            if (!this.stakeholder)
                this.stakeholder = [];
            this.stakeholder.push(stakeholder);
        }

        // all parents and children via SystemObjectXref
        return true;
    }

    private async pushSubject(subject: Subject, sourceType: SystemObjectIDType,
        relatedType: SystemObjectIDType | null, eMode: eObjectGraphMode): Promise<boolean> {
        sourceType.idObject = subject.idSubject;
        sourceType.eObjectType = eSystemObjectType.eSubject;
        if (eMode == eObjectGraphMode.eAncestors) { // allowable children
            if (relatedType &&
                (relatedType.eObjectType != eSystemObjectType.eAsset &&
                relatedType.eObjectType != eSystemObjectType.eItem))
                this.validHierarchy = false;
        } else { // if (eMode == eObjectGraphMode.eDescendents) { // allowable parents
            if (relatedType &&
                (relatedType.eObjectType != eSystemObjectType.eUnit &&
                relatedType.eObjectType != eSystemObjectType.eProject))
                this.validHierarchy = false;
        }

        /* istanbul ignore if */
        if (this.systemObjectProcessed.has(sourceType.idSystemObject))
            return false;

        /* istanbul ignore next */
        if (!this.systemObjectAdded.has(sourceType.idSystemObject)) {
            if (!this.subject)
                this.subject = [];
            this.subject.push(subject);
        }

        if (eMode == eObjectGraphMode.eAncestors) { // parents
            const SO: SystemObject | null = await SystemObject.fetchFromUnitID(subject.idUnit);
            /* istanbul ignore else */
            if (SO)
                this.systemObjectList.push(SO.idSystemObject);
            else
                LOG.logger.error(`Missing SystemObject for unit ${subject.idUnit} linked from ${JSON.stringify(subject)}`);
        } else { // if (eMode == eObjectGraphMode.eDescendents) { // children
            if (subject.idAssetThumbnail) {
                const SO: SystemObject | null = await SystemObject.fetchFromAssetID(subject.idAssetThumbnail);
                /* istanbul ignore else */
                if (SO)
                    this.systemObjectList.push(SO.idSystemObject);
                else
                    LOG.logger.error(`Missing SystemObject for asset ${subject.idAssetThumbnail} linked from ${JSON.stringify(subject)}`);
            }
        }
        return true;
    }

    private async pushUnit(unit: Unit, sourceType: SystemObjectIDType,
        relatedType: SystemObjectIDType | null, eMode: eObjectGraphMode): Promise<boolean> {
        sourceType.idObject = unit.idUnit;
        sourceType.eObjectType = eSystemObjectType.eUnit;
        if (eMode == eObjectGraphMode.eAncestors) { // allowable children
            if (relatedType &&
                (relatedType.eObjectType != eSystemObjectType.eSubject &&
                relatedType.eObjectType != eSystemObjectType.eProject &&
                relatedType.eObjectType != eSystemObjectType.eActor &&
                relatedType.eObjectType != eSystemObjectType.eStakeholder))
                this.validHierarchy = false;
        } else { // if (eMode == eObjectGraphMode.eDescendents) { // allowable parents
            if (relatedType)
                this.validHierarchy = false;
        }

        /* istanbul ignore if */
        if (this.systemObjectProcessed.has(sourceType.idSystemObject))
            return false;

        /* istanbul ignore next */
        if (!this.systemObjectAdded.has(sourceType.idSystemObject)) {
            if (!this.unit)
                this.unit = [];
            this.unit.push(unit);
        }

        // no parents
        /* istanbul ignore else */
        if (eMode == eObjectGraphMode.eDescendents) { // children
            const subjectList: Subject[] | null = await Subject.fetchFromUnit(unit.idUnit);
            /* istanbul ignore else */
            if (subjectList) {
                for (const subject of subjectList) {
                    const SO: SystemObject | null = await SystemObject.fetchFromSubjectID(subject.idSubject);
                    /* istanbul ignore else */
                    if (SO)
                        this.systemObjectList.push(SO.idSystemObject);
                    else
                        LOG.logger.error(`Missing SystemObject for subject ${JSON.stringify(subject)}`);
                }
            }

            const actorList: Actor[] | null = await Actor.fetchFromUnit(unit.idUnit);
            /* istanbul ignore else */
            if (actorList) {
                for (const actor of actorList) {
                    const SO: SystemObject | null = await SystemObject.fetchFromActorID(actor.idActor);
                    /* istanbul ignore else */
                    if (SO)
                        this.systemObjectList.push(SO.idSystemObject);
                    else
                        LOG.logger.error(`Missing SystemObject for subject ${JSON.stringify(actor)}`);
                }
            }
        }

        return true;
    }
}

