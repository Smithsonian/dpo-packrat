import { GetAssetInput, GetAssetResult } from '../../../../types/graphql';
import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';
import * as DBAPI from '../../../../db';

const getAssetTest = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
    });

    describe('Query: getAsset', () => {
        test('returns the asset for a seeded id, and null for a non-existent id', async () => {
            const all: DBAPI.Asset[] | null = await DBAPI.Asset.fetchAll();
            if (all && all.length > 0) {
                const input: GetAssetInput = { idAsset: all[0].idAsset };
                const { Asset }: GetAssetResult = await graphQLApi.getAsset(input);
                expect(Asset).toBeTruthy();
                expect(Asset?.idAsset).toBe(all[0].idAsset);
            }

            const { Asset: missing }: GetAssetResult = await graphQLApi.getAsset({ idAsset: 0 });
            expect(missing).toBeNull();
        });
    });
};

export default getAssetTest;
