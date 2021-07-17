import { IReport } from './IReport';
import { Report } from '../impl/Report';
import * as DBAPI from '../../db';
import * as LOG from '../../utils/logger';
import { ASL, LocalStore } from '../../utils/localStore';

export class ReportFactory {
    static async getReport(): Promise<IReport | null> {
        let workflowReport: DBAPI.WorkflowReport | null = null;

        const LS: LocalStore | undefined = ASL.getStore();
        if (!LS) {
            LOG.error('ReportFactory.getReport() unable to retrieve active workflow from LocalStorage', LOG.LS.eRPT);
            return null;
        }

        if (LS.idWorkflowReport) {
            workflowReport = await DBAPI.WorkflowReport.fetch(LS.idWorkflowReport);
            if (!workflowReport)
                LOG.error(`ReportFactory.getReport() unable to fetch report with id ${LS.idWorkflowReport}`, LOG.LS.eRPT);
        }

        if (!workflowReport && LS.idWorkflow) {
            const workflowReports: DBAPI.WorkflowReport[] | null = await DBAPI.WorkflowReport.fetchFromWorkflow(LS.idWorkflow);
            if (!workflowReports)
                LOG.error(`ReportFactory.getReport() unable to fetch reports from workflow with ID ${LS.idWorkflow}`, LOG.LS.eRPT);
            else if (workflowReports.length > 0)
                workflowReport = workflowReports[0];
            else {
                workflowReport = new DBAPI.WorkflowReport({
                    idWorkflow: LS.idWorkflow,
                    MimeType: 'text/html',
                    Data: '',
                    idWorkflowReport: 0
                });
                if (!await workflowReport.create()) {
                    LOG.error(`ReportFactory.getReport() unable to create WorkflowReport for workflow with ID ${LS.idWorkflow}`, LOG.LS.eRPT);
                    workflowReport = null;
                }
            }
        }

        if (workflowReport) {
            LS.idWorkflowReport = workflowReport.idWorkflowReport;
            return new Report(workflowReport);
        }
        LOG.error('ReportFactory.getReport() unable to locate active workflow report from LocalStorage', LOG.LS.eRPT);
        return null;
    }
}
