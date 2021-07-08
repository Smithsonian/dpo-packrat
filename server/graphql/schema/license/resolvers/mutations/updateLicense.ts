import { CreateLicenseResult, MutationUpdateLicenseArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
// import * as LOG from '../../../../utils/logger';

export default async function updateLicense(_: Parent, args: MutationUpdateLicenseArgs): Promise<CreateLicenseResult> {
    const { input } = args;
    const { idLicense, Name, Description } = input;

    const License = await DBAPI.License.fetch(idLicense);

    if (License === null) {
        // LOG.info('Error when fetching license in updateLicense.ts', LOG.LS.eGQL);
        throw new Error('License not found');
    }

    License.Name = Name;
    License.Description = Description;
    const success = await License.update();
    if (!success) {
        // LOG.info('Error when updating license in updateLicense.ts', LOG.LS.eGQL);
        throw new Error('Error when updating license in updateLicense.ts');
    }

    return { License };
}
