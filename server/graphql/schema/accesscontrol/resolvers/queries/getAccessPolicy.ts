import { GetAccessPolicyResult, GetAccessPolicyInput } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';

import * as DBAPI from '../../../../../db';

type Args = { input: GetAccessPolicyInput };

export default async function getAccessPolicy(_: Parent, args: Args): Promise<GetAccessPolicyResult> {
    const { input } = args;
    const { idAccessPolicy } = input;

    const AccessPolicy = await DBAPI.AccessPolicy.fetch(idAccessPolicy);

    return { AccessPolicy: AccessPolicy != null ? AccessPolicy : null };
}
