import { CreateLicenseResult, MutationCreateLicenseArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import { Authorization, AUTH_ERROR } from '../../../../../auth/Authorization';

export default async function createLicense(_: Parent, args: MutationCreateLicenseArgs): Promise<CreateLicenseResult> {
    const ctx = Authorization.getContext();
    if (!ctx || !ctx.isAdmin)
        throw new Error(AUTH_ERROR.ADMIN_REQUIRED);

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
