import { gql } from 'apollo-server-express';

const getProjectDocumentation = gql`
    query getProjectDocumentation($input: GetProjectDocumentationInput!) {
        getProjectDocumentation(input: $input) {
            ProjectDocumentation {
                idProjectDocumentation
            }
        }
    }
`;

export default getProjectDocumentation;
