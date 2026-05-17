/* eslint-disable camelcase */
import * as P from '@prisma/client';
import { Prisma } from '@prisma/client';
import { WorkflowStep } from '..';
import * as DBC from '../connection';
import * as H from '../../utils/helpers';
import { eEventKey } from '../../event/interface/EventEnums';
import { RecordKeeper as RK  } from '../../records/recordKeeper';
import { withAuditTransaction } from '../../audit/withAuditTransaction';
import { AuditFactory } from '../../audit/interface/AuditFactory';
import { Actor } from '../../audit/Actor';
import { ASL } from '../../utils/localStore';
import { eAuditType, eNonSystemObjectType } from './ObjectType';

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

    /**
     * Optional context for a retire or reinstate write. When `reason` is set,
     * a semantic eActionRetire / eActionReinstate audit row is emitted in
     * addition to the base eDBUpdate. parentAuditId links a cascade child to
     * the root retire's audit row so the retirement tree can be reconstructed
     * from the Audit table.
     */
    static retirementContext: {
        actor?: Actor;
        reason?: string | null;
        parentAuditId?: number | null;
    };

    /**
     * Result of a retire that wrote a semantic audit row; surfaced so a
     * caller running a cascade can thread the resulting idAudit into each
     * child's retirement as parentRetirement.idAudit.
     */
    async retireObjectWithContext(ctx?: { actor?: Actor; reason?: string | null; parentAuditId?: number | null }):
    Promise<{ success: boolean; idAudit: number | null }> {
        if (this.Retired) return { success: true, idAudit: null };
        this.Retired = true;
        return this.updateRetiredWithContext(eAuditType.eActionRetire, ctx);
    }

    async reinstateObjectWithContext(ctx?: { actor?: Actor; reason?: string | null; parentAuditId?: number | null }):
    Promise<{ success: boolean; idAudit: number | null }> {
        if (!this.Retired) return { success: true, idAudit: null };
        this.Retired = false;
        return this.updateRetiredWithContext(eAuditType.eActionReinstate, ctx);
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
        const { success } = await this.retireObjectWithContext();
        return success;
    }

    async reinstateObject(): Promise<boolean> {
        const { success } = await this.reinstateObjectWithContext();
        return success;
    }

    private async updateRetiredWithContext(
        semanticAction: eAuditType.eActionRetire | eAuditType.eActionReinstate,
        ctx?: { actor?: Actor; reason?: string | null; parentAuditId?: number | null },
    ): Promise<{ success: boolean; idAudit: number | null }> {
        // Atomic: the Retired flag flip, the base eDBUpdate audit, and the
        // semantic eActionRetire/eActionReinstate row all commit together.
        try {
            let idAuditOut: number | null = null;
            const success = await withAuditTransaction(async () => {
                await this.audit(eEventKey.eDBUpdate);
                const { idSystemObject, Retired } = this;
                const updated = await DBC.DBConnection.prisma.systemObject.update({
                    where: { idSystemObject },
                    data: { Retired },
                });
                if (!updated) return false;

                // Emit the semantic row only when the caller provided context;
                // callers that went through the legacy no-arg path get the
                // prior behavior (just the eDBUpdate row).
                const hasContext = !!(ctx && (ctx.actor || ctx.reason || ctx.parentAuditId != null));
                if (hasContext) {
                    const actor: Actor | undefined = ctx?.actor ?? ASL.getStore()?.getActor();
                    if (!actor) {
                        RK.logError(RK.LogSection.eAUDIT, 'retirement semantic skipped',
                            'no Actor available', { idSystemObject, semanticAction },
                            'DB.SystemObject');
                    } else {
                        idAuditOut = await AuditFactory.emitWithId({
                            action: semanticAction,
                            actor,
                            target: { idObject: idSystemObject, eObjectType: eNonSystemObjectType.eSystemObject },
                            idSystemObject,
                            payload: {
                                reason: ctx?.reason ?? null,
                                parentRetirement: ctx?.parentAuditId != null
                                    ? { idAudit: ctx.parentAuditId } : null,
                            },
                        });
                    }
                }
                return true;
            });
            return { success, idAudit: idAuditOut };
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB, 'update retired failed',
                H.Helpers.getErrorString(error),
                { id: this.fetchID(), semanticAction }, 'DB.SystemObject');
            return { success: false, idAudit: null };
        }
    }

    static async fetch(idSystemObject: number): Promise<SystemObject | null> {
        if (!idSystemObject)
            return null;
        try {
            return DBC.CopyObject<P.SystemObject, SystemObject>(
                await DBC.DBConnection.prisma.systemObject.findUnique({ where: { idSystemObject, }, }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch failed',H.Helpers.getErrorString(error),{ idSystemObject },'DB.SystemObject');
            return null;
        }
    }

    static async fetchAll(): Promise<SystemObject[] | null> {
        try {
            return DBC.CopyArray<P.SystemObject, SystemObject>(
                await DBC.DBConnection.prisma.systemObject.findMany(), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch all failed',H.Helpers.getErrorString(error),undefined,'DB.SystemObject');
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
            RK.logError(RK.LogSection.eDB,'fetch derived from xref failed',H.Helpers.getErrorString(error),{ idSystemObjectMaster },'DB.SystemObject');
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
            RK.logError(RK.LogSection.eDB,'fetch master from xref failed',H.Helpers.getErrorString(error),{ idSystemObjectDerived },'DB.SystemObject');
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
            RK.logError(RK.LogSection.eDB,'fetch WorkflowStep from xref failed',H.Helpers.getErrorString(error),{ idSystemObject },'DB.SystemObject');
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
            RK.logError(RK.LogSection.eDB,'fetch from Actor id failed',H.Helpers.getErrorString(error),{ idActor },'DB.SystemObject');
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
            RK.logError(RK.LogSection.eDB,'fetch from Asset id failed',H.Helpers.getErrorString(error),{ idAsset },'DB.SystemObject');
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
            RK.logError(RK.LogSection.eDB,'fetch from AssetVersion id failed',H.Helpers.getErrorString(error),{ idAssetVersion },'DB.SystemObject');
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
            RK.logError(RK.LogSection.eDB,'fetch from CaptureData id failed',H.Helpers.getErrorString(error),{ idCaptureData },'DB.SystemObject');
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
            RK.logError(RK.LogSection.eDB,'fetch from IntermediaryFile id failed',H.Helpers.getErrorString(error),{ idIntermediaryFile },'DB.SystemObject');
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
            RK.logError(RK.LogSection.eDB,'fetch from Item id failed',H.Helpers.getErrorString(error),{ idItem },'DB.SystemObject');
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
            RK.logError(RK.LogSection.eDB,'fetch from Model id failed',H.Helpers.getErrorString(error),{ idModel },'DB.SystemObject');
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
            RK.logError(RK.LogSection.eDB,'fetch from Project id failed',H.Helpers.getErrorString(error),{ idProject },'DB.SystemObject');
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
            RK.logError(RK.LogSection.eDB,'fetch from Documentation id failed',H.Helpers.getErrorString(error),{ idProjectDocumentation },'DB.SystemObject');
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
            RK.logError(RK.LogSection.eDB,'fetch from Scene id failed',H.Helpers.getErrorString(error),{ idScene },'DB.SystemObject');
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
            RK.logError(RK.LogSection.eDB,'fetch from Stakeholder id failed',H.Helpers.getErrorString(error),{ idStakeholder },'DB.SystemObject');
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
            RK.logError(RK.LogSection.eDB,'fetch from Subject id failed',H.Helpers.getErrorString(error),{ idSubject },'DB.SystemObject');
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
            RK.logError(RK.LogSection.eDB,'fetch from Unit id failed',H.Helpers.getErrorString(error),{ idUnit },'DB.SystemObject');
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
            RK.logError(RK.LogSection.eDB,'compute affected by update failed',H.Helpers.getErrorString(error),{ idAssets },'DB.SystemObject');
            return null;
        }
    }
}