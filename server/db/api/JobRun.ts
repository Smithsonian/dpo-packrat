/* eslint-disable camelcase */
import { JobRun as JobRunBase, Prisma } from '@prisma/client';
import { convertWorkflowJobRunStatusToEnum } from '..';
import * as COMMON from '@dpo-packrat/common';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';
import * as H from '../../utils/helpers';

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

    public fetchTableName(): string { return 'JobRun'; }
    public fetchID(): number { return this.idJobRun; }

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

    getStatus(): COMMON.eWorkflowJobRunStatus { return convertWorkflowJobRunStatusToEnum(this.Status); }
    setStatus(eStatus: COMMON.eWorkflowJobRunStatus): void { this.Status = eStatus; }

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
            this.logError('create', error);
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
            this.logError('update', error);
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
            LOG.error(`DBAPI.JobRun.fetch(${idJobRun})`, LOG.LS.eDB, error);
            return null;
        }
    }

    /**
     * Fetches JobRun records that match the specified criteria, ordered from most recent to least recent
     * @param limitRows Number of records to fetch
     * @param idVJobType Vocabulary ID of JobType to fetch, e.g. await CACHE.VocabularyCache.vocabularyEnumToId(COMMON.eVocabularyID.eJobJobTypeCookSIPackratInspect)
     * @param assetVersionIDs array of asset version IDs to which this job run is connected, via workflow
     * @param eStatus job status
     * @param result job result
     */
    static async fetchMatching(limitRows: number, idVJobType: number, eStatus: COMMON.eWorkflowJobRunStatus, result: boolean,
        assetVersionIDs: number[] | null, parameterMatch?: string | undefined): Promise<JobRun[] | null> {
        if (limitRows <= 0)
            return null;
        try {
            let jobRunBaseList: JobRunBase[] | null = null;
            if (assetVersionIDs && !parameterMatch)
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
            else if (assetVersionIDs && parameterMatch) {
                parameterMatch = `%${parameterMatch}%`;
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
                  AND JR.Parameters LIKE ${parameterMatch}
                ORDER BY JR.DateEnd DESC
                LIMIT ${limitRows}`; // , JobRun);
            } else
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

            // LOG.info(`JobRun.fetchMatching(${limitRows}, ${idVJobType}, ${JSON.stringify(assetVersionIDs)}, ${eJobRunStatus[eStatus]}, ${result}) yields ${jobRunBaseList.length} records`, LOG.LS.eDB);

            const jobRunList: JobRun[] = [];
            for (const jobRunBase of jobRunBaseList) {
                const jobRun: JobRun = JobRun.constructFromPrisma(jobRunBase);
                jobRunList.push(jobRun);
                // LOG.info(`JobRun.fetchMatching JR Output: ${jobRun.Output}`, LOG.LS.eDB);
            }
            return jobRunList;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.JobRun.fetchMatching', LOG.LS.eDB, error);
            return null;
        }
    }
}
