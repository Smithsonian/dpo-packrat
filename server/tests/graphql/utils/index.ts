/**
 * TestSuiteUtils
 * This test suite utils helps with setting up jest environment
 * for testing graphql api
 */
import { PrismaClient } from '@prisma/client';
import GraphQLApi from '../../../graphql';
import * as LOG from '../../../utils/logger';
import * as path from 'path';

class TestSuiteUtils {
    prisma!: PrismaClient;
    graphQLApi!: GraphQLApi;

    setupJest = (): void => {
        global.beforeAll(this.beforeAll);
        global.afterAll(this.afterAll);
    };

    private beforeAll = (): void => {
        const logPath: string = './logs';
        LOG.configureLogger(logPath);
        LOG.logger.info('**************************');
        LOG.logger.info('GraphQL Test Suite');
        LOG.logger.info(`GraphQL Tests writing logs to ${path.resolve(logPath)}`);

        this.prisma = new PrismaClient();
        const context = { prisma: this.prisma };
        this.graphQLApi = new GraphQLApi({ context });
    };

    private afterAll = async (done: () => void): Promise<void> => {
        await this.prisma.disconnect();
        done();
    };
}

export default TestSuiteUtils;
