import { GetCaptureDataPhotoInput, GetCaptureDataPhotoResult } from '../../../../types/graphql';
import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';
import * as DBAPI from '../../../../db';

const getCaptureDataPhotoTest = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
    });

    describe('Query: getCaptureDataPhoto', () => {
        test('returns the capture data photo for a seeded id, and null for a non-existent id', async () => {
            const all: DBAPI.CaptureDataPhoto[] | null = await DBAPI.CaptureDataPhoto.fetchAll();
            if (all && all.length > 0) {
                const input: GetCaptureDataPhotoInput = { idCaptureDataPhoto: all[0].idCaptureDataPhoto };
                const { CaptureDataPhoto }: GetCaptureDataPhotoResult = await graphQLApi.getCaptureDataPhoto(input);
                expect(CaptureDataPhoto).toBeTruthy();
                expect(CaptureDataPhoto?.idCaptureDataPhoto).toBe(all[0].idCaptureDataPhoto);
            }

            const { CaptureDataPhoto: missing }: GetCaptureDataPhotoResult = await graphQLApi.getCaptureDataPhoto({ idCaptureDataPhoto: 0 });
            expect(missing).toBeNull();
        });
    });
};

export default getCaptureDataPhotoTest;
