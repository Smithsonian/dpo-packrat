import { gql } from 'apollo-server-express';

const getModelConstellationForAssetVersion = gql`
    query getModelConstellationForAssetVersion($input: GetModelConstellationForAssetVersionInput!) {
        getModelConstellationForAssetVersion(input: $input) {
            idAssetVersion
            ModelConstellation {
                Model {
                    idModel
                }
            }
        }
    }
`;

export default getModelConstellationForAssetVersion;
