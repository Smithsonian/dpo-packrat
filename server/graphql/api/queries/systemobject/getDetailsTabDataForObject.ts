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
            }
            Model {
                size
                master
                authoritative
                creationMethod
                modality
                purpose
                units
                modelFileType
                dateCaptured
                uvMaps {
                    name
                    edgeLength
                    mapType
                }
                boundingBoxP1X
                boundingBoxP1Y
                boundingBoxP1Z
                boundingBoxP2X
                boundingBoxP2Y
                boundingBoxP2Z
                countPoint
                countFace
                countColorChannel
                countTextureCoorinateChannel
                hasBones
                hasFaceNormals
                hasTangents
                hasTextureCoordinates
                hasVertexNormals
                hasVertexColor
                isTwoManifoldUnbounded
                isTwoManifoldBounded
                isWatertight
                selfIntersecting
            }
            Scene {
                Links
                AssetType
                Tours
                Annotation
                HasBeenQCd
                IsOriented
            }
            IntermediaryFile {
                idIntermediaryFile
            }
            ProjectDocumentation {
                Description
            }
            Asset {
                FilePath
                AssetType
            }
            AssetVersion {
                Creator
                DateCreated
                StorageSize
                Ingested
                Version
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
