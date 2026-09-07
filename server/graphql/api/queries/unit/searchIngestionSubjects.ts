import { gql } from 'apollo-server-express';

const searchIngestionSubjects = gql`
    query searchIngestionSubjects($input: SearchIngestionSubjectsInput!) {
        searchIngestionSubjects(input: $input) {
            SubjectUnitIdentifier {
                idSubject
                idSystemObject
                SubjectName
                UnitAbbreviation
                IdentifierPublic
                IdentifierCollection
            }
            error
        }
    }
`;

export default searchIngestionSubjects;
