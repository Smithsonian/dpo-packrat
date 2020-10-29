import { gql } from 'apollo-server-express';

const getUploadedAssetVersion = gql`
    query getUploadedAssetVersion {
        getUploadedAssetVersion {
            AssetVersion {
                idAssetVersion
                StorageSize
                FileName
                DateCreated
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
