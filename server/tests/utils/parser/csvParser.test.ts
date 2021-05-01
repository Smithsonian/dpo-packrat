import fs from 'fs';
import { join } from 'path';
import * as H from '../../../utils/helpers';
import { CSVParser, CSVTypes, ModelsCSVFields, CaptureDataPhotoCSVFields } from '../../../utils/parser';

const mockPath = (type: CSVTypes) => join(__dirname, `../../mock/utils/parser/mock.${type}.csv`);
const mockPathJunk: string = join(__dirname, '../../mock/utils/parser/mock.junk.csv');
/*
afterAll(async done => {
    await H.Helpers.sleep(2000);
    done();
});
*/
describe('CSVParser', () => {
    test('CSVParser.parse type models', async () => {
        const path = mockPath(CSVTypes.models);
        const fileStream = fs.createReadStream(path);

        try {
            const result = await CSVParser.parse<ModelsCSVFields>(fileStream, CSVTypes.models);
            expect(result).toBeTruthy();
        } catch {
            expect('Exception not expected!').toBeFalsy();
        }
    });

    test('CSVParser.parse type capture data', async () => {
        const path = mockPath(CSVTypes.captureDataPhoto);
        const fileStream = fs.createReadStream(path);

        try {
            const result = await CSVParser.parse<CaptureDataPhotoCSVFields>(fileStream, CSVTypes.captureDataPhoto);
            expect(result).toBeTruthy();
        } catch {
            expect('Exception not expected!').toBeFalsy();
        }
    });

    test('CSVParser.parse type invalid', async () => {
        expect.assertions(1);
        try {
            const fileStream = fs.createReadStream(mockPathJunk);
            await CSVParser.parse<ModelsCSVFields>(fileStream, CSVTypes.models);
        } catch {
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
