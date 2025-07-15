import { gql } from 'apollo-server-express';

const getAssetVersionsDetails = gql`
    query getAssetVersionsDetails($input: GetAssetVersionsDetailsInput!) {
        getAssetVersionsDetails(input: $input) {
            valid
            Details {
                idAssetVersion
                SubjectUnitIdentifier {
                    idSubject
                    idSystemObject
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
                        idIdentifier
                    }
                    datasetUse
                }
                Model {
                    idAssetVersion
                    systemCreated
                    name
                    creationMethod
                    modality
                    purpose
                    units
                    dateCreated
                    modelFileType
                    directory
                    identifiers {
                        identifier
                        identifierType
                        idIdentifier
                    }
                    Variant
                }
                Scene {
                    idAssetVersion
                    systemCreated
                    name
                    directory
                    approvedForPublication
                    posedAndQCd
                    identifiers {
                        identifier
                        identifierType
                        idIdentifier
                    }
                }
            }
        }
    }
`;

export default getAssetVersionsDetails;
