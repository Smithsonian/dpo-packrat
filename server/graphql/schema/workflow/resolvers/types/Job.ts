/**
 * Type resolver for Job
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const Job = {
    VJobType: async (parent: Parent): Promise<DBAPI.Vocabulary | null> => {
        return await DBAPI.Vocabulary.fetch(parent.idVJobType);
    }
};

export default Job;