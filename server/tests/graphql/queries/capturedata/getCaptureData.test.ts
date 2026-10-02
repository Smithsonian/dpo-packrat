import { GetCaptureDataInput, GetCaptureDataResult } from '../../../../types/graphql';
import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';
import * as DBAPI from '../../../../db';

const getCaptureDataTest = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
    });

    describe('Query: getCaptureData', () => {
        test('returns the capture data for a seeded id, and null for a non-existent id', async () => {
            const all: DBAPI.CaptureData[] | null = await DBAPI.CaptureData.fetchAll();
            if (all && all.length > 0) {
                const input: GetCaptureDataInput = { idCaptureData: all[0].idCaptureData };
                const { CaptureData }: GetCaptureDataResult = await graphQLApi.getCaptureData(input);
                expect(CaptureData).toBeTruthy();
                expect(CaptureData?.idCaptureData).toBe(all[0].idCaptureData);
            }

            const { CaptureData: missing }: GetCaptureDataResult = await graphQLApi.getCaptureData({ idCaptureData: 0 });
            expect(missing).toBeNull();
        });
    });
};

export default getCaptureDataTest;
