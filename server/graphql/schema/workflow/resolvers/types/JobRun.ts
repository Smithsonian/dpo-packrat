/**
 * Type resolver for JobRun
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const JobRun = {
    Job: async (parent: Parent): Promise<DBAPI.Job | null> => {
        return await DBAPI.Job.fetch(parent.idJob);
    }
};

export default JobRun;