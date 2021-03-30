/* eslint-disable @typescript-eslint/no-explicit-any, no-constant-condition */

import { IJob, IJobEngine, JobFactory, JobCreationParameters } from '../../../job/interface';
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
let MTS: TESTMODEL.ModelTestSetup | null = new TESTMODEL.ModelTestSetup();
const JobSet: Set<IJob> = new Set<IJob>();
const JobDataMap: Map<number, JobData> = new Map<number, JobData>();
const testTimeout: number = 6000000;

afterAll(async done => {
    await H.Helpers.sleep(10000);
    done();
});

describe('JobNS Init', () => {
    test('JobFactory.getInstance', async () => {
        jest.setTimeout(testTimeout);
        jobEngine = await JobFactory.getInstance(JOB_TYPE.NODE_SCHEDULE);
        expect(jobEngine).toBeTruthy();

        MTS = new TESTMODEL.ModelTestSetup();
        modelTestAvailable = await MTS.initialize();
        expect(modelTestAvailable === null || modelTestAvailable).toBeTruthy(); // null means that model test files were not available, which is ok
        if (!modelTestAvailable)
            LOG.logger.info('JobNS Skipping Cook Tests, missing test models');
    });
});

describe('JobNS Cook Tests', () => {
    jest.setTimeout(testTimeout);
    for (let nSet = 0; nSet <= 0; nSet++) {
        testCookExplicit('fbx-stand-alone', eVocabularyID.eJobJobTypeCookSIPackratInspect);
        testCookImplicit('fbx-with-support', eVocabularyID.eJobJobTypeCookSIPackratInspect);
        testCookExplicit('glb', eVocabularyID.eJobJobTypeCookSIPackratInspect);
        testCookImplicit('obj', eVocabularyID.eJobJobTypeCookSIPackratInspect);
        testCookExplicit('ply', eVocabularyID.eJobJobTypeCookSIPackratInspect);
        testCookImplicit('stl', eVocabularyID.eJobJobTypeCookSIPackratInspect);
        testCookImplicit('x3d', eVocabularyID.eJobJobTypeCookSIPackratInspect);
    }
    // Not yet supported by cook's si-packrat-inspect, as of 2021-03-22
    // testCookExplicit('usd', eVocabularyID.eJobJobTypeCookSIPackratInspect);
    // testCookImplicit('usdz', eVocabularyID.eJobJobTypeCookSIPackratInspect);
    // testCookExplicit('wrl', eVocabularyID.eJobJobTypeCookSIPackratInspect);
    // TODO: test job cancellation
    test('IJob.Cook invalid job IDs', async () => {
        // expected failures:
        expect(await testCreate(0, eVocabularyID.eNone, undefined, null, null, false)).toBeFalsy();
    });

    test('IJob.Cook Job Completion', async() => {
        jest.setTimeout(testTimeout);
        const jobFinalizationList: Promise<H.IOResults>[] = [];
        for (const job of JobSet)
            jobFinalizationList.push(job.waitForCompletion(testTimeout));

        LOG.logger.info(`JobNS Cook awaiting job completion of ${JobSet.size} jobs`);
        const resultsArray = await Promise.all(jobFinalizationList);
        for (const res of resultsArray)
            expect(res.success).toBeTruthy();
        LOG.logger.info(`JobNS Cook received job completion of ${resultsArray.length} jobs`);
    });

    test('IJob.Cook Job Results', async() => {
        jest.setTimeout(testTimeout);
        if (!modelTestAvailable)
            return;

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

                    const JCOutputStr: string = JSON.stringify(JCOutput, (key, value) => {
                        key; return (value instanceof Map) ? [...value] : value;
                    });
                    LOG.logger.info(`si-packrat-inspect output of ${jobData.testCase}:\n${JCOutputStr}`);

                    const inspectJSON: string | undefined = MTS?.getTestCase(jobData.testCase)?.inspectJSON;
                    expect(inspectJSON).toBeTruthy();
                    expect(inspectJSON).toEqual(JCOutputStr);
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
        if (!modelTestAvailable)
            return;

        LOG.logger.info(`JobNS.test testCook(${testCase}): ${eVocabularyID[eJobType]} explicit IJob.executeJob`);
        const assetVersionIDs: number[] | undefined = MTS?.getTestCase(testCase)?.assetVersionIDs;
        expect(assetVersionIDs).toBeTruthy();
        const parameters: any = computeJobParameters(testCase, eJobType);
        expect(parameters).toBeTruthy();

        const job: IJob | null = await testCreate(null, eJobType, assetVersionIDs, parameters, null, true);
        expect(job).toBeTruthy();
        if (!job)
            return;

        job.executeJob(new Date()); // don't use await ... instead, the main loop will wait for completion of all jobs

        await recordJob(job, eJobType, testCase);
    });
}

function testCookImplicit(testCase: string, eJobType: eVocabularyID): void {
    test(`IJob.Cook ${eVocabularyID[eJobType]} ${testCase} Implicit`, async () => {
        if (!modelTestAvailable)
            return;

        LOG.logger.info(`JobNS.test testCook(${testCase}): ${eVocabularyID[eJobType]} implicit IJob.executeJob`);
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
        const job: IJob | null = await testCreate(idJob, null, assetVersionIDs, parameters, '', true); // frequency === '' -> run now
        expect(job).toBeTruthy();
        if (!job)
            return;

        await recordJob(job, eJobType, testCase);
    });
}

async function recordJob(job: IJob, eJobType: eVocabularyID, testCase: string): Promise<void> {
    LOG.logger.info(`JobNS.recordJob ${testCase}  ${eVocabularyID[eJobType]}: ${JSON.stringify(job)}`);
    JobSet.add(job);

    const dbJobRun: DBAPI.JobRun | null = await job.dbJobRun();
    expect(dbJobRun).toBeTruthy();
    expect(dbJobRun?.idJobRun).toBeTruthy();
    if (dbJobRun && dbJobRun.idJobRun)
        JobDataMap.set(dbJobRun.idJobRun, new JobData(dbJobRun, eJobType, testCase));
}

async function testCreate(idJob: number | null, eJobType: eVocabularyID | null, idAssetVersions: number[] | undefined, parameters: any,
    frequency: string | null, expectSuccess: boolean = true): Promise<IJob | null> {
    expect(jobEngine).toBeTruthy(); if (!jobEngine) return null;

    const JPC: JobCreationParameters = {
        idJob,
        eJobType,
        idAssetVersions: idAssetVersions || null,
        parameters,
        frequency
    };

    const job: IJob | null = await jobEngine.create(JPC);
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