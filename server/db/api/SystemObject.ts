/* eslint-disable camelcase */
import * as P from '@prisma/client';
import { Prisma } from '@prisma/client';
import { WorkflowStep } from '..';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';
// import * as H from '../../utils/helpers';
import { eEventKey } from '../../event/interface/EventEnums';

export interface SystemObjectBased {
    fetchSystemObject(): Promise<SystemObject | null>;
}

export class SystemObject extends DBC.DBObject<P.SystemObject> implements P.SystemObject {
    idSystemObject!: number;
    idUnit!: number | null;
    idProject!: number | null;
    idSubject!: number | null;
    idItem!: number | null;
    idCaptureData!: number | null;
    idModel!: number | null;
    idScene!: number | null;
    idIntermediaryFile!: number | null;
    idAsset!: number | null;
    idAssetVersion!: number | null;
    idProjectDocumentation!: number | null;
    idActor!: number | null;
    idStakeholder!: number | null;
    Retired!: boolean;

    constructor(input: P.SystemObject) {
        super(input);
    }

    public fetchTableName(): string { return 'SystemObject'; }
    public fetchID(): number { return this.idSystemObject; }

    // NO EXPLICIT METHODS FOR CREATING OR UPDATING SYSTEMOBJECT DIRECTLY.
    // This is done via create* and update* methods of the objects linked to SystemObject
    protected async createWorker(): Promise<boolean> {
        throw new ReferenceError('DBAPI.SystemObject.create() should never be called; used the explict create methods of objects linked to SystemObject');
    }

    protected async updateWorker(): Promise<boolean> {
        throw new ReferenceError('DBAPI.SystemObject.update() should never be called; used the explict update methods of objects linked to SystemObject');
    }

    static async retireSystemObject(SOBased: SystemObjectBased): Promise<boolean> {
        const SO: SystemObject | null = await SOBased.fetchSystemObject();
        return (SO != null) ? await SO.retireObject() : /* istanbul ignore next */ false;
    }

    static async reinstateSystemObject(SOBased: SystemObjectBased): Promise<boolean> {
        const SO: SystemObject | null = await SOBased.fetchSystemObject();
        return (SO != null) ? await SO.reinstateObject() : /* istanbul ignore next */ false;
    }

    async retireObject(): Promise<boolean> {
        if (this.Retired)
            return true;
        this.Retired = true;
        return this.updateRetired();
    }

    async reinstateObject(): Promise<boolean> {
        if (!this.Retired)
            return true;
        this.Retired = false;
        return this.updateRetired();
    }

    private async updateRetired(): Promise<boolean> {
        try {
            this.audit(eEventKey.eDBUpdate); // don't await, allow this to continue asynchronously
            const { idSystemObject, Retired } = this;
            const retValue: boolean = await DBC.DBConnection.prisma.systemObject.update({
                where: { idSystemObject, },
                data: {
                    Retired
                },
            }) ? true : /* istanbul ignore next */ false;
            return retValue;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.SystemObject.updateRetired', LOG.LS.eDB, error);
            return false;
        }
    }

    static async fetch(idSystemObject: number): Promise<SystemObject | null> {
        if (!idSystemObject)
            return null;
        try {
            return DBC.CopyObject<P.SystemObject, SystemObject>(
                await DBC.DBConnection.prisma.systemObject.findUnique({ where: { idSystemObject, }, }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.SystemObject.fetch', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchAll(): Promise<SystemObject[] | null> {
        try {
            return DBC.CopyArray<P.SystemObject, SystemObject>(
                await DBC.DBConnection.prisma.systemObject.findMany(), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.SystemObject.fetchAll', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchDerivedFromXref(idSystemObjectMaster: number): Promise<SystemObject[] | null> {
        if (!idSystemObjectMaster)
            return null;
        try {
            return DBC.CopyArray<P.SystemObject, SystemObject>(
                await DBC.DBConnection.prisma.systemObject.findMany({
                    where: {
                        SystemObjectXref_SystemObjectToSystemObjectXref_idSystemObjectDerived: {
                            some: { idSystemObjectMaster },
                        },
                    },
                }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.SystemObject.fetchDerivedFromXref', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchMasterFromXref(idSystemObjectDerived: number): Promise<SystemObject[] | null> {
        if (!idSystemObjectDerived)
            return null;
        try {
            return DBC.CopyArray<P.SystemObject, SystemObject>(
                await DBC.DBConnection.prisma.systemObject.findMany({
                    where: {
                        SystemObjectXref_SystemObjectToSystemObjectXref_idSystemObjectMaster: {
                            some: { idSystemObjectDerived },
                        },
                    },
                }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.SystemObject.fetchMasterFromXref', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchWorkflowStepFromXref(idSystemObject: number): Promise<WorkflowStep[] | null> {
        if (!idSystemObject)
            return null;
        try {
            return DBC.CopyArray<P.WorkflowStep, WorkflowStep>(
                await DBC.DBConnection.prisma.workflowStep.findMany({
                    where: {
                        WorkflowStepSystemObjectXref: {
                            some: { idSystemObject },
                        },
                    },
                }), WorkflowStep);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.SystemObject.fetchWorkflowStepFromXref', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchFromActorID(idActor: number): Promise<SystemObject | null> {
        if (!idActor)
            return null;
        try {
            return DBC.CopyObject<P.SystemObject, SystemObject>(
                await DBC.DBConnection.prisma.systemObject.findUnique({ where: { idActor } }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.SystemObject.fetchSystemObjectFromActor', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchFromAssetID(idAsset: number): Promise<SystemObject | null> {
        if (!idAsset)
            return null;
        try {
            return DBC.CopyObject<P.SystemObject, SystemObject>(
                await DBC.DBConnection.prisma.systemObject.findUnique({ where: { idAsset } }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.SystemObject.fetchSystemObjectFromAsset', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchFromAssetVersionID(idAssetVersion: number): Promise<SystemObject | null> {
        if (!idAssetVersion)
            return null;
        try {
            return DBC.CopyObject<P.SystemObject, SystemObject>(
                await DBC.DBConnection.prisma.systemObject.findUnique({ where: { idAssetVersion } }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.SystemObject.fetchSystemObjectFromAssetVersion', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchFromCaptureDataID(idCaptureData: number): Promise<SystemObject | null> {
        if (!idCaptureData)
            return null;
        try {
            return DBC.CopyObject<P.SystemObject, SystemObject>(
                await DBC.DBConnection.prisma.systemObject.findUnique({ where: { idCaptureData } }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.SystemObject.fetchSystemObjectFromCaptureData', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchFromIntermediaryFileID(idIntermediaryFile: number): Promise<SystemObject | null> {
        if (!idIntermediaryFile)
            return null;
        try {
            return DBC.CopyObject<P.SystemObject, SystemObject>(
                await DBC.DBConnection.prisma.systemObject.findUnique({ where: { idIntermediaryFile } }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.SystemObject.fetchSystemObjectFromIntermediaryFile', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchFromItemID(idItem: number): Promise<SystemObject | null> {
        if (!idItem)
            return null;
        try {
            return DBC.CopyObject<P.SystemObject, SystemObject>(
                await DBC.DBConnection.prisma.systemObject.findUnique({ where: { idItem } }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.SystemObject.fetchSystemObjectFromItem', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchFromModelID(idModel: number): Promise<SystemObject | null> {
        if (!idModel)
            return null;
        try {
            return DBC.CopyObject<P.SystemObject, SystemObject>(
                await DBC.DBConnection.prisma.systemObject.findUnique({ where: { idModel } }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.SystemObject.fetchSystemObjectFromModel', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchFromProjectID(idProject: number): Promise<SystemObject | null> {
        if (!idProject)
            return null;
        try {
            return DBC.CopyObject<P.SystemObject, SystemObject>(
                await DBC.DBConnection.prisma.systemObject.findUnique({ where: { idProject } }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.SystemObject.fetchSystemObjectFromProject', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchFromProjectDocumentationID(idProjectDocumentation: number): Promise<SystemObject | null> {
        if (!idProjectDocumentation)
            return null;
        try {
            return DBC.CopyObject<P.SystemObject, SystemObject>(
                await DBC.DBConnection.prisma.systemObject.findUnique({ where: { idProjectDocumentation } }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.SystemObject.fetchSystemObjectFromProjectDocumentation', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchFromSceneID(idScene: number): Promise<SystemObject | null> {
        if (!idScene)
            return null;
        try {
            return DBC.CopyObject<P.SystemObject, SystemObject>(
                await DBC.DBConnection.prisma.systemObject.findUnique({ where: { idScene } }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.SystemObject.fetchSystemObjectFromScene', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchFromStakeholderID(idStakeholder: number): Promise<SystemObject | null> {
        if (!idStakeholder)
            return null;
        try {
            return DBC.CopyObject<P.SystemObject, SystemObject>(
                await DBC.DBConnection.prisma.systemObject.findUnique({ where: { idStakeholder } }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.SystemObject.fetchSystemObjectFromStakeholder', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchFromSubjectID(idSubject: number): Promise<SystemObject | null> {
        if (!idSubject)
            return null;
        try {
            return DBC.CopyObject<P.SystemObject, SystemObject>(
                await DBC.DBConnection.prisma.systemObject.findUnique({ where: { idSubject } }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.SystemObject.fetchSystemObjectFromSubject', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchFromUnitID(idUnit: number): Promise<SystemObject | null> {
        if (!idUnit)
            return null;
        try {
            return DBC.CopyObject<P.SystemObject, SystemObject>(
                await DBC.DBConnection.prisma.systemObject.findUnique({ where: { idUnit } }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.SystemObject.fetchSystemObjectFromUnit', LOG.LS.eDB, error);
            return null;
        }
    }

    /** Returns list of idSystemObject's affected by update to any of the specified idAssets.
     * Find SystemObjects whose current SystemObjectVersion points at
     * the most recent AssetVersion of any of the specified Assets.
     *
     * Note: this method should be called before ingestion adds updated asset versions for
     * the specified assets!
     */
    static async computeAffectedByUpdate(idAssets: number[]): Promise<Set<number> | null> {
        /* istanbul ignore if */
        if (!idAssets)
            return null;
        try {
            // LOG.info(`SystemObject.computeAffectedByUpdate(${JSON.stringify(idAssets)})`, LOG.LS.eDB);
            const SOInfo: [{ idSystemObject: number, idAsset: number }] =
                await DBC.DBConnection.prisma.$queryRaw<[{ idSystemObject: number, idAsset: number }]>`
                WITH
                _MaxVersion (idAsset, Version) AS (
                     SELECT idAsset, MAX(Version)
                     FROM AssetVersion
                     WHERE idAsset IN (${Prisma.join(idAssets)})
                     GROUP BY idAsset
                     HAVING MAX(Version) > 0
                ),
                _MaxAssetVersion (idAssetVersion, idAsset) AS (
                    SELECT DISTINCT AV.idAssetVersion, AV.idAsset
                    FROM AssetVersion AS AV
                    JOIN _MaxVersion AS MV ON (AV.idAsset = MV.idAsset AND AV.Version = MV.Version)
                ),
                _CurrentSOV (idSystemObject, idSystemObjectVersion) AS (
                    SELECT SOV.idSystemObject, MAX(SOV.idSystemObjectVersion) AS 'idSystemObjectVersion'
                    FROM SystemObjectVersionAssetVersionXref AS SOVAVX
                    JOIN SystemObjectVersion AS SOV ON (SOVAVX.idSystemObjectVersion = SOV.idSystemObjectVersion)
                    GROUP BY SOV.idSystemObject
                )
                SELECT SOV.idSystemObject, MAV.idAsset
                FROM _MaxAssetVersion AS MAV
                JOIN SystemObjectVersionAssetVersionXref AS SOVAVX ON (MAV.idAssetVersion = SOVAVX.idAssetVersion)
                JOIN _CurrentSOV AS SOV ON (SOVAVX.idSystemObjectVersion = SOV.idSystemObjectVersion)`;
            /* istanbul ignore next */
            if (!SOInfo)
                return null;
            const idSystemObjects: Set<number> = new Set<number>();
            for (const { idSystemObject } of SOInfo)
                idSystemObjects.add(idSystemObject);
            // LOG.info(`SystemObject.computeAffectedByUpdate(${JSON.stringify(idAssets)}) = ${JSON.stringify(idSystemObjects, H.Helpers.saferStringify)}`, LOG.LS.eDB);
            return idSystemObjects;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.SystemObject.computeAffectedByUpdate', LOG.LS.eDB, error);
            return null;
        }
    }
}