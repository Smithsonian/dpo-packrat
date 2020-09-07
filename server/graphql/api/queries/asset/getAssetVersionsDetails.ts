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
            Identifier {
                idIdentifier
                IdentifierValue
                idVIdentifierType
            }
        }
    }
`;

export default getAssetVersionsDetails;
