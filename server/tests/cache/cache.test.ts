/**
 * Cache Test suite
 */
import * as DBC from '../../db/connection';
import * as LOG from '../../utils/logger';
import * as path from 'path';

import cacheControlTest from './CacheControl.test';
import vocabularyCacheTest from './VocabularyCache.test';

beforeAll(() => {
    const logPath: string = './logs';
    LOG.configureLogger(logPath);
    LOG.logger.info('**************************');
    LOG.logger.info('Cache Tests');
    LOG.logger.info(`Cache Tests writing logs to ${path.resolve(logPath)}`);
});

afterAll(async done => {
    await DBC.DBConnection.disconnect();
    done();
});

describe('Cache Test Suite', () => {
    vocabularyCacheTest();
    cacheControlTest();
});