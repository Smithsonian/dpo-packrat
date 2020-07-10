/**
 * Type resolver for AccessContext
 */
import { AccessContextObject, AccessPolicy } from '@prisma/client';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const AccessContext = {
    AccessContextObject: async (parent: Parent): Promise<AccessContextObject[] | null> => {
        return await DBAPI.AccessContextObject.fetchFromAccessContext(parent.idAccessContext);
    },
    AccessPolicy: async (parent: Parent): Promise<AccessPolicy[] | null> => {
        return await DBAPI.AccessPolicy.fetchFromAccessContext(parent.idAccessContext);
    }
};

export default AccessContext;
