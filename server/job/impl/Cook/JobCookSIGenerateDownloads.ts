/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
import { JobCook } from './JobCook';
import { CookRecipe } from './CookRecipe';
import { Config } from '../../../config';

import * as JOB from '../../interface';
import * as LOG from '../../../utils/logger';
import * as DBAPI from '../../../db';
import * as CACHE from '../../../cache';
import * as STORE from '../../../storage/interface';
import * as H from '../../../utils/helpers';
import { ASL, LocalStore } from '../../../utils/localStore';

import * as path from 'path';

export class JobCookSIGenerateDownloadsParameters {
    constructor(idModel: number | undefined,
        sourceMeshFile: string,
        svxFile: string,
        sourceDiffuseMapFile: string | undefined = undefined,
        outputFileBaseName: string | undefined = undefined) {
        this.idModel = idModel;
        this.sourceMeshFile = path.basename(sourceMeshFile);
        this.svxFile = path.basename(svxFile);
        this.sourceDiffuseMapFile = sourceDiffuseMapFile ? path.basename(sourceDiffuseMapFile) : undefined;
        this.outputFileBaseName = outputFileBaseName ? path.basename(outputFileBaseName) : undefined;
    }
    idModel: number | undefined;
    sourceMeshFile: string;             // required
    svxFile: string;                    // required
    sourceDiffuseMapFile?: string | undefined;
    sourceMTLFile?: string | undefined;
    outputFileBaseName?: string | undefined;
}

export class JobCookSIGenerateDownloads extends JobCook<JobCookSIGenerateDownloadsParameters> {
    private parameters: JobCookSIGenerateDownloadsParameters;
    private idModel: number | null;
    private cleanupCalled: boolean = false;

    constructor(jobEngine: JOB.IJobEngine, idAssetVersions: number[] | null,
        parameters: JobCookSIGenerateDownloadsParameters, dbJobRun: DBAPI.JobRun) {
        super(jobEngine, Config.job.cookClientId, 'si-generate-downloads',
            CookRecipe.getCookRecipeID('si-generate-downloads', 'fcef7b5c-2df5-4a63-8fe9-365dd1a5e39c'),
            null, idAssetVersions, dbJobRun);
        if (parameters.idModel) {
            this.idModel = parameters.idModel ?? null;
            delete parameters.idModel; // strip this out, as Cook will choke on it!
        } else
            this.idModel = null;
        this.parameters = parameters;
    }

    async cleanupJob(): Promise<H.IOResults> {
        try {
            if (!this._results.success)
                return { success: true, error: '' };
            if (this.cleanupCalled)
                return { success: true, error: 'cleanupJob already called, exiting early' };
            this.cleanupCalled = true;
            return await this.createSystemObjects();
        } catch (error) {
            LOG.error('JobCookSIGenerateDownloads.cleanupJob', LOG.LS.eJOB, error);
            return { success: false, error: JSON.stringify(error) };
        }
    }

    private async createSystemObjects(): Promise<H.IOResults> {
        const modelSource: DBAPI.Model | null = this.idModel ? await DBAPI.Model.fetch(this.idModel) : null;
        if (!modelSource) {
            const error: string = `JobCookSIGenerateDownloads.createSystemObjects unable to compute source model from id ${this.idModel}`;
            LOG.error(error, LOG.LS.eJOB);
            return { success: false, error };
        }

        const svxFile: string = this.parameters.svxFile;
        const vModel: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.vocabularyByEnum(CACHE.eVocabularyID.eAssetAssetTypeModelGeometryFile);
        if (!vModel) {
            const error: string = `JobCookSIGenerateDownloads.createSystemObjects unable to calculate vocabulary needed to ingest scene file ${svxFile}`;
            LOG.error(error, LOG.LS.eJOB);
            return { success: false, error };
        }

        const LS: LocalStore | undefined = ASL.getStore();
        const idUserCreator: number = LS?.idUser ?? 0;
        const ISI: STORE.IngestStreamOrFileInput = {
            ReadStream: null, // RSR.readStream,
            LocalFilePath: null,
            FileName: svxFile,
            FilePath: '',
            idAssetGroup: 0,
            idVAssetType: vModel.idVocabulary,
            idUserCreator,
            SOBased: modelSource, // scene,
        };
        const ISR: STORE.IngestStreamOrFileResult = await STORE.AssetStorageAdapter.ingestStreamOrFile(ISI);
        if (!ISR.success) {
            LOG.error(`JobCookSIGenerateDownloads.createSystemObjects unable to ingest scene file ${svxFile}: ${ISR.error}`, LOG.LS.eJOB);
            return { success: false, error: ISR.error };
        }
        // LOG.info(`JobCookSIGenerateDownloads.createSystemObjects[${svxFile}] wire ingestStreamOrFile: ${JSON.stringify(ISI, H.Helpers.stringifyMapsAndBigints)}`, LOG.LS.eJOB);

        return { success: true, error: '' };
    }

    protected async getParameters(): Promise<JobCookSIGenerateDownloadsParameters> {
        return this.parameters;
    }
}

