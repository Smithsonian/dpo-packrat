/**
 * Type resolver for LicenseAssignment
 */

import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const LicenseAssignment = {
    License: async (parent: Parent): Promise<DBAPI.License | null> => {
        return await DBAPI.License.fetch(parent.idLicense);
    },
    SystemObject: async (parent: Parent): Promise<DBAPI.SystemObject | null> => {
        return await DBAPI.SystemObject.fetch(parent.idSystemObject);
    },
    UserCreator: async (parent: Parent): Promise<DBAPI.User | null> => {
        return await DBAPI.User.fetch(parent.idUserCreator);
    }
};

export default LicenseAssignment;
