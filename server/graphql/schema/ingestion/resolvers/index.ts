import ingestData from './mutations/ingestData';
import areCameraSettingsUniform from './queries/areCameraSettingsUniform';
import getIngestTitle from './queries/getIngestTitle';

const resolvers = {
    Query: {
        areCameraSettingsUniform,
        getIngestTitle
    },
    Mutation: {
        ingestData
    }
};

export default resolvers;
