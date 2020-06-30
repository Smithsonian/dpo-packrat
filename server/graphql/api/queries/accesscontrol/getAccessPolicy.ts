import { gql } from 'apollo-server-express';

const getAccessPolicy = gql`
    query getAccessPolicy($input: GetAccessPolicyInput!) {
        getAccessPolicy(input: $input) {
            AccessPolicy {
                idAccessPolicy
            }
        }
    }
`;

export default getAccessPolicy;
