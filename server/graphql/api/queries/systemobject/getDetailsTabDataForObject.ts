import { gql } from 'apollo-server-express';

const getDetailsTabDataForObject = gql`
    query getDetailsTabDataForObject($input: GetDetailsTabDataForObjectInput!) {
        getDetailsTabDataForObject(input: $input) {
            Unit {
                idUnit
                Abbreviation
                ARKPrefix
            }
            Project {
                idProject
                Description
            }
            Subject {
                idSubject
                GeoLocation {
                    idGeoLocation
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
            }
            Item {
                idItem
                EntireSubject
                GeoLocation {
                    idGeoLocation
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
            }
            CaptureData {
                    idAssetVersion
                    dateCaptured
                    datasetType
                    systemCreated
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
                systemCreated
                master
                authoritative
                creationMethod
                modality
                purpose
                units
                dateCaptured
                modelFileType
                uvMaps {
                    name
                    edgeLength
                    mapType
                }
                roughness
                metalness
                pointCount
                faceCount
                isWatertight
                hasNormals
                hasVertexColor
                hasUVSpace
                boundingBoxP1X
                boundingBoxP1Y
                boundingBoxP1Z
                boundingBoxP2X
                boundingBoxP2Y
                boundingBoxP2Z
            }
            Scene {
                idScene
            }
            IntermediaryFile {
                idIntermediaryFile
            }
            ProjectDocumentation {
                idProjectDocumentation
                Description
            }
            Asset {
                idAsset
                FilePath
                VAssetType {
                    idVocabulary
                    Term
                }
            }
            AssetVersion {
                idAssetVersion
                DateCreated
                StorageSize
                Ingested
                Version
                User {
                    idUser
                    Name
                }
            }
            Actor {
                idActor
                OrganizationName
            }
            Stakeholder {
                idStakeholder
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
