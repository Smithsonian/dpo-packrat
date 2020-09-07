import fs from 'fs';
import { join } from 'path';
import { Parser, CSVTypes, SubjectsCSVFields, ItemsCSVFields, ModelsCSVFields, CaptureDataCSVFields } from '../../../utils/parser';

const mockPath = (type: CSVTypes) => join(__dirname, `../../mock/utils/parser/mock.${type}.csv`);

describe('Parser: CSV parser', () => {
    test('Parser.parseCSV type subjects', async () => {
        const path = mockPath(CSVTypes.subjects);
        const fileStream = fs.createReadStream(path);

        const result = await Parser.parseCSV<SubjectsCSVFields>(fileStream, CSVTypes.subjects);
        expect(result).toBeTruthy();
    });

    test('Parser.getSubjects', async () => {
        const path = mockPath(CSVTypes.subjects);
        const fileStream = fs.createReadStream(path);

        const result = await Parser.getSubjects(fileStream);
        expect(result).toBeTruthy();
    });

    test('Parser.parseCSV type items', async () => {
        const path = mockPath(CSVTypes.items);
        const fileStream = fs.createReadStream(path);

        const result = await Parser.parseCSV<ItemsCSVFields>(fileStream, CSVTypes.items);
        expect(result).toBeTruthy();
    });

    test('Parser.getItems', async () => {
        const path = mockPath(CSVTypes.items);
        const fileStream = fs.createReadStream(path);

        const result = await Parser.getItems(fileStream);
        expect(result).toBeTruthy();
    });

    test('Parser.parseCSV type models', async () => {
        const path = mockPath(CSVTypes.models);
        const fileStream = fs.createReadStream(path);

        const result = await Parser.parseCSV<ModelsCSVFields>(fileStream, CSVTypes.models);
        expect(result).toBeTruthy();
    });

    test('Parser.parseCSV type capture data', async () => {
        const path = mockPath(CSVTypes.captureData);
        const fileStream = fs.createReadStream(path);

        const result = await Parser.parseCSV<CaptureDataCSVFields>(fileStream, CSVTypes.captureData);
        expect(result).toBeTruthy();
    });
});
