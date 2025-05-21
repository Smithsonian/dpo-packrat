import { GetWorkflowListResult, QueryGetWorkflowListArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import { RecordKeeper as RK } from '../../../../../records/recordKeeper';

export default async function getWorkflowList(_: Parent, args: QueryGetWorkflowListArgs): Promise<GetWorkflowListResult> {
    const { input } = args;
    const WorkflowList: DBAPI.WorkflowListResult[] | null =
        await DBAPI.WorkflowListResult.search(input.idVWorkflowType, input.idVJobType, input.State,
            input.DateFrom, input.DateTo, input.idUserInitiator, input.idUserOwner,
            input.pageNumber, input.rowCount, input.sortBy, input.sortOrder);
    if (!WorkflowList) {
        RK.logError(RK.LogSection.eGQL,'get workflow list failed','list does not exist',{ input },'GraphQL.Workflow.List');
        return { WorkflowList: [] };
    }
    return { WorkflowList };
}