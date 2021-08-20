import { gql } from 'apollo-server-express';

const getAssetDetailsForSystemObject = gql`
    query getAssetDetailsForSystemObject($input: GetAssetDetailsForSystemObjectInput!) {
        getAssetDetailsForSystemObject(input: $input) {
            columns {
                colName
                colDisplay
                colType
                colAlign
                colLabel
            }
            assetDetailRows
        }
    }
`;

export default getAssetDetailsForSystemObject;
