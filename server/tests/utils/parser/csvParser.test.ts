import fs from 'fs';
import { join } from 'path';
import * as LOG from '../../../utils/logger';
import * as H from '../../../utils/helpers';
import { CSVParser, CSVTypes, CaptureDataPhotoCSVFields, ModelsCSVFields, ScenesCSVFields } from '../../../utils/parser';

const mockPath = (type: CSVTypes) => join(__dirname, `../../mock/utils/parser/mock.${type}.csv`);
const mockPathJunk: string = join(__dirname, '../../mock/utils/parser/mock.junk.csv');
/*
afterAll(async done => {
    await H.Helpers.sleep(2000);
    done();
});
*/
describe('CSVParser', () => {
    test('CSVParser.parse type capture data', async () => {
        const path = mockPath(CSVTypes.captureDataPhoto);
        const fileStream = fs.createReadStream(path);

        try {
            const result = await CSVParser.parse<CaptureDataPhotoCSVFields>(fileStream, CSVTypes.captureDataPhoto);
            expect(result).toBeTruthy();
        } catch (error) {
            LOG.error('CSVParser.parse failed', LOG.LS.eTEST, error);
            expect('Exception not expected!').toBeFalsy();
        }
    });

    test('CSVParser.parse type models', async () => {
        const path = mockPath(CSVTypes.models);
        const fileStream = fs.createReadStream(path);

        try {
            const result = await CSVParser.parse<ModelsCSVFields>(fileStream, CSVTypes.models);
            expect(result).toBeTruthy();
        } catch (error) {
            LOG.error('CSVParser.parse failed', LOG.LS.eTEST, error);
            expect('Exception not expected!').toBeFalsy();
        }
    });

    test('CSVParser.parse type scenes', async () => {
        const path = mockPath(CSVTypes.scenes);
        const fileStream = fs.createReadStream(path);

        try {
            const result = await CSVParser.parse<ScenesCSVFields>(fileStream, CSVTypes.scenes);
            expect(result).toBeTruthy();
        } catch (error) {
            LOG.error('CSVParser.parse failed', LOG.LS.eTEST, error);
            expect('Exception not expected!').toBeFalsy();
        }
    });

    test('CSVParser.parse type invalid', async () => {
        expect.assertions(1);
        try {
            const fileStream = fs.createReadStream(mockPathJunk);
            await CSVParser.parse<ModelsCSVFields>(fileStream, CSVTypes.models);
        } catch (error) {
            expect('Exception expected').toBeTruthy();
        }
    });

    test('CSVParser.parse path invalid', async () => {
        expect.assertions(1);
        try {
            const fileStream = fs.createReadStream(H.Helpers.randomSlug());
            await CSVParser.parse<ModelsCSVFields>(fileStream, CSVTypes.models);
        } catch (error) {
            expect('Exception expected').toBeTruthy();
        }
    });
});
