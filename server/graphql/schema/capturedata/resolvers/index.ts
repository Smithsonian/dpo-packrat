import CaptureData from './types/CaptureData';
import CaptureDataFile from './types/CaptureDataFile';
import CaptureDataGroup from './types/CaptureDataGroup';
import getCaptureData from './queries/getCaptureData';

const resolvers = {
    Query: {
        getCaptureData
    },
    CaptureData,
    CaptureDataFile,
    CaptureDataGroup
};

export default resolvers;
