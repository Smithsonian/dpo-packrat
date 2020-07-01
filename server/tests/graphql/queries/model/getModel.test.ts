import { GetModelInput, GetModelResult } from '../../../../types/graphql';
import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';

const getModelTest = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
    });

    describe('Query: getModel', () => {
        test('should work with valid input', async () => {
            const input: GetModelInput = {
                idModel: 0
            };

            const { Model }: GetModelResult = await graphQLApi.getModel(input);

            if (Model) {
                expect(Model.idModel).toBe(0);
            } else {
                expect(Model).toBe(null);
            }
        });
    });
};

export default getModelTest;
