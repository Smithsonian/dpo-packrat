/* eslint-disable @typescript-eslint/no-explicit-any */
import * as fs from 'fs-extra';
import * as COL from '../../collections/interface/';
import * as LOG from '../../utils/logger';
import * as H from '../../utils/helpers';

afterAll(async done => {
    H.Helpers.sleep(3000);
    done();
});

const REGRESSION_SUITE: boolean = true;
const SCRAPE_DPO: boolean = false;
const SCRAPE_EDAN: boolean = false;

describe('Collections: EdanCollection', () => {
    jest.setTimeout(180000);
    const ICol: COL.ICollection = COL.CollectionFactory.getInstance();

    if (REGRESSION_SUITE) {
        executeTestQuery(ICol, 'Armstrong Space Suit', false);
        executeTestQuery(ICol, 'A19730040000', false);
        executeTestQuery(ICol, 'edanmdm:nasm_A19730040000', false);
        executeTestQuery(ICol, 'http://n2t.net/ark:/65665/nv93248f8ce-b6c4-474d-aac7-88252a2daf73', false);
        executeTestQuery(ICol, '', false);
        executeTestQuery(ICol, 'jimmybobimmy', true);
        executeTestQuery(ICol, '<WHACKADOODLE>', true);
        executeTestQuery(ICol, 'nv93248f8ce-b6c4-474d-aac7-88252a2daf73', false);

        // custom search options:
        executeTestQuery(ICol, 'Armstrong Space Suit', false, false, '3d_package');
        executeTestQuery(ICol, 'A19730040000', false, true, '3d_package');
        executeTestQuery(ICol, 'edanmdm:nasm_A19730040000', false, false, '');
        executeTestQuery(ICol, 'http://n2t.net/ark:/65665/nv93248f8ce-b6c4-474d-aac7-88252a2daf73', false, true, '');
        executeTestQuery(ICol, '', false, false, '3d_package');
        executeTestQuery(ICol, 'jimmybobimmy', true, false, '3d_package');
        executeTestQuery(ICol, '<WHACKADOODLE>', true, false, '3d_package');
        executeTestQuery(ICol, 'nv93248f8ce-b6c4-474d-aac7-88252a2daf73', false, false, '3d_package');

        test('Collections: EdanCollection Ark Tests', () => {
            executeArkTests(ICol);
        });
    }

    if (SCRAPE_DPO) {
        test('Collections: EdanCollection.scrape DPO', async () => {
            await scrapeDPOEdanMDM(ICol, 'd:\\Work\\SI\\EdanScrape.txt');
        });
    }

    if (SCRAPE_EDAN) {
        test('Collections: EdanCollection.scrape EDAN', async () => {
            await executeScrapeQuery(ICol, 'd:\\Work\\SI\\EdanScrape.txt', 0);
        });
    }
});

function executeTestQuery(ICol: COL.ICollection, query: string, expectNoResults: boolean,
    searchCollections: boolean = true, edanRecordType: string = ''): void {
    test('Collections: EdanCollection.queryCollection ' + query, async () => {
        let options: any = null;
        if (!searchCollections || edanRecordType)
            options = {
                searchMetadata: !searchCollections,
                recordType: edanRecordType
            };

        const results: COL.CollectionQueryResults | null = await ICol.queryCollection(query, 10, 0, options);

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

export async function executeScrapeQuery(ICol: COL.ICollection, fileName: string, rowStart: number): Promise<void> {
    jest.setTimeout(1000 * 60 * 60 * 24 * 7);   // 1 week

    let scrapeEndRecord: number = EDAN_SCRAPE_MAX_INIT;
    let queryNumber: number = 0;
    let resultCount: number = 0;
    const unitMap: Map<string, number> = new Map<string, number>();
    const writeStream: NodeJS.WritableStream = await fs.createWriteStream(fileName, { 'flags': 'a' });
    if (!writeStream)
        LOG.info(`Unable to create writeStream for ${fileName}`, LOG.LS.eTEST);

    for (; rowStart < scrapeEndRecord; ) {
        // run EDAN_SIMUL requests at once:
        const promiseArray: Promise<COL.CollectionQueryResults | null>[] = [];
        for (let simulReq: number = 0; simulReq < EDAN_SIMUL && rowStart < scrapeEndRecord; simulReq++) {
            promiseArray.push(ICol.queryCollection('*.*', EDAN_QUERY_MAX_ROWS, rowStart, null));
            rowStart += EDAN_QUERY_MAX_ROWS;
        }

        await Promise.all(promiseArray).then(resultArray => {
            for (const results of resultArray) {
                if (!results) {
                    LOG.info('*** Edan Scrape: query returned no results', LOG.LS.eTEST);
                    continue;
                }

                if (results.error)
                    LOG.info(`*** Edan Scrape: encountered error ${results.error}`, LOG.LS.eTEST);
                else if (scrapeEndRecord < results.rowCount) {
                    scrapeEndRecord = results.rowCount;
                    LOG.info(`*** Edan Scrape: Increasing scrape end record to ${scrapeEndRecord}`, LOG.LS.eTEST);
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

    LOG.info(logArray.join('\n'), LOG.LS.eTEST);
}

function executeArkTests(ICol: COL.ICollection) {
    const customShoulder: string = 'custom';
    const ArkNameMappingAuthority: string = ICol.getArkNameMappingAuthority();
    const ArkNameAssigningAuthority: string = ICol.getArkNameAssigningAuthority();

    const ArkDefaultShoulderNoPrepend: string = ICol.generateArk(null, false);
    const ArkDefaultShoulderPrepend: string = ICol.generateArk(null, true);
    const ArkCustomShoulderNoPrepend: string = ICol.generateArk(customShoulder, false);
    const ArkCustomShoulderPrepend: string = ICol.generateArk(customShoulder, true);
    const ArkInvalid: string = H.Helpers.randomSlug();

    expect(ArkDefaultShoulderNoPrepend.startsWith(ArkNameMappingAuthority)).toBeFalsy();
    expect(ArkDefaultShoulderPrepend.startsWith(ArkNameMappingAuthority)).toBeTruthy();
    expect(ArkCustomShoulderNoPrepend.startsWith(ArkNameMappingAuthority)).toBeFalsy();
    expect(ArkCustomShoulderPrepend.startsWith(ArkNameMappingAuthority)).toBeTruthy();

    expect(ArkDefaultShoulderNoPrepend.includes(customShoulder)).toBeFalsy();
    expect(ArkDefaultShoulderPrepend.includes(customShoulder)).toBeFalsy();
    expect(ArkCustomShoulderNoPrepend.includes(customShoulder)).toBeTruthy();
    expect(ArkCustomShoulderPrepend.includes(customShoulder)).toBeTruthy();

    expect(ArkDefaultShoulderNoPrepend.includes(ArkNameAssigningAuthority)).toBeTruthy();
    expect(ArkDefaultShoulderPrepend.includes(ArkNameAssigningAuthority)).toBeTruthy();
    expect(ArkCustomShoulderNoPrepend.includes(ArkNameAssigningAuthority)).toBeTruthy();
    expect(ArkCustomShoulderPrepend.includes(ArkNameAssigningAuthority)).toBeTruthy();

    const ArkDefaultShoulderNoPrependExtract: string | null = ICol.extractArkFromUrl(ArkDefaultShoulderNoPrepend);
    const ArkDefaultShoulderPrependExtract: string | null = ICol.extractArkFromUrl(ArkDefaultShoulderPrepend);
    const ArkCustomShoulderNoPrependExtract: string | null = ICol.extractArkFromUrl(ArkCustomShoulderNoPrepend);
    const ArkCustomShoulderPrependExtract: string | null = ICol.extractArkFromUrl(ArkCustomShoulderPrepend);
    const ArkInvalidExtract: string | null = ICol.extractArkFromUrl(ArkInvalid);

    expect(ArkDefaultShoulderNoPrependExtract && ArkDefaultShoulderNoPrependExtract.startsWith('ark:')).toBeTruthy();
    expect(ArkDefaultShoulderPrependExtract && ArkDefaultShoulderPrependExtract.startsWith('ark:')).toBeTruthy();
    expect(ArkCustomShoulderNoPrependExtract && ArkCustomShoulderNoPrependExtract.startsWith('ark:')).toBeTruthy();
    expect(ArkCustomShoulderPrependExtract && ArkCustomShoulderPrependExtract.startsWith('ark:')).toBeTruthy();
    expect(ArkInvalidExtract).toBeFalsy();

    const ArkDefaultShoulderNoPrependUrl: string = ICol.transformArkIntoUrl(ArkDefaultShoulderNoPrependExtract ? ArkDefaultShoulderNoPrependExtract : '');
    const ArkDefaultShoulderPrependUrl: string = ICol.transformArkIntoUrl(ArkDefaultShoulderPrependExtract ? ArkDefaultShoulderPrependExtract : '');
    const ArkCustomShoulderNoPrependUrl: string = ICol.transformArkIntoUrl(ArkCustomShoulderNoPrependExtract ? ArkCustomShoulderNoPrependExtract : '');
    const ArkCustomShoulderPrependUrl: string = ICol.transformArkIntoUrl(ArkCustomShoulderPrependExtract ? ArkCustomShoulderPrependExtract : '');

    expect(ArkDefaultShoulderNoPrependUrl.startsWith(ArkNameMappingAuthority)).toBeTruthy();
    expect(ArkDefaultShoulderPrependUrl.startsWith(ArkNameMappingAuthority)).toBeTruthy();
    expect(ArkCustomShoulderNoPrependUrl.startsWith(ArkNameMappingAuthority)).toBeTruthy();
    expect(ArkCustomShoulderPrependUrl.startsWith(ArkNameMappingAuthority)).toBeTruthy();

    expect(ArkDefaultShoulderPrependUrl).toEqual(ArkDefaultShoulderPrepend);
    expect(ArkCustomShoulderPrependUrl).toEqual(ArkCustomShoulderPrepend);
}

export async function scrapeDPOEdanMDM(ICol: COL.ICollection, fileName: string): Promise<void> {
    jest.setTimeout(1000 * 60 * 60);   // 1 hour

    const WS: NodeJS.WritableStream = await fs.createWriteStream(fileName, { 'flags': 'a' });
    if (!WS)
        LOG.info(`Unable to create writeStream for ${fileName}`, LOG.LS.eTEST);

    let results: COL.CollectionQueryResults | null = null;
    results = handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200027', 10, 0, { gatherRaw: true }), WS); if (results && results.records && results.records.length > 0) {  WS.write(`850|${results.records[0].name}|${results.records[0].unit}|${results.records[0].identifierPublic}|${results.records[0].identifierCollection}|${results.rowCount}\n`); }
    results = handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200039', 10, 0, { gatherRaw: true }), WS); if (results && results.records && results.records.length > 0) {  WS.write(`851|${results.records[0].name}|${results.records[0].unit}|${results.records[0].identifierPublic}|${results.records[0].identifierCollection}|${results.rowCount}\n`); }
    results = handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200040', 10, 0, { gatherRaw: true }), WS); if (results && results.records && results.records.length > 0) {  WS.write(`852|${results.records[0].name}|${results.records[0].unit}|${results.records[0].identifierPublic}|${results.records[0].identifierCollection}|${results.rowCount}\n`); }
    results = handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200041', 10, 0, { gatherRaw: true }), WS); if (results && results.records && results.records.length > 0) {  WS.write(`853|${results.records[0].name}|${results.records[0].unit}|${results.records[0].identifierPublic}|${results.records[0].identifierCollection}|${results.rowCount}\n`); }
    results = handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200042', 10, 0, { gatherRaw: true }), WS); if (results && results.records && results.records.length > 0) {  WS.write(`854|${results.records[0].name}|${results.records[0].unit}|${results.records[0].identifierPublic}|${results.records[0].identifierCollection}|${results.rowCount}\n`); }
    results = handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200043', 10, 0, { gatherRaw: true }), WS); if (results && results.records && results.records.length > 0) {  WS.write(`855|${results.records[0].name}|${results.records[0].unit}|${results.records[0].identifierPublic}|${results.records[0].identifierCollection}|${results.rowCount}\n`); }
    results = handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200044', 10, 0, { gatherRaw: true }), WS); if (results && results.records && results.records.length > 0) {  WS.write(`856|${results.records[0].name}|${results.records[0].unit}|${results.records[0].identifierPublic}|${results.records[0].identifierCollection}|${results.rowCount}\n`); }
    results = handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200045', 10, 0, { gatherRaw: true }), WS); if (results && results.records && results.records.length > 0) {  WS.write(`857|${results.records[0].name}|${results.records[0].unit}|${results.records[0].identifierPublic}|${results.records[0].identifierCollection}|${results.rowCount}\n`); }
    results = handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200046', 10, 0, { gatherRaw: true }), WS); if (results && results.records && results.records.length > 0) {  WS.write(`858|${results.records[0].name}|${results.records[0].unit}|${results.records[0].identifierPublic}|${results.records[0].identifierCollection}|${results.rowCount}\n`); }
    results = handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200047', 10, 0, { gatherRaw: true }), WS); if (results && results.records && results.records.length > 0) {  WS.write(`859|${results.records[0].name}|${results.records[0].unit}|${results.records[0].identifierPublic}|${results.records[0].identifierCollection}|${results.rowCount}\n`); }
    results = handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200048', 10, 0, { gatherRaw: true }), WS); if (results && results.records && results.records.length > 0) {  WS.write(`860|${results.records[0].name}|${results.records[0].unit}|${results.records[0].identifierPublic}|${results.records[0].identifierCollection}|${results.rowCount}\n`); }
    results = handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200049', 10, 0, { gatherRaw: true }), WS); if (results && results.records && results.records.length > 0) {  WS.write(`861|${results.records[0].name}|${results.records[0].unit}|${results.records[0].identifierPublic}|${results.records[0].identifierCollection}|${results.rowCount}\n`); }
    results = handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200050', 10, 0, { gatherRaw: true }), WS); if (results && results.records && results.records.length > 0) {  WS.write(`862|${results.records[0].name}|${results.records[0].unit}|${results.records[0].identifierPublic}|${results.records[0].identifierCollection}|${results.rowCount}\n`); }
    results = handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200051', 10, 0, { gatherRaw: true }), WS); if (results && results.records && results.records.length > 0) {  WS.write(`863|${results.records[0].name}|${results.records[0].unit}|${results.records[0].identifierPublic}|${results.records[0].identifierCollection}|${results.rowCount}\n`); }
    results = handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200052', 10, 0, { gatherRaw: true }), WS); if (results && results.records && results.records.length > 0) {  WS.write(`864|${results.records[0].name}|${results.records[0].unit}|${results.records[0].identifierPublic}|${results.records[0].identifierCollection}|${results.rowCount}\n`); }
    results = handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200053', 10, 0, { gatherRaw: true }), WS); if (results && results.records && results.records.length > 0) {  WS.write(`865|${results.records[0].name}|${results.records[0].unit}|${results.records[0].identifierPublic}|${results.records[0].identifierCollection}|${results.rowCount}\n`); }
    results = handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200054', 10, 0, { gatherRaw: true }), WS); if (results && results.records && results.records.length > 0) {  WS.write(`866|${results.records[0].name}|${results.records[0].unit}|${results.records[0].identifierPublic}|${results.records[0].identifierCollection}|${results.rowCount}\n`); }
    results = handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200055', 10, 0, { gatherRaw: true }), WS); if (results && results.records && results.records.length > 0) {  WS.write(`867|${results.records[0].name}|${results.records[0].unit}|${results.records[0].identifierPublic}|${results.records[0].identifierCollection}|${results.rowCount}\n`); }
    results = handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200056', 10, 0, { gatherRaw: true }), WS); if (results && results.records && results.records.length > 0) {  WS.write(`868|${results.records[0].name}|${results.records[0].unit}|${results.records[0].identifierPublic}|${results.records[0].identifierCollection}|${results.rowCount}\n`); }
    results = handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200057', 10, 0, { gatherRaw: true }), WS); if (results && results.records && results.records.length > 0) {  WS.write(`869|${results.records[0].name}|${results.records[0].unit}|${results.records[0].identifierPublic}|${results.records[0].identifierCollection}|${results.rowCount}\n`); }
    results = handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200058', 10, 0, { gatherRaw: true }), WS); if (results && results.records && results.records.length > 0) {  WS.write(`870|${results.records[0].name}|${results.records[0].unit}|${results.records[0].identifierPublic}|${results.records[0].identifierCollection}|${results.rowCount}\n`); }
    results = handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200059', 10, 0, { gatherRaw: true }), WS); if (results && results.records && results.records.length > 0) {  WS.write(`871|${results.records[0].name}|${results.records[0].unit}|${results.records[0].identifierPublic}|${results.records[0].identifierCollection}|${results.rowCount}\n`); }
    results = handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200060', 10, 0, { gatherRaw: true }), WS); if (results && results.records && results.records.length > 0) {  WS.write(`872|${results.records[0].name}|${results.records[0].unit}|${results.records[0].identifierPublic}|${results.records[0].identifierCollection}|${results.rowCount}\n`); }
    results = handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200061', 10, 0, { gatherRaw: true }), WS); if (results && results.records && results.records.length > 0) {  WS.write(`873|${results.records[0].name}|${results.records[0].unit}|${results.records[0].identifierPublic}|${results.records[0].identifierCollection}|${results.rowCount}\n`); }
    results = handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200062', 10, 0, { gatherRaw: true }), WS); if (results && results.records && results.records.length > 0) {  WS.write(`874|${results.records[0].name}|${results.records[0].unit}|${results.records[0].identifierPublic}|${results.records[0].identifierCollection}|${results.rowCount}\n`); }
    results = handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200063', 10, 0, { gatherRaw: true }), WS); if (results && results.records && results.records.length > 0) {  WS.write(`875|${results.records[0].name}|${results.records[0].unit}|${results.records[0].identifierPublic}|${results.records[0].identifierCollection}|${results.rowCount}\n`); }
    results = handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200064', 10, 0, { gatherRaw: true }), WS); if (results && results.records && results.records.length > 0) {  WS.write(`876|${results.records[0].name}|${results.records[0].unit}|${results.records[0].identifierPublic}|${results.records[0].identifierCollection}|${results.rowCount}\n`); }
    results = handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200065', 10, 0, { gatherRaw: true }), WS); if (results && results.records && results.records.length > 0) {  WS.write(`877|${results.records[0].name}|${results.records[0].unit}|${results.records[0].identifierPublic}|${results.records[0].identifierCollection}|${results.rowCount}\n`); }
    results = handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200066', 10, 0, { gatherRaw: true }), WS); if (results && results.records && results.records.length > 0) {  WS.write(`878|${results.records[0].name}|${results.records[0].unit}|${results.records[0].identifierPublic}|${results.records[0].identifierCollection}|${results.rowCount}\n`); }
    results = handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200067', 10, 0, { gatherRaw: true }), WS); if (results && results.records && results.records.length > 0) {  WS.write(`879|${results.records[0].name}|${results.records[0].unit}|${results.records[0].identifierPublic}|${results.records[0].identifierCollection}|${results.rowCount}\n`); }
    results = handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200068', 10, 0, { gatherRaw: true }), WS); if (results && results.records && results.records.length > 0) {  WS.write(`880|${results.records[0].name}|${results.records[0].unit}|${results.records[0].identifierPublic}|${results.records[0].identifierCollection}|${results.rowCount}\n`); }
    results = handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200069', 10, 0, { gatherRaw: true }), WS); if (results && results.records && results.records.length > 0) {  WS.write(`881|${results.records[0].name}|${results.records[0].unit}|${results.records[0].identifierPublic}|${results.records[0].identifierCollection}|${results.rowCount}\n`); }
    results = handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200070', 10, 0, { gatherRaw: true }), WS); if (results && results.records && results.records.length > 0) {  WS.write(`882|${results.records[0].name}|${results.records[0].unit}|${results.records[0].identifierPublic}|${results.records[0].identifierCollection}|${results.rowCount}\n`); }
    results = handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200107', 10, 0, { gatherRaw: true }), WS); if (results && results.records && results.records.length > 0) {  WS.write(`883|${results.records[0].name}|${results.records[0].unit}|${results.records[0].identifierPublic}|${results.records[0].identifierCollection}|${results.rowCount}\n`); }
    results = handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200117', 10, 0, { gatherRaw: true }), WS); if (results && results.records && results.records.length > 0) {  WS.write(`884|${results.records[0].name}|${results.records[0].unit}|${results.records[0].identifierPublic}|${results.records[0].identifierCollection}|${results.rowCount}\n`); }
    results = handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200118', 10, 0, { gatherRaw: true }), WS); if (results && results.records && results.records.length > 0) {  WS.write(`885|${results.records[0].name}|${results.records[0].unit}|${results.records[0].identifierPublic}|${results.records[0].identifierCollection}|${results.rowCount}\n`); }
    results = handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200119', 10, 0, { gatherRaw: true }), WS); if (results && results.records && results.records.length > 0) {  WS.write(`886|${results.records[0].name}|${results.records[0].unit}|${results.records[0].identifierPublic}|${results.records[0].identifierCollection}|${results.rowCount}\n`); }
    results = handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200120', 10, 0, { gatherRaw: true }), WS); if (results && results.records && results.records.length > 0) {  WS.write(`887|${results.records[0].name}|${results.records[0].unit}|${results.records[0].identifierPublic}|${results.records[0].identifierCollection}|${results.rowCount}\n`); }
    results = handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200121', 10, 0, { gatherRaw: true }), WS); if (results && results.records && results.records.length > 0) {  WS.write(`888|${results.records[0].name}|${results.records[0].unit}|${results.records[0].identifierPublic}|${results.records[0].identifierCollection}|${results.rowCount}\n`); }
    results = handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200122', 10, 0, { gatherRaw: true }), WS); if (results && results.records && results.records.length > 0) {  WS.write(`889|${results.records[0].name}|${results.records[0].unit}|${results.records[0].identifierPublic}|${results.records[0].identifierCollection}|${results.rowCount}\n`); }
    results = handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200123', 10, 0, { gatherRaw: true }), WS); if (results && results.records && results.records.length > 0) {  WS.write(`890|${results.records[0].name}|${results.records[0].unit}|${results.records[0].identifierPublic}|${results.records[0].identifierCollection}|${results.rowCount}\n`); }
    results = handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200124', 10, 0, { gatherRaw: true }), WS); if (results && results.records && results.records.length > 0) {  WS.write(`891|${results.records[0].name}|${results.records[0].unit}|${results.records[0].identifierPublic}|${results.records[0].identifierCollection}|${results.rowCount}\n`); }
    results = handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200125', 10, 0, { gatherRaw: true }), WS); if (results && results.records && results.records.length > 0) {  WS.write(`892|${results.records[0].name}|${results.records[0].unit}|${results.records[0].identifierPublic}|${results.records[0].identifierCollection}|${results.rowCount}\n`); }
    results = handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200126', 10, 0, { gatherRaw: true }), WS); if (results && results.records && results.records.length > 0) {  WS.write(`893|${results.records[0].name}|${results.records[0].unit}|${results.records[0].identifierPublic}|${results.records[0].identifierCollection}|${results.rowCount}\n`); }
    results = handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200127', 10, 0, { gatherRaw: true }), WS); if (results && results.records && results.records.length > 0) {  WS.write(`894|${results.records[0].name}|${results.records[0].unit}|${results.records[0].identifierPublic}|${results.records[0].identifierCollection}|${results.rowCount}\n`); }
    results = handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200128', 10, 0, { gatherRaw: true }), WS); if (results && results.records && results.records.length > 0) {  WS.write(`895|${results.records[0].name}|${results.records[0].unit}|${results.records[0].identifierPublic}|${results.records[0].identifierCollection}|${results.rowCount}\n`); }
}

function handleResults(results: COL.CollectionQueryResults | null, WS: NodeJS.WritableStream): COL.CollectionQueryResults | null {
    if (results) {
        if (results.error)
            LOG.info(`*** Edan Scrape: encountered error ${results.error}`, LOG.LS.eTEST);

        for (const record of results.records) {
            WS.write(`${record.unit}\t${record.identifierPublic}\t${record.identifierCollection}\t${record.name}\n`);
            LOG.info(`EDAN Query: ${JSON.stringify(record)}`, LOG.LS.eTEST);
        }
    }
    return results;
}