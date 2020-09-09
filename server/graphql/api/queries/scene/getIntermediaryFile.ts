import { gql } from 'apollo-server-express';

const getIntermediaryFile = gql`
    query getIntermediaryFile($input: GetIntermediaryFileInput!) {
        getIntermediaryFile(input: $input) {
            IntermediaryFile {
                idIntermediaryFile
            }
        }
    }
`;

export default getIntermediaryFile;
