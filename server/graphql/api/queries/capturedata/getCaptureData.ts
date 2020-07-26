import { gql } from 'apollo-server-express';

const getCaptureData = gql`
    query getCaptureData($input: GetCaptureDataInput!) {
        getCaptureData(input: $input) {
            CaptureData {
                idCaptureData
            }
        }
    }
`;

export default getCaptureData;
