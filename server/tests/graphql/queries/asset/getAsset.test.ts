import { GetAssetInput, GetAssetResult } from '../../../../types/graphql';
import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';

const utils = new TestSuiteUtils();
utils.setupJest();

let graphQLApi: GraphQLApi;

beforeAll(() => {
    graphQLApi = utils.graphQLApi;
});

describe('Query: getAsset', () => {
    test('should work with valid input', async () => {
        const input: GetAssetInput = {
            idAsset: 0
        };

        const { Asset }: GetAssetResult = await graphQLApi.getAsset(input);

        if (Asset) {
            expect(Asset.idAsset).toBe(0);
        } else {
            expect(Asset).toBe(null);
        }
    });
});
