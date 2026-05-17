import { CreateLicenseResult, MutationUpdateLicenseArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import { Authorization, AUTH_ERROR } from '../../../../../auth/Authorization';
import { withAuditTransaction } from '../../../../../audit/withAuditTransaction';

export default async function updateLicense(_: Parent, args: MutationUpdateLicenseArgs): Promise<CreateLicenseResult> {
    const ctx = Authorization.getContext();
    if (!ctx || !ctx.isAdmin)
        throw new Error(AUTH_ERROR.ADMIN_REQUIRED);

    const { input } = args;
    const { idLicense, Name, Description, RestrictLevel } = input;

    return withAuditTransaction(async () => {
        const License = await DBAPI.License.fetch(idLicense);

        if (License === null)
            throw new Error('License not found');

        License.Name = Name;
        License.Description = Description;
        License.RestrictLevel = RestrictLevel;
        const success = await License.update();
        if (!success)
            throw new Error('Error when updating license in updateLicense.ts');

        return { License };
    });
}
