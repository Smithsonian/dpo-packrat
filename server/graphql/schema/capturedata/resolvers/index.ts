import CaptureData from './types/CaptureData';
import CaptureDataFile from './types/CaptureDataFile';
import CaptureDataGroup from './types/CaptureDataGroup';
import CaptureDataPhoto from './types/CaptureDataPhoto';
import getCaptureData from './queries/getCaptureData';
import getCaptureDataPhoto from './queries/getCaptureDataPhoto';
import createCaptureData from './mutations/createCaptureData';
import createCaptureDataPhoto from './mutations/createCaptureDataPhoto';

const resolvers = {
    Query: {
        getCaptureData,
        getCaptureDataPhoto,
    },
    Mutation: {
        createCaptureData,
        createCaptureDataPhoto
    },
    CaptureData,
    CaptureDataFile,
    CaptureDataGroup,
    CaptureDataPhoto
};

export default resolvers;
