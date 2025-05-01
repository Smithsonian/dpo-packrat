import * as WF from '../../workflow/interface';
import * as REP from '../../report/interface';
import * as LOG from '../../utils/logger';
import * as H from '../../utils/helpers';

export interface IWorkflowHelper extends H.IOResults {
    workflowEngine?: WF.IWorkflowEngine | null | undefined;
    workflow?: WF.IWorkflow | null | undefined;
    workflowReport?: REP.IReport | null | undefined;
}

export class ResolverBase {
    protected workflowHelper: IWorkflowHelper | undefined = undefined;
    private buffer: string = '';

    protected async appendToWFReport(content: string, log?: boolean | undefined, error?: boolean | undefined): Promise<H.IOResults> {
        if (log && log===true) {
            if (error && error==true)
                LOG.error(content, LOG.LS.eGQL);
            else
                LOG.info(content, LOG.LS.eGQL);
        }

        if (this.workflowHelper && !this.workflowHelper.workflowReport)
            this.workflowHelper.workflowReport = await REP.ReportFactory.getReport();

        const seperator: string = (this.buffer) ? '<br/>\n' : '';
        if (!(this?.workflowHelper?.workflowReport)) {
            this.buffer += seperator + content;
            return { success: false, error: 'No Active WorkflowReport' };
        }
        const ret: H.IOResults = await this.workflowHelper.workflowReport.append(this.buffer + seperator + content);
        this.buffer = '';
        return ret;
    }
}