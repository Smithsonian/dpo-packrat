/* eslint-disable @typescript-eslint/no-explicit-any, camelcase */
import * as fs from 'fs-extra';
import * as COL from '../../collections/interface/';
import * as LOG from '../../utils/logger';
import * as H from '../../utils/helpers';
import * as L from 'lodash';

afterAll(async done => {
    // await H.Helpers.sleep(3000);
    done();
});

enum eTestType {
    eRegressionSuite = 1,
    eScrapeDPO = 2,
    eScrapeEDAN = 3
}

const now: Date = new Date();
const yyyymmdd: string = now.toISOString().split('T')[0];
const slug: string = (Math.random().toString(16) + '0000000').substr(2, 12);
let idCounter: number = 0;

const eTYPE: eTestType = +eTestType.eRegressionSuite; // + needed here so that compiler stops thinking eTYPE has a type of eTestType.eRegressionSuite!

describe('Collections: EdanCollection', () => {
    jest.setTimeout(180000);
    const ICol: COL.ICollection = COL.CollectionFactory.getInstance();

    switch (eTYPE) {
        case eTestType.eRegressionSuite:
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

            // edanmdm creation
            executeTestCreateMDM(ICol);

            test('Collections: EdanCollection Ark Tests', () => {
                executeArkTests(ICol);
            });
            break;

        case eTestType.eScrapeDPO:
            test('Collections: EdanCollection.scrape DPO', async () => {
                await scrapeDPOEdanMDM(ICol, 'd:\\Work\\SI\\EdanScrape.txt');
            });
            break;

        case eTestType.eScrapeEDAN:
            test('Collections: EdanCollection.scrape EDAN', async () => {
                await executeScrapeQuery(ICol, 'd:\\Work\\SI\\EdanScrape.txt', 0);
            });
            break;
    }
});


function executeTestQuery(ICol: COL.ICollection, query: string, expectNoResults: boolean,
    searchCollections: boolean = true, edanRecordType: string = ''): void {
    test('Collections: EdanCollection.queryCollection ' + query, async () => {
        let options: COL.CollectionQueryOptions | null = null;
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

// #region Create EDANMDM
function executeTestCreateMDM(ICol: COL.ICollection): void {
    const edanmdm: COL.EdanMDMContent = {
        descriptiveNonRepeating: {
            title: { label: 'Title', content: 'Packrat Test' },
            record_ID: 'dpo_3d_test_',
            unit_code: 'OCIO_DPO3D',
            metadata_usage: { access: 'Usage conditions apply' }
        },
        indexedStructured: { },
        freeText: { }
    };

    let edanmdmClone: COL.EdanMDMContent = edanmdm;
    let status: number = 0;
    let publicSearch: boolean = true;
    for (let testCase: number = 0; testCase <= 9; testCase++) {
        const recordId: string = nextID();
        edanmdmClone = L.cloneDeep(edanmdmClone);
        edanmdmClone.descriptiveNonRepeating.title.content = 'Packrat Test Subject ' + recordId;
        edanmdmClone.descriptiveNonRepeating.record_ID = recordId;

        switch (testCase) {
            default: break;
            case 1:  edanmdmClone.descriptiveNonRepeating.data_source = 'NMNH - Anthropology Dept.'; break;
            case 2:  edanmdmClone.descriptiveNonRepeating.online_media = { media: [{
                'thumbnail': 'https://3d-api.si.edu/content/document/3d_package:6ddc70e2-bdef-46fe-b5cb-90eb991afb15/scene-image-thumb.jpg',
                'content': 'https://3d-api.si.edu/voyager/3d_package:6ddc70e2-bdef-46fe-b5cb-90eb991afb15',
                'type': '3d_voyager',
                'voyagerId': '3d_package:6ddc70e2-bdef-46fe-b5cb-90eb991afb15',
                'usage': {
                    'access': 'Usage Conditions Apply',
                    'text': '',
                    'codes': ''
                }
            }], mediaCount: 1 }; break;
            case 3: edanmdmClone.indexedStructured!.date = ['2010s']; break; // eslint-disable-line @typescript-eslint/no-non-null-assertion
            case 4: edanmdmClone.indexedStructured!.object_type = ['Reliquaries']; break; // eslint-disable-line @typescript-eslint/no-non-null-assertion
            case 5: edanmdmClone.freeText!.notes = [{ label: 'Summary', content: 'Foobar' }]; break; // eslint-disable-line @typescript-eslint/no-non-null-assertion
            case 6: edanmdmClone.freeText!.name = [{ label: 'Collector', content: 'Zeebap' }]; break; // eslint-disable-line @typescript-eslint/no-non-null-assertion
            case 7: edanmdmClone.freeText!.place = [{ label: 'Site Name', content: 'CooVee' }]; break; // eslint-disable-line @typescript-eslint/no-non-null-assertion
            case 8: edanmdmClone.freeText!.dataSource = [{ label: 'Data Source', content: 'Vipers' }]; break; // eslint-disable-line @typescript-eslint/no-non-null-assertion
            case 9: edanmdmClone.freeText!.objectRights = [{ label: 'Credit Line', content: 'Foxtrot' }]; break; // eslint-disable-line @typescript-eslint/no-non-null-assertion
        }
        executeTestCreateMDMWorker(ICol, edanmdmClone, status, publicSearch);   // status: 0 and publicSearch: true are linked somehow
        status = 1 - status;                                                    // status: 1 and publicSearch: false are linked (not published to edan, not published API)
        publicSearch = !publicSearch;
    }
}

function executeTestCreateMDMWorker(ICol: COL.ICollection, edanmdm: COL.EdanMDMContent, status: number, publicSearch: boolean): void {
    test(`Collections: EdanCollection.createEdanMDM ${edanmdm.descriptiveNonRepeating.title.content}`, async () => {
        const edanRecord: COL.EdanRecord | null = await ICol.createEdanMDM(edanmdm, status, publicSearch);
        expect(edanRecord).toBeTruthy();
        LOG.info(`EdanCollection.test.executeTestCreateMDM created record ${JSON.stringify(edanRecord, H.Helpers.saferStringify)}`, LOG.LS.eTEST);

        if (edanRecord) {
            expect(edanRecord.status).toEqual(status);
            expect(edanRecord.publicSearch).toEqual(publicSearch);
            expect(edanRecord.content).toEqual(edanmdm);
        }

        /*
        // now query and compare query results to created subjects
        // Note that this query is done against EDAN production, whereas EDANMDM creation is done against EDAN 3D DEV ... so this won't work!
        const results: COL.CollectionQueryResults | null = await ICol.queryCollection(`edanmdm:${edanmdm.descriptiveNonRepeating.record_ID}`, 10, 0, { gatherRaw: true });
        expect(results).toBeTruthy();
        if (results) {
            expect(results.records.length).toBeGreaterThan(0);
            if (results.records.length) {
                expect(results.records[0].raw).toBeTruthy();
                expect(results.records[0].raw?.content).toMatchObject(edanmdm); // not sure if this works ... but we expect .raw to contain our edanmdm element as 'content'
            }
        }
        */
    });
}

function nextID(): string {
    const counter: string = ('00000' + (++idCounter).toString()).substr(-5);
    return `dpo_3d_test_${yyyymmdd}-${slug}-${counter}`;
}
// #endregion

// #region SCRAPE EDAN
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
// #endregion

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

// #region SCRAPE DPO
export async function scrapeDPOEdanMDM(ICol: COL.ICollection, fileName: string): Promise<void> {
    jest.setTimeout(1000 * 60 * 60);   // 1 hour

    const WS: NodeJS.WritableStream = await fs.createWriteStream(fileName, { 'flags': 'a' });
    if (!WS)
        LOG.info(`Unable to create writeStream for ${fileName}`, LOG.LS.eTEST);

    // let results: COL.CollectionQueryResults | null = null;
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200001', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200001');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200002', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200002');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200003', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200003');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200004', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200004');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200005', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200005');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200006', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200006');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200007', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200007');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200008', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200008');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200009', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200009');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200010', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200010');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200011', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200011');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200012', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200012');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200013', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200013');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200014', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200014');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200015', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200015');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200016', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200016');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200017', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200017');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200018', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200018');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200019', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200019');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200020', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200020');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200021', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200021');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200022', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200022');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200023', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200023');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200024', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200024');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200025', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200025');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200026', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200026');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200027', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200027');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200028', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200028');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200029', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200029');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200030', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200030');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200031', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200031');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200032', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200032');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200033', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200033');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200034', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200034');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200035', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200035');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200036', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200036');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200037', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200037');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200038', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200038');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200039', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200039');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200040', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200040');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200041', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200041');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200042', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200042');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200043', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200043');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200044', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200044');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200045', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200045');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200046', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200046');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200047', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200047');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200048', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200048');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200049', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200049');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200050', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200050');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200051', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200051');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200052', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200052');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200053', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200053');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200054', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200054');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200055', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200055');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200056', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200056');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200057', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200057');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200058', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200058');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200059', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200059');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200060', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200060');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200061', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200061');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200062', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200062');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200063', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200063');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200064', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200064');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200065', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200065');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200066', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200066');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200067', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200067');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200068', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200068');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200069', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200069');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200070', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200070');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200071', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200071');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200072', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200072');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200073', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200073');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200074', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200074');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200075', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200075');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200076', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200076');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200077', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200077');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200078', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200078');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200079', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200079');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200080', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200080');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200081', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200081');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200082', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200082');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200083', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200083');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200084', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200084');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200085', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200085');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200086', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200086');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200087', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200087');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200088', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200088');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200089', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200089');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200090', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200090');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200091', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200091');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200092', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200092');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200093', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200093');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200094', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200094');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200095', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200095');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200096', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200096');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200097', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200097');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200098', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200098');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200099', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200099');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200100', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200100');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200101', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200101');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200102', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200102');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200103', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200103');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200104', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200104');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200105', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200105');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200106', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200106');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200107', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200107');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200108', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200108');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200109', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200109');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200110', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200110');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200111', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200111');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200112', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200112');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200113', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200113');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200114', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200114');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200115', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200115');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200116', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200116');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200117', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200117');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200118', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200118');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200119', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200119');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200120', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200120');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200121', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200121');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200122', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200122');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200123', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200123');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200124', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200124');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200125', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200125');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200126', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200126');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200127', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200127');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200128', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200128');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200129', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200129');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200130', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200130');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200131', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200131');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200132', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200132');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200133', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200133');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200134', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200134');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200135', 10, 0, { gatherRaw: true }), WS, 'dpo_3d_200135');
}

function handleResults(results: COL.CollectionQueryResults | null, WS: NodeJS.WritableStream, id: string): COL.CollectionQueryResults | null {
    if (results) {
        if (results.error)
            LOG.info(`*** Edan Scrape: encountered error ${results.error}`, LOG.LS.eTEST);

        for (const record of results.records) {
            WS.write(`${id}\t${record.name.replace(/\r?\n|\r/g, ' ')}\t${record.unit}\t${record.identifierPublic}\t${record.identifierCollection}\t${JSON.stringify(record.raw, H.Helpers.saferStringify)}\n`);
            LOG.info(`EDAN Query: ${JSON.stringify(record)}`, LOG.LS.eTEST);
        }
    }
    return results;
}
// #endregion
