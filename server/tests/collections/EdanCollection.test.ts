import * as COL from '../../collections/interface/';
import * as LOG from '../../utils/logger';
import * as path from 'path';

beforeAll(() => {
    const logPath: string = './logs';
    LOG.configureLogger(logPath);
    LOG.logger.info('**************************');
    LOG.logger.info('EdanCollection Tests');
    LOG.logger.info(`EdanCollection Tests writing logs to ${path.resolve(logPath)}`);
});

afterAll(async done => {
    done();
});

describe('Collections: EdanCollection', () => {
    const ICollection: COL.ICollection = COL.CollectionFactory.getInstance();
    let results: COL.CollectionQueryResults | null = null;
    test('Collections: EdanCollection.queryCollection 1', async () => {
        results = await ICollection.queryCollection('Armstrong Space Suit', 10, 0);
        expect(results).toBeTruthy();
    });
    test('Collections: EdanCollection.queryCollection 2', async () => {
        results = await ICollection.queryCollection('A19730040000', 10, 0);
        expect(results).toBeTruthy();
    });
    test('Collections: EdanCollection.queryCollection 3', async () => {
        results = await ICollection.queryCollection('edanmdm:nasm_A19730040000', 10, 0);
        expect(results).toBeTruthy();
    });
    test('Collections: EdanCollection.queryCollection 4', async () => {
        results = await ICollection.queryCollection('http://n2t.net/ark:/65665/nv93248f8ce-b6c4-474d-aac7-88252a2daf73', 10, 0);
        expect(results).toBeTruthy();
    });
    test('Collections: EdanCollection.queryCollection 5', async () => {
        results = await ICollection.queryCollection('nv93248f8ce-b6c4-474d-aac7-88252a2daf73', 10, 0);
        expect(results).toBeTruthy();
    });
    // TODO: write smarter tests, looking at output!
});
