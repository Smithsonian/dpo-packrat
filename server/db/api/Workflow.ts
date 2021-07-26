/* eslint-disable camelcase */
import { Workflow as WorkflowBase } from '@prisma/client';
import { WorkflowSet, WorkflowStep, WorkflowStepSystemObjectXref } from '..';
import * as DBC from '../connection';
import * as CACHE from '../../cache';
import * as LOG from '../../utils/logger';

export class WorkflowConstellation {
    workflow: Workflow | null = null;
    workflowSet: WorkflowSet | null = null;
    workflowStep: WorkflowStep[] | null = null;
    workflowStepXref: WorkflowStepSystemObjectXref[] | null = null;

    static async fetch(idWorkflow: number): Promise<WorkflowConstellation | null> {
        const WFC: WorkflowConstellation = new WorkflowConstellation();
        WFC.workflow = await Workflow.fetch(idWorkflow);
        if (!WFC.workflow) {
            LOG.error(`WorkflowConstellation.fetch failed to retrieve Workflow ${idWorkflow}`, LOG.LS.eDB);
            return null;
        }

        if (WFC.workflow.idWorkflowSet) {
            WFC.workflowSet = await WorkflowSet.fetch(WFC.workflow.idWorkflowSet); /* istanbul ignore next */
            if (!WFC.workflowSet) {
                LOG.error(`WorkflowConstellation.fetch failed to retrieve WorkflowSet ${WFC.workflow.idWorkflowSet}`, LOG.LS.eDB);
                return null;
            }
        }

        WFC.workflowStep = await WorkflowStep.fetchFromWorkflow(idWorkflow); /* istanbul ignore next */
        if (!WFC.workflowStep) {
            LOG.error(`WorkflowConstellation.fetch failed to retrieve WorkflowSteps from workflow ${idWorkflow}`, LOG.LS.eDB);
            return null;
        }

        WFC.workflowStepXref = await WorkflowStepSystemObjectXref.fetchFromWorkflow(idWorkflow); /* istanbul ignore next */
        if (!WFC.workflowStepXref) {
            LOG.error(`WorkflowConstellation.fetch failed to retrieve WorkflowStepSystemObjectXrefs from workflow ${idWorkflow}`, LOG.LS.eDB);
            return null;
        }
        return WFC;
    }
}

export class Workflow extends DBC.DBObject<WorkflowBase> implements WorkflowBase {
    idWorkflow!: number;
    idVWorkflowType!: number;
    idProject!: number | null;
    idUserInitiator!: number | null;
    DateInitiated!: Date;
    DateUpdated!: Date;
    Parameters!: string | null;
    idWorkflowSet!: number | null;

    constructor(input: WorkflowBase) {
        super(input);
    }

    public fetchTableName(): string { return 'Workflow'; }
    public fetchID(): number { return this.idWorkflow; }

    protected async createWorker(): Promise<boolean> {
        try {
            const { idVWorkflowType, idProject, idUserInitiator, DateInitiated, DateUpdated, Parameters, idWorkflowSet } = this;
            ({ idWorkflow: this.idWorkflow, idVWorkflowType: this.idVWorkflowType, idProject: this.idProject,
                idUserInitiator: this.idUserInitiator, DateInitiated: this.DateInitiated, DateUpdated: this.DateUpdated,
                Parameters: this.Parameters, idWorkflowSet: this.idWorkflowSet } =
                await DBC.DBConnection.prisma.workflow.create({
                    data: {
                        Vocabulary:    { connect: { idVocabulary: idVWorkflowType }, },
                        Project:       idProject ? { connect: { idProject }, } : undefined,
                        User:          idUserInitiator ? { connect: { idUser: idUserInitiator }, } : undefined,
                        DateInitiated,
                        DateUpdated,
                        Parameters,
                        WorkflowSet:    idWorkflowSet ? { connect: { idWorkflowSet }, } : undefined,
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Workflow.create', LOG.LS.eDB, error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idWorkflow, idVWorkflowType, idProject, idUserInitiator, DateInitiated,
                DateUpdated, Parameters, idWorkflowSet } = this;
            const retValue: boolean = await DBC.DBConnection.prisma.workflow.update({
                where: { idWorkflow, },
                data: {
                    Vocabulary:     { connect: { idVocabulary: idVWorkflowType }, },
                    Project:        idProject ? { connect: { idProject }, } : { disconnect: true, },
                    User:           idUserInitiator ? { connect: { idUser: idUserInitiator }, } : { disconnect: true, },
                    DateInitiated,
                    DateUpdated,
                    Parameters,
                    WorkflowSet:    idWorkflowSet ? { connect: { idWorkflowSet }, } : { disconnect: true, },
                },
            }) ? true : /* istanbul ignore next */ false;
            return retValue;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Workflow.update', LOG.LS.eDB, error);
            return false;
        }
    }

    static async fetch(idWorkflow: number): Promise<Workflow | null> {
        if (!idWorkflow)
            return null;
        try {
            return DBC.CopyObject<WorkflowBase, Workflow>(
                await DBC.DBConnection.prisma.workflow.findUnique({ where: { idWorkflow, }, }), Workflow);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Workflow.fetch', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchFromProject(idProject: number): Promise<Workflow[] | null> {
        if (!idProject)
            return null;
        try {
            return DBC.CopyArray<WorkflowBase, Workflow>(
                await DBC.DBConnection.prisma.workflow.findMany({ where: { idProject } }), Workflow);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Workflow.fetchFromProject', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchFromUser(idUserInitiator: number): Promise<Workflow[] | null> {
        if (!idUserInitiator)
            return null;
        try {
            return DBC.CopyArray<WorkflowBase, Workflow>(
                await DBC.DBConnection.prisma.workflow.findMany({ where: { idUserInitiator } }), Workflow);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Workflow.fetchFromUser', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchFromWorkflowType(eWorkType: CACHE.eVocabularyID): Promise<Workflow[] | null> {
        if (!await CACHE.VocabularyCache.isVocabularyInSet(eWorkType, CACHE.eVocabularySetID.eWorkflowType)) {
            LOG.error(`Workflow.fetchFromWorkflowType ${CACHE.eVocabularyID[eWorkType]} is not from the correct vocabulary set`, LOG.LS.eDB);
            return null;
        }

        const idVWorkflowType: number | undefined = await CACHE.VocabularyCache.vocabularyEnumToId(eWorkType); /* istanbul ignore next */
        if (!idVWorkflowType) {
            LOG.error(`Workflow.fetchFromWorkflowType ${eWorkType} is missing from Vocabulary`, LOG.LS.eDB);
            return null;
        }

        try {
            return DBC.CopyArray<WorkflowBase, Workflow>(
                await DBC.DBConnection.prisma.workflow.findMany({ where: { idVWorkflowType } }), Workflow);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Workflow.fetchFromWorkflowType', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchFromWorkflowSet(idWorkflowSet: number): Promise<Workflow[] | null> {
        if (!idWorkflowSet)
            return null;
        try {
            return DBC.CopyArray<WorkflowBase, Workflow>(
                await DBC.DBConnection.prisma.workflow.findMany({ where: { idWorkflowSet } }), Workflow);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Workflow.fetchFromWorkflowSet', LOG.LS.eDB, error);
            return null;
        }
    }
}
