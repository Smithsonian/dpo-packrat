import { CreateUnitInput } from '../../../../types/graphql';
import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';

const createUnitTest = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;
    let createUnitInput: () => CreateUnitInput;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
        createUnitInput = utils.createUnitInput;
    });

    describe('Mutation: createUnit', () => {
        test('should work with valid input', async () => {
            const unitArgs: CreateUnitInput = createUnitInput();
            const { Unit } = await graphQLApi.createUnit(unitArgs);
            expect(Unit).toBeTruthy();
        });
    });
};

export default createUnitTest;
