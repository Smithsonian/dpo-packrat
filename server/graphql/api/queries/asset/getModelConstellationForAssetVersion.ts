import { gql } from 'apollo-server-express';

const getModelConstellationForAssetVersion = gql`
    query getModelConstellationForAssetVersion($input: GetModelConstellationForAssetVersionInput!) {
        getModelConstellationForAssetVersion(input: $input) {
            idAssetVersion
            ModelConstellation {
                Model {
                    idModel
                    CountVertices,
                    CountFaces,
                    CountAnimations,
                    CountCameras,
                    CountLights,
                    CountMaterials,
                    CountMeshes,
                    CountEmbeddedTextures,
                    CountLinkedTextures,
                    FileEncoding
                    Name
                }
                ModelObjects {
                    idModelObject
                    BoundingBoxP1X
                    BoundingBoxP1Y
                    BoundingBoxP1Z
                    BoundingBoxP1Z
                    BoundingBoxP2X
                    BoundingBoxP2Y
                    BoundingBoxP2Z
                    CountVertices
                    CountFaces
                    CountColorChannels
                    CountTextureCoorinateChannels
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
                    Type
                    Source
                    Value
                    AdditionalAttributes
                    idModelMaterial
                    idModelMaterialChannel
                }
                ModelObjectModelMaterialXref {
                    idModelObjectModelMaterialXref
                    idModelObject
                    idModelMaterial
                }
                ModelAssets {
                    AssetName
                    AssetType
                }
            }
        }
    }
`;

export default getModelConstellationForAssetVersion;
