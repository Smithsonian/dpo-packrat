import { IReport } from './IReport';
import { Report } from '../impl/Report';
import * as DBAPI from '../../db';
import * as LOG from '../../utils/logger';
import { ASL, LocalStore } from '../../utils/localStore';

export class ReportFactory {
    static async getReport(): Promise<IReport | null> {
        let workflowReport: DBAPI.WorkflowReport | null = null;

        const LS: LocalStore = await ASL.getOrCreateStore();
        const idWorkflowReport: number | undefined = LS.getWorkflowReportID();
        if (idWorkflowReport) {
            workflowReport = await DBAPI.WorkflowReport.fetch(idWorkflowReport);
            if (!workflowReport)
                LOG.error(`ReportFactory.getReport() unable to fetch report with id ${idWorkflowReport}`, LOG.LS.eRPT);
        }

        const idWorkflow: number | undefined = LS.getWorkflowID();
        if ((!workflowReport || workflowReport.idWorkflow !== idWorkflow) && idWorkflow) {
            const workflowReports: DBAPI.WorkflowReport[] | null = await DBAPI.WorkflowReport.fetchFromWorkflow(idWorkflow);
            if (!workflowReports)
                LOG.error(`ReportFactory.getReport() unable to fetch reports from workflow with ID ${idWorkflow}`, LOG.LS.eRPT);
            else if (workflowReports.length > 0)
                workflowReport = workflowReports[0];
            else {
                workflowReport = new DBAPI.WorkflowReport({
                    idWorkflow,
                    MimeType: 'text/html',
                    Data: '',
                    idWorkflowReport: 0,
                    Name: null
                });
                if (!await workflowReport.create()) {
                    LOG.error(`ReportFactory.getReport() unable to create WorkflowReport for workflow with ID ${JSON.stringify(idWorkflow)}`, LOG.LS.eRPT);
                    workflowReport = null;
                }
            }
        }

        if (workflowReport) {
            LS.setWorkflowReportID(workflowReport.idWorkflowReport);
            return new Report(workflowReport);
        }
        LOG.error('ReportFactory.getReport() unable to locate active workflow report from LocalStorage', LOG.LS.eRPT);
        return null;
    }
}
