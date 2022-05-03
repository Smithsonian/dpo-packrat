/* eslint-disable @typescript-eslint/no-explicit-any, camelcase */
import * as fs from 'fs-extra';
import * as COL from '../../collections/interface/';
import * as LOG from '../../utils/logger';
import * as H from '../../utils/helpers';
import * as L from 'lodash';
// import { join } from 'path';

afterAll(async done => {
    // await H.Helpers.sleep(3000);
    done();
});

enum eTestType {
    eRegressionSuite,
    e3DPackageFetchTest,
    eScrapeDPO,
    eScrapeMigration,
    eScrapeEDAN,
    eScrapeSpecial,
    eOneOff,
}

const eTYPE: eTestType = +eTestType.eRegressionSuite; // + needed here so that compiler stops thinking eTYPE has a type of eTestType.eRegressionSuite!

const now: Date = new Date();
const yyyymmdd: string = now.toISOString().split('T')[0];
const slug: string = (Math.random().toString(16) + '0000000').substr(2, 12);
let idCounter: number = 0;

describe('Collections: EdanCollection', () => {
    jest.setTimeout(180000);
    const ICol: COL.ICollection = COL.CollectionFactory.getInstance();

    switch (eTYPE) {
        case eTestType.eOneOff:
            executeTestCreateEdan3DPackage(ICol);
            executeTestCreateMDM(ICol);
            break;

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
            // executeTestCreateMDM(ICol);
            // executeTestCreateEdan3DPackage(ICol);

            test('Collections: EdanCollection Ark Tests', () => {
                executeArkTests(ICol);
            });
            break;

        case eTestType.e3DPackageFetchTest:
            executeFetch3DPackage(ICol);
            break;

        case eTestType.eScrapeDPO:
            test('Collections: EdanCollection.scrape DPO', async () => {
                await scrapeDPOEdanMDM(ICol, 'd:\\Work\\SI\\EdanScrape.DPO.txt');
            });
            break;

        case eTestType.eScrapeMigration:
            test('Collections: EdanCollection.scrape Migration', async () => {
                await scrapeDPOMigrationMDM(ICol, 'd:\\Work\\SI\\EdanScrape.Migration.txt');
            });
            break;

        case eTestType.eScrapeEDAN:
            test('Collections: EdanCollection.scrape EDAN', async () => {
                await executeScrapeQuery(ICol, 'd:\\Work\\SI\\EdanScrape.EDAN.txt', 0);
            });
            break;

        case eTestType.eScrapeSpecial:
            test('Collections: EdanCollection.scrape EDAN', async () => {
                await executeScrapeSpecial(ICol, 'd:\\Work\\SI\\EdanScrape.Special.txt');
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
            data_source: 'NMNH - Anthropology Dept.',
            record_ID: 'dpo_3d_test_',
            unit_code: 'OCIO_DPO3D',
            metadata_usage: { access: 'Usage conditions apply' }
        },
        indexedStructured: { },
        freetext: { }
    };

    let edanmdmClone: COL.EdanMDMContent = edanmdm;
    let status: number = 0;
    let publicSearch: boolean = true;
    for (let testCase: number = 0; testCase <= 8; testCase++) {
        const recordId: string = nextID();
        edanmdmClone = L.cloneDeep(edanmdmClone);
        edanmdmClone.descriptiveNonRepeating.title.content = 'Packrat Test Subject ' + recordId;
        edanmdmClone.descriptiveNonRepeating.record_ID = recordId;

        switch (testCase) {
            default: break;
            case 1:  edanmdmClone.descriptiveNonRepeating.online_media = { media: [{
                'thumbnail': 'https://3d-api.si.edu/content/document/3d_package:6ddc70e2-bdef-46fe-b5cb-90eb991afb15/scene-image-thumb.jpg',
                'content': 'https://3d-api.si.edu/voyager/3d_package:6ddc70e2-bdef-46fe-b5cb-90eb991afb15',
                'type': '3d_voyager',
                'voyagerId': '3d_package:6ddc70e2-bdef-46fe-b5cb-90eb991afb15',
                'usage': {
                    'access': 'Usage Conditions Apply',
                    'text': '',
                    'codes': ''
                }
            }], mediaCount: '1' }; break;
            case 2: edanmdmClone.indexedStructured!.date = ['2010s']; break; // eslint-disable-line @typescript-eslint/no-non-null-assertion
            case 3: edanmdmClone.indexedStructured!.object_type = ['Reliquaries']; break; // eslint-disable-line @typescript-eslint/no-non-null-assertion
            case 4: edanmdmClone.freetext!.notes = [{ label: 'Summary', content: 'Foobar' }]; break; // eslint-disable-line @typescript-eslint/no-non-null-assertion
            case 5: edanmdmClone.freetext!.name = [{ label: 'Collector', content: 'Zeebap' }]; break; // eslint-disable-line @typescript-eslint/no-non-null-assertion
            case 6: edanmdmClone.freetext!.place = [{ label: 'Site Name', content: 'CooVee' }]; break; // eslint-disable-line @typescript-eslint/no-non-null-assertion
            case 7: edanmdmClone.freetext!.dataSource = [{ label: 'Data Source', content: 'Vipers' }]; break; // eslint-disable-line @typescript-eslint/no-non-null-assertion
            case 8: edanmdmClone.freetext!.objectRights = [{ label: 'Credit Line', content: 'Foxtrot' }]; break; // eslint-disable-line @typescript-eslint/no-non-null-assertion
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

// #region Create EDAN 3D Package
function executeTestCreateEdan3DPackage(ICol: COL.ICollection): void {
    // executeTestCreateEdan3DPackageWorker(ICol, 'file:///' + mockScenePath.replace(/\\/g, '/'), 'scene.svx.json');
    // executeTestCreateEdan3DPackageWorker(ICol, 'nfs:///si-3ddigi-staging/upload/ff607e3c-3d88-4422-a246-3976aa4839dc.zip', 'scene.svx.json');
    // executeTestCreateEdan3DPackageWorker(ICol, 'nfs:///si-3ddigi-staging/upload/fbcc6998-41a8-41cf-af57-81a82098f3ca.zip', 'scene.svx.json');
    executeTestCreateEdan3DPackageWorker(ICol, 'nfs:///si-3ddigi-staging/upload/f550015a-7e43-435b-90dc-e7c1367bc5fb.zip', 'scene.svx.json');
}

function executeTestCreateEdan3DPackageWorker(ICol: COL.ICollection, path: string, scene: string): void {
    test(`Collections: EdanCollection.createEdan3DPackage ${path}, ${scene}`, async () => {
        const edanRecord: COL.EdanRecord | null = await ICol.createEdan3DPackage(path);
        expect(edanRecord).toBeTruthy();
        LOG.info(`EdanCollection.test.executeTestCreateEdan3DPackage created record ${JSON.stringify(edanRecord, H.Helpers.saferStringify)}`, LOG.LS.eTEST);

        // if (edanRecord)
        //     expect(edanRecord.content).toMatch(path);
    });
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
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200001', 'dpo_3d_200001');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200002', 'dpo_3d_200002');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200003', 'dpo_3d_200003');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200004', 'dpo_3d_200004');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200005', 'dpo_3d_200005');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200006', 'dpo_3d_200006');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200007', 'dpo_3d_200007');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200008', 'dpo_3d_200008');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200009', 'dpo_3d_200009');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200010', 'dpo_3d_200010');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200011', 'dpo_3d_200011');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200012', 'dpo_3d_200012');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200013', 'dpo_3d_200013');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200014', 'dpo_3d_200014');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200015', 'dpo_3d_200015');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200016', 'dpo_3d_200016');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200017', 'dpo_3d_200017');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200018', 'dpo_3d_200018');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200019', 'dpo_3d_200019');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200020', 'dpo_3d_200020');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200021', 'dpo_3d_200021');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200022', 'dpo_3d_200022');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200023', 'dpo_3d_200023');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200024', 'dpo_3d_200024');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200025', 'dpo_3d_200025');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200026', 'dpo_3d_200026');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200027', 'dpo_3d_200027');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200028', 'dpo_3d_200028');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200029', 'dpo_3d_200029');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200030', 'dpo_3d_200030');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200031', 'dpo_3d_200031');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200032', 'dpo_3d_200032');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200033', 'dpo_3d_200033');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200034', 'dpo_3d_200034');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200035', 'dpo_3d_200035');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200036', 'dpo_3d_200036');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200037', 'dpo_3d_200037');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200038', 'dpo_3d_200038');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200039', 'dpo_3d_200039');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200040', 'dpo_3d_200040');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200041', 'dpo_3d_200041');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200042', 'dpo_3d_200042');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200043', 'dpo_3d_200043');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200044', 'dpo_3d_200044');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200045', 'dpo_3d_200045');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200046', 'dpo_3d_200046');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200047', 'dpo_3d_200047');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200048', 'dpo_3d_200048');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200049', 'dpo_3d_200049');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200050', 'dpo_3d_200050');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200051', 'dpo_3d_200051');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200052', 'dpo_3d_200052');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200053', 'dpo_3d_200053');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200054', 'dpo_3d_200054');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200055', 'dpo_3d_200055');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200056', 'dpo_3d_200056');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200057', 'dpo_3d_200057');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200058', 'dpo_3d_200058');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200059', 'dpo_3d_200059');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200060', 'dpo_3d_200060');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200061', 'dpo_3d_200061');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200062', 'dpo_3d_200062');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200063', 'dpo_3d_200063');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200064', 'dpo_3d_200064');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200065', 'dpo_3d_200065');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200066', 'dpo_3d_200066');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200067', 'dpo_3d_200067');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200068', 'dpo_3d_200068');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200069', 'dpo_3d_200069');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200070', 'dpo_3d_200070');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200071', 'dpo_3d_200071');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200072', 'dpo_3d_200072');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200073', 'dpo_3d_200073');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200074', 'dpo_3d_200074');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200075', 'dpo_3d_200075');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200076', 'dpo_3d_200076');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200077', 'dpo_3d_200077');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200078', 'dpo_3d_200078');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200079', 'dpo_3d_200079');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200080', 'dpo_3d_200080');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200081', 'dpo_3d_200081');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200082', 'dpo_3d_200082');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200083', 'dpo_3d_200083');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200084', 'dpo_3d_200084');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200085', 'dpo_3d_200085');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200086', 'dpo_3d_200086');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200087', 'dpo_3d_200087');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200088', 'dpo_3d_200088');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200089', 'dpo_3d_200089');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200090', 'dpo_3d_200090');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200091', 'dpo_3d_200091');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200092', 'dpo_3d_200092');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200093', 'dpo_3d_200093');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200094', 'dpo_3d_200094');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200095', 'dpo_3d_200095');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200096', 'dpo_3d_200096');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200097', 'dpo_3d_200097');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200098', 'dpo_3d_200098');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200099', 'dpo_3d_200099');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200100', 'dpo_3d_200100');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200101', 'dpo_3d_200101');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200102', 'dpo_3d_200102');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200103', 'dpo_3d_200103');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200104', 'dpo_3d_200104');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200105', 'dpo_3d_200105');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200106', 'dpo_3d_200106');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200107', 'dpo_3d_200107');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200108', 'dpo_3d_200108');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200109', 'dpo_3d_200109');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200110', 'dpo_3d_200110');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200111', 'dpo_3d_200111');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200112', 'dpo_3d_200112');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200113', 'dpo_3d_200113');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200114', 'dpo_3d_200114');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200115', 'dpo_3d_200115');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200116', 'dpo_3d_200116');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200117', 'dpo_3d_200117');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200118', 'dpo_3d_200118');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200119', 'dpo_3d_200119');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200120', 'dpo_3d_200120');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200121', 'dpo_3d_200121');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200122', 'dpo_3d_200122');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200123', 'dpo_3d_200123');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200124', 'dpo_3d_200124');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200125', 'dpo_3d_200125');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200126', 'dpo_3d_200126');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200127', 'dpo_3d_200127');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200128', 'dpo_3d_200128');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200129', 'dpo_3d_200129');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200130', 'dpo_3d_200130');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200131', 'dpo_3d_200131');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200132', 'dpo_3d_200132');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200133', 'dpo_3d_200133');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200134', 'dpo_3d_200134');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200135', 'dpo_3d_200135');
}


export async function executeScrapeSpecial(ICol: COL.ICollection, fileName: string): Promise<void> {
    jest.setTimeout(1000 * 60 * 60);   // 1 hour

    const WS: NodeJS.WritableStream = await fs.createWriteStream(fileName, { 'flags': 'a' });
    if (!WS)
        LOG.info(`Unable to create writeStream for ${fileName}`, LOG.LS.eTEST);

    await handleResults(ICol, WS, 'Amati, Nicolo Vn 1654, \'Brookings\' LOC', '484');
    await handleResults(ICol, WS, 'Guarneri del Gesu Vn \'Baron Vitta\' 1730 SIL LOC', '494');
    await handleResults(ICol, WS, 'Guarneri del Gesu Vn \'Kreisler\' 1732  LOC', '495');
    await handleResults(ICol, WS, 'Stradivari Vn \'Hellier\' 1679 SIL', '553');
    await handleResults(ICol, WS, 'Stradivari Vn \'Sunrise\' 1677 SIL', '556');
    await handleResults(ICol, WS, 'Stradivari C \'Castelbarco\' 1697 LOC', '543');
    await handleResults(ICol, WS, 'Stradivari Va \'Cassavetti\' 1727 LOC', '547');
    await handleResults(ICol, WS, 'Stradivari Vn \'Betts\' 1704 LOC', '550');
    await handleResults(ICol, WS, 'Stradivari Vn \'Castelbarco\' 1699 LOC', '551');
    await handleResults(ICol, WS, 'Stradivari Vn \'Ward\' 1700 LOC', '559');
}

export async function scrapeDPOMigrationMDM(ICol: COL.ICollection, fileName: string): Promise<void> {
    jest.setTimeout(1000 * 60 * 60);   // 1 hour

    const WS: NodeJS.WritableStream = await fs.createWriteStream(fileName, { 'flags': 'a' });
    if (!WS)
        LOG.info(`Unable to create writeStream for ${fileName}`, LOG.LS.eTEST);

    await handleResults(ICol, WS, ' BABOON', '569');
    await handleResults(ICol, WS, ' Crocodile', '570');
    await handleResults(ICol, WS, ' HAWK2', '572');
    await handleResults(ICol, WS, '1988_0062_0294', '417');
    await handleResults(ICol, WS, '2007_0116_274', '420');
    await handleResults(ICol, WS, '2017_01116_281', '429');
    await handleResults(ICol, WS, '2017_0116', '430');
    await handleResults(ICol, WS, '2018_0009_0002', '434');
    await handleResults(ICol, WS, '76-15-2 Ivory Tusk', '206');
    await handleResults(ICol, WS, '78-23-15 Ivory Tusk', '207');
    await handleResults(ICol, WS, '79_002_421', '464');
    await handleResults(ICol, WS, '79_112_cm1031', '470');
    await handleResults(ICol, WS, 'a240189_64a Wooden Bowl', '576');
    await handleResults(ICol, WS, 'A355722 Fire Board', '589');
    await handleResults(ICol, WS, 'Abydos Mummy 074586', '603');
    await handleResults(ICol, WS, 'Abydos Mummy 279283', '604');
    await handleResults(ICol, WS, 'Abydos Mummy 279286', '605');
    await handleResults(ICol, WS, 'Adult Mummy (Andrew)', '609');
    await handleResults(ICol, WS, 'allosaurus articulated skeleton', '614');
    await handleResults(ICol, WS, 'Amati, Nicolo Vn 1654, \'Brookings\' LOC', '484');
    await handleResults(ICol, WS, 'Amati, Nicolo Vn 1675 SI', '486');
    await handleResults(ICol, WS, 'ammonite', '618');
    await handleResults(ICol, WS, 'Argonauta Nodosa', '194');
    await handleResults(ICol, WS, 'Armstrong Space Suit Glove Savage Reproduction', '201');
    await handleResults(ICol, WS, 'Articulated Woolly Mammoth', '100');
    await handleResults(ICol, WS, 'Bombus Bee', '877');
    await handleResults(ICol, WS, 'boot ', '361');
    await handleResults(ICol, WS, 'boots ', '362');
    await handleResults(ICol, WS, 'Boy Mummy', '633');
    await handleResults(ICol, WS, 'Branta-sandvicensis C10', '634');
    await handleResults(ICol, WS, 'Branta-sandvicensis C3', '635');
    await handleResults(ICol, WS, 'Branta-sandvicensis Pelvis', '636');
    await handleResults(ICol, WS, 'bust nam ', '363');
    await handleResults(ICol, WS, 'Cab Calloway Case', '381');
    await handleResults(ICol, WS, 'camera arriflex16srii', '364');
    await handleResults(ICol, WS, 'camptosaurus articulated skeleton', '640');
    await handleResults(ICol, WS, 'Cast Iron Cauldron', '382');
    await handleResults(ICol, WS, 'Cat Mummy 2 381569', '641');
    await handleResults(ICol, WS, 'Cat Mummy 437431', '642');
    await handleResults(ICol, WS, 'checkerboard skirt ', '911');
    await handleResults(ICol, WS, 'chionecetes opilio (crabs)', '644');
    await handleResults(ICol, WS, 'Clovis Drake1', '645');
    await handleResults(ICol, WS, 'Clovis Drake10', '646');
    await handleResults(ICol, WS, 'Clovis Drake11', '647');
    await handleResults(ICol, WS, 'Clovis Drake12', '648');
    await handleResults(ICol, WS, 'Clovis Drake2', '192');
    await handleResults(ICol, WS, 'Clovis Drake3', '649');
    await handleResults(ICol, WS, 'Clovis Drake4', '650');
    await handleResults(ICol, WS, 'Clovis Drake5', '651');
    await handleResults(ICol, WS, 'Clovis Drake6', '652');
    await handleResults(ICol, WS, 'Clovis Drake9', '653');
    await handleResults(ICol, WS, 'Coffee Grinder', '383');
    await handleResults(ICol, WS, 'Colonoware pot from Cooper River, Charleston County, SC', '924');
    await handleResults(ICol, WS, 'coryanthes-dried', '878');
    await handleResults(ICol, WS, 'Crocodile Mummy', '656');
    await handleResults(ICol, WS, 'diplodocus longus articulated skeleton', '661');
    await handleResults(ICol, WS, 'dtid-1047', '668');
    await handleResults(ICol, WS, 'dtid-270', '670');
    await handleResults(ICol, WS, 'dtid-609', '671');
    await handleResults(ICol, WS, 'edanmdm:chndm_1907-1-40', '295');
    await handleResults(ICol, WS, 'edanmdm:chndm_1910-12-1', '282');
    await handleResults(ICol, WS, 'edanmdm:chndm_1910-41-1', '25');
    await handleResults(ICol, WS, 'edanmdm:chndm_1913-45-9-a_b', '284');
    await handleResults(ICol, WS, 'edanmdm:chndm_1916-19-83-a_b', '287');
    await handleResults(ICol, WS, 'edanmdm:chndm_1924-6-1', '13');
    await handleResults(ICol, WS, 'edanmdm:chndm_1931-48-73', '299');
    await handleResults(ICol, WS, 'edanmdm:chndm_1938-57-306-a_b', '304');
    await handleResults(ICol, WS, 'edanmdm:chndm_1938-58-1083', '24');
    await handleResults(ICol, WS, 'edanmdm:chndm_1949-64-7', '286');
    await handleResults(ICol, WS, 'edanmdm:chndm_1959-144-1', '56');
    await handleResults(ICol, WS, 'edanmdm:chndm_1962-67-1', '300');
    await handleResults(ICol, WS, 'edanmdm:chndm_1971-48-12', '26');
    await handleResults(ICol, WS, 'edanmdm:chndm_1972-79-2', '296');
    await handleResults(ICol, WS, 'edanmdm:chndm_1984-84-36', '297');
    await handleResults(ICol, WS, 'edanmdm:chndm_1985-103-49', '292');
    await handleResults(ICol, WS, 'edanmdm:chndm_1985-103-50', '288');
    await handleResults(ICol, WS, 'edanmdm:chndm_1985-103-51', '291');
    await handleResults(ICol, WS, 'edanmdm:chndm_1985-103-52', '290');
    await handleResults(ICol, WS, 'edanmdm:chndm_1985-103-81', '289');
    await handleResults(ICol, WS, 'edanmdm:chndm_1985-103-82', '302');
    await handleResults(ICol, WS, 'edanmdm:chndm_1990-133-3', '305');
    await handleResults(ICol, WS, 'edanmdm:chndm_1994-73-2', '294');
    await handleResults(ICol, WS, 'edanmdm:chndm_2003-3-1', '293');
    await handleResults(ICol, WS, 'edanmdm:chndm_2006-5-1', '27');
    await handleResults(ICol, WS, 'edanmdm:chndm_2007-45-13', '298');
    await handleResults(ICol, WS, 'edanmdm:chndm_2007-45-14', '303');
    await handleResults(ICol, WS, 'edanmdm:chndm_2011-28-1', '283');
    await handleResults(ICol, WS, 'edanmdm:chndm_2011-31-1', '301');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200001', '131');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200002', '132');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200003', '133');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200004', '127');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200005', '128');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200006', '172');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200008', '130');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200009', '174');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200010', '169');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200011', '73');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200012', '54');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200013', '190');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200014', '135');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200015', '15');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200016', '62');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200017', '63');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200018', '60');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200019', '61');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200020', '72');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200021', '156');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200023', '158');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200026', '154');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200028', '126');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200029', '125');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200030', '188');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200031', '167');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200032', '166');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200033', '168');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200034', '108');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200035', '173');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200036', '107');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200038', '65');
    await handleResults(ICol, WS, 'edanmdm:dpo_3d_200039', '766');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1908.236', '114');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1915.109', '96');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1916.345', '28');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1921.1', '199');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1921.2', '200');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1923.15', '22');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1930.54a-b', '20');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1936.6a-b', '19');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1947.15a-b', '29');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1961.33a-b', '5');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1978.40', '109');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1980.14a-c', '307');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1980.191a-c', '50');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1980.192a-c', '49');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1980.193a-b', '52');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1980.194a-b', '51');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1982.15a-c', '312');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1982.16a-b', '341');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1982.17', '195');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1982.18a-b', '315');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1982.19a-b', '110');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1982.20a-b', '316');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1982.21a-b', '351');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1982.22a-b', '352');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1986.19a-b', '196');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1986.20a-b', '329');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1986.21a-c', '330');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1986.4a-b', '349');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1989.1', '313');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1991.46', '342');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1991.48a-b', '111');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1991.49', '317');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1991.50', '318');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1991.51', '343');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1991.58', '339');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1991.59', '353');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1991.60', '354');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1991.61a-b', '344');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1991.62', '345');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1992.10a-b', '336');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1992.11a-b', '335');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1992.13.1', '355');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1992.13.2', '112');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1992.14a-b', '337');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1992.15.1', '340');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1992.25', '328');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1992.27.1', '310');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1992.27.2', '311');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1992.3', '113');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1992.33', '314');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1992.34.1', '324');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1992.34.2', '325');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1992.46', '346');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1992.47.1', '308');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1992.47.2', '309');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1992.47.3a-b', '332');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1992.47.4a-c', '333');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1992.47.5a-b', '334');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1992.48.1', '327');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1992.48.2', '326');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1992.56', '350');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1992.6', '322');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1992.7', '323');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1993.10a-b', '331');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1993.7.1', '347');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1993.7.2', '348');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1994.26.1', '197');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1994.26.2', '319');
    await handleResults(ICol, WS, 'edanmdm:fsg_F1995.3.2a-b', '306');
    await handleResults(ICol, WS, 'edanmdm:fsg_F2002.10.1', '320');
    await handleResults(ICol, WS, 'edanmdm:fsg_F2002.10.2', '321');
    await handleResults(ICol, WS, 'edanmdm:fsg_F2004.37.1a-c', '198');
    await handleResults(ICol, WS, 'edanmdm:fsg_F2004.37.2a-c', '338');
    await handleResults(ICol, WS, 'edanmdm:hmsg_01.9', '357');
    await handleResults(ICol, WS, 'edanmdm:hmsg_06.15', '360');
    await handleResults(ICol, WS, 'edanmdm:hmsg_66.3867', '358');
    await handleResults(ICol, WS, 'edanmdm:hmsg_93.6', '356');
    await handleResults(ICol, WS, 'edanmdm:hmsg_94.13', '359');
    await handleResults(ICol, WS, 'edanmdm:nasm_A19280021000', '97');
    await handleResults(ICol, WS, 'edanmdm:nasm_A19330035008', '375');
    await handleResults(ICol, WS, 'edanmdm:nasm_A19330055000', '367');
    await handleResults(ICol, WS, 'edanmdm:nasm_A19510007000', '14');
    await handleResults(ICol, WS, 'edanmdm:nasm_A19540108000', '379');
    await handleResults(ICol, WS, 'edanmdm:nasm_A19610048000', '3');
    await handleResults(ICol, WS, 'edanmdm:nasm_A19700102000', '6');
    await handleResults(ICol, WS, 'edanmdm:nasm_A19730040000', '102');
    await handleResults(ICol, WS, 'edanmdm:nasm_A19730040001', '103');
    await handleResults(ICol, WS, 'edanmdm:nasm_A19730040002', '104');
    await handleResults(ICol, WS, 'edanmdm:nasm_A19730040003', '105');
    await handleResults(ICol, WS, 'edanmdm:nasm_A19791810000', '18');
    await handleResults(ICol, WS, 'edanmdm:nasm_A19850354000', '377');
    await handleResults(ICol, WS, 'edanmdm:nasm_A20050459000', '376');
    await handleResults(ICol, WS, 'edanmdm:nasm_A20110028000', '365');
    await handleResults(ICol, WS, 'edanmdm:nasm_A20120325000', '11');
    await handleResults(ICol, WS, 'edanmdm:nmaahc_2007.3.8.4ab', '4');
    await handleResults(ICol, WS, 'edanmdm:nmaahc_2007.5.1ab', '106');
    await handleResults(ICol, WS, 'edanmdm:nmaahc_2010.19.3', '392');
    await handleResults(ICol, WS, 'edanmdm:nmaahc_2011.118.4ab', '399');
    await handleResults(ICol, WS, 'edanmdm:nmaahc_2011.128.2ab', '176');
    await handleResults(ICol, WS, 'edanmdm:nmaahc_2011.143.3.2ab', '391');
    await handleResults(ICol, WS, 'edanmdm:nmaahc_2011.159.6', '58');
    await handleResults(ICol, WS, 'edanmdm:nmaahc_2011.163.8ab', '48');
    await handleResults(ICol, WS, 'edanmdm:nmaahc_2011.46.1', '384');
    await handleResults(ICol, WS, 'edanmdm:nmaahc_2011.51.3', '393');
    await handleResults(ICol, WS, 'edanmdm:nmaahc_2012.113.2', '57');
    await handleResults(ICol, WS, 'edanmdm:nmaahc_2013.141.1', '59');
    await handleResults(ICol, WS, 'edanmdm:nmaahc_2013.39.7', '31');
    await handleResults(ICol, WS, 'edanmdm:nmaahc_2013.57', '925');
    await handleResults(ICol, WS, 'edanmdm:nmaahc_2014.210.3', '380');
    await handleResults(ICol, WS, 'edanmdm:nmaahc_2014.2ab', '385');
    await handleResults(ICol, WS, 'edanmdm:nmaahc_2014.46.5ab', '398');
    await handleResults(ICol, WS, 'edanmdm:nmaahc_2014.63.59', '32');
    await handleResults(ICol, WS, 'edanmdm:nmaahc_2015.115.1ab', '394');
    await handleResults(ICol, WS, 'edanmdm:nmaahc_2015.2.4', '202');
    await handleResults(ICol, WS, 'edanmdm:nmaahc_2015.247.3', '203');
    await handleResults(ICol, WS, 'edanmdm:nmaahc_2016.152.2', '396');
    await handleResults(ICol, WS, 'edanmdm:nmaahc_2019.10.1a-g', '922');
    await handleResults(ICol, WS, 'edanmdm:nmafa_2005-6-17', '401');
    await handleResults(ICol, WS, 'edanmdm:nmafa_2005-6-9', '402');
    await handleResults(ICol, WS, 'edanmdm:nmafa_2007-1-1', '403');
    await handleResults(ICol, WS, 'edanmdm:nmafa_2007-1-2', '404');
    await handleResults(ICol, WS, 'edanmdm:nmafa_2007-1-3', '405');
    await handleResults(ICol, WS, 'edanmdm:nmafa_74-20-1', '408');
    await handleResults(ICol, WS, 'edanmdm:nmafa_74-20-2', '411');
    await handleResults(ICol, WS, 'edanmdm:nmafa_79-16-47', '414');
    await handleResults(ICol, WS, 'edanmdm:nmafa_96-28-1', '415');
    await handleResults(ICol, WS, 'edanmdm:nmafa_96-30-1', '416');
    await handleResults(ICol, WS, 'edanmdm:nmah_1000981', '566');
    await handleResults(ICol, WS, 'edanmdm:nmah_1000982', '563');
    await handleResults(ICol, WS, 'edanmdm:nmah_1000984', '565');
    await handleResults(ICol, WS, 'edanmdm:nmah_1004508', '481');
    await handleResults(ICol, WS, 'edanmdm:nmah_1029149', '534');
    await handleResults(ICol, WS, 'edanmdm:nmah_1029284', '535');
    await handleResults(ICol, WS, 'edanmdm:nmah_1096762', '1');
    await handleResults(ICol, WS, 'edanmdm:nmah_1105750', '913');
    await handleResults(ICol, WS, 'edanmdm:nmah_1108470', '503');
    await handleResults(ICol, WS, 'edanmdm:nmah_1199660', '473');
    await handleResults(ICol, WS, 'edanmdm:nmah_1250962', '472');
    await handleResults(ICol, WS, 'edanmdm:nmah_1251889', '418');
    await handleResults(ICol, WS, 'edanmdm:nmah_1251903', '435');
    await handleResults(ICol, WS, 'edanmdm:nmah_1272680', '187');
    await handleResults(ICol, WS, 'edanmdm:nmah_1449492', '907');
    await handleResults(ICol, WS, 'edanmdm:nmah_1764061', '912');
    await handleResults(ICol, WS, 'edanmdm:nmah_1816008', '120');
    await handleResults(ICol, WS, 'edanmdm:nmah_1816562', '458');
    await handleResults(ICol, WS, 'edanmdm:nmah_1816726', '450');
    await handleResults(ICol, WS, 'edanmdm:nmah_1816728', '451');
    await handleResults(ICol, WS, 'edanmdm:nmah_1818990', '462');
    await handleResults(ICol, WS, 'edanmdm:nmah_1819662', '452');
    await handleResults(ICol, WS, 'edanmdm:nmah_1820223', '186');
    await handleResults(ICol, WS, 'edanmdm:nmah_1820541', '463');
    await handleResults(ICol, WS, 'edanmdm:nmah_1821317', '459');
    await handleResults(ICol, WS, 'edanmdm:nmah_1822363', '460');
    await handleResults(ICol, WS, 'edanmdm:nmah_1827973', '440');
    await handleResults(ICol, WS, 'edanmdm:nmah_1827978', '444');
    await handleResults(ICol, WS, 'edanmdm:nmah_1828021', '436');
    await handleResults(ICol, WS, 'edanmdm:nmah_1828030', '437');
    await handleResults(ICol, WS, 'edanmdm:nmah_1828078', '438');
    await handleResults(ICol, WS, 'edanmdm:nmah_1828119', '439');
    await handleResults(ICol, WS, 'edanmdm:nmah_1828170', '441');
    await handleResults(ICol, WS, 'edanmdm:nmah_1828269', '442');
    await handleResults(ICol, WS, 'edanmdm:nmah_1828429', '443');
    await handleResults(ICol, WS, 'edanmdm:nmah_1828505', '445');
    await handleResults(ICol, WS, 'edanmdm:nmah_1828510', '446');
    await handleResults(ICol, WS, 'edanmdm:nmah_1828628', '447');
    await handleResults(ICol, WS, 'edanmdm:nmah_1828648', '448');
    await handleResults(ICol, WS, 'edanmdm:nmah_1828839', '183');
    await handleResults(ICol, WS, 'edanmdm:nmah_1828842', '449');
    await handleResults(ICol, WS, 'edanmdm:nmah_1829185', '528');
    await handleResults(ICol, WS, 'edanmdm:nmah_1829332', '513');
    await handleResults(ICol, WS, 'edanmdm:nmah_1829524', '514');
    await handleResults(ICol, WS, 'edanmdm:nmah_1829535', '517');
    await handleResults(ICol, WS, 'edanmdm:nmah_1829542', '519');
    await handleResults(ICol, WS, 'edanmdm:nmah_1830215', '522');
    await handleResults(ICol, WS, 'edanmdm:nmah_1832532', '421');
    await handleResults(ICol, WS, 'edanmdm:nmah_1832985', '526');
    await handleResults(ICol, WS, 'edanmdm:nmah_1837459', '116');
    await handleResults(ICol, WS, 'edanmdm:nmah_1837609', '422');
    await handleResults(ICol, WS, 'edanmdm:nmah_1837621', '423');
    await handleResults(ICol, WS, 'edanmdm:nmah_1838349', '178');
    await handleResults(ICol, WS, 'edanmdm:nmah_1838643', '424');
    await handleResults(ICol, WS, 'edanmdm:nmah_1838644', '425');
    await handleResults(ICol, WS, 'edanmdm:nmah_1838650', '426');
    await handleResults(ICol, WS, 'edanmdm:nmah_1838652', '427');
    await handleResults(ICol, WS, 'edanmdm:nmah_1838676', '117');
    await handleResults(ICol, WS, 'edanmdm:nmah_1841912', '453');
    await handleResults(ICol, WS, 'edanmdm:nmah_1841933', '454');
    await handleResults(ICol, WS, 'edanmdm:nmah_1842503', '455');
    await handleResults(ICol, WS, 'edanmdm:nmah_1843368', '118');
    await handleResults(ICol, WS, 'edanmdm:nmah_1845461', '124');
    await handleResults(ICol, WS, 'edanmdm:nmah_1846255', '431');
    await handleResults(ICol, WS, 'edanmdm:nmah_1846271', '180');
    await handleResults(ICol, WS, 'edanmdm:nmah_1846281', '119');
    await handleResults(ICol, WS, 'edanmdm:nmah_1846344', '181');
    await handleResults(ICol, WS, 'edanmdm:nmah_1846377', '432');
    await handleResults(ICol, WS, 'edanmdm:nmah_1846388', '182');
    await handleResults(ICol, WS, 'edanmdm:nmah_1846391', '419');
    await handleResults(ICol, WS, 'edanmdm:nmah_1847611', '918');
    await handleResults(ICol, WS, 'edanmdm:nmah_1847873', '428');
    await handleResults(ICol, WS, 'edanmdm:nmah_1848079', '179');
    await handleResults(ICol, WS, 'edanmdm:nmah_1849041', '456');
    await handleResults(ICol, WS, 'edanmdm:nmah_1849265', '433');
    await handleResults(ICol, WS, 'edanmdm:nmah_1850922', '121');
    await handleResults(ICol, WS, 'edanmdm:nmah_1851521', '457');
    await handleResults(ICol, WS, 'edanmdm:nmah_1853623', '531');
    await handleResults(ICol, WS, 'edanmdm:nmah_1872415', '527');
    await handleResults(ICol, WS, 'edanmdm:nmah_1896978', '904');
    await handleResults(ICol, WS, 'edanmdm:nmah_1900832', '905');
    await handleResults(ICol, WS, 'edanmdm:nmah_1904639', '908');
    await handleResults(ICol, WS, 'edanmdm:nmah_1939654', '902');
    await handleResults(ICol, WS, 'edanmdm:nmah_214477', '545');
    await handleResults(ICol, WS, 'edanmdm:nmah_361750', '910');
    await handleResults(ICol, WS, 'edanmdm:nmah_362153', '906');
    await handleResults(ICol, WS, 'edanmdm:nmah_363781', '914');
    await handleResults(ICol, WS, 'edanmdm:nmah_364445', '909');
    await handleResults(ICol, WS, 'edanmdm:nmah_365585', '920');
    await handleResults(ICol, WS, 'edanmdm:nmah_365586', '921');
    await handleResults(ICol, WS, 'edanmdm:nmah_368509', '919');
    await handleResults(ICol, WS, 'edanmdm:nmah_373625', '903');
    await handleResults(ICol, WS, 'edanmdm:nmah_375161', '917');
    await handleResults(ICol, WS, 'edanmdm:nmah_463506', '165');
    await handleResults(ICol, WS, 'edanmdm:nmah_605482', '474');
    await handleResults(ICol, WS, 'edanmdm:nmah_605485', '489');
    await handleResults(ICol, WS, 'edanmdm:nmah_605487', '490');
    await handleResults(ICol, WS, 'edanmdm:nmah_605498', '491');
    await handleResults(ICol, WS, 'edanmdm:nmah_605500', '493');
    await handleResults(ICol, WS, 'edanmdm:nmah_605503', '496');
    await handleResults(ICol, WS, 'edanmdm:nmah_605507', '497');
    await handleResults(ICol, WS, 'edanmdm:nmah_605519', '562');
    await handleResults(ICol, WS, 'edanmdm:nmah_605596', '512');
    await handleResults(ICol, WS, 'edanmdm:nmah_606746', '500');
    await handleResults(ICol, WS, 'edanmdm:nmah_607621', '499');
    await handleResults(ICol, WS, 'edanmdm:nmah_607647', '488');
    await handleResults(ICol, WS, 'edanmdm:nmah_689864', '115');
    await handleResults(ICol, WS, 'edanmdm:nmah_703292', '33');
    await handleResults(ICol, WS, 'edanmdm:nmah_703302', '34');
    await handleResults(ICol, WS, 'edanmdm:nmah_703318', '35');
    await handleResults(ICol, WS, 'edanmdm:nmah_703325', '37');
    await handleResults(ICol, WS, 'edanmdm:nmah_705564', '36');
    await handleResults(ICol, WS, 'edanmdm:nmah_712417', '38');
    await handleResults(ICol, WS, 'edanmdm:nmah_739714', '552');
    await handleResults(ICol, WS, 'edanmdm:nmah_739715', '555');
    await handleResults(ICol, WS, 'edanmdm:nmah_739716', '546');
    await handleResults(ICol, WS, 'edanmdm:nmah_748903', '901');
    await handleResults(ICol, WS, 'edanmdm:nmah_763853', '475');
    await handleResults(ICol, WS, 'edanmdm:nmah_911374', '184');
    await handleResults(ICol, WS, 'edanmdm:nmah_911375', '461');
    await handleResults(ICol, WS, 'edanmdm:nmah_920560', '122');
    await handleResults(ICol, WS, 'edanmdm:nmah_920740', '177');
    await handleResults(ICol, WS, 'edanmdm:nmah_923037', '465');
    await handleResults(ICol, WS, 'edanmdm:nmah_923043', '471');
    await handleResults(ICol, WS, 'edanmdm:nmah_923083', '466');
    await handleResults(ICol, WS, 'edanmdm:nmah_923113', '467');
    await handleResults(ICol, WS, 'edanmdm:nmah_923116', '468');
    await handleResults(ICol, WS, 'edanmdm:nmah_923122', '185');
    await handleResults(ICol, WS, 'edanmdm:nmah_923126', '469');
    await handleResults(ICol, WS, 'edanmdm:nmah_923135', '123');
    await handleResults(ICol, WS, 'edanmdm:nmnhanthropology_8010183', '785');
    await handleResults(ICol, WS, 'edanmdm:nmnhanthropology_8010185', '784');
    await handleResults(ICol, WS, 'edanmdm:nmnhanthropology_8010270', '210');
    await handleResults(ICol, WS, 'edanmdm:nmnhanthropology_8061118', '575');
    await handleResults(ICol, WS, 'edanmdm:nmnhanthropology_8061135', '577');
    await handleResults(ICol, WS, 'edanmdm:nmnhanthropology_8061530', '578');
    await handleResults(ICol, WS, 'edanmdm:nmnhanthropology_8061534', '579');
    await handleResults(ICol, WS, 'edanmdm:nmnhanthropology_8061757', '580');
    await handleResults(ICol, WS, 'edanmdm:nmnhanthropology_8061963', '134');
    await handleResults(ICol, WS, 'edanmdm:nmnhanthropology_8096367', '581');
    await handleResults(ICol, WS, 'edanmdm:nmnhanthropology_8098412', '582');
    await handleResults(ICol, WS, 'edanmdm:nmnhanthropology_8098584', '583');
    await handleResults(ICol, WS, 'edanmdm:nmnhanthropology_8099755', '584');
    await handleResults(ICol, WS, 'edanmdm:nmnhanthropology_8100879', '585');
    await handleResults(ICol, WS, 'edanmdm:nmnhanthropology_8108582', '586');
    await handleResults(ICol, WS, 'edanmdm:nmnhanthropology_8108704', '587');
    await handleResults(ICol, WS, 'edanmdm:nmnhanthropology_8108706', '588');
    await handleResults(ICol, WS, 'edanmdm:nmnhanthropology_8109761', '590');
    await handleResults(ICol, WS, 'edanmdm:nmnhanthropology_8114628', '615');
    await handleResults(ICol, WS, 'edanmdm:nmnhanthropology_8114952', '591');
    await handleResults(ICol, WS, 'edanmdm:nmnhanthropology_8115528', '592');
    await handleResults(ICol, WS, 'edanmdm:nmnhanthropology_8115597', '593');
    await handleResults(ICol, WS, 'edanmdm:nmnhanthropology_8131572', '594');
    await handleResults(ICol, WS, 'edanmdm:nmnhanthropology_8131573', '595');
    await handleResults(ICol, WS, 'edanmdm:nmnhanthropology_8131574', '596');
    await handleResults(ICol, WS, 'edanmdm:nmnhanthropology_8131634', '597');
    await handleResults(ICol, WS, 'edanmdm:nmnhanthropology_8131636', '598');
    await handleResults(ICol, WS, 'edanmdm:nmnhanthropology_8131639', '599');
    await handleResults(ICol, WS, 'edanmdm:nmnhanthropology_8135263', '600');
    await handleResults(ICol, WS, 'edanmdm:nmnhanthropology_8145707', '601');
    await handleResults(ICol, WS, 'edanmdm:nmnhanthropology_8146561', '602');
    await handleResults(ICol, WS, 'edanmdm:nmnhanthropology_8168564', '175');
    await handleResults(ICol, WS, 'edanmdm:nmnhanthropology_8319024', '654');
    await handleResults(ICol, WS, 'edanmdm:nmnhanthropology_8344757', '217');
    await handleResults(ICol, WS, 'edanmdm:nmnhanthropology_8358271', '672');
    await handleResults(ICol, WS, 'edanmdm:nmnhanthropology_8386869', '676');
    await handleResults(ICol, WS, 'edanmdm:nmnhanthropology_8440830', '212');
    await handleResults(ICol, WS, 'edanmdm:nmnhanthropology_8471498', '673');
    await handleResults(ICol, WS, 'edanmdm:nmnhanthropology_8480378', '674');
    await handleResults(ICol, WS, 'edanmdm:nmnhanthropology_8480424', '211');
    await handleResults(ICol, WS, 'edanmdm:nmnhanthropology_8552275', '664');
    await handleResults(ICol, WS, 'edanmdm:nmnhanthropology_8552277', '665');
    await handleResults(ICol, WS, 'edanmdm:nmnhanthropology_8552280', '666');
    await handleResults(ICol, WS, 'edanmdm:nmnhanthropology_8552281', '667');
    await handleResults(ICol, WS, 'edanmdm:nmnhanthropology_8939937', '705');
    await handleResults(ICol, WS, 'edanmdm:nmnheducation_11380100', '821');
    await handleResults(ICol, WS, 'edanmdm:nmnheducation_11380180', '793');
    await handleResults(ICol, WS, 'edanmdm:nmnheducation_11412946', '574');
    await handleResults(ICol, WS, 'edanmdm:nmnheducation_11413164', '794');
    await handleResults(ICol, WS, 'edanmdm:nmnheducation_15006160', '890');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_10041048', '230');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_10166790', '226');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_10197893', '699');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_10273681', '227');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_10530', '228');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_10703', '229');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_10795', '478');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_11009', '681');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_11042783', '241');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_11058167', '524');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_11162', '231');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_11277082', '657');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_11949', '232');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_12306', '573');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_12487', '235');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_13079', '236');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_13080', '237');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_13082', '238');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_13587547', '548');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_13935', '689');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_14138516', '704');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_14379', '239');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_14572', '694');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_14586', '693');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_14674', '240');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_14843', '498');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_14861', '695');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_15163', '690');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_15463', '244');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_16050', '692');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_16151', '691');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_16552', '245');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_17174', '246');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_17182', '247');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_17325', '248');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_17352', '249');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_17355', '250');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_17478', '251');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_17480', '688');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_17505', '252');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_17599', '253');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_17749', '254');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_17764', '12');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_18131', '607');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_22484', '257');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_22889', '606');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_28962', '816');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_29968', '655');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_30966', '258');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_31148', '259');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_323138', '273');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_36632', '260');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_38482', '261');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_42089', '262');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_44873', '541');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_45832', '263');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_45849', '264');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_46797', '265');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_48206', '266');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_48461', '267');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_51231', '787');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_53176', '776');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_536521', '815');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_55480', '268');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_55498', '686');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_61392', '269');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_62922', '270');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_62996', '271');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_65106', '272');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_65179', '687');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_79438', '804');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_810553', '680');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_821965', '806');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_9333269', '608');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_942321', '219');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_942505', '220');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_942916', '221');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_949688', '789');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_949712', '632');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_950401', '223');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_957075', '777');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_957085', '256');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_957944', '255');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_962463', '224');
    await handleResults(ICol, WS, 'edanmdm:nmnhinvertebratezoology_970701', '225');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_10016796', '851');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_10016797', '852');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_10016802', '853');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_10016803', '854');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_10016808', '855');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_10250729', '896');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_10369553', '67');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_10611715', '216');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_10611750', '193');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_11231535', '148');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_11467726', '830');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_11635207', '857');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_11825684', '136');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_11872942', '215');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_12307021', '833');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_12307068', '90');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_12307073', '843');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_12307093', '753');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_12307115', '92');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_12307176', '754');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_12307204', '669');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_12307212', '735');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_12307214', '756');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_12307233', '757');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_12307240', '23');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_12307243', '758');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3001151', '826');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3007346', '213');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3007506', '859');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3109802', '850');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3114250', '861');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3122122', '862');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3122141', '93');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3126953', '759');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3129300', '760');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3137102', '94');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3176889', '91');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3176892', '845');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3176902', '846');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3176903', '847');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3179870', '138');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3188143', '749');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3188192', '750');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3188200', '751');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3188809', '752');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3302876', '898');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3302895', '150');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3309799', '825');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3318324', '775');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3324894', '146');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3332832', '149');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3333940', '142');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3340244', '840');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3341924', '834');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3341937', '835');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3341954', '823');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3342215', '836');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3342697', '875');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3342978', '868');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3368445', '144');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3368446', '145');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3368531', '143');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3369538', '892');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3370783', '894');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3377843', '763');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3384611', '700');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3385086', '827');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3389255', '151');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3393299', '139');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3393300', '140');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3393301', '141');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3393407', '147');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3393409', '662');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3393470', '643');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3397958', '747');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3415628', '748');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3421187', '81');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3423820', '765');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3425397', '762');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3425518', '865');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3427467', '764');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3427676', '838');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3427760', '863');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3427936', '685');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3427971', '99');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3428171', '872');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3428214', '873');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3428388', '152');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3429219', '864');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3431464', '70');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3431469', '39');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3439417', '95');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3439470', '866');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3440470', '137');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3440721', '275');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3446186', '55');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3446197', '83');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3447044', '893');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3447759', '101');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3447777', '2');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3448898', '874');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3448991', '828');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3449928', '78');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3450090', '79');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3450091', '870');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3450092', '871');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3450132', '80');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3451037', '876');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3451097', '745');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3451166', '841');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3453577', '767');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3457273', '899');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3457297', '610');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3457406', '631');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3457407', '682');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3572783', '10');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3573298', '897');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3577488', '900');
    await handleResults(ICol, WS, 'edanmdm:nmnhpaleobiology_3580352', '895');
    await handleResults(ICol, WS, 'edanmdm:nmnhvz_4091696', '798');
    await handleResults(ICol, WS, 'edanmdm:nmnhvz_4092671', '658');
    await handleResults(ICol, WS, 'edanmdm:nmnhvz_4103596', '622');
    await handleResults(ICol, WS, 'edanmdm:nmnhvz_4103600', '628');
    await handleResults(ICol, WS, 'edanmdm:nmnhvz_4105734', '807');
    await handleResults(ICol, WS, 'edanmdm:nmnhvz_4113049', '701');
    await handleResults(ICol, WS, 'edanmdm:nmnhvz_4113270', '768');
    await handleResults(ICol, WS, 'edanmdm:nmnhvz_4113913', '810');
    await handleResults(ICol, WS, 'edanmdm:nmnhvz_4114243', '625');
    await handleResults(ICol, WS, 'edanmdm:nmnhvz_4114544', '611');
    await handleResults(ICol, WS, 'edanmdm:nmnhvz_4115950', '818');
    await handleResults(ICol, WS, 'edanmdm:nmnhvz_4119824', '801');
    await handleResults(ICol, WS, 'edanmdm:nmnhvz_4123288', '637');
    await handleResults(ICol, WS, 'edanmdm:nmnhvz_4123616', '696');
    await handleResults(ICol, WS, 'edanmdm:nmnhvz_4125718', '619');
    await handleResults(ICol, WS, 'edanmdm:nmnhvz_4175860', '778');
    await handleResults(ICol, WS, 'edanmdm:nmnhvz_4278661', '771');
    await handleResults(ICol, WS, 'edanmdm:nmnhvz_5036822', '222');
    await handleResults(ICol, WS, 'edanmdm:nmnhvz_5144419', '788');
    await handleResults(ICol, WS, 'edanmdm:nmnhvz_5148470', '233');
    await handleResults(ICol, WS, 'edanmdm:nmnhvz_5152704', '243');
    await handleResults(ICol, WS, 'edanmdm:nmnhvz_6341612', '677');
    await handleResults(ICol, WS, 'edanmdm:nmnhvz_7289628', '887');
    await handleResults(ICol, WS, 'edanmdm:nmnhvz_7413792', '87');
    await handleResults(ICol, WS, 'edanmdm:nmnhvz_7511097', '888');
    await handleResults(ICol, WS, 'edanmdm:nmnhvz_7511102', '889');
    await handleResults(ICol, WS, 'edanmdm:npg_NPG.2006.5', '160');
    await handleResults(ICol, WS, 'edanmdm:npg_NPG.2008.3', '40');
    await handleResults(ICol, WS, 'edanmdm:npg_NPG.70.4', '47');
    await handleResults(ICol, WS, 'edanmdm:npg_NPG.71.24', '41');
    await handleResults(ICol, WS, 'edanmdm:npg_NPG.71.26', '42');
    await handleResults(ICol, WS, 'edanmdm:npg_NPG.74.16', '43');
    await handleResults(ICol, WS, 'edanmdm:npg_NPG.75.16', '9');
    await handleResults(ICol, WS, 'edanmdm:npg_NPG.75.17', '8');
    await handleResults(ICol, WS, 'edanmdm:npg_NPG.76.27', '16');
    await handleResults(ICol, WS, 'edanmdm:npg_NPG.82.TC83', '161');
    await handleResults(ICol, WS, 'edanmdm:npg_NPG.85.8', '44');
    await handleResults(ICol, WS, 'edanmdm:npg_NPG.99.112', '45');
    await handleResults(ICol, WS, 'edanmdm:npg_S_NPG.71.6', '21');
    await handleResults(ICol, WS, 'edanmdm:npm_0.279483.3', '162');
    await handleResults(ICol, WS, 'edanmdm:ofeo-sg_2008-1264A', '66');
    await handleResults(ICol, WS, 'edanmdm:saam_1910.10.3', '46');
    await handleResults(ICol, WS, 'edanmdm:saam_1968.155.136', '64');
    await handleResults(ICol, WS, 'edanmdm:saam_1968.155.8', '17');
    await handleResults(ICol, WS, 'edanmdm:siris_sil_1044709', '164');
    await handleResults(ICol, WS, 'Eulaema Bee', '163');
    await handleResults(ICol, WS, 'ExhibitID-917', '675');
    await handleResults(ICol, WS, 'fedora lindbergh ', '366');
    await handleResults(ICol, WS, 'Fossil Whale MPC 677', '53');
    await handleResults(ICol, WS, 'Fossil Whale MPC 684', '71');
    await handleResults(ICol, WS, 'gongora', '879');
    await handleResults(ICol, WS, 'Grancino, Giovanni Vn SI', '492');
    await handleResults(ICol, WS, 'green helmet ', '368');
    await handleResults(ICol, WS, 'Guarneri del Gesu Vn \'Baron Vitta\' 1730 SIL LOC', '494');
    await handleResults(ICol, WS, 'Guarneri del Gesu Vn \'Kreisler\' 1732  LOC', '495');
    await handleResults(ICol, WS, 'Haw Mummy 454235', '679');
    await handleResults(ICol, WS, 'Hawkbill Turtle Taxidermy', '218');
    await handleResults(ICol, WS, 'helmet a', '369');
    await handleResults(ICol, WS, 'helmet type m1917 ', '370');
    await handleResults(ICol, WS, 'Honey Bee', '880');
    await handleResults(ICol, WS, 'http://n2t.net/ark:/65665/3c32276ea-e29b-49b7-b699-2a57a621b6e6', '663');
    await handleResults(ICol, WS, 'http://n2t.net/ark:/65665/3c34fa78d-02b8-4c1e-8a2a-2429ef6ab6a1', '824');
    await handleResults(ICol, WS, 'http://n2t.net/ark:/65665/3f2bb4beb-111e-441f-b7e4-e821bd4f1d9f', '86');
    await handleResults(ICol, WS, 'https://collection.cooperhewitt.org/objects/18726645/', '285');
    await handleResults(ICol, WS, 'Ibis Metal', '683');
    await handleResults(ICol, WS, 'Ibis Mummy', '684');
    await handleResults(ICol, WS, 'impeller unknown ', '372');
    await handleResults(ICol, WS, 'Ivory Tusk 2005-6-135', '400');
    await handleResults(ICol, WS, 'Ivory Tusk 72-33-14', '406');
    await handleResults(ICol, WS, 'Ivory Tusk 73-12-1', '407');
    await handleResults(ICol, WS, 'Jones Beaded Purse', '386');
    await handleResults(ICol, WS, 'JuJu Drumsticks', '387');
    await handleResults(ICol, WS, 'Kuduo Vessel', '388');
    await handleResults(ICol, WS, 'Leather Shoes', '389');
    await handleResults(ICol, WS, 'Library of Congress Ornament', '276');
    await handleResults(ICol, WS, 'lindbergh bank ', '373');
    await handleResults(ICol, WS, 'lycaste_aromatica', '881');
    await handleResults(ICol, WS, 'Mesa Redonda', '568');
    await handleResults(ICol, WS, 'Monticello Model', '390');
    await handleResults(ICol, WS, 'Mr Cox Mummy', '706');
    await handleResults(ICol, WS, 'Mr Jones Mummy', '707');
    await handleResults(ICol, WS, 'Ms Anni Mummy', '708');
    await handleResults(ICol, WS, 'Mummy A 126790', '709');
    await handleResults(ICol, WS, 'Mummy A 1564', '710');
    await handleResults(ICol, WS, 'Mummy A 1565', '711');
    await handleResults(ICol, WS, 'Mummy A 1566', '712');
    await handleResults(ICol, WS, 'Mummy A 278365', '713');
    await handleResults(ICol, WS, 'Mummy A 279283', '714');
    await handleResults(ICol, WS, 'Mummy A 279285', '715');
    await handleResults(ICol, WS, 'Mummy A 279286', '716');
    await handleResults(ICol, WS, 'Mummy A 279287', '717');
    await handleResults(ICol, WS, 'Mummy A 316508', '718');
    await handleResults(ICol, WS, 'Mummy A 381569', '719');
    await handleResults(ICol, WS, 'Mummy A 381570', '720');
    await handleResults(ICol, WS, 'Mummy A 381571', '721');
    await handleResults(ICol, WS, 'Mummy A 381572', '722');
    await handleResults(ICol, WS, 'Mummy A 435221', '723');
    await handleResults(ICol, WS, 'Mummy A 437431', '724');
    await handleResults(ICol, WS, 'Mummy A 454235', '725');
    await handleResults(ICol, WS, 'Mummy A 508142', '726');
    await handleResults(ICol, WS, 'Mummy A 528481-0', '727');
    await handleResults(ICol, WS, 'Mummy A 74579', '728');
    await handleResults(ICol, WS, 'Mummy A 74586', '729');
    await handleResults(ICol, WS, 'Mummy AT 5604', '730');
    await handleResults(ICol, WS, 'Mummy AT 5605', '731');
    await handleResults(ICol, WS, 'Mummy P 381235', '732');
    await handleResults(ICol, WS, 'Mummy S 39475', '733');
    await handleResults(ICol, WS, 'ndp-acrophoca', '734');
    await handleResults(ICol, WS, 'NMAH 20 dollar coin', '501');
    await handleResults(ICol, WS, 'NMAH Baseball Bat', '208');
    await handleResults(ICol, WS, 'NMAH bee pendant', '504');
    await handleResults(ICol, WS, 'NMAH Cornerstone', '505');
    await handleResults(ICol, WS, 'NMAH decadrachm', '506');
    await handleResults(ICol, WS, 'NMAH euro', '507');
    await handleResults(ICol, WS, 'NMAH tetradrachm', '508');
    await handleResults(ICol, WS, 'NMAH Vannevar Kiplinger Statue', '510');
    await handleResults(ICol, WS, 'NMNH Bonebed Analysis', '736');
    await handleResults(ICol, WS, 'NMNH Camptosaurus', '737');
    await handleResults(ICol, WS, 'NMNH Catfish', '738');
    await handleResults(ICol, WS, 'NMNH Chiton', '739');
    await handleResults(ICol, WS, 'NMNH Ichthyosaur', '740');
    await handleResults(ICol, WS, 'NMNH Jorge Fossil', '741');
    await handleResults(ICol, WS, 'NMNH Kennicott Bust', '742');
    await handleResults(ICol, WS, 'NMNH Kennicott Skull', '743');
    await handleResults(ICol, WS, 'NMNH OEC Tree (pella sp? tree)', '744');
    await handleResults(ICol, WS, 'nmnh-USNM_PAL_00095661', '746');
    await handleResults(ICol, WS, 'nmnh-USNM_S_0001170A', '761');
    await handleResults(ICol, WS, 'oxygen bottle ', '374');
    await handleResults(ICol, WS, 'Peresson, Sergio Va 1986 SI', '532');
    await handleResults(ICol, WS, 'Presidents of Christmas Past and Present Ornament', '277');
    await handleResults(ICol, WS, 'Raqchi Qolcas', '209');
    await handleResults(ICol, WS, 'rmh-1990_011', '781');
    await handleResults(ICol, WS, 'rmh-2002_277', '782');
    await handleResults(ICol, WS, 'rmh-2005_703', '783');
    await handleResults(ICol, WS, 'Sauropod Vertebra', '786');
    await handleResults(ICol, WS, 'Sculpin Hat - Original Model', '171');
    await handleResults(ICol, WS, 'Sculpin Hat - Repaired Model', '189');
    await handleResults(ICol, WS, 'shell mermaids comb', '790');
    await handleResults(ICol, WS, 'Sherwood Microfossil 116112', '791');
    await handleResults(ICol, WS, 'Sherwood Microfossil 401478', '792');
    await handleResults(ICol, WS, 'Sherwood Microfossil 402809', '796');
    await handleResults(ICol, WS, 'Sleigh on the White House Ornament', '278');
    await handleResults(ICol, WS, 'slipper_orchid', '882');
    await handleResults(ICol, WS, 'sloth (upright) articulated skeleton', '98');
    await handleResults(ICol, WS, 'Snake Mummy', '797');
    await handleResults(ICol, WS, 'Stainer, Jacob Va 1678 SIL', '537');
    await handleResults(ICol, WS, 'Stainer, Jacob Vn 1645 SIL', '539');
    await handleResults(ICol, WS, 'Stainer, Jacob Vn 1661 SIL', '540');
    await handleResults(ICol, WS, 'Stainer, Jacob Vn c1650 SI', '542');
    await handleResults(ICol, WS, 'Star of Bliss Ornament', '279');
    await handleResults(ICol, WS, 'Stegosaurus articulated skeleton', '805');
    await handleResults(ICol, WS, 'Stoneware Jug', '395');
    await handleResults(ICol, WS, 'Stoneware jug created by Thomas Commeraw', '923');
    await handleResults(ICol, WS, 'Stradivari C \'Castelbarco\' 1697 LOC', '543');
    await handleResults(ICol, WS, 'Stradivari Va \'Cassavetti\' 1727 LOC', '547');
    await handleResults(ICol, WS, 'Stradivari Vn \'Betts\' 1704 LOC', '550');
    await handleResults(ICol, WS, 'Stradivari Vn \'Castelbarco\' 1699 LOC', '551');
    await handleResults(ICol, WS, 'Stradivari Vn \'Hellier\' 1679 SIL', '553');
    await handleResults(ICol, WS, 'Stradivari Vn \'Sunrise\' 1677 SIL', '556');
    await handleResults(ICol, WS, 'Stradivari Vn \'Ward\' 1700 LOC', '559');
    await handleResults(ICol, WS, 'Talpanas 3Dpring Pelvis', '813');
    await handleResults(ICol, WS, 'Talpanas C10', '814');
    await handleResults(ICol, WS, 'Thomas Jefferson Statue', '397');
    await handleResults(ICol, WS, 'Tusk: 68-23-53', '204');
    await handleResults(ICol, WS, 'Tusk: 71-17-12', '205');
    await handleResults(ICol, WS, 'Tyrannosaurus rex (individual bones)', '817');
    await handleResults(ICol, WS, 'Unknown Bee 1', '883');
    await handleResults(ICol, WS, 'Unknown Bee 2', '884');
    await handleResults(ICol, WS, 'Unknown Bee 4', '885');
    await handleResults(ICol, WS, 'usnm_pal_222302', '822');
    await handleResults(ICol, WS, 'usnm-pal-27088', '832');
    await handleResults(ICol, WS, 'usnm-s-1170a', '860');
    await handleResults(ICol, WS, 'violoncello piccolo pegbox/head', '560');
    await handleResults(ICol, WS, 'Whale MPC 675', '82');
    await handleResults(ICol, WS, 'Winter Holiday Snowflake Ornament', '280');
    await handleResults(ICol, WS, 'Winter Wonderland of Innovation Ornament', '281');
    await handleResults(ICol, WS, 'Wright Bicycle', '378');
}
// #endregion

async function handleResults(ICol: COL.ICollection, WS: NodeJS.WritableStream | null, query: string, id: string,
    options?: COL.CollectionQueryOptions | undefined): Promise<boolean> {
    if (!options)
        options = { gatherRaw: true };

    for (let retry: number = 1; retry <= 5; retry++) {
        const results: COL.CollectionQueryResults | null = await ICol.queryCollection(query.trim(), 10, 0, options);
        // LOG.info(`*** Edan Scrape: ${H.Helpers.JSONStringify(results)}`, LOG.LS.eTEST);
        if (results) {
            if (results.error)
                LOG.info(`*** Edan Scrape [${id}] ERROR for '${query}': ${results.error}`, LOG.LS.eTEST);

            for (const record of results.records) {
                if (WS)
                    WS.write(`${id}\t${record.name.replace(/\r?\n|\r/g, ' ')}\t${record.unit}\t${record.identifierPublic}\t${record.identifierCollection}\t${results.records.length}\n`);
                    // WS.write(`${id}\t${record.name.replace(/\r?\n|\r/g, ' ')}\t${record.unit}\t${record.identifierPublic}\t${record.identifierCollection}\t${H.Helpers.JSONStringify(record.raw)}\n`);
                else
                    LOG.info(`EDAN Query(${query}): ${H.Helpers.JSONStringify(record)}`, LOG.LS.eTEST);
            }
            return true;
        }
    }
    LOG.error(`*** Edan Scrape [${id}] failed for '${query}'`, LOG.LS.eTEST);
    return false;
}

async function handle3DContentQuery(ICol: COL.ICollection, _WS: NodeJS.WritableStream | null,
    id: string | undefined, url: string | undefined, queryID: string): Promise<boolean> {
    for (let retry: number = 1; retry <= 5; retry++) {
        const edanRecord: COL.EdanRecord | null = await ICol.fetchContent(id, url);
        if (edanRecord) {
            LOG.info(`Content Query ${id ? id : ''}${url ? url : ''}: ${H.Helpers.JSONStringify(edanRecord)}`, LOG.LS.eTEST);
            const edan3DResources: COL.Edan3DResource[] | undefined = edanRecord?.content?.resources;
            if (edan3DResources) {
                for (const resource of edan3DResources)
                    LOG.info(`Content Query ${id ? id : ''}${url ? url : ''} resource: ${H.Helpers.JSONStringify(resource)}`, LOG.LS.eTEST);
            }
            return true;
        }
        if (retry < 5)
            await H.Helpers.sleep(2000); // wait and try again
    }
    LOG.error(`Content Query ${id ? id : ''}${url ? url : ''} [${queryID}] failed`, LOG.LS.eTEST);
    return false;
}

// #region SCRAPE 3D Packages
function executeFetch3DPackage(ICol: COL.ICollection): void {
    test('Collections: EdanCollection.Fetch3DPackage', async () => {
        await fetch3DPackage(ICol, 'b0bf6d44-af22-40dc-bd85-7d66255be4a7');
        await fetch3DPackage(ICol, 'ed99f44d-3c60-4111-b666-e2908e1b64ef');
        await fetch3DPackage(ICol, '341c96cd-f967-4540-8ed1-d3fc56d31f12');
        await fetch3DPackage(ICol, 'd8c62e5e-4ebc-11ea-b77f-2e728ce88125');
    });
}

async function fetch3DPackage(ICol: COL.ICollection, UUID: string): Promise<void> {
    await handle3DContentQuery(ICol, null, undefined, `3d_package:${UUID}`, UUID);
}
// #endregion