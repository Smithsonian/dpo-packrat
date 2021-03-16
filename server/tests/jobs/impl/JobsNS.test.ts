/* eslint-disable @typescript-eslint/no-explicit-any */

import { IJob, IJobEngine, JobFactory } from '../../../job/interface';
import { JOB_TYPE } from '../../../config';
import { eVocabularyID } from '../../../cache';

// import * as H from '../../../utils/helpers';
// import * as LOG from '../../../utils/logger';
// import * as CACHE from '../../../cache';

let jobEngine: IJobEngine | null = null;

afterAll(async done => {
    // jest.setTimeout(3000);
    // await H.Helpers.sleep(2000);
    done();
});

describe('Jobs NS Init', () => {
    test('Jobs NS Test Setup', async () => {
        jobEngine = await JobFactory.getInstance(JOB_TYPE.NODE_SCHEDULE);
        expect(jobEngine).toBeTruthy();
    });
});

describe('Job Lifecycle', () => {
    // create a DB job for Cook: si-packrat-inspect
    // create a set of test models matching JB's test data <-- this is a test object ... -> which has ingested asset versions
    // launch job by id and by type, for each of the test data
    // confirm job output matches expectations
    // confirm DB job and jobrun are created and in correct state

    // test job cancellation
    test('IJob.createByID', async () => {

    });

    test('Navigation Children', async () => {

        // Not yet implemented:
    });

    test('IJob.create Invalid', async () => {
        await testCreateByID(0, null, null, null, false);
        await testCreateByType(eVocabularyID.eNone, null, null, null, false);
    });

});

async function testCreateByID(idJob: number, idAssetVersions: number[] | null, parameters: any,
    schedule: string | null, expectSuccess: boolean = true): Promise<void> {
    expect(jobEngine).toBeTruthy(); if (!jobEngine) return;

    const job: IJob | null = await jobEngine.createByID(idJob, idAssetVersions, parameters, schedule);
    if (expectSuccess)
        expect(job).toBeTruthy();
    else
        expect(job).toBeFalsy();
}

async function testCreateByType(eJobType: eVocabularyID, idAssetVersions: number[] | null, parameters: any,
    schedule: string | null, expectSuccess: boolean = true): Promise<void> {
    expect(jobEngine).toBeTruthy(); if (!jobEngine) return;

    const job: IJob | null = await jobEngine.createByType(eJobType, idAssetVersions, parameters, schedule);
    if (expectSuccess)
        expect(job).toBeTruthy();
    else
        expect(job).toBeFalsy();
}
