import * as WF from '../../workflow/interface';
import * as REP from '../../report/interface';
import * as H from '../../utils/helpers';
import * as COMMON from '@dpo-packrat/common';
import { RecordKeeper as RK } from '../../records/recordKeeper';

export interface IWorkflowHelper extends H.IOResults {
    workflowEngine?: WF.IWorkflowEngine | null | undefined;
    workflow?: WF.IWorkflow | null | undefined;
    workflowReport?: REP.IReport | null | undefined;
}

/** Reduce a legacy HTML-ish report line to plain text: drop tags, decode the few common entities,
 * collapse whitespace. Keeps the structured JSON body free of markup (and of its XSS surface). */
function stripReportHtml(content: string): string {
    return content
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, '\'')
        .replace(/&nbsp;/g, ' ')
        .replace(/[ \t]+/g, ' ')
        .trim();
}

export class ResolverBase {
    protected workflowHelper: IWorkflowHelper | undefined = undefined;
    private buffer: COMMON.IWorkflowReportEvent[] = [];

    protected async appendToWFReport(content: string, log?: boolean | undefined, error?: boolean | undefined): Promise<H.IOResults> {
        if (log && log===true) {
            if (error && error==true)
                RK.logError(RK.LogSection.eGQL,'append to WorkflowReport',`called from other function: ${content}`,{},'GraphQL.Resolver');
            else
                RK.logInfo(RK.LogSection.eGQL,content,undefined,{},'GraphQL.Resolver');
        }

        if (this.workflowHelper && !this.workflowHelper.workflowReport)
            this.workflowHelper.workflowReport = await REP.ReportFactory.getReport();

        const event: COMMON.IWorkflowReportEvent = {
            ts: new Date().toISOString(),
            phase: 'ingest',
            code: COMMON.WorkflowReportCode.IngestNote,
            level: (error === true) ? 'error' : 'info',
            msg: stripReportHtml(content)
        };

        if (!(this?.workflowHelper?.workflowReport)) {
            this.buffer.push(event);
            RK.logDebug(RK.LogSection.eGQL,'append to WorkflowReport deferred','no active WorkflowReport yet, buffering content',{ ...this.workflowHelper },'GraphQL.Resolver');
            return { success: true };
        }

        for (const buffered of this.buffer)
            await RK.reportEvent(buffered, this.workflowHelper.workflowReport);
        this.buffer = [];
        const result = await RK.reportEvent(event, this.workflowHelper.workflowReport);
        return { success: result.success, error: result.success ? undefined : result.message };
    }
}
