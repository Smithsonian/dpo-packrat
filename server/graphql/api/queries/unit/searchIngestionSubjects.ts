import { gql } from 'apollo-server-express';

const searchIngestionSubjects = gql`
    query searchIngestionSubjects($input: SearchIngestionSubjectsInput!) {
        searchIngestionSubjects(input: $input) {
            SubjectUnitIdentifier {
                idSubject
                SubjectName
                UnitAbbreviation
                IdentifierPublic
                IdentifierCollection
            }
        }
    }
`;

export default searchIngestionSubjects;
