import { JobCook } from './JobCook';
import { CookRecipe } from './CookRecipe';
import { Config } from '../../../config';

// import * as LOG from '../../utils/logger';
// import * as CACHE from '../../cache';
// import * as DBAPI from '../../db';
// import * as H from '../../utils/helpers';

export class JobCookSIPackratInspectParameters {
    constructor(sourceMeshFile: string, sourceMaterialFiles: string | null = null) {
        this.sourceMeshFile = sourceMeshFile;
        this.sourceMaterialFiles = sourceMaterialFiles;
    }
    sourceMeshFile: string;
    sourceMaterialFiles: string | null;
}

export class JobCookSIPackratInspect extends JobCook<JobCookSIPackratInspectParameters> {
    private parameters: JobCookSIPackratInspectParameters;

    constructor(idAssetVersions: number[] | null, parameters: JobCookSIPackratInspectParameters) {
        super(Config.job.cookClientId, 'si-packrat-inspect',
            CookRecipe.getCookRecipeID('si-packrat-inspect', 'bb602690-76c9-11eb-9439-0242ac130002'), null, idAssetVersions);
        this.parameters = parameters;
    }

    protected getParameters(): JobCookSIPackratInspectParameters {
        return this.parameters;
    }
}

