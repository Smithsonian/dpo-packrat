import { gql } from 'apollo-server-express';

const getAssetVersionsDetails = gql`
    query getAssetVersionsDetails($input: GetAssetVersionsDetailsInput!) {
        getAssetVersionsDetails(input: $input) {
            valid
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
        }
    }
`;

export default getAssetVersionsDetails;
