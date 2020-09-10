import * as fs from 'fs-extra';
import * as COL from '../../collections/interface/';
import * as LOG from '../../utils/logger';
import * as H from '../../utils/helpers';

afterAll(async done => {
    H.Helpers.sleep(3000);
    done();
});

const SCRAPE_EDAN: boolean = false;

describe('Collections: EdanCollection', () => {
    jest.setTimeout(30000);
    const ICollection: COL.ICollection = COL.CollectionFactory.getInstance();

    if (!SCRAPE_EDAN) {
        executeTestQuery(ICollection, 'Armstrong Space Suit', false);
        executeTestQuery(ICollection, 'A19730040000', false);
        executeTestQuery(ICollection, 'edanmdm:nasm_A19730040000', false);
        executeTestQuery(ICollection, 'http://n2t.net/ark:/65665/nv93248f8ce-b6c4-474d-aac7-88252a2daf73', false);
        executeTestQuery(ICollection, '', false);
        executeTestQuery(ICollection, 'jimmybobimmy', true);
        executeTestQuery(ICollection, '<WHACKADOODLE>', true);
        executeTestQuery(ICollection, 'nv93248f8ce-b6c4-474d-aac7-88252a2daf73', false);
    } else {
        test('Collections: EdanCollection.scrape', async () => {
            await executeScrapeQuery(ICollection, 'd:\\Work\\SI\\EdanScrape.txt', 12000000);
        });
    }
});

function executeTestQuery(ICollection: COL.ICollection, query: string, expectNoResults: boolean): void {
    test('Collections: EdanCollection.queryCollection ' + query, async () => {
        const results: COL.CollectionQueryResults | null = await ICollection.queryCollection(query, 10, 0);

        expect(results).toBeTruthy();
        if (results) {
            expect(results.records).toBeTruthy();
            if (results.records) {
                expect(results.records.length).toBeLessThanOrEqual(results.rowCount);
                if (expectNoResults)
                    expect(results.records.length).toBe(0);
                else
                    expect(results.records.length).toBeGreaterThan(0);
            }
        }
    });
}

const EDAN_SCRAPE_MAX_INIT: number = 14000000;
const EDAN_QUERY_MAX_ROWS: number = 100;
const EDAN_SIMUL: number = 4; // set to a higher number only with permission from OCIO, as even a moderate load seems to cause alarm!

export async function executeScrapeQuery(ICollection: COL.ICollection, fileName: string, rowStart: number): Promise<void> {
    jest.setTimeout(1000 * 60 * 60 * 24 * 7);   // 1 week

    let scrapeEndRecord: number = EDAN_SCRAPE_MAX_INIT;
    let queryNumber: number = 0;
    let resultCount: number = 0;
    const unitMap: Map<string, number> = new Map<string, number>();
    const writeStream: NodeJS.WritableStream = await fs.createWriteStream(fileName, { 'flags': 'a' });
    if (!writeStream)
        LOG.logger.info(`Unable to create writeStream for ${fileName}`);

    for (; rowStart < scrapeEndRecord; ) {
        // run EDAN_SIMUL requests at once:
        const promiseArray: Promise<COL.CollectionQueryResults | null>[] = [];
        for (let simulReq: number = 0; simulReq < EDAN_SIMUL && rowStart < scrapeEndRecord; simulReq++) {
            promiseArray.push(ICollection.queryCollection('*.*', EDAN_QUERY_MAX_ROWS, rowStart));
            rowStart += EDAN_QUERY_MAX_ROWS;
        }

        await Promise.all(promiseArray).then(resultArray => {
            for (const results of resultArray) {
                if (!results) {
                    LOG.logger.info('*** Edan Scrape: query returned no results');
                    continue;
                }

                if (results.error)
                    LOG.logger.info(`*** Edan Scrape: encountered error ${results.error}`);
                else if (scrapeEndRecord < results.rowCount) {
                    scrapeEndRecord = results.rowCount;
                    LOG.logger.info(`*** Edan Scrape: Increasing scrape end record to ${scrapeEndRecord}`);
                }

                for (const record of results.records) {
                    writeStream.write(`${record.unit}\t${record.identifierPublic}\t${record.identifierCollection}\t${record.name}\n`);
                    const unitRecordCount: number | undefined = unitMap.get(record.unit);
                    unitMap.set(record.unit, (unitRecordCount ? unitRecordCount : 0) + 1);
                }
                resultCount += results.records.length;
                queryNumber++;
            }
            logUnitMap(unitMap, queryNumber, resultCount);
        });
    }
    logUnitMap(unitMap, queryNumber, resultCount);
}

function logUnitMap(unitMap: Map<string, number>, queryNumber: number, resultCount: number): void {
    let logArray: string[] = [];

    for (const [key, value] of unitMap)
        logArray.push(`${key}: ${value}`);
    logArray = logArray.sort((a: string, b: string) => a.localeCompare(b));

    let QN: string = '00000' + queryNumber.toString();
    const QNLen: number = QN.length;
    QN = QN.substring(QNLen - 6);
    logArray.splice(0, 0, `${new Date().toISOString()} Edan Scrape [${QN}]: ${resultCount} Results; Unit Counts:`);
    logArray.push('\n');

    LOG.logger.info(logArray.join('\n'));
}
