import * as WF from '../../workflow/interface';
import * as REP from '../../report/interface';
import * as H from '../../utils/helpers';
import { RecordKeeper as RK } from '../../records/recordKeeper';

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
                RK.logError(RK.LogSection.eGQL,'append to WorkflowReport',`called from other function: ${content}`,{},'GraphQL.Resolver');
            else
                RK.logInfo(RK.LogSection.eGQL,content,undefined,{},'GraphQL.Resolver');
        }

        if (this.workflowHelper && !this.workflowHelper.workflowReport)
            this.workflowHelper.workflowReport = await REP.ReportFactory.getReport();

        const seperator: string = (this.buffer) ? '<br/>\n' : '';
        if (!(this?.workflowHelper?.workflowReport)) {
            this.buffer += seperator + content;
            RK.logError(RK.LogSection.eGQL,'append to WorkflowReport failed','no active WorkflowReport',{ ...this.workflowHelper },'GraphQL.Resolver');
            return { success: false, error: 'No Active WorkflowReport' };
        }
        const ret: H.IOResults = await this.workflowHelper.workflowReport.append(this.buffer + seperator + content);
        this.buffer = '';
        return ret;
    }
}