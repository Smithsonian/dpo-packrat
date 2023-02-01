import { gql } from 'apollo-server-express';

const getVoyagerParams = gql`
    query getVoyagerParams($input: GetVoyagerParamsInput!) {
        getVoyagerParams(input: $input) {
            path
            document
            idSystemObjectScene
        }
    }
`;

export default getVoyagerParams;
