import { GetAccessPolicyResult, GetAccessPolicyInput } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';

import { fetchAccessPolicy } from '../../../../../db';

type Args = { input: GetAccessPolicyInput };

export default async function getAccessPolicy(_: Parent, args: Args, context: Context): Promise<GetAccessPolicyResult> {
    const { input } = args;
    const { idAccessPolicy } = input;
    const { prisma } = context;

    const AccessPolicy = await fetchAccessPolicy(prisma, Number.parseInt(idAccessPolicy));

    return { AccessPolicy };
}
