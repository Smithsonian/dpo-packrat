import { GetWorkflowResult, GetWorkflowInput } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

type Args = { input: GetWorkflowInput };

export default async function getWorkflow(_: Parent, args: Args): Promise<GetWorkflowResult> {
    const { input } = args;
    const { idWorkflow } = input;

    const Workflow = await DBAPI.Workflow.fetch(idWorkflow);
    return { Workflow };
}
