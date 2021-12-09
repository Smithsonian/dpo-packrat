import { IReport } from '../interface/IReport';
import { WorkflowReport } from '../../db';
import * as H from '../../utils/helpers';

export class Report implements IReport {
    private _workflowReport: WorkflowReport;
    constructor(workflowReport: WorkflowReport) {
        this._workflowReport = workflowReport;
    }

    async append(content: string): Promise<H.IOResults> {
        const seperator: string = (this._workflowReport.Data) ? '<br/>\n' : '';
        this._workflowReport.Data += seperator + content;
        if (await this._workflowReport.update())
            return { success: true };
        return { success: false, error: 'Database error persisting WorkflowReport' };
    }
}