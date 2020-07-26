import CaptureData from './types/CaptureData';
import CaptureDataFile from './types/CaptureDataFile';
import CaptureDataGroup from './types/CaptureDataGroup';
import getCaptureData from './queries/getCaptureData';
import createCaptureData from './mutations/createCaptureData';

const resolvers = {
    Query: {
        getCaptureData
    },
    Mutation: {
        createCaptureData
    },
    CaptureData,
    CaptureDataFile,
    CaptureDataGroup
};

export default resolvers;
