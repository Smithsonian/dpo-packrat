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

afterAll(async done => {
    await H.Helpers.sleep(2000);
    done();
});

describe('Jobs NS Init', () => {
    test('JobFactory.getInstance', async () => {
        jest.setTimeout(60000);
        jobEngine = await JobFactory.getInstance(JOB_TYPE.NODE_SCHEDULE);
        expect(jobEngine).toBeTruthy();

        MTS = new TESTMODEL.ModelTestSetup();
        modelTestAvailable = await MTS.initialize();
        expect(modelTestAvailable === null || modelTestAvailable).toBeTruthy(); // null means that model test files were not available, which is ok
    });
});

describe('Jobs NS Lifecycle', () => {
    // create a set of test models matching JB's test data <-- this is a test object ... -> which has ingested asset versions
    // launch job by id and by type, for each of the test data
    // confirm job output matches expectations
    // confirm DB job and jobrun are created and in correct state
    // test job cancellation

    test('IJob.Cook si-packrat-inspect', async () => {
        const idVJobType: number | undefined = await computeVocabularyDBID(eVocabularyID.eJobJobTypeCookSIPackratInspect);
        const dbJobs: DBAPI.Job[] | null = await DBAPI.Job.fetchByType(idVJobType || 0);
        expect(dbJobs).toBeTruthy();
        if (!dbJobs || dbJobs.length != 0)
            return;
        const idJob: number = dbJobs[0].idJob;

        await testCook('fbx-stand-alone', eVocabularyID.eJobJobTypeCookSIPackratInspect);

        await testCreateByID(idJob, undefined, null, null, true);
        await testCreateByType(eVocabularyID.eJobJobTypeCookSIPackratInspect, undefined, null, null, true);

        // expected failures:
        await testCreateByID(0, undefined, null, null, false);
        await testCreateByType(eVocabularyID.eNone, undefined, null, null, false);
    });

    test('Navigation Children', async () => {

        // Not yet implemented:
    });

});

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

async function testCook(testCase: string, eJobType: eVocabularyID): Promise<boolean> {
    const assetVersionIDs: number[] | undefined = MTS?.getTestCase(testCase)?.assetVersionIDs;
    expect(assetVersionIDs).toBeTruthy();
    const job: IJob | null = await testCreateByType(eJobType, assetVersionIDs, computeJobParameters(testCase, eJobType), null, true);
    expect(job).toBeTruthy();
    if (!job)
        return false;

    const res: H.IOResults = await job.startJob(new Date());
    expect(res.success).toBeTruthy();
    return res.success;
}

function computeJobParameters(testCase: string, eJobType: eVocabularyID): any {
    let modelName: string | undefined = MTS?.getTestCase(testCase)?.modelName;
    expect(modelName).toBeTruthy();
    modelName = modelName || '';

    switch (eJobType) {
        case eVocabularyID.eJobJobTypeCookSIPackratInspect: return new COOK.JobCookSIPackratInspectParameters(modelName);
        default:
            LOG.logger.error(`JobsNS.test computeJobParameters: unexpected job type ${eVocabularyID[eJobType]}`);
            expect(false).toBeTruthy();
    }
}