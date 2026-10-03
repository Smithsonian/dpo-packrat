import { GetModelConstellationForAssetVersionInput, GetModelConstellationForAssetVersionResult } from '../../../../types/graphql';
import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';

const getModelConstellationForAssetVersionTest = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
    });

    describe('Query: getModelConstellationForAssetVersion', () => {
        test('should work with valid input', async () => {
            const input: GetModelConstellationForAssetVersionInput = {
                idAssetVersion: 0
            };

            const { ModelConstellation }: GetModelConstellationForAssetVersionResult = await graphQLApi.getModelConstellationForAssetVersion(input);

            // A non-existent asset version yields no constellation (null) or one with no Model.
            expect(ModelConstellation?.Model ?? null).toBeNull();
        });
    });
};

export default getModelConstellationForAssetVersionTest;
