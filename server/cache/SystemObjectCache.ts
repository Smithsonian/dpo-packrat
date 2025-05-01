import * as DBAPI from '../db';
import { CacheControl } from './CacheControl';
import { SystemObject } from '../db';
import * as COMMON from '@dpo-packrat/common';
import { RecordKeeper as RK } from '../records/recordKeeper';

export class SystemObjectCache {
    private static singleton: SystemObjectCache | null = null;

    private objectIDToSystemMap: Map<string, DBAPI.SystemObjectInfo> = new Map<string, DBAPI.SystemObjectInfo>(); // map of `${idObject}|${eDBObjectType}` -> { idSystemObject, Retired }
    private systemIDToObjectMap: Map<number, DBAPI.ObjectIDAndType> = new Map<number, DBAPI.ObjectIDAndType>(); // map of idSystemObject -> { idObject, eDBObjectType }
    private systemIDToNameMap: Map<number, string> = new Map<number, string>(); // map of idSystemObject -> name

    // **************************
    // Boilerplate Implementation
    // **************************
    private constructor() { }

    private async flushInternal(): Promise<void> {
        for (let nTry: number = 1; nTry <= CacheControl.cacheBuildTries; nTry++) {
            /* istanbul ignore else */
            if (await this.flushInternalWorker())
                break;
        }
    }

    private static async getInstance(): Promise<SystemObjectCache> {
        if (!SystemObjectCache.singleton) {
            SystemObjectCache.singleton = new SystemObjectCache();
            await SystemObjectCache.singleton.flushInternal();
        }
        return SystemObjectCache.singleton;
    }

    // **************************
    // Cache Construction
    // **************************
    private static computeOIDKey(oID: DBAPI.ObjectIDAndType): string {
        return `${oID.idObject}|${oID.eObjectType}`;
    }

    private async flushInternalWorker(): Promise<boolean> {
        // TODO: replace with paged output
        const SOFetch: SystemObject[] | null = await SystemObject.fetchAll(); /* istanbul ignore next */
        if (!SOFetch) {
            RK.logError(RK.LogSection.eCACHE,'flush internal cache failed','unable to fetch system object',undefined,'SystemObjectCache');
            return false;
        }

        for (const SO of SOFetch) {
            const oID: DBAPI.ObjectIDAndType | undefined = SystemObjectCache.convertSystemObjectToObjectID(SO); /* istanbul ignore else */
            if (oID) {
                this.objectIDToSystemMap.set(SystemObjectCache.computeOIDKey(oID), { idSystemObject: SO.idSystemObject, Retired: SO.Retired });
                this.systemIDToObjectMap.set(SO.idSystemObject, oID);
            }
        }
        RK.logDebug(RK.LogSection.eCACHE,'flush internal cache success',undefined,undefined,'SystemObjectCache');
        return true;
    }

    // *************************
    // #region Private Interface
    // *************************
    private async getSystemFromObjectIDInternal(oID: DBAPI.ObjectIDAndType): Promise<DBAPI.SystemObjectInfo | undefined> {
        // Ensure that SystemObjectCache lookups by ObjectIDAndType use a cleaned object in case the caller has stuffed additional information in the object
        const oIDCleansed: DBAPI.ObjectIDAndType = { idObject: oID.idObject, eObjectType: oID.eObjectType };
        const oIDKey: string = SystemObjectCache.computeOIDKey(oIDCleansed);
        let sID: DBAPI.SystemObjectInfo | undefined = this.objectIDToSystemMap.get(oIDKey); /* istanbul ignore else */
        if (!sID) {  // if we have a cache miss, look it up
            let SO: SystemObject | null = null;
            let isASystemObject: boolean = true;
            const { idObject, eObjectType } = oID;
            switch (eObjectType) {
                case COMMON.eSystemObjectType.eUnit: SO = await SystemObject.fetchFromUnitID(idObject); break;
                case COMMON.eSystemObjectType.eProject: SO = await SystemObject.fetchFromProjectID(idObject); break;
                case COMMON.eSystemObjectType.eSubject: SO = await SystemObject.fetchFromSubjectID(idObject); break;
                case COMMON.eSystemObjectType.eItem: SO = await SystemObject.fetchFromItemID(idObject); break;
                case COMMON.eSystemObjectType.eCaptureData: SO = await SystemObject.fetchFromCaptureDataID(idObject); break;
                case COMMON.eSystemObjectType.eModel: SO = await SystemObject.fetchFromModelID(idObject); break;
                case COMMON.eSystemObjectType.eScene: SO = await SystemObject.fetchFromSceneID(idObject); break;
                case COMMON.eSystemObjectType.eIntermediaryFile: SO = await SystemObject.fetchFromIntermediaryFileID(idObject); break;
                case COMMON.eSystemObjectType.eProjectDocumentation: SO = await SystemObject.fetchFromProjectDocumentationID(idObject); break;
                case COMMON.eSystemObjectType.eAsset: SO = await SystemObject.fetchFromAssetID(idObject); break;
                case COMMON.eSystemObjectType.eAssetVersion: SO = await SystemObject.fetchFromAssetVersionID(idObject); break;
                case COMMON.eSystemObjectType.eActor: SO = await SystemObject.fetchFromActorID(idObject); break;
                case COMMON.eSystemObjectType.eStakeholder: SO = await SystemObject.fetchFromStakeholderID(idObject); break;
                default: isASystemObject = false; break;
            }

            /* istanbul ignore else */
            if (SO) {
                sID = { idSystemObject: SO.idSystemObject, Retired: SO.Retired };
                this.objectIDToSystemMap.set(oIDKey, sID);
                this.systemIDToObjectMap.set(SO.idSystemObject, oIDCleansed);
            } else if (!isASystemObject) {
                if (idObject) {
                    sID = { idSystemObject: 0, Retired: false };
                    // Avoid adding non-system objects to objectIDToSystemMap ... we end up with more than 2^24 entries in this map, which is the V8 limit for JS Maps
                    // LOG.info(`SystemObjectCache.getSystemFromObjectIDInternal stored idSystemObject 0 for ${JSON.stringify(oIDCleansed)}`, LOG.LS.eCACHE);
                    // this.objectIDToSystemMap.set(oIDKey, sID);
                }
            } else
                RK.logError(RK.LogSection.eCACHE,'get system object failed',`unable to lookup ${COMMON.eSystemObjectType[eObjectType]}`,{ idObject },'SystemObjectCache');
        }
        return sID;
    }

    private async getObjectFromSystemInternal(idSystemObject: number): Promise<DBAPI.ObjectIDAndType | undefined> {
        const oID: DBAPI.ObjectIDAndType | undefined = this.systemIDToObjectMap.get(idSystemObject);
        return oID ? oID : this.flushObjectWorker(idSystemObject);
    }

    private async getObjectAndSystemFromSystemInternal(idSystemObject: number): Promise<DBAPI.SystemObjectIDAndType | undefined> {
        const oID: DBAPI.ObjectIDAndType | undefined = await this.getObjectFromSystemInternal(idSystemObject);
        const sID: DBAPI.SystemObjectInfo | undefined = oID ? await this.getSystemFromObjectIDInternal(oID) : undefined;
        return (oID && sID) ? { oID, sID } : undefined;
    }

    private async getObjectNameInternal(SO: DBAPI.SystemObject): Promise<string | undefined> {
        let name: string | undefined = this.systemIDToNameMap.get(SO.idSystemObject);
        if (name)
            return name;
        name = await this.getObjectNameInternalWorker(SO);
        if (name)
            this.systemIDToNameMap.set(SO.idSystemObject, name);
        return name;
    }

    private async getObjectNameInternalWorker(SO: DBAPI.SystemObject): Promise<string | undefined> {
        const oID: DBAPI.ObjectIDAndType | undefined = await this.getObjectFromSystemInternal(SO.idSystemObject);
        if (!oID) /* istanbul ignore next */
            return undefined;

        switch (oID.eObjectType) {
            case COMMON.eSystemObjectType.eUnit: {
                const Unit = SO.idUnit ? await DBAPI.Unit.fetch(SO.idUnit) : /* istanbul ignore next */ null;
                return Unit ? Unit.Name : /* istanbul ignore next */ undefined;
            }
            case COMMON.eSystemObjectType.eProject: {
                const Project = SO.idProject ? await DBAPI.Project.fetch(SO.idProject) : /* istanbul ignore next */ null;
                return Project ? Project.Name : /* istanbul ignore next */ undefined;
            }
            case COMMON.eSystemObjectType.eSubject: {
                const Subject = SO.idSubject ? await DBAPI.Subject.fetch(SO.idSubject) : /* istanbul ignore next */ null;
                return Subject ? Subject.Name : /* istanbul ignore next */ undefined;
            }
            case COMMON.eSystemObjectType.eItem: {
                const Item = SO.idItem ? await DBAPI.Item.fetch(SO.idItem) : /* istanbul ignore next */ null;
                return Item ? Item.Name : /* istanbul ignore next */ undefined;
            }
            case COMMON.eSystemObjectType.eCaptureData: {
                const CaptureData = SO.idCaptureData ? await DBAPI.CaptureData.fetch(SO.idCaptureData) : /* istanbul ignore next */ null;
                return CaptureData ? CaptureData.Name : /* istanbul ignore next */ undefined;
            }
            case COMMON.eSystemObjectType.eModel: {
                const Model = SO.idModel ? await DBAPI.Model.fetch(SO.idModel) : /* istanbul ignore next */ null;
                return Model ? Model.Name : /* istanbul ignore next */ undefined;
            }
            case COMMON.eSystemObjectType.eScene: {
                const Scene = SO.idScene ? await DBAPI.Scene.fetch(SO.idScene) : /* istanbul ignore next */ null;
                return Scene ? Scene.Name : /* istanbul ignore next */ undefined;
            }
            case COMMON.eSystemObjectType.eIntermediaryFile: {
                const IntermediaryFile = SO.idIntermediaryFile ? await DBAPI.IntermediaryFile.fetch(SO.idIntermediaryFile) : /* istanbul ignore next */ null; /* istanbul ignore else */
                if (IntermediaryFile) {
                    const Asset = await DBAPI.Asset.fetch(IntermediaryFile.idAsset);
                    return Asset ? Asset.FileName : /* istanbul ignore next */ undefined;
                }
                return /* istanbul ignore next */ undefined;
            }
            case COMMON.eSystemObjectType.eProjectDocumentation: {
                const ProjectDocumentation = SO.idProjectDocumentation ? await DBAPI.ProjectDocumentation.fetch(SO.idProjectDocumentation) : /* istanbul ignore next */ null;
                return ProjectDocumentation ? ProjectDocumentation.Name : /* istanbul ignore next */ undefined;
            }
            case COMMON.eSystemObjectType.eAsset: {
                const Asset = SO.idAsset ? await DBAPI.Asset.fetch(SO.idAsset) : /* istanbul ignore next */ null;
                return Asset ? Asset.FileName : /* istanbul ignore next */ undefined;
            }
            case COMMON.eSystemObjectType.eAssetVersion: {
                const AssetVersion = SO.idAssetVersion ? await DBAPI.AssetVersion.fetch(SO.idAssetVersion) : /* istanbul ignore next */ null;
                return AssetVersion ? AssetVersion.FileName : /* istanbul ignore next */ undefined;
            }
            case COMMON.eSystemObjectType.eActor: {
                const Actor = SO.idActor ? await DBAPI.Actor.fetch(SO.idActor) : /* istanbul ignore next */ null;
                return Actor ? (Actor.IndividualName ?? undefined) : /* istanbul ignore next */ undefined;
            }
            case COMMON.eSystemObjectType.eStakeholder: {
                const Stakeholder = SO.idStakeholder ? await DBAPI.Stakeholder.fetch(SO.idStakeholder) : /* istanbul ignore next */ null;
                return Stakeholder ? Stakeholder.IndividualName : /* istanbul ignore next */ undefined;
            }
            default: /* istanbul ignore next */ return undefined;
        }
    }

    private async getObjectNameByIDInternal(idSystemObject: number): Promise<string | undefined> {
        const name: string | undefined = this.systemIDToNameMap.get(idSystemObject);
        if (name)
            return name;

        const SO: DBAPI.SystemObject | null = await DBAPI.SystemObject.fetch(idSystemObject);
        if (!SO) {
            RK.logError(RK.LogSection.eCACHE,'get object name failed','unable to lookup system object',{ idSystemObject },'SystemObjectCache');
            return undefined;
        }
        return this.getObjectNameInternal(SO);
    }

    private async flushObjectWorker(idSystemObject: number): Promise<DBAPI.ObjectIDAndType | undefined> {
        const SO: SystemObject | null = await SystemObject.fetch(idSystemObject);
        if (!SO) {
            RK.logError(RK.LogSection.eCACHE,'fl;ush object failed','unable to fetch system object',{ idSystemObject },'SystemObjectCache');
            return undefined;
        }

        const oID: DBAPI.ObjectIDAndType | undefined = SystemObjectCache.convertSystemObjectToObjectID(SO); /* istanbul ignore else */
        if (oID) {
            this.objectIDToSystemMap.set(SystemObjectCache.computeOIDKey(oID), { idSystemObject, Retired: SO.Retired });
            this.systemIDToObjectMap.set(idSystemObject, oID);
        }

        this.systemIDToNameMap.delete(idSystemObject);
        return oID;
    }
    // #endregion

    // **************************
    // #region Public Interface
    // **************************
    /**
     * Fetches object ID and object type for the specified SystemObject.idSystemObject
     * @param idSystemObject SystemObject.idSystemObject to query
     */
    static async getObjectFromSystem(idSystemObject: number): Promise<DBAPI.ObjectIDAndType | undefined> {
        return await (await this.getInstance()).getObjectFromSystemInternal(idSystemObject);
    }

    static async getObjectAndSystemFromSystem(idSystemObject: number): Promise<DBAPI.SystemObjectIDAndType | undefined> {
        return await (await this.getInstance()).getObjectAndSystemFromSystemInternal(idSystemObject);
    }

    static async getObjectName(SO: DBAPI.SystemObject): Promise<string | undefined> {
        return await (await this.getInstance()).getObjectNameInternal(SO);
    }

    static async getObjectNameByID(idSystemObject: number): Promise<string | undefined> {
        return await (await this.getInstance()).getObjectNameByIDInternal(idSystemObject);
    }

    /**
     * Fetch { SystemObject.idSystemObject, Retired } for the specified database object
     * @param {number} idObject - database ID, such as Subject.idSubject or Unit.idUnit
     * @param eObjectType - object type, such as eSubject or eUnit
     */
    static async getSystemFromObjectID(oID: DBAPI.ObjectIDAndType): Promise<DBAPI.SystemObjectInfo | undefined> {
        return await (await this.getInstance()).getSystemFromObjectIDInternal(oID);
    }

    static async getSystemFromUnit(unit: DBAPI.Unit): Promise<DBAPI.SystemObjectInfo | undefined> {
        return await (await this.getInstance()).getSystemFromObjectIDInternal({ idObject: unit.idUnit, eObjectType: COMMON.eSystemObjectType.eUnit });
    }

    static async getSystemFromProject(project: DBAPI.Project): Promise<DBAPI.SystemObjectInfo | undefined> {
        return await (await this.getInstance()).getSystemFromObjectIDInternal({ idObject: project.idProject, eObjectType: COMMON.eSystemObjectType.eProject });
    }

    static async getSystemFromSubject(subject: DBAPI.Subject): Promise<DBAPI.SystemObjectInfo | undefined> {
        return await (await this.getInstance()).getSystemFromObjectIDInternal({ idObject: subject.idSubject, eObjectType: COMMON.eSystemObjectType.eSubject });
    }

    static async getSystemFromItem(item: DBAPI.Item): Promise<DBAPI.SystemObjectInfo | undefined> {
        return await (await this.getInstance()).getSystemFromObjectIDInternal({ idObject: item.idItem, eObjectType: COMMON.eSystemObjectType.eItem });
    }

    static async getSystemFromCaptureData(captureData: DBAPI.CaptureData): Promise<DBAPI.SystemObjectInfo | undefined> {
        return await (await this.getInstance()).getSystemFromObjectIDInternal({ idObject: captureData.idCaptureData, eObjectType: COMMON.eSystemObjectType.eCaptureData });
    }

    static async getSystemFromModel(model: DBAPI.Model): Promise<DBAPI.SystemObjectInfo | undefined> {
        return await (await this.getInstance()).getSystemFromObjectIDInternal({ idObject: model.idModel, eObjectType: COMMON.eSystemObjectType.eModel });
    }

    static async getSystemFromScene(scene: DBAPI.Scene): Promise<DBAPI.SystemObjectInfo | undefined> {
        return await (await this.getInstance()).getSystemFromObjectIDInternal({ idObject: scene.idScene, eObjectType: COMMON.eSystemObjectType.eScene });
    }

    static async getSystemFromIntermediaryFile(intermediaryFile: DBAPI.IntermediaryFile): Promise<DBAPI.SystemObjectInfo | undefined> {
        return await (await this.getInstance()).getSystemFromObjectIDInternal({ idObject: intermediaryFile.idIntermediaryFile, eObjectType: COMMON.eSystemObjectType.eIntermediaryFile });
    }

    static async getSystemFromProjectDocumentation(projectDocumentation: DBAPI.ProjectDocumentation): Promise<DBAPI.SystemObjectInfo | undefined> {
        return await (await this.getInstance()).getSystemFromObjectIDInternal({ idObject: projectDocumentation.idProjectDocumentation, eObjectType: COMMON.eSystemObjectType.eProjectDocumentation });
    }

    static async getSystemFromAsset(asset: DBAPI.Asset): Promise<DBAPI.SystemObjectInfo | undefined> {
        return await (await this.getInstance()).getSystemFromObjectIDInternal({ idObject: asset.idAsset, eObjectType: COMMON.eSystemObjectType.eAsset });
    }

    static async getSystemFromAssetVersion(assetVersion: DBAPI.AssetVersion): Promise<DBAPI.SystemObjectInfo | undefined> {
        return await (await this.getInstance()).getSystemFromObjectIDInternal({ idObject: assetVersion.idAssetVersion, eObjectType: COMMON.eSystemObjectType.eAssetVersion });
    }

    static async getSystemFromActor(actor: DBAPI.Actor): Promise<DBAPI.SystemObjectInfo | undefined> {
        return await (await this.getInstance()).getSystemFromObjectIDInternal({ idObject: actor.idActor, eObjectType: COMMON.eSystemObjectType.eActor });
    }

    static async getSystemFromStakeholder(stakeholder: DBAPI.Stakeholder): Promise<DBAPI.SystemObjectInfo | undefined> {
        return await (await this.getInstance()).getSystemFromObjectIDInternal({ idObject: stakeholder.idStakeholder, eObjectType: COMMON.eSystemObjectType.eStakeholder });
    }

    static convertSystemObjectToObjectID(SO: SystemObject | null): DBAPI.ObjectIDAndType | undefined {
        if (!SO)
            return undefined;
        if (SO.idUnit) return { idObject: SO.idUnit, eObjectType: COMMON.eSystemObjectType.eUnit };
        else if (SO.idProject) return { idObject: SO.idProject, eObjectType: COMMON.eSystemObjectType.eProject };
        else if (SO.idSubject) return { idObject: SO.idSubject, eObjectType: COMMON.eSystemObjectType.eSubject };
        else if (SO.idItem) return { idObject: SO.idItem, eObjectType: COMMON.eSystemObjectType.eItem };
        else if (SO.idCaptureData) return { idObject: SO.idCaptureData, eObjectType: COMMON.eSystemObjectType.eCaptureData };
        else if (SO.idModel) return { idObject: SO.idModel, eObjectType: COMMON.eSystemObjectType.eModel };
        else if (SO.idScene) return { idObject: SO.idScene, eObjectType: COMMON.eSystemObjectType.eScene };
        else if (SO.idIntermediaryFile) return { idObject: SO.idIntermediaryFile, eObjectType: COMMON.eSystemObjectType.eIntermediaryFile };
        else if (SO.idProjectDocumentation) return { idObject: SO.idProjectDocumentation, eObjectType: COMMON.eSystemObjectType.eProjectDocumentation };
        else if (SO.idAsset) return { idObject: SO.idAsset, eObjectType: COMMON.eSystemObjectType.eAsset };
        else if (SO.idAssetVersion) return { idObject: SO.idAssetVersion, eObjectType: COMMON.eSystemObjectType.eAssetVersion };
        else if (SO.idActor) return { idObject: SO.idActor, eObjectType: COMMON.eSystemObjectType.eActor };
        else if (SO.idStakeholder) return { idObject: SO.idStakeholder, eObjectType: COMMON.eSystemObjectType.eStakeholder };

        RK.logError(RK.LogSection.eCACHE,'convert system object failed','unable to interpret',{ systemObject: SO },'SystemObjectCache');
        return undefined;
    }

    static async flush(): Promise<void> {
        SystemObjectCache.singleton = null;
        await this.getInstance();
    }

    static async clear(): Promise<void> {
        SystemObjectCache.singleton = null;
    }

    static async flushObject(idSystemObject: number): Promise<void> {
        await ((await this.getInstance()).flushObjectWorker(idSystemObject));
    }
    // #endregion
}
