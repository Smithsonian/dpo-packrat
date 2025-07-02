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
                idSOAttachment
                SOAttachmentObjectType
            }
            idAssetVersionsUpdated
            UpdatedAssetVersionMetadata {
                idAssetVersion
                UpdatedObjectName
                Item {
                    Name
                }
                CaptureDataPhoto {
                    name
                    dateCaptured
                    datasetType
                    description
                    cameraSettingUniform
                    datasetFieldId
                    itemPositionType
                    itemPositionFieldId
                    itemArrangementFieldId
                    focusType
                    lightsourceType
                    backgroundRemovalMethod
                    clusterType
                    clusterGeometryFieldId
                    folders {
                        name
                        variantType
                    }
                    datasetUse
                }
                Model {
                    name
                    creationMethod
                    modality
                    purpose
                    units
                    dateCreated
                    modelFileType
                    ModelUse
                }
                Scene {
                    name
                    approvedForPublication
                    posedAndQCd
                    referenceModels {
                        idSystemObject
                        name
                        usage
                        quality
                        fileSize
                        resolution
                        boundingBoxP1X
                        boundingBoxP1Y
                        boundingBoxP1Z
                        boundingBoxP2X
                        boundingBoxP2Y
                        boundingBoxP2Z
                    }
                }
            }
        }
    }
`;

export default getUploadedAssetVersion;
