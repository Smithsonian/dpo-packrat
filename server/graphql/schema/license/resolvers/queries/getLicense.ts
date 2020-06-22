import { GetLicenseResult, GetLicenseInput } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';
import { resolveLicenseByID } from '../types/License';

type Args = { input: GetLicenseInput };

export default async function getLicense(_: Parent, args: Args, context: Context): Promise<GetLicenseResult> {
    const { input } = args;
    const { id } = input;
    const { prisma } = context;

    const license = await resolveLicenseByID(prisma, Number.parseInt(id));

    if (license) {
        return { license };
    }

    return { license: null };
}
