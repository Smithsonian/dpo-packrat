import { CreateUnitInput } from '../../../../types/graphql';
import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';

const createUnitTest = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
    });

    describe('Mutation: createUnit', () => {
        test('should work with valid input', async () => {
            const unitArgs: CreateUnitInput = {
                Name: 'Test Name',
                Abbreviation: 'Test Abbreviation',
                ARKPrefix: 'Test ARKPrefix'
            };

            const { Unit } = await graphQLApi.createUnit(unitArgs);
            expect(Unit).toBeTruthy();
        });
    });
};

export default createUnitTest;
