import { gql } from 'apollo-server-express';

const createUser = gql`
    mutation updateUser($input: UpdateUserInput!) {
        updateUser(input: $input) {
            User {
                idUser
                EmailAddress
                Name
                Active
                DateActivated
                DateDisabled
                EmailSettings
                WorkflowNotificationTime
            }
        }
    }
`;

export default createUser;