import { gql } from 'apollo-server-express';

const getUploadedAssetVersion = gql`
    query getUploadedAssetVersion {
        getUploadedAssetVersion {
            AssetVersion {
                idAssetVersion
                StorageSize
                Asset {
                    idAsset
                    FileName
                }
            }
        }
    }
`;

export default getUploadedAssetVersion;
