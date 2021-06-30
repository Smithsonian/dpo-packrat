import { gql } from 'apollo-server-express';

const getSubjectList = gql`
    query getSubjectList($input: GetSubjectListInput!) {
        getSubjectList(input: $input) {
            subjects {
                idSubject
                idUnit
                Name
                IdentifierPreferred {
                    IdentifierValue
                    idIdentifier
                }
                SystemObject {
                    idSystemObject
                }
            }
        }
    }
`;

export default getSubjectList;