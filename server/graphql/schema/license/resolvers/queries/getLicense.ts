import { GetLicenseResult, GetLicenseInput } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';
import { fetchLicense } from '../../../../../db';

type Args = { input: GetLicenseInput };

export default async function getLicense(_: Parent, args: Args, context: Context): Promise<GetLicenseResult> {
    const { input } = args;
    const { idLicense } = input;
    const { prisma } = context;

    const License = await fetchLicense(prisma, Number.parseInt(idLicense));

    return { License };
}
