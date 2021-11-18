import { gql } from 'apollo-server-express';

const uploadAsset = gql`
    mutation uploadAsset($file: Upload!, $type: Int!, $idAsset: Int, $idSOAttachment: Int) {
        uploadAsset(file: $file, type: $type, idAsset: $idAsset, idSOAttachment: $idSOAttachment) {
            status
            idAssetVersions
            error
        }
    }
`;

export default uploadAsset;
