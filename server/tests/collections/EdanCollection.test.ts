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

type EdanResult = {
    id: string;
    name: string;
    unit: string;
    identifierPublic: string;
    identifierCollection: string;
    records: number;
    IDMap?: Map<string, string> | undefined;
    raw?: any;
};

enum eTestType {
    eRegressionSuite,
    e3DPackageFetchTest,
    eScrapeDPO,
    eScrapeMigration,
    eScrapeEDANListsContents,
    eScrapeEDANListsIDs,
    eScrapeEDAN,
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
                await scrapeDPOIDs(ICol, eTYPE, 'd:\\Work\\SI\\EdanScrape.DPO.txt');
            });
            break;

        case eTestType.eScrapeMigration:
            test('Collections: EdanCollection.scrape EDAN', async () => {
                await scrapeDPOIDs(ICol, eTYPE, 'd:\\Work\\SI\\EdanScrape.IDs.txt');
            });
            break;

        case eTestType.eScrapeEDANListsContents:
            test('Collections: EdanCollection.scrape edanlists Contents for Migration', async () => {
                await scrapeDPOEdanLists(ICol, 'd:\\Work\\SI\\EdanScrape.EdanListsMigration.txt');
            });
            break;

        case eTestType.eScrapeEDANListsIDs:
            test('Collections: EdanCollection.scrape edanists IDs for Migration', async () => {
                await scrapeDPOIDs(ICol, eTYPE, 'd:\\Work\\SI\\EdanScrape.EdanListsIDs.txt');
            });
            break;

        case eTestType.eScrapeEDAN:
            test('Collections: EdanCollection.scrape EDAN', async () => {
                await scrapeEdan(ICol, 'd:\\Work\\SI\\EdanScrape.EDAN.txt', 0);
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

function executeArkTests(ICol: COL.ICollection) {
    const customShoulder: string = 'custom';
    const ArkNameMappingAuthority: string = ICol.getArkNameMappingAuthority();
    const ArkNameAssigningAuthority: string = ICol.getArkNameAssigningAuthority();

    const ArkDefaultShoulderNoPrepend: string = ICol.generateArk(null, false, false);
    const ArkDefaultShoulderNoPrependMedia: string = ICol.generateArk(null, false, true);
    const ArkDefaultShoulderPrepend: string = ICol.generateArk(null, true, false);
    const ArkDefaultShoulderPrependMedia: string = ICol.generateArk(null, true, true);
    const ArkCustomShoulderNoPrepend: string = ICol.generateArk(customShoulder, false, false);
    const ArkCustomShoulderNoPrependMedia: string = ICol.generateArk(customShoulder, false, true);
    const ArkCustomShoulderPrepend: string = ICol.generateArk(customShoulder, true, false);
    const ArkCustomShoulderPrependMedia: string = ICol.generateArk(customShoulder, true, true);
    const ArkInvalid: string = H.Helpers.randomSlug();

    expect(ArkDefaultShoulderNoPrepend.startsWith(ArkNameMappingAuthority)).toBeFalsy();
    expect(ArkDefaultShoulderNoPrependMedia.startsWith(ArkNameMappingAuthority)).toBeFalsy();
    expect(ArkDefaultShoulderPrepend.startsWith(ArkNameMappingAuthority)).toBeTruthy();
    expect(ArkDefaultShoulderPrependMedia.startsWith(ArkNameMappingAuthority)).toBeTruthy();
    expect(ArkCustomShoulderNoPrepend.startsWith(ArkNameMappingAuthority)).toBeFalsy();
    expect(ArkCustomShoulderNoPrependMedia.startsWith(ArkNameMappingAuthority)).toBeFalsy();
    expect(ArkCustomShoulderPrepend.startsWith(ArkNameMappingAuthority)).toBeTruthy();
    expect(ArkCustomShoulderPrependMedia.startsWith(ArkNameMappingAuthority)).toBeTruthy();

    expect(ArkDefaultShoulderNoPrepend.includes(customShoulder)).toBeFalsy();
    expect(ArkDefaultShoulderNoPrependMedia.includes(customShoulder)).toBeFalsy();
    expect(ArkDefaultShoulderPrepend.includes(customShoulder)).toBeFalsy();
    expect(ArkDefaultShoulderPrependMedia.includes(customShoulder)).toBeFalsy();
    expect(ArkCustomShoulderNoPrepend.includes(customShoulder)).toBeTruthy();
    expect(ArkCustomShoulderNoPrependMedia.includes(customShoulder)).toBeTruthy();
    expect(ArkCustomShoulderPrepend.includes(customShoulder)).toBeTruthy();
    expect(ArkCustomShoulderPrependMedia.includes(customShoulder)).toBeTruthy();

    expect(ArkDefaultShoulderNoPrepend.includes(ArkNameAssigningAuthority)).toBeTruthy();
    expect(ArkDefaultShoulderNoPrependMedia.includes(ArkNameAssigningAuthority)).toBeTruthy();
    expect(ArkDefaultShoulderPrepend.includes(ArkNameAssigningAuthority)).toBeTruthy();
    expect(ArkDefaultShoulderPrependMedia.includes(ArkNameAssigningAuthority)).toBeTruthy();
    expect(ArkCustomShoulderNoPrepend.includes(ArkNameAssigningAuthority)).toBeTruthy();
    expect(ArkCustomShoulderNoPrependMedia.includes(ArkNameAssigningAuthority)).toBeTruthy();
    expect(ArkCustomShoulderPrepend.includes(ArkNameAssigningAuthority)).toBeTruthy();
    expect(ArkCustomShoulderPrependMedia.includes(ArkNameAssigningAuthority)).toBeTruthy();

    const ArkDefaultShoulderNoPrependExtract: string | null = ICol.extractArkFromUrl(ArkDefaultShoulderNoPrepend);
    const ArkDefaultShoulderNoPrependMediaExtract: string | null = ICol.extractArkFromUrl(ArkDefaultShoulderNoPrependMedia);
    const ArkDefaultShoulderPrependExtract: string | null = ICol.extractArkFromUrl(ArkDefaultShoulderPrepend);
    const ArkDefaultShoulderPrependMediaExtract: string | null = ICol.extractArkFromUrl(ArkDefaultShoulderPrependMedia);
    const ArkCustomShoulderNoPrependExtract: string | null = ICol.extractArkFromUrl(ArkCustomShoulderNoPrepend);
    const ArkCustomShoulderNoPrependMediaExtract: string | null = ICol.extractArkFromUrl(ArkCustomShoulderNoPrependMedia);
    const ArkCustomShoulderPrependExtract: string | null = ICol.extractArkFromUrl(ArkCustomShoulderPrepend);
    const ArkCustomShoulderPrependMediaExtract: string | null = ICol.extractArkFromUrl(ArkCustomShoulderPrependMedia);
    const ArkInvalidExtract: string | null = ICol.extractArkFromUrl(ArkInvalid);

    expect(ArkDefaultShoulderNoPrependExtract && ArkDefaultShoulderNoPrependExtract.startsWith('ark:')).toBeTruthy();
    expect(ArkDefaultShoulderNoPrependMediaExtract && ArkDefaultShoulderNoPrependMediaExtract.startsWith('ark:')).toBeTruthy();
    expect(ArkDefaultShoulderPrependExtract && ArkDefaultShoulderPrependExtract.startsWith('ark:')).toBeTruthy();
    expect(ArkDefaultShoulderPrependMediaExtract && ArkDefaultShoulderPrependMediaExtract.startsWith('ark:')).toBeTruthy();
    expect(ArkCustomShoulderNoPrependExtract && ArkCustomShoulderNoPrependExtract.startsWith('ark:')).toBeTruthy();
    expect(ArkCustomShoulderNoPrependMediaExtract && ArkCustomShoulderNoPrependMediaExtract.startsWith('ark:')).toBeTruthy();
    expect(ArkCustomShoulderPrependExtract && ArkCustomShoulderPrependExtract.startsWith('ark:')).toBeTruthy();
    expect(ArkCustomShoulderPrependMediaExtract && ArkCustomShoulderPrependMediaExtract.startsWith('ark:')).toBeTruthy();
    expect(ArkInvalidExtract).toBeFalsy();

    const ArkDefaultShoulderNoPrependUrl: string = ICol.transformArkIntoUrl(ArkDefaultShoulderNoPrependExtract ? ArkDefaultShoulderNoPrependExtract : '');
    const ArkDefaultShoulderNoPrependMediaUrl: string = ICol.transformArkIntoUrl(ArkDefaultShoulderNoPrependMediaExtract ? ArkDefaultShoulderNoPrependMediaExtract : '');
    const ArkDefaultShoulderPrependUrl: string = ICol.transformArkIntoUrl(ArkDefaultShoulderPrependExtract ? ArkDefaultShoulderPrependExtract : '');
    const ArkDefaultShoulderPrependMediaUrl: string = ICol.transformArkIntoUrl(ArkDefaultShoulderPrependMediaExtract ? ArkDefaultShoulderPrependMediaExtract : '');
    const ArkCustomShoulderNoPrependUrl: string = ICol.transformArkIntoUrl(ArkCustomShoulderNoPrependExtract ? ArkCustomShoulderNoPrependExtract : '');
    const ArkCustomShoulderNoPrependMediaUrl: string = ICol.transformArkIntoUrl(ArkCustomShoulderNoPrependMediaExtract ? ArkCustomShoulderNoPrependMediaExtract : '');
    const ArkCustomShoulderPrependUrl: string = ICol.transformArkIntoUrl(ArkCustomShoulderPrependExtract ? ArkCustomShoulderPrependExtract : '');
    const ArkCustomShoulderPrependMediaUrl: string = ICol.transformArkIntoUrl(ArkCustomShoulderPrependMediaExtract ? ArkCustomShoulderPrependMediaExtract : '');

    expect(ArkDefaultShoulderNoPrependUrl.startsWith(ArkNameMappingAuthority)).toBeTruthy();
    expect(ArkDefaultShoulderNoPrependMediaUrl.startsWith(ArkNameMappingAuthority)).toBeTruthy();
    expect(ArkDefaultShoulderPrependUrl.startsWith(ArkNameMappingAuthority)).toBeTruthy();
    expect(ArkDefaultShoulderPrependMediaUrl.startsWith(ArkNameMappingAuthority)).toBeTruthy();
    expect(ArkCustomShoulderNoPrependUrl.startsWith(ArkNameMappingAuthority)).toBeTruthy();
    expect(ArkCustomShoulderNoPrependMediaUrl.startsWith(ArkNameMappingAuthority)).toBeTruthy();
    expect(ArkCustomShoulderPrependUrl.startsWith(ArkNameMappingAuthority)).toBeTruthy();
    expect(ArkCustomShoulderPrependMediaUrl.startsWith(ArkNameMappingAuthority)).toBeTruthy();

    expect(ArkDefaultShoulderPrependUrl).toEqual(ArkDefaultShoulderPrepend);
    expect(ArkCustomShoulderPrependUrl).toEqual(ArkCustomShoulderPrepend);
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

export async function scrapeEdan(ICol: COL.ICollection, fileName: string, rowStart: number): Promise<void> {
    jest.setTimeout(1000 * 60 * 60 * 24 * 7);   // 1 week
    let writeStream: NodeJS.WritableStream | null = null;

    try {
        let scrapeEndRecord: number = EDAN_SCRAPE_MAX_INIT;
        let queryNumber: number = 0;
        let resultCount: number = 0;
        const unitMap: Map<string, number> = new Map<string, number>();
        writeStream = await fs.createWriteStream(fileName, { 'flags': 'a' });
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
                        if (writeStream)
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
    } finally {
        if (writeStream)
            writeStream.end();
    }
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

// #region SCRAPE DPO
type EdanMDMMetadata = {
    name: string;
    label?: string;
    value: string;
};

async function scrapeDPOIDs(ICol: COL.ICollection, eTYPE: eTestType, fileName: string): Promise<void> {
    jest.setTimeout(1000 * 60 * 60 * 4);   // 4 hours
    const IDLabelSet: Set<string> = new Set<string>();
    const records: EdanResult[] = [];

    const WS: NodeJS.WritableStream = await fs.createWriteStream(fileName, { 'flags': 'a' });
    if (!WS) {
        LOG.info(`Unable to create writeStream for ${fileName}`, LOG.LS.eTEST);
        return;
    }

    let gatherRaw: boolean | undefined = undefined;
    switch (eTYPE) {
        case eTestType.eScrapeDPO: await scrapeDPOEdanMDMWorker(ICol, IDLabelSet, records, true); gatherRaw = true; break;
        case eTestType.eScrapeMigration: await scrapeDPOIDsWorker(ICol, IDLabelSet, records); break;
        case eTestType.eScrapeEDANListsIDs: await scrapeDPOEdanListIDsWorker(ICol, IDLabelSet, records); break;
    }

    const IDLabels: string[] = Array.from(IDLabelSet).sort((a, b) => a.localeCompare(b));

    WS.write('id\tname\tunit\tidentifierPublic\tidentifierCollection\trecords');
    for (const IDLabel of IDLabels)
        WS.write(`\t${IDLabel}`);
    if (gatherRaw)
        WS.write('\traw');
    WS.write('\n');

    const metadataMap: Map<string, EdanMDMMetadata[]> = new Map<string, EdanMDMMetadata[]>(); // map of record.id -> Metadata[]

    for (const record of records) {
        WS.write(`${record.id}\t${record.name}\t${record.unit}\t${record.identifierPublic}\t${record.identifierCollection}\t${record.records}`);
        for (const IDLabel of IDLabels)
            WS.write(`\t${record.IDMap?.get(IDLabel) ?? ''}`);
        if (gatherRaw) {
            WS.write(`\t${JSON.stringify(record.raw, null, 0)}`);
            const edanMDM: COL.EdanMDMContent | undefined = record.raw?.content;
            if (edanMDM) {
                const metadata: EdanMDMMetadata[] = [];

                if (edanMDM?.descriptiveNonRepeating?.title?.label) metadata.push({ name: 'label', value: edanMDM.descriptiveNonRepeating.title.label });
                if (edanMDM?.descriptiveNonRepeating?.title?.content) metadata.push({ name: 'title', value: edanMDM.descriptiveNonRepeating.title.content });
                if (edanMDM?.descriptiveNonRepeating?.record_ID) metadata.push({ name: 'record', value: edanMDM.descriptiveNonRepeating.record_ID });
                if (edanMDM?.descriptiveNonRepeating?.unit_code) metadata.push({ name: 'unit', value: edanMDM.descriptiveNonRepeating.unit_code });
                if (edanMDM?.descriptiveNonRepeating?.metadata_usage?.access) metadata.push({ name: 'license', value: edanMDM.descriptiveNonRepeating.metadata_usage.access });
                if (edanMDM?.descriptiveNonRepeating?.metadata_usage?.content) metadata.push({ name: 'license text', value: edanMDM.descriptiveNonRepeating.metadata_usage.content });

                if (edanMDM?.indexedStructured?.object_type) { for (const value of edanMDM.indexedStructured.object_type) metadata.push({ name: 'object type', value }); }
                if (edanMDM?.indexedStructured?.date) { for (const value of edanMDM.indexedStructured.date) metadata.push({ name: 'date', value }); }
                if (edanMDM?.indexedStructured?.place) { for (const value of edanMDM.indexedStructured.place) metadata.push({ name: 'place', value }); }
                if (edanMDM?.indexedStructured?.topic) { for (const value of edanMDM.indexedStructured.topic) metadata.push({ name: 'topic', value }); }

                if (edanMDM?.freetext?.identifier) { for (const LC of edanMDM.freetext.identifier) metadata.push({ name: 'identifier (ft)', label: LC?.label, value: LC?.content }); }
                if (edanMDM?.freetext?.dataSource) { for (const LC of edanMDM.freetext.dataSource) metadata.push({ name: 'data source (ft)', label: LC?.label, value: LC?.content }); }
                if (edanMDM?.freetext?.date) { for (const LC of edanMDM.freetext.date) metadata.push({ name: 'date (ft)', label: LC?.label, value: LC?.content }); }
                if (edanMDM?.freetext?.name) { for (const LC of edanMDM.freetext.name) metadata.push({ name: 'name (ft)', label: LC?.label, value: LC?.content }); }
                if (edanMDM?.freetext?.objectRights) { for (const LC of edanMDM.freetext.objectRights) metadata.push({ name: 'object rights (ft)', label: LC?.label, value: LC?.content }); }
                if (edanMDM?.freetext?.place) { for (const LC of edanMDM.freetext.place) metadata.push({ name: 'place (ft)', label: LC?.label, value: LC?.content }); }
                if (edanMDM?.freetext?.taxonomicName) { for (const LC of edanMDM.freetext.taxonomicName) metadata.push({ name: 'taxonomic name (ft)', label: LC?.label, value: LC?.content }); }
                if (edanMDM?.freetext?.notes) { for (const LC of edanMDM.freetext.notes) metadata.push({ name: 'notes (ft)', label: LC?.label, value: LC?.content }); }
                if (edanMDM?.freetext?.physicalDescription) { for (const LC of edanMDM.freetext.physicalDescription) metadata.push({ name: 'physical description (ft)', label: LC?.label, value: LC?.content }); }

                metadataMap.set(record.id, metadata);
            }
        }
        WS.write('\n');
    }

    if (metadataMap.size > 0) {
        WS.write('\nid\tname\tlabel\tvalue\n');
        for (const [id, metadataList] of metadataMap) {
            for (const metadata of metadataList)
                WS.write(`${id}\t${metadata.name}\t${metadata.label ?? ''}\t${metadata.value.replace(/(\n|\r)/g, ' ')}\n`);
        }
    }

    WS.end();
}

async function scrapeDPOEdanLists(ICol: COL.ICollection, fileName: string): Promise<void> {
    jest.setTimeout(1000 * 60 * 60);   // 1 hour

    const WS: NodeJS.WritableStream = await fs.createWriteStream(fileName, { 'flags': 'a' });
    if (!WS)
        LOG.info(`Unable to create writeStream for ${fileName}`, LOG.LS.eTEST);
    WS.write('id\tname\tunit\tidentifierPublic\tidentifierCollection\trecords\n');

    await handleResultsEdanLists(ICol, WS, 'edanlists:p2b-1601389276209-1602191757227-0', '115', 'SI');
    await handleResultsEdanLists(ICol, WS, 'edanlists:p2b-1601388908954-1602191481746-0', '120', 'SI');
    await handleResultsEdanLists(ICol, WS, 'edanlists:p2b-1601388908954-1602190270053-0', '121', 'SI');
    await handleResultsEdanLists(ICol, WS, 'edanlists:p2b-1656586819890-1656703282186-0', '907', 'SI');
    await handleResultsEdanLists(ICol, WS, 'edanlists:p2b-1656586819890-1656703024090-0', '911', 'SI');
    await handleResultsEdanLists(ICol, WS, 'edanlists:p2b-1656586819890-1656639541754-0', '935', 'SI');
    await handleResultsEdanLists(ICol, WS, 'edanlists:p2b-1656586819890-1656639432917-0', '934', 'SI');
    await handleResultsEdanLists(ICol, WS, 'edanlists:p2b-1656586819890-1656639364064-0', '930', 'SI');
    await handleResultsEdanLists(ICol, WS, 'edanlists:p2b-1656586819890-1656639283574-0', '920', 'SI');
    await handleResultsEdanLists(ICol, WS, 'edanlists:p2b-1656500476665-1656703241436-0', '903', 'SI');
    await handleResultsEdanLists(ICol, WS, 'edanlists:p2b-1656414186682-1656703126116-0', '916', 'SI');
    await handleResultsEdanLists(ICol, WS, 'edanlists:p2b-1656414186682-1656703065444-0', '914', 'SI');
    await handleResultsEdanLists(ICol, WS, 'edanlists:p2b-1656414186682-1656702965563-0', '937', 'SI');
    await handleResultsEdanLists(ICol, WS, 'edanlists:p2b-1656414186682-1656702911409-0', '936', 'SI');
    await handleResultsEdanLists(ICol, WS, 'edanlists:p2b-1656414186682-1656639323814-0', '923', 'SI');
    await handleResultsEdanLists(ICol, WS, 'edanlists:p2b-1580421846495-1581618944850-0', '204', 'SI');
    await handleResultsEdanLists(ICol, WS, 'edanlists:p2b-1580421846495-1581628550322-0', '388', 'SI');
    await handleResultsEdanLists(ICol, WS, 'edanlists:p2b-1580421846495-1581619988547-0', '399', 'SI');
    await handleResultsEdanLists(ICol, WS, 'edanlists:p2b-1580421846495-1581618462852-0', '180', 'SI');
    await handleResultsEdanLists(ICol, WS, 'edanlists:p2b-1580421846495-1581618317463-0', '141', 'SI');
    await handleResultsEdanLists(ICol, WS, 'edanlists:p2b-1580421846495-1581355895303-0', '173', 'SI');
}

async function scrapeDPOEdanMDMWorker(ICol: COL.ICollection, IDLabelSet: Set<string>, records: EdanResult[], gatherRaw: boolean): Promise<void> {
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200001', 'dpo_3d_200001', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200002', 'dpo_3d_200002', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200003', 'dpo_3d_200003', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200004', 'dpo_3d_200004', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200005', 'dpo_3d_200005', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200006', 'dpo_3d_200006', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200007', 'dpo_3d_200007', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200008', 'dpo_3d_200008', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200009', 'dpo_3d_200009', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200010', 'dpo_3d_200010', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200011', 'dpo_3d_200011', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200012', 'dpo_3d_200012', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200013', 'dpo_3d_200013', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200014', 'dpo_3d_200014', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200015', 'dpo_3d_200015', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200016', 'dpo_3d_200016', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200017', 'dpo_3d_200017', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200018', 'dpo_3d_200018', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200019', 'dpo_3d_200019', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200020', 'dpo_3d_200020', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200021', 'dpo_3d_200021', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200022', 'dpo_3d_200022', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200023', 'dpo_3d_200023', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200024', 'dpo_3d_200024', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200025', 'dpo_3d_200025', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200026', 'dpo_3d_200026', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200027', 'dpo_3d_200027', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200028', 'dpo_3d_200028', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200029', 'dpo_3d_200029', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200030', 'dpo_3d_200030', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200031', 'dpo_3d_200031', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200032', 'dpo_3d_200032', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200033', 'dpo_3d_200033', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200034', 'dpo_3d_200034', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200035', 'dpo_3d_200035', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200036', 'dpo_3d_200036', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200037', 'dpo_3d_200037', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200038', 'dpo_3d_200038', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200039', 'dpo_3d_200039', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200040', 'dpo_3d_200040', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200041', 'dpo_3d_200041', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200042', 'dpo_3d_200042', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200043', 'dpo_3d_200043', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200044', 'dpo_3d_200044', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200045', 'dpo_3d_200045', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200046', 'dpo_3d_200046', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200047', 'dpo_3d_200047', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200048', 'dpo_3d_200048', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200049', 'dpo_3d_200049', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200050', 'dpo_3d_200050', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200051', 'dpo_3d_200051', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200052', 'dpo_3d_200052', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200053', 'dpo_3d_200053', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200054', 'dpo_3d_200054', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200055', 'dpo_3d_200055', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200056', 'dpo_3d_200056', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200057', 'dpo_3d_200057', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200058', 'dpo_3d_200058', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200059', 'dpo_3d_200059', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200060', 'dpo_3d_200060', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200061', 'dpo_3d_200061', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200062', 'dpo_3d_200062', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200063', 'dpo_3d_200063', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200064', 'dpo_3d_200064', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200065', 'dpo_3d_200065', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200066', 'dpo_3d_200066', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200067', 'dpo_3d_200067', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200068', 'dpo_3d_200068', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200069', 'dpo_3d_200069', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200070', 'dpo_3d_200070', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200071', 'dpo_3d_200071', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200072', 'dpo_3d_200072', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200073', 'dpo_3d_200073', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200074', 'dpo_3d_200074', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200075', 'dpo_3d_200075', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200076', 'dpo_3d_200076', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200077', 'dpo_3d_200077', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200078', 'dpo_3d_200078', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200079', 'dpo_3d_200079', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200080', 'dpo_3d_200080', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200081', 'dpo_3d_200081', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200082', 'dpo_3d_200082', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200083', 'dpo_3d_200083', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200084', 'dpo_3d_200084', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200085', 'dpo_3d_200085', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200086', 'dpo_3d_200086', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200087', 'dpo_3d_200087', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200088', 'dpo_3d_200088', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200089', 'dpo_3d_200089', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200090', 'dpo_3d_200090', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200091', 'dpo_3d_200091', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200092', 'dpo_3d_200092', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200093', 'dpo_3d_200093', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200094', 'dpo_3d_200094', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200095', 'dpo_3d_200095', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200096', 'dpo_3d_200096', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200097', 'dpo_3d_200097', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200098', 'dpo_3d_200098', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200099', 'dpo_3d_200099', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200100', 'dpo_3d_200100', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200101', 'dpo_3d_200101', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200102', 'dpo_3d_200102', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200103', 'dpo_3d_200103', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200104', 'dpo_3d_200104', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200105', 'dpo_3d_200105', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200106', 'dpo_3d_200106', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200107', 'dpo_3d_200107', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200108', 'dpo_3d_200108', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200109', 'dpo_3d_200109', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200110', 'dpo_3d_200110', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200111', 'dpo_3d_200111', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200112', 'dpo_3d_200112', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200113', 'dpo_3d_200113', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200114', 'dpo_3d_200114', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200115', 'dpo_3d_200115', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200116', 'dpo_3d_200116', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200117', 'dpo_3d_200117', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200118', 'dpo_3d_200118', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200119', 'dpo_3d_200119', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200120', 'dpo_3d_200120', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200121', 'dpo_3d_200121', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200122', 'dpo_3d_200122', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200123', 'dpo_3d_200123', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200124', 'dpo_3d_200124', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200125', 'dpo_3d_200125', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200126', 'dpo_3d_200126', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200127', 'dpo_3d_200127', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200128', 'dpo_3d_200128', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200129', 'dpo_3d_200129', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200130', 'dpo_3d_200130', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200131', 'dpo_3d_200131', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200132', 'dpo_3d_200132', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200133', 'dpo_3d_200133', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200134', 'dpo_3d_200134', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200135', 'dpo_3d_200135', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200136', 'dpo_3d_200136', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200137', 'dpo_3d_200137', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200138', 'dpo_3d_200138', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200139', 'dpo_3d_200139', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200140', 'dpo_3d_200140', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200141', 'dpo_3d_200141', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200142', 'dpo_3d_200142', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200143', 'dpo_3d_200143', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200144', 'dpo_3d_200144', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200145', 'dpo_3d_200145', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200146', 'dpo_3d_200146', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200147', 'dpo_3d_200147', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200148', 'dpo_3d_200148', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200149', 'dpo_3d_200149', IDLabelSet, records, gatherRaw);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200150', 'dpo_3d_200150', IDLabelSet, records, gatherRaw);
}
// #endregion

async function scrapeDPOIDsWorker(ICol: COL.ICollection, IDLabelSet: Set<string>, records: EdanResult[]): Promise<void> {
    // #region vz_migration
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_10049110', '12280', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_10049111', '12490', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_10049112', '10456', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_10049114', '12121', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_10049115', '11283', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_10049116', '11081', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_10049117', '11125', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_10049119', '10479', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_10049121', '11102', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_10049122', '12124', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_10049123', '12491', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_10049124', '11219', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_10049166', '11622', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_10049171', '12492', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_10049174', '11380', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_10049175', '10835', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_10049177', '10496', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_10049179', '12493', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_10049183', '10587', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_10049185', '12027', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_10049189', '12417', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_10049191', '11328', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_10049195', '10574', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_10049197', '12380', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_10049201', '12494', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_10049204', '12313', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_10049206', '12495', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_10049207', '12496', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_10058410', '12289', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_10058413', '10457', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_10058417', '11540', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_10058436', '10148', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_10058589', '11917', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_10059183', '11494', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_10201159', '11733', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_10201163', '11227', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_10201164', '10803', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_10201165', '11009', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_10201166', '11712', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_10201168', '10258', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_10201169', '12499', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_10201171', '10265', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_10201173', '10595', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_10588160', '10286', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_10877555', '12500', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_6074558', '10499', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7001894', '11742', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7014817', '11155', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7015141', '10261', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7036160', '10288', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7036569', '11637', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7036573', '10463', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7036574', '10285', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7038560', '10363', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7038575', '10138', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7038579', '10142', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7045007', '10314', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7047645', '10222', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7047655', '10604', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7047769', '11260', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7047770', '10190', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7047834', '10359', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7047851', '10498', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7047853', '11996', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7047857', '10206', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7047858', '10153', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7047890', '10420', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7048355', '10725', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7048361', '10144', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7048365', '11220', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7048366', '10339', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7048367', '10413', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7048368', '10561', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7048369', '10567', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7048370', '11961', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7048374', '10612', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7048733', '10340', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7048735', '10446', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7048737', '10800', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7048738', '11337', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7048740', '11442', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7048741', '10386', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7048746', '11952', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7048747', '11347', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7048763', '10534', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7049175', '10611', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7049315', '10427', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7049543', '11097', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7049664', '10770', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7052220', '10236', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7052225', '10277', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7069506', '10226', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7071972', '10325', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7073771', '10101', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7073868', '10790', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7089922', '12551', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7146268', '12574', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7154787', '12597', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7154788', '12599', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7184509', '12601', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7226638', '10628', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7226906', '10862', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7226908', '11439', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7227753', '10794', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7228227', '10240', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7228228', '11100', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7232000', '10158', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7232002', '10263', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7232003', '10315', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7232004', '10264', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7232006', '10184', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7232008', '10134', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7232009', '10237', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7232010', '10260', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7232011', '10151', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7232012', '10225', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7232013', '10116', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7232014', '10199', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7232015', '10192', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7232016', '10154', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7232017', '10282', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7232018', '10096', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7232019', '10186', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7232020', '10187', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7235149', '10316', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7235955', '10099', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7235956', '12620', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7235957', '12622', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7235958', '12624', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7235959', '12626', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7236065', '12628', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7236128', '10211', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7236129', '10209', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7236145', '10130', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7236146', '10267', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7236271', '12630', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7236272', '12631', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7236273', '12633', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7236274', '10108', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7236281', '10182', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7236282', '10220', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7236284', '10160', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7236286', '10135', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7236287', '10241', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7236288', '10207', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7236289', '10175', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7236365', '10298', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7236366', '10166', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7236367', '10214', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7236369', '10289', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7236370', '10098', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7236372', '11035', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7236431', '11876', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7237059', '10162', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7241006', '11560', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7241014', '10284', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7241148', '10301', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7241152', '10157', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7241154', '11193', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7242898', '10813', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7242901', '10536', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7242910', '10715', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7242911', '11662', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7242912', '12248', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7243029', '11319', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7243097', '11506', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7243098', '10335', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7243261', '11508', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7243265', '11437', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7243267', '11801', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7243268', '10531', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7243270', '11479', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7243271', '11428', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7243605', '11632', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7243710', '10306', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7243739', '11718', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7243740', '12639', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7243742', '10980', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7243743', '10683', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7244091', '11019', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7244092', '10481', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7245472', '10752', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7245536', '10185', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7245540', '10553', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7245544', '10276', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7245548', '11497', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7245554', '11101', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7245555', '12093', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7245557', '10716', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7245558', '10579', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7245559', '11571', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7245560', '10556', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7245561', '11291', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7245562', '10543', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7245566', '10517', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7245732', '10125', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7245734', '10985', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7245822', '10545', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7246054', '12642', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7246080', '11535', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7246085', '10104', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7246087', '12109', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7246088', '10917', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7246089', '11607', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7246090', '10805', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7246091', '10570', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7246405', '10146', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7246416', '10637', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7246418', '10844', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7246485', '10905', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7246507', '11922', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7246852', '10645', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7246935', '12646', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7246973', '10183', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7250589', '10990', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7250602', '11184', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7250603', '11070', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7250604', '11131', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7250605', '11042', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7250606', '10969', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7250608', '11427', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7250995', '10380', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7250996', '11059', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7250997', '10323', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7250998', '10714', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7250999', '11257', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251000', '11629', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251001', '11548', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251002', '12049', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251004', '11850', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251005', '11365', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251006', '10376', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251007', '10972', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251008', '10631', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251009', '12656', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251010', '12489', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251011', '10492', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251012', '11958', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251013', '11641', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251014', '12051', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251015', '10675', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251016', '12658', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251017', '10671', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251018', '10757', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251019', '10954', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251020', '11837', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251021', '10502', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251022', '10975', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251023', '11846', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251024', '10710', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251025', '12117', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251038', '10451', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251048', '11322', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251054', '10215', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251551', '10590', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251552', '11249', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251553', '10831', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251554', '11258', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251555', '11166', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251556', '10535', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251557', '11017', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251558', '10768', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251560', '10989', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251561', '11161', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251562', '11179', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251565', '11274', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251566', '11606', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251571', '10352', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251572', '10384', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251573', '10408', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251575', '10324', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251576', '10383', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251578', '10447', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251579', '10337', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251580', '10360', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251581', '10388', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251582', '10329', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251583', '10571', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251584', '10694', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251585', '10539', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251586', '10444', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251587', '10458', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251588', '10462', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251791', '10143', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251792', '10950', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251793', '11106', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251794', '10495', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251795', '11797', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7251992', '12683', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7252126', '11424', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7252513', '11547', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7252514', '10347', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7252515', '10606', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7252516', '12468', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7252517', '10432', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7252518', '10356', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7252519', '10348', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7252520', '10351', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7252521', '10333', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7252522', '10411', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7252523', '10361', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7252524', '10640', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7252525', '11491', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7252526', '10622', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7252527', '11037', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7252528', '10681', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7252529', '12724', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7252530', '10509', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7252531', '12726', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7252532', '11057', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7252533', '10599', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7252536', '10646', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7252537', '10281', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7252538', '11221', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7252539', '10855', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7254298', '11438', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7254299', '10514', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7254300', '11144', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7254301', '12480', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7254302', '11034', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7254303', '10415', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7254985', '10244', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7254992', '11330', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7254993', '10322', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7254994', '11262', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7254995', '11795', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7254996', '12057', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7255000', '10670', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7255001', '11820', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7255002', '12041', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7255003', '10978', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7255004', '11591', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7255005', '10751', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7255006', '11158', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7255007', '12448', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7255008', '11624', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7255009', '12140', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7255010', '12733', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7255011', '10486', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7255012', '10405', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7255013', '10358', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7255014', '10957', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7255015', '10788', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7255016', '10828', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7255017', '10387', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7255018', '10660', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7255019', '12465', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7255020', '10465', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7255021', '11463', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7255022', '12236', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7255023', '11716', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7255024', '11968', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7255025', '11335', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7255026', '10999', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7255224', '10435', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7255226', '10475', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7255227', '10762', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7255228', '10727', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7255229', '11951', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7255230', '10776', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7255295', '11289', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7255296', '11199', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7255341', '10916', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7255342', '11415', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7255558', '12740', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7255559', '12742', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7255795', '10332', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7255842', '10840', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7257408', '11198', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7260119', '10515', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7260120', '11093', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7260888', '11182', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7260889', '10430', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7260890', '11661', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7260891', '11151', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7260892', '11503', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7260893', '11429', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7260894', '10586', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7260895', '10379', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7260897', '10722', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7260898', '10860', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7260899', '11394', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7260900', '10899', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7260901', '10357', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7260903', '10439', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7260904', '11242', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7260905', '12074', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7260906', '11049', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7260907', '11507', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7260908', '11089', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7260909', '12749', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7260910', '12413', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7260911', '10563', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7260912', '11282', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7261509', '11663', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7261510', '12076', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7261511', '10508', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7261512', '11409', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7261513', '11502', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7261514', '10609', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7261515', '10581', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7261516', '11239', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7261517', '11088', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7261518', '11265', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7261519', '12455', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7261520', '11999', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7261521', '12013', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7261522', '12754', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7261523', '10951', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7261524', '10597', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7261525', '12323', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7261526', '11201', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7261527', '10326', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7261528', '10193', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7261529', '10113', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7261530', '10876', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7261531', '10494', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7261532', '10378', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7261533', '10747', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7261535', '10429', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7261536', '10300', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7261537', '10293', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7261538', '10880', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7261539', '10680', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7261540', '11984', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7261541', '10804', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7261542', '10964', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7261543', '10738', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7261544', '12763', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7261545', '10690', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7261546', '11498', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7261968', '10256', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7263697', '10262', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7263727', '10290', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7264213', '11203', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7266118', '12764', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7266240', '10235', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7266456', '12137', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7266457', '10821', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7266458', '10355', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7266459', '10596', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7266460', '10700', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7266476', '10317', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7266618', '10194', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7266645', '10094', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7266789', '11398', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7266810', '10848', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7266811', '10522', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7266976', '12105', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7266977', '10701', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7266978', '10826', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7266979', '10445', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7266980', '10721', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7266981', '11206', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7266983', '11104', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7266985', '11835', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7266990', '10095', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7267002', '10171', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7267206', '10269', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7267215', '11928', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7267216', '11412', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7267217', '10920', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7267218', '10936', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7267436', '10490', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7267437', '10504', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7267438', '10449', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7267765', '10268', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7268466', '10783', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7268467', '10959', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7268468', '11331', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7274532', '12260', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7275094', '12768', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7275096', '12770', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7275272', '11091', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7275274', '10338', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7275275', '10331', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7275276', '11652', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7275277', '10330', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7275278', '10328', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7275279', '11775', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7275280', '12184', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7275428', '10684', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7275429', '10526', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7275430', '10416', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7275431', '10425', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7275479', '10120', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7275481', '12126', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7275484', '10342', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7275656', '12783', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7282313', '10719', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7282368', '12785', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7282369', '12787', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7282372', '12789', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7282373', '12791', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7282468', '10589', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7282469', '11955', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7282474', '10484', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7283143', '12792', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7283144', '12794', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7283697', '10942', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7283698', '11393', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7283884', '11367', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7283926', '11691', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7283927', '10487', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7283928', '10513', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7283929', '10575', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7283930', '10636', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7284091', '10442', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7284092', '11053', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7284095', '11834', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7284145', '11116', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7284146', '11660', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7284172', '10904', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7284211', '10934', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7284263', '10253', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7284264', '10213', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7284265', '10128', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7284266', '10252', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7284268', '10294', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7284289', '10755', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7287783', '11273', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7287784', '10765', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7287800', '12164', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7287801', '11730', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7287802', '10532', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7287803', '10346', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7287804', '11177', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7287876', '11640', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7287877', '10749', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7287878', '11628', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7287879', '10713', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7287880', '11195', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7287881', '11281', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7287882', '10521', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7288093', '12800', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7288149', '10846', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7288150', '12015', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7288151', '12409', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7288160', '11445', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7288728', '10155', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7288827', '11782', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7288879', '10176', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7289092', '10200', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7289094', '10189', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7289131', '10147', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7289185', '10872', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7289297', '10232', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7289301', '10266', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7289302', '10372', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7289421', '10121', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7289422', '10391', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7289486', '11971', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7289487', '11114', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7289493', '11169', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7289494', '11889', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7289496', '10159', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7289702', '10464', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7290162', '10292', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7290193', '10712', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7290498', '12335', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7290499', '11700', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7292666', '10382', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7293092', '12808', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7293196', '11720', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7293197', '10460', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7293232', '10674', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7293268', '11241', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7293507', '10279', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7293829', '10511', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7293836', '12810', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7293919', '10367', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7294026', '10109', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7294042', '11085', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7294043', '10858', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7294126', '12812', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7294138', '11368', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7294165', '10886', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7294169', '12814', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7296158', '12134', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7296466', '11553', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7297147', '10127', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7297149', '10181', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7297150', '10319', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7297152', '10283', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7297155', '10245', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7297156', '10124', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7297157', '10318', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7297158', '10149', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7297159', '10123', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7297160', '10208', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7297161', '10115', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7297162', '10238', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7297163', '10219', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7297167', '10313', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7297169', '10201', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7297170', '10145', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7297172', '10246', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7297174', '10259', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7297175', '10243', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7297176', '10165', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7297178', '10140', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7297181', '10197', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7297186', '10205', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7297188', '10106', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7297189', '10172', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7297190', '10097', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7297192', '10178', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7297193', '10111', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7297195', '10302', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7297197', '10228', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7297198', '10251', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7297200', '10304', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7297238', '10271', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7297240', '10169', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7297311', '10223', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7297315', '10321', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7297489', '11162', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7297593', '12206', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7297619', '10224', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7297726', '11593', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7297799', '10659', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7297859', '10132', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7297865', '10133', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7297893', '10161', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7297894', '12815', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7297895', '10136', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7298326', '10114', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7301543', '10519', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7301698', '10873', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7301714', '10249', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7301758', '11525', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7301795', '10191', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7301920', '10309', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7302058', '10167', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7302061', '10102', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7302062', '10247', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7302064', '10139', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7302070', '10195', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7302266', '10270', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7302538', '11181', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7302619', '10864', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7303110', '12819', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7303464', '10126', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7303589', '10272', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7303593', '10305', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7303595', '10198', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7303602', '12482', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7303682', '10216', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7303795', '10373', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7303800', '10993', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7303801', '12249', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7303802', '11470', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7303803', '12182', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7303948', '10576', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7303955', '12823', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7303956', '11678', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7304571', '12047', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7304858', '11486', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7304916', '11324', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7305150', '10529', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7305281', '11255', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7305282', '11537', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7306239', '10217', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7306242', '10295', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7306270', '10296', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7306331', '10297', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7306716', '10179', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7306926', '10474', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7306932', '11760', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7306946', '10639', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7306960', '11620', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7306961', '11153', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7306962', '10410', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7306963', '10345', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7306964', '11290', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7306965', '10908', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7306966', '10890', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7306967', '11299', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7306968', '10548', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7306969', '10566', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7306970', '11261', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7306971', '10739', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7306972', '10686', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7308836', '11611', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7308842', '12250', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7309097', '10112', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7309550', '10156', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7309876', '10377', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7309877', '11741', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7309878', '12073', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7309898', '11916', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7309899', '11336', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7312291', '10845', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7312674', '10248', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7312711', '10218', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7312847', '10174', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7312972', '10275', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7312979', '10273', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7313139', '10254', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7313289', '10196', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7313290', '10312', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7313291', '10164', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7313292', '10230', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7313297', '10280', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7314939', '11307', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7314940', '11067', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7316933', '10103', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7316934', '10233', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7317217', '10141', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7317220', '10188', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7317842', '11163', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7317931', '12828', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7318144', '10117', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7319339', '12053', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7322081', '10110', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7332445', '10311', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7339497', '10231', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7339513', '12830', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7340275', '10168', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7340285', '10824', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7340306', '11549', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7340349', '10129', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7340356', '10299', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7340419', '10170', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7340421', '10307', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7346645', '10202', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7355845', '10274', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7356380', '10291', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7356390', '10173', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7356394', '10731', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7356396', '10469', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7359784', '11753', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7359866', '11074', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7359953', '11421', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7360716', '10830', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7360724', '10278', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7360725', '10250', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7360738', '12006', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7360741', '10802', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7360749', '10414', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7360750', '10341', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7367334', '11446', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7380633', '10119', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7381123', '10657', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7385077', '10210', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7389698', '10221', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7389725', '10287', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7389729', '10229', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7389876', '10242', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7389881', '10204', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7389882', '10100', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7389884', '10255', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7389886', '10308', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7389892', '10203', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7390059', '10150', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7390060', '10177', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7390061', '10234', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7391046', '11410', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7392012', '12855', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7392148', '10105', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7392551', '10482', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7393308', '11562', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7393309', '11099', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7403699', '12885', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7405438', '10320', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7405444', '10310', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7406075', '10122', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7409949', '10381', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7412186', '10664', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7412635', '10303', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7412637', '10239', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7412676', '10842', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7412693', '10944', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7412694', '10398', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7412695', '10784', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7412696', '10960', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7412697', '10704', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7412698', '10867', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7412699', '10748', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7412700', '10619', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7412701', '11403', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7412702', '10626', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7412703', '10924', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7412704', '11748', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7413547', '11167', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7413910', '10923', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7413915', '10227', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7422943', '12892', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7422944', '12894', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7423399', '10118', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7423459', '10327', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7423465', '12899', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7423645', '12901', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7423646', '12903', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7423802', '10212', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7424525', '11865', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7424581', '12906', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7424582', '10472', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7424586', '10641', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7424604', '11714', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7424616', '10137', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7424645', '12909', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7424655', '10107', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7491715', '10131', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7491720', '11079', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7523533', '10257', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7523856', '10737', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7547483', '12911', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7580137', '10818', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7580805', '10393', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7582179', '10480', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7585817', '10782', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7587930', '12453', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7588046', '11464', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7588256', '10163', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7588274', '10436', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7592488', '10180', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7592490', '10152', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7598211', '10889', IDLabelSet, records);
    // #endregion

    // #region master_list
    await handleResultsWithIDs(ICol, 'edanmdm:acm_1996.0008.0001', '999', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:chndm_1907-1-40', '20', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:chndm_1910-12-1', '7', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:chndm_1910-41-1', '3', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:chndm_1913-45-9-a_b', '9', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:chndm_1916-19-83-a_b', '12', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:chndm_1924-6-1', '5', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:chndm_1931-48-73', '24', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:chndm_1938-57-306-a_b', '29', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:chndm_1938-58-1083', '1', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:chndm_1949-64-7', '11', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:chndm_1959-144-1', '2', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:chndm_1962-67-1', '25', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:chndm_1971-48-12', '4', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:chndm_1972-79-2', '21', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:chndm_1984-84-36', '22', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:chndm_1985-103-49', '17', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:chndm_1985-103-50', '13', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:chndm_1985-103-51', '16', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:chndm_1985-103-52', '15', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:chndm_1985-103-81', '14', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:chndm_1985-103-82', '27', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:chndm_1990-133-3', '30', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:chndm_1994-73-2', '19', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:chndm_2003-3-1', '18', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:chndm_2006-5-1', '6', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:chndm_2007-45-13', '23', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:chndm_2007-45-14', '28', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:chndm_2011-28-1', '8', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:chndm_2011-31-1', '26', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:chndm_Carnegie_Mansion', '33', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200001', '146', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200002', '147', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200003', '148', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200004', '142', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200005', '143', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200008', '145', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200009', '784', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200010', '869', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200012', '957', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200013', '175', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200014', '883', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200015', '444', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200016', '446', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200017', '447', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200018', '443', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200019', '445', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200020', '442', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200021', '859', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200023', '861', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200026', '857', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200028', '391', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200029', '390', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200030', '393', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200031', '395', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200032', '394', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200033', '396', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200034', '389', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200036', '398', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200038', '887', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200039', '550', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200117', '953', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200118', '956', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200119', '958', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200120', '952', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200121', '959', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200122', '954', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200123', '951', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200124', '955', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200129', '1001', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1908.236', '877', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1915.109', '113', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1916.345', '110', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1921.1', '111', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1921.2', '112', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1923.15', '875', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1930.54a-b', '108', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1936.6a-b', '870', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1947.15a-b', '876', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1961.33a-b', '109', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1978.40', '45', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1980.14a-c', '57', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1980.191a-c', '55', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1980.192a-c', '56', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1980.193a-b', '64', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1980.194a-b', '63', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1982.15a-c', '62', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1982.16a-b', '93', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1982.17', '46', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1982.18a-b', '67', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1982.19a-b', '47', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1982.20a-b', '68', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1982.21a-b', '103', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1982.22a-b', '104', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1986.19a-b', '48', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1986.20a-b', '81', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1986.21a-c', '82', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1986.4a-b', '101', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1989.1', '65', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1991.46', '94', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1991.48a-b', '49', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1991.49', '69', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1991.50', '70', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1991.51', '95', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1991.58', '91', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1991.59', '105', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1991.60', '106', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1991.61a-b', '96', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1991.62', '97', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1992.10a-b', '88', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1992.11a-b', '87', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1992.13.1', '107', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1992.13.2', '50', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1992.14a-b', '89', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1992.15.1', '92', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1992.25', '80', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1992.27.1', '60', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1992.27.2', '61', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1992.3', '51', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1992.33', '66', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1992.34.1', '76', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1992.34.2', '77', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1992.46', '98', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1992.47.1', '58', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1992.47.2', '59', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1992.47.3a-b', '84', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1992.47.4a-c', '85', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1992.47.5a-b', '86', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1992.48.1', '79', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1992.48.2', '78', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1992.56', '102', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1992.6', '74', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1992.7', '75', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1993.10a-b', '83', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1993.7.1', '99', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1993.7.2', '100', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1994.26.1', '52', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1994.26.2', '71', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F1995.3.2a-b', '54', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F2002.10.1', '72', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F2002.10.2', '73', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F2004.37.1a-c', '53', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:fsg_F2004.37.2a-c', '90', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:hmsg_01.9', '137', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:hmsg_06.15', '140', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:hmsg_66.3867', '138', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:hmsg_93.6', '136', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:hmsg_94.13', '139', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nasm_A19280021000', '184', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nasm_A19330035008', '199', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nasm_A19330055000', '191', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nasm_A19510007000', '182', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nasm_A19540108000', '201', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nasm_A19610048000', '202', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nasm_A19700102000', '176', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nasm_A19730040001', '172', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nasm_A19791810000', '179', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nasm_A19850354000', '200', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nasm_A20050459000', '183', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nasm_A20110028000', '189', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nasm_A20120325000', '891', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmaahc_2007.3.8.4ab', '206', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmaahc_2007.5.1ab', '207', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmaahc_2010.19.3', '227', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmaahc_2010.22.5', '961', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmaahc_2011.118.4ab', '232', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmaahc_2011.128.2ab', '210', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmaahc_2011.143.3.2ab', '226', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmaahc_2011.159.6', '213', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmaahc_2011.163.8ab', '214', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmaahc_2011.46.1', '220', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmaahc_2011.51.3', '892', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmaahc_2011.61', '842', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmaahc_2012.113.2', '209', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmaahc_2013.141.1', '215', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmaahc_2013.203', '960', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmaahc_2013.39.7', '208', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmaahc_2014.210.3', '216', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmaahc_2014.2ab', '221', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmaahc_2014.46.5ab', '231', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmaahc_2014.63.59', '212', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmaahc_2015.115.1ab', '228', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmaahc_2015.2.4', '211', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmaahc_2015.247.3', '878', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmaahc_2017.108.1.1', '843', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmaahc_2016.152.2', '230', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmaahc_2018.35.2.1ab', '845', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmaahc_2019.10.1a-g', '901', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmafa_2005-6-17', '240', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmafa_2005-6-9', '241', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmafa_2007-1-1', '242', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmafa_2007-1-2', '243', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmafa_2007-1-3', '244', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmafa_74-20-1', '247', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmafa_74-20-2', '250', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmafa_79-16-47', '253', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmafa_96-28-1', '254', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmafa_96-30-1', '255', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1000981', '296', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1000982', '294', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1000984', '295', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1004508', '258', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1029149', '276', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1029284', '277', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1067617', '931', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1096762', '39', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1105750', '127', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1108470', '383', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1115230', '995', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1119952', '912', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1119993', '915', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1119996', '913', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1176044', '977', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1190328', '921', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1199660', '893', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1213013', '932', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1250962', '372', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1251889', '318', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1251903', '335', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1272680', '315', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1299584', '964', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1313926', '942', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1362083', '908', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1373402', '910', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1384201', '1003', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1442917', '922', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1466341', '996', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1764061', '126', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1814486', '943', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1814487', '944', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1816008', '308', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1816562', '358', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1816726', '350', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1816728', '351', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1818990', '362', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1819275', '924', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1819291', '925', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1819662', '352', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1820223', '314', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1820541', '363', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1821317', '359', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1822363', '360', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1827970', '949', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1827973', '340', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1827978', '344', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1828021', '336', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1828030', '337', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1828078', '338', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1828119', '339', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1828170', '341', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1828269', '342', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1828429', '343', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1828505', '345', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1828510', '346', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1828628', '347', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1828648', '348', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1828839', '307', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1828842', '349', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1829185', '380', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1829332', '373', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1829524', '374', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1829535', '375', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1829542', '376', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1830215', '377', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1832532', '321', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1832985', '378', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1837459', '298', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1837609', '322', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1837621', '323', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1838349', '299', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1838643', '324', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1838644', '325', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1838650', '326', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1838652', '327', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1838676', '300', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1841103', '904', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1841912', '353', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1841933', '354', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1842503', '355', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1843368', '301', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1845461', '316', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1846255', '331', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1846271', '303', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1846281', '304', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1846344', '305', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1846377', '332', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1846388', '306', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1846391', '319', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1847611', '132', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1847873', '328', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1848079', '302', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1849041', '356', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1849265', '333', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1850922', '309', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1851521', '357', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1853623', '381', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1856918', '976', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1859204', '926', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1864497', '965', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1864503', '972', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1872415', '379', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1883787', '905', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1892964', '980', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1896978', '117', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1900832', '118', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1911863', '124', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1914660', '927', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1918277', '948', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1918278', '947', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1918792', '963', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1918810', '975', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1919673', '979', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1919675', '969', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1922948', '971', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1922952', '974', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1922956', '968', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1922965', '973', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1952283', '962', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1952311', '967', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1952312', '978', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1954262', '918', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1968767', '950', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1969723', '928', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_214477', '283', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_361750', '123', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_362153', '119', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_363781', '128', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_364445', '122', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_365584', '906', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_365585', '134', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_365586', '135', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_368509', '133', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_373625', '116', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_375161', '131', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_463506', '889', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_601110', '997', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_602097', '1000', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_602452', '998', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_605482', '256', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_605485', '263', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_605487', '264', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_605498', '265', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_605500', '267', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_605503', '270', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_605507', '271', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_605519', '293', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_605596', '274', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_606746', '273', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_607621', '272', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_607647', '262', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_676823', '970', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_679431', '933', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_682733', '902', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_688775', '966', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_689864', '36', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_703292', '37', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_703302', '38', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_703318', '40', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_703325', '43', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_705564', '41', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_712417', '44', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_739714', '288', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_739715', '290', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_739716', '284', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_748877', '945', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_748878', '917', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_748903', '114', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_763853', '257', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_911374', '310', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_911375', '361', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_920560', '311', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_920740', '297', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_923037', '365', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_923043', '371', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_923083', '366', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_923113', '367', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_923116', '368', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_923122', '312', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_923126', '369', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_923135', '313', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhanthropology_8010183', '412', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhanthropology_8010185', '411', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhanthropology_8010270', '428', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhanthropology_8061118', '402', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhanthropology_8061135', '404', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhanthropology_8061530', '405', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhanthropology_8061534', '406', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhanthropology_8061757', '407', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhanthropology_8061963', '401', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhanthropology_8096367', '413', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhanthropology_8098412', '414', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhanthropology_8098584', '415', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhanthropology_8099755', '416', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhanthropology_8100879', '417', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhanthropology_8108582', '418', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhanthropology_8108704', '419', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhanthropology_8108706', '420', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhanthropology_8109761', '422', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhanthropology_8114628', '781', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhanthropology_8114952', '423', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhanthropology_8115528', '424', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhanthropology_8115597', '425', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhanthropology_8131572', '431', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhanthropology_8131573', '432', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhanthropology_8131574', '433', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhanthropology_8131634', '434', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhanthropology_8131636', '435', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhanthropology_8131639', '436', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhanthropology_8135263', '437', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhanthropology_8145707', '426', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhanthropology_8146561', '427', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhanthropology_8168564', '874', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhanthropology_8319024', '408', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhanthropology_8344757', '882', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhanthropology_8358271', '438', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhanthropology_8386869', '409', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhanthropology_8440830', '430', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhanthropology_8471498', '439', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhanthropology_8480378', '440', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhanthropology_8480424', '429', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhanthropology_8552275', '568', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhanthropology_8552277', '569', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhanthropology_8552280', '570', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhanthropology_8552281', '571', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhanthropology_8939937', '410', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnheducation_10815597', '531', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnheducation_11380100', '171', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnheducation_11380180', '167', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnheducation_11412946', '163', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnheducation_11413164', '168', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnheducation_15006160', '152', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_10041048', '461', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_10166790', '457', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_10197893', '524', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_10273681', '458', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_10530', '459', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_10703', '460', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_10795', '537', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_11009', '514', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_11042783', '472', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_11058167', '544', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_11162', '538', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_11277082', '510', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_11949', '463', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_12306', '465', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_12487', '466', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_13079', '467', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_13080', '468', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_13082', '469', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_13587547', '548', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_13935', '518', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_14138516', '525', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_14379', '470', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_14559108', '508', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_14572', '523', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_14586', '522', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_14674', '471', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_14843', '539', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_14861', '473', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_15163', '519', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_15463', '475', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_16050', '521', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_16151', '520', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_16552', '476', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_17174', '540', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_17182', '478', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_17325', '479', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_17352', '480', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_17355', '481', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_17478', '482', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_17480', '517', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_17505', '483', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_17599', '543', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_17749', '485', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_17764', '448', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_18131', '505', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_22484', '488', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_22889', '549', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_28962', '535', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_29968', '509', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_30966', '489', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_31148', '490', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_323138', '504', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_36632', '491', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_38482', '492', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_42089', '493', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_44873', '512', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_45832', '494', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_45849', '547', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_46797', '496', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_48206', '497', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_48461', '498', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_51231', '528', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_53176', '526', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_536521', '534', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_55480', '499', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_55498', '515', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_61392', '500', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_62922', '501', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_62996', '502', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_65106', '503', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_65179', '516', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_79438', '532', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_810553', '513', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_821965', '533', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_9333269', '506', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_942321', '450', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_942505', '451', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_942916', '452', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_949688', '530', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_949712', '507', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_950401', '454', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_957075', '527', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_957085', '487', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_957944', '486', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_962463', '455', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhinvertebratezoology_970701', '456', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_10016796', '716', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_10016797', '717', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_10016802', '718', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_10016803', '719', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_10016808', '720', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_10250729', '158', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_10369553', '553', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_10611715', '721', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_10611750', '744', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_11231535', '821', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_11467726', '695', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_11635207', '722', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_11825684', '809', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_11872942', '751', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_12307021', '698', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_12307068', '745', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_12307073', '708', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_12307093', '683', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_12307115', '749', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_12307176', '768', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_12307204', '678', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_12307212', '164', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_12307214', '770', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_12307233', '723', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_12307240', '724', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_12307243', '772', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_16463872', '1002', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3001151', '691', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3007346', '747', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3007506', '725', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3022367', '165', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3109802', '715', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3114250', '727', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3122122', '728', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3122141', '752', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3126953', '773', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3129300', '774', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3137102', '753', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3176889', '709', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3176892', '710', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3176902', '711', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3176903', '712', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3179870', '811', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3188143', '763', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3188192', '713', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3188200', '714', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3188809', '766', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3302876', '160', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3302895', '823', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3309799', '690', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3318324', '897', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3324894', '819', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3332832', '822', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3333940', '815', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3340244', '705', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3341924', '699', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3341937', '700', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3341954', '688', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3342215', '701', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3342697', '742', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3342978', '735', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3368445', '817', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3368446', '818', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3368531', '816', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3369538', '154', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3370783', '156', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3377843', '734', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3384611', '834', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3385086', '692', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3389255', '824', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3393299', '812', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3393300', '813', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3393301', '814', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3393407', '820', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3393409', '831', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3393470', '830', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3397958', '696', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3415628', '702', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3421187', '758', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3423820', '779', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3425397', '776', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3425518', '731', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3427467', '778', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3427676', '703', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3427760', '729', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3427936', '833', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3427971', '733', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3428171', '739', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3428214', '740', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3428388', '826', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3429219', '730', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3431464', '556', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3431469', '552', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3439417', '754', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3439470', '732', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3440470', '810', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3440721', '694', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3446186', '871', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3446197', '673', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3447044', '155', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3447759', '790', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3447777', '884', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3448898', '741', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3448991', '693', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3449928', '746', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3450090', '755', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3450091', '737', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3450092', '738', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3450132', '756', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3451037', '743', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3451097', '793', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3451166', '706', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3453577', '780', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3457273', '161', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3457297', '827', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3457406', '829', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3457407', '832', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3572783', '900', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3577488', '162', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3580352', '157', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_4091696', '611', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_4092671', '593', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_4103596', '578', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_4103600', '584', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_4105734', '617', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_4113049', '599', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_4113270', '602', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_4113913', '620', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_4114243', '581', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_4114544', '572', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_4115950', '625', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_4119824', '614', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_4123288', '590', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_4123616', '596', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_4125718', '575', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_4175860', '608', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_4278661', '605', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_5036822', '453', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_5144419', '529', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_5148470', '464', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_5152704', '474', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_6341612', '511', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7289628', '149', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7413792', '551', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7511097', '150', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhvz_7511102', '151', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:npg_NPG.2006.5', '800', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:npg_NPG.2008.3', '801', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:npg_NPG.70.4', '797', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:npg_NPG.71.24', '802', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:npg_NPG.71.26', '803', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:npg_NPG.74.16', '804', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:npg_NPG.75.16', '899', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:npg_NPG.75.17', '898', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:npg_NPG.76.27', '805', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:npg_NPG.82.TC83', '806', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:npg_NPG.85.8', '807', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:npg_NPG.99.112', '808', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:npg_S_NPG.71.6', '796', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:npm_0.279483.3', '885', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:ofeo-sg_2008-1264A', '847', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:saam_1910.10.3', '886', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:saam_1968.155.136', '840', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:saam_1968.155.8', '841', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:siris_sil_1044709', '888', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'http://n2t.net/ark:/65665/3c32276ea-e29b-49b7-b699-2a57a621b6e6', '567', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'http://n2t.net/ark:/65665/3c34fa78d-02b8-4c1e-8a2a-2429ef6ab6a1', '689', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'https://collection.cooperhewitt.org/objects/18726645/', '10', IDLabelSet, records);

    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200001', 'dpo_3d_200001', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200002', 'dpo_3d_200002', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200003', 'dpo_3d_200003', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200004', 'dpo_3d_200004', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200005', 'dpo_3d_200005', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200006', 'dpo_3d_200006', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200007', 'dpo_3d_200007', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200008', 'dpo_3d_200008', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200009', 'dpo_3d_200009', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200010', 'dpo_3d_200010', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200011', 'dpo_3d_200011', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200012', 'dpo_3d_200012', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200013', 'dpo_3d_200013', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200014', 'dpo_3d_200014', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200015', 'dpo_3d_200015', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200016', 'dpo_3d_200016', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200017', 'dpo_3d_200017', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200018', 'dpo_3d_200018', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200019', 'dpo_3d_200019', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200020', 'dpo_3d_200020', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200021', 'dpo_3d_200021', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200022', 'dpo_3d_200022', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200023', 'dpo_3d_200023', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200024', 'dpo_3d_200024', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200025', 'dpo_3d_200025', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200026', 'dpo_3d_200026', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200027', 'dpo_3d_200027', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200028', 'dpo_3d_200028', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200029', 'dpo_3d_200029', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200030', 'dpo_3d_200030', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200031', 'dpo_3d_200031', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200032', 'dpo_3d_200032', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200033', 'dpo_3d_200033', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200034', 'dpo_3d_200034', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200035', 'dpo_3d_200035', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200036', 'dpo_3d_200036', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200037', 'dpo_3d_200037', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200038', 'dpo_3d_200038', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200039', 'dpo_3d_200039', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200040', 'dpo_3d_200040', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200041', 'dpo_3d_200041', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200042', 'dpo_3d_200042', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200043', 'dpo_3d_200043', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200044', 'dpo_3d_200044', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200045', 'dpo_3d_200045', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200046', 'dpo_3d_200046', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200047', 'dpo_3d_200047', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200048', 'dpo_3d_200048', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200049', 'dpo_3d_200049', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200050', 'dpo_3d_200050', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200051', 'dpo_3d_200051', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200052', 'dpo_3d_200052', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200053', 'dpo_3d_200053', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200054', 'dpo_3d_200054', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200055', 'dpo_3d_200055', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200056', 'dpo_3d_200056', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200057', 'dpo_3d_200057', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200058', 'dpo_3d_200058', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200059', 'dpo_3d_200059', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200060', 'dpo_3d_200060', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200061', 'dpo_3d_200061', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200062', 'dpo_3d_200062', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200063', 'dpo_3d_200063', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200064', 'dpo_3d_200064', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200065', 'dpo_3d_200065', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200066', 'dpo_3d_200066', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200067', 'dpo_3d_200067', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200068', 'dpo_3d_200068', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200069', 'dpo_3d_200069', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200070', 'dpo_3d_200070', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200071', 'dpo_3d_200071', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200072', 'dpo_3d_200072', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200073', 'dpo_3d_200073', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200074', 'dpo_3d_200074', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200075', 'dpo_3d_200075', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200076', 'dpo_3d_200076', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200077', 'dpo_3d_200077', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200078', 'dpo_3d_200078', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200079', 'dpo_3d_200079', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200080', 'dpo_3d_200080', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200081', 'dpo_3d_200081', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200082', 'dpo_3d_200082', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200083', 'dpo_3d_200083', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200084', 'dpo_3d_200084', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200085', 'dpo_3d_200085', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200086', 'dpo_3d_200086', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200087', 'dpo_3d_200087', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200088', 'dpo_3d_200088', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200089', 'dpo_3d_200089', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200090', 'dpo_3d_200090', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200091', 'dpo_3d_200091', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200092', 'dpo_3d_200092', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200093', 'dpo_3d_200093', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200094', 'dpo_3d_200094', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200095', 'dpo_3d_200095', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200096', 'dpo_3d_200096', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200097', 'dpo_3d_200097', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200098', 'dpo_3d_200098', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200099', 'dpo_3d_200099', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200100', 'dpo_3d_200100', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200101', 'dpo_3d_200101', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200102', 'dpo_3d_200102', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200103', 'dpo_3d_200103', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200104', 'dpo_3d_200104', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200105', 'dpo_3d_200105', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200106', 'dpo_3d_200106', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200107', 'dpo_3d_200107', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200108', 'dpo_3d_200108', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200109', 'dpo_3d_200109', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200110', 'dpo_3d_200110', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200111', 'dpo_3d_200111', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200112', 'dpo_3d_200112', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200113', 'dpo_3d_200113', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200114', 'dpo_3d_200114', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200115', 'dpo_3d_200115', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200116', 'dpo_3d_200116', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200117', 'dpo_3d_200117', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200118', 'dpo_3d_200118', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200119', 'dpo_3d_200119', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200120', 'dpo_3d_200120', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200121', 'dpo_3d_200121', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200122', 'dpo_3d_200122', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200123', 'dpo_3d_200123', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200124', 'dpo_3d_200124', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200125', 'dpo_3d_200125', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200126', 'dpo_3d_200126', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200127', 'dpo_3d_200127', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200128', 'dpo_3d_200128', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200129', 'dpo_3d_200129', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200130', 'dpo_3d_200130', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200131', 'dpo_3d_200131', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200132', 'dpo_3d_200132', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200133', 'dpo_3d_200133', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200134', 'dpo_3d_200134', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200135', 'dpo_3d_200135', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200136', 'dpo_3d_200136', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200137', 'dpo_3d_200137', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200138', 'dpo_3d_200138', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200139', 'dpo_3d_200139', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200140', 'dpo_3d_200140', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200141', 'dpo_3d_200141', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200142', 'dpo_3d_200142', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200143', 'dpo_3d_200143', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200144', 'dpo_3d_200144', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200145', 'dpo_3d_200145', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200146', 'dpo_3d_200146', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200147', 'dpo_3d_200147', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200148', 'dpo_3d_200148', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200149', 'dpo_3d_200149', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200150', 'dpo_3d_200150', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nasm_A19730040002', '173', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nasm_A19730040003', '173', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200006', '141', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nasm_A19730040000', '180', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nasm_A19730040001', '180', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nasm_A19730040002', '180', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nasm_A19730040003', '180', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_10250729', '204', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3572783', '204', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200035', '399', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200036', '399', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhanthropology_8477947', '388', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhanthropology_8478070', '388', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1904639', '121', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1904641', '121', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1904656', '121', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1449492', '120', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1449498', '120', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1927378', '115', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1939648', '115', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1939650', '115', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1939654', '115', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1442896', '923', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1121083', '936', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_748896', '936', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1119960', '937', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1119964', '937', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1691697', '914', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1692144', '914', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1692150', '914', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1841743', '916', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1841746', '916', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1841749', '916', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1841750', '916', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1841752', '916', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1277512', '903', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1277513', '903', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1067111', '920', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1067112', '920', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1801982', '930', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1801983', '930', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1801984', '930', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_681358', '935', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_681359', '935', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_681360', '935', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_681361', '935', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_681362', '935', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1296216', '910', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1296217', '910', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1289214', '907', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1289216', '907', IDLabelSet, records);
    // #endregion
}

async function scrapeDPOEdanListIDsWorker(ICol: COL.ICollection, IDLabelSet: Set<string>, records: EdanResult[]): Promise<void> {
    await handleResultsWithIDs(ICol, 'edanmdm:nasm_A19730040002', '173', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nasm_A19730040003', '173', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200006', '141', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nasm_A19730040000', '180', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nasm_A19730040001', '180', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nasm_A19730040002', '180', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nasm_A19730040003', '180', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_10250729', '204', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhpaleobiology_3572783', '204', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200035', '399', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:dpo_3d_200036', '399', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhanthropology_8477947', '388', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmnhanthropology_8478070', '388', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1904639', '121', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1904641', '121', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1904656', '121', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1449492', '120', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1449498', '120', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1927378', '115', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1939648', '115', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1939650', '115', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1939654', '115', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1442896', '923', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1121083', '936', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_748896', '936', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1119960', '937', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1119964', '937', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1691697', '914', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1692144', '914', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1692150', '914', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1841743', '916', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1841746', '916', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1841749', '916', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1841750', '916', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1841752', '916', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1277512', '903', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1277513', '903', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1067111', '920', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1067112', '920', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1801982', '930', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1801983', '930', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1801984', '930', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_681358', '935', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_681359', '935', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_681360', '935', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_681361', '935', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_681362', '935', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1296216', '910', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1296217', '910', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1289214', '907', IDLabelSet, records);
    await handleResultsWithIDs(ICol, 'edanmdm:nmah_1289216', '907', IDLabelSet, records);
}

// #region Handle Results
async function handleResultsEdanLists(ICol: COL.ICollection, WS: NodeJS.WritableStream | null, query: string, id: string, unitFilter?: string | undefined): Promise<boolean> {
    const options: COL.CollectionQueryOptions = { searchMetadata: true, gatherRaw: true };

    for (let retry: number = 1; retry <= 5; retry++) {
        const results: COL.CollectionQueryResults | null = await ICol.queryCollection(query.trim(), 10, 0, options);
        // LOG.info(`*** Edan Scrape: ${H.Helpers.JSONStringify(results)}`, LOG.LS.eTEST);
        if (results) {
            if (results.error)
                LOG.info(`*** Edan Scrape [${id}] ERROR for '${query}': ${results.error}`, LOG.LS.eTEST);

            for (const record of results.records) {
                const items = record?.raw?.content?.items;
                if (!WS)
                    LOG.info(`EDAN Query(${query}): ${H.Helpers.JSONStringify(record)}`, LOG.LS.eTEST);
                else if (items) {
                    for (const item of items) {
                        if (!unitFilter || record.unit == unitFilter)
                            WS.write(`${id}\t${record.name.replace(/\r?\n|\r/g, ' ')}\t${record.unit}\t${record.identifierPublic}\t${item}\t${results.records.length}\n`);
                    }
                } else if (!unitFilter || record.unit == unitFilter)
                    WS.write(`${id}\t${record.name.replace(/\r?\n|\r/g, ' ')}\t${record.unit}\t${record.identifierPublic}\t${record.identifierCollection}\t${results.records.length}\n`);
            }
            return true;
        }
    }
    LOG.error(`*** Edan Scrape [${id}] failed for '${query}'`, LOG.LS.eTEST);
    return false;
}

async function handleResultsWithIDs(ICol: COL.ICollection, query: string, id: string,
    IDLabelSet: Set<string>, records: EdanResult[], gatherRaw?: boolean): Promise<boolean> {

    for (let retry: number = 1; retry <= 5; retry++) {
        const results: COL.CollectionQueryResults | null = await ICol.queryCollection(query.trim(), 10, 0, { gatherIDMap: true, gatherRaw });
        // LOG.info(`*** Edan Scrape: ${H.Helpers.JSONStringify(results)}`, LOG.LS.eTEST);
        if (results) {
            if (results.error)
                LOG.info(`*** Edan Scrape [${id}] ERROR for '${query}': ${results.error}`, LOG.LS.eTEST);

            for (const record of results.records) {
                const IDMap: Map<string, string> = new Map<string, string>();
                if (record.identifierMap) {
                    for (const [ label, content ] of record.identifierMap) {
                        if (label && content) {
                            const labelNormalized = label.toLowerCase();
                            IDMap.set(labelNormalized, content);
                            IDLabelSet.add(labelNormalized);
                        }
                    }
                }

                records.push({
                    id,
                    name: record.name.replace(/\r?\n|\r/g, ' '),
                    unit: record.unit,
                    identifierPublic: record.identifierPublic,
                    identifierCollection: record.identifierCollection,
                    records: results.records.length,
                    IDMap,
                    raw: record.raw
                });

                // LOG.info(`EDAN Query(${query}): ${H.Helpers.JSONStringify(record)}`, LOG.LS.eTEST);
            }
            return true;
        }
    }
    LOG.error(`*** Edan Scrape [${id}] failed for '${query}'`, LOG.LS.eTEST);
    return false;
}
// #endregion

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
// #endregion