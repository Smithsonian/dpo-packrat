import { gql } from 'apollo-server-express';

const getModel = gql`
    query getModel($input: GetModelInput!) {
        getModel(input: $input) {
            Model {
                idModel
                SystemObject {
                    idSystemObject
                    idAsset
                    idAssetVersion
                }
            }
        }
    }
`;

export default getModel;
