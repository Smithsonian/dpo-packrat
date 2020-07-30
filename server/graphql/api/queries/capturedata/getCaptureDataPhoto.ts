import { gql } from 'apollo-server-express';

const getCaptureDataPhoto = gql`
    query getCaptureDataPhoto($input: GetCaptureDataPhotoInput!) {
        getCaptureDataPhoto(input: $input) {
            CaptureDataPhoto {
                idCaptureDataPhoto
            }
        }
    }
`;

export default getCaptureDataPhoto;
