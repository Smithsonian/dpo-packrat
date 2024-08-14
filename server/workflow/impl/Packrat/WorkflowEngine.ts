/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
import * as WF from '../../interface';
import * as WFP from '../../../workflow/impl/Packrat';
import { WorkflowJob } from './WorkflowJob';
import { WorkflowIngestion } from './WorkflowIngestion';
import { WorkflowUpload } from './WorkflowUpload';
import * as COOK from '../../../job/impl/Cook';
import * as LOG from '../../../utils/logger';
import * as CACHE from '../../../cache';
import * as COMMON from '@dpo-packrat/common';
import * as DBAPI from '../../../db';
// import * as REP from '../../../report/interface';
// import { Report } from '../../../report/impl/Report';
import { NameHelpers, ModelHierarchy, UNKNOWN_NAME } from '../../../utils/nameHelpers';
import { ASL, LocalStore } from '../../../utils/localStore';
import * as H from '../../../utils/helpers';
import path from 'path';
import * as L from 'lodash';

type AssetAndVersionResult = {
    success: boolean;
    asset?: DBAPI.Asset | null | undefined;
    assetVersion?: DBAPI.AssetVersion | null | undefined;
};

type ComputeModelInfoResult = {
    exitEarly: boolean;
    idModel?: number | undefined;
    idSystemObjectModel?: number | undefined;
    assetVersionGeometry?: DBAPI.AssetVersion | undefined;
    assetVersionDiffuse?: DBAPI.AssetVersion | undefined;
    assetVersionMTL?: DBAPI.AssetVersion | undefined;
    units?: string | undefined;
};

type ComputeSceneInfoResult = {
    exitEarly: boolean;
    idScene?: number | undefined;
    idSystemObjectScene?: number | undefined;
    idModel?: number | undefined;
    assetSVX?: DBAPI.AssetVersion | undefined;
    assetVersionGeometry?: DBAPI.AssetVersion | undefined;
    assetVersionDiffuse?: DBAPI.AssetVersion | undefined;
    assetVersionMTL?: DBAPI.AssetVersion | undefined;
    scene?: DBAPI.Scene | undefined;
    licenseResolver?: DBAPI.LicenseResolver | undefined;
    units?: string | undefined;
};

export class WorkflowEngine implements WF.IWorkflowEngine {
    private workflowMap: Map<number, WF.IWorkflow> = new Map<number, WF.IWorkflow>();

    async create(workflowParams: WF.WorkflowParameters): Promise<WF.IWorkflow | null> {
        if (!workflowParams.eWorkflowType) {
            LOG.error(`WorkflowEngine.create called without workflow type ${JSON.stringify(workflowParams)}`, LOG.LS.eWF);
            return null;
        }

        LOG.info(`WorkflowEngine.create workflow [${this.workflowMap.size}] ${COMMON.eVocabularyID[workflowParams.eWorkflowType]}: ${JSON.stringify(workflowParams, H.Helpers.saferStringify)}`, LOG.LS.eWF);
        const WFC: DBAPI.WorkflowConstellation | null = await this.createDBObjects(workflowParams);
        if (!WFC)
            return null;

        const workflow: WF.IWorkflow | null = await this.fetchWorkflowImpl(workflowParams, WFC);
        if (!workflow) {
            LOG.error(`WorkflowEngine.create failed to fetch workflow implementation ${COMMON.eVocabularyID[workflowParams.eWorkflowType]}`, LOG.LS.eWF);
            return null;
        }
        if (WFC.workflow)
            this.workflowMap.set(WFC.workflow.idWorkflow, workflow);

        const startResults: H.IOResults = await workflow.start();
        if (!startResults) {
            LOG.error(`WorkflowEngine.create failed to start workflow ${COMMON.eVocabularyID[workflowParams.eWorkflowType]}`, LOG.LS.eWF);
            return null;
        }
        LOG.info(`WorkflowEngine.created workflow [${this.workflowMap.size}]: ${JSON.stringify(workflowParams)}`, LOG.LS.eWF);
        return workflow;
    }

    async jobUpdated(idJobRun: number): Promise<boolean> {
        LOG.info(`WorkflowEngine.jobUpdated: ${idJobRun}`, LOG.LS.eWF);

        const jobRun: DBAPI.JobRun | null = await DBAPI.JobRun.fetch(idJobRun);
        if (!jobRun)
            return false;
        const workflowSteps: DBAPI.WorkflowStep[] | null = await DBAPI.WorkflowStep.fetchFromJobRun(idJobRun);
        if (!workflowSteps)
            return false;

        let result: boolean = true;
        for (const workflowStep of workflowSteps) {
            const WFC: DBAPI.WorkflowConstellation | null = await DBAPI.WorkflowConstellation.fetch(workflowStep.idWorkflow);
            if (!WFC || !WFC.workflow) {
                LOG.error(`WorkflowEngine.jobUpdated (${idJobRun}) skipping orphan workflow step ${JSON.stringify(workflowStep)}`, LOG.LS.eWF);
                continue;
            }

            // lookup workflow object and forward "updated" event
            const workflow: WF.IWorkflow | undefined = this.workflowMap.get(WFC.workflow.idWorkflow);
            if (!workflow) {
                LOG.error(`WorkflowEngine.jobUpdated(${idJobRun}) unable to locate workflow ${WFC.workflow.idWorkflow}`, LOG.LS.eWF);
                continue;
            }

            const updateRes: WF.WorkflowUpdateResults = await workflow.update(workflowStep, jobRun);
            if (updateRes.workflowComplete) {
                this.workflowMap.delete(WFC.workflow.idWorkflow);
                await this.unsetActiveWorkflowStep(true);
                LOG.info(`WorkflowEngine.jobUpdated completed workflow [${this.workflowMap.size}]: ${idJobRun}`, LOG.LS.eWF);
            }
            result = updateRes.success && result;
        }
        return result;
    }

    async event(eWorkflowEvent: COMMON.eVocabularyID, workflowParams: WF.WorkflowParameters | null): Promise<WF.IWorkflow[] | null> {
        LOG.info(`WorkflowEngine.event ${COMMON.eVocabularyID[eWorkflowEvent]}`, LOG.LS.eWF);
        const idVWorkflowEvent: number | undefined = await WorkflowEngine.computeWorkflowIDFromEnum(eWorkflowEvent, COMMON.eVocabularySetID.eWorkflowEvent);
        if (!idVWorkflowEvent) {
            LOG.error(`WorkflowEngine.event called with invalid workflow event type ${COMMON.eVocabularyID[eWorkflowEvent]}`, LOG.LS.eWF);
            return null;
        }

        switch (eWorkflowEvent) {
            case COMMON.eVocabularyID.eWorkflowEventIngestionIngestObject: return this.eventIngestionIngestObject(workflowParams);
            default:
                LOG.info(`WorkflowEngine.event called with unhandled workflow event type ${COMMON.eVocabularyID[eWorkflowEvent]}`, LOG.LS.eWF);
                return null;
        }
    }

    // NOTE: bypassed with manual generateDownloads routine below.
    // async generateSceneDownloads(idScene: number, workflowParams: WF.WorkflowParameters): Promise<WF.IWorkflow[] | null> {

    //     LOG.info(`WorkflowEngine.generateSceneDownloads working...(idScene:${idScene})`,LOG.LS.eWF);
    //     const scene: DBAPI.Scene | null = await DBAPI.Scene.fetch(idScene);
    //     if (!scene) {
    //         LOG.error(`WorkflowEngine.generateSceneDownloads unable to fetch scene from idScene ${idScene}`, LOG.LS.eWF);
    //         return null;
    //     }

    //     const SOScene: DBAPI.SystemObject | null = await scene.fetchSystemObject();
    //     if (!SOScene) {
    //         LOG.error(`WorkflowEngine.generateSceneDownloads unable to fetch scene system object from scene ${H.Helpers.JSONStringify(scene)}`, LOG.LS.eWF);
    //         return null;
    //     }

    //     const CSIR: ComputeSceneInfoResult = await this.computeSceneInfo(idScene, SOScene.idSystemObject);
    //     if (CSIR.exitEarly || CSIR.assetVersionGeometry === undefined || CSIR.assetSVX === undefined) {
    //         LOG.info(`WorkflowEngine.generateSceneDownloads did not locate a scene with a master model parent ready for download generation for scene ${H.Helpers.JSONStringify(scene)}`, LOG.LS.eWF);
    //         return null;
    //     }
    //     return await this.eventIngestionIngestObjectScene(CSIR, workflowParams, true);
    // }

    async generateDownloads(idScene: number, workflowParams: WF.WorkflowParameters): Promise<WF.WorkflowCreateResult> {

        // TODO: make this it's own workflow implementation instead of a routine (e.g. WorkflowGenDownloads)
        // TODO: move scene verification into Scene class (returns CSIR). we then check everything is available for gen downloads here

        //#region get and verify scene
        // grab our scene from the DB
        const scene: DBAPI.Scene | null = await DBAPI.Scene.fetch(idScene);
        if(!scene) {
            LOG.error(`API.generateDownloads failed. cannot find Scene. (idScene:${idScene})`,LOG.LS.eHTTP);
            return { success: false, message: 'cannot find scene' };
        }

        // get our system object
        const sceneSO: DBAPI.SystemObject | null = await scene.fetchSystemObject();
        if(!sceneSO) {
            LOG.error(`WorkflowEngine.generateDownloads failed. Scene is invalid without SystemObject. (idScene: ${scene.idScene})`,LOG.LS.eWF);
            return { success: false, message: 'cannot get SystemObject', data: { isValid: false } };
        }

        // get our information about the scene
        const CSIR: ComputeSceneInfoResult | null = await this.computeSceneInfo(scene.idScene,sceneSO.idSystemObject);
        if(!CSIR || !CSIR.idScene || CSIR.exitEarly==true) {
            LOG.error(`WorkflowEngine.generateDownloads failed. Scene is invalid. (idScene: ${scene.idScene})`,LOG.LS.eWF);
            return { success: false, message: 'cannot compute scene info', data: { isValid: false } };
        }
        LOG.info(`WorkflowEngine.generateDownloads verify scene (idScene:${CSIR.idScene} | sceneFile: ${CSIR.assetSVX?.FileName} | idModel: ${CSIR.idModel} | modelFile: ${CSIR.assetVersionGeometry?.FileName})`,LOG.LS.eDEBUG);

        // make sure we have a voyager scene
        if(!CSIR.assetSVX) {
            LOG.error(`WorkflowEngine.generateDownloads failed. No voyager scene found (idScene: ${scene.idScene})`,LOG.LS.eWF);
            return { success: false, message: 'no voyager scene found', data: { isValid: false } };
        }

        // make sure we have a master model
        if(!CSIR.assetVersionGeometry || !CSIR.idModel) {
            LOG.error(`WorkflowEngine.generateDownloads failed. No master model found (idScene: ${scene.idScene})`,LOG.LS.eWF);
            return { success: false, message: 'no master model found', data: { isValid: false } };
        }

        // make sure we can run the recipe (valid scene, not running, etc)
        if(scene.PosedAndQCd === false) {
            LOG.error(`WorkflowEngine.generateDownloads failed. Scene is invalid. (idScene: ${scene.idScene})`,LOG.LS.eWF);
            return { success: false, message: 'not posed, licensed, or QC', data: { isValid: false } };
        }
        const isValid: boolean = true;
        //#endregion

        //#region check for duplicate jobs
        // make sure we don't have any jobs running. >0 if a running job was found.
        const activeJobs: DBAPI.JobRun[] | null = await DBAPI.JobRun.fetchActiveByScene(8,scene.idScene);
        if(!activeJobs) {
            LOG.error(`WorkflowEngine.generateDownloads failed. cannot determine if job is running. (idScene: ${scene.idScene})`,LOG.LS.eWF);
            return { success: false, message: 'failed to get acti e jobs from DB', data: { isValid: false } };
        }

        // if we're running, we don't duplicate our efforts
        // TODO: allow for cancelling/overwritting existing jobs
        const idActiveJobRun: number[] = activeJobs.map(job => job.idJobRun);
        if(activeJobs.length > 0) {
            // get our workflow & report from the first active job id
            let idWorkflow: number | undefined = undefined;
            let idWorkflowReport: number | undefined = undefined;
            const workflowReport: DBAPI.WorkflowReport[] | null = await DBAPI.WorkflowReport.fetchFromJobRun(activeJobs[0].idJobRun);
            if(workflowReport && workflowReport.length>0) {
                idWorkflowReport = workflowReport[0].idWorkflowReport;
                idWorkflow = workflowReport[0].idWorkflow;
            } else
                LOG.info(`WorkflowEngine.generateDownloads unable to get workflowReport (idScene: ${scene.idScene} | idJobRun: ${activeJobs[0].idJobRun}}).`,LOG.LS.eHTTP);

            LOG.info(`WorkflowEngine.generateDownloads did not start. Job already running (idScene: ${scene.idScene} | activeJobRun: ${idActiveJobRun.join(',')}}).`,LOG.LS.eWF);
            return { success: false, message: 'Job already running', data: { isValid: true, activeJobs, idWorkflow, idWorkflowReport } };
        }
        //#endregion

        //#region get system objects to act on
        const SOGeometry: DBAPI.SystemObject| null = await CSIR.assetVersionGeometry.fetchSystemObject();
        if (!SOGeometry) {
            LOG.error(`WorkflowEngine.eventIngestionIngestObjectScene unable to compute geometry file systemobject from ${JSON.stringify(CSIR.assetVersionGeometry, H.Helpers.saferStringify)}`, LOG.LS.eWF);
            return { success: false, message: 'cannot get SystemObject for geometry file', data: { isValid: false, activeJobs } };
        }
        const idSystemObject: number[] = [SOGeometry.idSystemObject];

        const SOSVX: DBAPI.SystemObject| null = CSIR.assetSVX ? await CSIR.assetSVX.fetchSystemObject() : null;
        if (!SOSVX) {
            LOG.error(`WorkflowEngine.eventIngestionIngestObjectScene unable to compute scene file systemobject from ${JSON.stringify(CSIR.assetSVX, H.Helpers.saferStringify)}`, LOG.LS.eWF);
            return { success: false, message: 'cannot get SystemObject for voyager scene file', data: { isValid: false, activeJobs } };
        }
        idSystemObject.push(SOSVX.idSystemObject);

        const SODiffuse: DBAPI.SystemObject| null = CSIR.assetVersionDiffuse ? await CSIR.assetVersionDiffuse.fetchSystemObject() : null;
        if (SODiffuse)
            idSystemObject.push(SODiffuse.idSystemObject);

        const SOMTL: DBAPI.SystemObject| null = CSIR.assetVersionMTL ? await CSIR.assetVersionMTL.fetchSystemObject() : null;
        if (SOMTL)
            idSystemObject.push(SOMTL.idSystemObject);
        //#endregion

        // build our base names
        const { sceneBaseName, modelBaseName } = await WorkflowEngine.computeSceneAndModelBaseNames(CSIR.idModel, CSIR.assetVersionGeometry.FileName);
        LOG.info(`WorkflowEngine.generateDownloads compute names (sceneBaseName: ${sceneBaseName} | modelBaseName: ${modelBaseName})`,LOG.LS.eDEBUG);

        // #region build our scene parameters
        const parameterHelper: COOK.JobCookSIVoyagerSceneParameterHelper | null = await COOK.JobCookSIVoyagerSceneParameterHelper.compute(CSIR.idModel);
        if(parameterHelper==null) {
            LOG.error(`WorkflowEngine.generateDownloads cannot create workflow parameters\n(CSIR:${H.Helpers.JSONStringify(CSIR)})`, LOG.LS.eWF);
            return { success: false, message: 'cannot create workflow parameters', data: { isValid, activeJobs } };
        }

        // create our parameters for generating downloads job
        const jobParamSIGenerateDownloads: WFP.WorkflowJobParameters =
            new WFP.WorkflowJobParameters(COMMON.eVocabularyID.eJobJobTypeCookSIGenerateDownloads,
                new COOK.JobCookSIGenerateDownloadsParameters(CSIR.idScene, CSIR.idModel, CSIR.assetVersionGeometry.FileName,
                    CSIR.assetSVX.FileName, CSIR.assetVersionDiffuse?.FileName, CSIR.assetVersionMTL?.FileName, sceneBaseName, CSIR.units, undefined, parameterHelper ));

        // get our project for this scene.
        // if no project found then have integrity issue and should not make things by creating additional assets
        const sceneProjects: DBAPI.Project[] | null = await DBAPI.Project.fetchFromScene(scene.idScene);
        if(!sceneProjects || sceneProjects.length!=1) {
            LOG.error(`WorkflowEngine.generateDownloads cannot find project for scene. (idScene: ${scene.idScene})`, LOG.LS.eWF);
            return { success: false, message: `cannot create workflow if scene does not have a Project (${scene.idScene})`, data: { isValid, activeJobs } };
        }

        // create parameters for the workflow based on those created for the job
        const wfParamSIGenerateDownloads: WF.WorkflowParameters = {
            eWorkflowType: COMMON.eVocabularyID.eWorkflowTypeCookJob,
            idSystemObject,
            idProject: sceneProjects[0].idProject,
            idUserInitiator: workflowParams.idUserInitiator,
            parameters: jobParamSIGenerateDownloads,
        };
        LOG.info(`WorkflowEngine.generateDownloads generating downloads... (${H.Helpers.JSONStringify(wfParamSIGenerateDownloads)})`, LOG.LS.eDEBUG);
        //#endregion

        const doCreate: boolean = true;
        if(doCreate) {
            // create our workflow
            const wf: WF.IWorkflow | null = await this.create(wfParamSIGenerateDownloads);
            if (!wf) {
                LOG.error(`WorkflowEngine.generateDownloads unable to create Cook si-generate-downloads workflow: ${H.Helpers.JSONStringify(wfParamSIGenerateDownloads)}`, LOG.LS.eWF);
                return { success: false, message: 'cannot create downloads workflow', data: { isValid, activeJobs } };
            }

            // get our Workflow object from the database
            const workflow: DBAPI.Workflow | null = await wf.getWorkflowObject();
            if(!workflow) {
                LOG.error(`WorkflowEngine.generateDownloads unable to get DB object for workflow. (${H.Helpers.JSONStringify(wfParamSIGenerateDownloads)})`, LOG.LS.eWF);
                return { success: false, message: 'cannot get worfklow object', data: { isValid, activeJobs } };
            }
            LOG.info(`WorkflowEngine.generateDownloads retrieved workflow (${workflow.idWorkflow} | ${workflow.idWorkflowSet})`,LOG.LS.eDEBUG);

            // get our workflow report for the new workflow
            const workflowReport: DBAPI.WorkflowReport[] | null = await DBAPI.WorkflowReport.fetchFromWorkflow(workflow.idWorkflow);
            if(!workflowReport || workflowReport.length <= 0) {
                LOG.error(`WorkflowEngine.generateDownloads unable to get workflow report. (${workflow.idWorkflow}))`, LOG.LS.eWF);
                return { success: false, message: 'cannot get worfklow report object', data: { isValid, activeJobs } };
            }
            LOG.info(`WorkflowEngine.generateDownloads retrieved workflow report (${workflowReport[0].idWorkflowReport})`,LOG.LS.eDEBUG);
            LOG.info(`\t ${H.Helpers.JSONStringify(workflowReport[0].Data)}`,LOG.LS.eDEBUG);

            // return success
            return { success: true, message: 'generating downloads', data: { isValid, activeJobs, workflow, workflowReport } };
        } else
            return { success: true, message: 'generating downloads', data: { isValid, activeJobs } };
    }

    private async eventIngestionIngestObject(workflowParams: WF.WorkflowParameters | null): Promise<WF.IWorkflow[] | null> {
        LOG.info(`WorkflowEngine.eventIngestionIngestObject params=${JSON.stringify(workflowParams)}`, LOG.LS.eWF);
        if (!workflowParams || !workflowParams.idSystemObject)
            return null;

        const modelTransformUpdated: boolean = workflowParams.parameters?.modelTransformUpdated !== undefined
            ? workflowParams.parameters.modelTransformUpdated : false;
        const assetsIngested: boolean = workflowParams.parameters?.assetsIngested !== undefined
            ?  workflowParams.parameters.assetsIngested : false;
        // LOG.info(`WorkflowEngine.eventIngestionIngestObject modelTransformUpdated=${modelTransformUpdated}, assetsIngested=${assetsIngested}`, LOG.LS.eWF);

        let CMIR: ComputeModelInfoResult | undefined = undefined;
        let CSIR: ComputeSceneInfoResult | undefined = undefined;

        const systemObjectHandled: Set<number> = new Set<number>();
        for (const idSystemObject of workflowParams.idSystemObject) {
            const { success, asset, assetVersion } = await this.computeAssetAndVersion(idSystemObject);
            // LOG.info(`WorkflowEngine.eventIngestionIngestObject computeAssetAndVersion ${JSON.stringify({ success, asset, assetVersion }, H.Helpers.saferStringify)}`, LOG.LS.eWF);
            if (!success || !asset || !assetVersion || !asset.idSystemObject)
                continue;

            // skip processing asset-owning parent objects multiple times
            if (systemObjectHandled.has(asset.idSystemObject))
                continue;
            else
                systemObjectHandled.add(asset.idSystemObject);

            const oID: DBAPI.ObjectIDAndType | undefined = await CACHE.SystemObjectCache.getObjectFromSystem(asset.idSystemObject);
            if (!oID) {
                LOG.error(`WorkflowEngine.eventIngestionIngestObject unable to compute system object owner of ${JSON.stringify(asset, H.Helpers.saferStringify)}`, LOG.LS.eWF);
                continue;
            }

            // for now, we only have special rules for ingestion of asset versions owned by models and scenes:
            switch (oID.eObjectType) {
                case COMMON.eSystemObjectType.eModel:
                    if (!CMIR) { // lookup model info, if we haven't already
                        CMIR = await this.computeModelInfo(oID.idObject, asset.idSystemObject);
                        if (CMIR.exitEarly || CMIR.assetVersionGeometry === undefined) {
                            LOG.info(`WorkflowEngine.eventIngestionIngestObject skipping model ${JSON.stringify(oID)}`, LOG.LS.eWF);
                            CMIR = undefined;
                            continue;
                        }
                    } else if (CMIR.idModel !== oID.idObject) { // make sure we're processing the same model
                        LOG.error(`WorkflowEngine.eventIngestionIngestObject encountered multiple models ([${CMIR.idModel}, ${oID.idObject}])`, LOG.LS.eWF);
                        continue;
                    }
                    break;

                case COMMON.eSystemObjectType.eScene:
                    if (modelTransformUpdated) { // only progress through scene ingestion workflows if our model transform was updated
                        if (!CSIR) {
                            CSIR = await this.computeSceneInfo(oID.idObject, asset.idSystemObject);
                            if (CSIR.exitEarly || CSIR.assetVersionGeometry === undefined || CSIR.assetSVX === undefined) {
                                LOG.info(`WorkflowEngine.eventIngestionIngestObject skipping scene ${JSON.stringify(oID)}`, LOG.LS.eWF);
                                CSIR = undefined;
                                continue;
                            }
                        } else if (CSIR.idScene !== oID.idObject) {
                            LOG.error(`WorkflowEngine.eventIngestionIngestObject encountered multiple scenes ([${CSIR.idScene}, ${oID.idObject}])`, LOG.LS.eWF);
                            continue;
                        }

                        if (CSIR.scene !== undefined && !CSIR.scene.PosedAndQCd) { // we have scene info, and that scene has not been posed and QCd
                            LOG.info(`WorkflowEngine.eventIngestionIngestObject skipping scene ${JSON.stringify(oID)} which has not been PosedAndQCd`, LOG.LS.eWF);
                            CSIR = undefined;
                            continue;
                        }

                        if (!DBAPI.LicenseAllowsDownloadGeneration(CSIR.licenseResolver?.License?.RestrictLevel)) { // we don't have a license resolver, or that license does not allow download generation
                            LOG.info(`WorkflowEngine.eventIngestionIngestObject skipping scene ${JSON.stringify(oID)} which does not have the needed license for download generation`, LOG.LS.eWF);
                            CSIR = undefined;
                            continue;
                        }
                    }
                    break;
            }
        }

        let workflows: WF.IWorkflow[] = [];
        if (CMIR)
            workflows = workflows.concat(await this.eventIngestionIngestObjectModel(CMIR, workflowParams, assetsIngested) ?? []);
        if (CSIR) {
            workflows = workflows.concat(await this.eventIngestionIngestObjectScene(CSIR, workflowParams, assetsIngested) ?? []);
        }
        return workflows.length > 0 ? workflows : null;
    }

    private async eventIngestionIngestObjectModel(CMIR: ComputeModelInfoResult, workflowParams: WF.WorkflowParameters, assetsIngested: boolean, generateDownloads: boolean = false): Promise<WF.IWorkflow[] | null> {
        if (!assetsIngested) {
            LOG.info(`WorkflowEngine.eventIngestionIngestObjectModel skipping post-ingest workflows as no assets were updated for ${JSON.stringify(CMIR, H.Helpers.saferStringify)}`, LOG.LS.eWF);
            return null;
        }

        if (CMIR.assetVersionGeometry === undefined) {
            LOG.error(`WorkflowEngine.eventIngestionIngestObjectModel unable to compute geometry and/or diffuse texture from model ${CMIR.idModel}`, LOG.LS.eWF);
            return null;
        }

        const eModelType: COMMON.eVocabularyID | undefined = await CACHE.VocabularyCache.mapModelFileByExtensionID(CMIR.assetVersionGeometry.FileName);
        switch (eModelType) {
            // Allowable types!
            case COMMON.eVocabularyID.eModelFileTypestl:
            case COMMON.eVocabularyID.eModelFileTypeply:
            case COMMON.eVocabularyID.eModelFileTypeobj:
            case COMMON.eVocabularyID.eModelFileTypefbx:
            case COMMON.eVocabularyID.eModelFileTypewrl:
            case COMMON.eVocabularyID.eModelFileTypex3d:
            case COMMON.eVocabularyID.eModelFileTypedae:
                break;

            // All others will not result in scene or download generation
            default:
                LOG.info(`WorkflowEngine.eventIngestionIngestObjectModel skipping unsupported model type ${eModelType ? COMMON.eVocabularyID[eModelType] : 'unknown'} for ${JSON.stringify(CMIR.assetVersionGeometry, H.Helpers.saferStringify)}`, LOG.LS.eWF);
                return null;
        }

        const SOGeometry: DBAPI.SystemObject| null = await CMIR.assetVersionGeometry.fetchSystemObject();
        if (!SOGeometry) {
            LOG.error(`WorkflowEngine.eventIngestionIngestObjectModel unable to compute geometry file systemobject from ${JSON.stringify(CMIR.assetVersionGeometry, H.Helpers.saferStringify)}`, LOG.LS.eWF);
            return null;
        }
        const idSystemObject: number[] = [SOGeometry.idSystemObject];

        const SODiffuse: DBAPI.SystemObject| null = CMIR.assetVersionDiffuse ? await CMIR.assetVersionDiffuse.fetchSystemObject() : null;
        if (SODiffuse)
            idSystemObject.push(SODiffuse.idSystemObject);

        const SOMTL: DBAPI.SystemObject| null = CMIR.assetVersionMTL ? await CMIR.assetVersionMTL.fetchSystemObject() : null;
        if (SOMTL)
            idSystemObject.push(SOMTL.idSystemObject);

        const workflows: WF.IWorkflow[] = [];
        const { sceneBaseName, modelBaseName } = await WorkflowEngine.computeSceneAndModelBaseNames(CMIR.idModel, CMIR.assetVersionGeometry.FileName);

        // initiate WorkflowJob for cook si-voyager-scene
        if (CMIR.units !== undefined) {
            const parameterHelper: COOK.JobCookSIVoyagerSceneParameterHelper | null = await COOK.JobCookSIVoyagerSceneParameterHelper.compute(CMIR.idModel);
            if (parameterHelper) {
                if (workflowParams.parameters.skipSceneGenerate) {
                    LOG.info(`WorkflowEngine.eventIngestionIngestObjectModel skipping si-voyager-scene per user instruction idSO ${workflowParams.idSystemObject}`, LOG.LS.eWF);
                } else {
                    const jobParamSIVoyagerScene: WFP.WorkflowJobParameters =
                        new WFP.WorkflowJobParameters(COMMON.eVocabularyID.eJobJobTypeCookSIVoyagerScene,
                            new COOK.JobCookSIVoyagerSceneParameters(parameterHelper, CMIR.assetVersionGeometry.FileName, CMIR.units,
                            CMIR.assetVersionDiffuse?.FileName, sceneBaseName + '.svx.json', undefined, sceneBaseName));

                    const wfParamSIVoyagerScene: WF.WorkflowParameters = {
                        eWorkflowType: COMMON.eVocabularyID.eWorkflowTypeCookJob,
                        idSystemObject,
                        idProject: workflowParams.idProject,
                        idUserInitiator: workflowParams.idUserInitiator,
                        parameters: jobParamSIVoyagerScene,
                    };
                    const wfSIVoyagerScene: WF.IWorkflow | null = await this.create(wfParamSIVoyagerScene);
                    if (wfSIVoyagerScene)
                        workflows.push(wfSIVoyagerScene);
                    else
                        LOG.error(`WorkflowEngine.eventIngestionIngestObjectModel unable to create Cook si-voyager-scene workflow: ${JSON.stringify(wfParamSIVoyagerScene)}`, LOG.LS.eWF);
                }
            } else
                LOG.error(`WorkflowEngine.eventIngestionIngestObjectModel unable to compute parameter info needed by Cook si-voyager-scene workflow from model: ${CMIR.idModel}`, LOG.LS.eWF);
        } else
            LOG.info(`WorkflowEngine.eventIngestionIngestObjectModel skipping si-voyager-scene for master model with unsupported units ${JSON.stringify(CMIR, H.Helpers.saferStringify)}`, LOG.LS.eWF);

        // do we want to generate downloads for this ingestion
        if(generateDownloads===true) {

            // TEMP: preventing automatic download generation
            if(generateDownloads===true) {
                LOG.info(`!!! WorkflowEngine.generateDownloads reached w/ ingest model. (idScene: ${CMIR.idModel})`,LOG.LS.eDEBUG);
                console.trace('WorkflowEngine.generateDownloads');
                return null;
            }

            // does this ingested model have a scene child?  If so, initiate WorkflowJob for cook si-generate-downloads
            const SODerived: DBAPI.SystemObject[] | null = CMIR.idSystemObjectModel ? await DBAPI.SystemObject.fetchDerivedFromXref(CMIR.idSystemObjectModel) : null;
            if (!SODerived)
                return workflows.length > 0 ? workflows : null;

            LOG.info(`WorkflowEngine.eventIngestionIngestObjectModel generating downloads: ${H.Helpers.JSONStringify(CMIR)}`,LOG.LS.eWF);

            for (const SO of SODerived) {
                if (SO.idScene) {
                    // locate the scene file asset attached to this system object
                    const sceneAssetVersions: DBAPI.AssetVersion[] | null = await DBAPI.AssetVersion.fetchFromSystemObject(SO.idSystemObject);
                    if (!sceneAssetVersions) {
                        LOG.error(`WorkflowEngine.eventIngestionIngestObjectModel unable to fetch scene's assets from ${JSON.stringify(SO, H.Helpers.saferStringify)}`, LOG.LS.eWF);
                        continue;
                    }

                    let sceneAssetVersion: DBAPI.AssetVersion | null = null;
                    for (const AV of sceneAssetVersions) {
                        if (AV.FileName.toLowerCase().endsWith('.svx.json')) {
                            sceneAssetVersion = AV;
                            break;
                        }
                    }

                    if (!sceneAssetVersion) {
                        LOG.error(`WorkflowEngine.eventIngestionIngestObjectModel unable to find scene .svx.json's asset version from ${JSON.stringify(SO, H.Helpers.saferStringify)}`, LOG.LS.eWF);
                        continue;
                    }

                    const idSystemObjectClone: number[] = L.clone(idSystemObject);
                    const SOSceneAsset: DBAPI.SystemObject | null = sceneAssetVersion ? await sceneAssetVersion.fetchSystemObject() : null;
                    if (SOSceneAsset)
                        idSystemObjectClone.push(SOSceneAsset.idSystemObject);

                    const jobParamSIGenerateDownloads: WFP.WorkflowJobParameters =
                        new WFP.WorkflowJobParameters(COMMON.eVocabularyID.eJobJobTypeCookSIGenerateDownloads,
                            new COOK.JobCookSIGenerateDownloadsParameters(SO.idScene, CMIR.idModel, CMIR.assetVersionGeometry.FileName,
                                sceneAssetVersion.FileName, CMIR.assetVersionDiffuse?.FileName, CMIR.assetVersionMTL?.FileName, modelBaseName));

                    const wfParamSIGenerateDownloads: WF.WorkflowParameters = {
                        eWorkflowType: COMMON.eVocabularyID.eWorkflowTypeCookJob,
                        idSystemObject: idSystemObjectClone,
                        idProject: workflowParams.idProject,
                        idUserInitiator: workflowParams.idUserInitiator,
                        parameters: jobParamSIGenerateDownloads,
                    };

                    // LOG.info(`WorkflowEngine.eventIngestionIngestObjectScene. generating downloads...\n${H.Helpers.JSONStringify(wfParamSIGenerateDownloads)}`,LOG.LS.eWF);

                    const wfSIGenerateDownloads: WF.IWorkflow | null = await this.create(wfParamSIGenerateDownloads);
                    if (wfSIGenerateDownloads)
                        workflows.push(wfSIGenerateDownloads);
                    else
                        LOG.error(`WorkflowEngine.eventIngestionUploadAssetVersion unable to create Cook si-voyager-scene workflow: ${JSON.stringify(wfParamSIGenerateDownloads)}`, LOG.LS.eWF);
                }
            }
        } else
            LOG.info('WorkflowEngine.eventIngestionUploadAssetVersion skipping generating downloads',LOG.LS.eWF);

        return workflows.length > 0 ? workflows : null;
    }

    private async eventIngestionIngestObjectScene(CSIR: ComputeSceneInfoResult, workflowParams: WF.WorkflowParameters, assetsIngested: boolean, generateDownloads: boolean = false): Promise<WF.IWorkflow[] | null> {
        if (!assetsIngested) {
            LOG.info(`WorkflowEngine.eventIngestionIngestObjectScene skipping post-ingest workflows as no assets were updated for ${JSON.stringify(CSIR, H.Helpers.saferStringify)}`, LOG.LS.eWF);
            return null;
        }

        if (CSIR.assetVersionGeometry === undefined || CSIR.assetSVX === undefined) {
            LOG.error(`WorkflowEngine.eventIngestionIngestObjectScene unable to compute geometry and/or scene asset version from scene ${CSIR.idScene}`, LOG.LS.eWF);
            return null;
        }

        const SOGeometry: DBAPI.SystemObject| null = await CSIR.assetVersionGeometry.fetchSystemObject();
        if (!SOGeometry) {
            LOG.error(`WorkflowEngine.eventIngestionIngestObjectScene unable to compute geometry file systemobject from ${JSON.stringify(CSIR.assetVersionGeometry, H.Helpers.saferStringify)}`, LOG.LS.eWF);
            return null;
        }
        const idSystemObject: number[] = [SOGeometry.idSystemObject];

        const SOSVX: DBAPI.SystemObject| null = CSIR.assetSVX ? await CSIR.assetSVX.fetchSystemObject() : null;
        if (!SOSVX) {
            LOG.error(`WorkflowEngine.eventIngestionIngestObjectScene unable to compute scene file systemobject from ${JSON.stringify(CSIR.assetSVX, H.Helpers.saferStringify)}`, LOG.LS.eWF);
            return null;
        }
        idSystemObject.push(SOSVX.idSystemObject);

        const SODiffuse: DBAPI.SystemObject| null = CSIR.assetVersionDiffuse ? await CSIR.assetVersionDiffuse.fetchSystemObject() : null;
        if (SODiffuse)
            idSystemObject.push(SODiffuse.idSystemObject);

        const SOMTL: DBAPI.SystemObject| null = CSIR.assetVersionMTL ? await CSIR.assetVersionMTL.fetchSystemObject() : null;
        if (SOMTL)
            idSystemObject.push(SOMTL.idSystemObject);

        // do we want to generate downloads for this scene
        if(generateDownloads===true) {

            // TEMP: preventing automatic download generation
            if(generateDownloads===true) {
                LOG.info(`!!! WorkflowEngine.generateDownloads reached w/ ingest scene. (idScene: ${CSIR.idScene})`,LOG.LS.eDEBUG);
                console.trace('WorkflowEngine.generateDownloads');
                return null;
            }

            // initiate WorkflowJob for cook si-generate-download
            const { sceneBaseName } = await WorkflowEngine.computeSceneAndModelBaseNames(CSIR.idModel, CSIR.assetVersionGeometry.FileName);

            // make sure we have our basic parameters
            if(!CSIR.idModel || !CSIR.idScene) {
                LOG.error(`WorkflowEngine.eventIngestionIngestObjectScene cannot find idModel(${CSIR.idModel}) or idScene(${CSIR.idScene})`, LOG.LS.eWF);
                return null;
            }

            // get our scene parameters
            const parameterHelper: COOK.JobCookSIVoyagerSceneParameterHelper | null = await COOK.JobCookSIVoyagerSceneParameterHelper.compute(CSIR.idModel);
            if(parameterHelper==null) {
                LOG.error(`WorkflowEngine.eventIngestionIngestObjectScene cannot find model/scene ids\n(CSIR:${JSON.stringify(CSIR, H.Helpers.saferStringify)})`, LOG.LS.eWF);
                return null;
            }

            const jobParamSIGenerateDownloads: WFP.WorkflowJobParameters =
                new WFP.WorkflowJobParameters(COMMON.eVocabularyID.eJobJobTypeCookSIGenerateDownloads,
                    new COOK.JobCookSIGenerateDownloadsParameters(CSIR.idScene, CSIR.idModel, CSIR.assetVersionGeometry.FileName,
                        CSIR.assetSVX.FileName, CSIR.assetVersionDiffuse?.FileName, CSIR.assetVersionMTL?.FileName, sceneBaseName, undefined, undefined, parameterHelper ));

            const wfParamSIGenerateDownloads: WF.WorkflowParameters = {
                eWorkflowType: COMMON.eVocabularyID.eWorkflowTypeCookJob,
                idSystemObject,
                idProject: workflowParams.idProject,
                idUserInitiator: workflowParams.idUserInitiator,
                parameters: jobParamSIGenerateDownloads,
            };

            LOG.info(`WorkflowEngine.eventIngestionIngestObjectScene. generating downloads...\n${H.Helpers.JSONStringify(wfParamSIGenerateDownloads)}`,LOG.LS.eWF);

            const workflow: WF.IWorkflow | null = await this.create(wfParamSIGenerateDownloads);
            if (workflow)
                return [workflow];
            LOG.error(`WorkflowEngine.eventIngestionIngestObjectScene unable to create Cook si-generate-downloads workflow: ${JSON.stringify(wfParamSIGenerateDownloads)}`, LOG.LS.eWF);
        } else
            LOG.info('WorkflowEngine.eventIngestionUploadAssetVersion skipping generating downloads',LOG.LS.eWF);

        return null;
    }

    private static async computeSceneAndModelBaseNames(idModel: number | undefined, defaultFileName: string): Promise<{ sceneBaseName: string, modelBaseName: string}> {
        let modelSource: DBAPI.Model | null = null;
        if (idModel) {
            modelSource = await DBAPI.Model.fetch(idModel);
            if (!modelSource)
                LOG.error(`WorkflowEngine.computeSceneAndModelBaseNames unable to compute Model from idModel ${idModel}`, LOG.LS.eWF);
        }

        let sceneBaseName: string | null = null;
        if (modelSource) {
            const MH: ModelHierarchy | null = await NameHelpers.computeModelHierarchy(modelSource);
            if (MH) {
                sceneBaseName = NameHelpers.sceneDisplayName('', [MH]); // '' means we don't have a subtitle provided by the user
                if (sceneBaseName === UNKNOWN_NAME)
                    sceneBaseName = null;
            } else
                LOG.error(`WorkflowEngine.eventIngestionIngestObjectModel unable to load model hierarchy from Model ${H.Helpers.JSONStringify(modelSource)}`, LOG.LS.eWF);
        }

        if (!sceneBaseName)
            sceneBaseName = path.parse(defaultFileName).name;
        sceneBaseName = NameHelpers.sanitizeFileName(sceneBaseName);

        const modelBaseName: string = modelSource ? NameHelpers.sanitizeFileName(modelSource.Name) : sceneBaseName;
        return { modelBaseName, sceneBaseName };
    }

    static async computeWorkflowIDFromEnum(eVocabEnum: COMMON.eVocabularyID, eVocabSetEnum: COMMON.eVocabularySetID): Promise<number | undefined> {
        const idVocab: number | undefined = await CACHE.VocabularyCache.vocabularyEnumToId(eVocabEnum);
        if (!idVocab) {
            LOG.error(`WorkflowEngine.computeWorkflowTypeFromEnum called with invalid workflow type ${COMMON.eVocabularyID[eVocabEnum]}`, LOG.LS.eWF);
            return undefined;
        }
        if (!await CACHE.VocabularyCache.isVocabularyInSet(eVocabEnum, eVocabSetEnum)) {
            LOG.error(`WorkflowEngine.computeWorkflowTypeFromEnum called with non-workflow type vocabulary ${COMMON.eVocabularyID[eVocabEnum]}`, LOG.LS.eWF);
            return undefined;
        }
        return idVocab;
    }

    static async computeWorkflowEnumFromID(idVocab: number, eVocabSetEnum: COMMON.eVocabularySetID): Promise<COMMON.eVocabularyID | undefined> {
        const eVocabEnum: COMMON.eVocabularyID | undefined = await CACHE.VocabularyCache.vocabularyIdToEnum(idVocab);
        if (!eVocabEnum) {
            LOG.error(`WorkflowEngine.computeWorkflowTypeEnumFromID called with invalid workflow type ${idVocab}`, LOG.LS.eWF);
            return undefined;
        }
        if (!await CACHE.VocabularyCache.isVocabularyInSet(eVocabEnum, eVocabSetEnum)) {
            LOG.error(`WorkflowEngine.computeWorkflowTypeEnumFromID called with non-workflow type vocabulary ${COMMON.eVocabularyID[eVocabEnum]}`, LOG.LS.eWF);
            return undefined;
        }
        return eVocabEnum;
    }

    private async createDBObjects(workflowParams: WF.WorkflowParameters): Promise<DBAPI.WorkflowConstellation | null> {
        const WFC: DBAPI.WorkflowConstellation = new DBAPI.WorkflowConstellation();
        // *****************************************************
        // Workflow
        if (!workflowParams.eWorkflowType)
            return null;
        const idVWorkflowType: number | undefined = await WorkflowEngine.computeWorkflowIDFromEnum(workflowParams.eWorkflowType, COMMON.eVocabularySetID.eWorkflowType);
        if (!idVWorkflowType)
            return null;
        const dtNow: Date = new Date();

        WFC.workflowSet = await WorkflowEngine.getActiveWorkflowSet();

        WFC.workflow = new DBAPI.Workflow({
            idVWorkflowType,
            idProject: workflowParams.idProject ?? null,
            idUserInitiator: workflowParams.idUserInitiator ?? null,
            DateInitiated: dtNow,
            DateUpdated: dtNow,
            Parameters: workflowParams.parameters ? JSON.stringify(workflowParams.parameters, H.Helpers.saferStringify) : null,
            idWorkflowSet: WFC.workflowSet ? WFC.workflowSet.idWorkflowSet : null,
            idWorkflow: 0
        });
        if (!await WFC.workflow.create())
            return null;

        // *****************************************************
        // WorkflowStep for initiation
        const idVWorkflowStepType: number | undefined = await CACHE.VocabularyCache.vocabularyEnumToId(COMMON.eVocabularyID.eWorkflowStepTypeStart);
        if (!idVWorkflowStepType) {
            LOG.error(`WorkflowEngine.create called with invalid workflow type ${COMMON.eVocabularyID[workflowParams.eWorkflowType]}`, LOG.LS.eWF);
            return null;
        }

        const workflowStep: DBAPI.WorkflowStep = new DBAPI.WorkflowStep({
            idWorkflow: WFC.workflow.idWorkflow,
            idJobRun: null,
            idUserOwner: workflowParams.idUserInitiator ?? null,
            idVWorkflowStepType,
            State: COMMON.eWorkflowJobRunStatus.eCreated,
            DateCreated: dtNow,
            DateCompleted: dtNow,
            idWorkflowStep: 0
        });
        if (!await workflowStep.create())
            return null;
        WFC.workflowStep = [];
        WFC.workflowStep.push(workflowStep);

        await this.setActiveWorkflowStep(workflowStep);

        // *****************************************************
        // WorkflowStepSystemObjectXref for linked system objects
        let workflowStepXref: DBAPI.WorkflowStepSystemObjectXref[] | null = null;
        if (workflowParams.idSystemObject) {
            workflowStepXref = [];
            for (const idSystemObject of workflowParams.idSystemObject) {
                const workflowStepSystemObjectXref: DBAPI.WorkflowStepSystemObjectXref = new DBAPI.WorkflowStepSystemObjectXref({
                    idWorkflowStep: workflowStep.idWorkflowStep,
                    idSystemObject,
                    Input: true,
                    idWorkflowStepSystemObjectXref: 0
                });
                if (await workflowStepSystemObjectXref.create())
                    workflowStepXref.push(workflowStepSystemObjectXref);
            }
        }
        WFC.workflowStepXref = workflowStepXref;
        return WFC;
    }

    private async fetchWorkflowImpl(workflowParams: WF.WorkflowParameters, WFC: DBAPI.WorkflowConstellation): Promise<WF.IWorkflow | null> {
        switch (workflowParams.eWorkflowType) {
            case COMMON.eVocabularyID.eWorkflowTypeCookJob: return await WorkflowJob.constructWorkflow(workflowParams, WFC);
            case COMMON.eVocabularyID.eWorkflowTypeIngestion: return await WorkflowIngestion.constructWorkflow(workflowParams, WFC);
            case COMMON.eVocabularyID.eWorkflowTypeUpload: return await WorkflowUpload.constructWorkflow(workflowParams, WFC);
        }
        return null;
    }

    private async computeAssetAndVersion(idSystemObject: number): Promise<AssetAndVersionResult> {
        const oID: DBAPI.ObjectIDAndType | undefined = await CACHE.SystemObjectCache.getObjectFromSystem(idSystemObject);
        if (!oID) {
            LOG.error(`WorkflowEngine.computeAssetAndVersion skipping invalid idSystemObject ${idSystemObject}`, LOG.LS.eWF);
            return { success: false };
        }

        if (oID.eObjectType != COMMON.eSystemObjectType.eAssetVersion) {
            LOG.error(`WorkflowEngine.computeAssetAndVersion skipping invalid object ${JSON.stringify(oID)}`, LOG.LS.eWF);
            return { success: false };
        }

        // load asset version
        const assetVersion: DBAPI.AssetVersion | null = await DBAPI.AssetVersion.fetch(oID.idObject);
        if (!assetVersion)  {
            LOG.error(`WorkflowEngine.computeAssetAndVersion skipping invalid object ${JSON.stringify(oID)}`, LOG.LS.eWF);
            return { success: false };
        }

        // load asset
        const asset: DBAPI.Asset | null = await DBAPI.Asset.fetch(assetVersion.idAsset);
        if (!asset) {
            LOG.error(`WorkflowEngine.computeAssetAndVersion unable to load asset from idAsset ${assetVersion.idAsset}`, LOG.LS.eWF);
            return { success: false };
        }
        return { success: true, asset, assetVersion };
    }

    private async computeModelInfo(idModel: number, idSystemObjectModel: number): Promise<ComputeModelInfoResult> {
        const vMaster: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eModelPurposeMaster);
        const vDiffuse: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeDiffuse);
        if (!vMaster || !vDiffuse) {
            LOG.error('WorkflowEngine.computeModelInfo unable to compute model vocabulary', LOG.LS.eWF);
            return { exitEarly: true };
        }

        // lookup model constellation
        const modelConstellation: DBAPI.ModelConstellation | null = await DBAPI.ModelConstellation.fetch(idModel);
        if (!modelConstellation || !modelConstellation.Model || !modelConstellation.ModelAssets) {
            LOG.error(`WorkflowEngine.computeModelInfo unable to compute model from ${JSON.stringify(idModel)}`, LOG.LS.eWF);
            return { exitEarly: true };
        }

        // If this is not a master model, skip post-ingestion workflow
        if (modelConstellation.Model.idVPurpose != vMaster.idVocabulary) {
            LOG.info(`WorkflowEngine.computeModelInfo skipping non-master model ${JSON.stringify(modelConstellation.Model, H.Helpers.saferStringify)}`, LOG.LS.eWF);
            return { exitEarly: true };
        }

        // lookup the model geometry file and the diffuse color texture map:
        let idAssetDiffuse: number | null | undefined = undefined;
        let assetVersionGeometry: DBAPI.AssetVersion | undefined = undefined;
        let assetVersionDiffuse: DBAPI.AssetVersion | undefined = undefined;
        let assetVersionDiffuseBackup: DBAPI.AssetVersion | undefined = undefined;
        let assetVersionMTL: DBAPI.AssetVersion | undefined = undefined;
        if (modelConstellation.ModelMaterialChannels) {
            for (const MMC of modelConstellation.ModelMaterialChannels) {
                // Skip everything but diffuse channel
                if (MMC.idVMaterialType != vDiffuse.idVocabulary)
                    continue;
                if (idAssetDiffuse !== undefined) {
                    LOG.error(`WorkflowEngine.computeModelInfo encountered multiple diffuse channels in model ${modelConstellation.Model.idModel}`, LOG.LS.eWF);
                    break;
                }

                if (MMC.UVMapEmbedded) // stored in geometry file
                    idAssetDiffuse = null;
                else if (MMC.idModelMaterialUVMap) { // stored in map ... now find it!
                    if (modelConstellation.ModelMaterialUVMaps) {
                        for (const MMUV of modelConstellation.ModelMaterialUVMaps) {
                            if (MMUV.idModelMaterialUVMap == MMC.idModelMaterialUVMap) {
                                idAssetDiffuse = MMUV.idAsset;
                                break;
                            }
                        }
                    }
                    if (!idAssetDiffuse) {
                        LOG.error(`WorkflowEngine.computeModelInfo could not find expected diffuse channel in UV Map ${MMC.idModelMaterial}`, LOG.LS.eWF);
                        continue;
                    }
                }
            }
        }

        let UVMapFileCount: number = 0;
        for (const modelAsset of modelConstellation.ModelAssets) {
            if (idAssetDiffuse === modelAsset.Asset.idAsset)
                assetVersionDiffuse = modelAsset.AssetVersion;

            const eAssetType: COMMON.eVocabularyID | undefined = await modelAsset.Asset.assetType();
            switch (eAssetType) {
                case COMMON.eVocabularyID.eAssetAssetTypeModel:
                case COMMON.eVocabularyID.eAssetAssetTypeModelGeometryFile:
                    if (!assetVersionGeometry)
                        assetVersionGeometry = modelAsset.AssetVersion;
                    else {
                        LOG.error(`WorkflowEngine.computeModelInfo encountered multiple geometry files for model ${JSON.stringify(modelConstellation.Model)}`, LOG.LS.eWF);
                        continue;
                    }
                    break;
                case COMMON.eVocabularyID.eAssetAssetTypeModelUVMapFile:
                    UVMapFileCount++;
                    assetVersionDiffuseBackup = modelAsset.AssetVersion;
                    break;
            }

            if (!assetVersionMTL && path.extname(modelAsset.AssetName.toLowerCase()) === '.mtl')
                assetVersionMTL = modelAsset.AssetVersion;
        }

        if (!assetVersionDiffuse &&                             // if we don't have a diffuse texture, and
            !assetVersionMTL &&                                 // we don't have a MTL file, and
            UVMapFileCount === 1)                               // we have only one UV Map
            assetVersionDiffuse = assetVersionDiffuseBackup;    // use our "backup" notion of diffuse texture

        const units: string | undefined = await COOK.JobCookSIVoyagerScene.convertModelUnitsVocabToCookUnits(modelConstellation.Model.idVUnits);
        const retValue = { exitEarly: false, idModel, idSystemObjectModel, assetVersionGeometry, assetVersionDiffuse, assetVersionMTL, units };
        LOG.info(`WorkflowEngine.computeModelInfo returning ${JSON.stringify(retValue, H.Helpers.saferStringify)}`, LOG.LS.eWF);
        return retValue;
    }

    private async computeSceneInfo(idScene: number, idSystemObjectScene: number): Promise<ComputeSceneInfoResult> {
        const vAssetType: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eAssetAssetTypeScene);
        if (!vAssetType) {
            LOG.error('WorkflowEngine.computeSceneInfo unable to compute scene asset type', LOG.LS.eWF);
            return { exitEarly: true };
        }

        // lookup scene constellation
        const sceneConstellation: DBAPI.SceneConstellation | null = await DBAPI.SceneConstellation.fetchFromScene(idScene);
        if (!sceneConstellation || !sceneConstellation.Scene) {
            LOG.error(`WorkflowEngine.computeSceneInfo unable to compute scene from ${JSON.stringify(idScene)}`, LOG.LS.eWF);
            return { exitEarly: true };
        }
        const scene: DBAPI.Scene = sceneConstellation.Scene;
        const licenseResolver: DBAPI.LicenseResolver | undefined = await CACHE.LicenseCache.getLicenseResolver(idSystemObjectScene);
        if (!licenseResolver)
            LOG.info(`WorkflowEngine.computeSceneInfo unable to compute license resolver for scene system object ${JSON.stringify(idSystemObjectScene)}`, LOG.LS.eWF);

        const assetVersions: DBAPI.AssetVersion[] | null = await DBAPI.AssetVersion.fetchLatestFromSystemObject(idSystemObjectScene);
        if (!assetVersions) {
            LOG.error(`WorkflowEngine.computeSceneInfo unable to compute latest asset versions from system object ${JSON.stringify(idSystemObjectScene)}`, LOG.LS.eWF);
            return { exitEarly: true };
        }

        // Search for asset version representing scene file:
        let assetSVX: DBAPI.AssetVersion | undefined = undefined;
        for (const assetVersion of assetVersions) {
            const asset: DBAPI.Asset | null = await DBAPI.Asset.fetch(assetVersion.idAsset);
            if (!asset) {
                LOG.error(`WorkflowEngine.computeSceneInfo unable to compute asset from asset version ${JSON.stringify(assetVersion, H.Helpers.saferStringify)}`, LOG.LS.eWF);
                continue;
            }
            if (asset.idVAssetType === vAssetType.idVocabulary) {
                assetSVX = assetVersion;
                break;
            }
        }
        if (!assetSVX) {
            LOG.error(`WorkflowEngine.computeSceneInfo unable to compute scene's asset version from system object ${JSON.stringify(idSystemObjectScene)}`, LOG.LS.eWF);
            return { exitEarly: true };
        }

        // Search for master model for this scene, among "source" objects
        // assuming Scene has models as source/parent
        const SOMasters: DBAPI.SystemObject[] | null =  await DBAPI.SystemObject.fetchMasterFromXref(idSystemObjectScene);
        if (!SOMasters) {
            LOG.error(`WorkflowEngine.computeSceneInfo unable to compute scene's master objects from system object ${JSON.stringify(idSystemObjectScene)}`, LOG.LS.eWF);
            return { exitEarly: true };
        }

        // TODO: deal with scene's that have multiple master model sources
        let CMIR: ComputeModelInfoResult | undefined = undefined;
        for (const SO of SOMasters) {
            if (!SO.idModel)
                continue;

            CMIR = await this.computeModelInfo(SO.idModel, SO.idSystemObject);
            if (!CMIR.exitEarly) // found a master model!
                break;
            else
                CMIR = undefined;
        }
        if (!CMIR) {
            LOG.info(`WorkflowEngine.computeSceneInfo unable to compute scene's master model source for ${JSON.stringify(idSystemObjectScene)}`, LOG.LS.eWF);
            return { exitEarly: true };
        }

        const retValue = { exitEarly: false, idScene, idModel: CMIR.idModel, idSystemObjectScene,
            assetSVX, assetVersionGeometry: CMIR.assetVersionGeometry, assetVersionDiffuse: CMIR.assetVersionDiffuse,
            assetVersionMTL: CMIR.assetVersionMTL, scene, licenseResolver, units: CMIR.units };
        LOG.info(`WorkflowEngine.computeSceneInfo returning ${JSON.stringify(retValue, H.Helpers.saferStringify)}`, LOG.LS.eWF);
        return retValue;
    }

    private async setActiveWorkflowStep(workflowStep: DBAPI.WorkflowStep): Promise<void> {
        const LS: LocalStore = await ASL.getOrCreateStore();
        LS.pushWorkflow(workflowStep.idWorkflow, workflowStep.idWorkflowStep);
    }

    private async unsetActiveWorkflowStep(workflowComplete: boolean): Promise<void> {
        const LS: LocalStore = await ASL.getOrCreateStore();
        if (workflowComplete && LS.getWorkflowID())
            LS.popWorkflowID();
        LS.setWorkflowStepID(undefined);
    }

    static async getActiveWorkflowSet(): Promise<DBAPI.WorkflowSet | null> {
        const LS: LocalStore = await ASL.getOrCreateStore();
        if (LS.idWorkflowSet) {
            const workflowSet: DBAPI.WorkflowSet | null = await DBAPI.WorkflowSet.fetch(LS.idWorkflowSet);
            if (!workflowSet)
                LOG.error(`WorkflowEngine.getActiveWorkflowSet unable to fetch active WorkflowSet ${LS.idWorkflowSet}`, LOG.LS.eWF);
            return workflowSet;
        }

        return await WorkflowEngine.nextWorkflowSet(LS);
    }

    static async nextWorkflowSet(LS: LocalStore | null): Promise<DBAPI.WorkflowSet | null> {
        if (!LS)
            LS = await ASL.getOrCreateStore();

        const workflowSet: DBAPI.WorkflowSet | null = new DBAPI.WorkflowSet({ idWorkflowSet: 0 });
        if (!await workflowSet.create()) {
            LOG.error('WorkflowEngine.nextWorkflowSet unable to create new WorkflowSet', LOG.LS.eWF);
            return null;
        }

        LS.idWorkflowSet = workflowSet.idWorkflowSet;
        return workflowSet;
    }
}
