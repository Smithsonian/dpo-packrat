/**
 * Type resolver for License
 */

import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const License = {
    LicenseAssignment: async (parent: Parent): Promise<DBAPI.LicenseAssignment[] | null> => {
        return await DBAPI.LicenseAssignment.fetchFromLicense(parent.idLicense);
    }
};

export default License;
