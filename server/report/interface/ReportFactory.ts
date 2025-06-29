import { IReport } from './IReport';
import { Report } from '../impl/Report';
import * as DBAPI from '../../db';
import { RecordKeeper as RK } from '../../records/recordKeeper';
import { ASL, LocalStore } from '../../utils/localStore';

export class ReportFactory {
    static async getReport(): Promise<IReport | null> {
        let workflowReport: DBAPI.WorkflowReport | null = null;

        const LS: LocalStore = await ASL.getOrCreateStore();
        const idWorkflowReport: number | undefined = LS.getWorkflowReportID();
        if (idWorkflowReport) {
            workflowReport = await DBAPI.WorkflowReport.fetch(idWorkflowReport);
            if (!workflowReport)
                RK.logError(RK.LogSection.eRPT,'get report failed',`unable to fetch report with id ${idWorkflowReport}`,{},'Report.Factory');
        }

        const idWorkflow: number | undefined = LS.getWorkflowID();
        if ((!workflowReport || workflowReport.idWorkflow !== idWorkflow) && idWorkflow) {
            const workflowReports: DBAPI.WorkflowReport[] | null = await DBAPI.WorkflowReport.fetchFromWorkflow(idWorkflow);
            if (!workflowReports)
                RK.logError(RK.LogSection.eRPT,'get report failed',`unable to fetch reports from workflow with ID ${idWorkflow}`,{},'Report.Factory');
            else if (workflowReports.length > 0)
                workflowReport = workflowReports[0];
            else {
                workflowReport = new DBAPI.WorkflowReport({
                    idWorkflow,
                    MimeType: 'text/html',
                    Data: '',
                    idWorkflowReport: 0,
                    Name: ''
                });
                if (!await workflowReport.create()) {
                    RK.logError(RK.LogSection.eRPT,'get report failed','unable to create WorkflowReport for workflow with ID',{ idWorkflow },'Report.Factory');
                    workflowReport = null;
                }
            }
        }

        if (workflowReport) {
            LS.setWorkflowReportID(workflowReport.idWorkflowReport);
            return new Report(workflowReport);
        }

        RK.logError(RK.LogSection.eRPT,'get report failed','unable to locate active workflow report from LocalStorage',{ idWorkflow, idWorkflowReport },'Report.Factory');
        return null;
    }
}
