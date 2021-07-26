/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
import * as WF from '../../interface';
import * as WFP from '../../../workflow/impl/Packrat';
import { WorkflowJob } from './WorkflowJob';
import { WorkflowIngestion } from './WorkflowIngestion';
import { WorkflowUpload } from './WorkflowUpload';
import * as COOK from '../../../job/impl/Cook';
import * as LOG from '../../../utils/logger';
import * as CACHE from '../../../cache';
import * as DBAPI from '../../../db';
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
};

export class WorkflowEngine implements WF.IWorkflowEngine {
    private workflowMap: Map<number, WF.IWorkflow> = new Map<number, WF.IWorkflow>();

    async create(workflowParams: WF.WorkflowParameters): Promise<WF.IWorkflow | null> {
        if (!workflowParams.eWorkflowType) {
            LOG.error(`WorkflowEngine.create called without workflow type ${JSON.stringify(workflowParams)}`, LOG.LS.eWF);
            return null;
        }

        LOG.info(`WorkflowEngine.create workflow [${this.workflowMap.size}] ${CACHE.eVocabularyID[workflowParams.eWorkflowType]}: ${JSON.stringify(workflowParams)}`, LOG.LS.eWF);
        const WFC: DBAPI.WorkflowConstellation | null = await this.createDBObjects(workflowParams);
        if (!WFC)
            return null;

        const workflow: WF.IWorkflow | null = await this.fetchWorkflowImpl(workflowParams, WFC);
        if (!workflow) {
            LOG.error(`WorkflowEngine.create failed to fetch workflow implementation ${CACHE.eVocabularyID[workflowParams.eWorkflowType]}`, LOG.LS.eWF);
            return null;
        }
        if (WFC.workflow)
            this.workflowMap.set(WFC.workflow.idWorkflow, workflow);
        const startResults: H.IOResults = await workflow.start();
        if (!startResults) {
            LOG.error(`WorkflowEngine.create failed to start workflow ${CACHE.eVocabularyID[workflowParams.eWorkflowType]}`, LOG.LS.eWF);
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
                this.unsetActiveWorkflowStep(true);
                LOG.info(`WorkflowEngine.jobUpdated completed workflow [${this.workflowMap.size}]: ${idJobRun}`, LOG.LS.eWF);
            }
            result = updateRes.success && result;
        }
        return result;
    }

    async event(eWorkflowEvent: CACHE.eVocabularyID, workflowParams: WF.WorkflowParameters | null): Promise<WF.IWorkflow | null> {
        LOG.info(`WorkflowEngine.event ${CACHE.eVocabularyID[eWorkflowEvent]}`, LOG.LS.eWF);
        const idVWorkflowEvent: number | undefined = await WorkflowEngine.computeWorkflowIDFromEnum(eWorkflowEvent, CACHE.eVocabularySetID.eWorkflowEvent);
        if (!idVWorkflowEvent) {
            LOG.error(`WorkflowEngine.event called with invalid workflow event type ${CACHE.eVocabularyID[eWorkflowEvent]}`, LOG.LS.eWF);
            return null;
        }

        switch (eWorkflowEvent) {
            case CACHE.eVocabularyID.eWorkflowEventIngestionUploadAssetVersion: return this.eventIngestionUploadAssetVersion(workflowParams);
            case CACHE.eVocabularyID.eWorkflowEventIngestionIngestObject: return this.eventIngestionIngestObject(workflowParams);
            default:
                LOG.info(`WorkflowEngine.event called with unhandled workflow event type ${CACHE.eVocabularyID[eWorkflowEvent]}`, LOG.LS.eWF);
                return null;
        }
    }

    private async eventIngestionUploadAssetVersion(workflowParams: WF.WorkflowParameters | null): Promise<WF.IWorkflow | null> {
        if (!workflowParams || !workflowParams.idSystemObject)
            return null;

        let workflow: WF.IWorkflow | null = null;
        for (const idSystemObject of workflowParams.idSystemObject) {
            const { success, asset, assetVersion } = await this.computeAssetAndVersion(idSystemObject);
            if (!success || !asset || !assetVersion)
                continue;

            // take appropriate workflow actions based on asset version type
            const eAssetType: CACHE.eVocabularyID | undefined = await asset.assetType();
            switch (eAssetType) {
                case CACHE.eVocabularyID.eAssetAssetTypeModel:
                case CACHE.eVocabularyID.eAssetAssetTypeModelGeometryFile: {
                    // initiate WorkflowJob for cook si-packrat-inspect
                    const parameters: WFP.WorkflowJobParameters =
                        new WFP.WorkflowJobParameters(CACHE.eVocabularyID.eJobJobTypeCookSIPackratInspect,
                            new COOK.JobCookSIPackratInspectParameters(assetVersion.FileName));

                    const wfParams: WF.WorkflowParameters = {
                        eWorkflowType: CACHE.eVocabularyID.eWorkflowTypeCookJob,
                        idSystemObject: [idSystemObject],
                        idProject: workflowParams.idProject,
                        idUserInitiator: workflowParams.idUserInitiator,
                        parameters,
                    };

                    workflow = await this.create(wfParams);
                    if (!workflow) {
                        LOG.error(`WorkflowEngine.eventIngestionUploadAssetVersion unable to create Cook si-packrat-inspect workflow: ${JSON.stringify(wfParams)}`, LOG.LS.eWF);
                        continue;
                    }
                } break;
            }
        }
        return workflow;
    }

    private async eventIngestionIngestObject(workflowParams: WF.WorkflowParameters | null): Promise<WF.IWorkflow | null> {
        LOG.info(`WorkflowEngine.eventIngestionIngestObject params=${JSON.stringify(workflowParams)}`, LOG.LS.eWF);
        if (!workflowParams || !workflowParams.idSystemObject)
            return null;

        const modelTransformUpdated: boolean = workflowParams.parameters?.modelTransformUpdated !== undefined
            ? workflowParams.parameters.modelTransformUpdated : false;
        let workflow: WF.IWorkflow | null = null;
        let CMIR: ComputeModelInfoResult | undefined = undefined;
        let CSIR: ComputeSceneInfoResult | undefined = undefined;

        const systemObjectHandled: Set<number> = new Set<number>();
        for (const idSystemObject of workflowParams.idSystemObject) {
            const { success, asset, assetVersion } = await this.computeAssetAndVersion(idSystemObject);
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
                case DBAPI.eSystemObjectType.eModel:
                    if (!CMIR) { // lookup model info, if we haven't already
                        CMIR = await this.computeModelInfo(oID.idObject, asset.idSystemObject);
                        if (CMIR.exitEarly || CMIR.assetVersionGeometry === undefined) {
                            LOG.info(`WorkflowEngine.eventIngestionIngestObject skipping model ${JSON.stringify(oID)}`, LOG.LS.eWF);
                            continue;
                        }
                    } else if (CMIR.idModel !== oID.idObject) { // make sure we're processing the same model
                        LOG.error(`WorkflowEngine.eventIngestionIngestObject encountered multiple models ([${CMIR.idModel}, ${oID.idObject}])`, LOG.LS.eWF);
                        return null;
                    }
                    break;

                case DBAPI.eSystemObjectType.eScene:
                    if (modelTransformUpdated) { // only progress through scene ingestion workflows if our model transform was ingested
                        if (!CSIR) {
                            CSIR = await this.computeSceneInfo(oID.idObject, asset.idSystemObject);
                            if (CSIR.exitEarly || CSIR.assetVersionGeometry === undefined || CSIR.assetSVX === undefined) {
                                LOG.info(`WorkflowEngine.eventIngestionIngestObject skipping scene ${JSON.stringify(oID)}`, LOG.LS.eWF);
                                return null;
                            }
                        } else if (CSIR.idScene !== oID.idObject) {
                            LOG.error(`WorkflowEngine.eventIngestionIngestObject encountered multiple scenes ([${CSIR.idScene}, ${oID.idObject}])`, LOG.LS.eWF);
                            return null;
                        }
                    }
                    break;
            }
        }

        if (CMIR)
            workflow = await this.eventIngestionIngestObjectModel(CMIR, workflowParams);

        if (CSIR)
            workflow = await this.eventIngestionIngestObjectScene(CSIR, workflowParams);

        return workflow;
    }

    private async eventIngestionIngestObjectModel(CMIR: ComputeModelInfoResult, workflowParams: WF.WorkflowParameters): Promise<WF.IWorkflow | null> {
        if (CMIR.assetVersionGeometry === undefined) {
            LOG.error(`WorkflowEngine.eventIngestionIngestObjectModel unable to compute geometry and/or diffuse texture from model ${CMIR.idModel}`, LOG.LS.eWF);
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

        // initiate WorkflowJob for cook si-voyager-scene
        const baseName: string = path.parse(CMIR.assetVersionGeometry.FileName).name;
        const jobParamSIVoyagerScene: WFP.WorkflowJobParameters =
            new WFP.WorkflowJobParameters(CACHE.eVocabularyID.eJobJobTypeCookSIVoyagerScene,
                new COOK.JobCookSIVoyagerSceneParameters(CMIR.idModel, CMIR.assetVersionGeometry.FileName, CMIR.units || '',
                CMIR.assetVersionDiffuse?.FileName, baseName + '.svx.json'));

        const wfParamSIVoyagerScene: WF.WorkflowParameters = {
            eWorkflowType: CACHE.eVocabularyID.eWorkflowTypeCookJob,
            idSystemObject,
            idProject: workflowParams.idProject,
            idUserInitiator: workflowParams.idUserInitiator,
            parameters: jobParamSIVoyagerScene,
        };

        const workflow: WF.IWorkflow | null = await this.create(wfParamSIVoyagerScene);
        if (!workflow)
            LOG.error(`WorkflowEngine.eventIngestionIngestObjectModel unable to create Cook si-voyager-scene workflow: ${JSON.stringify(wfParamSIVoyagerScene)}`, LOG.LS.eWF);

        // does this ingested model have a scene child?  If so, initiate WorkflowJob for cook si-generate-downloads
        const SODerived: DBAPI.SystemObject[] | null = CMIR.idSystemObjectModel ? await DBAPI.SystemObject.fetchDerivedFromXref(CMIR.idSystemObjectModel) : null;
        if (!SODerived)
            return workflow;

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
                    new WFP.WorkflowJobParameters(CACHE.eVocabularyID.eJobJobTypeCookSIGenerateDownloads,
                        new COOK.JobCookSIGenerateDownloadsParameters(SO.idScene, CMIR.idModel, CMIR.assetVersionGeometry.FileName,
                            sceneAssetVersion.FileName, CMIR.assetVersionDiffuse?.FileName, CMIR.assetVersionMTL?.FileName, baseName));

                const wfParamSIGenerateDownloads: WF.WorkflowParameters = {
                    eWorkflowType: CACHE.eVocabularyID.eWorkflowTypeCookJob,
                    idSystemObject: idSystemObjectClone,
                    idProject: workflowParams.idProject,
                    idUserInitiator: workflowParams.idUserInitiator,
                    parameters: jobParamSIGenerateDownloads,
                };

                const wfSIGenerateDownloads: WF.IWorkflow | null = await this.create(wfParamSIGenerateDownloads);
                if (!wfSIGenerateDownloads)
                    LOG.error(`WorkflowEngine.eventIngestionUploadAssetVersion unable to create Cook si-voyager-scene workflow: ${JSON.stringify(wfParamSIGenerateDownloads)}`, LOG.LS.eWF);

                return workflow;
            }
        }

        return workflow;
    }

    private async eventIngestionIngestObjectScene(CSIR: ComputeSceneInfoResult, workflowParams: WF.WorkflowParameters): Promise<WF.IWorkflow | null> {
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

        // initiate WorkflowJob for cook si-voyager-scene
        const baseName: string = path.parse(CSIR.assetVersionGeometry.FileName).name;
        const jobParamSIGenerateDownloads: WFP.WorkflowJobParameters =
            new WFP.WorkflowJobParameters(CACHE.eVocabularyID.eJobJobTypeCookSIGenerateDownloads,
                new COOK.JobCookSIGenerateDownloadsParameters(CSIR.idScene, CSIR.idModel, CSIR.assetVersionGeometry.FileName,
                    CSIR.assetSVX.FileName, CSIR.assetVersionDiffuse?.FileName, CSIR.assetVersionMTL?.FileName, baseName));

        const wfParamSIGenerateDownloads: WF.WorkflowParameters = {
            eWorkflowType: CACHE.eVocabularyID.eWorkflowTypeCookJob,
            idSystemObject,
            idProject: workflowParams.idProject,
            idUserInitiator: workflowParams.idUserInitiator,
            parameters: jobParamSIGenerateDownloads,
        };

        const workflow: WF.IWorkflow | null = await this.create(wfParamSIGenerateDownloads);
        if (!workflow)
            LOG.error(`WorkflowEngine.eventIngestionIngestObjectScene unable to create Cook si-generate-downloads workflow: ${JSON.stringify(wfParamSIGenerateDownloads)}`, LOG.LS.eWF);
        return workflow;
    }

    static async computeWorkflowIDFromEnum(eVocabEnum: CACHE.eVocabularyID, eVocabSetEnum: CACHE.eVocabularySetID): Promise<number | undefined> {
        const idVocab: number | undefined = await CACHE.VocabularyCache.vocabularyEnumToId(eVocabEnum);
        if (!idVocab) {
            LOG.error(`WorkflowEngine.computeWorkflowTypeFromEnum called with invalid workflow type ${CACHE.eVocabularyID[eVocabEnum]}`, LOG.LS.eWF);
            return undefined;
        }
        if (!await CACHE.VocabularyCache.isVocabularyInSet(eVocabEnum, eVocabSetEnum)) {
            LOG.error(`WorkflowEngine.computeWorkflowTypeFromEnum called with non-workflow type vocabulary ${CACHE.eVocabularyID[eVocabEnum]}`, LOG.LS.eWF);
            return undefined;
        }
        return idVocab;
    }

    static async computeWorkflowEnumFromID(idVocab: number, eVocabSetEnum: CACHE.eVocabularySetID): Promise<CACHE.eVocabularyID | undefined> {
        const eVocabEnum: CACHE.eVocabularyID | undefined = await CACHE.VocabularyCache.vocabularyIdToEnum(idVocab);
        if (!eVocabEnum) {
            LOG.error(`WorkflowEngine.computeWorkflowTypeEnumFromID called with invalid workflow type ${idVocab}`, LOG.LS.eWF);
            return undefined;
        }
        if (!await CACHE.VocabularyCache.isVocabularyInSet(eVocabEnum, eVocabSetEnum)) {
            LOG.error(`WorkflowEngine.computeWorkflowTypeEnumFromID called with non-workflow type vocabulary ${CACHE.eVocabularyID[eVocabEnum]}`, LOG.LS.eWF);
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
        const idVWorkflowType: number | undefined = await WorkflowEngine.computeWorkflowIDFromEnum(workflowParams.eWorkflowType, CACHE.eVocabularySetID.eWorkflowType);
        if (!idVWorkflowType)
            return null;
        const dtNow: Date = new Date();

        WFC.workflowSet = await this.getActiveWorkflowSet();

        WFC.workflow = new DBAPI.Workflow({
            idVWorkflowType,
            idProject: workflowParams.idProject,
            idUserInitiator: workflowParams.idUserInitiator,
            DateInitiated: dtNow,
            DateUpdated: dtNow,
            Parameters: workflowParams.parameters ? JSON.stringify(workflowParams.parameters) : null,
            idWorkflowSet: WFC.workflowSet ? WFC.workflowSet.idWorkflowSet : null,
            idWorkflow: 0
        });
        if (!await WFC.workflow.create())
            return null;

        // *****************************************************
        // WorkflowStep for initiation
        const idVWorkflowStepType: number | undefined = await CACHE.VocabularyCache.vocabularyEnumToId(CACHE.eVocabularyID.eWorkflowStepTypeStart);
        if (!idVWorkflowStepType) {
            LOG.error(`WorkflowEngine.create called with invalid workflow type ${CACHE.eVocabularyID[workflowParams.eWorkflowType]}`, LOG.LS.eWF);
            return null;
        }

        const workflowStep: DBAPI.WorkflowStep = new DBAPI.WorkflowStep({
            idWorkflow: WFC.workflow.idWorkflow,
            idJobRun: null,
            idUserOwner: workflowParams.idUserInitiator,
            idVWorkflowStepType,
            State: DBAPI.eWorkflowJobRunStatus.eCreated,
            DateCreated: dtNow,
            DateCompleted: dtNow,
            idWorkflowStep: 0
        });
        if (!await workflowStep.create())
            return null;
        WFC.workflowStep = [];
        WFC.workflowStep.push(workflowStep);

        this.setActiveWorkflowStep(workflowStep);

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
            case CACHE.eVocabularyID.eWorkflowTypeCookJob: return await WorkflowJob.constructWorkflow(workflowParams, WFC);
            case CACHE.eVocabularyID.eWorkflowTypeIngestion: return await WorkflowIngestion.constructWorkflow(workflowParams, WFC);
            case CACHE.eVocabularyID.eWorkflowTypeUpload: return await WorkflowUpload.constructWorkflow(workflowParams, WFC);
        }
        return null;
    }

    private async computeAssetAndVersion(idSystemObject: number): Promise<AssetAndVersionResult> {
        const oID: DBAPI.ObjectIDAndType | undefined = await CACHE.SystemObjectCache.getObjectFromSystem(idSystemObject);
        if (!oID) {
            LOG.error(`WorkflowEngine.computeAssetAndVersion skipping invalid idSystemObject ${idSystemObject}`, LOG.LS.eWF);
            return { success: false };
        }

        if (oID.eObjectType != DBAPI.eSystemObjectType.eAssetVersion) {
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
        const vMaster: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.vocabularyByEnum(CACHE.eVocabularyID.eModelPurposeMaster);
        const vDiffuse: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.vocabularyByEnum(CACHE.eVocabularyID.eModelMaterialChannelMaterialTypeDiffuse);
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

        for (const modelAsset of modelConstellation.ModelAssets) {
            if (idAssetDiffuse === modelAsset.Asset.idAsset)
                assetVersionDiffuse = modelAsset.AssetVersion;

            const eAssetType: CACHE.eVocabularyID | undefined = await modelAsset.Asset.assetType();
            switch (eAssetType) {
                case CACHE.eVocabularyID.eAssetAssetTypeModel:
                case CACHE.eVocabularyID.eAssetAssetTypeModelGeometryFile:
                    if (!assetVersionGeometry)
                        assetVersionGeometry = modelAsset.AssetVersion;
                    else {
                        LOG.error(`WorkflowEngine.computeModelInfo encountered multiple geometry files for model ${JSON.stringify(modelConstellation.Model)}`, LOG.LS.eWF);
                        continue;
                    }
                    break;
            }

            if (!assetVersionMTL && path.extname(modelAsset.AssetName.toLowerCase()) === '.mtl')
                assetVersionMTL = modelAsset.AssetVersion;
        }

        const units: string | undefined = await COOK.JobCookSIVoyagerScene.convertModelUnitsVocabToCookUnits(modelConstellation.Model.idVUnits);
        const retValue = { exitEarly: false, idModel, idSystemObjectModel, assetVersionGeometry, assetVersionDiffuse, assetVersionMTL, units };
        LOG.info(`WorkflowEngine.computeModelInfo returning ${JSON.stringify(retValue, H.Helpers.saferStringify)}`, LOG.LS.eWF);
        return retValue;
    }

    private async computeSceneInfo(idScene: number, idSystemObjectScene: number): Promise<ComputeSceneInfoResult> {
        const vAssetType: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.vocabularyByEnum(CACHE.eVocabularyID.eAssetAssetTypeScene);
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
            const model: DBAPI.Model | null = await DBAPI.Model.fetch(SO.idModel);
            if (!model) {
                LOG.error(`WorkflowEngine.computeSceneInfo unable to compute model from ${JSON.stringify(SO.idModel)}`, LOG.LS.eWF);
                continue;
            }

            CMIR = await this.computeModelInfo(SO.idModel, SO.idSystemObject);
            if (!CMIR.exitEarly) // found a master model!
                break;
            else
                CMIR = undefined;
        }
        if (!CMIR) {
            LOG.error(`WorkflowEngine.computeSceneInfo unable to compute scene's master model source for ${JSON.stringify(idSystemObjectScene)}`, LOG.LS.eWF);
            return { exitEarly: true };
        }

        const retValue = { exitEarly: false, idScene, idModel: CMIR.idModel, idSystemObjectScene, assetSVX, assetVersionGeometry: CMIR.assetVersionGeometry,
            assetVersionDiffuse: CMIR.assetVersionDiffuse, assetVersionMTL: CMIR.assetVersionMTL };
        LOG.info(`WorkflowEngine.computeSceneInfo returning ${JSON.stringify(retValue, H.Helpers.saferStringify)}`, LOG.LS.eWF);
        return retValue;
    }

    private setActiveWorkflowStep(workflowStep: DBAPI.WorkflowStep): void {
        const LS: LocalStore = ASL.getOrCreateStore();
        LS.pushWorkflow(workflowStep.idWorkflow, workflowStep.idWorkflowStep);
    }

    private unsetActiveWorkflowStep(workflowComplete: boolean): void {
        const LS: LocalStore = ASL.getOrCreateStore();
        if (workflowComplete && LS.getWorkflowID())
            LS.popWorkflowID();
        LS.setWorkflowStepID(undefined);
    }

    private async getActiveWorkflowSet(): Promise<DBAPI.WorkflowSet | null> {
        const LS: LocalStore = ASL.getOrCreateStore();
        let workflowSet: DBAPI.WorkflowSet | null = null;
        if (LS.idWorkflowSet) {
            workflowSet = await DBAPI.WorkflowSet.fetch(LS.idWorkflowSet);
            if (!workflowSet)
                LOG.error(`WorkflowEngine.getActiveWorkflowSet unable to fetch new WorkflowSet ${LS.idWorkflowSet}`, LOG.LS.eWF);
            return workflowSet;
        }

        workflowSet = new DBAPI.WorkflowSet({ idWorkflowSet: 0 });
        if (!await workflowSet.create()) {
            LOG.error('WorkflowEngine.getActiveWorkflowSet unable to create new WorkflowSet', LOG.LS.eWF);
            return null;
        }

        LS.idWorkflowSet = workflowSet.idWorkflowSet;
        return workflowSet;
    }
}
