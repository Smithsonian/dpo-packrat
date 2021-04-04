import { gql } from 'apollo-server-express';

const getModelConstellation = gql`
    query getModelConstellation($input: GetModelConstellationInput!) {
        getModelConstellation(input: $input) {
            ModelConstellation {
                Model {
                    idModel
                }
                ModelObjects {
                    idModelObject
                }
                ModelMaterials {
                    idModelMaterial
                }
                ModelMaterialChannels {
                    idModelMaterialChannel
                }
                ModelMaterialUVMaps {
                    idModelMaterialUVMap
                }
                ModelAssets {
                    AssetName
                    AssetType
                }
            }
        }
    }
`;

export default getModelConstellation;
