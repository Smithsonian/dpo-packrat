import { gql } from 'apollo-server-express';

const createUser = gql`
    mutation createUser($input: CreateUserInput!) {
        createUser(input: $input) {
            User {
                idUser
                Name
                Active
                DateActivated,
                WorkflowNotificationTime,
                EmailSettings,
                SlackID
            }
        }
    }
`;

export default createUser;
