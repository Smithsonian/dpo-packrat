import { gql } from 'apollo-server-express';

const uploadAsset = gql`
    mutation uploadAsset($file: Upload!, $type: AssetType!) {
        uploadAsset(file: $file, type: $type) {
            status
        }
    }
`;

export default uploadAsset;
