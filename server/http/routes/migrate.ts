import * as DBAPI from '../../db';
import * as CACHE from '../../cache';
import * as H from '../../utils/helpers';
import * as LOG from '../../utils/logger';
import { ASL, LocalStore } from '../../utils/localStore';

import { SceneMigrationPackages, ModelMigrationFiles } from '../../utils/migration/MigrationData';
import { MigrationUtils, ModelDataExtraction, ModelMigration, ModelMigrationResults, ModelMigrationFile, SceneMigration, SceneMigrationResults, SceneMigrationPackage } from '../../utils/migration';

import * as COMMON from '@dpo-packrat/common';

import { Request, Response } from 'express';
import { Semaphore } from 'async-mutex';
import * as NS from 'node-schedule';
import * as path from 'path';

const SimultaneousMigrations: number = 10;

export async function migrate(request: Request, response: Response): Promise<void> {
    try {
        const migrator: Migrator = new Migrator(request, response);
        if (!await migrator.parseArguments(false))
            return;

        const soon: Date = new Date(new Date().getTime() + 1000); // start 1 second from now
        NS.scheduleJob(soon, () => Migrator.launcher(migrator));
        response.send('Migration Scheduled');
    } catch (error) {
        LOG.error('migrate', LOG.LS.eMIG, error);
    }
}

class Migrator {
    results: string = '';
    success: boolean = true;

    private request: Request;
    private response: Response;
    private sceneIDSet: Set<string> | undefined | null = undefined; // undefined means do not migrate; null means migrate all; non-null means migrate only matches
    private modelIDSet: Set<string> | undefined | null = undefined; // undefined means do not migrate; null means migrate all; non-null means migrate only matches
    private extractMode: boolean = false;   // true -> extract model information for selected models

    private static semaphoreMigrations: Semaphore = new Semaphore(SimultaneousMigrations);

    constructor(request: Request, response: Response) {
        this.request = request;
        this.response = response;
    }

    static async launcher(migrator: Migrator): Promise<boolean> {
        if (!await migrator.parseArguments(true))
            return false;
        return await migrator.migrate();
    }

    /** Returns false if arguments are invalid */
    async parseArguments(log: boolean): Promise<boolean> {
        const ret: boolean = await this.parseArgumentsWorker();

        if (log) {
            if (this.sceneIDSet === null)
                LOG.info('SceneMigration migrating all scenes', LOG.LS.eMIG);
            else if (this.sceneIDSet !== undefined)
                LOG.info(`SceneMigration migrating ${H.Helpers.JSONStringify(this.sceneIDSet)}`, LOG.LS.eMIG);

            if (this.modelIDSet === null)
                LOG.info(`ModelMigration ${this.extractMode ? 'extracting data for' : 'migrating' } all models`, LOG.LS.eMIG);
            else if (this.modelIDSet !== undefined)
                LOG.info(`ModelMigration ${this.extractMode ? 'extracting data for' : 'migrating' } ${H.Helpers.JSONStringify(this.modelIDSet)}`, LOG.LS.eMIG);
        }
        return ret;
    }

    private async parseArgumentsWorker(): Promise<boolean> {
        // All entry points below perform migration for objects not yet migrated
        // /migrate             Performs full migration
        // /migrate/scenes      Performs full scene migration
        // /migrate/models      Performs full model migration
        // /migrate/scene/ID    Performs scene migration for scene with EdanUUID of ID (comma-separated list)
        // /migrate/model/ID    Performs model migration for model with Unique ID of ID (comma-separated list)
        //     ?extract=true    Performs model migration extraction for specified models, by ingesting each model, and then using Cook to determine
        //                      which support files are in use by the model. This leaves Packrat in a "corrupted" state,
        //                      to be reinitialized with migrated content without ?extract=true

        const requestPath: string = this.request.path;
        let handled: boolean = true;
        switch (requestPath) {
            case '/migrate':        this.sceneIDSet = null; this.modelIDSet = null; break;
            case '/migrate/scenes': this.sceneIDSet = null; break;
            case '/migrate/models': this.modelIDSet = null; break;
            default:                handled = false; break;
        }

        const extract: string | null = H.Helpers.safeString(this.request.query.extract);
        this.extractMode = (extract === 'true');

        if (handled)
            return true;

        let flavor: string | null = null;
        let idList: string | null = null;
        const regexIDMatcher: RegExp = new RegExp('/migrate/(scene|model)/(.*)', 'i');
        const downloadMatch: RegExpMatchArray | null = requestPath.match(regexIDMatcher);
        if (downloadMatch && downloadMatch.length === 3) {
            flavor = downloadMatch[1];
            idList = downloadMatch[2];
        }

        if ((flavor !== 'scene' && flavor !== 'model') || idList === null)
            return this.sendError(404, `/migrate called with invalid url ${requestPath}`);

        let idSet: Set<string> | undefined = undefined;
        switch (flavor) {
            case 'scene': idSet = this.sceneIDSet = new Set<string>(); break;
            case 'model': idSet = this.modelIDSet = new Set<string>(); break;
        }

        if (idSet) {
            for (const id of idList.split(','))
                idSet.add(id);
        }

        return true;
    }

    async migrate(): Promise<boolean> {
        const user: DBAPI.User = await MigrationUtils.fetchMigrationUser();

        this.results += 'Migration Started<br/>\n';
        if (this.sceneIDSet !== undefined) {
            this.results += 'Migrating Scenes<br/>\n';
            for (const scenePackage of SceneMigrationPackages) {
                if (this.sceneIDSet && !this.sceneIDSet.has(scenePackage.EdanUUID))
                    continue;
                const scenes: DBAPI.Scene[] | null = await DBAPI.Scene.fetchByUUID(scenePackage.EdanUUID);
                if (scenes && scenes.length > 0) {
                    this.recordMigrationResult(true, `SceneMigration (${scenePackage.EdanUUID}) skipped: already migrated`);
                    continue;
                }

                await this.migrateScene(scenePackage, user);
            }
        }

        if (this.modelIDSet !== undefined) {
            this.results += 'Migrating Models<br/>\n';

            const vAssetTypeModel: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eAssetAssetTypeModel);
            const vAssetTypeModelGeometryFile: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eAssetAssetTypeModelGeometryFile);
            if (!vAssetTypeModel || !vAssetTypeModelGeometryFile) {
                this.recordMigrationResult(false, 'ModelMigration unable to fetch asset type vocabulary');
                return false;
            }

            // Pre-process ModelMigrationFiles, collecting them into arrays, one per .uniqueID; pass this array below in this.migrateModel
            const modelMigrationMap: Map<string, ModelMigrationFile[]> = new Map<string, ModelMigrationFile[]>();
            for (const modelFile of ModelMigrationFiles) {
                if (this.modelIDSet && !this.modelIDSet.has(modelFile.uniqueID))
                    continue;
                let modelFiles: ModelMigrationFile[] | undefined = modelMigrationMap.get(modelFile.uniqueID);
                if (!modelFiles) {
                    modelFiles = [];
                    modelMigrationMap.set(modelFile.uniqueID, modelFiles);
                }
                modelFiles.push(modelFile);
            }

            for (const [uniqueID, modelFiles] of modelMigrationMap) {
                let uniqueIDAlreadyMigrated: string | null = null;
                for (const modelFile of modelFiles) {
                    const models: DBAPI.Model[] | null = await DBAPI.Model.fetchByFileNameAndAssetType(modelFile.fileName, [vAssetTypeModel.idVocabulary, vAssetTypeModelGeometryFile.idVocabulary]);
                    if (models && models.length > 0) {
                        uniqueIDAlreadyMigrated = modelFile.uniqueID;
                        break;
                    }
                }

                if (uniqueIDAlreadyMigrated) {
                    this.recordMigrationResult(true, `ModelMigration (${uniqueIDAlreadyMigrated}) skipped: already migrated`);
                    continue;
                }

                const MMR: ModelMigrationResults = await this.migrateModel(modelFiles, user);
                if (this.extractMode && MMR.success && MMR.supportFiles) {
                    for (const supportFile of MMR.supportFiles) {
                        const supportPath: string = path.join(MMR.modelFilePath ?? '', supportFile);
                        const fileName: string = path.basename(supportFile);
                        const scriptLine: string = `SCRIPT { uniqueID: '${uniqueID}', path: '${supportPath}', fileName: '${fileName}', name: '${fileName}', title: '', filePath: '', hash: undefined, geometry: false, idSystemObjectItem: undefined, testData: false, License: undefined, PublishedState: undefined },`;
                        this.recordMigrationResult(true, scriptLine);
                    }
                }
            }
        }

        return true;
    }

    private async migrateScene(scenePackage: SceneMigrationPackage, user: DBAPI.User): Promise<SceneMigrationResults> {
        const res: SceneMigrationResults = await Migrator.semaphoreMigrations.runExclusive(async (value) => {
            const LS: LocalStore = await ASL.getOrCreateStore();
            LS.incrementRequestID();

            this.recordMigrationResult(true, `SceneMigration (${scenePackage.EdanUUID}) Starting; semaphore count ${value}`);
            const SM: SceneMigration = new SceneMigration();
            const SMR: SceneMigrationResults = await SM.migrateScene(user.idUser, scenePackage, true);
            if (!SMR.success)
                this.recordMigrationResult(false, `SceneMigration (${scenePackage.EdanUUID}) failed for ${H.Helpers.JSONStringify(scenePackage)}: ${SMR.error}`);
            else
                this.recordMigrationResult(true, `SceneMigration (${scenePackage.EdanUUID}) succeeded: ${H.Helpers.JSONStringify(SMR)}`);

            return SMR;
        });
        return res;
    }

    private async migrateModel(modelFileSet: ModelMigrationFile[], user: DBAPI.User): Promise<ModelMigrationResults> {
        if (modelFileSet.length <= 0)
            return { success: false, error: 'migrateModel called with no files' };

        const res: ModelMigrationResults = await Migrator.semaphoreMigrations.runExclusive(async (value) => {
            const LS: LocalStore = await ASL.getOrCreateStore();
            LS.incrementRequestID();

            const modelFile: ModelMigrationFile = modelFileSet[0];
            let MMR: ModelMigrationResults;

            const operation: string = this.extractMode ? 'extraction' : 'migration';
            this.recordMigrationResult(true, `ModelMigration (${modelFile.uniqueID}) Starting ${operation}; semaphore count ${value}`);
            if (!this.extractMode) {
                const MM: ModelMigration = new ModelMigration();
                MMR = await MM.migrateModel(modelFile.uniqueID, user.idUser, modelFileSet, true);
            } else {
                const filePath: string = ModelMigrationFile.computeFilePath(modelFile);
                const MDE: ModelDataExtraction = new ModelDataExtraction(modelFile.uniqueID, path.basename(filePath), undefined, filePath);
                MMR = await MDE.fetchAndExtractInfo();
            }
            if (!MMR.success)
                this.recordMigrationResult(false, `ModelMigration (${modelFile.uniqueID}) ${operation} failed for ${H.Helpers.JSONStringify(modelFile)}: ${MMR.error}`);
            else
                this.recordMigrationResult(true, `ModelMigration (${modelFile.uniqueID}) ${operation} succeeded: ${H.Helpers.JSONStringify(MMR)}`);

            return MMR;
        });
        return res;
    }

    private recordMigrationResult(success: boolean, message: string): void {
        if (success)
            LOG.info(message, LOG.LS.eMIG);
        else {
            this.success = false;
            LOG.error(message, LOG.LS.eMIG);
        }

        this.results += `${message}<br/>\n`;
    }

    private sendError(statusCode: number, message: string): boolean {
        LOG.error(`/migrate error ${message}`, LOG.LS.eMIG);
        this.success = false;
        this.results += `Migration Failed: ${message}`;
        this.response.status(statusCode);
        this.response.send(message ?? '');
        return false;
    }
}
