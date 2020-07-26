import { GetLicenseResult, GetLicenseInput } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

type Args = { input: GetLicenseInput };

export default async function getLicense(_: Parent, args: Args): Promise<GetLicenseResult> {
    const { input } = args;
    const { idLicense } = input;

    const License = await DBAPI.License.fetch(idLicense);
    return { License };
}
