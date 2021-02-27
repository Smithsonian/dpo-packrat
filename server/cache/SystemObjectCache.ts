import * as LOG from '../utils/logger';
import * as DBAPI from '../db';
import { CacheControl } from './CacheControl';
import { SystemObject, eSystemObjectType } from '../db';

export type ObjectIDAndType = {
    idObject: number;
    eObjectType: eSystemObjectType;
};

export type SystemObjectInfo = {
    idSystemObject: number;
    Retired: boolean;
};

export class SystemObjectCache {
    private static singleton: SystemObjectCache | null = null;

    private objectIDToSystemMap: Map<ObjectIDAndType, SystemObjectInfo> = new Map<ObjectIDAndType, SystemObjectInfo>(); // map of { idObject, eSystemObjectType } -> { idSystemObject, Retired }
    private systemIDToObjectMap: Map<number, ObjectIDAndType> = new Map<number, ObjectIDAndType>(); // map of idSystemObject -> { idObject, eSystemObjectType }

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
        LOG.logger.info('CACHE: SystemObjectCache.flushInternalWorker() start');
        // TODO: replace with paged output
        const SOFetch: SystemObject[] | null = await SystemObject.fetchAll(); /* istanbul ignore next */
        if (!SOFetch) {
            LOG.logger.error('SystemObjectCache.flushInternalWorker unable to fetch System Objects');
            return false;
        }

        for (const SO of SOFetch) {
            const oID: ObjectIDAndType | undefined = SystemObjectCache.convertSystemObjectToObjectID(SO); /* istanbul ignore else */
            if (oID) {
                this.objectIDToSystemMap.set(oID, { idSystemObject: SO.idSystemObject, Retired: SO.Retired });
                this.systemIDToObjectMap.set(SO.idSystemObject, oID);
            }
        }
        LOG.logger.info('CACHE: SystemObjectCache.flushInternalWorker() done');
        return true;
    }

    // **************************
    // Private Interface
    // **************************
    private async getSystemFromObjectIDInternal(oID: ObjectIDAndType): Promise<SystemObjectInfo | undefined> {
        let sID: SystemObjectInfo | undefined = this.objectIDToSystemMap.get(oID); /* istanbul ignore else */
        if (!sID) {  // if we have a cache miss, look it up
            let SO: SystemObject | null = null;
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
            }

            /* istanbul ignore else */
            if (SO) {
                sID = { idSystemObject: SO.idSystemObject, Retired: SO.Retired };
                this.objectIDToSystemMap.set(oID, sID);
                this.systemIDToObjectMap.set(SO.idSystemObject, oID);
            } else
                LOG.logger.error(`SystemObjectCache.getSystemFromObjectIDInternal unable to lookup ${eSystemObjectType[eObjectType]}, id ${idObject}`);
        }
        return sID;
    }

    private async getObjectFromSystemInternal(idSystemObject: number): Promise<ObjectIDAndType | undefined> {
        let oID: ObjectIDAndType | undefined = this.systemIDToObjectMap.get(idSystemObject);
        if (!oID) {
            const SO: SystemObject | null = await SystemObject.fetch(idSystemObject);
            let Retired: boolean = false;
            if (SO) {
                oID = SystemObjectCache.convertSystemObjectToObjectID(SO);
                Retired = SO.Retired;
            } else
                LOG.logger.error(`SystemObjectCache.getObjectFromSystemInternal unable to lookup idSystemObject ${idSystemObject}`);

            if (oID) {
                this.objectIDToSystemMap.set(oID, { idSystemObject, Retired });
                this.systemIDToObjectMap.set(idSystemObject, oID);
            }
        }
        return oID;
    }

    // **************************
    // Public Interface
    // **************************
    /**
     * Fetch { SystemObject.idSystemObject, Retired } for the specified database object
     * @param {number} idObject - database ID, such as Subject.idSubject or Unit.idUnit
     * @param eObjectType - object type, such as eSubject or eUnit
     */
    static async getSystemFromObjectID(oID: ObjectIDAndType): Promise<SystemObjectInfo | undefined> {
        return await (await this.getInstance()).getSystemFromObjectIDInternal(oID);
    }

    static async getSystemFromUnit(unit: DBAPI.Unit): Promise<SystemObjectInfo | undefined> {
        return await (await this.getInstance()).getSystemFromObjectIDInternal({ idObject: unit.idUnit, eObjectType: DBAPI.eSystemObjectType.eUnit });
    }

    static async getSystemFromProject(project: DBAPI.Project): Promise<SystemObjectInfo | undefined> {
        return await (await this.getInstance()).getSystemFromObjectIDInternal({ idObject: project.idProject, eObjectType: DBAPI.eSystemObjectType.eProject });
    }

    static async getSystemFromSubject(subject: DBAPI.Subject): Promise<SystemObjectInfo | undefined> {
        return await (await this.getInstance()).getSystemFromObjectIDInternal({ idObject: subject.idSubject, eObjectType: DBAPI.eSystemObjectType.eSubject });
    }

    static async getSystemFromItem(item: DBAPI.Item): Promise<SystemObjectInfo | undefined> {
        return await (await this.getInstance()).getSystemFromObjectIDInternal({ idObject: item.idItem, eObjectType: DBAPI.eSystemObjectType.eItem });
    }

    static async getSystemFromCaptureData(captureData: DBAPI.CaptureData): Promise<SystemObjectInfo | undefined> {
        return await (await this.getInstance()).getSystemFromObjectIDInternal({ idObject: captureData.idCaptureData, eObjectType: DBAPI.eSystemObjectType.eCaptureData });
    }

    static async getSystemFromModel(model: DBAPI.Model): Promise<SystemObjectInfo | undefined> {
        return await (await this.getInstance()).getSystemFromObjectIDInternal({ idObject: model.idModel, eObjectType: DBAPI.eSystemObjectType.eModel });
    }

    static async getSystemFromScene(scene: DBAPI.Scene): Promise<SystemObjectInfo | undefined> {
        return await (await this.getInstance()).getSystemFromObjectIDInternal({ idObject: scene.idScene, eObjectType: DBAPI.eSystemObjectType.eScene });
    }

    static async getSystemFromIntermediaryFile(intermediaryFile: DBAPI.IntermediaryFile): Promise<SystemObjectInfo | undefined> {
        return await (await this.getInstance()).getSystemFromObjectIDInternal({ idObject: intermediaryFile.idIntermediaryFile, eObjectType: DBAPI.eSystemObjectType.eIntermediaryFile });
    }

    static async getSystemFromProjectDocumentation(projectDocumentation: DBAPI.ProjectDocumentation): Promise<SystemObjectInfo | undefined> {
        return await (await this.getInstance()).getSystemFromObjectIDInternal({ idObject: projectDocumentation.idProjectDocumentation, eObjectType: DBAPI.eSystemObjectType.eProjectDocumentation });
    }

    static async getSystemFromAsset(asset: DBAPI.Asset): Promise<SystemObjectInfo | undefined> {
        return await (await this.getInstance()).getSystemFromObjectIDInternal({ idObject: asset.idAsset, eObjectType: DBAPI.eSystemObjectType.eAsset });
    }

    static async getSystemFromAssetVersion(assetVersion: DBAPI.AssetVersion): Promise<SystemObjectInfo | undefined> {
        return await (await this.getInstance()).getSystemFromObjectIDInternal({ idObject: assetVersion.idAssetVersion, eObjectType: DBAPI.eSystemObjectType.eAssetVersion });
    }

    static async getSystemFromActor(actor: DBAPI.Actor): Promise<SystemObjectInfo | undefined> {
        return await (await this.getInstance()).getSystemFromObjectIDInternal({ idObject: actor.idActor, eObjectType: DBAPI.eSystemObjectType.eActor });
    }

    static async getSystemFromStakeholder(stakeholder: DBAPI.Stakeholder): Promise<SystemObjectInfo | undefined> {
        return await (await this.getInstance()).getSystemFromObjectIDInternal({ idObject: stakeholder.idStakeholder, eObjectType: DBAPI.eSystemObjectType.eStakeholder });
    }

    /**
     * Fetches object ID and object type for the specified SystemObject.idSystemObject
     * @param idSystemObject SystemObject.idSystemObject to query
     */
    static async getObjectFromSystem(idSystemObject: number): Promise<ObjectIDAndType | undefined> {
        return await (await this.getInstance()).getObjectFromSystemInternal(idSystemObject);
    }

    public static convertSystemObjectToObjectID(SO: SystemObject | null): ObjectIDAndType | undefined {
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

        LOG.logger.error(`SystemObjectCache.convertSystemObjectToObjectID unable to interpret ${JSON.stringify(SO)}`);
        return undefined;
    }

    static async flush(): Promise<void> {
        SystemObjectCache.singleton = null;
        await this.getInstance();
    }

    static async clear(): Promise<void> {
        SystemObjectCache.singleton = null;
    }
}
