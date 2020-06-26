import { gql } from 'apollo-server-express';

const getUser = gql`
    query getUser($input: GetUserInput!) {
        getUser(input: $input) {
            User {
                idUser
                Name
                Active
                DateActivated
            }
        }
    }
`;

export default getUser;
