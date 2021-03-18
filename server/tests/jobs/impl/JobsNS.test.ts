/* eslint-disable @typescript-eslint/no-explicit-any */

import { IJob, IJobEngine, JobFactory } from '../../../job/interface';
import { JOB_TYPE } from '../../../config';
import { eVocabularyID } from '../../../cache';

import * as DBAPI from '../../../db';
import * as H from '../../../utils/helpers';
import * as LOG from '../../../utils/logger';
import * as CACHE from '../../../cache';
import * as MTS from '../../db/composite/Model.setup';

let jobEngine: IJobEngine | null = null;
let modelTestAvailable: boolean | null = null;
let modelTestSetup: MTS.ModelTestSetup | null = null;

afterAll(async done => {
    jest.setTimeout(5000);
    await H.Helpers.sleep(2000);
    done();
});

describe('Jobs NS Init', () => {
    test('JobFactory.getInstance', async () => {
        jobEngine = await JobFactory.getInstance(JOB_TYPE.NODE_SCHEDULE);
        expect(jobEngine).toBeTruthy();

        modelTestSetup = new MTS.ModelTestSetup();
        modelTestAvailable = await modelTestSetup.initialize();
        expect(modelTestAvailable === null || modelTestAvailable).toBeTruthy(); // null means that model test files were not available, which is ok
    });
});

describe('Jobs NS Lifecycle', () => {
    // create a set of test models matching JB's test data <-- this is a test object ... -> which has ingested asset versions
    // launch job by id and by type, for each of the test data
    // confirm job output matches expectations
    // confirm DB job and jobrun are created and in correct state
    // test job cancellation

    test('IJob.create', async () => {
        const idVJobType: number | undefined = await computeVocabularyDBID(eVocabularyID.eJobJobTypeCookSIPackratInspect);
        const dbJobs: DBAPI.Job[] | null = await DBAPI.Job.fetchByType(idVJobType || 0);
        expect(dbJobs).toBeTruthy();
        if (!dbJobs || dbJobs.length != 0)
            return;

        await testCreateByID(dbJobs[0].idJob, null, null, null, true);
        await testCreateByType(eVocabularyID.eJobJobTypeCookSIPackratInspect, null, null, null, true);

        await testCreateByID(0, null, null, null, false);
        await testCreateByType(eVocabularyID.eNone, null, null, null, false);
    });

    test('Navigation Children', async () => {

        // Not yet implemented:
    });

});

async function testCreateByID(idJob: number, idAssetVersions: number[] | null, parameters: any,
    schedule: string | null, expectSuccess: boolean = true): Promise<IJob | null> {
    expect(jobEngine).toBeTruthy(); if (!jobEngine) return null;

    const job: IJob | null = await jobEngine.createByID(idJob, idAssetVersions, parameters, schedule);
    if (expectSuccess)
        expect(job).toBeTruthy();
    else
        expect(job).toBeFalsy();
    return job;
}

async function testCreateByType(eJobType: eVocabularyID, idAssetVersions: number[] | null, parameters: any,
    schedule: string | null, expectSuccess: boolean = true): Promise<IJob | null> {
    expect(jobEngine).toBeTruthy(); if (!jobEngine) return null;

    const job: IJob | null = await jobEngine.createByType(eJobType, idAssetVersions, parameters, schedule);
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
