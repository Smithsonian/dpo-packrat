import * as DBAPI from '../../db';
import * as CACHE from '../../cache';
import * as H from '../../utils/helpers';
import * as LOG from '../../utils/logger';
import * as WFP from '../../workflow/impl/Packrat';
import { ASL, LocalStore } from '../../utils/localStore';

import { SceneMigrationPackages, ModelMigrationFiles } from '../../utils/migration/MigrationData';
import { MigrationUtils, ModelMigration, ModelMigrationResults, ModelMigrationFile, SceneMigration, SceneMigrationResults, SceneMigrationPackage } from '../../utils/migration';

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
    private sceneUUIDToModelMap: Map<string, DBAPI.Model> = new Map<string, DBAPI.Model>(); // mapping of scene edan UUID to model object; used by scene migration to wire scene to master model

    private static semaphoreMigrations: Semaphore = new Semaphore(SimultaneousMigrations);
    private static vocabModelPurposeMaster: DBAPI.Vocabulary | undefined = undefined;

    constructor(request: Request, response: Response) {
        this.request = request;
        this.response = response;
    }

    static async launcher(migrator: Migrator): Promise<boolean> {
        if (!await migrator.parseArguments(true))
            return false;
        if (!Migrator.vocabModelPurposeMaster)
            Migrator.vocabModelPurposeMaster = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eModelPurposeMaster);
        if (!Migrator.vocabModelPurposeMaster)
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
            case '/migrate':
            case '/migrate/':       this.sceneIDSet = null; this.modelIDSet = null; break;
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

        this.recordMigrationResult(true, 'Migration Started');
        const modelMigrationPromiseList: Promise<ModelMigrationResults>[] = [];

        if (this.modelIDSet !== undefined) {
            this.recordMigrationResult(true, 'Migrating Models');

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

            let idSystemObjectItem: number | undefined = undefined;
            for (const modelFiles of modelMigrationMap.values()) {
                let uniqueIDAlreadyMigrated: string | null = null;
                let modelSource: DBAPI.Model | null = null;
                let sceneUUID: string = '';
                for (const modelFile of modelFiles) {
                    if (!sceneUUID && modelFile.edanUUID)
                        sceneUUID = modelFile.edanUUID;

                    const models: DBAPI.Model[] | null = modelFile.idSystemObjectItem
                        ? await DBAPI.Model.fetchItemChildrenModels(modelFile.idSystemObjectItem,
                            modelFile.fileName, [vAssetTypeModel.idVocabulary, vAssetTypeModelGeometryFile.idVocabulary])
                        : null;
                    if (models && models.length > 0) {
                        uniqueIDAlreadyMigrated = modelFile.uniqueID;
                        for (const model of models) {
                            if (Migrator.vocabModelPurposeMaster && model.idVPurpose === Migrator.vocabModelPurposeMaster.idVocabulary) {
                                modelSource = model;
                                break;
                            }
                        }
                        break;
                    }
                    if (!idSystemObjectItem)
                        idSystemObjectItem = modelFile.idSystemObjectItem;
                }

                if (uniqueIDAlreadyMigrated) {
                    this.recordMigrationResult(true, `ModelMigration (${uniqueIDAlreadyMigrated}) skipped: already migrated`);
                    if (sceneUUID && modelSource)
                        this.sceneUUIDToModelMap.set(sceneUUID, modelSource);
                    continue;
                }

                modelMigrationPromiseList.push(this.migrateModel(modelFiles, sceneUUID, idSystemObjectItem, user));
            }
        }

        // Wait for model migration to complete before continuing
        // Scene migration needs parent models to exist before we start
        await Promise.all(modelMigrationPromiseList).then(_resultArray => {
            this.recordMigrationResult(true, 'Migrating Models Complete');
        }).catch((error) => {
            this.recordMigrationResult(false, 'Migrating Models Failed', error);
        });

        if (this.sceneIDSet !== undefined) {
            this.recordMigrationResult(true, 'Migrating Scenes');
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

        return true;
    }

    private async migrateModel(modelFileSet: ModelMigrationFile[], sceneUUID: string, idSystemObjectItem: number | undefined,
        user: DBAPI.User): Promise<ModelMigrationResults> {
        if (modelFileSet.length <= 0) {
            const error: string = 'migrateModel called with no files';
            this.recordMigrationResult(false, error);
            return { success: false, error };
        }

        const res: ModelMigrationResults = await Migrator.semaphoreMigrations.runExclusive(async (value) => {
            const LS: LocalStore = await ASL.getOrCreateStore();
            LS.incrementRequestID();
            await WFP.WorkflowEngine.nextWorkflowSet(LS); // bump workflow set number

            const operation: string = this.extractMode ? 'extraction' : 'migration';
            const modelFile: ModelMigrationFile = modelFileSet[0];
            const uniqueID: string = modelFile.uniqueID;
            this.recordMigrationResult(true, `ModelMigration (${uniqueID}) Starting ${operation}; semaphore count ${value}`);

            const MM: ModelMigration = new ModelMigration();
            const MMR: ModelMigrationResults = await MM.migrateModel(modelFileSet, user.idUser, true, this.extractMode);

            if (!MMR.success)
                this.recordMigrationResult(false, `ModelMigration (${uniqueID}) ${operation} failed for ${H.Helpers.JSONStringify(modelFile)}: ${MMR.error}`);
            else
                this.recordMigrationResult(true, `ModelMigration (${uniqueID}) ${operation} succeeded: ${H.Helpers.JSONStringify(MMR)}`);

            if (MMR.success && MMR.model && sceneUUID)
                this.sceneUUIDToModelMap.set(sceneUUID, MMR.model);

            if (this.extractMode && MMR.success && MMR.supportFiles) {
                for (const supportFile of MMR.supportFiles) {
                    const supportPath: string = path.dirname(path.join(MMR.modelFilePath ?? '', supportFile));
                    const fileName: string = path.basename(supportFile);
                    const scriptLine: string = `SCRIPT { uniqueID: '${uniqueID}', idSystemObjectItem: ${idSystemObjectItem}, path: '${supportPath}', fileName: '${fileName}', name: '${fileName}', title: '', filePath: '', hash: '', geometry: false, testData: false, License: undefined, PublishedState: undefined },`;
                    this.recordMigrationResult(true, scriptLine);
                }
            }

            return MMR;
        });
        return res;
    }

    private async migrateScene(scenePackage: SceneMigrationPackage, user: DBAPI.User): Promise<SceneMigrationResults> {
        const res: SceneMigrationResults = await Migrator.semaphoreMigrations.runExclusive(async (value) => {
            const LS: LocalStore = await ASL.getOrCreateStore();
            LS.incrementRequestID();
            await WFP.WorkflowEngine.nextWorkflowSet(LS); // bump workflow set number

            const model: DBAPI.Model | undefined = this.sceneUUIDToModelMap.get(scenePackage.EdanUUID);

            this.recordMigrationResult(true, `SceneMigration (${scenePackage.EdanUUID}) Starting; semaphore count ${value}`);
            const SM: SceneMigration = new SceneMigration();
            const SMR: SceneMigrationResults = await SM.migrateScene(user.idUser, scenePackage, model, true);
            if (!SMR.success)
                this.recordMigrationResult(false, `SceneMigration (${scenePackage.EdanUUID}) failed for ${H.Helpers.JSONStringify(scenePackage)}: ${SMR.error}`);
            else
                this.recordMigrationResult(true, `SceneMigration (${scenePackage.EdanUUID}) succeeded: ${H.Helpers.JSONStringify(SMR)}`);

            return SMR;
        });
        return res;
    }

    private recordMigrationResult(success: boolean, message: string, error?: any): void { // eslint-disable-line @typescript-eslint/no-explicit-any
        if (success)
            LOG.info(message, LOG.LS.eMIG);
        else {
            this.success = false;
            LOG.error(message, LOG.LS.eMIG, error);
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
