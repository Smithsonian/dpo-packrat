import { gql } from 'apollo-server-express';

const getDetailsTabDataForObject = gql`
    query getDetailsTabDataForObject($input: GetDetailsTabDataForObjectInput!) {
        getDetailsTabDataForObject(input: $input) {
            Unit {
                Abbreviation
                ARKPrefix
            }
            Project {
                Description
            }
            Subject {
                Altitude
                Latitude
                Longitude
                R0
                R1
                R2
                R3
                TS0
                TS1
                TS2
                idIdentifierPreferred
            }
            Item {
                EntireSubject
                Altitude
                Latitude
                Longitude
                R0
                R1
                R2
                R3
                TS0
                TS1
                TS2
            }
            CaptureData {
                captureMethod
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
                isValidData
                datasetUse
            }
            Model {
                Model {
                    idModel
                    CountVertices
                    CountFaces
                    CountTriangles
                    CountAnimations
                    CountCameras
                    CountLights
                    CountMaterials
                    CountMeshes
                    CountEmbeddedTextures
                    CountLinkedTextures
                    FileEncoding
                    IsDracoCompressed
                    Name
                    DateCreated
                    idVCreationMethod
                    idVModality
                    idVUnits
                    idVPurpose
                    idVFileType
                    ModelUse
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
                    CountTriangles
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
            Scene {
                Links
                AssetType
                Tours
                Annotation
                EdanUUID
                ApprovedForPublication
                PublicationApprover
                PosedAndQCd
                CanBeQCd
                idScene
            }
            IntermediaryFile {
                idIntermediaryFile
            }
            ProjectDocumentation {
                Description
            }
            Asset {
                AssetType
                idAsset
            }
            AssetVersion {
                Creator
                DateCreated
                StorageSize
                Ingested
                Version
                idAsset
                idAssetVersion
                FilePath
                StorageHash
            }
            Actor {
                OrganizationName
            }
            Stakeholder {
                OrganizationName
                EmailAddress
                PhoneNumberMobile
                PhoneNumberOffice
                MailingAddress
            }
        }
    }
`;

export default getDetailsTabDataForObject;
