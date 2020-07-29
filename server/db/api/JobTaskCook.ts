/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-empty-function */
import { JobTaskCook as JobTaskCookBase }from '@prisma/client';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class JobTaskCook extends DBC.DBObject<JobTaskCookBase> implements JobTaskCookBase {
    idJobTaskCook!: number;
    idJobTask!: number;
    JobID!: string;
    RecipeID!: string;

    constructor(input: JobTaskCookBase) {
        super(input);
    }

    protected updateCachedValues(): void { }

    protected async createWorker(): Promise<boolean> {
        try {
            const { idJobTask, JobID, RecipeID } = this;
            ({ idJobTaskCook: this.idJobTaskCook, idJobTask: this.idJobTask, JobID: this.JobID, RecipeID: this.RecipeID } =
                await DBC.DBConnection.prisma.jobTaskCook.create({
                    data: {
                        JobTask: { connect: { idJobTask }, },
                        JobID, RecipeID, }
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.JobTaskCook.create', error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idJobTaskCook, idJobTask, JobID, RecipeID } = this;
            return await DBC.DBConnection.prisma.jobTaskCook.update({
                where: { idJobTaskCook, },
                data: {
                    JobTask: { connect: { idJobTask }, },
                    JobID, RecipeID, }
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.JobTaskCook.update', error);
            return false;
        }
    }

    static async fetch(idJobTaskCook: number): Promise<JobTaskCook | null> {
        if (!idJobTaskCook)
            return null;
        try {
            return DBC.CopyObject<JobTaskCookBase, JobTaskCook>(
                await DBC.DBConnection.prisma.jobTaskCook.findOne({ where: { idJobTaskCook, }, }), JobTaskCook);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.JobTaskCook.fetch', error);
            return null;
        }
    }
}
