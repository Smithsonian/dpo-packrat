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

class JobData {
    dbJobRun: DBAPI.JobRun;
    eJobType: eVocabularyID;
    testCase: string;
    constructor(dbJobRun: DBAPI.JobRun, eJobType: eVocabularyID, testCase: string) {
        this.dbJobRun = dbJobRun;
        this.eJobType = eJobType;
        this.testCase = testCase;
    }
}

let jobEngine: IJobEngine | null = null;
let modelTestAvailable: boolean | null = null;
let MTS: TESTMODEL.ModelTestSetup | null = null;
const JobSet: Set<IJob> = new Set<IJob>();
const JobDataMap: Map<number, JobData> = new Map<number, JobData>();

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
    testCookExplicit('fbx-stand-alone', eVocabularyID.eJobJobTypeCookSIPackratInspect);
    testCookImplicit('fbx-with-support', eVocabularyID.eJobJobTypeCookSIPackratInspect);
    testCookExplicit('glb', eVocabularyID.eJobJobTypeCookSIPackratInspect);
    testCookImplicit('obj', eVocabularyID.eJobJobTypeCookSIPackratInspect);
    testCookExplicit('ply', eVocabularyID.eJobJobTypeCookSIPackratInspect);
    testCookImplicit('stl', eVocabularyID.eJobJobTypeCookSIPackratInspect);
    testCookImplicit('x3d', eVocabularyID.eJobJobTypeCookSIPackratInspect);

    // Not yet supported by cook's si-packrat-inspect, as of 2021-03-22
    // testCookExplicit('usd', eVocabularyID.eJobJobTypeCookSIPackratInspect);
    // testCookImplicit('usdz', eVocabularyID.eJobJobTypeCookSIPackratInspect);
    // testCookExplicit('wrl', eVocabularyID.eJobJobTypeCookSIPackratInspect);

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

    test('IJob.Cook Job Results', async() => {
        for (const job of JobSet) {
            const dbJobRun: DBAPI.JobRun | null = await job.dbJobRun();
            expect(dbJobRun).toBeTruthy();
            if (!dbJobRun)
                continue;
            expect(dbJobRun.Result).toBeTruthy();

            const jobData: JobData | undefined = JobDataMap.get(dbJobRun.idJobRun);
            expect(jobData).toBeTruthy();
            if (!jobData)
                continue;

            const output: string | null = dbJobRun.Output;

            switch (jobData.eJobType) {
                case eVocabularyID.eJobJobTypeCookSIPackratInspect: {
                    expect(output).toBeTruthy();
                    const JCOutput: COOK.JobCookSIPackratInspectOutput = await COOK.JobCookSIPackratInspectOutput.extract(JSON.parse(output || ''));
                    expect(JCOutput.success).toBeTruthy();

                    const inspectJSON: string | undefined = MTS?.getTestCase(jobData.testCase)?.inspectJSON;
                    expect(inspectJSON).toBeTruthy();
                    expect(inspectJSON).toEqual(JSON.stringify(JCOutput));

                    LOG.logger.info(`si-packrat-inspect output of ${jobData.testCase}:\n${JSON.stringify(JCOutput)}`);
                } break;

                default:
                    LOG.logger.error(`JobNS.test results encountered Unexpected Job Type: ${jobData.eJobType ? eVocabularyID[jobData.eJobType] : 'undefined'}`);
                    expect(false).toBeTruthy();
                    break;
            }
        }
    });
});

function testCookExplicit(testCase: string, eJobType: eVocabularyID): void {
    test(`IJob.Cook ${eVocabularyID[eJobType]} ${testCase} Explicit`, async () => {
        LOG.logger.info(`JobNS.test testCook('${testCase}): ${eVocabularyID[eJobType]} explicit IJob.executeJob`);
        const assetVersionIDs: number[] | undefined = MTS?.getTestCase(testCase)?.assetVersionIDs;
        expect(assetVersionIDs).toBeTruthy();
        const parameters: any = computeJobParameters(testCase, eJobType);
        expect(parameters).toBeTruthy();

        const job: IJob | null = await testCreateByType(eJobType, assetVersionIDs, parameters, null, true);
        expect(job).toBeTruthy();
        if (!job)
            return;

        job.executeJob(new Date()); // don't use await ... instead, the main loop will wait for completion of all jobs

        await recordJob(job, eJobType, testCase);
    });
}

function testCookImplicit(testCase: string, eJobType: eVocabularyID): void {
    test(`IJob.Cook ${eVocabularyID[eJobType]} ${testCase} Implicit`, async () => {
        LOG.logger.info(`JobNS.test testCook('${testCase}): ${eVocabularyID[eJobType]} implicit IJob.executeJob`);
        const assetVersionIDs: number[] | undefined = MTS?.getTestCase(testCase)?.assetVersionIDs;
        expect(assetVersionIDs).toBeTruthy();
        const parameters: any = computeJobParameters(testCase, eJobType);
        expect(parameters).toBeTruthy();

        const idVJobType: number | undefined = await computeVocabularyDBID(eJobType);
        const dbJobs: DBAPI.Job[] | null = await DBAPI.Job.fetchByType(idVJobType || 0);
        expect(dbJobs).toBeTruthy();
        if (!dbJobs || dbJobs.length != 1)
            return;
        const idJob: number = dbJobs[0].idJob;
        const job: IJob | null = await testCreateByID(idJob, assetVersionIDs, parameters, '', true); // schedule === '' -> run now
        expect(job).toBeTruthy();
        if (!job)
            return;

        await recordJob(job, eJobType, testCase);
    });
}

async function recordJob(job: IJob, eJobType: eVocabularyID, testCase: string): Promise<void> {
    JobSet.add(job);

    const dbJobRun: DBAPI.JobRun | null = await job.dbJobRun();
    expect(dbJobRun).toBeTruthy();
    expect(dbJobRun?.idJobRun).toBeTruthy();
    if (dbJobRun && dbJobRun.idJobRun)
        JobDataMap.set(dbJobRun.idJobRun, new JobData(dbJobRun, eJobType, testCase));
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