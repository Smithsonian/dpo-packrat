import { gql } from 'apollo-server-express';

const getCurrentUser = gql`
    query getCurrentUser {
        getCurrentUser {
            User {
                idUser
                Name
                Active
                DateActivated
                DateDisabled
                EmailAddress
                EmailSettings
                SecurityID
                WorkflowNotificationTime
                SlackID
            }
        }
    }
`;

export default getCurrentUser;
