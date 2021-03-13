import * as DBAPI from '../../../db';
import { Job as JobBase, JobRun as JobRunBase } from '@prisma/client';

export async function createJobTest(base: JobBase): Promise<DBAPI.Job> {
    const job: DBAPI.Job = new DBAPI.Job(base);
    const created: boolean = await job.create();
    expect(created).toBeTruthy();
    expect(job.idJob).toBeGreaterThan(0);
    return job;
}

export async function createJobRunTest(base: JobRunBase): Promise<DBAPI.JobRun> {
    const jobRun: DBAPI.JobRun = new DBAPI.JobRun(base);
    const created: boolean = await jobRun.create();
    expect(created).toBeTruthy();
    expect(jobRun.idJobRun).toBeGreaterThan(0);
    return jobRun;
}