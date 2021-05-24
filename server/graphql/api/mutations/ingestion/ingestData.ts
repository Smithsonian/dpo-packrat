import { gql } from 'apollo-server-express';

const ingestData = gql`
    mutation ingestData($input: IngestDataInput!) {
        ingestData(input: $input) {
            success
            message
        }
    }
`;

export default ingestData;
