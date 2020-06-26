import { GetUnitInput, GetUnitResult } from '../../../../types/graphql';
import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';

const utils = new TestSuiteUtils();
utils.setupJest();

let graphQLApi: GraphQLApi;

beforeAll(() => {
    graphQLApi = utils.graphQLApi;
});

describe('Query: getUnit', () => {
    test('should work with valid input', async () => {
        const input: GetUnitInput = {
            idUnit: 0
        };

        const { Unit }: GetUnitResult = await graphQLApi.getUnit(input);

        if (Unit) {
            expect(Unit.idUnit).toBe(0);
        } else {
            expect(Unit).toBe(null);
        }
    });
});
