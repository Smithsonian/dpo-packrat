import { GetWorkflowListResult, QueryGetWorkflowListArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import * as LOG from '../../../../../utils/logger';

export default async function getWorkflowList(_: Parent, args: QueryGetWorkflowListArgs): Promise<GetWorkflowListResult> {
    const { input } = args;
    const WorkflowList: DBAPI.WorkflowListResult[] | null =
        await DBAPI.WorkflowListResult.search(input.idVWorkflowType, input.idVJobType, input.State,
            input.DateFrom, input.DateTo, input.idUserInitiator, input.idUserOwner,
            input.pageNumber, input.rowCount, input.sortBy, input.sortOrder);
    if (!WorkflowList) {
        LOG.error(`getWorkflowList(${JSON.stringify(input)}) failed`, LOG.LS.eGQL);
        return { WorkflowList: [] };
    }
    return { WorkflowList };
}