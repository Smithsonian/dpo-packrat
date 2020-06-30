import { gql } from 'apollo-server-express';

const createModel = gql`
    query createModel($input: CreateModelInput!) {
        createModel(input: $input) {
            Model {
                idModel
            }
        }
    }
`;

export default createModel;
