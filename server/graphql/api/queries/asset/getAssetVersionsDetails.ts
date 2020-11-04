import { gql } from 'apollo-server-express';

const getAssetVersionsDetails = gql`
    query getAssetVersionsDetails($input: GetAssetVersionsDetailsInput!) {
        getAssetVersionsDetails(input: $input) {
            valid
            Details {
                idAssetVersion
                SubjectUnitIdentifier {
                    idSubject
                    SubjectName
                    UnitAbbreviation
                    IdentifierPublic
                    IdentifierCollection
                }
                Project {
                    idProject
                    Name
                }
                Item {
                    idItem
                    Name
                    EntireSubject
                }
                CaptureDataPhoto {
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
                    directory
                    folders {
                        name
                        variantType
                    }
                    identifiers {
                        identifier
                        identifierType
                    }
                }
                Model {
                    idAssetVersion
                    systemCreated
                    master
                    authoritative
                    creationMethod
                    modality
                    purpose
                    units
                    dateCaptured
                    modelFileType
                    directory
                    identifiers {
                        identifier
                        identifierType
                    }
                    uvMaps {
                        name
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
                    idAssetVersion
                    identifiers {
                        identifier
                        identifierType
                    }
                }
            }
        }
    }
`;

export default getAssetVersionsDetails;
