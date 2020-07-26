/**
 * Type resolver for UserPersonalizationSystemObject
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const UserPersonalizationSystemObject = {
    User: async (parent: Parent): Promise<DBAPI.User | null> => {
        return await DBAPI.User.fetch(parent.idUser);
    },
    SystemObject: async (parent: Parent): Promise<DBAPI.SystemObject | null> => {
        return await DBAPI.SystemObject.fetch(parent.idSystemObject);
    }
};

export default UserPersonalizationSystemObject;
