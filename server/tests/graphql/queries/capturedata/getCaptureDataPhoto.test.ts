import { GetCaptureDataPhotoInput, GetCaptureDataPhotoResult } from '../../../../types/graphql';
import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';

const getCaptureDataPhotoTest = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
    });

    describe('Query: getCaptureDataPhoto', () => {
        test('should work with valid input', async () => {
            const input: GetCaptureDataPhotoInput = {
                idCaptureDataPhoto: 0
            };

            const { CaptureDataPhoto }: GetCaptureDataPhotoResult = await graphQLApi.getCaptureDataPhoto(input);

            if (CaptureDataPhoto) {
                expect(CaptureDataPhoto.idCaptureDataPhoto).toBe(0);
            } else {
                expect(CaptureDataPhoto).toBe(null);
            }
        });
    });
};

export default getCaptureDataPhotoTest;
