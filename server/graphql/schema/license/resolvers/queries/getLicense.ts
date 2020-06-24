import { GetLicenseResult, GetLicenseInput } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';
import { resolveLicenseByID } from '../types/License';

type Args = { input: GetLicenseInput };

export default async function getLicense(_: Parent, args: Args, context: Context): Promise<GetLicenseResult> {
    const { input } = args;
    const { idLicense } = input;
    const { prisma } = context;

    const License = await resolveLicenseByID(prisma, Number.parseInt(idLicense));

    if (License) {
        return { License };
    }

    return { License: null };
}
