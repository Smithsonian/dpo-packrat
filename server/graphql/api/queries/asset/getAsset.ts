import { gql } from 'apollo-server-express';

const getAsset = gql`
    query getAsset($input: GetAssetInput!) {
        getAsset(input: $input) {
            Asset {
                idAsset
                idVAssetType
            }
        }
    }
`;

export default getAsset;
