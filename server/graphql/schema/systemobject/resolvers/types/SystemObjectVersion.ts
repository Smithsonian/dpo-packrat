/**
 * Type resolver for SystemObjectVersion
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const SystemObjectVersion = {
    SystemObject: async (parent: Parent): Promise<DBAPI.SystemObject | null> => {
        return await DBAPI.SystemObject.fetch(parent.idSystemObject);
    }
};

export default SystemObjectVersion;
