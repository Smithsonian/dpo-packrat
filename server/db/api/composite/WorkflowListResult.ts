/* eslint-disable camelcase */
import * as DBC from '../../connection';
import * as LOG from '../../../utils/logger';
import * as COMMON from '../../../../client/src/types/server';

export class WorkflowListResult {
    idWorkflow: number = 0;
    idWorkflowSet: number = 0;
    idWorkflowReport: number = 0;
    idJobRun: number = 0;
    Type: string = '';
    State: string = '';
    idUserInitiator: number = 0;
    idOwner: number = 0;
    DateStart: Date = new Date();
    DateLast: Date = new Date();
    Error: string = '';

    static async search(idVWorkflowType: number[] | undefined | null, idVJobType: number[] | undefined | null, State: number[] | undefined | null,
        DateFrom: Date | undefined | null, DateTo: Date | undefined | null, idUserInitiator: number[] | undefined | null, idUserOwner: number[] | undefined | null,
        pageNumber: number | undefined | null, rowCount: number | undefined | null,
        sortBy: COMMON.eWorkflowListSortColumns | undefined | null, sortOrder: boolean | undefined | null): Promise<WorkflowListResult[] | null> {
        try {
            const whereConditions: string[] = [];
            const queryRawParams: string[] = [];

            const idVWorkflowTypeSupplied: boolean = ((idVWorkflowType ?? []).length !== 0);
            const idVJobTypeSupplied: boolean = ((idVJobType ?? []).length !== 0);
            const StateSupplied: boolean = ((State ?? []).length !== 0);
            const DateFromSupplied: boolean = (DateFrom !== undefined);
            const DateToSupplied: boolean = (DateTo !== undefined);
            const idUserInitiatorSupplied: boolean = ((idUserInitiator ?? []).length !== 0);
            const idUserOwnerSupplied: boolean = ((idUserOwner ?? []).length !== 0);

            if (idVWorkflowTypeSupplied)
                whereConditions.push(WorkflowListResult.addInIdArrayParameter('VWF.idVocabulary', idVWorkflowType, queryRawParams));
            if (idVJobTypeSupplied)
                whereConditions.push(WorkflowListResult.addInIdArrayParameter('JOB.idVJobType', idVJobType, queryRawParams));
            if (StateSupplied) {
                const wfStateSql: string = WorkflowListResult.addInIdArrayParameter('WFL.WFState', State, queryRawParams);
                const jobStateSql: string = WorkflowListResult.addInIdArrayParameter('JOB.JobStatus', State, queryRawParams);
                whereConditions.push(`(${wfStateSql} OR ${jobStateSql})`);
            }
            if (DateFromSupplied) {
                whereConditions.push('(? <= WF.DateInitiated)');
                queryRawParams.push(`${DateFrom}`);
            }
            if (DateToSupplied) {
                whereConditions.push('(WF.DateInitiated <= ?)');
                queryRawParams.push(`${DateTo}`);
            }
            if (idUserInitiatorSupplied)
                whereConditions.push(WorkflowListResult.addInIdArrayParameter('WF.idUserInitiator', idUserInitiator, queryRawParams));
            if (idUserOwnerSupplied)
                whereConditions.push(WorkflowListResult.addInIdArrayParameter('WFL.idWFSOwner', idUserOwner, queryRawParams));

            const where: string = whereConditions.length > 0 ? `\nWHERE ${whereConditions.join(' AND ')}` : '';

            let orderBy: string = '';
            if (sortBy === undefined)
                sortBy = COMMON.eWorkflowListSortColumns.eDefault;
            switch (sortBy) {
                default:
                case COMMON.eWorkflowListSortColumns.eDefault:
                case COMMON.eWorkflowListSortColumns.eSet:
                    orderBy = 'ORDER BY WF.idWorkflowSet' + ((sortOrder === false) ? ' DESC' : '') + ', WF.idWorkflow';
                    break;

                case COMMON.eWorkflowListSortColumns.eType:
                    orderBy = 'ORDER BY IFNULL(VWF.TERM, \'Unknown\')' + ((sortOrder === false) ? ' DESC' : '');
                    break;

                case COMMON.eWorkflowListSortColumns.eState:
                    orderBy = 'ORDER BY IFNULL(JOB.JobStatus, WFL.WFState)' + ((sortOrder === false) ? ' DESC' : '');
                    break;

                case COMMON.eWorkflowListSortColumns.eOwner:
                    orderBy = 'ORDER BY U.Name' + ((sortOrder === false) ? ' DESC' : '');
                    break;

                case COMMON.eWorkflowListSortColumns.eStart:
                    orderBy = 'ORDER BY WF.DateInitiated' + ((sortOrder === false) ? ' DESC' : '');
                    break;

                case COMMON.eWorkflowListSortColumns.eLast:
                    orderBy = 'ORDER BY WF.DateUpdated' + ((sortOrder === false) ? ' DESC' : '');
                    break;

                case COMMON.eWorkflowListSortColumns.eReport:
                    orderBy = 'ORDER BY WR.idWorkflowReport' + ((sortOrder === false) ? ' DESC' : '') + ', WF.idWorkflow';
                    break;

                case COMMON.eWorkflowListSortColumns.eJobRun:
                    orderBy = 'ORDER BY CASE WHEN JOB.JobOutputPresent = 1 THEN JOB.idJobRun ELSE 0 END' + ((sortOrder === false) ? ' DESC' : '') + ', WF.idWorkflow';
                    break;

                case COMMON.eWorkflowListSortColumns.eError:
                    orderBy = 'ORDER BY JOB.JobError' + ((sortOrder === false) ? ' DESC' : '');
                    break;
            }

            if ((rowCount ?? 0) <= 0)
                rowCount = 100;
            if ((pageNumber ?? 0) <= 1)
                pageNumber = 1;
            const rowStart: number = (pageNumber! - 1) * rowCount!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
            queryRawParams.push(`${rowStart}`);
            queryRawParams.push(`${rowCount}`);

            // Keep the CASE IFNULL(JOB.JobStatus, WFL.WFState) ... in sync with ObjectType.ts's definition of eWorkflowJobRunStatus and convertWorkflowJobRunStatusEnumToString
            const sql: string = `WITH
            WFLastIDs (idWorkflow, idWorkflowStep, idJobRun) AS (
                SELECT WFS.idWorkflow, MAX(idWorkflowStep), MAX(JR.idJobRun)
                FROM WorkflowStep AS WFS
                LEFT JOIN JobRun AS JR ON (WFS.idJobRun = JR.idJobRun)
                GROUP BY WFS.idWorkflow
            ),
            
            WFLast (idWorkflow, WFState, idWFSOwner) AS (
                SELECT WFS.idWorkflow, WFS.State AS 'WFState', WFS.idUserOwner AS 'idWFSOwner'
                FROM WFLastIDs AS WFLI
                JOIN WorkflowStep AS WFS ON (WFLI.idWorkflowStep = WFS.idWorkflowStep)
            ),
            
            JobLast (idWorkflow, idJobRun, idVJobType, JobType, JobStatus, JobStart, JobEnd, JobError, JobOutputPresent) AS (
                SELECT WFLI.idWorkflow,
                     JR.idJobRun, J.idVJobType, J.Name AS 'JobType', JR.Status AS 'JobStatus', JR.DateStart AS 'JobStart',
                     JR.DateEnd AS 'JobEnd', JR.Error AS 'JobError', CASE WHEN JR.Output IS NULL THEN 0 ELSE 1 END AS 'JobOutputPresent'
                FROM WFLastIDs AS WFLI
                JOIN JobRun AS JR ON (WFLI.idJobRun = JR.idJobRun)
                JOIN Job AS J ON (JR.idJob = J.idJob)
            )
            
            SELECT WF.idWorkflow, WF.idWorkflowSet, WR.idWorkflowReport, CASE WHEN JOB.JobOutputPresent = 1 THEN JOB.idJobRun ELSE NULL END AS 'idJobRun',
                IFNULL(JOB.JobType, IFNULL(VWF.Term, 'Unknown')) AS 'Type',
                CASE IFNULL(JOB.JobStatus, WFL.WFState) WHEN 0 THEN 'Uninitialized' WHEN 1 THEN 'Created' WHEN 2 THEN 'Running' WHEN 3 THEN 'Waiting' WHEN 4 THEN 'Done' WHEN 5 THEN 'Error' WHEN 6 THEN 'Canceled' ELSE 'Uninitialized' END AS 'State',
                WF.idUserInitiator AS 'idUserInitiator', WFL.idWFSOwner AS 'idOwner', WF.DateInitiated AS 'DateStart', WF.DateUpdated AS 'DateLast',
                JOB.JobError AS 'Error'
            FROM Workflow AS WF
            LEFT JOIN Vocabulary AS VWF ON (WF.idVWorkflowType = VWF.idVocabulary)
            LEFT JOIN WFLast AS WFL ON (WF.idWorkflow = WFL.idWorkflow)
            LEFT JOIN JobLast AS JOB ON (WF.idWorkflow = JOB.idWorkflow)
            LEFT JOIN WorkflowReport AS WR ON (WF.idWorkflow = WR.idWorkflow)
            LEFT JOIN User AS U ON (WFL.idWFSOwner = U.idUser)${where}
            ${orderBy}
            LIMIT ?, ?`;
            // LOG.info(`DBAPI.WorkflowListResult.search, sql=${sql}; params=${JSON.stringify(queryRawParams)}`, LOG.LS.eDB);
            return await DBC.DBConnection.prisma.$queryRawUnsafe<WorkflowListResult[] | null>(sql, ...queryRawParams);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.WorkflowListResult.search', LOG.LS.eDB, error);
            return null;
        }
    }

    private static addInIdArrayParameter(field: string, values: number[] | undefined | null, queryRawParams: string[]): string {
        if (!values || values.length === 0)
            return '';
        let first: boolean = true;
        let sql: string = `(${field} IN (`;
        for (const value of values) {
            if (first)
                first = false;
            else
                sql += ', ';
            sql += '?';
            queryRawParams.push(`${value}`);
        }
        sql += '))';
        return sql;
    }
}
