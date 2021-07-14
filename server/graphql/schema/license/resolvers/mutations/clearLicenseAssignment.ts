import { ClearLicenseAssignmentResult, MutationClearLicenseAssignmentArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

export default async function createLicense(_: Parent, args: MutationClearLicenseAssignmentArgs): Promise<ClearLicenseAssignmentResult> {
    const {
        input: { idSystemObject, clearAll }
    } = args;

    const clearAssignmentSuccess = await DBAPI.LicenseManager.clearAssignment(idSystemObject, clearAll || undefined);
    if (clearAssignmentSuccess) return { success: true, message: '' };

    return { success: false, message: 'Error in clearing assignment' };
}
