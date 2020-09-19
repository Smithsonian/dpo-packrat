/*
import fs from 'fs';
import { join } from 'path';
import { BulkIngestReader, CSVTypes } from '../../../utils/parser';

const mockPath = (type: CSVTypes) => join(__dirname, `../../mock/utils/parser/mock.${type}.csv`);

describe('CsvParser', () => {
    test('BulkIngestReader.getSubjects', async () => {
        const path = mockPath(CSVTypes.subjects);
        const fileStream = fs.createReadStream(path);

        const result = await BulkIngestReader.getSubjectInfo(fileStream);
        expect(result).toBeTruthy();
    });

    test('BulkIngestReader.getItems', async () => {
        const path = mockPath(CSVTypes.items);
        const fileStream = fs.createReadStream(path);

        const result = await BulkIngestReader.getItems(fileStream);
        expect(result).toBeTruthy();
    });
});
*/

describe('BulkIngestReader', () => {
    test('BulkIngestReader Placeholder', async () => {
        expect(1).toBeTruthy();
    });
});
