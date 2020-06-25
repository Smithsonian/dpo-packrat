import { GetWorkflowResult, GetWorkflowInput } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';

import { fetchWorkflow } from '../../../../../db';

type Args = { input: GetWorkflowInput };

export default async function getWorkflow(_: Parent, args: Args, context: Context): Promise<GetWorkflowResult> {
    const { input } = args;
    const { idWorkflow } = input;
    const { prisma } = context;

    const Workflow = await fetchWorkflow(prisma, Number.parseInt(idWorkflow));

    return { Workflow };
}
