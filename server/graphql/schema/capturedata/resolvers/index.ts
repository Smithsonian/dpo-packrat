import CaptureData from './types/CaptureData';
import CaptureDataFile from './types/CaptureDataFile';
import CaptureDataGroup from './types/CaptureDataGroup';
import CaptureDataPhoto from './types/CaptureDataPhoto';
import CaptureDataVolume from './types/CaptureDataVolume';
import getCaptureData from './queries/getCaptureData';
import getCaptureDataPhoto from './queries/getCaptureDataPhoto';
import getCaptureDataVolume from './queries/getCaptureDataVolume';
import createCaptureData from './mutations/createCaptureData';
import createCaptureDataPhoto from './mutations/createCaptureDataPhoto';

const resolvers = {
    Query: {
        getCaptureData,
        getCaptureDataPhoto,
        getCaptureDataVolume
    },
    Mutation: {
        createCaptureData,
        createCaptureDataPhoto
    },
    CaptureData,
    CaptureDataFile,
    CaptureDataGroup,
    CaptureDataPhoto,
    CaptureDataVolume
};

export default resolvers;
