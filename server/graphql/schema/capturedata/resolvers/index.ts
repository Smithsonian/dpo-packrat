import CaptureData from './types/CaptureData';
import CaptureDataFile from './types/CaptureDataFile';
import CaptureDataGroup from './types/CaptureDataGroup';
import CaptureDataPhoto from './types/CaptureDataPhoto';
import getCaptureData from './queries/getCaptureData';
import getCaptureDataPhoto from './queries/getCaptureDataPhoto';
import createCaptureData from './mutations/createCaptureData';
import createCaptureDataPhoto from './mutations/createCaptureDataPhoto';
import captureDataUpload from './mutations/captureDataUpload';

const resolvers = {
    Query: {
        getCaptureData,
        getCaptureDataPhoto
    },
    Mutation: {
        createCaptureData,
        createCaptureDataPhoto,
        captureDataUpload
    },
    CaptureData,
    CaptureDataFile,
    CaptureDataGroup,
    CaptureDataPhoto
};

export default resolvers;
