import { gql } from 'apollo-server-express';

const getAllUsers = gql`
    query getAllUsers($input: GetAllUsersInput!) {
        getAllUsers(input: $input) {
            User {
                idUser
                Active
                DateActivated
                EmailAddress
                Name
                SecurityID
                DateDisabled
                EmailSettings
                WorkflowNotificationTime
                SlackID
            }
        }
    }
`;

export default getAllUsers;