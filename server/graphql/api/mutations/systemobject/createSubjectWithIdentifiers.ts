import { gql } from 'apollo-server-express';

const createSubjectWithIdentifiers = gql`
    mutation createSubjectWithIdentifiers($input: CreateSubjectWithIdentifiersInput!) {
        createSubjectWithIdentifiers(input: $input) {
            success
            message
        }
    }
`;

export default createSubjectWithIdentifiers;