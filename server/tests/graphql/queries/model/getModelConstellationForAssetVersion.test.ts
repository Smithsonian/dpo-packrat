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

            if (ModelConstellation) {
                expect(ModelConstellation.Model).toBeFalsy();
            } else {
                expect(ModelConstellation).toBe(null);
            }
        });
    });
};

export default getModelConstellationForAssetVersionTest;
