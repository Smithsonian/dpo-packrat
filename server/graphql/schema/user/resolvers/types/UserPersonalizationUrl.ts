/**
 * Type resolver for UserPersonalizationUrl
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const UserPersonalizationUrl = {
    User: async (parent: Parent): Promise<DBAPI.User | null> => {
        return await DBAPI.User.fetch(parent.idUser);
    }
};

export default UserPersonalizationUrl;
