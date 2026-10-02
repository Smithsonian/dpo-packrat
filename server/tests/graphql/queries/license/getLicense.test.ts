import { GetLicenseInput, GetLicenseResult } from '../../../../types/graphql';
import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';
import * as DBAPI from '../../../../db';

const getLicenseTest = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
    });

    describe('Query: getLicense', () => {
        test('returns the license for a seeded id, and null for a non-existent id', async () => {
            const all: DBAPI.License[] | null = await DBAPI.License.fetchAll();
            if (all && all.length > 0) {
                const input: GetLicenseInput = { idLicense: all[0].idLicense };
                const { License }: GetLicenseResult = await graphQLApi.getLicense(input);
                expect(License).toBeTruthy();
                expect(License?.idLicense).toBe(all[0].idLicense);
            }

            const { License: missing }: GetLicenseResult = await graphQLApi.getLicense({ idLicense: 0 });
            expect(missing).toBeNull();
        });
    });
};

export default getLicenseTest;
