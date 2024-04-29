import { IReport } from '../interface/IReport';
import { WorkflowReport } from '../../db';
import * as H from '../../utils/helpers';

export class Report implements IReport {
    workflowReport: WorkflowReport;

    constructor(workflowReport: WorkflowReport) {
        this.workflowReport = workflowReport;
    }

    async append(content: string): Promise<H.IOResults> {
        const seperator: string = (this.workflowReport.Data) ? '<br/>\n' : '';
        this.workflowReport.Data += seperator + content;
        if (await this.workflowReport.update())
            return { success: true };
        return { success: false, error: 'Database error persisting WorkflowReport' };
    }
}