import { gql } from 'apollo-server-express';

const createCaptureData = gql`
    query createCaptureData($input: CreateCaptureDataInput!) {
        createCaptureData(input: $input) {
            CaptureData {
                idCaptureData
            }
        }
    }
`;

export default createCaptureData;
