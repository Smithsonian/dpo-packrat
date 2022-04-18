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
    eRegressionSuite = 1,
    eScrapeDPO = 2,
    eScrapeMigration = 3,
    eScrapeEDAN = 4,
    eOneOff
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

export async function scrapeDPOMigrationMDM(ICol: COL.ICollection, fileName: string): Promise<void> {
    jest.setTimeout(1000 * 60 * 60);   // 1 hour

    const WS: NodeJS.WritableStream = await fs.createWriteStream(fileName, { 'flags': 'a' });
    if (!WS)
        LOG.info(`Unable to create writeStream for ${fileName}`, LOG.LS.eTEST);

    // let results: COL.CollectionQueryResults | null = null;
    handleResults(await ICol.queryCollection('edanmdm:nmah_1096762', 10, 0, { gatherRaw: true }), WS, '1');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3447777', 10, 0, { gatherRaw: true }), WS, '2');
    handleResults(await ICol.queryCollection('edanmdm:nasm_A19610048000', 10, 0, { gatherRaw: true }), WS, '3');
    handleResults(await ICol.queryCollection('edanmdm:nmaahc_2007.3.8.4ab', 10, 0, { gatherRaw: true }), WS, '4');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1961.33a-b', 10, 0, { gatherRaw: true }), WS, '5');
    handleResults(await ICol.queryCollection('edanmdm:nasm_A19700102000', 10, 0, { gatherRaw: true }), WS, '6');
    handleResults(await ICol.queryCollection('edanmdm:nasm_A19700102000', 10, 0, { gatherRaw: true }), WS, '7');
    handleResults(await ICol.queryCollection('edanmdm:npg_NPG.75.17', 10, 0, { gatherRaw: true }), WS, '8');
    handleResults(await ICol.queryCollection('edanmdm:npg_NPG.75.16', 10, 0, { gatherRaw: true }), WS, '9');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3572783', 10, 0, { gatherRaw: true }), WS, '10');
    handleResults(await ICol.queryCollection('edanmdm:nasm_A20120325000', 10, 0, { gatherRaw: true }), WS, '11');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_17764', 10, 0, { gatherRaw: true }), WS, '12');
    handleResults(await ICol.queryCollection('edanmdm:chndm_1924-6-1', 10, 0, { gatherRaw: true }), WS, '13');
    handleResults(await ICol.queryCollection('edanmdm:nasm_A19510007000', 10, 0, { gatherRaw: true }), WS, '14');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200015', 10, 0, { gatherRaw: true }), WS, '15');
    handleResults(await ICol.queryCollection('edanmdm:npg_NPG.76.27', 10, 0, { gatherRaw: true }), WS, '16');
    handleResults(await ICol.queryCollection('edanmdm:saam_1968.155.8', 10, 0, { gatherRaw: true }), WS, '17');
    handleResults(await ICol.queryCollection('edanmdm:nasm_A19791810000', 10, 0, { gatherRaw: true }), WS, '18');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1936.6a-b', 10, 0, { gatherRaw: true }), WS, '19');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1930.54a-b', 10, 0, { gatherRaw: true }), WS, '20');
    handleResults(await ICol.queryCollection('edanmdm:npg_S_NPG.71.6', 10, 0, { gatherRaw: true }), WS, '21');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1923.15', 10, 0, { gatherRaw: true }), WS, '22');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_12307240', 10, 0, { gatherRaw: true }), WS, '23');
    handleResults(await ICol.queryCollection('edanmdm:chndm_1938-58-1083', 10, 0, { gatherRaw: true }), WS, '24');
    handleResults(await ICol.queryCollection('edanmdm:chndm_1910-41-1', 10, 0, { gatherRaw: true }), WS, '25');
    handleResults(await ICol.queryCollection('edanmdm:chndm_1971-48-12', 10, 0, { gatherRaw: true }), WS, '26');
    handleResults(await ICol.queryCollection('edanmdm:chndm_2006-5-1', 10, 0, { gatherRaw: true }), WS, '27');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1916.345', 10, 0, { gatherRaw: true }), WS, '28');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1947.15a-b', 10, 0, { gatherRaw: true }), WS, '29');
    handleResults(await ICol.queryCollection('edanmdm:nasm_A19791810000', 10, 0, { gatherRaw: true }), WS, '30');
    handleResults(await ICol.queryCollection('edanmdm:nmaahc_2013.39.7', 10, 0, { gatherRaw: true }), WS, '31');
    handleResults(await ICol.queryCollection('edanmdm:nmaahc_2014.63.59', 10, 0, { gatherRaw: true }), WS, '32');
    handleResults(await ICol.queryCollection('edanmdm:nmah_703292', 10, 0, { gatherRaw: true }), WS, '33');
    handleResults(await ICol.queryCollection('edanmdm:nmah_703302', 10, 0, { gatherRaw: true }), WS, '34');
    handleResults(await ICol.queryCollection('edanmdm:nmah_703318', 10, 0, { gatherRaw: true }), WS, '35');
    handleResults(await ICol.queryCollection('edanmdm:nmah_705564', 10, 0, { gatherRaw: true }), WS, '36');
    handleResults(await ICol.queryCollection('edanmdm:nmah_703325', 10, 0, { gatherRaw: true }), WS, '37');
    handleResults(await ICol.queryCollection('edanmdm:nmah_712417', 10, 0, { gatherRaw: true }), WS, '38');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3431469', 10, 0, { gatherRaw: true }), WS, '39');
    handleResults(await ICol.queryCollection('edanmdm:npg_NPG.2008.3', 10, 0, { gatherRaw: true }), WS, '40');
    handleResults(await ICol.queryCollection('edanmdm:npg_NPG.71.24', 10, 0, { gatherRaw: true }), WS, '41');
    handleResults(await ICol.queryCollection('edanmdm:npg_NPG.71.26', 10, 0, { gatherRaw: true }), WS, '42');
    handleResults(await ICol.queryCollection('edanmdm:npg_NPG.74.16', 10, 0, { gatherRaw: true }), WS, '43');
    handleResults(await ICol.queryCollection('edanmdm:npg_NPG.85.8', 10, 0, { gatherRaw: true }), WS, '44');
    handleResults(await ICol.queryCollection('edanmdm:npg_NPG.99.112', 10, 0, { gatherRaw: true }), WS, '45');
    handleResults(await ICol.queryCollection('edanmdm:saam_1910.10.3', 10, 0, { gatherRaw: true }), WS, '46');
    handleResults(await ICol.queryCollection('edanmdm:npg_NPG.70.4', 10, 0, { gatherRaw: true }), WS, '47');
    handleResults(await ICol.queryCollection('edanmdm:nmaahc_2011.163.8ab', 10, 0, { gatherRaw: true }), WS, '48');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1980.192a-c', 10, 0, { gatherRaw: true }), WS, '49');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1980.191a-c', 10, 0, { gatherRaw: true }), WS, '50');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1980.194a-b', 10, 0, { gatherRaw: true }), WS, '51');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1980.193a-b', 10, 0, { gatherRaw: true }), WS, '52');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200012', 10, 0, { gatherRaw: true }), WS, '54');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3446186', 10, 0, { gatherRaw: true }), WS, '55');
    handleResults(await ICol.queryCollection('edanmdm:chndm_1959-144-1', 10, 0, { gatherRaw: true }), WS, '56');
    handleResults(await ICol.queryCollection('edanmdm:nmaahc_2012.113.2', 10, 0, { gatherRaw: true }), WS, '57');
    handleResults(await ICol.queryCollection('edanmdm:nmaahc_2011.159.6', 10, 0, { gatherRaw: true }), WS, '58');
    handleResults(await ICol.queryCollection('edanmdm:nmaahc_2013.141.1', 10, 0, { gatherRaw: true }), WS, '59');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200018', 10, 0, { gatherRaw: true }), WS, '60');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200019', 10, 0, { gatherRaw: true }), WS, '61');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200016', 10, 0, { gatherRaw: true }), WS, '62');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200017', 10, 0, { gatherRaw: true }), WS, '63');
    handleResults(await ICol.queryCollection('edanmdm:saam_1968.155.136', 10, 0, { gatherRaw: true }), WS, '64');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200038', 10, 0, { gatherRaw: true }), WS, '65');
    handleResults(await ICol.queryCollection('edanmdm:ofeo-sg_2008-1264A', 10, 0, { gatherRaw: true }), WS, '66');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_10369553', 10, 0, { gatherRaw: true }), WS, '67');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_10369553', 10, 0, { gatherRaw: true }), WS, '68');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_10369553', 10, 0, { gatherRaw: true }), WS, '69');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3431464', 10, 0, { gatherRaw: true }), WS, '70');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200020', 10, 0, { gatherRaw: true }), WS, '72');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3449928', 10, 0, { gatherRaw: true }), WS, '78');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3450090', 10, 0, { gatherRaw: true }), WS, '79');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3450132', 10, 0, { gatherRaw: true }), WS, '80');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3421187', 10, 0, { gatherRaw: true }), WS, '81');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3446197', 10, 0, { gatherRaw: true }), WS, '83');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3446197', 10, 0, { gatherRaw: true }), WS, '84');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3446197', 10, 0, { gatherRaw: true }), WS, '85');
    handleResults(await ICol.queryCollection('edanmdm:nmnhvz_7413792', 10, 0, { gatherRaw: true }), WS, '87');
    handleResults(await ICol.queryCollection('edanmdm:npg_NPG.71.24', 10, 0, { gatherRaw: true }), WS, '88');
    handleResults(await ICol.queryCollection('edanmdm:npg_NPG.71.26', 10, 0, { gatherRaw: true }), WS, '89');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_12307068', 10, 0, { gatherRaw: true }), WS, '90');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3176889', 10, 0, { gatherRaw: true }), WS, '91');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_12307115', 10, 0, { gatherRaw: true }), WS, '92');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3122141', 10, 0, { gatherRaw: true }), WS, '93');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3137102', 10, 0, { gatherRaw: true }), WS, '94');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3439417', 10, 0, { gatherRaw: true }), WS, '95');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1915.109', 10, 0, { gatherRaw: true }), WS, '96');
    handleResults(await ICol.queryCollection('edanmdm:nasm_A19280021000', 10, 0, { gatherRaw: true }), WS, '97');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3427971', 10, 0, { gatherRaw: true }), WS, '99');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3447759', 10, 0, { gatherRaw: true }), WS, '101');
    handleResults(await ICol.queryCollection('edanmdm:nasm_A19730040000', 10, 0, { gatherRaw: true }), WS, '102');
    handleResults(await ICol.queryCollection('edanmdm:nasm_A19730040001', 10, 0, { gatherRaw: true }), WS, '103');
    handleResults(await ICol.queryCollection('edanmdm:nasm_A19730040002', 10, 0, { gatherRaw: true }), WS, '104');
    handleResults(await ICol.queryCollection('edanmdm:nasm_A19730040003', 10, 0, { gatherRaw: true }), WS, '105');
    handleResults(await ICol.queryCollection('edanmdm:nmaahc_2007.5.1ab', 10, 0, { gatherRaw: true }), WS, '106');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200036', 10, 0, { gatherRaw: true }), WS, '107');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200034', 10, 0, { gatherRaw: true }), WS, '108');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1978.40', 10, 0, { gatherRaw: true }), WS, '109');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1982.19a-b', 10, 0, { gatherRaw: true }), WS, '110');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1991.48a-b', 10, 0, { gatherRaw: true }), WS, '111');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1992.13.2', 10, 0, { gatherRaw: true }), WS, '112');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1992.3', 10, 0, { gatherRaw: true }), WS, '113');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1908.236', 10, 0, { gatherRaw: true }), WS, '114');
    handleResults(await ICol.queryCollection('edanmdm:nmah_689864', 10, 0, { gatherRaw: true }), WS, '115');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1837459', 10, 0, { gatherRaw: true }), WS, '116');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1838676', 10, 0, { gatherRaw: true }), WS, '117');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1843368', 10, 0, { gatherRaw: true }), WS, '118');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1846281', 10, 0, { gatherRaw: true }), WS, '119');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1816008', 10, 0, { gatherRaw: true }), WS, '120');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1850922', 10, 0, { gatherRaw: true }), WS, '121');
    handleResults(await ICol.queryCollection('edanmdm:nmah_920560', 10, 0, { gatherRaw: true }), WS, '122');
    handleResults(await ICol.queryCollection('edanmdm:nmah_923135', 10, 0, { gatherRaw: true }), WS, '123');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1845461', 10, 0, { gatherRaw: true }), WS, '124');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200029', 10, 0, { gatherRaw: true }), WS, '125');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200028', 10, 0, { gatherRaw: true }), WS, '126');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200004', 10, 0, { gatherRaw: true }), WS, '127');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200005', 10, 0, { gatherRaw: true }), WS, '128');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200004', 10, 0, { gatherRaw: true }), WS, '129');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200008', 10, 0, { gatherRaw: true }), WS, '130');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200001', 10, 0, { gatherRaw: true }), WS, '131');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200002', 10, 0, { gatherRaw: true }), WS, '132');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200003', 10, 0, { gatherRaw: true }), WS, '133');
    handleResults(await ICol.queryCollection('edanmdm:nmnhanthropology_8061963', 10, 0, { gatherRaw: true }), WS, '134');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200014', 10, 0, { gatherRaw: true }), WS, '135');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_11825684', 10, 0, { gatherRaw: true }), WS, '136');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3440470', 10, 0, { gatherRaw: true }), WS, '137');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3179870', 10, 0, { gatherRaw: true }), WS, '138');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3393299', 10, 0, { gatherRaw: true }), WS, '139');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3393300', 10, 0, { gatherRaw: true }), WS, '140');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3393301', 10, 0, { gatherRaw: true }), WS, '141');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3333940', 10, 0, { gatherRaw: true }), WS, '142');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3368531', 10, 0, { gatherRaw: true }), WS, '143');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3368445', 10, 0, { gatherRaw: true }), WS, '144');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3368446', 10, 0, { gatherRaw: true }), WS, '145');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3324894', 10, 0, { gatherRaw: true }), WS, '146');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3393407', 10, 0, { gatherRaw: true }), WS, '147');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_11231535', 10, 0, { gatherRaw: true }), WS, '148');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3332832', 10, 0, { gatherRaw: true }), WS, '149');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3302895', 10, 0, { gatherRaw: true }), WS, '150');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3389255', 10, 0, { gatherRaw: true }), WS, '151');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3428388', 10, 0, { gatherRaw: true }), WS, '152');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3428388', 10, 0, { gatherRaw: true }), WS, '153');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200026', 10, 0, { gatherRaw: true }), WS, '154');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200026', 10, 0, { gatherRaw: true }), WS, '155');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200021', 10, 0, { gatherRaw: true }), WS, '156');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200021', 10, 0, { gatherRaw: true }), WS, '157');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200023', 10, 0, { gatherRaw: true }), WS, '158');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200023', 10, 0, { gatherRaw: true }), WS, '159');
    handleResults(await ICol.queryCollection('edanmdm:npg_NPG.2006.5', 10, 0, { gatherRaw: true }), WS, '160');
    handleResults(await ICol.queryCollection('edanmdm:npg_NPG.82.TC83', 10, 0, { gatherRaw: true }), WS, '161');
    handleResults(await ICol.queryCollection('edanmdm:npm_0.279483.3', 10, 0, { gatherRaw: true }), WS, '162');
    handleResults(await ICol.queryCollection('edanmdm:siris_sil_1044709', 10, 0, { gatherRaw: true }), WS, '164');
    handleResults(await ICol.queryCollection('edanmdm:nmah_463506', 10, 0, { gatherRaw: true }), WS, '165');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200032', 10, 0, { gatherRaw: true }), WS, '166');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200031', 10, 0, { gatherRaw: true }), WS, '167');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200033', 10, 0, { gatherRaw: true }), WS, '168');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200010', 10, 0, { gatherRaw: true }), WS, '169');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200006', 10, 0, { gatherRaw: true }), WS, '172');
    handleResults(await ICol.queryCollection('edanmdm:nmnhanthropology_8168564', 10, 0, { gatherRaw: true }), WS, '175');
    handleResults(await ICol.queryCollection('edanmdm:nmaahc_2011.128.2ab', 10, 0, { gatherRaw: true }), WS, '176');
    handleResults(await ICol.queryCollection('edanmdm:nmah_920740', 10, 0, { gatherRaw: true }), WS, '177');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1838349', 10, 0, { gatherRaw: true }), WS, '178');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1848079', 10, 0, { gatherRaw: true }), WS, '179');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1846271', 10, 0, { gatherRaw: true }), WS, '180');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1846344', 10, 0, { gatherRaw: true }), WS, '181');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1846388', 10, 0, { gatherRaw: true }), WS, '182');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1828839', 10, 0, { gatherRaw: true }), WS, '183');
    handleResults(await ICol.queryCollection('edanmdm:nmah_911374', 10, 0, { gatherRaw: true }), WS, '184');
    handleResults(await ICol.queryCollection('edanmdm:nmah_923122', 10, 0, { gatherRaw: true }), WS, '185');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1820223', 10, 0, { gatherRaw: true }), WS, '186');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1272680', 10, 0, { gatherRaw: true }), WS, '187');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200013', 10, 0, { gatherRaw: true }), WS, '190');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_10611750', 10, 0, { gatherRaw: true }), WS, '193');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1982.17', 10, 0, { gatherRaw: true }), WS, '195');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1986.19a-b', 10, 0, { gatherRaw: true }), WS, '196');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1994.26.1', 10, 0, { gatherRaw: true }), WS, '197');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F2004.37.1a-c', 10, 0, { gatherRaw: true }), WS, '198');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1921.1', 10, 0, { gatherRaw: true }), WS, '199');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1921.2', 10, 0, { gatherRaw: true }), WS, '200');
    handleResults(await ICol.queryCollection('edanmdm:nmaahc_2015.2.4', 10, 0, { gatherRaw: true }), WS, '202');
    handleResults(await ICol.queryCollection('edanmdm:nmaahc_2015.247.3', 10, 0, { gatherRaw: true }), WS, '203');
    handleResults(await ICol.queryCollection('edanmdm:nmnhanthropology_8010270', 10, 0, { gatherRaw: true }), WS, '210');
    handleResults(await ICol.queryCollection('edanmdm:nmnhanthropology_8480424', 10, 0, { gatherRaw: true }), WS, '211');
    handleResults(await ICol.queryCollection('edanmdm:nmnhanthropology_8440830', 10, 0, { gatherRaw: true }), WS, '212');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3007346', 10, 0, { gatherRaw: true }), WS, '213');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_12307240', 10, 0, { gatherRaw: true }), WS, '214');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_11872942', 10, 0, { gatherRaw: true }), WS, '215');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_10611715', 10, 0, { gatherRaw: true }), WS, '216');
    handleResults(await ICol.queryCollection('edanmdm:nmnhanthropology_8344757', 10, 0, { gatherRaw: true }), WS, '217');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_942321', 10, 0, { gatherRaw: true }), WS, '219');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_942505', 10, 0, { gatherRaw: true }), WS, '220');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_942916', 10, 0, { gatherRaw: true }), WS, '221');
    handleResults(await ICol.queryCollection('edanmdm:nmnhvz_5036822', 10, 0, { gatherRaw: true }), WS, '222');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_950401', 10, 0, { gatherRaw: true }), WS, '223');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_962463', 10, 0, { gatherRaw: true }), WS, '224');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_970701', 10, 0, { gatherRaw: true }), WS, '225');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_10166790', 10, 0, { gatherRaw: true }), WS, '226');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_10273681', 10, 0, { gatherRaw: true }), WS, '227');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_10530', 10, 0, { gatherRaw: true }), WS, '228');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_10703', 10, 0, { gatherRaw: true }), WS, '229');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_10041048', 10, 0, { gatherRaw: true }), WS, '230');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_11162', 10, 0, { gatherRaw: true }), WS, '231');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_11949', 10, 0, { gatherRaw: true }), WS, '232');
    handleResults(await ICol.queryCollection('edanmdm:nmnhvz_5148470', 10, 0, { gatherRaw: true }), WS, '233');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_12487', 10, 0, { gatherRaw: true }), WS, '235');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_13079', 10, 0, { gatherRaw: true }), WS, '236');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_13080', 10, 0, { gatherRaw: true }), WS, '237');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_13082', 10, 0, { gatherRaw: true }), WS, '238');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_14379', 10, 0, { gatherRaw: true }), WS, '239');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_14674', 10, 0, { gatherRaw: true }), WS, '240');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_11042783', 10, 0, { gatherRaw: true }), WS, '241');
    handleResults(await ICol.queryCollection('edanmdm:nmnhvz_5152704', 10, 0, { gatherRaw: true }), WS, '243');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_15463', 10, 0, { gatherRaw: true }), WS, '244');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_16552', 10, 0, { gatherRaw: true }), WS, '245');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_17174', 10, 0, { gatherRaw: true }), WS, '246');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_17182', 10, 0, { gatherRaw: true }), WS, '247');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_17325', 10, 0, { gatherRaw: true }), WS, '248');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_17352', 10, 0, { gatherRaw: true }), WS, '249');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_17355', 10, 0, { gatherRaw: true }), WS, '250');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_17478', 10, 0, { gatherRaw: true }), WS, '251');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_17505', 10, 0, { gatherRaw: true }), WS, '252');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_17599', 10, 0, { gatherRaw: true }), WS, '253');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_17749', 10, 0, { gatherRaw: true }), WS, '254');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_957944', 10, 0, { gatherRaw: true }), WS, '255');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_957085', 10, 0, { gatherRaw: true }), WS, '256');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_22484', 10, 0, { gatherRaw: true }), WS, '257');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_30966', 10, 0, { gatherRaw: true }), WS, '258');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_31148', 10, 0, { gatherRaw: true }), WS, '259');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_36632', 10, 0, { gatherRaw: true }), WS, '260');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_38482', 10, 0, { gatherRaw: true }), WS, '261');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_42089', 10, 0, { gatherRaw: true }), WS, '262');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_45832', 10, 0, { gatherRaw: true }), WS, '263');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_45849', 10, 0, { gatherRaw: true }), WS, '264');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_46797', 10, 0, { gatherRaw: true }), WS, '265');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_48206', 10, 0, { gatherRaw: true }), WS, '266');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_48461', 10, 0, { gatherRaw: true }), WS, '267');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_55480', 10, 0, { gatherRaw: true }), WS, '268');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_61392', 10, 0, { gatherRaw: true }), WS, '269');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_62922', 10, 0, { gatherRaw: true }), WS, '270');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_62996', 10, 0, { gatherRaw: true }), WS, '271');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_65106', 10, 0, { gatherRaw: true }), WS, '272');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_323138', 10, 0, { gatherRaw: true }), WS, '273');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3427971', 10, 0, { gatherRaw: true }), WS, '274');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3440721', 10, 0, { gatherRaw: true }), WS, '275');
    handleResults(await ICol.queryCollection('edanmdm:chndm_1910-12-1', 10, 0, { gatherRaw: true }), WS, '282');
    handleResults(await ICol.queryCollection('edanmdm:chndm_2011-28-1', 10, 0, { gatherRaw: true }), WS, '283');
    handleResults(await ICol.queryCollection('edanmdm:chndm_1913-45-9-a_b', 10, 0, { gatherRaw: true }), WS, '284');
    handleResults(await ICol.queryCollection('edanmdm:chndm_1949-64-7', 10, 0, { gatherRaw: true }), WS, '286');
    handleResults(await ICol.queryCollection('edanmdm:chndm_1916-19-83-a_b', 10, 0, { gatherRaw: true }), WS, '287');
    handleResults(await ICol.queryCollection('edanmdm:chndm_1985-103-50', 10, 0, { gatherRaw: true }), WS, '288');
    handleResults(await ICol.queryCollection('edanmdm:chndm_1985-103-81', 10, 0, { gatherRaw: true }), WS, '289');
    handleResults(await ICol.queryCollection('edanmdm:chndm_1985-103-52', 10, 0, { gatherRaw: true }), WS, '290');
    handleResults(await ICol.queryCollection('edanmdm:chndm_1985-103-51', 10, 0, { gatherRaw: true }), WS, '291');
    handleResults(await ICol.queryCollection('edanmdm:chndm_1985-103-49', 10, 0, { gatherRaw: true }), WS, '292');
    handleResults(await ICol.queryCollection('edanmdm:chndm_2003-3-1', 10, 0, { gatherRaw: true }), WS, '293');
    handleResults(await ICol.queryCollection('edanmdm:chndm_1994-73-2', 10, 0, { gatherRaw: true }), WS, '294');
    handleResults(await ICol.queryCollection('edanmdm:chndm_1907-1-40', 10, 0, { gatherRaw: true }), WS, '295');
    handleResults(await ICol.queryCollection('edanmdm:chndm_1972-79-2', 10, 0, { gatherRaw: true }), WS, '296');
    handleResults(await ICol.queryCollection('edanmdm:chndm_1984-84-36', 10, 0, { gatherRaw: true }), WS, '297');
    handleResults(await ICol.queryCollection('edanmdm:chndm_2007-45-13', 10, 0, { gatherRaw: true }), WS, '298');
    handleResults(await ICol.queryCollection('edanmdm:chndm_1931-48-73', 10, 0, { gatherRaw: true }), WS, '299');
    handleResults(await ICol.queryCollection('edanmdm:chndm_1962-67-1', 10, 0, { gatherRaw: true }), WS, '300');
    handleResults(await ICol.queryCollection('edanmdm:chndm_2011-31-1', 10, 0, { gatherRaw: true }), WS, '301');
    handleResults(await ICol.queryCollection('edanmdm:chndm_1985-103-82', 10, 0, { gatherRaw: true }), WS, '302');
    handleResults(await ICol.queryCollection('edanmdm:chndm_2007-45-14', 10, 0, { gatherRaw: true }), WS, '303');
    handleResults(await ICol.queryCollection('edanmdm:chndm_1938-57-306-a_b', 10, 0, { gatherRaw: true }), WS, '304');
    handleResults(await ICol.queryCollection('edanmdm:chndm_1990-133-3', 10, 0, { gatherRaw: true }), WS, '305');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1995.3.2a-b', 10, 0, { gatherRaw: true }), WS, '306');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1980.14a-c', 10, 0, { gatherRaw: true }), WS, '307');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1992.47.1', 10, 0, { gatherRaw: true }), WS, '308');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1992.47.2', 10, 0, { gatherRaw: true }), WS, '309');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1992.27.1', 10, 0, { gatherRaw: true }), WS, '310');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1992.27.2', 10, 0, { gatherRaw: true }), WS, '311');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1982.15a-c', 10, 0, { gatherRaw: true }), WS, '312');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1989.1', 10, 0, { gatherRaw: true }), WS, '313');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1992.33', 10, 0, { gatherRaw: true }), WS, '314');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1982.18a-b', 10, 0, { gatherRaw: true }), WS, '315');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1982.20a-b', 10, 0, { gatherRaw: true }), WS, '316');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1991.49', 10, 0, { gatherRaw: true }), WS, '317');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1991.50', 10, 0, { gatherRaw: true }), WS, '318');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1994.26.2', 10, 0, { gatherRaw: true }), WS, '319');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F2002.10.1', 10, 0, { gatherRaw: true }), WS, '320');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F2002.10.2', 10, 0, { gatherRaw: true }), WS, '321');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1992.6', 10, 0, { gatherRaw: true }), WS, '322');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1992.7', 10, 0, { gatherRaw: true }), WS, '323');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1992.34.1', 10, 0, { gatherRaw: true }), WS, '324');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1992.34.2', 10, 0, { gatherRaw: true }), WS, '325');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1992.48.2', 10, 0, { gatherRaw: true }), WS, '326');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1992.48.1', 10, 0, { gatherRaw: true }), WS, '327');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1992.25', 10, 0, { gatherRaw: true }), WS, '328');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1986.20a-b', 10, 0, { gatherRaw: true }), WS, '329');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1986.21a-c', 10, 0, { gatherRaw: true }), WS, '330');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1993.10a-b', 10, 0, { gatherRaw: true }), WS, '331');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1992.47.3a-b', 10, 0, { gatherRaw: true }), WS, '332');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1992.47.4a-c', 10, 0, { gatherRaw: true }), WS, '333');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1992.47.5a-b', 10, 0, { gatherRaw: true }), WS, '334');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1992.11a-b', 10, 0, { gatherRaw: true }), WS, '335');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1992.10a-b', 10, 0, { gatherRaw: true }), WS, '336');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1992.14a-b', 10, 0, { gatherRaw: true }), WS, '337');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F2004.37.2a-c', 10, 0, { gatherRaw: true }), WS, '338');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1991.58', 10, 0, { gatherRaw: true }), WS, '339');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1992.15.1', 10, 0, { gatherRaw: true }), WS, '340');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1982.16a-b', 10, 0, { gatherRaw: true }), WS, '341');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1991.46', 10, 0, { gatherRaw: true }), WS, '342');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1991.51', 10, 0, { gatherRaw: true }), WS, '343');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1991.61a-b', 10, 0, { gatherRaw: true }), WS, '344');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1991.62', 10, 0, { gatherRaw: true }), WS, '345');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1992.46', 10, 0, { gatherRaw: true }), WS, '346');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1993.7.1', 10, 0, { gatherRaw: true }), WS, '347');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1993.7.2', 10, 0, { gatherRaw: true }), WS, '348');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1986.4a-b', 10, 0, { gatherRaw: true }), WS, '349');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1992.56', 10, 0, { gatherRaw: true }), WS, '350');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1982.21a-b', 10, 0, { gatherRaw: true }), WS, '351');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1982.22a-b', 10, 0, { gatherRaw: true }), WS, '352');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1991.59', 10, 0, { gatherRaw: true }), WS, '353');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1991.60', 10, 0, { gatherRaw: true }), WS, '354');
    handleResults(await ICol.queryCollection('edanmdm:fsg_F1992.13.1', 10, 0, { gatherRaw: true }), WS, '355');
    handleResults(await ICol.queryCollection('edanmdm:hmsg_93.6', 10, 0, { gatherRaw: true }), WS, '356');
    handleResults(await ICol.queryCollection('edanmdm:hmsg_01.9', 10, 0, { gatherRaw: true }), WS, '357');
    handleResults(await ICol.queryCollection('edanmdm:hmsg_66.3867', 10, 0, { gatherRaw: true }), WS, '358');
    handleResults(await ICol.queryCollection('edanmdm:hmsg_94.13', 10, 0, { gatherRaw: true }), WS, '359');
    handleResults(await ICol.queryCollection('edanmdm:hmsg_06.15', 10, 0, { gatherRaw: true }), WS, '360');
    handleResults(await ICol.queryCollection('edanmdm:nasm_A20110028000', 10, 0, { gatherRaw: true }), WS, '365');
    handleResults(await ICol.queryCollection('edanmdm:nasm_A19330055000', 10, 0, { gatherRaw: true }), WS, '367');
    handleResults(await ICol.queryCollection('edanmdm:nasm_A19330035008', 10, 0, { gatherRaw: true }), WS, '375');
    handleResults(await ICol.queryCollection('edanmdm:nasm_A20050459000', 10, 0, { gatherRaw: true }), WS, '376');
    handleResults(await ICol.queryCollection('edanmdm:nasm_A19850354000', 10, 0, { gatherRaw: true }), WS, '377');
    handleResults(await ICol.queryCollection('edanmdm:nasm_A19540108000', 10, 0, { gatherRaw: true }), WS, '379');
    handleResults(await ICol.queryCollection('edanmdm:nmaahc_2014.210.3', 10, 0, { gatherRaw: true }), WS, '380');
    handleResults(await ICol.queryCollection('edanmdm:nmaahc_2011.46.1', 10, 0, { gatherRaw: true }), WS, '384');
    handleResults(await ICol.queryCollection('edanmdm:nmaahc_2014.2ab', 10, 0, { gatherRaw: true }), WS, '385');
    handleResults(await ICol.queryCollection('edanmdm:nmaahc_2011.143.3.2ab', 10, 0, { gatherRaw: true }), WS, '391');
    handleResults(await ICol.queryCollection('edanmdm:nmaahc_2010.19.3', 10, 0, { gatherRaw: true }), WS, '392');
    handleResults(await ICol.queryCollection('edanmdm:nmaahc_2011.51.3', 10, 0, { gatherRaw: true }), WS, '393');
    handleResults(await ICol.queryCollection('edanmdm:nmaahc_2015.115.1ab', 10, 0, { gatherRaw: true }), WS, '394');
    handleResults(await ICol.queryCollection('edanmdm:nmaahc_2016.152.2', 10, 0, { gatherRaw: true }), WS, '396');
    handleResults(await ICol.queryCollection('edanmdm:nmaahc_2014.46.5ab', 10, 0, { gatherRaw: true }), WS, '398');
    handleResults(await ICol.queryCollection('edanmdm:nmaahc_2011.118.4ab', 10, 0, { gatherRaw: true }), WS, '399');
    handleResults(await ICol.queryCollection('edanmdm:nmafa_2005-6-17', 10, 0, { gatherRaw: true }), WS, '401');
    handleResults(await ICol.queryCollection('edanmdm:nmafa_2005-6-9', 10, 0, { gatherRaw: true }), WS, '402');
    handleResults(await ICol.queryCollection('edanmdm:nmafa_2007-1-1', 10, 0, { gatherRaw: true }), WS, '403');
    handleResults(await ICol.queryCollection('edanmdm:nmafa_2007-1-2', 10, 0, { gatherRaw: true }), WS, '404');
    handleResults(await ICol.queryCollection('edanmdm:nmafa_2007-1-3', 10, 0, { gatherRaw: true }), WS, '405');
    handleResults(await ICol.queryCollection('edanmdm:nmafa_74-20-1', 10, 0, { gatherRaw: true }), WS, '408');
    handleResults(await ICol.queryCollection('edanmdm:nmafa_74-20-1', 10, 0, { gatherRaw: true }), WS, '409');
    handleResults(await ICol.queryCollection('edanmdm:nmafa_74-20-1', 10, 0, { gatherRaw: true }), WS, '410');
    handleResults(await ICol.queryCollection('edanmdm:nmafa_74-20-2', 10, 0, { gatherRaw: true }), WS, '411');
    handleResults(await ICol.queryCollection('edanmdm:nmafa_74-20-2', 10, 0, { gatherRaw: true }), WS, '412');
    handleResults(await ICol.queryCollection('edanmdm:nmafa_74-20-2', 10, 0, { gatherRaw: true }), WS, '413');
    handleResults(await ICol.queryCollection('edanmdm:nmafa_79-16-47', 10, 0, { gatherRaw: true }), WS, '414');
    handleResults(await ICol.queryCollection('edanmdm:nmafa_96-28-1', 10, 0, { gatherRaw: true }), WS, '415');
    handleResults(await ICol.queryCollection('edanmdm:nmafa_96-30-1', 10, 0, { gatherRaw: true }), WS, '416');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1251889', 10, 0, { gatherRaw: true }), WS, '418');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1846391', 10, 0, { gatherRaw: true }), WS, '419');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1832532', 10, 0, { gatherRaw: true }), WS, '421');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1837609', 10, 0, { gatherRaw: true }), WS, '422');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1837621', 10, 0, { gatherRaw: true }), WS, '423');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1838643', 10, 0, { gatherRaw: true }), WS, '424');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1838644', 10, 0, { gatherRaw: true }), WS, '425');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1838650', 10, 0, { gatherRaw: true }), WS, '426');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1838652', 10, 0, { gatherRaw: true }), WS, '427');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1847873', 10, 0, { gatherRaw: true }), WS, '428');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1846255', 10, 0, { gatherRaw: true }), WS, '431');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1846377', 10, 0, { gatherRaw: true }), WS, '432');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1849265', 10, 0, { gatherRaw: true }), WS, '433');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1251903', 10, 0, { gatherRaw: true }), WS, '435');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1828021', 10, 0, { gatherRaw: true }), WS, '436');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1828030', 10, 0, { gatherRaw: true }), WS, '437');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1828078', 10, 0, { gatherRaw: true }), WS, '438');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1828119', 10, 0, { gatherRaw: true }), WS, '439');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1827973', 10, 0, { gatherRaw: true }), WS, '440');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1828170', 10, 0, { gatherRaw: true }), WS, '441');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1828269', 10, 0, { gatherRaw: true }), WS, '442');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1828429', 10, 0, { gatherRaw: true }), WS, '443');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1827978', 10, 0, { gatherRaw: true }), WS, '444');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1828505', 10, 0, { gatherRaw: true }), WS, '445');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1828510', 10, 0, { gatherRaw: true }), WS, '446');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1828628', 10, 0, { gatherRaw: true }), WS, '447');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1828648', 10, 0, { gatherRaw: true }), WS, '448');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1828842', 10, 0, { gatherRaw: true }), WS, '449');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1816726', 10, 0, { gatherRaw: true }), WS, '450');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1816728', 10, 0, { gatherRaw: true }), WS, '451');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1819662', 10, 0, { gatherRaw: true }), WS, '452');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1841912', 10, 0, { gatherRaw: true }), WS, '453');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1841933', 10, 0, { gatherRaw: true }), WS, '454');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1842503', 10, 0, { gatherRaw: true }), WS, '455');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1849041', 10, 0, { gatherRaw: true }), WS, '456');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1851521', 10, 0, { gatherRaw: true }), WS, '457');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1816562', 10, 0, { gatherRaw: true }), WS, '458');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1821317', 10, 0, { gatherRaw: true }), WS, '459');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1822363', 10, 0, { gatherRaw: true }), WS, '460');
    handleResults(await ICol.queryCollection('edanmdm:nmah_911375', 10, 0, { gatherRaw: true }), WS, '461');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1818990', 10, 0, { gatherRaw: true }), WS, '462');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1820541', 10, 0, { gatherRaw: true }), WS, '463');
    handleResults(await ICol.queryCollection('edanmdm:nmah_923037', 10, 0, { gatherRaw: true }), WS, '465');
    handleResults(await ICol.queryCollection('edanmdm:nmah_923083', 10, 0, { gatherRaw: true }), WS, '466');
    handleResults(await ICol.queryCollection('edanmdm:nmah_923113', 10, 0, { gatherRaw: true }), WS, '467');
    handleResults(await ICol.queryCollection('edanmdm:nmah_923116', 10, 0, { gatherRaw: true }), WS, '468');
    handleResults(await ICol.queryCollection('edanmdm:nmah_923126', 10, 0, { gatherRaw: true }), WS, '469');
    handleResults(await ICol.queryCollection('edanmdm:nmah_923043', 10, 0, { gatherRaw: true }), WS, '471');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1250962', 10, 0, { gatherRaw: true }), WS, '472');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1199660', 10, 0, { gatherRaw: true }), WS, '473');
    handleResults(await ICol.queryCollection('edanmdm:nmah_605482', 10, 0, { gatherRaw: true }), WS, '474');
    handleResults(await ICol.queryCollection('edanmdm:nmah_763853', 10, 0, { gatherRaw: true }), WS, '475');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_10703', 10, 0, { gatherRaw: true }), WS, '476');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_10795', 10, 0, { gatherRaw: true }), WS, '478');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1004508', 10, 0, { gatherRaw: true }), WS, '481');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_11162', 10, 0, { gatherRaw: true }), WS, '482');
    handleResults(await ICol.queryCollection('edanmdm:nmah_763853', 10, 0, { gatherRaw: true }), WS, '483');
    handleResults(await ICol.queryCollection('edanmdm:nmah_607647', 10, 0, { gatherRaw: true }), WS, '488');
    handleResults(await ICol.queryCollection('edanmdm:nmah_605485', 10, 0, { gatherRaw: true }), WS, '489');
    handleResults(await ICol.queryCollection('edanmdm:nmah_605487', 10, 0, { gatherRaw: true }), WS, '490');
    handleResults(await ICol.queryCollection('edanmdm:nmah_605498', 10, 0, { gatherRaw: true }), WS, '491');
    handleResults(await ICol.queryCollection('edanmdm:nmah_605500', 10, 0, { gatherRaw: true }), WS, '493');
    handleResults(await ICol.queryCollection('edanmdm:nmah_605503', 10, 0, { gatherRaw: true }), WS, '496');
    handleResults(await ICol.queryCollection('edanmdm:nmah_605507', 10, 0, { gatherRaw: true }), WS, '497');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_14843', 10, 0, { gatherRaw: true }), WS, '498');
    handleResults(await ICol.queryCollection('edanmdm:nmah_607621', 10, 0, { gatherRaw: true }), WS, '499');
    handleResults(await ICol.queryCollection('edanmdm:nmah_606746', 10, 0, { gatherRaw: true }), WS, '500');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1108470', 10, 0, { gatherRaw: true }), WS, '503');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_17174', 10, 0, { gatherRaw: true }), WS, '509');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_17182', 10, 0, { gatherRaw: true }), WS, '511');
    handleResults(await ICol.queryCollection('edanmdm:nmah_605596', 10, 0, { gatherRaw: true }), WS, '512');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1829332', 10, 0, { gatherRaw: true }), WS, '513');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1829524', 10, 0, { gatherRaw: true }), WS, '514');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_17355', 10, 0, { gatherRaw: true }), WS, '515');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1829535', 10, 0, { gatherRaw: true }), WS, '517');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1829542', 10, 0, { gatherRaw: true }), WS, '519');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_17599', 10, 0, { gatherRaw: true }), WS, '521');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1830215', 10, 0, { gatherRaw: true }), WS, '522');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_11058167', 10, 0, { gatherRaw: true }), WS, '524');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1832985', 10, 0, { gatherRaw: true }), WS, '526');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1872415', 10, 0, { gatherRaw: true }), WS, '527');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1829185', 10, 0, { gatherRaw: true }), WS, '528');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1853623', 10, 0, { gatherRaw: true }), WS, '531');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1029149', 10, 0, { gatherRaw: true }), WS, '534');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1029284', 10, 0, { gatherRaw: true }), WS, '535');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_31148', 10, 0, { gatherRaw: true }), WS, '536');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_44873', 10, 0, { gatherRaw: true }), WS, '541');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_45849', 10, 0, { gatherRaw: true }), WS, '544');
    handleResults(await ICol.queryCollection('edanmdm:nmah_214477', 10, 0, { gatherRaw: true }), WS, '545');
    handleResults(await ICol.queryCollection('edanmdm:nmah_739716', 10, 0, { gatherRaw: true }), WS, '546');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_13587547', 10, 0, { gatherRaw: true }), WS, '548');
    handleResults(await ICol.queryCollection('edanmdm:nmah_739714', 10, 0, { gatherRaw: true }), WS, '552');
    handleResults(await ICol.queryCollection('edanmdm:nmah_739715', 10, 0, { gatherRaw: true }), WS, '555');
    handleResults(await ICol.queryCollection('edanmdm:nmah_605519', 10, 0, { gatherRaw: true }), WS, '562');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1000982', 10, 0, { gatherRaw: true }), WS, '563');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1000984', 10, 0, { gatherRaw: true }), WS, '565');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1000981', 10, 0, { gatherRaw: true }), WS, '566');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_12306', 10, 0, { gatherRaw: true }), WS, '573');
    handleResults(await ICol.queryCollection('edanmdm:nmnheducation_11412946', 10, 0, { gatherRaw: true }), WS, '574');
    handleResults(await ICol.queryCollection('edanmdm:nmnhanthropology_8061118', 10, 0, { gatherRaw: true }), WS, '575');
    handleResults(await ICol.queryCollection('edanmdm:nmnhanthropology_8061135', 10, 0, { gatherRaw: true }), WS, '577');
    handleResults(await ICol.queryCollection('edanmdm:nmnhanthropology_8061530', 10, 0, { gatherRaw: true }), WS, '578');
    handleResults(await ICol.queryCollection('edanmdm:nmnhanthropology_8061534', 10, 0, { gatherRaw: true }), WS, '579');
    handleResults(await ICol.queryCollection('edanmdm:nmnhanthropology_8061757', 10, 0, { gatherRaw: true }), WS, '580');
    handleResults(await ICol.queryCollection('edanmdm:nmnhanthropology_8096367', 10, 0, { gatherRaw: true }), WS, '581');
    handleResults(await ICol.queryCollection('edanmdm:nmnhanthropology_8098412', 10, 0, { gatherRaw: true }), WS, '582');
    handleResults(await ICol.queryCollection('edanmdm:nmnhanthropology_8098584', 10, 0, { gatherRaw: true }), WS, '583');
    handleResults(await ICol.queryCollection('edanmdm:nmnhanthropology_8099755', 10, 0, { gatherRaw: true }), WS, '584');
    handleResults(await ICol.queryCollection('edanmdm:nmnhanthropology_8100879', 10, 0, { gatherRaw: true }), WS, '585');
    handleResults(await ICol.queryCollection('edanmdm:nmnhanthropology_8108582', 10, 0, { gatherRaw: true }), WS, '586');
    handleResults(await ICol.queryCollection('edanmdm:nmnhanthropology_8108704', 10, 0, { gatherRaw: true }), WS, '587');
    handleResults(await ICol.queryCollection('edanmdm:nmnhanthropology_8108706', 10, 0, { gatherRaw: true }), WS, '588');
    handleResults(await ICol.queryCollection('edanmdm:nmnhanthropology_8109761', 10, 0, { gatherRaw: true }), WS, '590');
    handleResults(await ICol.queryCollection('edanmdm:nmnhanthropology_8114952', 10, 0, { gatherRaw: true }), WS, '591');
    handleResults(await ICol.queryCollection('edanmdm:nmnhanthropology_8115528', 10, 0, { gatherRaw: true }), WS, '592');
    handleResults(await ICol.queryCollection('edanmdm:nmnhanthropology_8115597', 10, 0, { gatherRaw: true }), WS, '593');
    handleResults(await ICol.queryCollection('edanmdm:nmnhanthropology_8131572', 10, 0, { gatherRaw: true }), WS, '594');
    handleResults(await ICol.queryCollection('edanmdm:nmnhanthropology_8131573', 10, 0, { gatherRaw: true }), WS, '595');
    handleResults(await ICol.queryCollection('edanmdm:nmnhanthropology_8131574', 10, 0, { gatherRaw: true }), WS, '596');
    handleResults(await ICol.queryCollection('edanmdm:nmnhanthropology_8131634', 10, 0, { gatherRaw: true }), WS, '597');
    handleResults(await ICol.queryCollection('edanmdm:nmnhanthropology_8131636', 10, 0, { gatherRaw: true }), WS, '598');
    handleResults(await ICol.queryCollection('edanmdm:nmnhanthropology_8131639', 10, 0, { gatherRaw: true }), WS, '599');
    handleResults(await ICol.queryCollection('edanmdm:nmnhanthropology_8135263', 10, 0, { gatherRaw: true }), WS, '600');
    handleResults(await ICol.queryCollection('edanmdm:nmnhanthropology_8145707', 10, 0, { gatherRaw: true }), WS, '601');
    handleResults(await ICol.queryCollection('edanmdm:nmnhanthropology_8146561', 10, 0, { gatherRaw: true }), WS, '602');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_22889', 10, 0, { gatherRaw: true }), WS, '606');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_18131', 10, 0, { gatherRaw: true }), WS, '607');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_9333269', 10, 0, { gatherRaw: true }), WS, '608');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3457297', 10, 0, { gatherRaw: true }), WS, '610');
    handleResults(await ICol.queryCollection('edanmdm:nmnhvz_4114544', 10, 0, { gatherRaw: true }), WS, '611');
    handleResults(await ICol.queryCollection('edanmdm:nmnhvz_4114544', 10, 0, { gatherRaw: true }), WS, '612');
    handleResults(await ICol.queryCollection('edanmdm:nmnhvz_4114544', 10, 0, { gatherRaw: true }), WS, '613');
    handleResults(await ICol.queryCollection('edanmdm:nmnhanthropology_8114628', 10, 0, { gatherRaw: true }), WS, '615');
    handleResults(await ICol.queryCollection('edanmdm:nmnhanthropology_8114628', 10, 0, { gatherRaw: true }), WS, '616');
    handleResults(await ICol.queryCollection('edanmdm:nmnhanthropology_8114628', 10, 0, { gatherRaw: true }), WS, '617');
    handleResults(await ICol.queryCollection('edanmdm:nmnhvz_4125718', 10, 0, { gatherRaw: true }), WS, '619');
    handleResults(await ICol.queryCollection('edanmdm:nmnhvz_4125718', 10, 0, { gatherRaw: true }), WS, '620');
    handleResults(await ICol.queryCollection('edanmdm:nmnhvz_4125718', 10, 0, { gatherRaw: true }), WS, '621');
    handleResults(await ICol.queryCollection('edanmdm:nmnhvz_4103596', 10, 0, { gatherRaw: true }), WS, '622');
    handleResults(await ICol.queryCollection('edanmdm:nmnhvz_4103596', 10, 0, { gatherRaw: true }), WS, '623');
    handleResults(await ICol.queryCollection('edanmdm:nmnhvz_4103596', 10, 0, { gatherRaw: true }), WS, '624');
    handleResults(await ICol.queryCollection('edanmdm:nmnhvz_4114243', 10, 0, { gatherRaw: true }), WS, '625');
    handleResults(await ICol.queryCollection('edanmdm:nmnhvz_4114243', 10, 0, { gatherRaw: true }), WS, '626');
    handleResults(await ICol.queryCollection('edanmdm:nmnhvz_4114243', 10, 0, { gatherRaw: true }), WS, '627');
    handleResults(await ICol.queryCollection('edanmdm:nmnhvz_4103600', 10, 0, { gatherRaw: true }), WS, '628');
    handleResults(await ICol.queryCollection('edanmdm:nmnhvz_4103600', 10, 0, { gatherRaw: true }), WS, '629');
    handleResults(await ICol.queryCollection('edanmdm:nmnhvz_4103600', 10, 0, { gatherRaw: true }), WS, '630');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3457406', 10, 0, { gatherRaw: true }), WS, '631');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_949712', 10, 0, { gatherRaw: true }), WS, '632');
    handleResults(await ICol.queryCollection('edanmdm:nmnhvz_4123288', 10, 0, { gatherRaw: true }), WS, '637');
    handleResults(await ICol.queryCollection('edanmdm:nmnhvz_4123288', 10, 0, { gatherRaw: true }), WS, '638');
    handleResults(await ICol.queryCollection('edanmdm:nmnhvz_4123288', 10, 0, { gatherRaw: true }), WS, '639');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3393470', 10, 0, { gatherRaw: true }), WS, '643');
    handleResults(await ICol.queryCollection('edanmdm:nmnhanthropology_8319024', 10, 0, { gatherRaw: true }), WS, '654');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_29968', 10, 0, { gatherRaw: true }), WS, '655');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_11277082', 10, 0, { gatherRaw: true }), WS, '657');
    handleResults(await ICol.queryCollection('edanmdm:nmnhvz_4092671', 10, 0, { gatherRaw: true }), WS, '658');
    handleResults(await ICol.queryCollection('edanmdm:nmnhvz_4092671', 10, 0, { gatherRaw: true }), WS, '659');
    handleResults(await ICol.queryCollection('edanmdm:nmnhvz_4092671', 10, 0, { gatherRaw: true }), WS, '660');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3393409', 10, 0, { gatherRaw: true }), WS, '662');
    handleResults(await ICol.queryCollection('edanmdm:nmnhanthropology_8552275', 10, 0, { gatherRaw: true }), WS, '664');
    handleResults(await ICol.queryCollection('edanmdm:nmnhanthropology_8552277', 10, 0, { gatherRaw: true }), WS, '665');
    handleResults(await ICol.queryCollection('edanmdm:nmnhanthropology_8552280', 10, 0, { gatherRaw: true }), WS, '666');
    handleResults(await ICol.queryCollection('edanmdm:nmnhanthropology_8552281', 10, 0, { gatherRaw: true }), WS, '667');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_12307204', 10, 0, { gatherRaw: true }), WS, '669');
    handleResults(await ICol.queryCollection('edanmdm:nmnhanthropology_8358271', 10, 0, { gatherRaw: true }), WS, '672');
    handleResults(await ICol.queryCollection('edanmdm:nmnhanthropology_8471498', 10, 0, { gatherRaw: true }), WS, '673');
    handleResults(await ICol.queryCollection('edanmdm:nmnhanthropology_8480378', 10, 0, { gatherRaw: true }), WS, '674');
    handleResults(await ICol.queryCollection('edanmdm:nmnhanthropology_8386869', 10, 0, { gatherRaw: true }), WS, '676');
    handleResults(await ICol.queryCollection('edanmdm:nmnhvz_6341612', 10, 0, { gatherRaw: true }), WS, '677');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_44873', 10, 0, { gatherRaw: true }), WS, '678');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_810553', 10, 0, { gatherRaw: true }), WS, '680');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_11009', 10, 0, { gatherRaw: true }), WS, '681');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3457407', 10, 0, { gatherRaw: true }), WS, '682');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3427936', 10, 0, { gatherRaw: true }), WS, '685');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_55498', 10, 0, { gatherRaw: true }), WS, '686');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_65179', 10, 0, { gatherRaw: true }), WS, '687');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_17480', 10, 0, { gatherRaw: true }), WS, '688');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_13935', 10, 0, { gatherRaw: true }), WS, '689');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_15163', 10, 0, { gatherRaw: true }), WS, '690');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_16151', 10, 0, { gatherRaw: true }), WS, '691');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_16050', 10, 0, { gatherRaw: true }), WS, '692');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_14586', 10, 0, { gatherRaw: true }), WS, '693');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_14572', 10, 0, { gatherRaw: true }), WS, '694');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_14861', 10, 0, { gatherRaw: true }), WS, '695');
    handleResults(await ICol.queryCollection('edanmdm:nmnhvz_4123616', 10, 0, { gatherRaw: true }), WS, '696');
    handleResults(await ICol.queryCollection('edanmdm:nmnhvz_4123616', 10, 0, { gatherRaw: true }), WS, '697');
    handleResults(await ICol.queryCollection('edanmdm:nmnhvz_4123616', 10, 0, { gatherRaw: true }), WS, '698');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_10197893', 10, 0, { gatherRaw: true }), WS, '699');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3384611', 10, 0, { gatherRaw: true }), WS, '700');
    handleResults(await ICol.queryCollection('edanmdm:nmnhvz_4113049', 10, 0, { gatherRaw: true }), WS, '701');
    handleResults(await ICol.queryCollection('edanmdm:nmnhvz_4113049', 10, 0, { gatherRaw: true }), WS, '702');
    handleResults(await ICol.queryCollection('edanmdm:nmnhvz_4113049', 10, 0, { gatherRaw: true }), WS, '703');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_14138516', 10, 0, { gatherRaw: true }), WS, '704');
    handleResults(await ICol.queryCollection('edanmdm:nmnhanthropology_8939937', 10, 0, { gatherRaw: true }), WS, '705');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_12307212', 10, 0, { gatherRaw: true }), WS, '735');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3451097', 10, 0, { gatherRaw: true }), WS, '745');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3397958', 10, 0, { gatherRaw: true }), WS, '747');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3415628', 10, 0, { gatherRaw: true }), WS, '748');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3188143', 10, 0, { gatherRaw: true }), WS, '749');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3188192', 10, 0, { gatherRaw: true }), WS, '750');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3188200', 10, 0, { gatherRaw: true }), WS, '751');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3188809', 10, 0, { gatherRaw: true }), WS, '752');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_12307093', 10, 0, { gatherRaw: true }), WS, '753');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_12307176', 10, 0, { gatherRaw: true }), WS, '754');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_12307204', 10, 0, { gatherRaw: true }), WS, '755');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_12307214', 10, 0, { gatherRaw: true }), WS, '756');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_12307233', 10, 0, { gatherRaw: true }), WS, '757');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_12307243', 10, 0, { gatherRaw: true }), WS, '758');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3126953', 10, 0, { gatherRaw: true }), WS, '759');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3129300', 10, 0, { gatherRaw: true }), WS, '760');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3425397', 10, 0, { gatherRaw: true }), WS, '762');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3377843', 10, 0, { gatherRaw: true }), WS, '763');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3427467', 10, 0, { gatherRaw: true }), WS, '764');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3423820', 10, 0, { gatherRaw: true }), WS, '765');
    handleResults(await ICol.queryCollection('edanmdm:dpo_3d_200039', 10, 0, { gatherRaw: true }), WS, '766');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3453577', 10, 0, { gatherRaw: true }), WS, '767');
    handleResults(await ICol.queryCollection('edanmdm:nmnhvz_4113270', 10, 0, { gatherRaw: true }), WS, '768');
    handleResults(await ICol.queryCollection('edanmdm:nmnhvz_4113270', 10, 0, { gatherRaw: true }), WS, '769');
    handleResults(await ICol.queryCollection('edanmdm:nmnhvz_4113270', 10, 0, { gatherRaw: true }), WS, '770');
    handleResults(await ICol.queryCollection('edanmdm:nmnhvz_4278661', 10, 0, { gatherRaw: true }), WS, '771');
    handleResults(await ICol.queryCollection('edanmdm:nmnhvz_4278661', 10, 0, { gatherRaw: true }), WS, '772');
    handleResults(await ICol.queryCollection('edanmdm:nmnhvz_4278661', 10, 0, { gatherRaw: true }), WS, '773');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_12307093', 10, 0, { gatherRaw: true }), WS, '774');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3318324', 10, 0, { gatherRaw: true }), WS, '775');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_53176', 10, 0, { gatherRaw: true }), WS, '776');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_957075', 10, 0, { gatherRaw: true }), WS, '777');
    handleResults(await ICol.queryCollection('edanmdm:nmnhvz_4175860', 10, 0, { gatherRaw: true }), WS, '778');
    handleResults(await ICol.queryCollection('edanmdm:nmnhvz_4175860', 10, 0, { gatherRaw: true }), WS, '779');
    handleResults(await ICol.queryCollection('edanmdm:nmnhvz_4175860', 10, 0, { gatherRaw: true }), WS, '780');
    handleResults(await ICol.queryCollection('edanmdm:nmnhanthropology_8010185', 10, 0, { gatherRaw: true }), WS, '784');
    handleResults(await ICol.queryCollection('edanmdm:nmnhanthropology_8010183', 10, 0, { gatherRaw: true }), WS, '785');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_51231', 10, 0, { gatherRaw: true }), WS, '787');
    handleResults(await ICol.queryCollection('edanmdm:nmnhvz_5144419', 10, 0, { gatherRaw: true }), WS, '788');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_949688', 10, 0, { gatherRaw: true }), WS, '789');
    handleResults(await ICol.queryCollection('edanmdm:nmnheducation_11380180', 10, 0, { gatherRaw: true }), WS, '793');
    handleResults(await ICol.queryCollection('edanmdm:nmnheducation_11413164', 10, 0, { gatherRaw: true }), WS, '794');
    handleResults(await ICol.queryCollection('edanmdm:nmnheducation_11380180', 10, 0, { gatherRaw: true }), WS, '795');
    handleResults(await ICol.queryCollection('edanmdm:nmnhvz_4091696', 10, 0, { gatherRaw: true }), WS, '798');
    handleResults(await ICol.queryCollection('edanmdm:nmnhvz_4091696', 10, 0, { gatherRaw: true }), WS, '799');
    handleResults(await ICol.queryCollection('edanmdm:nmnhvz_4091696', 10, 0, { gatherRaw: true }), WS, '800');
    handleResults(await ICol.queryCollection('edanmdm:nmnhvz_4119824', 10, 0, { gatherRaw: true }), WS, '801');
    handleResults(await ICol.queryCollection('edanmdm:nmnhvz_4119824', 10, 0, { gatherRaw: true }), WS, '802');
    handleResults(await ICol.queryCollection('edanmdm:nmnhvz_4119824', 10, 0, { gatherRaw: true }), WS, '803');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_79438', 10, 0, { gatherRaw: true }), WS, '804');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_821965', 10, 0, { gatherRaw: true }), WS, '806');
    handleResults(await ICol.queryCollection('edanmdm:nmnhvz_4105734', 10, 0, { gatherRaw: true }), WS, '807');
    handleResults(await ICol.queryCollection('edanmdm:nmnhvz_4105734', 10, 0, { gatherRaw: true }), WS, '808');
    handleResults(await ICol.queryCollection('edanmdm:nmnhvz_4105734', 10, 0, { gatherRaw: true }), WS, '809');
    handleResults(await ICol.queryCollection('edanmdm:nmnhvz_4113913', 10, 0, { gatherRaw: true }), WS, '810');
    handleResults(await ICol.queryCollection('edanmdm:nmnhvz_4113913', 10, 0, { gatherRaw: true }), WS, '811');
    handleResults(await ICol.queryCollection('edanmdm:nmnhvz_4113913', 10, 0, { gatherRaw: true }), WS, '812');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_536521', 10, 0, { gatherRaw: true }), WS, '815');
    handleResults(await ICol.queryCollection('edanmdm:nmnhinvertebratezoology_28962', 10, 0, { gatherRaw: true }), WS, '816');
    handleResults(await ICol.queryCollection('edanmdm:nmnhvz_4115950', 10, 0, { gatherRaw: true }), WS, '818');
    handleResults(await ICol.queryCollection('edanmdm:nmnhvz_4115950', 10, 0, { gatherRaw: true }), WS, '819');
    handleResults(await ICol.queryCollection('edanmdm:nmnhvz_4115950', 10, 0, { gatherRaw: true }), WS, '820');
    handleResults(await ICol.queryCollection('edanmdm:nmnheducation_11380100', 10, 0, { gatherRaw: true }), WS, '821');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3341954', 10, 0, { gatherRaw: true }), WS, '823');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3309799', 10, 0, { gatherRaw: true }), WS, '825');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3001151', 10, 0, { gatherRaw: true }), WS, '826');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3385086', 10, 0, { gatherRaw: true }), WS, '827');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3448991', 10, 0, { gatherRaw: true }), WS, '828');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3440721', 10, 0, { gatherRaw: true }), WS, '829');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_11467726', 10, 0, { gatherRaw: true }), WS, '830');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3397958', 10, 0, { gatherRaw: true }), WS, '831');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_12307021', 10, 0, { gatherRaw: true }), WS, '833');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3341924', 10, 0, { gatherRaw: true }), WS, '834');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3341937', 10, 0, { gatherRaw: true }), WS, '835');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3342215', 10, 0, { gatherRaw: true }), WS, '836');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3415628', 10, 0, { gatherRaw: true }), WS, '837');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3427676', 10, 0, { gatherRaw: true }), WS, '838');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3341954', 10, 0, { gatherRaw: true }), WS, '839');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3340244', 10, 0, { gatherRaw: true }), WS, '840');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3451166', 10, 0, { gatherRaw: true }), WS, '841');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3449928', 10, 0, { gatherRaw: true }), WS, '842');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_12307073', 10, 0, { gatherRaw: true }), WS, '843');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3176889', 10, 0, { gatherRaw: true }), WS, '844');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3176892', 10, 0, { gatherRaw: true }), WS, '845');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3176902', 10, 0, { gatherRaw: true }), WS, '846');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3176903', 10, 0, { gatherRaw: true }), WS, '847');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3188192', 10, 0, { gatherRaw: true }), WS, '848');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3188200', 10, 0, { gatherRaw: true }), WS, '849');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3109802', 10, 0, { gatherRaw: true }), WS, '850');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_10016796', 10, 0, { gatherRaw: true }), WS, '851');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_10016797', 10, 0, { gatherRaw: true }), WS, '852');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_10016802', 10, 0, { gatherRaw: true }), WS, '853');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_10016803', 10, 0, { gatherRaw: true }), WS, '854');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_10016808', 10, 0, { gatherRaw: true }), WS, '855');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_10611715', 10, 0, { gatherRaw: true }), WS, '856');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_11635207', 10, 0, { gatherRaw: true }), WS, '857');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_12307233', 10, 0, { gatherRaw: true }), WS, '858');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3007506', 10, 0, { gatherRaw: true }), WS, '859');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3114250', 10, 0, { gatherRaw: true }), WS, '861');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3122122', 10, 0, { gatherRaw: true }), WS, '862');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3427760', 10, 0, { gatherRaw: true }), WS, '863');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3429219', 10, 0, { gatherRaw: true }), WS, '864');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3425518', 10, 0, { gatherRaw: true }), WS, '865');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3439470', 10, 0, { gatherRaw: true }), WS, '866');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3377843', 10, 0, { gatherRaw: true }), WS, '867');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3342978', 10, 0, { gatherRaw: true }), WS, '868');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3450090', 10, 0, { gatherRaw: true }), WS, '869');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3450091', 10, 0, { gatherRaw: true }), WS, '870');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3450092', 10, 0, { gatherRaw: true }), WS, '871');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3428171', 10, 0, { gatherRaw: true }), WS, '872');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3428214', 10, 0, { gatherRaw: true }), WS, '873');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3448898', 10, 0, { gatherRaw: true }), WS, '874');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3342697', 10, 0, { gatherRaw: true }), WS, '875');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3451037', 10, 0, { gatherRaw: true }), WS, '876');
    handleResults(await ICol.queryCollection('edanmdm:nmah_705564', 10, 0, { gatherRaw: true }), WS, '886');
    handleResults(await ICol.queryCollection('edanmdm:nmnhvz_7289628', 10, 0, { gatherRaw: true }), WS, '887');
    handleResults(await ICol.queryCollection('edanmdm:nmnhvz_7511097', 10, 0, { gatherRaw: true }), WS, '888');
    handleResults(await ICol.queryCollection('edanmdm:nmnhvz_7511102', 10, 0, { gatherRaw: true }), WS, '889');
    handleResults(await ICol.queryCollection('edanmdm:nmnheducation_15006160', 10, 0, { gatherRaw: true }), WS, '890');
    handleResults(await ICol.queryCollection('edanmdm:nmnheducation_15006160', 10, 0, { gatherRaw: true }), WS, '891');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3369538', 10, 0, { gatherRaw: true }), WS, '892');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3447044', 10, 0, { gatherRaw: true }), WS, '893');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3370783', 10, 0, { gatherRaw: true }), WS, '894');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3580352', 10, 0, { gatherRaw: true }), WS, '895');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_10250729', 10, 0, { gatherRaw: true }), WS, '896');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3573298', 10, 0, { gatherRaw: true }), WS, '897');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3302876', 10, 0, { gatherRaw: true }), WS, '898');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3457273', 10, 0, { gatherRaw: true }), WS, '899');
    handleResults(await ICol.queryCollection('edanmdm:nmnhpaleobiology_3577488', 10, 0, { gatherRaw: true }), WS, '900');
    handleResults(await ICol.queryCollection('edanmdm:nmah_748903', 10, 0, { gatherRaw: true }), WS, '901');
    handleResults(await ICol.queryCollection('edanmdm:nmah_373625', 10, 0, { gatherRaw: true }), WS, '903');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1896978', 10, 0, { gatherRaw: true }), WS, '904');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1900832', 10, 0, { gatherRaw: true }), WS, '905');
    handleResults(await ICol.queryCollection('edanmdm:nmah_362153', 10, 0, { gatherRaw: true }), WS, '906');
    handleResults(await ICol.queryCollection('edanmdm:nmah_364445', 10, 0, { gatherRaw: true }), WS, '909');
    handleResults(await ICol.queryCollection('edanmdm:nmah_361750', 10, 0, { gatherRaw: true }), WS, '910');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1764061', 10, 0, { gatherRaw: true }), WS, '912');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1105750', 10, 0, { gatherRaw: true }), WS, '913');
    handleResults(await ICol.queryCollection('edanmdm:nmah_363781', 10, 0, { gatherRaw: true }), WS, '914');
    handleResults(await ICol.queryCollection('edanmdm:nmah_363781', 10, 0, { gatherRaw: true }), WS, '915');
    handleResults(await ICol.queryCollection('edanmdm:nmah_363781', 10, 0, { gatherRaw: true }), WS, '916');
    handleResults(await ICol.queryCollection('edanmdm:nmah_375161', 10, 0, { gatherRaw: true }), WS, '917');
    handleResults(await ICol.queryCollection('edanmdm:nmah_1847611', 10, 0, { gatherRaw: true }), WS, '918');
    handleResults(await ICol.queryCollection('edanmdm:nmah_368509', 10, 0, { gatherRaw: true }), WS, '919');
    handleResults(await ICol.queryCollection('edanmdm:nmah_365585', 10, 0, { gatherRaw: true }), WS, '920');
    handleResults(await ICol.queryCollection('edanmdm:nmah_365586', 10, 0, { gatherRaw: true }), WS, '921');
    handleResults(await ICol.queryCollection('edanmdm:nmaahc_2019.10.1a-g', 10, 0, { gatherRaw: true }), WS, '922');
    handleResults(await ICol.queryCollection('edanmdm:nmaahc_2013.57', 10, 0, { gatherRaw: true }), WS, '925');
    handleResults(await ICol.queryCollection('chndm_Carnegie_Mansion', 10, 0, { gatherRaw: true }), WS, '73');
    handleResults(await ICol.queryCollection('chndm_Carnegie_Mansion', 10, 0, { gatherRaw: true }), WS, '74');
    handleResults(await ICol.queryCollection('chndm_Carnegie_Mansion', 10, 0, { gatherRaw: true }), WS, '75');
    handleResults(await ICol.queryCollection('chndm_Carnegie_Mansion', 10, 0, { gatherRaw: true }), WS, '76');
    handleResults(await ICol.queryCollection('chndm_Carnegie_Mansion', 10, 0, { gatherRaw: true }), WS, '77');
    handleResults(await ICol.queryCollection('dpo_3d_200035, dpo_3d_200036', 10, 0, { gatherRaw: true }), WS, '170');
    handleResults(await ICol.queryCollection('dpo_3d_200035', 10, 0, { gatherRaw: true }), WS, '173');
    handleResults(await ICol.queryCollection('dpo_3d_200009', 10, 0, { gatherRaw: true }), WS, '174');
    handleResults(await ICol.queryCollection('dpo_3d_200030', 10, 0, { gatherRaw: true }), WS, '188');
    handleResults(await ICol.queryCollection('http://n2t.net/ark:/65665/3c32276ea-e29b-49b7-b699-2a57a621b6e6', 10, 0, { gatherRaw: true }), WS, '663');
    handleResults(await ICol.queryCollection('http://n2t.net/ark:/65665/3c34fa78d-02b8-4c1e-8a2a-2429ef6ab6a1', 10, 0, { gatherRaw: true }), WS, '824');
}

function handleResults(results: COL.CollectionQueryResults | null, WS: NodeJS.WritableStream, id: string): COL.CollectionQueryResults | null {
    if (results) {
        if (results.error)
            LOG.info(`*** Edan Scrape: encountered error ${results.error}`, LOG.LS.eTEST);

        for (const record of results.records) {
            WS.write(`${id}\t${record.name.replace(/\r?\n|\r/g, ' ')}\t${record.unit}\t${record.identifierPublic}\t${record.identifierCollection}\t${results.records.length}\n`);
            // WS.write(`${id}\t${record.name.replace(/\r?\n|\r/g, ' ')}\t${record.unit}\t${record.identifierPublic}\t${record.identifierCollection}\t${H.Helpers.JSONStringify(record.raw)}\n`);
            // LOG.info(`EDAN Query: ${JSON.stringify(record)}`, LOG.LS.eTEST);
        }
    }
    return results;
}
// #endregion
