import ingestData from './mutations/ingestData';
import areCameraSettingsUniform from './queries/areCameraSettingsUniform';

const resolvers = {
    Query: {
        areCameraSettingsUniform
    },
    Mutation: {
        ingestData
    }
};

export default resolvers;
