import { GetLicenseInput, GetLicenseResult } from '../../../../types/graphql';
import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';

const getLicenseTest = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
    });

    describe('Query: getLicense', () => {
        test('should work with valid input', async () => {
            const input: GetLicenseInput = {
                idLicense: 0
            };

            const { License }: GetLicenseResult = await graphQLApi.getLicense(input);

            if (License) {
                expect(License.idLicense).toBe(0);
            } else {
                expect(License).toBe(null);
            }
        });
    });
};

export default getLicenseTest;
