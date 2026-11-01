import { GetUnitInput, GetUnitResult } from '../../../../types/graphql';
import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';
import * as DBAPI from '../../../../db';

const getUnitTest = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
    });

    describe('Query: getUnit', () => {
        test('returns the unit for a seeded id, and null for a non-existent id', async () => {
            const all: DBAPI.Unit[] | null = await DBAPI.Unit.fetchAll();
            if (all && all.length > 0) {
                const input: GetUnitInput = { idUnit: all[0].idUnit };
                const { Unit }: GetUnitResult = await graphQLApi.getUnit(input);
                expect(Unit).toBeTruthy();
                expect(Unit?.idUnit).toBe(all[0].idUnit);
            }

            const { Unit: missing }: GetUnitResult = await graphQLApi.getUnit({ idUnit: 0 });
            expect(missing).toBeNull();
        });
    });
};

export default getUnitTest;
