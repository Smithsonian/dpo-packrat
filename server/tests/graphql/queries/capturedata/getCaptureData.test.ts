import { GetCaptureDataInput, GetCaptureDataResult } from '../../../../types/graphql';
import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';

const utils = new TestSuiteUtils();
utils.setupJest();

let graphQLApi: GraphQLApi;

beforeAll(() => {
    graphQLApi = utils.graphQLApi;
});

describe('Query: getCaptureData', () => {
    test('should work with valid input', async () => {
        const input: GetCaptureDataInput = {
            idCaptureData: 0
        };

        const { CaptureData }: GetCaptureDataResult = await graphQLApi.getCaptureData(input);

        if (CaptureData) {
            expect(CaptureData.idCaptureData).toBe(0);
        } else {
            expect(CaptureData).toBe(null);
        }
    });
});
