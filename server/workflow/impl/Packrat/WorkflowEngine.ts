/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
import * as WF from '../../interface';
import * as WFP from '../../../workflow/impl/Packrat';
import { WorkflowJob } from './WorkflowJob';
import * as COOK from '../../../job/impl/Cook';
import * as LOG from '../../../utils/logger';
import * as CACHE from '../../../cache';
import * as DBAPI from '../../../db';
import * as H from '../../../utils/helpers';
import path from 'path';

type AssetAndVersionResult = {
    success: boolean;
    asset?: DBAPI.Asset | null | undefined;
    assetVersion?: DBAPI.AssetVersion | null | undefined;
};

type ComputeModelInfoResult = {
    exitEarly: boolean;
    assetVersionGeometry?: DBAPI.AssetVersion | undefined;
    assetVersionDiffuse?: DBAPI.AssetVersion | undefined;
    units?: string | undefined;
};

export class WorkflowEngine implements WF.IWorkflowEngine {
    private workflowMap: Map<number, WF.IWorkflow> = new Map<number, WF.IWorkflow>();

    async create(workflowParams: WF.WorkflowParameters): Promise<WF.IWorkflow | null> {
        LOG.info(`WorkflowEngine.create workflow [${this.workflowMap.size}]: ${JSON.stringify(workflowParams)}`, LOG.LS.eWF);
        const WFC: DBAPI.WorkflowConstellation | null = await this.createDBObjects(workflowParams);
        if (!WFC)
            return null;

        if (!workflowParams.eWorkflowType) {
            LOG.error(`WorkflowEngine.create called without workflow type ${JSON.stringify(workflowParams)}`, LOG.LS.eWF);
            return null;
        }

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
                        idProject: null,    // TODO: populate with idProject
                        idUserInitiator: null,
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

        let workflow: WF.IWorkflow | null = null;
        let idModel: number | undefined = undefined;
        let assetVersionGeometry: DBAPI.AssetVersion | undefined = undefined;
        let assetVersionDiffuse: DBAPI.AssetVersion | null | undefined = undefined;
        let units: string | undefined = undefined;

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

            // for now, we only have special rules for ingestion of asset versions owned by models:
            if (oID.eObjectType !== DBAPI.eSystemObjectType.eModel)
                continue;
                // LOG.info(`WorkflowEngine.eventIngestionIngestObject skipping non-model asset ${JSON.stringify(oID)}`, LOG.LS.eWF);

            // lookup model constellation, if we haven't already; if we have, make sure we're processing the same model:
            if (!idModel) {
                let exitEarly: boolean = false;
                ({ exitEarly, assetVersionGeometry, assetVersionDiffuse, units } = await this.computeModelInfo(oID.idObject));
                if (exitEarly || assetVersionGeometry === undefined) {
                    LOG.info(`WorkflowEngine.eventIngestionIngestObject skipping model ${JSON.stringify(oID)}`, LOG.LS.eWF);
                    return null;
                }
                idModel = oID.idObject;

            } else if (idModel !== oID.idObject) {
                LOG.error(`WorkflowEngine.eventIngestionIngestObject encountered multiple models ([${idModel}, ${oID.idObject}])`, LOG.LS.eWF);
                return null;
            }
        }

        if (!idModel)
            return null;

        if (assetVersionGeometry === undefined) {
            LOG.error(`WorkflowEngine.eventIngestionIngestObject unable to compute geometry and/or diffuse texture from model ${idModel}`, LOG.LS.eWF);
            return null;
        }

        const SOGeometry: DBAPI.SystemObject| null = await assetVersionGeometry.fetchSystemObject();
        if (!SOGeometry) {
            LOG.error(`WorkflowEngine.eventIngestionIngestObject unable to compute geometry file systemobject from ${JSON.stringify(assetVersionGeometry, H.Helpers.saferStringify)}`, LOG.LS.eWF);
            return null;
        }
        const SODiffuse: DBAPI.SystemObject| null = assetVersionDiffuse ? await assetVersionDiffuse.fetchSystemObject() : null;
        const idSystemObject: number[] = [SOGeometry.idSystemObject];
        if (SODiffuse)
            idSystemObject.push(SODiffuse.idSystemObject);

        // initiate WorkflowJob for cook si-voyager-scene
        const baseName: string = path.parse(assetVersionGeometry.FileName).name;
        const parameters: WFP.WorkflowJobParameters =
            new WFP.WorkflowJobParameters(CACHE.eVocabularyID.eJobJobTypeCookSIVoyagerScene,
                new COOK.JobCookSIVoyagerSceneParameters(idModel, assetVersionGeometry.FileName, units || '',
                assetVersionDiffuse?.FileName, baseName + '.svx.json'));

        const wfParams: WF.WorkflowParameters = {
            eWorkflowType: CACHE.eVocabularyID.eWorkflowTypeCookJob,
            idSystemObject,
            idProject: null,    // TODO: populate with idProject
            idUserInitiator: null,
            parameters,
        };

        workflow = await this.create(wfParams);
        if (!workflow)
            LOG.error(`WorkflowEngine.eventIngestionUploadAssetVersion unable to create Cook si-voyager-scene workflow: ${JSON.stringify(wfParams)}`, LOG.LS.eWF);

        /*
        // initiate WorkflowJob for cook si-generate-downloads
        // const baseName: string = path.parse(assetVersionGeometry.FileName).name;
        const parameters2: WFP.WorkflowJobParameters =
            new WFP.WorkflowJobParameters(CACHE.eVocabularyID.eJobJobTypeCookSIVoyagerScene,
                new COOK.JobCookSIVoyagerSceneParameters(idModel, assetVersionGeometry.FileName, units || '',
                assetVersionDiffuse?.FileName, baseName + '.svx.json'));

        const wfParams2: WF.WorkflowParameters = {
            eWorkflowType: CACHE.eVocabularyID.eWorkflowTypeCookJob,
            idSystemObject,
            idProject: null,    // TODO: populate with idProject
            idUserInitiator: null,
            parameters2,
        };

        workflow = await this.create(wfParams2);
        if (!workflow)
            LOG.error(`WorkflowEngine.eventIngestionUploadAssetVersion unable to create Cook si-generate-downloads workflow: ${JSON.stringify(wfParams2)}`, LOG.LS.eWF);
        */
        return workflow;
    }

    /*
    static computeWorkflowParameters(modelName: string, eWorkflowType: CACHE.eVocabularyID, eJobType: CACHE.eVocabularyID): any {
        switch (eWorkflowType) {
            case CACHE.eVocabularyID.eWorkflowTypeCookJob:
                return new WFP.WorkflowJobParameters(eJobType, new COOK.JobCookSIPackratInspectParameters(modelName));
            default:
                LOG.error(`WorkflowEngine.computeWorkflowParameters: unexpected workflow type ${CACHE.eVocabularyID[eWorkflowType]}`, LOG.LS.eWF);
        }
    }
    */

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

        WFC.workflow = new DBAPI.Workflow({
            idVWorkflowType,
            idProject: workflowParams.idProject,
            idUserInitiator: workflowParams.idUserInitiator,
            DateInitiated: dtNow,
            DateUpdated: dtNow,
            Parameters: workflowParams.parameters ? JSON.stringify(workflowParams.parameters) : null,
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
            State: DBAPI.WorkflowStep.stateEnumToValue(DBAPI.eWorkflowStepState.eCreated),
            DateCreated: dtNow,
            DateCompleted: dtNow,
            idWorkflowStep: 0
        });
        if (!await workflowStep.create())
            return null;
        WFC.workflowStep = [];
        WFC.workflowStep.push(workflowStep);

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
            case CACHE.eVocabularyID.eWorkflowTypeCookJob: return await WorkflowJob.constructWorkflowJob(workflowParams, WFC);
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

    private async computeModelInfo(idModel: number): Promise<ComputeModelInfoResult> {
        // lookup model constellation
        const modelConstellation: DBAPI.ModelConstellation | null = await DBAPI.ModelConstellation.fetch(idModel);
        if (!modelConstellation || !modelConstellation.Model || !modelConstellation.ModelAssets) {
            LOG.error(`WorkflowEngine.computeModelInfo unable to compute model from ${JSON.stringify(idModel)}`, LOG.LS.eWF);
            return { exitEarly: true };
        }

        const vMaster: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.vocabularyByEnum(CACHE.eVocabularyID.eModelPurposeMaster);
        const vDiffuse: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.vocabularyByEnum(CACHE.eVocabularyID.eModelMaterialChannelMaterialTypeDiffuse);
        if (!vMaster || !vDiffuse) {
            LOG.error('WorkflowEngine.computeModelInfo unable to compute model vocabulary', LOG.LS.eWF);
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
        }

        const units: string | undefined = await COOK.JobCookSIVoyagerScene.convertModelUnitsVocabToCookUnits(modelConstellation.Model.idVUnits);
        const retValue = { exitEarly: false, assetVersionGeometry, assetVersionDiffuse, units };
        LOG.info(`WorkflowEngine.computeModelInfo returning ${JSON.stringify(retValue, H.Helpers.saferStringify)}`, LOG.LS.eWF);
        return retValue;
    }
}
