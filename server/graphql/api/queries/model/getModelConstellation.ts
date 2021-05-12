import { gql } from 'apollo-server-express';

const getModelConstellation = gql`
    query getModelConstellation($input: GetModelConstellationInput!) {
        getModelConstellation(input: $input) {
            ModelConstellation {
                Model {
                    idModel
                    Name
                    DateCreated
                    Authoritative
                    VCreationMethod {
                        Term
                    }
                    VModality {
                        Term
                    }
                    VPurpose {
                        Term
                    }
                    VUnits {
                        Term
                    }
                    VFileType {
                        Term
                    }
                    idAssetThumbnail
                    CountAnimations
                    CountCameras
                    CountFaces
                    CountLights
                    CountMaterials
                    CountMeshes
                    CountVertices
                    CountEmbeddedTextures
                    CountLinkedTextures
                    FileEncoding
                }
                ModelObjects {
                    idModelObject
                    idModel
                    BoundingBoxP1X
                    BoundingBoxP1Y
                    BoundingBoxP1Z
                    BoundingBoxP2X
                    BoundingBoxP2Y
                    BoundingBoxP2Z
                    CountVertices
                    CountFaces
                    CountColorChannels
                    CountTextureCoordinateChannels
                    HasBones
                    HasFaceNormals
                    HasTangents
                    HasTextureCoordinates
                    HasVertexNormals
                    HasVertexColor
                    IsTwoManifoldUnbounded
                    IsTwoManifoldBounded
                    IsWatertight
                    SelfIntersecting
                }
                ModelMaterials {
                    idModelMaterial
                    Name
                }
                ModelMaterialChannels {
                    idModelMaterialChannel
                    idModelMaterial
                    Type
                    Source
                    Value
                    VMaterialType {
                        Term
                    }
                    MaterialTypeOther
                    idModelMaterialUVMap
                    UVMapEmbedded
                    ChannelPosition
                    ChannelWidth
                    Scalar1
                    Scalar2
                    Scalar3
                    Scalar4
                    AdditionalAttributes
                }
                ModelMaterialUVMaps {
                    idModelMaterialUVMap
                    idModel
                    idAsset
                    UVMapEdgeLength
                }
                ModelObjectModelMaterialXref {
                    idModelObject
                    idModelMaterial
                }
                ModelAssets {
                    AssetName
                    AssetType
                    AssetVersion {
                        idAsset
                        idAssetVersion
                        FileName
                    }
                }
            }
        }
    }
`;

export default getModelConstellation;
