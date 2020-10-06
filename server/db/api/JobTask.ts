/* eslint-disable camelcase */
import { JobTask as JobTaskBase }from '@prisma/client';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class JobTask extends DBC.DBObject<JobTaskBase> implements JobTaskBase {
    idJobTask!: number;
    idJob!: number;
    idVJobType!: number;
    State!: string | null;
    Step!: string | null;
    Error!: string | null;
    Parameters!: string | null;
    Report!: string | null;

    constructor(input: JobTaskBase) {
        super(input);
    }

    protected updateCachedValues(): void { }

    protected async createWorker(): Promise<boolean> {
        try {
            const { idJob, idVJobType, State, Step, Error, Parameters, Report } = this;
            ({ idJobTask: this.idJobTask, idJob: this.idJob, idVJobType: this.idVJobType, State: this.State, Step: this.Step,
                Error: this.Error, Parameters: this.Parameters, Report: this.Report } =
                await DBC.DBConnection.prisma.jobTask.create({
                    data: {
                        Job: { connect: { idJob }, },
                        Vocabulary: { connect: { idVocabulary: idVJobType }, },
                        State, Step, Error, Parameters, Report, }
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.JobTask.create', error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idJobTask, idJob, idVJobType, State, Step, Error, Parameters, Report } = this;
            return await DBC.DBConnection.prisma.jobTask.update({
                where: { idJobTask, },
                data: {
                    Job: { connect: { idJob }, },
                    Vocabulary: { connect: { idVocabulary: idVJobType }, },
                    State, Step, Error, Parameters, Report, }
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.JobTask.update', error);
            return false;
        }
    }

    static async fetch(idJobTask: number): Promise<JobTask | null> {
        if (!idJobTask)
            return null;
        try {
            return DBC.CopyObject<JobTaskBase, JobTask>(
                await DBC.DBConnection.prisma.jobTask.findOne({ where: { idJobTask, }, }), JobTask);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.JobTask.fetch', error);
            return null;
        }
    }
}
