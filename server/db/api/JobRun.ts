/* eslint-disable camelcase */
import { JobRun as JobRunBase, Prisma } from '@prisma/client';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';
import * as H from '../../utils/helpers';

export enum eJobRunStatus {
    eUnitialized = 0,
    eCreated = 1,
    eRunning = 2,
    eWaiting = 3,
    eDone = 4,
    eError = 5,
    eCancelled = 6,
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

    static constructFromPrisma(jobRunBase: JobRunBase): JobRun {
        return new JobRun({
            idJobRun: jobRunBase.idJobRun,
            idJob: jobRunBase.idJob,
            Status: jobRunBase.Status,
            Result: H.Helpers.safeBoolean(jobRunBase.Result),
            DateStart: jobRunBase.DateStart,
            DateEnd: jobRunBase.DateEnd,
            Configuration: jobRunBase.Configuration,
            Parameters: jobRunBase.Parameters,
            Output: jobRunBase.Output,
            Error: jobRunBase.Error
        });
    }

    static convertJobRunStatusToEnum(Status: number): eJobRunStatus {
        switch (Status) {
            default:    return eJobRunStatus.eUnitialized;
            case 0:     return eJobRunStatus.eUnitialized;
            case 1:     return eJobRunStatus.eCreated;
            case 2:     return eJobRunStatus.eRunning;
            case 3:     return eJobRunStatus.eWaiting;
            case 4:     return eJobRunStatus.eDone;
            case 5:     return eJobRunStatus.eError;
            case 6:     return eJobRunStatus.eCancelled;
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
                await DBC.DBConnection.prisma.jobRun.findUnique({ where: { idJobRun, }, }), JobRun);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.JobRun.fetch', error);
            return null;
        }
    }

    /**
     * Fetches JobRun records that match the specified criteria, ordered from most recent to least recent
     * @param limitRows Number of records to fetch
     * @param idVJobType Vocabulary ID of JobType to fetch, e.g. await CACHE.VocabularyCache.vocabularyEnumToId(CACHE.eVocabularyID.eJobJobTypeCookSIPackratInspect)
     * @param assetVersionIDs array of asset version IDs to which this job run is connected, via workflow
     * @param eStatus job status
     * @param result job result
     */
    static async fetchMatching(limitRows: number, idVJobType: number, eStatus: eJobRunStatus, result: boolean,
        assetVersionIDs: number[] | null): Promise<JobRun[] | null> {
        if (limitRows <= 0)
            return null;
        try {
            let jobRunBaseList: JobRunBase[] | null = null;
            if (assetVersionIDs)
                jobRunBaseList = // return DBC.CopyArray<JobRunBase, JobRun>(
                await DBC.DBConnection.prisma.$queryRaw<JobRun[]>`
                SELECT JR.*
                FROM JobRun AS JR
                JOIN Job AS J ON (JR.idJob = J.idJob)
                JOIN WorkflowStep AS WS ON (JR.idJobRun = WS.idJobRun)
                JOIN WorkflowStepSystemObjectXref AS WSOX ON (WS.idWorkflowStep = WSOX.idWorkflowStep)
                JOIN SystemObject AS SO ON (WSOX.idSystemObject = SO.idSystemObject)
                WHERE SO.idAssetVersion IN (${Prisma.join(assetVersionIDs)})
                  AND J.idVJobType = ${idVJobType}
                  AND JR.Status = ${eStatus}
                  AND JR.Result = ${result}
                ORDER BY JR.DateEnd DESC
                LIMIT ${limitRows}`; // , JobRun);
            else
                jobRunBaseList =
                await DBC.DBConnection.prisma.$queryRaw<JobRun[]>`
                SELECT JR.*
                FROM JobRun AS JR
                JOIN Job AS J ON (JR.idJob = J.idJob)
                JOIN WorkflowStep AS WS ON (JR.idJobRun = WS.idJobRun)
                JOIN WorkflowStepSystemObjectXref AS WSOX ON (WS.idWorkflowStep = WSOX.idWorkflowStep)
                JOIN SystemObject AS SO ON (WSOX.idSystemObject = SO.idSystemObject)
                WHERE SO.idAssetVersion IS NOT NULL
                  AND J.idVJobType = ${idVJobType}
                  AND JR.Status = ${eStatus}
                  AND JR.Result = ${result}
                ORDER BY JR.DateEnd DESC
                LIMIT ${limitRows}`; // , JobRun);

            // LOG.logger.info(`JobRun.fetchMatching(${limitRows}, ${idVJobType}, ${JSON.stringify(assetVersionIDs)}, ${eJobRunStatus[eStatus]}, ${result}) yields ${jobRunBaseList.length} records`);

            const jobRunList: JobRun[] = [];
            for (const jobRunBase of jobRunBaseList) {
                const jobRun: JobRun = JobRun.constructFromPrisma(jobRunBase);
                jobRunList.push(jobRun);
                // LOG.logger.info(`JobRun.fetchMatching JR Output: ${jobRun.Output}`);
            }
            return jobRunList;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.JobRun.fetchMatching', error);
            return null;
        }
    }
}
