import { Actor, Asset, AssetVersion, CaptureData, IntermediaryFile, Item, Model,
    Project, ProjectDocumentation, Scene, Stakeholder, Subject, SystemObject,
    SystemObjectPairs, Unit, eSystemObjectType } from '../..';
import * as LOG from '../../../utils/logger';
import * as L from 'lodash';

type SystemObjectIDType = {
    idSystemObject: number,
    idObject: number,
    eType: eSystemObjectType
};

export class ObjectAncestry {
    idSystemObject: number = 0;
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
    systemObjectList: number[] = []; // array of idSystemObjects to be processed
    systemObjectMap: Map<number, SystemObjectIDType> = new Map<number, SystemObjectIDType>(); // map from idSystemObject -> { idSystemObject, id of database object, type of database object}

    constructor(idSystemObject: number) {
        this.idSystemObject = idSystemObject;
    }

    async fetch(): Promise<boolean> {
        if (!this.idSystemObject)
            return true;
        // LOG.logger.info(`OA: ${this.idSystemObject}`);
        return this.fetchWorker(null, this.idSystemObject);
    }

    // Expected types of hierarchies:
    // Unit -> Project -> Subject -> Item -> CaptureData / Model / Scene / IntermediaryFile
    // Unit -> Project -> ProjectDocumentation
    // Unit -> Subject -> Item -> CaptureData / Model / Scene / IntermediaryFile

    // SystemObjectXref allows us to model any graph of SystemObjects, including ones that
    // are cyclic and/or do not adhere to the expected object hierarchies described above.
    // This method will extract all ancestors, as well as look for invalid hierarchies and (invalid) cycles.

    private async fetchWorker(childType: SystemObjectIDType | null, idSystemObjectParent: number): Promise<boolean> {
        try {
            // detect cycle; if so, record and short-circuit
            if (childType && idSystemObjectParent == this.idSystemObject) {
                this.noCycles = false;
                this.validHierarchy = false;
                LOG.logger.error(`DBAPI.ObjectAncestry.fetchWorker Detected Cycle via ${idSystemObjectParent}`);
                return true;
            }

            // Determine what kind of object this is
            // push to the appropriate list
            // perform type-specific validity checks
            // gather explicitly related objects
            const parentType: SystemObjectIDType = {
                idSystemObject: idSystemObjectParent,
                idObject: 0,
                eType: eSystemObjectType.eUnknown
            };

            const SOP: SystemObjectPairs | null = await SystemObjectPairs.fetch(idSystemObjectParent);
            /* istanbul ignore next */
            if (!SOP) {
                LOG.logger.error(`DBAPI.ObjectAncestry.fetchWorker Unidentified SystemObject ${idSystemObjectParent}`);
                return true;
            } else {
                if (SOP.CaptureData && !await this.pushCaptureData(SOP.CaptureData, childType, parentType))
                    return true;
                else if (SOP.Model && !await this.pushModel(SOP.Model, childType, parentType))
                    return true;
                else if (SOP.Scene && !await this.pushScene(SOP.Scene, childType, parentType))
                    return true;
                else if (SOP.IntermediaryFile && !await this.pushIntermediaryFile(SOP.IntermediaryFile, childType, parentType))
                    return true;
                else if (SOP.ProjectDocumentation && !await this.pushProjectDocumentation(SOP.ProjectDocumentation, childType, parentType))
                    return true;
                else if (SOP.Scene && !await this.pushScene(SOP.Scene, childType, parentType))
                    return true;
                else if (SOP.Item && !await this.pushItem(SOP.Item, childType, parentType))
                    return true;
                else if (SOP.Subject && !await this.pushSubject(SOP.Subject, childType, parentType))
                    return true;
                else if (SOP.Project && !await this.pushProject(SOP.Project, childType, parentType))
                    return true;
                else if (SOP.Unit && !await this.pushUnit(SOP.Unit, childType, parentType))
                    return true;
                else if (SOP.Asset && !await this.pushAsset(SOP.Asset, childType, parentType))
                    return true;
                else if (SOP.AssetVersion && !await this.pushAssetVersion(SOP.AssetVersion, childType, parentType))
                    return true;
                else if (SOP.Actor && !await this.pushActor(SOP.Actor, childType, parentType))
                    return true;
                else if (SOP.Stakeholder && !await this.pushStakeholder(SOP.Stakeholder, childType, parentType))
                    return true;
            }

            /* istanbul ignore if */
            if (parentType.eType == eSystemObjectType.eUnknown)
                LOG.logger.error(`DBAPI.ObjectAncestry.fetchWorker Unidentified SystemObject type ${JSON.stringify(SOP)}`);

            // const valid: string = (this.validHierarchy ? '' : 'INVALID HIERARCHY ') + (this.noCycles ? '' : 'CYCLE ');
            // if (childType)
            //     LOG.logger.info(`OA: ${valid}${parentType.idSystemObject} ${eSystemObjectType[parentType.eType]} ${parentType.idObject} <- ${childType.idSystemObject} ${eSystemObjectType[childType.eType]} ${childType.idObject}`);
            // else
            //     LOG.logger.info(`OA: ${valid}${parentType.idSystemObject} ${eSystemObjectType[parentType.eType]} ${parentType.idObject} <- null child`);
            this.systemObjectMap.set(idSystemObjectParent, parentType);

            // gather using master systemobjectxref's
            const SOMaster: SystemObject[] | null = await SystemObject.fetchMasterFromXref(idSystemObjectParent);
            /* istanbul ignore else */
            if (SOMaster)
                for (const SO of SOMaster)
                    this.systemObjectList.push(SO.idSystemObject);

            // handle all gathered objects
            const AncestorList: number[] = L.clone(this.systemObjectList);
            this.systemObjectList = [];
            for (const idSystemObject of AncestorList) {
                /* istanbul ignore if */
                if (!await this.fetchWorker(parentType, idSystemObject))
                    return false;
            }

        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.ObjectAncestry.fetchWorker', error);
            return false;
        }

        return true;
    }

    private async pushActor(actor: Actor, childType: SystemObjectIDType | null, parentType: SystemObjectIDType): Promise<boolean> {
        parentType.idObject = actor.idActor;
        parentType.eType = eSystemObjectType.eActor;
        if (childType)
            this.validHierarchy = false;

        /* istanbul ignore if */
        if (this.systemObjectMap.has(parentType.idSystemObject))
            return true;

        /* istanbul ignore next */
        if (!this.actor)
            this.actor = [];
        this.actor.push(actor);

        /* istanbul ignore if */
        if (this.pushCount++ >= this.maxPushCount)
            return false;

        if (actor.idUnit) {
            const SO: SystemObject | null = await SystemObject.fetchFromUnitID(actor.idUnit);
            /* istanbul ignore else */
            if (SO)
                this.systemObjectList.push(SO.idSystemObject);
            else
                LOG.logger.error(`Missing SystemObject for unit ${actor.idUnit} linked from ${JSON.stringify(actor)}`);
        }
        return true;
    }

    private async pushAsset(asset: Asset, childType: SystemObjectIDType | null, parentType: SystemObjectIDType): Promise<boolean> {
        parentType.idObject = asset.idAsset;
        parentType.eType = eSystemObjectType.eAsset;
        if (childType && childType.eType != eSystemObjectType.eAssetVersion)
            this.validHierarchy = false;

        /* istanbul ignore if */
        if (this.systemObjectMap.has(parentType.idSystemObject))
            return true;

        /* istanbul ignore next */
        if (!this.asset)
            this.asset = [];
        this.asset.push(asset);

        /* istanbul ignore if */
        if (this.pushCount++ >= this.maxPushCount)
            return false;

        // Follow link from asset back to owning system object
        /* istanbul ignore else */
        if (asset.idSystemObject)
            this.systemObjectList.push(asset.idSystemObject);
        return true;
    }

    private async pushAssetVersion(assetVersion: AssetVersion, childType: SystemObjectIDType | null, parentType: SystemObjectIDType): Promise<boolean> {
        parentType.idObject = assetVersion.idAsset;
        parentType.eType = eSystemObjectType.eAssetVersion;
        if (childType)
            this.validHierarchy = false;

        /* istanbul ignore if */
        if (this.systemObjectMap.has(parentType.idSystemObject))
            return true;

        /* istanbul ignore next */
        if (!this.assetVersion)
            this.assetVersion = [];
        this.assetVersion.push(assetVersion);

        /* istanbul ignore if */
        if (this.pushCount++ >= this.maxPushCount)
            return false;

        const SO: SystemObject | null = await SystemObject.fetchFromAssetID(assetVersion.idAsset);
        /* istanbul ignore else */
        if (SO)
            this.systemObjectList.push(SO.idSystemObject);
        else
            LOG.logger.error(`Missing SystemObject for asset ${assetVersion.idAsset} linked from ${JSON.stringify(assetVersion)}`);
        return true;
    }

    private async pushCaptureData(captureData: CaptureData, childType: SystemObjectIDType | null, parentType: SystemObjectIDType): Promise<boolean> {
        parentType.idObject = captureData.idCaptureData;
        parentType.eType = eSystemObjectType.eCaptureData;
        if (childType &&
            (childType.eType != eSystemObjectType.eAsset &&
             childType.eType != eSystemObjectType.eModel &&
             childType.eType != eSystemObjectType.eActor))
            this.validHierarchy = false;

        /* istanbul ignore if */
        if (this.systemObjectMap.has(parentType.idSystemObject))
            return true;

        if (!this.captureData)
            this.captureData = [];
        this.captureData.push(captureData);

        /* istanbul ignore if */
        if (this.pushCount++ >= this.maxPushCount)
            return false;
        return true;
    }

    private async pushIntermediaryFile(intermediaryFile: IntermediaryFile, childType: SystemObjectIDType | null, parentType: SystemObjectIDType): Promise<boolean> {
        parentType.idObject = intermediaryFile.idIntermediaryFile;
        parentType.eType = eSystemObjectType.eIntermediaryFile;
        if (childType &&
            (childType.eType != eSystemObjectType.eAsset &&
             childType.eType != eSystemObjectType.eActor))
            this.validHierarchy = false;

        /* istanbul ignore if */
        if (this.systemObjectMap.has(parentType.idSystemObject))
            return true;

        /* istanbul ignore else */
        if (!this.intermediaryFile)
            this.intermediaryFile = [];
        this.intermediaryFile.push(intermediaryFile);

        /* istanbul ignore if */
        if (this.pushCount++ >= this.maxPushCount)
            return false;
        return true;
    }

    private async pushItem(item: Item, childType: SystemObjectIDType | null, parentType: SystemObjectIDType): Promise<boolean> {
        parentType.idObject = item.idItem;
        parentType.eType = eSystemObjectType.eItem;
        if (childType &&
            (childType.eType != eSystemObjectType.eAsset &&
             childType.eType != eSystemObjectType.eCaptureData &&
             childType.eType != eSystemObjectType.eModel &&
             childType.eType != eSystemObjectType.eScene &&
             childType.eType != eSystemObjectType.eIntermediaryFile))
            this.validHierarchy = false;

        /* istanbul ignore if */
        if (this.systemObjectMap.has(parentType.idSystemObject))
            return true;

        if (!this.item)
            this.item = [];
        this.item.push(item);

        /* istanbul ignore if */
        if (this.pushCount++ >= this.maxPushCount)
            return false;
        return true;
    }

    private async pushModel(model: Model, childType: SystemObjectIDType | null, parentType: SystemObjectIDType): Promise<boolean> {
        parentType.idObject = model.idModel;
        parentType.eType = eSystemObjectType.eModel;
        if (childType &&
            (childType.eType != eSystemObjectType.eAsset &&
             childType.eType != eSystemObjectType.eScene &&
             childType.eType != eSystemObjectType.eModel &&
             childType.eType != eSystemObjectType.eActor))
            this.validHierarchy = false;

        /* istanbul ignore if */
        if (this.systemObjectMap.has(parentType.idSystemObject))
            return true;

        if (!this.model)
            this.model = [];
        this.model.push(model);

        /* istanbul ignore if */
        if (this.pushCount++ >= this.maxPushCount)
            return false;
        return true;
    }

    private async pushProject(project: Project, childType: SystemObjectIDType | null, parentType: SystemObjectIDType): Promise<boolean> {
        parentType.idObject = project.idProject;
        parentType.eType = eSystemObjectType.eProject;
        if (childType &&
            (childType.eType != eSystemObjectType.eSubject &&
             childType.eType != eSystemObjectType.eProjectDocumentation &&
             childType.eType != eSystemObjectType.eStakeholder))
            this.validHierarchy = false;

        /* istanbul ignore if */
        if (this.systemObjectMap.has(parentType.idSystemObject))
            return true;

        if (!this.project)
            this.project = [];
        this.project.push(project);

        /* istanbul ignore if */
        if (this.pushCount++ >= this.maxPushCount)
            return false;
        return true;
    }

    private async pushProjectDocumentation(projectDocumentation: ProjectDocumentation, childType: SystemObjectIDType | null, parentType: SystemObjectIDType): Promise<boolean> {
        parentType.idObject = projectDocumentation.idProjectDocumentation;
        parentType.eType = eSystemObjectType.eProjectDocumentation;
        if (childType && childType.eType != eSystemObjectType.eAsset)
            this.validHierarchy = false;

        /* istanbul ignore if */
        if (this.systemObjectMap.has(parentType.idSystemObject))
            return true;

        /* istanbul ignore else */
        if (!this.projectDocumentation)
            this.projectDocumentation = [];
        this.projectDocumentation.push(projectDocumentation);

        /* istanbul ignore if */
        if (this.pushCount++ >= this.maxPushCount)
            return false;

        const SO: SystemObject | null = await SystemObject.fetchFromProjectID(projectDocumentation.idProject);
        /* istanbul ignore else */
        if (SO)
            this.systemObjectList.push(SO.idSystemObject);
        else
            LOG.logger.error(`Missing SystemObject for project ${projectDocumentation.idProject} linked from ${JSON.stringify(projectDocumentation)}`);

        return true;
    }

    private async pushScene(scene: Scene, childType: SystemObjectIDType | null, parentType: SystemObjectIDType): Promise<boolean> {
        parentType.idObject = scene.idScene;
        parentType.eType = eSystemObjectType.eScene;
        if (childType &&
            (childType.eType != eSystemObjectType.eAsset &&
             childType.eType != eSystemObjectType.eModel &&
             childType.eType != eSystemObjectType.eActor))
            this.validHierarchy = false;

        /* istanbul ignore if */
        if (this.systemObjectMap.has(parentType.idSystemObject))
            return true;

        if (!this.scene)
            this.scene = [];
        this.scene.push(scene);

        /* istanbul ignore if */
        if (this.pushCount++ >= this.maxPushCount)
            return false;
        return true;
    }

    private async pushStakeholder(stakeholder: Stakeholder, childType: SystemObjectIDType | null, parentType: SystemObjectIDType): Promise<boolean> {
        parentType.idObject = stakeholder.idStakeholder;
        parentType.eType = eSystemObjectType.eStakeholder;
        if (childType)
            this.validHierarchy = false;

        /* istanbul ignore if */
        if (this.systemObjectMap.has(parentType.idSystemObject))
            return true;

        /* istanbul ignore else */
        if (!this.stakeholder)
            this.stakeholder = [];
        this.stakeholder.push(stakeholder);

        /* istanbul ignore if */
        if (this.pushCount++ >= this.maxPushCount)
            return false;
        return true;
    }

    private async pushSubject(subject: Subject, childType: SystemObjectIDType | null, parentType: SystemObjectIDType): Promise<boolean> {
        parentType.idObject = subject.idSubject;
        parentType.eType = eSystemObjectType.eSubject;
        if (childType &&
            (childType.eType != eSystemObjectType.eAsset &&
             childType.eType != eSystemObjectType.eItem))
            this.validHierarchy = false;

        /* istanbul ignore if */
        if (this.systemObjectMap.has(parentType.idSystemObject))
            return true;

        if (!this.subject)
            this.subject = [];
        this.subject.push(subject);

        /* istanbul ignore if */
        if (this.pushCount++ >= this.maxPushCount)
            return false;

        const SO: SystemObject | null = await SystemObject.fetchFromUnitID(subject.idUnit);
        /* istanbul ignore else */
        if (SO)
            this.systemObjectList.push(SO.idSystemObject);
        else
            LOG.logger.error(`Missing SystemObject for unit ${subject.idUnit} linked from ${JSON.stringify(subject)}`);

        return true;
    }

    private async pushUnit(unit: Unit, childType: SystemObjectIDType | null, parentType: SystemObjectIDType): Promise<boolean> {
        parentType.idObject = unit.idUnit;
        parentType.eType = eSystemObjectType.eUnit;
        if (childType &&
            (childType.eType != eSystemObjectType.eSubject &&
             childType.eType != eSystemObjectType.eProject &&
             childType.eType != eSystemObjectType.eActor &&
             childType.eType != eSystemObjectType.eStakeholder))
            this.validHierarchy = false;

        /* istanbul ignore if */
        if (this.systemObjectMap.has(parentType.idSystemObject))
            return true;

        if (!this.unit)
            this.unit = [];
        this.unit.push(unit);

        /* istanbul ignore if */
        if (this.pushCount++ >= this.maxPushCount)
            return false;
        return true;
    }
}

