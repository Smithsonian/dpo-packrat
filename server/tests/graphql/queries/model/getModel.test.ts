import { GetModelInput, GetModelResult } from '../../../../types/graphql';
import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';
import * as DBAPI from '../../../../db';

const getModelTest = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
    });

    describe('Query: getModel', () => {
        test('returns the model for a seeded id, and null for a non-existent id', async () => {
            const all: DBAPI.Model[] | null = await DBAPI.Model.fetchAll();
            if (all && all.length > 0) {
                const input: GetModelInput = { idModel: all[0].idModel };
                const { Model }: GetModelResult = await graphQLApi.getModel(input);
                expect(Model).toBeTruthy();
                expect(Model?.idModel).toBe(all[0].idModel);
            }

            const { Model: missing }: GetModelResult = await graphQLApi.getModel({ idModel: 0 });
            expect(missing).toBeNull();
        });
    });
};

export default getModelTest;
