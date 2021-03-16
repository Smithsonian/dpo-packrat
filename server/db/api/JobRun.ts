/* eslint-disable camelcase */
import { JobRun as JobRunBase } from '@prisma/client';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export enum eJobRunStatus {
    eNotStarted = 0,
    eRunning = 1,
    ePaused = 2,
    eCompleted = 3,
    eCancelled = 4,
}

export class JobRun extends DBC.DBObject<JobRunBase> implements JobRunBase {
    idJobRun!: number;
    idJob!: number;
    Status!: number;
    Result!: boolean | null;
    DateStart!: Date | null;
    DateEnd!: Date | null;
    Configuration!: string | null;
    Parameters!: string | null;
    Output!: string | null;
    Error!: string | null;

    constructor(input: JobRunBase) {
        super(input);
    }

    static convertJobRunStatusToEnum(Status: number): eJobRunStatus {
        switch (Status) {
            default:    return eJobRunStatus.eNotStarted;
            case 0:     return eJobRunStatus.eNotStarted;
            case 1:     return eJobRunStatus.eRunning;
            case 2:     return eJobRunStatus.ePaused;
            case 3:     return eJobRunStatus.eCompleted;
        }
    }

    getStatus(): eJobRunStatus { return JobRun.convertJobRunStatusToEnum(this.Status); }
    setStatus(eStatus: eJobRunStatus): void { this.Status = eStatus; }

    protected updateCachedValues(): void { }

    protected async createWorker(): Promise<boolean> {
        try {
            const { idJob, Status, Result, DateStart, DateEnd, Configuration, Parameters, Output, Error } = this;
            ({ idJobRun: this.idJobRun, idJob: this.idJob, Status: this.Status, Result: this.Result, DateStart: this.DateStart, DateEnd: this.DateEnd,
                Configuration: this.Configuration, Parameters: this.Parameters, Output: this.Output, Error: this.Error } =
                await DBC.DBConnection.prisma.jobRun.create({
                    data: {
                        Job: { connect: { idJob }, },
                        Status,
                        Result,
                        DateStart,
                        DateEnd,
                        Configuration,
                        Parameters,
                        Output,
                        Error
                    }
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.JobRun.create', error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idJobRun, idJob, Status, Result, DateStart, DateEnd, Configuration, Parameters, Output, Error } = this;
            return await DBC.DBConnection.prisma.jobRun.update({
                where: { idJobRun, },
                data: {
                    Job: { connect: { idJob }, },
                    Status,
                    Result,
                    DateStart,
                    DateEnd,
                    Configuration,
                    Parameters,
                    Output,
                    Error
                }
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.JobRun.update', error);
            return false;
        }
    }

    static async fetch(idJobRun: number): Promise<JobRun | null> {
        if (!idJobRun)
            return null;
        try {
            return DBC.CopyObject<JobRunBase, JobRun>(
                await DBC.DBConnection.prisma.jobRun.findOne({ where: { idJobRun, }, }), JobRun);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.JobRun.fetch', error);
            return null;
        }
    }
}
