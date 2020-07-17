/**
 * Type resolver for Stakeholder
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const Stakeholder = {
    SystemObject: async (parent: Parent): Promise<DBAPI.SystemObject | null> => {
        return await DBAPI.SystemObject.fetchFromStakeholderID(parent.idStakeholder);
    }
};

export default Stakeholder;
