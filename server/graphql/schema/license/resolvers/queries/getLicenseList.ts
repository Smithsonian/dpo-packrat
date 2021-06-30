import { GetLicenseListResult, GetLicenseListInput } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

type Args = { input: GetLicenseListInput };

export default async function getLicenseList(_: Parent, args: Args): Promise<GetLicenseListResult> {
    const { input } = args;
    const { search } = input;

    const Licenses = await DBAPI.License.fetchLicenseList(search || '');
    return { Licenses: Licenses || [] };
}

