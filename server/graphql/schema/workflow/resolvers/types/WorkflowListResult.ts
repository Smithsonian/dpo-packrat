/**
 * Type resolver for WorkflowListResult
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import { RouteBuilder, eHrefMode } from '../../../../../http/routes/routeBuilder';

const WorkflowListResult = {
    UserInitiator: async (parent: Parent): Promise<DBAPI.User | null> => {
        return await DBAPI.User.fetch(parent.idUserInitiator);
    },
    Owner: async (parent: Parent): Promise<DBAPI.User | null> => {
        return await DBAPI.User.fetch(parent.idOwner);
    },
    Workflow: async (parent: Parent): Promise<DBAPI.Workflow | null> => {
        return await DBAPI.Workflow.fetch(parent.idWorkflow);
    },
    WorkflowSet: async (parent: Parent): Promise<DBAPI.WorkflowSet | null> => {
        return await DBAPI.WorkflowSet.fetch(parent.idWorkflowSet);
    },
    HyperlinkReport: async (parent: Parent): Promise<string | null> => {
        return RouteBuilder.DownloadWorkflowReport(parent.idWorkflowReport, eHrefMode.ePrependServerURL);
    },
    HyperlinkSet: async (parent: Parent): Promise<string | null> => {
        return RouteBuilder.DownloadWorkflowSet(parent.idWorkflowSet, eHrefMode.ePrependServerURL);
    },
    HyperlinkJob: async (parent: Parent): Promise<string | null> => {
        return RouteBuilder.DownloadJobRun(parent.idJobRun, eHrefMode.ePrependServerURL);
    },
};

export default WorkflowListResult;