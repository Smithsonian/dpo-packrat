import * as LOG from '../utils/logger';
import * as DBAPI from '../db';
import { CacheControl } from './CacheControl';
import { SystemObject, eSystemObjectType } from '../db';

export class SystemObjectCache {
    private static singleton: SystemObjectCache | null = null;

    private objectIDToSystemMap: Map<DBAPI.ObjectIDAndType, DBAPI.SystemObjectInfo> = new Map<DBAPI.ObjectIDAndType, DBAPI.SystemObjectInfo>(); // map of { idObject, eDBObjectType } -> { idSystemObject, Retired }
    private systemIDToObjectMap: Map<number, DBAPI.ObjectIDAndType> = new Map<number, DBAPI.ObjectIDAndType>(); // map of idSystemObject -> { idObject, eDBObjectType }

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
    private async flushInternalWorker(): Promise<boolean> {
        LOG.info('CACHE SystemObjectCache.flushInternalWorker() start', LOG.LS.eCACHE );
        // TODO: replace with paged output
        const SOFetch: SystemObject[] | null = await SystemObject.fetchAll(); /* istanbul ignore next */
        if (!SOFetch) {
            LOG.error('SystemObjectCache.flushInternalWorker unable to fetch System Objects', LOG.LS.eCACHE );
            return false;
        }

        for (const SO of SOFetch) {
            const oID: DBAPI.ObjectIDAndType | undefined = SystemObjectCache.convertSystemObjectToObjectID(SO); /* istanbul ignore else */
            if (oID) {
                this.objectIDToSystemMap.set(oID, { idSystemObject: SO.idSystemObject, Retired: SO.Retired });
                this.systemIDToObjectMap.set(SO.idSystemObject, oID);
            }
        }
        LOG.info('CACHE SystemObjectCache.flushInternalWorker() done', LOG.LS.eCACHE );
        return true;
    }

    // *************************
    // #region Private Interface
    // *************************
    private async getSystemFromObjectIDInternal(oID: DBAPI.ObjectIDAndType): Promise<DBAPI.SystemObjectInfo | undefined> {
        // Ensure that SystemObjectCache lookups by ObjectIDAndType use a cleaned object in case the caller has stuffed additional information in the object
        const oIDCleansed: DBAPI.ObjectIDAndType = { idObject: oID.idObject, eObjectType: oID.eObjectType };
        let sID: DBAPI.SystemObjectInfo | undefined = this.objectIDToSystemMap.get(oIDCleansed); /* istanbul ignore else */
        if (!sID) {  // if we have a cache miss, look it up
            let SO: SystemObject | null = null;
            let isASystemObject: boolean = true;
            const { idObject, eObjectType } = oID;
            switch (eObjectType) {
                case eSystemObjectType.eUnit: SO = await SystemObject.fetchFromUnitID(idObject); break;
                case eSystemObjectType.eProject: SO = await SystemObject.fetchFromProjectID(idObject); break;
                case eSystemObjectType.eSubject: SO = await SystemObject.fetchFromSubjectID(idObject); break;
                case eSystemObjectType.eItem: SO = await SystemObject.fetchFromItemID(idObject); break;
                case eSystemObjectType.eCaptureData: SO = await SystemObject.fetchFromCaptureDataID(idObject); break;
                case eSystemObjectType.eModel: SO = await SystemObject.fetchFromModelID(idObject); break;
                case eSystemObjectType.eScene: SO = await SystemObject.fetchFromSceneID(idObject); break;
                case eSystemObjectType.eIntermediaryFile: SO = await SystemObject.fetchFromIntermediaryFileID(idObject); break;
                case eSystemObjectType.eProjectDocumentation: SO = await SystemObject.fetchFromProjectDocumentationID(idObject); break;
                case eSystemObjectType.eAsset: SO = await SystemObject.fetchFromAssetID(idObject); break;
                case eSystemObjectType.eAssetVersion: SO = await SystemObject.fetchFromAssetVersionID(idObject); break;
                case eSystemObjectType.eActor: SO = await SystemObject.fetchFromActorID(idObject); break;
                case eSystemObjectType.eStakeholder: SO = await SystemObject.fetchFromStakeholderID(idObject); break;
                default: isASystemObject = false; break;
            }

            /* istanbul ignore else */
            if (SO) {
                sID = { idSystemObject: SO.idSystemObject, Retired: SO.Retired };
                this.objectIDToSystemMap.set(oIDCleansed, sID);
                this.systemIDToObjectMap.set(SO.idSystemObject, oIDCleansed);
            } else if (!isASystemObject) {
                if (idObject) {
                    LOG.info(`SystemObjectCache.getSystemFromObjectIDInternal storing idSystemObject 0 for ${JSON.stringify(oIDCleansed)}`, LOG.LS.eCACHE);
                    sID = { idSystemObject: 0, Retired: false };
                    this.objectIDToSystemMap.set(oIDCleansed, sID);
                }
            } else
                LOG.error(`SystemObjectCache.getSystemFromObjectIDInternal unable to lookup ${eSystemObjectType[eObjectType]}, id ${idObject}`, LOG.LS.eCACHE );
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
        const oID: DBAPI.ObjectIDAndType | undefined = await this.getObjectFromSystemInternal(SO.idSystemObject);
        if (!oID) /* istanbul ignore next */
            return undefined;

        switch (oID.eObjectType) {
            case eSystemObjectType.eUnit: {
                const Unit = SO.idUnit ? await DBAPI.Unit.fetch(SO.idUnit) : /* istanbul ignore next */ null;
                return Unit ? Unit.Name : /* istanbul ignore next */ undefined;
            }
            case eSystemObjectType.eProject: {
                const Project = SO.idProject ? await DBAPI.Project.fetch(SO.idProject) : /* istanbul ignore next */ null;
                return Project ? Project.Name : /* istanbul ignore next */ undefined;
            }
            case eSystemObjectType.eSubject: {
                const Subject = SO.idSubject ? await DBAPI.Subject.fetch(SO.idSubject) : /* istanbul ignore next */ null;
                return Subject ? Subject.Name : /* istanbul ignore next */ undefined;
            }
            case eSystemObjectType.eItem: {
                const Item = SO.idItem ? await DBAPI.Item.fetch(SO.idItem) : /* istanbul ignore next */ null;
                return Item ? Item.Name : /* istanbul ignore next */ undefined;
            }
            case eSystemObjectType.eCaptureData: {
                const CaptureData = SO.idCaptureData ? await DBAPI.CaptureData.fetch(SO.idCaptureData) : /* istanbul ignore next */ null;
                return CaptureData ? CaptureData.Name : /* istanbul ignore next */ undefined;
            }
            case eSystemObjectType.eModel: {
                const Model = SO.idModel ? await DBAPI.Model.fetch(SO.idModel) : /* istanbul ignore next */ null;
                return Model ? Model.Name : /* istanbul ignore next */ undefined;
            }
            case eSystemObjectType.eScene: {
                const Scene = SO.idScene ? await DBAPI.Scene.fetch(SO.idScene) : /* istanbul ignore next */ null;
                return Scene ? Scene.Name : /* istanbul ignore next */ undefined;
            }
            case eSystemObjectType.eIntermediaryFile: {
                const IntermediaryFile = SO.idIntermediaryFile ? await DBAPI.IntermediaryFile.fetch(SO.idIntermediaryFile) : /* istanbul ignore next */ null; /* istanbul ignore else */
                if (IntermediaryFile) {
                    const Asset = await DBAPI.Asset.fetch(IntermediaryFile.idAsset);
                    return Asset ? Asset.FileName : /* istanbul ignore next */ undefined;
                }
                return /* istanbul ignore next */ undefined;
            }
            case eSystemObjectType.eProjectDocumentation: {
                const ProjectDocumentation = SO.idProjectDocumentation ? await DBAPI.ProjectDocumentation.fetch(SO.idProjectDocumentation) : /* istanbul ignore next */ null;
                return ProjectDocumentation ? ProjectDocumentation.Name : /* istanbul ignore next */ undefined;
            }
            case eSystemObjectType.eAsset: {
                const Asset = SO.idAsset ? await DBAPI.Asset.fetch(SO.idAsset) : /* istanbul ignore next */ null;
                return Asset ? Asset.FileName : /* istanbul ignore next */ undefined;
            }
            case eSystemObjectType.eAssetVersion: {
                const AssetVersion = SO.idAssetVersion ? await DBAPI.AssetVersion.fetch(SO.idAssetVersion) : /* istanbul ignore next */ null;
                return AssetVersion ? AssetVersion.FileName : /* istanbul ignore next */ undefined;
            }
            case eSystemObjectType.eActor: {
                const Actor = SO.idActor ? await DBAPI.Actor.fetch(SO.idActor) : /* istanbul ignore next */ null;
                return Actor ? (Actor.IndividualName ?? undefined) : /* istanbul ignore next */ undefined;
            }
            case eSystemObjectType.eStakeholder: {
                const Stakeholder = SO.idStakeholder ? await DBAPI.Stakeholder.fetch(SO.idStakeholder) : /* istanbul ignore next */ null;
                return Stakeholder ? Stakeholder.IndividualName : /* istanbul ignore next */ undefined;
            }
            default: /* istanbul ignore next */ return undefined;
        }
    }

    private async flushObjectWorker(idSystemObject: number): Promise<DBAPI.ObjectIDAndType | undefined> {
        const SO: SystemObject | null = await SystemObject.fetch(idSystemObject);
        if (!SO) {
            LOG.error(`SystemObjectCache.getObjectFromSystemInternal unable to lookup idSystemObject ${idSystemObject}`, LOG.LS.eCACHE );
            return undefined;
        }

        const oID: DBAPI.ObjectIDAndType | undefined = SystemObjectCache.convertSystemObjectToObjectID(SO); /* istanbul ignore else */
        if (oID) {
            this.objectIDToSystemMap.set(oID, { idSystemObject, Retired: SO.Retired });
            this.systemIDToObjectMap.set(idSystemObject, oID);
        }
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
        const SO: DBAPI.SystemObject | null = await DBAPI.SystemObject.fetch(idSystemObject);
        if (!SO) {
            LOG.error(`SystemObjectCache.getObjectNameByID unable to lookup SystemObject for id ${idSystemObject}`, LOG.LS.eCACHE);
            return undefined;
        }
        return SystemObjectCache.getObjectName(SO);
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
        return await (await this.getInstance()).getSystemFromObjectIDInternal({ idObject: unit.idUnit, eObjectType: DBAPI.eSystemObjectType.eUnit });
    }

    static async getSystemFromProject(project: DBAPI.Project): Promise<DBAPI.SystemObjectInfo | undefined> {
        return await (await this.getInstance()).getSystemFromObjectIDInternal({ idObject: project.idProject, eObjectType: DBAPI.eSystemObjectType.eProject });
    }

    static async getSystemFromSubject(subject: DBAPI.Subject): Promise<DBAPI.SystemObjectInfo | undefined> {
        return await (await this.getInstance()).getSystemFromObjectIDInternal({ idObject: subject.idSubject, eObjectType: DBAPI.eSystemObjectType.eSubject });
    }

    static async getSystemFromItem(item: DBAPI.Item): Promise<DBAPI.SystemObjectInfo | undefined> {
        return await (await this.getInstance()).getSystemFromObjectIDInternal({ idObject: item.idItem, eObjectType: DBAPI.eSystemObjectType.eItem });
    }

    static async getSystemFromCaptureData(captureData: DBAPI.CaptureData): Promise<DBAPI.SystemObjectInfo | undefined> {
        return await (await this.getInstance()).getSystemFromObjectIDInternal({ idObject: captureData.idCaptureData, eObjectType: DBAPI.eSystemObjectType.eCaptureData });
    }

    static async getSystemFromModel(model: DBAPI.Model): Promise<DBAPI.SystemObjectInfo | undefined> {
        return await (await this.getInstance()).getSystemFromObjectIDInternal({ idObject: model.idModel, eObjectType: DBAPI.eSystemObjectType.eModel });
    }

    static async getSystemFromScene(scene: DBAPI.Scene): Promise<DBAPI.SystemObjectInfo | undefined> {
        return await (await this.getInstance()).getSystemFromObjectIDInternal({ idObject: scene.idScene, eObjectType: DBAPI.eSystemObjectType.eScene });
    }

    static async getSystemFromIntermediaryFile(intermediaryFile: DBAPI.IntermediaryFile): Promise<DBAPI.SystemObjectInfo | undefined> {
        return await (await this.getInstance()).getSystemFromObjectIDInternal({ idObject: intermediaryFile.idIntermediaryFile, eObjectType: DBAPI.eSystemObjectType.eIntermediaryFile });
    }

    static async getSystemFromProjectDocumentation(projectDocumentation: DBAPI.ProjectDocumentation): Promise<DBAPI.SystemObjectInfo | undefined> {
        return await (await this.getInstance()).getSystemFromObjectIDInternal({ idObject: projectDocumentation.idProjectDocumentation, eObjectType: DBAPI.eSystemObjectType.eProjectDocumentation });
    }

    static async getSystemFromAsset(asset: DBAPI.Asset): Promise<DBAPI.SystemObjectInfo | undefined> {
        return await (await this.getInstance()).getSystemFromObjectIDInternal({ idObject: asset.idAsset, eObjectType: DBAPI.eSystemObjectType.eAsset });
    }

    static async getSystemFromAssetVersion(assetVersion: DBAPI.AssetVersion): Promise<DBAPI.SystemObjectInfo | undefined> {
        return await (await this.getInstance()).getSystemFromObjectIDInternal({ idObject: assetVersion.idAssetVersion, eObjectType: DBAPI.eSystemObjectType.eAssetVersion });
    }

    static async getSystemFromActor(actor: DBAPI.Actor): Promise<DBAPI.SystemObjectInfo | undefined> {
        return await (await this.getInstance()).getSystemFromObjectIDInternal({ idObject: actor.idActor, eObjectType: DBAPI.eSystemObjectType.eActor });
    }

    static async getSystemFromStakeholder(stakeholder: DBAPI.Stakeholder): Promise<DBAPI.SystemObjectInfo | undefined> {
        return await (await this.getInstance()).getSystemFromObjectIDInternal({ idObject: stakeholder.idStakeholder, eObjectType: DBAPI.eSystemObjectType.eStakeholder });
    }

    static convertSystemObjectToObjectID(SO: SystemObject | null): DBAPI.ObjectIDAndType | undefined {
        if (!SO)
            return undefined;
        if (SO.idUnit) return { idObject: SO.idUnit, eObjectType: eSystemObjectType.eUnit };
        else if (SO.idProject) return { idObject: SO.idProject, eObjectType: eSystemObjectType.eProject };
        else if (SO.idSubject) return { idObject: SO.idSubject, eObjectType: eSystemObjectType.eSubject };
        else if (SO.idItem) return { idObject: SO.idItem, eObjectType: eSystemObjectType.eItem };
        else if (SO.idCaptureData) return { idObject: SO.idCaptureData, eObjectType: eSystemObjectType.eCaptureData };
        else if (SO.idModel) return { idObject: SO.idModel, eObjectType: eSystemObjectType.eModel };
        else if (SO.idScene) return { idObject: SO.idScene, eObjectType: eSystemObjectType.eScene };
        else if (SO.idIntermediaryFile) return { idObject: SO.idIntermediaryFile, eObjectType: eSystemObjectType.eIntermediaryFile };
        else if (SO.idProjectDocumentation) return { idObject: SO.idProjectDocumentation, eObjectType: eSystemObjectType.eProjectDocumentation };
        else if (SO.idAsset) return { idObject: SO.idAsset, eObjectType: eSystemObjectType.eAsset };
        else if (SO.idAssetVersion) return { idObject: SO.idAssetVersion, eObjectType: eSystemObjectType.eAssetVersion };
        else if (SO.idActor) return { idObject: SO.idActor, eObjectType: eSystemObjectType.eActor };
        else if (SO.idStakeholder) return { idObject: SO.idStakeholder, eObjectType: eSystemObjectType.eStakeholder };

        LOG.error(`SystemObjectCache.convertSystemObjectToObjectID unable to interpret ${JSON.stringify(SO)}`, LOG.LS.eCACHE );
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
