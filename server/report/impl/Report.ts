import { IReport } from '../interface/IReport';
import { WorkflowReport } from '../../db';
import { ReportQueue } from './ReportQueue';
import * as H from '../../utils/helpers';
import * as COMMON from '@dpo-packrat/common';

export class Report implements IReport {
    workflowReport: WorkflowReport;

    constructor(workflowReport: WorkflowReport) {
        this.workflowReport = workflowReport;
    }

    async append(content: string): Promise<H.IOResults> {
        return this.appendEvent({ ts: new Date().toISOString(), phase: 'system', code: COMMON.WorkflowReportCode.LegacyText, msg: content });
    }

    async appendEvent(event: COMMON.IWorkflowReportEvent): Promise<H.IOResults> {
        return ReportQueue.appendEvent(this.workflowReport, event);
    }

    async setSummary(summary: COMMON.IWorkflowReportSummary): Promise<H.IOResults> {
        return ReportQueue.setSummary(this.workflowReport, summary);
    }
}
