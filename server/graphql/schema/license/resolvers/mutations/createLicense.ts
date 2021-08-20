import { CreateLicenseResult, MutationCreateLicenseArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

export default async function createLicense(_: Parent, args: MutationCreateLicenseArgs): Promise<CreateLicenseResult> {
    const { input } = args;
    const { Name, Description, RestrictLevel } = input;

    const licenseArgs = {
        idLicense: 0,
        Name,
        Description,
        RestrictLevel,
    };

    const License = new DBAPI.License(licenseArgs);
    await License.create();
    return { License };
}
