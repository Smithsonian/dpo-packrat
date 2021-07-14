import { AssignLicenseResult, MutationAssignLicenseArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

export default async function assignLicense(_: Parent, args: MutationAssignLicenseArgs): Promise<AssignLicenseResult> {
    const {
        input: { idSystemObject, idLicense }
    } = args;

    const fetchedLicense = await DBAPI.License.fetch(idLicense);
    if (fetchedLicense) {
        const assignmentSuccess = await DBAPI.LicenseManager.setAssignment(idSystemObject, fetchedLicense);
        if (!assignmentSuccess) {
            return {
                success: false,
                message: 'Error with assigning license'
            };
        }
    } else {
        return {
            success: false,
            message: 'Error with fetching desired license'
        };
    }

    return { success: true, message: '' };
}
