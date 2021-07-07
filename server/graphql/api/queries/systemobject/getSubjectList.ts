import { gql } from 'apollo-server-express';

const getSubjectList = gql`
    query getSubjectList($input: GetSubjectListInput!) {
        getSubjectList(input: $input) {
            subjects {
                idSubject
                idSystemObject
                UnitAbbreviation
                SubjectName
                IdentifierPublic
            }
        }
    }
`;

export default getSubjectList;