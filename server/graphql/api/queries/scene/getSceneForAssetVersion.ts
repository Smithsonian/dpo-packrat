import { gql } from 'apollo-server-express';

const getSceneForAssetVersion = gql`
    query getSceneForAssetVersion($input: GetSceneForAssetVersionInput!) {
        getSceneForAssetVersion(input: $input) {
            idAssetVersion
            success
            message
            SceneConstellation {
                Scene {
                    idScene
                    idAssetThumbnail
                    Name
                    CountScene
                    CountNode
                    CountCamera
                    CountLight
                    CountModel
                    CountMeta
                    CountSetup
                    CountTour
                    ApprovedForPublication
                    PosedAndQCd
                }
                ModelSceneXref {
                    idModelSceneXref
                    idModel
                    idScene
                    Name
                    Usage
                    Quality
                    FileSize
                    UVResolution
                    BoundingBoxP1X
                    BoundingBoxP1Y
                    BoundingBoxP1Z
                    BoundingBoxP2X
                    BoundingBoxP2Y
                    BoundingBoxP2Z
                    Model {
                        SystemObject {
                            idSystemObject
                            idAsset
                        }
                    }
                }
                SvxNonModelAssets {
                    uri
                    type
                    description
                    size
                    idAssetVersion
                }
            }
        }
    }
`;

export default getSceneForAssetVersion;
