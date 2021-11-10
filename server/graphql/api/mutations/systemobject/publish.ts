import { gql } from 'apollo-server-express';

const publish = gql`
    mutation publish($input: PublishInput!) {
        publish(input: $input) {
            success
            message
        }
    }
`;

export default publish;
