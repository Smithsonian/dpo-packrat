import { gql } from 'apollo-server-express';

const getUploadedAssetVersion = gql`
    query getUploadedAssetVersion {
        getUploadedAssetVersion {
            AssetVersion {
                idAssetVersion
                StorageSize
                FileName
                Asset {
                    idAsset
                    VAssetType {
                        idVocabulary
                        Term
                    }
                }
            }
        }
    }
`;

export default getUploadedAssetVersion;
