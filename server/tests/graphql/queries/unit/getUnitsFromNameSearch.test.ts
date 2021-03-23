import { GetUnitsFromNameSearchInput, GetUnitsFromNameSearchResult } from '../../../../types/graphql';
import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';
import * as DBAPI from '../../../../db';
import { randomStorageKey } from '../../../db/utils';

const getUnitsFromNameSearchTest = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
    });

    describe('Query: getUnitsFromNameSearch', () => {
        test('should work with valid input', async () => {
            const randomName = randomStorageKey('Test Unit');
            const unitArgs = {
                Name: randomName,
                Abbreviation: null,
                idUnit: 0,
                ARKPrefix: null
            };

            const unit = new DBAPI.Unit(unitArgs);
            if (await unit.create()) {
                const input: GetUnitsFromNameSearchInput = {
                    search: randomName
                };
                const { Units }: GetUnitsFromNameSearchResult = await graphQLApi.getUnitsFromNameSearch(input);

                if (Units) {
                    expect(Units.length).toEqual(1);
                    expect(Units[0].Name).toEqual(randomName);
                }
            }
        });
    });
};

export default getUnitsFromNameSearchTest;
