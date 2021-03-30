/* eslint-disable camelcase */
import { Workflow as WorkflowBase } from '@prisma/client';
import * as DBC from '../connection';
import * as CACHE from '../../cache';
import * as LOG from '../../utils/logger';

export class Workflow extends DBC.DBObject<WorkflowBase> implements WorkflowBase {
    idWorkflow!: number;
    idVWorkflowType!: number;
    idProject!: number | null;
    idUserInitiator!: number | null;
    DateInitiated!: Date;
    DateUpdated!: Date;
    Parameters!: string | null;

    private idProjectOrig!: number | null;
    private idUserInitiatorOrig!: number | null;

    constructor(input: WorkflowBase) {
        super(input);
    }

    protected updateCachedValues(): void {
        this.idProjectOrig = this.idProject;
        this.idUserInitiatorOrig = this.idUserInitiator;
    }

    protected async createWorker(): Promise<boolean> {
        try {
            const { idVWorkflowType, idProject, idUserInitiator, DateInitiated, DateUpdated, Parameters } = this;
            ({ idWorkflow: this.idWorkflow, idVWorkflowType: this.idVWorkflowType, idProject: this.idProject,
                idUserInitiator: this.idUserInitiator, DateInitiated: this.DateInitiated, DateUpdated: this.DateUpdated,
                Parameters: this.Parameters } =
                await DBC.DBConnection.prisma.workflow.create({
                    data: {
                        Vocabulary:    { connect: { idVocabulary: idVWorkflowType }, },
                        Project:       idProject ? { connect: { idProject }, } : undefined,
                        User:          idUserInitiator ? { connect: { idUser: idUserInitiator }, } : undefined,
                        DateInitiated,
                        DateUpdated,
                        Parameters,
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Workflow.create', error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idWorkflow, idVWorkflowType, idProject, idUserInitiator, DateInitiated,
                DateUpdated, Parameters, idProjectOrig, idUserInitiatorOrig } = this;
            const retValue: boolean = await DBC.DBConnection.prisma.workflow.update({
                where: { idWorkflow, },
                data: {
                    Vocabulary:     { connect: { idVocabulary: idVWorkflowType }, },
                    Project:        idProject ? { connect: { idProject }, } : idProjectOrig ? { disconnect: true, } : undefined,
                    User:           idUserInitiator ? { connect: { idUser: idUserInitiator }, } : idUserInitiatorOrig ? { disconnect: true, } : undefined,
                    DateInitiated,
                    DateUpdated,
                    Parameters
                },
            }) ? true : /* istanbul ignore next */ false;
            return retValue;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Workflow.update', error);
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
            LOG.logger.error('DBAPI.Workflow.fetch', error);
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
            LOG.logger.error('DBAPI.Workflow.fetchFromProject', error);
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
            LOG.logger.error('DBAPI.Workflow.fetchFromUser', error);
            return null;
        }
    }

    static async fetchFromWorkflowType(eWorkType: CACHE.eVocabularyID): Promise<Workflow[] | null> {
        if (!await CACHE.VocabularyCache.isVocabularyInSet(eWorkType, CACHE.eVocabularySetID.eWorkflowType)) {
            LOG.logger.error(`Workflow.fetchFromWorkflowType ${CACHE.eVocabularyID[eWorkType]} is not from the correct vocabulary set`);
            return null;
        }

        const idVWorkflowType: number | undefined = await CACHE.VocabularyCache.vocabularyEnumToId(eWorkType); /* istanbul ignore next */
        if (!idVWorkflowType) {
            LOG.logger.error(`Workflow.fetchFromWorkflowType ${eWorkType} is missing from Vocabulary`);
            return null;
        }

        try {
            return DBC.CopyArray<WorkflowBase, Workflow>(
                await DBC.DBConnection.prisma.workflow.findMany({ where: { idVWorkflowType } }), Workflow);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Workflow.fetchFromWorkflowType', error);
            return null;
        }
    }
}
