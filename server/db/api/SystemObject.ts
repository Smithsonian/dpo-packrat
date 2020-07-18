/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-empty-function */
import * as P from '@prisma/client';
import { WorkflowStep } from '..';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class SystemObject extends DBC.DBObject<P.SystemObject> implements P.SystemObject {
    idActor!: number | null;
    idAsset!: number | null;
    idAssetVersion!: number | null;
    idCaptureData!: number | null;
    idIntermediaryFile!: number | null;
    idItem!: number | null;
    idModel!: number | null;
    idProject!: number | null;
    idProjectDocumentation!: number | null;
    idScene!: number | null;
    idStakeholder!: number | null;
    idSubject!: number | null;
    idSystemObject!: number;
    idUnit!: number | null;
    idWorkflow!: number | null;
    idWorkflowStep!: number | null;
    Retired!: boolean;

    constructor(input: P.SystemObject) {
        super(input);
    }

    protected updateCachedValues(): void { }

    // NO EXPLICIT METHODS FOR CREATING OR UPDATING SYSTEMOBJECT DIRECTLY.
    // This is done via create* and update* methods of the objects linked to SystemObject
    protected async createWorker(): Promise<boolean> {
        throw new ReferenceError('DBAPI.SystemObject.create() should never be called; used the explict create methods of objects linked to SystemObject');
    }

    protected async updateWorker(): Promise<boolean> {
        throw new ReferenceError('DBAPI.SystemObject.update() should never be called; used the explict update methods of objects linked to SystemObject');
    }

    static async fetch(idSystemObject: number): Promise<SystemObject | null> {
        if (!idSystemObject)
            return null;
        try {
            return DBC.CopyObject<P.SystemObject, SystemObject>(
                await DBC.DBConnectionFactory.prisma.systemObject.findOne({ where: { idSystemObject, }, }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.SystemObject.fetch', error);
            return null;
        }
    }

    static async fetchDerivedFromXref(idSystemObjectMaster: number): Promise<SystemObject[] | null> {
        if (!idSystemObjectMaster)
            return null;
        try {
            return DBC.CopyArray<P.SystemObject, SystemObject>(
                await DBC.DBConnectionFactory.prisma.systemObject.findMany({
                    where: {
                        SystemObjectXref_SystemObjectToSystemObjectXref_idSystemObjectDerived: {
                            some: { idSystemObjectMaster },
                        },
                    },
                }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.SystemObject.fetchDerivedFromXref', error);
            return null;
        }
    }

    static async fetchMasterFromXref(idSystemObjectDerived: number): Promise<SystemObject[] | null> {
        if (!idSystemObjectDerived)
            return null;
        try {
            return DBC.CopyArray<P.SystemObject, SystemObject>(
                await DBC.DBConnectionFactory.prisma.systemObject.findMany({
                    where: {
                        SystemObjectXref_SystemObjectToSystemObjectXref_idSystemObjectMaster: {
                            some: { idSystemObjectDerived },
                        },
                    },
                }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.SystemObject.fetchMasterFromXref', error);
            return null;
        }
    }

    static async fetchWorkflowStepFromXref(idSystemObject: number): Promise<WorkflowStep[] | null> {
        if (!idSystemObject)
            return null;
        try {
            return DBC.CopyArray<P.WorkflowStep, WorkflowStep>(
                await DBC.DBConnectionFactory.prisma.workflowStep.findMany({
                    where: {
                        WorkflowStepSystemObjectXref: {
                            some: { idSystemObject },
                        },
                    },
                }), WorkflowStep);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.SystemObject.fetchWorkflowStepFromXref', error);
            return null;
        }
    }

    static async fetchFromActorID(idActor: number): Promise<SystemObject | null> {
        if (!idActor)
            return null;
        try {
            return DBC.CopyObject<P.SystemObject, SystemObject>(
                await DBC.DBConnectionFactory.prisma.systemObject.findOne({ where: { idActor } }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.SystemObject.fetchSystemObjectFromActor', error);
            return null;
        }
    }

    static async fetchFromAssetID(idAsset: number): Promise<SystemObject | null> {
        if (!idAsset)
            return null;
        try {
            return DBC.CopyObject<P.SystemObject, SystemObject>(
                await DBC.DBConnectionFactory.prisma.systemObject.findOne({ where: { idAsset } }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.SystemObject.fetchSystemObjectFromAsset', error);
            return null;
        }
    }

    static async fetchFromAssetVersionID(idAssetVersion: number): Promise<SystemObject | null> {
        if (!idAssetVersion)
            return null;
        try {
            return DBC.CopyObject<P.SystemObject, SystemObject>(
                await DBC.DBConnectionFactory.prisma.systemObject.findOne({ where: { idAssetVersion } }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.SystemObject.fetchSystemObjectFromAssetVersion', error);
            return null;
        }
    }

    static async fetchFromCaptureDataID(idCaptureData: number): Promise<SystemObject | null> {
        if (!idCaptureData)
            return null;
        try {
            return DBC.CopyObject<P.SystemObject, SystemObject>(
                await DBC.DBConnectionFactory.prisma.systemObject.findOne({ where: { idCaptureData } }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.SystemObject.fetchSystemObjectFromCaptureData', error);
            return null;
        }
    }

    static async fetchFromIntermediaryFileID(idIntermediaryFile: number): Promise<SystemObject | null> {
        if (!idIntermediaryFile)
            return null;
        try {
            return DBC.CopyObject<P.SystemObject, SystemObject>(
                await DBC.DBConnectionFactory.prisma.systemObject.findOne({ where: { idIntermediaryFile } }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.SystemObject.fetchSystemObjectFromIntermediaryFile', error);
            return null;
        }
    }

    static async fetchFromItemID(idItem: number): Promise<SystemObject | null> {
        if (!idItem)
            return null;
        try {
            return DBC.CopyObject<P.SystemObject, SystemObject>(
                await DBC.DBConnectionFactory.prisma.systemObject.findOne({ where: { idItem } }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.SystemObject.fetchSystemObjectFromItem', error);
            return null;
        }
    }

    static async fetchFromModelID(idModel: number): Promise<SystemObject | null> {
        if (!idModel)
            return null;
        try {
            return DBC.CopyObject<P.SystemObject, SystemObject>(
                await DBC.DBConnectionFactory.prisma.systemObject.findOne({ where: { idModel } }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.SystemObject.fetchSystemObjectFromModel', error);
            return null;
        }
    }

    static async fetchFromProjectID(idProject: number): Promise<SystemObject | null> {
        if (!idProject)
            return null;
        try {
            return DBC.CopyObject<P.SystemObject, SystemObject>(
                await DBC.DBConnectionFactory.prisma.systemObject.findOne({ where: { idProject } }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.SystemObject.fetchSystemObjectFromProject', error);
            return null;
        }
    }

    static async fetchFromProjectDocumentationID(idProjectDocumentation: number): Promise<SystemObject | null> {
        if (!idProjectDocumentation)
            return null;
        try {
            return DBC.CopyObject<P.SystemObject, SystemObject>(
                await DBC.DBConnectionFactory.prisma.systemObject.findOne({ where: { idProjectDocumentation } }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.SystemObject.fetchSystemObjectFromProjectDocumentation', error);
            return null;
        }
    }

    static async fetchFromSceneID(idScene: number): Promise<SystemObject | null> {
        if (!idScene)
            return null;
        try {
            return DBC.CopyObject<P.SystemObject, SystemObject>(
                await DBC.DBConnectionFactory.prisma.systemObject.findOne({ where: { idScene } }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.SystemObject.fetchSystemObjectFromScene', error);
            return null;
        }
    }

    static async fetchFromStakeholderID(idStakeholder: number): Promise<SystemObject | null> {
        if (!idStakeholder)
            return null;
        try {
            return DBC.CopyObject<P.SystemObject, SystemObject>(
                await DBC.DBConnectionFactory.prisma.systemObject.findOne({ where: { idStakeholder } }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.SystemObject.fetchSystemObjectFromStakeholder', error);
            return null;
        }
    }

    static async fetchFromSubjectID(idSubject: number): Promise<SystemObject | null> {
        if (!idSubject)
            return null;
        try {
            return DBC.CopyObject<P.SystemObject, SystemObject>(
                await DBC.DBConnectionFactory.prisma.systemObject.findOne({ where: { idSubject } }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.SystemObject.fetchSystemObjectFromSubject', error);
            return null;
        }
    }

    static async fetchFromUnitID(idUnit: number): Promise<SystemObject | null> {
        if (!idUnit)
            return null;
        try {
            return DBC.CopyObject<P.SystemObject, SystemObject>(
                await DBC.DBConnectionFactory.prisma.systemObject.findOne({ where: { idUnit } }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.SystemObject.fetchSystemObjectFromUnit', error);
            return null;
        }
    }

    static async fetchFromWorkflowID(idWorkflow: number): Promise<SystemObject | null> {
        if (!idWorkflow)
            return null;
        try {
            return DBC.CopyObject<P.SystemObject, SystemObject>(
                await DBC.DBConnectionFactory.prisma.systemObject.findOne({ where: { idWorkflow } }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.SystemObject.fetchSystemObjectFromWorkflow', error);
            return null;
        }
    }

    static async fetchFromWorkflowStepID(idWorkflowStep: number): Promise<SystemObject | null> {
        if (!idWorkflowStep)
            return null;
        try {
            return DBC.CopyObject<P.SystemObject, SystemObject>(
                await DBC.DBConnectionFactory.prisma.systemObject.findOne({ where: { idWorkflowStep } }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.SystemObject.fetchSystemObjectFromWorkflowStep', error);
            return null;
        }
    }
}