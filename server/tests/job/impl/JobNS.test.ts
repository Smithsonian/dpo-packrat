/* eslint-disable @typescript-eslint/no-explicit-any, no-constant-condition */

import { JOB_TYPE } from '../../../config';

import * as JOB from '../../../job/interface';
import * as COOK from '../../../job/impl/Cook';
import * as WF from '../../../workflow/interface';
import * as WFP from '../../../workflow/impl/Packrat';
import * as REP from '../../../report/interface';
import * as DBAPI from '../../../db';
import * as H from '../../../utils/helpers';
import * as LOG from '../../../utils/logger';
import * as CACHE from '../../../cache';
import * as COMMON from '@dpo-packrat/common';
import * as TESTMODEL from '../../db/composite/Model.setup';

class JobData {
    dbJobRun: DBAPI.JobRun;
    eJobType: COMMON.eVocabularyID;
    testCase: string;
    constructor(dbJobRun: DBAPI.JobRun, eJobType: COMMON.eVocabularyID, testCase: string) {
        this.dbJobRun = dbJobRun;
        this.eJobType = eJobType;
        this.testCase = testCase;
    }
}

const IGNORE_FAILURES: boolean = false;
const testTimeout: number = 12000000;
const jobSets: number = 1;
const workflowSets: number = IGNORE_FAILURES ? 0 : 1;
const normalizedCreationDate: Date = new Date('2021-04-01T00:00:00.000Z'); // 4/1/2021 Keep this date in sync with Model.setup.ts modelTestCaseInspectJSONMap

let jobEngine: JOB.IJobEngine | null = null;
const JobMap: Map<string, JOB.IJob> = new Map<string, JOB.IJob>(); // testcase name -> IJob
const JobDataMap: Map<number, JobData> = new Map<number, JobData>();

let workflowEngine: WF.IWorkflowEngine | null = null;
const WorkflowMap: Map<string, WF.IWorkflow> = new Map<string, WF.IWorkflow>(); // testcase name -> IWorkflow

let modelTestAvailable: boolean | null = null;
const MTS: TESTMODEL.ModelTestSetup = new TESTMODEL.ModelTestSetup();
/*
afterAll(async done => {
    await H.Helpers.sleep(10000);
    done();
});
*/
describe('JobNS Init', () => {
    test('JobFactory.getInstance', async () => {
        jest.setTimeout(testTimeout);
        jobEngine = await JOB.JobFactory.getInstance(JOB_TYPE.NODE_SCHEDULE);
        expect(jobEngine).toBeTruthy();
    });

    test('WorkflowFactory.getInstance', async () => {
        workflowEngine = await WF.WorkflowFactory.getInstance();
        expect(workflowEngine).toBeTruthy();
    });

    test('Model Test Cases', async () => {
        modelTestAvailable = await MTS.initialize(); // ['dae','obj'] to select specific test cases
        expect(modelTestAvailable === null || modelTestAvailable).toBeTruthy(); // null means that model test files were not available, which is ok
        if (!modelTestAvailable)
            LOG.info('JobNS Skipping Cook Job and Workflow Tests, missing test models', LOG.LS.eTEST);
    });
});

describe('JobNS Cook Test Setup', () => {
    jest.setTimeout(testTimeout);
    for (let nSet = 0; nSet < jobSets; nSet++) {
        testCookImplicit('fbx-with-support', COMMON.eVocabularyID.eJobJobTypeCookSIPackratInspect);
        testCookExplicit('glb', COMMON.eVocabularyID.eJobJobTypeCookSIPackratInspect);
        testCookImplicit('glb-draco', COMMON.eVocabularyID.eJobJobTypeCookSIPackratInspect);
        testCookExplicit('obj', COMMON.eVocabularyID.eJobJobTypeCookSIPackratInspect);
        testCookImplicit('stl', COMMON.eVocabularyID.eJobJobTypeCookSIPackratInspect);
        testCookExplicit('gltf-stand-alone', COMMON.eVocabularyID.eJobJobTypeCookSIPackratInspect);
        testCookImplicit('gltf-with-support', COMMON.eVocabularyID.eJobJobTypeCookSIPackratInspect);
        testCookExplicit('dae', COMMON.eVocabularyID.eJobJobTypeCookSIPackratInspect);

        // Persistence incomplete (with errors logged) as of 2022-04-28 due to test model having references to missing assets:
        testCookImplicit('fbx-stand-alone', COMMON.eVocabularyID.eJobJobTypeCookSIPackratInspect);
        testCookExplicit('ply', COMMON.eVocabularyID.eJobJobTypeCookSIPackratInspect);

        if (IGNORE_FAILURES) {
            // Failing as of 2022-04-28 due to Blender bug
            testCookExplicit('x3d', COMMON.eVocabularyID.eJobJobTypeCookSIPackratInspect);

            // Not yet supported by cook's si-packrat-inspect, as of 2022-01-06
            testCookImplicit('usd', COMMON.eVocabularyID.eJobJobTypeCookSIPackratInspect);
            testCookExplicit('usdz', COMMON.eVocabularyID.eJobJobTypeCookSIPackratInspect);
            testCookImplicit('wrl', COMMON.eVocabularyID.eJobJobTypeCookSIPackratInspect);
        }
    }
    // TODO: test job cancellation
    test('IJob.Cook invalid job IDs', async () => {
        // expected failures:
        expect(await testCreateJob(0, COMMON.eVocabularyID.eNone, undefined, null, null, false)).toBeFalsy();
    });
});

describe('JobNS IWorkflow Test Setup', () => {
    jest.setTimeout(testTimeout);
    for (let nSet = 0; nSet < workflowSets; nSet++) {
        testWorkflow('fbx-with-support', COMMON.eVocabularyID.eWorkflowTypeCookJob, COMMON.eVocabularyID.eJobJobTypeCookSIPackratInspect);
        testWorkflow('glb', COMMON.eVocabularyID.eWorkflowTypeCookJob, COMMON.eVocabularyID.eJobJobTypeCookSIPackratInspect);
        testWorkflow('glb-draco', COMMON.eVocabularyID.eWorkflowTypeCookJob, COMMON.eVocabularyID.eJobJobTypeCookSIPackratInspect);
        testWorkflow('obj', COMMON.eVocabularyID.eWorkflowTypeCookJob, COMMON.eVocabularyID.eJobJobTypeCookSIPackratInspect);
        testWorkflow('stl', COMMON.eVocabularyID.eWorkflowTypeCookJob, COMMON.eVocabularyID.eJobJobTypeCookSIPackratInspect);
        testWorkflow('gltf-stand-alone', COMMON.eVocabularyID.eWorkflowTypeCookJob, COMMON.eVocabularyID.eJobJobTypeCookSIPackratInspect);
        testWorkflow('gltf-with-support', COMMON.eVocabularyID.eWorkflowTypeCookJob, COMMON.eVocabularyID.eJobJobTypeCookSIPackratInspect);
        testWorkflow('dae', COMMON.eVocabularyID.eWorkflowTypeCookJob, COMMON.eVocabularyID.eJobJobTypeCookSIPackratInspect);

        // Persistence incomplete (with errors logged) as of 2022-04-28 due to test model having references to missing assets:
        testWorkflow('fbx-stand-alone', COMMON.eVocabularyID.eWorkflowTypeCookJob, COMMON.eVocabularyID.eJobJobTypeCookSIPackratInspect);
        testWorkflow('ply', COMMON.eVocabularyID.eWorkflowTypeCookJob, COMMON.eVocabularyID.eJobJobTypeCookSIPackratInspect);

        if (IGNORE_FAILURES) {
            // Failing as of 2022-04-28 due to Blender bug
            testWorkflow('x3d', COMMON.eVocabularyID.eWorkflowTypeCookJob, COMMON.eVocabularyID.eJobJobTypeCookSIPackratInspect);

            // Not yet supported by cook's si-packrat-inspect, as of 2022-01-06
            testWorkflow('usd', COMMON.eVocabularyID.eWorkflowTypeCookJob, COMMON.eVocabularyID.eJobJobTypeCookSIPackratInspect);
            testWorkflow('usdz', COMMON.eVocabularyID.eWorkflowTypeCookJob, COMMON.eVocabularyID.eJobJobTypeCookSIPackratInspect);
            testWorkflow('wrl', COMMON.eVocabularyID.eWorkflowTypeCookJob, COMMON.eVocabularyID.eJobJobTypeCookSIPackratInspect);
        }
    }
});

describe('JobNS Cook Test Completion', () => {
    test('IJob.Cook Job Completion', async() => {
        jest.setTimeout(testTimeout);
        const jobFinalizationList: Promise<H.IOResults>[] = [];
        for (const job of JobMap.values())
            jobFinalizationList.push(job.waitForCompletion(testTimeout));

        LOG.info(`JobNS Cook awaiting job completion of ${JobMap.size} jobs`, LOG.LS.eTEST);
        try {
            const resultsArray = await Promise.all(jobFinalizationList);
            for (const res of resultsArray)
                expect(res.success).toBeTruthy();
            LOG.info(`JobNS Cook received job completion of ${resultsArray.length} jobs`, LOG.LS.eTEST);
        } catch (error) {
            LOG.error('JobNS Cook Job Completion failed', LOG.LS.eTEST, error);
        }
    });

    test('IJob.Cook Job Results', async() => {
        jest.setTimeout(testTimeout);
        if (!modelTestAvailable)
            return;

        for (const [name, job] of JobMap) {
            const dbJobRun: DBAPI.JobRun | null = await job.dbJobRun();
            expect(await validateJobOutput(name, dbJobRun)).toBeTruthy();
        }
    });
});

describe('JobNS IWorkflow Completion', () => {
    test('JobNS IWorkflow Completion', async() => {
        jest.setTimeout(testTimeout);
        const wfFinalizationList: Promise<H.IOResults>[] = [];
        for (const WF of WorkflowMap.values())
            wfFinalizationList.push(WF.waitForCompletion(testTimeout));

        LOG.info(`JobNS IWorkflow Completion awaiting completion of ${WorkflowMap.size} workflows`, LOG.LS.eTEST);
        try {
            const resultsArray = await Promise.all(wfFinalizationList);
            for (const res of resultsArray)
                expect(res.success).toBeTruthy();
            LOG.info(`JobNS IWorkflow Completion received completion of ${resultsArray.length} workflows`, LOG.LS.eTEST);
        } catch (error) {
            LOG.error('JobNS IWorkflow Completion failed', LOG.LS.eTEST, error);
        }
    });

    test('JobNS IWorkflow Job Results', async() => {
        jest.setTimeout(testTimeout);
        if (!modelTestAvailable)
            return;

        for (const [name, workflow] of WorkflowMap) {
            const workflowConstellation: DBAPI.WorkflowConstellation | null = await workflow.workflowConstellation();
            expect(workflowConstellation).toBeTruthy();
            expect(workflowConstellation?.workflow).toBeTruthy();
            if (!workflowConstellation?.workflow)
                continue;

            const eWorkflowType: COMMON.eVocabularyID | undefined =
                await WFP.WorkflowEngine.computeWorkflowEnumFromID(workflowConstellation.workflow.idVWorkflowType, COMMON.eVocabularySetID.eWorkflowType);
            expect(eWorkflowType).toBeTruthy();
            switch (eWorkflowType) {
                case COMMON.eVocabularyID.eWorkflowTypeCookJob: {
                    expect(workflowConstellation.workflowStep).toBeTruthy();
                    if (!workflowConstellation.workflowStep)
                        continue;
                    expect(workflowConstellation.workflowStep.length).toEqual(1);   // only one workflow step expected for this workflow type
                    if (workflowConstellation.workflowStep.length != 1)
                        continue;
                    expect(workflowConstellation.workflowStep[0].idJobRun).toBeTruthy();
                    const dbJobRun: DBAPI.JobRun | null = await DBAPI.JobRun.fetch(workflowConstellation.workflowStep[0].idJobRun || 0);
                    expect(await validateJobOutput(name, dbJobRun)).toBeTruthy();
                } break;

                default:
                    LOG.error(`JobNS IWorkflow Job Results encountered Unexpected Workflow Type: ${eWorkflowType ? COMMON.eVocabularyID[eWorkflowType] : 'undefined'}`, LOG.LS.eTEST);
                    expect(false).toBeTruthy();
                    break;
            }
        }
    });
});

// #region JobNS Utils
function testCookExplicit(testCase: string, eJobType: COMMON.eVocabularyID): void {
    test(`IJob.Cook ${COMMON.eVocabularyID[eJobType]} ${testCase} Explicit`, async () => {
        if (!modelTestAvailable)
            return;

        LOG.info(`JobNS.test testCook(${testCase}): ${COMMON.eVocabularyID[eJobType]} explicit IJob.executeJob`, LOG.LS.eTEST);
        const assetVersionIDs: number[] | undefined = MTS.getTestCase(testCase)?.assetVersionIDs();
        expect(assetVersionIDs).toBeTruthy();
        const parameters: any = computeJobParameters(testCase, eJobType);
        expect(parameters).toBeTruthy();

        const job: JOB.IJob | null = await testCreateJob(null, eJobType, assetVersionIDs, parameters, null, true);
        expect(job).toBeTruthy();
        if (!job)
            return;

        job.executeJob(new Date()); // don't use await ... instead, the main loop will wait for completion of all jobs

        await recordJob(job, eJobType, testCase);
    });
}

function testCookImplicit(testCase: string, eJobType: COMMON.eVocabularyID): void {
    test(`IJob.Cook ${COMMON.eVocabularyID[eJobType]} ${testCase} Implicit`, async () => {
        if (!modelTestAvailable)
            return;

        LOG.info(`JobNS.test testCook(${testCase}): ${COMMON.eVocabularyID[eJobType]} implicit IJob.executeJob`, LOG.LS.eTEST);
        const assetVersionIDs: number[] | undefined = MTS.getTestCase(testCase)?.assetVersionIDs();
        expect(assetVersionIDs).toBeTruthy();
        const parameters: any = computeJobParameters(testCase, eJobType);
        expect(parameters).toBeTruthy();

        const idVJobType: number | undefined = await computeVocabularyDBID(eJobType);
        const dbJobs: DBAPI.Job[] | null = await DBAPI.Job.fetchByType(idVJobType || 0);
        expect(dbJobs).toBeTruthy();
        if (!dbJobs || dbJobs.length != 1)
            return;
        const idJob: number = dbJobs[0].idJob;
        const job: JOB.IJob | null = await testCreateJob(idJob, null, assetVersionIDs, parameters, '', true); // frequency === '' -> run now
        expect(job).toBeTruthy();
        if (!job)
            return;

        await recordJob(job, eJobType, testCase);
    });
}

async function recordJob(job: JOB.IJob, eJobType: COMMON.eVocabularyID, testCase: string): Promise<void> {
    JobMap.set(testCase, job);

    const dbJobRun: DBAPI.JobRun | null = await job.dbJobRun();
    expect(dbJobRun).toBeTruthy();
    expect(dbJobRun?.idJobRun).toBeTruthy();
    if (dbJobRun && dbJobRun.idJobRun)
        JobDataMap.set(dbJobRun.idJobRun, new JobData(dbJobRun, eJobType, testCase));
}

async function testCreateJob(idJob: number | null, eJobType: COMMON.eVocabularyID | null, idAssetVersions: number[] | undefined, parameters: any,
    frequency: string | null, expectSuccess: boolean = true): Promise<JOB.IJob | null> {
    expect(jobEngine).toBeTruthy(); if (!jobEngine) return null;

    // fetch workflow report
    const report: REP.IReport | null = await REP.ReportFactory.getReport();

    const JPC: JOB.JobCreationParameters = {
        idJob,
        eJobType,
        idAssetVersions: idAssetVersions || null,
        report,
        parameters,
        frequency
    };

    const job: JOB.IJob | null = await jobEngine.create(JPC);
    if (expectSuccess)
        expect(job).toBeTruthy();
    else
        expect(job).toBeFalsy();
    return job;
}

async function computeVocabularyDBID(eJobType: COMMON.eVocabularyID): Promise<number | undefined> {
    const idVJobType: number | undefined = await CACHE.VocabularyCache.vocabularyEnumToId(eJobType);
    if (!idVJobType)
        LOG.error(`computeVocabularyDBID unable to fetch Job type from ${COMMON.eVocabularyID[eJobType]}`, LOG.LS.eTEST);
    return idVJobType;
}

async function computeVocabularyDBEnum(idVJobType: number): Promise<COMMON.eVocabularyID | undefined> {
    const eJobType: number | undefined = await CACHE.VocabularyCache.vocabularyIdToEnum(idVJobType);
    if (!eJobType)
        LOG.error(`computeVocabularyDBEnum unable to fetch Job enum from ${idVJobType}`, LOG.LS.eTEST);
    return eJobType;
}

function computeJobParameters(testCase: string, eJobType: COMMON.eVocabularyID): any {
    let modelName: string | undefined = MTS.getTestCase(testCase)?.modelName;
    expect(modelName).toBeTruthy();
    modelName = modelName || '';

    switch (eJobType) {
        case COMMON.eVocabularyID.eJobJobTypeCookSIPackratInspect: return new COOK.JobCookSIPackratInspectParameters(modelName);
        default:
            LOG.error(`JobNS.test computeJobParameters: unexpected job type ${COMMON.eVocabularyID[eJobType]}`, LOG.LS.eTEST);
            expect(false).toBeTruthy();
    }
}

async function validateJobOutput(testcase: string, dbJobRun: DBAPI.JobRun | null): Promise<boolean> {
    LOG.info(`JonNS Test validateJobOutput(${testcase}): idJobRun ${dbJobRun?.idJobRun}`, LOG.LS.eTEST);
    expect(dbJobRun).toBeTruthy();
    if (!dbJobRun)
        return false;
    if (!IGNORE_FAILURES)
        expect(dbJobRun.Result).toBeTruthy();
    else {
        if (!dbJobRun.Result) {
            LOG.error(`JonNS Test validateJobOutput(${testcase}) failed: idJobRun ${dbJobRun.idJobRun}`, LOG.LS.eTEST);
            return true;
        }
    }

    const jobData: JobData | undefined = JobDataMap.get(dbJobRun.idJobRun);
    expect(jobData).toBeTruthy();
    if (!jobData)
        return false;

    const output: string | null = dbJobRun.Output;

    switch (jobData.eJobType) {
        case COMMON.eVocabularyID.eJobJobTypeCookSIPackratInspect: {
            expect(output).toBeTruthy();
            let JCOutput: COOK.JobCookSIPackratInspectOutput | null = null;
            try {
                JCOutput = await COOK.JobCookSIPackratInspectOutput.extract(JSON.parse(output || ''), null, null);
            } catch (error) {
                LOG.error(`JonNS Test validateJobOutput(${testcase}) ${COMMON.eVocabularyID[jobData.eJobType]}: ${output}`, LOG.LS.eTEST, error);
                expect(true).toBeFalsy();
            }
            expect(JCOutput).toBeTruthy();
            if (!JCOutput)
                return false;
            if (!IGNORE_FAILURES)
                expect(JCOutput.success).toBeTruthy();
            else {
                if (!JCOutput.success)
                    LOG.error(`JonNS Test validateJobOutput(${testcase}) ${COMMON.eVocabularyID[jobData.eJobType]}: ${output} FAILED`, LOG.LS.eTEST);
            }

            normalizeOutput(JCOutput);

            const JCOutputStr: string = JSON.stringify(JCOutput, H.Helpers.saferStringify);

            const MTC: TESTMODEL.ModelTestCase | undefined = MTS.getTestCase(jobData.testCase);
            expect(MTC).toBeTruthy();
            if (!MTC) {
                LOG.error(`Unable to find testcase ${jobData.testCase}`, LOG.LS.eTEST);
                return false;
            }

            const inspectJSON: string | undefined = MTC.inspectJSON;
            expect(inspectJSON).toBeTruthy();
            if (JCOutputStr !== inspectJSON)
                LOG.info(`si-packrat-inspect output of ${jobData.testCase}:\n${JCOutputStr}`, LOG.LS.eTEST);
            if (!IGNORE_FAILURES)
                expect(JCOutputStr).toEqual(inspectJSON);

            // Test persistence of data
            const assetFileNameMap: Map<string, number> = MTC.assetFileNameMap();
            const res: H.IOResults = await JCOutput.persist(MTC.model.idModel, assetFileNameMap);
            if (!res.success) {
                LOG.error(`JobNS Persisting ${MTC.testCase} FAILED: idModel ${MTC.model.idModel}, asset map ${JSON.stringify(assetFileNameMap, H.Helpers.saferStringify)}: ${res.error}`, LOG.LS.eTEST);
                expect(res.success).toBeTruthy();
            } else {
                expect(JCOutput.modelConstellation).toBeTruthy();
                expect(JCOutput.modelConstellation?.Model).toBeTruthy();
                expect(JCOutput.modelConstellation?.Model?.idModel).toBeTruthy();
                LOG.info(`JobNS Persisting ${MTC.testCase} SUCEEDED: idModel ${MTC.model.idModel}, asset map ${JSON.stringify(assetFileNameMap, H.Helpers.saferStringify)}`, LOG.LS.eTEST);
            }
            return (!IGNORE_FAILURES) ? (JCOutputStr === inspectJSON) : true;
        }

        default:
            LOG.error(`JobNS validateJobOutput encountered Unexpected Job Type: ${jobData.eJobType ? COMMON.eVocabularyID[jobData.eJobType] : 'undefined'}`, LOG.LS.eTEST);
            expect(false).toBeTruthy();
            return false;
    }
}

function normalizeOutput(JCOutput: COOK.JobCookSIPackratInspectOutput): void {
    if (JCOutput.modelConstellation) {
        if (JCOutput.modelConstellation.Model)
            JCOutput.modelConstellation.Model.DateCreated = normalizedCreationDate;
        if (JCOutput.modelConstellation.ModelAssets) {
            for (const modelAsset of JCOutput.modelConstellation.ModelAssets)
                modelAsset.AssetVersion.DateCreated = normalizedCreationDate;
        }
    }
}
// #endregion

// #region Workflow Utils
function testWorkflow(testCase: string, eWorkflowType: COMMON.eVocabularyID, eJobType: COMMON.eVocabularyID): void {
    test(`JobNS IWorkflow ${COMMON.eVocabularyID[eWorkflowType]} ${COMMON.eVocabularyID[eJobType]} ${testCase}`, async () => {
        if (!modelTestAvailable || !workflowEngine)
            return;

        LOG.info(`JobNS.test IWorkflow(${testCase}): ${COMMON.eVocabularyID[eWorkflowType]} ${COMMON.eVocabularyID[eJobType]}`, LOG.LS.eTEST);
        const idSystemObject: number[] | undefined = (await MTS?.getTestCase(testCase)?.computeSystemObjectIDs()) ?? undefined;
        expect(idSystemObject).toBeTruthy();

        const parameters: any = computeWorkflowParameters(testCase, eWorkflowType, eJobType);
        expect(parameters).toBeTruthy();

        const WFP: WF.WorkflowParameters = {
            eWorkflowType,
            idSystemObject,
            parameters,
        };

        const workflow: WF.IWorkflow | null = await workflowEngine.create(WFP);
        expect(workflow).toBeTruthy();
        if (!workflow)
            return;

        await recordWorkflow(workflow, eWorkflowType, testCase);
    });
}

async function recordWorkflow(workflow: WF.IWorkflow, eWorkflowType: COMMON.eVocabularyID, testCase: string): Promise<void> {
    const WC: DBAPI.WorkflowConstellation | null = await workflow.workflowConstellation();
    expect(WC).toBeTruthy();
    if (!WC)
        return;

    if (!WC.workflowStep)
        return;

    for (const WS of WC.workflowStep) {
        if (!WS.idJobRun)
            continue;

        const dbJobRun: DBAPI.JobRun | null = await DBAPI.JobRun.fetch(WS.idJobRun);
        expect(dbJobRun).toBeTruthy();
        if (!dbJobRun)
            continue;

        const dbJob: DBAPI.Job | null = await DBAPI.Job.fetch(dbJobRun.idJob);
        expect(dbJob).toBeTruthy();
        if (!dbJob)
            continue;

        const eJobType: COMMON.eVocabularyID | undefined = await computeVocabularyDBEnum(dbJob.idVJobType);
        expect(eJobType).toBeTruthy();
        if (!eJobType)
            continue;

        JobDataMap.set(dbJobRun.idJobRun, new JobData(dbJobRun, eJobType, testCase));
    }

    eWorkflowType;
    WorkflowMap.set(testCase, workflow);
}

function computeWorkflowParameters(testCase: string, eWorkflowType: COMMON.eVocabularyID, eJobType: COMMON.eVocabularyID): any {
    switch (eWorkflowType) {
        case COMMON.eVocabularyID.eWorkflowTypeCookJob:
            return new WFP.WorkflowJobParameters(eJobType, computeJobParameters(testCase, eJobType));
        default:
            LOG.error(`JobNS.test computeWorkflowParameters: unexpected workflow type ${COMMON.eVocabularyID[eWorkflowType]}`, LOG.LS.eTEST);
            expect(false).toBeTruthy();
    }
}
// #endregion
