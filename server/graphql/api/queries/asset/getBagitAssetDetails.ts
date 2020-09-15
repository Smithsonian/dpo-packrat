import { gql } from 'apollo-server-express';

const getBagitAssetsDetails = gql`
    query getBagitAssetsDetails($input: GetBagitAssetsDetailsInput!) {
        getBagitAssetsDetails(input: $input) {
            BagitMetadata {
                name
                type
                folders
                photogrammetryData {
                    dateCaptured
                    datasetType
                    description
                    datasetFieldId
                    itemPositionType
                    itemPositionFieldId
                    itemArrangementFieldId
                    focusType
                    lightsourceType
                    backgroundRemovalMethod
                    clusterType
                    clusterGeometryFieldId
                }
                identifiers {
                    identifier
                    identifierType
                }
            }
        }
    }
`;

export default getBagitAssetsDetails;
