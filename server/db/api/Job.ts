/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-empty-function */
import { Job as JobBase } from '@prisma/client';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class Job extends DBC.DBObject<JobBase> implements JobBase {
    idJob!: number;
    Name!: string;

    constructor(input: JobBase) {
        super(input);
    }

    protected updateCachedValues(): void { }

    protected async createWorker(): Promise<boolean> {
        try {
            const { Name } = this;
            ({ idJob: this.idJob, Name: this.Name } = await DBC.DBConnection.prisma.job.create({ data: { Name, } }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Job.create', error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idJob, Name } = this;
            return await DBC.DBConnection.prisma.job.update({
                where: { idJob, },
                data: { Name, },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Job.update', error);
            return false;
        }
    }

    static async fetch(idJob: number): Promise<Job | null> {
        if (!idJob)
            return null;
        try {
            return DBC.CopyObject<JobBase, Job>(
                await DBC.DBConnection.prisma.job.findOne({ where: { idJob, }, }), Job);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Job.fetch', error);
            return null;
        }
    }
}
