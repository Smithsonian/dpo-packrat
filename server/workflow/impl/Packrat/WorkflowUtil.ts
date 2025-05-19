/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types, no-constant-condition */
import * as WF from '../../interface';
import { WorkflowJobParameters } from './WorkflowJob';
import * as COOK from '../../../job/impl/Cook';
import * as DBAPI from '../../../db';
import * as CACHE from '../../../cache';
import * as H from '../../../utils/helpers';
import * as COMMON from '@dpo-packrat/common';
import { JobCookSIPackratInspectOutput } from '../../../job/impl/Cook';
import * as path from 'path';
import { RecordKeeper as RK } from '../../../records/recordKeeper';

export type WorkflowUtilExtractAssetVersions = {
    success: boolean;
    error?: string;
    idAssetVersions: number[] | null;
    systemObjectAssetVersionMap?: Map<number, number>;
};

export class WorkflowUtil {
    static async extractAssetVersions(idSOs: number[] | undefined): Promise<WorkflowUtilExtractAssetVersions> {
        // confirm that idSystemObject are asset versions; ultimately, we will want to allow a model and/or capture data, depending on the recipe
        if (!idSOs)
            return { success: true, idAssetVersions: null }; // OK to call without objects to act on, at least at this point -- the job itself may complain once started

        const idAssetVersions: number[] | null = [];
        const systemObjectAssetVersionMap: Map<number, number> = new Map<number, number>();
        for (const idSystemObject of idSOs) {
            const OID: DBAPI.ObjectIDAndType | undefined = await CACHE.SystemObjectCache.getObjectFromSystem(idSystemObject);
            if (!OID) {
                const error: string = `unable to compute system object type for ${idSystemObject}`;
                RK.logError(RK.LogSection.eWF,'extract asset versions failed','unable to compute system object type', { idSystemObject },'Workflow.Util');
                return { success: false, error, idAssetVersions: null };
            } else if (OID.eObjectType != COMMON.eSystemObjectType.eAssetVersion) {
                const error: string = `called with invalid system object type ${JSON.stringify(OID)} for ${idSystemObject}; expected eAssetVersion`;
                RK.logError(RK.LogSection.eWF,'extract asset versions failed','called with invalid system object type', { idSystemObject, ...OID },'Workflow.Util');
                return { success: false, error, idAssetVersions: null };
            }
            idAssetVersions.push(OID.idObject);
            systemObjectAssetVersionMap.set(idSystemObject, OID.idObject);
        }
        return { success: true, idAssetVersions, systemObjectAssetVersionMap };
    }

    static async computeModelMetrics(fileName: string,
        idModel: number | undefined,
        idSystemObjectModel: number | undefined,
        idSystemObjectAssetVersion: number | undefined,
        idSystemObjectSupportFileAssetVersion: number | undefined,
        readStream: NodeJS.ReadableStream | undefined,
        idProject: number | undefined,
        idUserInitiator: number | undefined,
        assetMap?: Map<string, number> | undefined): Promise<H.IOResults> { // map of asset filename -> idAsset, needed by WorkflowUtil.computeModelMetrics to persist ModelMaterialUVMap and ModelMaterialChannel
        RK.logInfo(RK.LogSection.eWF,'compute model metrics',undefined, { fileName, idModel, idSystemObjectModel, idSystemObjectAssetVersion },'Workflow.Util');

        switch (path.extname(fileName).toLowerCase()) {
            case '.usda':
            case '.usdc':
            case '.usdz':
            case '.wrl':
                return { success: true, error: `Model ${fileName} skipped (not yet supported by Cook's si-packrat-inspect recipe)` };
        }

        const parameters: WorkflowJobParameters =
            new WorkflowJobParameters(COMMON.eVocabularyID.eJobJobTypeCookSIPackratInspect,
                new COOK.JobCookSIPackratInspectParameters(fileName, undefined, readStream));

        if (!idModel && !idSystemObjectModel && !idSystemObjectAssetVersion) {
            RK.logError(RK.LogSection.eWF,'compute model metrics failed','called without identifiers', { fileName },'Workflow.Util');
            return { success: false, error: `${fileName} called without identifiers` };
        }

        // compute array of idSystemObjects for the asset versions of the specified model/system object of a model/system object of an asset version
        const idSystemObject: number[] = [];
        const idAssetVersions: number[] = [];
        if (idSystemObjectAssetVersion) {
            idSystemObject.push(idSystemObjectAssetVersion);
            if (idSystemObjectSupportFileAssetVersion)
                idSystemObject.push(idSystemObjectSupportFileAssetVersion);

            const SO: DBAPI.SystemObject | null = await DBAPI.SystemObject.fetch(idSystemObjectAssetVersion);
            if (!SO) {
                RK.logError(RK.LogSection.eWF,'compute model metrics failed','unable to fetch system object from id', { fileName, idSystemObjectAssetVersion },'Workflow.Util');
                return { success: false, error: `${fileName} unable to fetch system object from id ${idSystemObjectAssetVersion}` };
            }
            if (SO.idAssetVersion)
                idAssetVersions.push(SO.idAssetVersion);
            else
                RK.logError(RK.LogSection.eWF,'compute model metrics failed','system object is not an asset version', { fileName, idSystemObjectAssetVersion },'Workflow.Util');
        } else {
            if (!idSystemObjectModel) {
                const model: DBAPI.Model | null = await DBAPI.Model.fetch(idModel ?? 0);
                if (!model) {
                    RK.logError(RK.LogSection.eWF,'compute model metrics failed','unable to load model from id', { fileName, idModel },'Workflow.Util');
                    return { success: false, error: `${fileName} unable to load model from ${idModel}` };
                }
                const modelSO: DBAPI.SystemObject | null = await model.fetchSystemObject();
                if (!modelSO) {
                    RK.logError(RK.LogSection.eWF,'compute model metrics failed','unable to load model system object', { fileName, model },'Workflow.Util');
                    return { success: false, error: `${fileName} unable to load model system object from ${H.Helpers.JSONStringify(model)}` };
                }
                idSystemObjectModel = modelSO.idSystemObject;
            }

            const assetVersions: DBAPI.AssetVersion[] | null = await DBAPI.AssetVersion.fetchLatestFromSystemObject(idSystemObjectModel);
            if (!assetVersions) {
                RK.logError(RK.LogSection.eWF,'compute model metrics failed','unable to load asset versions', { fileName, idSystemObjectModel },'Workflow.Util');
                return { success: false, error: `${fileName} unable to load asset versions from ${idSystemObjectModel}` };
            }
            for (const assetVersion of assetVersions) {
                const SOI: DBAPI.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromAssetVersion(assetVersion);
                if (!SOI) {
                    RK.logError(RK.LogSection.eWF,'compute model metrics failed','unable to fetch system object info', { fileName, assetVersion },'Workflow.Util');
                    return { success: false, error: `${fileName} unable to fetch system object info from ${H.Helpers.JSONStringify(assetVersion)}` };
                }
                idSystemObject.push(SOI.idSystemObject);
                idAssetVersions.push(assetVersion.idAssetVersion);
            }
        }

        const wfParams: WF.WorkflowParameters = {
            eWorkflowType: COMMON.eVocabularyID.eWorkflowTypeCookJob,
            idSystemObject,
            idProject,
            idUserInitiator,
            parameters,
        };

        const workflowEngine: WF.IWorkflowEngine | null = await WF.WorkflowFactory.getInstance();
        if (!workflowEngine) {
            RK.logError(RK.LogSection.eWF,'compute model metrics failed','unable to get WorkflowEngine', { fileName },'Workflow.Util');
            return { success: false, error: `${fileName} unable to get WorkflowEngine: ${JSON.stringify(wfParams)}` };
        }

        const workflow: WF.IWorkflow | null = await workflowEngine.create(wfParams);
        if (!workflow) {
            RK.logError(RK.LogSection.eWF,'compute model metrics failed','unable to create Cook si-packrat-inspect workflow', { fileName, ...wfParams },'Workflow.Util');
            return { success: false, error: `${fileName} unable to create Cook si-packrat-inspect workflow: ${JSON.stringify(wfParams)}` };
        }

        const results = await workflow.waitForCompletion(10 * 60 * 60 * 1000); // 10 hours
        if (!results.success) {
            RK.logError(RK.LogSection.eWF,'compute model metrics failed',`post-upload error: ${results.error}`, { fileName },'Workflow.Util');
            return { success: false, error: `${fileName} post-upload workflow error: ${results.error}` };
        }

        // persist extracted metrics, if we have a source model
        if (idModel) {
            for (const idAssetVersion of idAssetVersions) {
                const JCOutput: JobCookSIPackratInspectOutput | null = await JobCookSIPackratInspectOutput.extractFromAssetVersion(idAssetVersion);
                if (JCOutput) {
                    RK.logDebug(RK.LogSection.eWF,'compute model metrics','persisting metrics for model', { fileName, idModel },'Workflow.Util');
                    const results: H.IOResults = await JCOutput.persist(idModel, assetMap);
                    if (!results.success) {
                        RK.logError(RK.LogSection.eWF,'compute model metrics failed',`peristing metrics error: ${results.error}`, { fileName, idModel, assetMap },'Workflow.Util');
                        return { success: false, error: `${fileName} post-upload workflow error: ${results.error}` };
                    }
                }
            }
        }
        return { success: true };
    }

    static async getWorkflowTimestamps(idWorkflow: number): Promise<{ startDate: Date, endDate: Date }> {

        // get workflow
        const workflow: DBAPI.Workflow | null = await DBAPI.Workflow.fetch(idWorkflow);
        if(!workflow)
            return { startDate: new Date(0), endDate: new Date(0) };

        // if set, then grab all workflows from set
        // otherwise, return what we have
        if(!workflow.idWorkflowSet)
            return { startDate: workflow.DateInitiated, endDate: workflow.DateUpdated };

        // get our set and all workflows from it
        const workflows: DBAPI.Workflow[] | null = await DBAPI.Workflow.fetchFromWorkflowSet(workflow.idWorkflowSet);
        if(!workflows || workflows.length===0)
            return { startDate: workflow.DateInitiated, endDate: workflow.DateUpdated };

        const { startDate, endDate } = workflows.reduce(
            (acc, item) => {
                const initialized = new Date(item.DateInitiated);
                const updated = new Date(item.DateUpdated);

                if (initialized < acc.startDate) acc.startDate = initialized;
                if (updated > acc.endDate) acc.endDate = updated;

                return acc;
            },
            {
                startDate: new Date(workflows[0].DateInitiated),
                endDate: new Date(workflows[0].DateUpdated),
            }
        );

        return { startDate, endDate };
    }
}