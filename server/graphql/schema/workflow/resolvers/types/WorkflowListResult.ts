/**
 * Type resolver for WorkflowListResult
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import { RouteBuilder, eHrefMode } from '../../../../../http/routes/routeBuilder';

const WorkflowListResult = {
    UserInitiator: async (parent: Parent): Promise<DBAPI.User | null> => {
        return parent.idUserInitiator ? await DBAPI.User.fetch(parent.idUserInitiator) : null;
    },
    Owner: async (parent: Parent): Promise<DBAPI.User | null> => {
        return parent.idOwner ? await DBAPI.User.fetch(parent.idOwner) : null;
    },
    Workflow: async (parent: Parent): Promise<DBAPI.Workflow | null> => {
        return parent.idWorkflow ? await DBAPI.Workflow.fetch(parent.idWorkflow) : null;
    },
    WorkflowReport: async (parent: Parent): Promise<DBAPI.WorkflowReport | null> => {
        return parent.idWorkflowReport ? await DBAPI.WorkflowReport.fetch(parent.idWorkflowReport) : null;
    },
    WorkflowSet: async (parent: Parent): Promise<DBAPI.WorkflowSet | null> => {
        return parent.idWorkflowSet ? await DBAPI.WorkflowSet.fetch(parent.idWorkflowSet) : null;
    },
    JobRun: async (parent: Parent): Promise<DBAPI.JobRun | null> => {
        return parent.idJobRun ? await DBAPI.JobRun.fetch(parent.idJobRun) : null;
    },
    HyperlinkReport: async (parent: Parent): Promise<string | null> => {
        return parent.idWorkflowReport ? RouteBuilder.DownloadWorkflowReport(parent.idWorkflowReport, eHrefMode.ePrependServerURL) : null;
    },
    HyperlinkSet: async (parent: Parent): Promise<string | null> => {
        return parent.idWorkflowSet ? RouteBuilder.DownloadWorkflowSet(parent.idWorkflowSet, eHrefMode.ePrependServerURL) : null;
    },
    HyperlinkJob: async (parent: Parent): Promise<string | null> => {
        return parent.idJobRun ? RouteBuilder.DownloadJobRun(parent.idJobRun, eHrefMode.ePrependServerURL) : null;
    },
};

export default WorkflowListResult;