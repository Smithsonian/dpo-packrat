/**
 * Type resolver for Identifier
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const Identifier = {
    SystemObject: async (parent: Parent): Promise<DBAPI.SystemObject | null> => {
        return await DBAPI.SystemObject.fetch(parent.idSystemObject);
    },
    VIdentifierType: async (parent: Parent): Promise<DBAPI.Vocabulary | null> => {
        return await DBAPI.Vocabulary.fetch(parent.idVIdentifierType);
    }
};

export default Identifier;
