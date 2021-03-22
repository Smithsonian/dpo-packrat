/* eslint-disable @typescript-eslint/no-explicit-any */

import { IJob, IJobEngine, JobFactory } from '../../../job/interface';
import { JOB_TYPE } from '../../../config';
import { eVocabularyID } from '../../../cache';

import * as COOK from '../../../job/impl/Cook';
import * as DBAPI from '../../../db';
import * as H from '../../../utils/helpers';
import * as LOG from '../../../utils/logger';
import * as CACHE from '../../../cache';
import * as TESTMODEL from '../../db/composite/Model.setup';

let jobEngine: IJobEngine | null = null;
let modelTestAvailable: boolean | null = null;
let MTS: TESTMODEL.ModelTestSetup | null = null;
const JobSet: Set<IJob> = new Set<IJob>();

afterAll(async done => {
    await H.Helpers.sleep(5000);
    done();
});

describe('Job NS Init', () => {
    test('JobFactory.getInstance', async () => {
        jest.setTimeout(350000);
        jobEngine = await JobFactory.getInstance(JOB_TYPE.NODE_SCHEDULE);
        expect(jobEngine).toBeTruthy();

        MTS = new TESTMODEL.ModelTestSetup();
        modelTestAvailable = await MTS.initialize();
        expect(modelTestAvailable === null || modelTestAvailable).toBeTruthy(); // null means that model test files were not available, which is ok
    });
});

describe('Job NS Cook Tests', () => {
    // create a set of test models matching JB's test data <-- this is a test object ... -> which has ingested asset versions
    // launch job by id and by type, for each of the test data
    // confirm job output matches expectations
    // confirm DB job and jobrun are created and in correct state
    // test job cancellation
    test('IJob.Cook si-packrat-inspect', async () => {
        expect(await testCookExplicit('fbx-stand-alone', eVocabularyID.eJobJobTypeCookSIPackratInspect)).toBeTruthy();
        expect(await testCookImplicit('fbx-with-support', eVocabularyID.eJobJobTypeCookSIPackratInspect)).toBeTruthy();
        expect(await testCookExplicit('glb', eVocabularyID.eJobJobTypeCookSIPackratInspect)).toBeTruthy();
        expect(await testCookImplicit('obj', eVocabularyID.eJobJobTypeCookSIPackratInspect)).toBeTruthy();
        expect(await testCookExplicit('ply', eVocabularyID.eJobJobTypeCookSIPackratInspect)).toBeTruthy();
        expect(await testCookImplicit('stl', eVocabularyID.eJobJobTypeCookSIPackratInspect)).toBeTruthy();
        expect(await testCookImplicit('x3d', eVocabularyID.eJobJobTypeCookSIPackratInspect)).toBeTruthy();

        // Not yet supported by cook's si-packrat-inspect, as of 2021-03-22
        // expect(await testCookExplicit('usd', eVocabularyID.eJobJobTypeCookSIPackratInspect)).toBeTruthy();
        // expect(await testCookImplicit('usdz', eVocabularyID.eJobJobTypeCookSIPackratInspect)).toBeTruthy();
        // expect(await testCookExplicit('wrl', eVocabularyID.eJobJobTypeCookSIPackratInspect)).toBeTruthy();
    });

    test('IJob.Cook invalid job IDs', async () => {
        // expected failures:
        expect(await testCreateByID(0, undefined, null, null, false)).toBeFalsy();
        expect(await testCreateByType(eVocabularyID.eNone, undefined, null, null, false)).toBeFalsy();
    });

    test('IJob.Cook Job Completion', async() => {
        const jobFinalizationList: Promise<H.IOResults>[] = [];
        for (const job of JobSet)
            jobFinalizationList.push(job.waitForCompletion(300000));

        const resultsArray = await Promise.all(jobFinalizationList);
        for (const res of resultsArray)
            expect(res.success).toBeTruthy();
    });
});

async function testCookExplicit(testCase: string, eJobType: eVocabularyID): Promise<boolean> {
    LOG.logger.info(`JobNS.test testCook('${testCase}): ${eVocabularyID[eJobType]} explicit IJob.executeJob`);
    const assetVersionIDs: number[] | undefined = MTS?.getTestCase(testCase)?.assetVersionIDs;
    expect(assetVersionIDs).toBeTruthy();
    const parameters: any = computeJobParameters(testCase, eJobType);
    expect(parameters).toBeTruthy();

    const job: IJob | null = await testCreateByType(eJobType, assetVersionIDs, parameters, null, true);
    expect(job).toBeTruthy();
    if (!job)
        return false;

    JobSet.add(job);
    /*
    const res: H.IOResults = await job.executeJob(new Date());
    expect(res.success).toBeTruthy();
    return res.success;
    */
    job.executeJob(new Date()); // don't use await ... instead, the main loop will wait for completion of all jobs
    return true;
}

async function testCookImplicit(testCase: string, eJobType: eVocabularyID): Promise<boolean> {
    LOG.logger.info(`JobNS.test testCook('${testCase}): ${eVocabularyID[eJobType]} implicit IJob.executeJob`);
    const assetVersionIDs: number[] | undefined = MTS?.getTestCase(testCase)?.assetVersionIDs;
    expect(assetVersionIDs).toBeTruthy();
    const parameters: any = computeJobParameters(testCase, eJobType);
    expect(parameters).toBeTruthy();

    const idVJobType: number | undefined = await computeVocabularyDBID(eVocabularyID.eJobJobTypeCookSIPackratInspect);
    const dbJobs: DBAPI.Job[] | null = await DBAPI.Job.fetchByType(idVJobType || 0);
    expect(dbJobs).toBeTruthy();
    if (!dbJobs || dbJobs.length != 1)
        return false;
    const idJob: number = dbJobs[0].idJob;
    const job: IJob | null = await testCreateByID(idJob, assetVersionIDs, parameters, '', true); // schedule === '' -> run now
    expect(job).toBeTruthy();
    if (!job)
        return false;

    JobSet.add(job);
    return true;
}

async function testCreateByID(idJob: number, idAssetVersions: number[] | undefined, parameters: any,
    schedule: string | null, expectSuccess: boolean = true): Promise<IJob | null> {
    expect(jobEngine).toBeTruthy(); if (!jobEngine) return null;

    const job: IJob | null = await jobEngine.createByID(idJob, idAssetVersions || null, parameters, schedule);
    if (expectSuccess)
        expect(job).toBeTruthy();
    else
        expect(job).toBeFalsy();
    return job;
}

async function testCreateByType(eJobType: eVocabularyID, idAssetVersions: number[] | undefined, parameters: any,
    schedule: string | null, expectSuccess: boolean = true): Promise<IJob | null> {
    expect(jobEngine).toBeTruthy(); if (!jobEngine) return null;

    const job: IJob | null = await jobEngine.createByType(eJobType, idAssetVersions || null, parameters, schedule);
    if (expectSuccess)
        expect(job).toBeTruthy();
    else
        expect(job).toBeFalsy();
    return job;
}

async function computeVocabularyDBID(eJobType: eVocabularyID): Promise<number | undefined> {
    const idVJobType: number | undefined = await CACHE.VocabularyCache.vocabularyEnumToId(eJobType);
    if (!idVJobType)
        LOG.logger.error(`computeVocabularyDBID unable to fetch Job type from ${CACHE.eVocabularyID[eJobType]}`);
    return idVJobType;
}

function computeJobParameters(testCase: string, eJobType: eVocabularyID): any {
    let modelName: string | undefined = MTS?.getTestCase(testCase)?.modelName;
    expect(modelName).toBeTruthy();
    modelName = modelName || '';

    switch (eJobType) {
        case eVocabularyID.eJobJobTypeCookSIPackratInspect: return new COOK.JobCookSIPackratInspectParameters(modelName);
        default:
            LOG.logger.error(`JobNS.test computeJobParameters: unexpected job type ${eVocabularyID[eJobType]}`);
            expect(false).toBeTruthy();
    }
}