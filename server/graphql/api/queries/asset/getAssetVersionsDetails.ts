import { gql } from 'apollo-server-express';

const getAssetVersionsDetails = gql`
    query getAssetVersionsDetails($input: GetAssetVersionsDetailsInput!) {
        getAssetVersionsDetails(input: $input) {
            valid
            Details {
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
                    authoritative
                    dateCreated
                    creationMethod
                    modality
                    purpose
                    units
                    master
                    directory
                }                
            }
        }
    }
`;

export default getAssetVersionsDetails;
