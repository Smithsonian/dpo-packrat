/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
import { JobCook } from './JobCook';
import { CookRecipe } from './CookRecipe';
import { Config } from '../../../config';

import * as JOB from '../../interface';
// import * as LOG from '../../../utils/logger';
import * as DBAPI from '../../../db';
// import * as CACHE from '../../../cache';
// import * as STORE from '../../../storage/interface';
import * as H from '../../../utils/helpers';
// import { eEventKey } from '../../../event/interface/EventEnums';
// import { ZipStream } from '../../../utils/zipStream';
// import { maybe, maybeString } from '../../../utils/types';

// import { isArray } from 'lodash';
import * as path from 'path';

export class JobCookSIVoyagerSceneParameters {
    constructor(sourceMeshFile: string,
        units: string,
        sourceDiffuseMapFile: string | undefined = undefined,
        svxFile: string | undefined = undefined,
        metaDataFile: string | undefined = undefined,
        outputFileBaseName: string | undefined = undefined) {
        this.sourceMeshFile = path.basename(sourceMeshFile);
        this.units = units;
        this.sourceDiffuseMapFile = sourceDiffuseMapFile ? path.basename(sourceDiffuseMapFile) : undefined;
        this.svxFile = svxFile ? path.basename(svxFile) : undefined;
        this.metaDataFile = metaDataFile ? path.basename(metaDataFile) : undefined;
        this.outputFileBaseName = outputFileBaseName ? path.basename(outputFileBaseName) : undefined;
    }
    sourceMeshFile: string;
    units: string;
    sourceDiffuseMapFile?: string | undefined;
    svxFile?: string | undefined;
    metaDataFile?: string | undefined;
    outputFileBaseName?: string | undefined;
}

// Consume job output
// Retrieve svx.json
// Extract models
// Copy all model-related files over
// Create assets for each
// Perform ingestion
export class JobCookSIVoyagerSceneOutput implements H.IOResults {
    success: boolean = true;
    error: string = '';
    svxFile: string | null = null;
}

export class JobCookSIVoyagerScene extends JobCook<JobCookSIVoyagerSceneParameters> {
    private parameters: JobCookSIVoyagerSceneParameters;

    constructor(jobEngine: JOB.IJobEngine, idAssetVersions: number[] | null,
        parameters: JobCookSIVoyagerSceneParameters, dbJobRun: DBAPI.JobRun) {
        super(jobEngine, Config.job.cookClientId, 'si-vogager-scene',
            CookRecipe.getCookRecipeID('si-vogager-scene', '512211e5-f2e8-4723-93e9-e30116c88ab0'),
            null, idAssetVersions, dbJobRun);
        this.parameters = parameters;
    }

    async cleanupJob(): Promise<H.IOResults> {
        return { success: true, error: '' };
    }

    protected async getParameters(): Promise<JobCookSIVoyagerSceneParameters> {
        return this.parameters;
    }
}

