import { gql } from 'apollo-server-express';

const createCaptureDataPhoto = gql`
    mutation createCaptureDataPhoto($input: CreateCaptureDataPhotoInput!) {
        createCaptureDataPhoto(input: $input) {
            CaptureDataPhoto {
                idCaptureDataPhoto
            }
        }
    }
`;

export default createCaptureDataPhoto;
