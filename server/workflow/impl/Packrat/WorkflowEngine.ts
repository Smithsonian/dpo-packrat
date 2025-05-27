/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
import * as WF from '../../interface';
import * as WFP from '../../../workflow/impl/Packrat';
import { WorkflowJob } from './WorkflowJob';
import { WorkflowIngestion } from './WorkflowIngestion';
import { WorkflowUpload } from './WorkflowUpload';
import * as COOK from '../../../job/impl/Cook';
import * as CACHE from '../../../cache';
import * as COMMON from '@dpo-packrat/common';
import * as DBAPI from '../../../db';
// import * as REP from '../../../report/interface';
// import { Report } from '../../../report/impl/Report';
import { NameHelpers, ModelHierarchy, UNKNOWN_NAME } from '../../../utils/nameHelpers';
import { ASL, LocalStore } from '../../../utils/localStore';
import * as H from '../../../utils/helpers';
import path from 'path';
import { RecordKeeper as RK } from '../../../records/recordKeeper';

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
            RK.logError(RK.LogSection.eWF,'create workflow failed','called without workflow type',{ ...workflowParams },'Workflow.Engine');
            return null;
        }

        const WFC: DBAPI.WorkflowConstellation | null = await this.createDBObjects(workflowParams);
        if (!WFC)
            return null;

        const workflow: WF.IWorkflow | null = await this.fetchWorkflowImpl(workflowParams, WFC);
        if (!workflow) {
            RK.logError(RK.LogSection.eWF,'create workflow failed','failed to fetch workflow implementation',{ type: COMMON.eVocabularyID[workflowParams.eWorkflowType] },'Workflow.Engine');
            return null;
        }
        if (WFC.workflow)
            this.workflowMap.set(WFC.workflow.idWorkflow, workflow);

        const startResults: H.IOResults = await workflow.start();
        if (!startResults) {
            RK.logError(RK.LogSection.eWF,'create workflow failed','failed to start',{ type: COMMON.eVocabularyID[workflowParams.eWorkflowType] },'Workflow.Engine');
            return null;
        }

        RK.logInfo(RK.LogSection.eWF,'create workflow success', undefined,{ ...workflowParams },'Workflow.Engine');
        return workflow;
    }

    async jobUpdated(idJobRun: number): Promise<boolean> {

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
                RK.logError(RK.LogSection.eWF,'job update failed','skipping orphan workflow step',{ idJobRun, workflowStep },'Workflow.Engine');
                continue;
            }

            // lookup workflow object and forward 'updated' event
            const workflow: WF.IWorkflow | undefined = this.workflowMap.get(WFC.workflow.idWorkflow);
            if (!workflow) {
                RK.logError(RK.LogSection.eWF,'job update failed','unable to locate workflow',{ idJobRun, workflowStep, idWorkflow: WFC.workflow.idWorkflow },'Workflow.Engine');
                continue;
            }

            const updateRes: WF.WorkflowUpdateResults = await workflow.update(workflowStep, jobRun);
            if (updateRes.workflowComplete) {
                this.workflowMap.delete(WFC.workflow.idWorkflow);
                await this.unsetActiveWorkflowStep(true);
                RK.logInfo(RK.LogSection.eWF,'job update done',undefined,{ idJobRun, idWorkflow: WFC.workflow.idWorkflow },'Workflow.Engine');
            }
            result = updateRes.success && result;
        }

        return result;
    }

    async event(eWorkflowEvent: COMMON.eVocabularyID, workflowParams: WF.WorkflowParameters | null): Promise<WF.IWorkflow[] | null> {

        RK.logInfo(RK.LogSection.eWF,'event',undefined,{ eventType: COMMON.eVocabularyID[eWorkflowEvent], parameters: workflowParams?.parameters },'Workflow.Engine');
        const idVWorkflowEvent: number | undefined = await WorkflowEngine.computeWorkflowIDFromEnum(eWorkflowEvent, COMMON.eVocabularySetID.eWorkflowEvent);
        if (!idVWorkflowEvent) {
            RK.logError(RK.LogSection.eWF,'event failed','called with invalid workflow event type',{ eventType: COMMON.eVocabularyID[eWorkflowEvent] },'Workflow.Engine');
            return null;
        }

        switch (eWorkflowEvent) {
            case COMMON.eVocabularyID.eWorkflowEventIngestionIngestObject: return this.eventIngestionIngestObject(workflowParams);
            default:
                RK.logError(RK.LogSection.eWF,'event failed','called with unhandled workflow event type',{ eventType: COMMON.eVocabularyID[eWorkflowEvent] },'Workflow.Engine');
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

        RK.logInfo(RK.LogSection.eWF,'generate downloads','started',{ idScene, ...workflowParams.parameters },'Workflow.Engine');

        //#region get and verify scene
        // grab our scene from the DB
        const scene: DBAPI.Scene | null = await DBAPI.Scene.fetch(idScene);
        if(!scene) {
            RK.logError(RK.LogSection.eWF,'generate downloads failed','cannot find scene',{ idScene },'Workflow.Engine');
            return { success: false, message: 'cannot find scene' };
        }

        // get our system object
        const sceneSO: DBAPI.SystemObject | null = await scene.fetchSystemObject();
        if(!sceneSO) {
            RK.logError(RK.LogSection.eWF,'generate downloads failed','scene is invalid without SystemObject',{ idScene },'Workflow.Engine');
            return { success: false, message: 'cannot get SystemObject', data: { isValid: false } };
        }

        // get our information about the scene
        const CSIR: ComputeSceneInfoResult | null = await this.computeSceneInfo(scene.idScene,sceneSO.idSystemObject);
        if(!CSIR || !CSIR.idScene || CSIR.exitEarly==true) {
            RK.logError(RK.LogSection.eWF,'generate downloads failed','cannot compute scene info',{ idScene },'Workflow.Engine');
            return { success: false, message: 'cannot compute scene info', data: { isValid: false } };
        }

        RK.logDebug(RK.LogSection.eWF,'generate downloads','verify scene',{ idScene: CSIR.idScene, sceneFile: CSIR.assetSVX?.FileName, idModel: CSIR.idModel, modelFile: CSIR.assetVersionGeometry?.FileName },'Workflow.Engine');

        // make sure we have a voyager scene
        if(!CSIR.assetSVX) {
            RK.logError(RK.LogSection.eWF,'generate downloads failed','no voyager scene found',{ idScene },'Workflow.Engine');
            return { success: false, message: 'no voyager scene found', data: { isValid: false } };
        }

        // make sure we have a master model
        if(!CSIR.assetVersionGeometry || !CSIR.idModel) {
            RK.logError(RK.LogSection.eWF,'generate downloads failed','no master model found',{ idScene },'Workflow.Engine');
            return { success: false, message: 'no master model found', data: { isValid: false } };
        }

        // make sure we can run the recipe (valid scene, not running, etc)
        if(scene.PosedAndQCd === false) {
            RK.logError(RK.LogSection.eWF,'generate downloads failed','scene is not posed or reviewed',{ idScene },'Workflow.Engine');
            return { success: false, message: 'not posed, licensed, or QC', data: { isValid: false } };
        }
        const isValid: boolean = true;
        //#endregion

        //#region check for duplicate jobs
        // make sure we don't have any jobs running. >0 if a running job was found.
        const activeJobs: DBAPI.JobRun[] | null = await DBAPI.JobRun.fetchActiveByScene(8,scene.idScene);
        if(!activeJobs) {
            RK.logError(RK.LogSection.eWF,'generate downloads failed','cannot determine if job is running',{ idScene },'Workflow.Engine');
            return { success: false, message: 'failed to get active jobs from DB', data: { isValid: false } };
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
                RK.logWarning(RK.LogSection.eWF,'generate downloads','unable to get workflowReport',{ idScene: scene.idScene, idJobRun: activeJobs[0].idJobRun },'Workflow.Engine');

            RK.logWarning(RK.LogSection.eWF,'generate downloads','did not start. job already running',{ idScene: scene.idScene, activeJobRun: idActiveJobRun.join(',') },'Workflow.Engine');
            return { success: false, message: 'Job already running', data: { isValid: true, activeJobs, idWorkflow, idWorkflowReport } };
        }
        //#endregion

        //#region get system objects to act on
        const SOGeometry: DBAPI.SystemObject| null = await CSIR.assetVersionGeometry.fetchSystemObject();
        if (!SOGeometry) {
            RK.logError(RK.LogSection.eWF,'generate downloads failed','unable to compute geometry file systemobject',{ assetVersionGeometry: CSIR.assetVersionGeometry },'Workflow.Engine');
            return { success: false, message: 'cannot get SystemObject for geometry file', data: { isValid: false, activeJobs } };
        }
        const idSystemObject: number[] = [SOGeometry.idSystemObject];

        const SOSVX: DBAPI.SystemObject| null = CSIR.assetSVX ? await CSIR.assetSVX.fetchSystemObject() : null;
        if (!SOSVX) {
            RK.logError(RK.LogSection.eWF,'generate downloads failed','unable to compute scene file systemobject',{ assetSVX: CSIR.assetSVX },'Workflow.Engine');
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
        RK.logDebug(RK.LogSection.eWF,'generate downloads','compute names',{ sceneBaseName, modelBaseName },'Workflow.Engine');

        // #region build our scene parameters
        const parameterHelper: COOK.JobCookSIVoyagerSceneParameterHelper | null = await COOK.JobCookSIVoyagerSceneParameterHelper.compute(CSIR.idModel);
        if(parameterHelper==null) {
            RK.logError(RK.LogSection.eWF,'generate downloads failed','cannot create workflow parameters',{ CSIR },'Workflow.Engine');
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
            RK.logError(RK.LogSection.eWF,'generate downloads failed','cannot find project for scene',{ idScene: scene.idScene },'Workflow.Engine');
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

        // RK.logDebug(RK.LogSection.eWF,'generate downloads','started',{ ...wfParamSIGenerateDownloads },'Workflow.Engine');
        //#endregion

        const doCreate: boolean = true;
        if(doCreate) {
            // create our workflow
            const wf: WF.IWorkflow | null = await this.create(wfParamSIGenerateDownloads);
            if (!wf) {
                RK.logError(RK.LogSection.eWF,'generate downloads failed','unable to create Cook si-generate-downloads workflow',{ ...wfParamSIGenerateDownloads },'Workflow.Engine');
                return { success: false, message: 'cannot create downloads workflow', data: { isValid, activeJobs } };
            }

            // get our Workflow object from the database
            const workflow: DBAPI.Workflow | null = await wf.getWorkflowObject();
            if(!workflow) {
                RK.logError(RK.LogSection.eWF,'generate downloads failed','unable to get DB object for workflow',{ ...wfParamSIGenerateDownloads },'Workflow.Engine');
                return { success: false, message: 'cannot get worfklow object', data: { isValid, activeJobs } };
            }

            // get our workflow report for the new workflow
            const workflowReport: DBAPI.WorkflowReport[] | null = await DBAPI.WorkflowReport.fetchFromWorkflow(workflow.idWorkflow);
            if(!workflowReport || workflowReport.length <= 0) {
                RK.logError(RK.LogSection.eWF,'generate downloads failed','unable to get workflow report',{ ...wfParamSIGenerateDownloads },'Workflow.Engine');
                return { success: false, message: 'cannot get workflow report object', data: { isValid, activeJobs } };
            }
            RK.logDebug(RK.LogSection.eWF,'generate downloads','retrieved workflow report',{ idWorkflowReport: workflowReport[0].idWorkflowReport },'Workflow.Engine');

            // return success
            return { success: true, message: 'generate downloads success', data: { isValid, activeJobs, workflow, workflowReport } };
        } else
            return { success: true, message: 'generate downloads success', data: { isValid, activeJobs } };
    }

    async generateScene(idModel: number, idScene: number | null, workflowParams: WF.WorkflowParameters): Promise<WF.WorkflowCreateResult> {

        RK.logInfo(RK.LogSection.eWF,'generate scene','started',{ idModel, idScene, ...workflowParams.parameters },'Workflow.Engine');

        // making sure we didn't make it here but user wanted to skip generation
        // if (workflowParams.parameters.skipSceneGenerate===true) {
        //     LOG.info(`WorkflowEngine.eventIngestionIngestObjectModel skipping si-voyager-scene per user instruction (idModel: ${idModel} | idSO: ${workflowParams.idSystemObject})`, LOG.LS.eWF);
        //     return { success: false, message: 'skipped generating scene per user request', data: { isValid: false } };
        // }

        //#region check for duplicate jobs
        // make sure we don't have any jobs running. >0 if a running job was found.
        const activeJobs: DBAPI.JobRun[] | null = await DBAPI.JobRun.fetchActiveByModel(8,idModel);
        if(!activeJobs) {
            RK.logWarning(RK.LogSection.eWF,'generate scene failed','cannot determine if job is running. no active jobs from DB.',{ idModel, idScene },'Workflow.Engine');
            return { success: false, message: 'failed to get active jobs from DB', data: { isValid: false } };
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
                RK.logWarning(RK.LogSection.eWF,'generate scene','unable to get workflowReport',{ idModel, idJobRun: activeJobs[0].idJobRun },'Workflow.Engine');

            RK.logWarning(RK.LogSection.eWF,'generate scene failed','did not start. Job already running',{ idModel, activeJobRun: idActiveJobRun.join(',') },'Workflow.Engine');
            return { success: false, message: 'Job already running', data: { isValid: true, activeJobs, idWorkflow, idWorkflowReport } };
        }
        //#endregion

        //#region get & verify model
        // get and verify model (must be master)
        const model: DBAPI.Model | null = await DBAPI.Model.fetch(idModel);
        if(!model) {
            RK.logError(RK.LogSection.eWF,'generate scene failed','cannot get model',{ idModel },'Workflow.Engine');
            return { success: false, message: 'cannot get model', data: { isValid: false }  };
        }

        // make sure we're a 'master' model
        // TODO: ...

        // get the system object of the model since we need the id for its info
        const modelSO: DBAPI.SystemObject | null = await DBAPI.SystemObject.fetchFromModelID(idModel);
        if(!modelSO) {
            RK.logError(RK.LogSection.eWF,'generate scene failed','cannot get model SystemObject',{ idModel, idScene },'Workflow.Engine');
            return { success: false, message: 'cannot get model SystemObject', data: { isValid: false }  };
        }
        //#endregion

        //#region collect remaining objects
        // grab an Asset from the current Model. All assets associated with the Master model have their
        // idSystemObject assigned to the idSystemObject of the Master model. We use this to compute our info/stats
        const modelAssets: DBAPI.Asset[] | null = await DBAPI.Asset.fetchFromModel(idModel);
        if(!modelAssets || modelAssets.length===0) {
            RK.logError(RK.LogSection.eWF,'generate scene failed','cannot get model Asset',{ idModel },'Workflow.Engine');
            return { success: false, message: 'cannot get model Asset', data: { isValid: false }  };
        }
        const modelAsset: DBAPI.Asset = modelAssets[0];

        // get model info
        const CMIR: ComputeModelInfoResult | undefined = await this.computeModelInfo(idModel, modelAsset.idSystemObject ?? -1);
        if (!CMIR || CMIR.exitEarly || CMIR.assetVersionGeometry === undefined) {
            RK.logError(RK.LogSection.eWF,'generate scene failed','cannot compute model info',{ ...CMIR },'Workflow.Engine');
            return { success: false, message: 'cannot get model info', data: { isValid: false }  };
        }

        // bail if no units defined
        if(CMIR.units ===undefined) {
            RK.logError(RK.LogSection.eWF,'generate scene failed','skipping si-voyager-scene for master model with unsupported units',{ ...CMIR },'Workflow.Engine');
            return { success: false, message: `model has invalid units (${CMIR.units})`, data: { isValid: false }  };
        }

        // get our geometry and the associated system object for our params
        const SOGeometry: DBAPI.SystemObject| null = await CMIR.assetVersionGeometry.fetchSystemObject();
        if (!SOGeometry) {
            RK.logError(RK.LogSection.eWF,'generate scene failed','unable to compute geometry file SystemObject',{ ...CMIR },'Workflow.Engine');
            return { success: false, message: 'failed to get geometry system object', data: { isValid: false }  };
        }
        const idSystemObjects: number[] = [SOGeometry.idSystemObject];

        // if we have a material/texture add it to the array so it's added to Job parameters and staged
        const SODiffuse: DBAPI.SystemObject| null = CMIR.assetVersionDiffuse ? await CMIR.assetVersionDiffuse.fetchSystemObject() : null;
        if (SODiffuse)
            idSystemObjects.push(SODiffuse.idSystemObject);
        const SOMTL: DBAPI.SystemObject| null = CMIR.assetVersionMTL ? await CMIR.assetVersionMTL.fetchSystemObject() : null;
        if (SOMTL)
            idSystemObjects.push(SOMTL.idSystemObject);

        const isValid: boolean = true;
        //#endregion

        // get our basename
        const { sceneBaseName } = await WorkflowEngine.computeSceneAndModelBaseNames(CMIR.idModel, CMIR.assetVersionGeometry.FileName);

        //#region scene
        // if we have a scene get it and a reference to the SVX so it can be fed in as a parameter
        let scene: DBAPI.Scene | null = null;

        // if we received an id for the scene, use it
        if(idScene) {
            scene = await DBAPI.Scene.fetch(idScene);
            if(!scene)
                RK.logWarning(RK.LogSection.eWF,'generate scene',`no scene found for id: ${idScene}`,{ idModel },'Workflow.Engine');
        }

        // if we still don't have a scene try to get it from the master model
        if(!scene) {
            // get scene (if any) from master model
            const childScenes: DBAPI.Scene[] | null = await DBAPI.Scene.fetchChildrenScenes(idModel);
            if(!childScenes || childScenes.length===0) {
                RK.logWarning(RK.LogSection.eWF,'generate scene','No children scenes found',{ idModel },'Workflow.Engine');
            } else {
                if(childScenes.length > 1)
                    RK.logDebug(RK.LogSection.eWF,'generate scene',`retrieved ${childScenes.length} scenes for model`,{ idModel },'Workflow.Engine');
                scene = childScenes[0];
            }
        }

        // if we have a scene, we want to use it's SVX (if any) as the base for the recipe.
        // if we don't have a scene then the model may have just been ingested
        const svxFilename: string = sceneBaseName + '.svx.json';
        if(scene) {
            // get the asset version for the active voyager scene. only returns the most recent and does not support
            // multiple SVX files for a single scene
            const svxAssetVersion: DBAPI.AssetVersion | null = await DBAPI.AssetVersion.fetchActiveVoyagerSceneFromScene(scene.idScene);
            if(!svxAssetVersion)
                RK.logWarning(RK.LogSection.eWF,'generate scene','no active SVX file found for scene',{ idModel, idScene },'Workflow.Engine');
            else {
                // compare filenames. if a match then add it to staged resources. otherwise, fail
                // TODO: should we return on this failure?
                if(svxAssetVersion.FileName !== svxFilename)
                    RK.logWarning(RK.LogSection.eWF,'generate scene failed','basenames do not match',{ idModel, idScene, expected: svxFilename, observed: svxAssetVersion.FileName },'Workflow.Engine');
                else {
                    // grab our SystemObject since we need to feed it to the list of staged files
                    const svxAssetVersionSO: DBAPI.SystemObject | null = await svxAssetVersion.fetchSystemObject();
                    if(!svxAssetVersionSO)
                        RK.logWarning(RK.LogSection.eWF,'generate scene failed','cannot get SystemObject for asset version',{ idModel, idScene, idAssetVersion: svxAssetVersion.idAssetVersion },'Workflow.Engine');
                    else
                        idSystemObjects.push(svxAssetVersionSO.idSystemObject);
                }
            }
        }
        //#endregion scene

        //#region Job Parameters
        // build up our parameters and create the workflow
        const parameterHelper: COOK.JobCookSIVoyagerSceneParameterHelper | null = await COOK.JobCookSIVoyagerSceneParameterHelper.compute(CMIR.idModel);
        if(parameterHelper==null) {
            RK.logError(RK.LogSection.eWF,'generate scene failed','cannot create workflow parameters',{ ...CMIR },'Workflow.Engine');
            return { success: false, message: 'cannot create workflow parameters', data: { isValid, activeJobs } };
        }

        // create parameters for a voyager scene
        const jobParamSIVoyagerScene: WFP.WorkflowJobParameters =
            new WFP.WorkflowJobParameters(COMMON.eVocabularyID.eJobJobTypeCookSIVoyagerScene,
                new COOK.JobCookSIVoyagerSceneParameters(
                    parameterHelper,
                    CMIR.assetVersionGeometry.FileName, // sourceMeshFile
                    CMIR.units,                         // units
                    CMIR.assetVersionDiffuse?.FileName, // sourceDiffuseMapFile
                    sceneBaseName + '.svx.json',        // svxFile (assumes svx file is same basename & generated by Packrat)
                    undefined,                          // metadata
                    sceneBaseName                       // outputFileBaseName
                )
            );

        // create parameters for the workflow based on those created for the job
        const wfParamSIVoyagerScene: WF.WorkflowParameters = {
            eWorkflowType: COMMON.eVocabularyID.eWorkflowTypeCookJob,
            idSystemObject: idSystemObjects,
            idProject: workflowParams.idProject,
            idUserInitiator: workflowParams.idUserInitiator,
            parameters: jobParamSIVoyagerScene,
        };
        //#endregion

        RK.logDebug(RK.LogSection.eWF,'generate scene','cook parameters',{ ...wfParamSIVoyagerScene.parameters },'Workflow.Engine');

        //#region Workflow
        // create our workflow
        const doCreate: boolean = true;
        if(doCreate) {
            // create our workflow
            const wf: WF.IWorkflow | null = await this.create(wfParamSIVoyagerScene);
            if (!wf) {
                RK.logError(RK.LogSection.eWF,'generate scene failed','unable to create Cook si-voyager-scene workflow',{ ...wfParamSIVoyagerScene.parameters },'Workflow.Engine');
                return { success: false, message: 'cannot create voyager scene workflow', data: { isValid, activeJobs } };
            }

            // get our Workflow object from the database
            const workflow: DBAPI.Workflow | null = await wf.getWorkflowObject();
            if(!workflow) {
                RK.logError(RK.LogSection.eWF,'generate scene failed','unable to get DB object for workflow',{ ...wfParamSIVoyagerScene.parameters },'Workflow.Engine');
                return { success: false, message: 'cannot get workflow object', data: { isValid, activeJobs } };
            }

            // get our workflow report for the new workflow
            const workflowReport: DBAPI.WorkflowReport[] | null = await DBAPI.WorkflowReport.fetchFromWorkflow(workflow.idWorkflow);
            if(!workflowReport || workflowReport.length <= 0) {
                RK.logError(RK.LogSection.eWF,'generate scene failed','unable to get workflow report',{ idModel, idScene, idWorkflow: workflow.idWorkflow },'Workflow.Engine');
                return { success: false, message: 'cannot get worfklow report object', data: { isValid, activeJobs } };
            }

            // return success
            RK.logInfo(RK.LogSection.eWF,'generate scene success','',{ idModel, idScene, activeJobs, workflow, workflowReport },'Workflow.Engine');
            return { success: true, message: 'generating scene', data: { isValid, activeJobs, workflow, workflowReport } };
        } else {
            RK.logInfo(RK.LogSection.eWF,'generate scene success','',{ idModel, idScene, activeJobs },'Workflow.Engine');
            return { success: true, message: 'generating scene', data: { isValid, activeJobs } };
        }
        //#endregion
    }

    private async eventIngestionIngestObject(workflowParams: WF.WorkflowParameters | null): Promise<WF.IWorkflow[] | null> {

        RK.logInfo(RK.LogSection.eWF,'ingest object event','triggered',{ ...workflowParams?.parameters },'Workflow.Engine');

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
            if (!success || !asset || !assetVersion || !asset.idSystemObject) {
                RK.logWarning(RK.LogSection.eWF,'ingest object event','skipping asset. cannot compute asset and version',{ idSystemObject, ...workflowParams.parameters },'Workflow.Engine');
                continue;
            }

            // skip processing asset-owning parent objects multiple times
            if (systemObjectHandled.has(asset.idSystemObject))
                continue;
            else
                systemObjectHandled.add(asset.idSystemObject);

            const oID: DBAPI.ObjectIDAndType | undefined = await CACHE.SystemObjectCache.getObjectFromSystem(asset.idSystemObject);
            if (!oID) {
                RK.logError(RK.LogSection.eWF,'ingest object event','unable to compute system object owner',{ ...asset },'Workflow.Engine');
                continue;
            }

            // for now, we only have special rules for ingestion of asset versions owned by models and scenes:
            switch (oID.eObjectType) {
                case COMMON.eSystemObjectType.eModel:
                    if (!CMIR) { // lookup model info, if we haven't already
                        CMIR = await this.computeModelInfo(oID.idObject, asset.idSystemObject);
                        if (CMIR.exitEarly || CMIR.assetVersionGeometry === undefined) {
                            RK.logWarning(RK.LogSection.eWF,'ingest object event','skipping model',{ objectID: oID, fileName: asset.FileName, ...CMIR },'Workflow.Engine');
                            CMIR = undefined;
                            continue;
                        }
                    } else if (CMIR.idModel !== oID.idObject) { // make sure we're processing the same model
                        RK.logError(RK.LogSection.eWF,'ingest object event','encountered multiple models',{ objectID: oID, fileName: asset.FileName, ...CMIR },'Workflow.Engine');
                        continue;
                    }
                    break;

                case COMMON.eSystemObjectType.eScene:
                    if (modelTransformUpdated) { // only progress through scene ingestion workflows if our model transform was updated
                        if (!CSIR) {
                            CSIR = await this.computeSceneInfo(oID.idObject, asset.idSystemObject);
                            if (CSIR.exitEarly || CSIR.assetVersionGeometry === undefined || CSIR.assetSVX === undefined) {
                                RK.logWarning(RK.LogSection.eWF,'ingest object event','skipping scene',{ objectID: oID, fileName: asset.FileName, ...CSIR },'Workflow.Engine');
                                CSIR = undefined;
                                continue;
                            }
                        } else if (CSIR.idScene !== oID.idObject) {
                            RK.logError(RK.LogSection.eWF,'ingest object event','encountered multiple scenes',{ objectID: oID, fileName: asset.FileName, ...CSIR },'Workflow.Engine');
                            continue;
                        }

                        if (CSIR.scene !== undefined && !CSIR.scene.PosedAndQCd) { // we have scene info, and that scene has not been posed and QCd
                            RK.logWarning(RK.LogSection.eWF,'ingest object event','skipping scene. not Posed or QC',{ objectID: oID, fileName: asset.FileName },'Workflow.Engine');
                            CSIR = undefined;
                            continue;
                        }

                        if (!DBAPI.LicenseAllowsDownloadGeneration(CSIR.licenseResolver?.License?.RestrictLevel)) { // we don't have a license resolver, or that license does not allow download generation
                            RK.logWarning(RK.LogSection.eWF,'ingest object event','skipping scene. invalid license for scene generation',{ objectID: oID, fileName: asset.FileName, ...CSIR },'Workflow.Engine');
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
        // LOG.info(H.Helpers.getStackTrace('WorkflowEngine.eventIngestionIngestObjectModel'),LOG.LS.eDEBUG);
        if (!assetsIngested) {
            RK.logDebug(RK.LogSection.eWF,'ingest model event failed','skipping post-ingest workflows as no assets were updated',{ ...CMIR },'Workflow.Engine');
            return null;
        }

        if (CMIR.assetVersionGeometry === undefined) {
            RK.logError(RK.LogSection.eWF,'ingest model event failed','unable to compute geometry and/or diffuse texture from model',{ ...CMIR },'Workflow.Engine');
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
                RK.logError(RK.LogSection.eWF,'ingest model event failed','skipping unsupported model type',{ modelType: eModelType ? COMMON.eVocabularyID[eModelType] : 'unknown', ...CMIR },'Workflow.Engine');
                return null;
        }

        const SOGeometry: DBAPI.SystemObject| null = await CMIR.assetVersionGeometry.fetchSystemObject();
        if (!SOGeometry) {
            RK.logError(RK.LogSection.eWF,'ingest model event failed','unable to compute geometry file systemobject',{ ...CMIR },'Workflow.Engine');
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
        const { sceneBaseName } = await WorkflowEngine.computeSceneAndModelBaseNames(CMIR.idModel, CMIR.assetVersionGeometry.FileName);

        // initiate WorkflowJob for cook si-voyager-scene
        if (CMIR.units !== undefined && CMIR.idModel !== undefined) {
            const parameterHelper: COOK.JobCookSIVoyagerSceneParameterHelper | null = await COOK.JobCookSIVoyagerSceneParameterHelper.compute(CMIR.idModel);
            if (parameterHelper) {
                if (workflowParams.parameters.skipSceneGenerate) {
                    RK.logWarning(RK.LogSection.eWF,'ingest model event','skipping si-voyager-scene per user instruction',{ idSystemObject: workflowParams.idSystemObject },'Workflow.Engine');
                } else {
                    const jobParamSIVoyagerScene: WFP.WorkflowJobParameters =
                        new WFP.WorkflowJobParameters(COMMON.eVocabularyID.eJobJobTypeCookSIVoyagerScene,
                            new COOK.JobCookSIVoyagerSceneParameters(parameterHelper,CMIR.assetVersionGeometry.FileName, CMIR.units,
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
                        RK.logError(RK.LogSection.eWF,'ingest model event failed','unable to create Cook si-voyager-scene workflow',{ ...wfParamSIVoyagerScene },'Workflow.Engine');
                }
            } else
                RK.logError(RK.LogSection.eWF,'ingest model event failed','unable to compute parameter info needed by Cook si-voyager-scene workflow from model',{ ...CMIR },'Workflow.Engine');
        } else
            RK.logWarning(RK.LogSection.eWF,'ingest model event','skipping si-voyager-scene for master model with unsupported units or model ID',{ ...CMIR },'Workflow.Engine');

        // do we want to generate downloads for this ingestion
        if(generateDownloads===true) {

            // TEMP: preventing automatic download generation
            RK.logWarning(RK.LogSection.eWF,'ingest model event failed','enerateDownloads reached w/ ingest model',{ ...CMIR, trace: H.Helpers.getStackTrace('eventIngestionIngestObjectModel') },'Workflow.Engine');
            return null;

            // does this ingested model have a scene child?  If so, initiate WorkflowJob for cook si-generate-downloads
            /*
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
            */
        }

        return workflows.length > 0 ? workflows : null;
    }

    private async eventIngestionIngestObjectScene(CSIR: ComputeSceneInfoResult, workflowParams: WF.WorkflowParameters, assetsIngested: boolean, generateDownloads: boolean = false): Promise<WF.IWorkflow[] | null> {

        if (!assetsIngested) {
            RK.logInfo(RK.LogSection.eWF,'ingest scene event failed','skipping post-ingest workflows as no assets were updated',{ ...CSIR, params: workflowParams.parameters },'Workflow.Engine');
            return null;
        }

        if (CSIR.assetVersionGeometry === undefined || CSIR.assetSVX === undefined) {
            RK.logError(RK.LogSection.eWF,'ingest scene event failed','unable to compute geometry and/or scene asset version from scene',{ ...CSIR, params: workflowParams.parameters },'Workflow.Engine');
            return null;
        }

        const SOGeometry: DBAPI.SystemObject| null = await CSIR.assetVersionGeometry.fetchSystemObject();
        if (!SOGeometry) {
            RK.logError(RK.LogSection.eWF,'ingest scene event failed','unable to compute geometry file systemobject',{ ...CSIR, params: workflowParams.parameters },'Workflow.Engine');
            return null;
        }
        const idSystemObject: number[] = [SOGeometry.idSystemObject];

        const SOSVX: DBAPI.SystemObject| null = CSIR.assetSVX ? await CSIR.assetSVX.fetchSystemObject() : null;
        if (!SOSVX) {
            RK.logError(RK.LogSection.eWF,'ingest scene event failed','unable to compute scene file systemobject',{ ...CSIR, params: workflowParams.parameters },'Workflow.Engine');
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
            RK.logWarning(RK.LogSection.eWF,'ingest scene event failed','generateDownloads reached w/ ingest scene',{ ...CSIR, trace: H.Helpers.getStackTrace('eventIngestionIngestObjectScene') },'Workflow.Engine');
            return null;

            /*
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
            */
        }

        return null;
    }

    private static async computeSceneAndModelBaseNames(idModel: number | undefined, defaultFileName: string): Promise<{ sceneBaseName: string, modelBaseName: string}> {
        let modelSource: DBAPI.Model | null = null;
        if (idModel) {
            modelSource = await DBAPI.Model.fetch(idModel);
            if (!modelSource)
                RK.logError(RK.LogSection.eWF,'compute base names failed','unable to get Model from idModel',{ idModel },'Workflow.Engine');
        }

        let sceneBaseName: string | null = null;
        if (modelSource) {
            const MH: ModelHierarchy | null = await NameHelpers.computeModelHierarchy(modelSource);
            if (MH) {
                sceneBaseName = NameHelpers.sceneDisplayName('', [MH]); // '' means we don't have a subtitle provided by the user
                if (sceneBaseName === UNKNOWN_NAME)
                    sceneBaseName = null;
            } else
                RK.logError(RK.LogSection.eWF,'compute base names failed','unable to load model hierarchy from Model',{ idModel },'Workflow.Engine');
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
            RK.logError(RK.LogSection.eWF,'compute workflow ID failed','called with invalid workflow type',{ type: COMMON.eVocabularyID[eVocabEnum] ?? 'undefined' },'Workflow.Engine');
            return undefined;
        }
        if (!await CACHE.VocabularyCache.isVocabularyInSet(eVocabEnum, eVocabSetEnum)) {
            RK.logError(RK.LogSection.eWF,'compute workflow ID failed','called with non-workflow type vocabulary',{ type: COMMON.eVocabularyID[eVocabEnum] ?? 'undefined' },'Workflow.Engine');
            return undefined;
        }
        return idVocab;
    }

    static async computeWorkflowEnumFromID(idVocab: number, eVocabSetEnum: COMMON.eVocabularySetID): Promise<COMMON.eVocabularyID | undefined> {
        const eVocabEnum: COMMON.eVocabularyID | undefined = await CACHE.VocabularyCache.vocabularyIdToEnum(idVocab);
        if (!eVocabEnum) {
            RK.logError(RK.LogSection.eWF,'compute workflow enum failed','called with invalid workflow vocab id',{ idVocab },'Workflow.Engine');
            return undefined;
        }
        if (!await CACHE.VocabularyCache.isVocabularyInSet(eVocabEnum, eVocabSetEnum)) {
            RK.logError(RK.LogSection.eWF,'compute workflow enum failed','called with non-workflow type vocabulary',{ type: COMMON.eVocabularyID[eVocabEnum] ?? 'undefined' },'Workflow.Engine');
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
            RK.logError(RK.LogSection.eWF,'create db objects failed','called with invalid workflow type',{ type: COMMON.eVocabularyID[workflowParams.eWorkflowType] ?? 'undefined' },'Workflow.Engine');
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
            RK.logError(RK.LogSection.eWF,'compute asset and version failed','skipping invalid idSystemObject',{ idSystemObject },'Workflow.Engine');
            return { success: false };
        }

        if (oID.eObjectType != COMMON.eSystemObjectType.eAssetVersion) {
            RK.logError(RK.LogSection.eWF,'compute asset and version failed','skipping invalid object type',{ idSystemObject, ...oID },'Workflow.Engine');
            return { success: false };
        }

        // load asset version
        const assetVersion: DBAPI.AssetVersion | null = await DBAPI.AssetVersion.fetch(oID.idObject);
        if (!assetVersion)  {
            RK.logError(RK.LogSection.eWF,'compute asset and version failed','skipping invalid object. cannot get AssetVersion',{ idSystemObject, ...oID },'Workflow.Engine');
            return { success: false };
        }

        // load asset
        const asset: DBAPI.Asset | null = await DBAPI.Asset.fetch(assetVersion.idAsset);
        if (!asset) {
            RK.logError(RK.LogSection.eWF,'compute asset and version failed','unable to load asset from idAsset',{ idSystemObject, idAsset: assetVersion.idAsset },'Workflow.Engine');
            return { success: false };
        }
        return { success: true, asset, assetVersion };
    }

    private async computeModelInfo(idModel: number, idSystemObjectModel: number): Promise<ComputeModelInfoResult> {
        const vMaster: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eModelPurposeMaster);
        const vDiffuse: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeDiffuse);
        if (!vMaster || !vDiffuse) {
            RK.logError(RK.LogSection.eWF,'compute model info failed','unable to compute model vocabulary',{ idModel },'Workflow.Engine');
            return { exitEarly: true };
        }

        // lookup model constellation
        const modelConstellation: DBAPI.ModelConstellation | null = await DBAPI.ModelConstellation.fetch(idModel);
        if (!modelConstellation || !modelConstellation.Model || !modelConstellation.ModelAssets) {
            RK.logError(RK.LogSection.eWF,'compute model info failed','unable to compute model from ID',{ idModel },'Workflow.Engine');
            return { exitEarly: true };
        }

        // If this is not a master model, skip post-ingestion workflow
        if (modelConstellation.Model.idVPurpose != vMaster.idVocabulary) {
            RK.logDebug(RK.LogSection.eWF,'compute model info','skipping non-master model',{ idModel },'Workflow.Engine');
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
                    RK.logError(RK.LogSection.eWF,'compute model info failed','encountered multiple diffuse channels in model',{ idModel: modelConstellation.Model.idModel },'Workflow.Engine');
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
                        RK.logError(RK.LogSection.eWF,'compute model info failed','could not find expected diffuse channel in UV Map',{ idModelMaterial: MMC.idModelMaterial },'Workflow.Engine');
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
                        RK.logError(RK.LogSection.eWF,'compute model info failed','encountered multiple geometry files for model',{ idModel },'Workflow.Engine');
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
            assetVersionDiffuse = assetVersionDiffuseBackup;    // use our 'backup' notion of diffuse texture

        const units: string | undefined = await COOK.JobCookSIVoyagerScene.convertModelUnitsVocabToCookUnits(modelConstellation.Model.idVUnits);
        const retValue = { exitEarly: false, idModel, idSystemObjectModel, assetVersionGeometry, assetVersionDiffuse, assetVersionMTL, units };

        RK.logInfo(RK.LogSection.eWF,'compute model info success','',{ ...retValue },'Workflow.Engine');
        return retValue;
    }

    private async computeSceneInfo(idScene: number, idSystemObjectScene: number): Promise<ComputeSceneInfoResult> {
        const vAssetType: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eAssetAssetTypeScene);
        if (!vAssetType) {
            RK.logError(RK.LogSection.eWF,'compute scene info failed','unable to compute scene asset type',{ idScene, idSystemObjectScene },'Workflow.Engine');
            return { exitEarly: true };
        }

        // lookup scene constellation
        const sceneConstellation: DBAPI.SceneConstellation | null = await DBAPI.SceneConstellation.fetchFromScene(idScene);
        if (!sceneConstellation || !sceneConstellation.Scene) {
            RK.logError(RK.LogSection.eWF,'compute scene info failed','unable to compute scene from scene constellation',{ idScene, idSystemObjectScene },'Workflow.Engine');
            return { exitEarly: true };
        }
        const scene: DBAPI.Scene = sceneConstellation.Scene;
        const licenseResolver: DBAPI.LicenseResolver | undefined = await CACHE.LicenseCache.getLicenseResolver(idSystemObjectScene);
        if (!licenseResolver)
            RK.logWarning(RK.LogSection.eWF,'compute scene info','unable to compute license resolver for scene system object',{ idScene, idSystemObjectScene },'Workflow.Engine');

        const assetVersions: DBAPI.AssetVersion[] | null = await DBAPI.AssetVersion.fetchLatestFromSystemObject(idSystemObjectScene);
        if (!assetVersions) {
            RK.logError(RK.LogSection.eWF,'compute scene info failed','unable to compute latest asset versions from system object',{ idScene, idSystemObjectScene },'Workflow.Engine');
            return { exitEarly: true };
        }

        // Search for asset version representing scene file:
        let assetSVX: DBAPI.AssetVersion | undefined = undefined;
        for (const assetVersion of assetVersions) {
            const asset: DBAPI.Asset | null = await DBAPI.Asset.fetch(assetVersion.idAsset);
            if (!asset) {
                RK.logError(RK.LogSection.eWF,'compute scene info failed','unable to compute asset from asset version',{ idScene, idSystemObjectScene, ...assetVersion },'Workflow.Engine');
                continue;
            }
            if (asset.idVAssetType === vAssetType.idVocabulary) {
                assetSVX = assetVersion;
                break;
            }
        }
        if (!assetSVX) {
            RK.logError(RK.LogSection.eWF,'compute scene info failed','unable to compute scene asset version from system object',{ idScene, idSystemObjectScene },'Workflow.Engine');
            return { exitEarly: true };
        }

        // Search for master model for this scene, among 'source' objects
        // assuming Scene has models as source/parent
        const SOMasters: DBAPI.SystemObject[] | null =  await DBAPI.SystemObject.fetchMasterFromXref(idSystemObjectScene);
        if (!SOMasters) {
            RK.logError(RK.LogSection.eWF,'compute scene info failed','unable to compute scene master objects from system object',{ idScene, idSystemObjectScene },'Workflow.Engine');
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
            RK.logError(RK.LogSection.eWF,'compute scene info failed','unable to compute scene master model source',{ idScene, idSystemObjectScene },'Workflow.Engine');
            return { exitEarly: true };
        }

        const retValue = { exitEarly: false, idScene, idModel: CMIR.idModel, idSystemObjectScene,
            assetSVX, assetVersionGeometry: CMIR.assetVersionGeometry, assetVersionDiffuse: CMIR.assetVersionDiffuse,
            assetVersionMTL: CMIR.assetVersionMTL, scene, licenseResolver, units: CMIR.units };

        RK.logInfo(RK.LogSection.eWF,'compute scene info','',{ ...retValue },'Workflow.Engine');
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
                RK.logError(RK.LogSection.eWF,'get workflow set failed','unable to fetch active WorkflowSet from LocalStore',{ idWorkflowSet: LS.idWorkflowSet },'Workflow.Engine');
            return workflowSet;
        }

        return await WorkflowEngine.nextWorkflowSet(LS);
    }

    static async nextWorkflowSet(LS: LocalStore | null): Promise<DBAPI.WorkflowSet | null> {
        if (!LS)
            LS = await ASL.getOrCreateStore();

        const workflowSet: DBAPI.WorkflowSet | null = new DBAPI.WorkflowSet({ idWorkflowSet: 0 });
        if (!await workflowSet.create()) {
            RK.logError(RK.LogSection.eWF,'next workflow set failed','unable to create new WorkflowSet',undefined,'Workflow.Engine');
            return null;
        }

        LS.idWorkflowSet = workflowSet.idWorkflowSet;
        return workflowSet;
    }
}
