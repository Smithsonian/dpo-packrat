import { CreateSceneInput } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';

type Args = { input: CreateSceneInput };

export default async function createScene(_: Parent, args: Args): Promise<boolean> {

    console.log('\n>>> creating scene\n');
    console.log(args);

    // make sure we have a proper id set

    // find its type to see if we are creating it from a master model or a scene

    // TODO: if a scene get the master model and redo it
    // ...

    // const workflowEngine: WF.IWorkflowEngine | null | undefined = this.workflowHelper?.workflowEngine;
    // if (!workflowEngine) {
    //     LOG.error('ingestData sendWorkflowIngestionEvent could not load WorkflowEngine', LOG.LS.eGQL);
    //     return false;
    // }

    // const user: User = this.user!; // eslint-disable-line @typescript-eslint/no-non-null-assertion

    // // prepare to wire together ingestion workflow step with output asset versions (in systemObjectSet)
    // const WFC: DBAPI.WorkflowConstellation | null = (this.workflowHelper && this.workflowHelper.workflow)
    //     ? await this.workflowHelper.workflow.workflowConstellation() : null;
    // const workflowSteps: DBAPI.WorkflowStep[] | null = WFC ? WFC.workflowStep : null;
    // const workflowStep: DBAPI.WorkflowStep | null = (workflowSteps && workflowSteps.length > 0) ? workflowSteps[workflowSteps.length - 1] : null;

    // // compute set of unique asset versions ingested:
    // let ret: boolean = true;
    // for (const IAR of ingestResMap.values()) {
    //     if (!IAR || !IAR.assetVersions)
    //         continue;

    //     const systemObjectSet: Set<number> = new Set<number>();
    //     for (const assetVersion of IAR.assetVersions) {
    //         const oID: DBAPI.ObjectIDAndType = { idObject: assetVersion.idAssetVersion, eObjectType: COMMON.eSystemObjectType.eAssetVersion };
    //         const sysInfo: DBAPI.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromObjectID(oID);
    //         if (!sysInfo) {
    //             LOG.error(`ingestData sendWorkflowIngestionEvent could not find system object for ${H.Helpers.JSONStringify(oID)}`, LOG.LS.eGQL);
    //             ret = false;
    //             continue;
    //         }
    //         systemObjectSet.add(sysInfo.idSystemObject);
    //     }

    //     const idSystemObject: number[] = [];
    //     for (const idSystemObjectDistinct of systemObjectSet.values()) {
    //         idSystemObject.push(idSystemObjectDistinct);
    //         if (workflowStep) {
    //             const WSSOX: DBAPI.WorkflowStepSystemObjectXref = new DBAPI.WorkflowStepSystemObjectXref({
    //                 idWorkflowStep: workflowStep.idWorkflowStep,
    //                 idSystemObject: idSystemObjectDistinct,
    //                 Input: false,
    //                 idWorkflowStepSystemObjectXref: 0
    //             });
    //             if (!await WSSOX.create())
    //                 LOG.error(`ingestData sendWorkflowIngestionEvent failed to create WorkflowStepSystemObjectXref ${H.Helpers.JSONStringify(WSSOX)}`, LOG.LS.eGQL);
    //         }
    //     }

    //     let message: string = 'Sending WorkflowEngine IngestObject event';
    //     if (IAR.systemObjectVersion?.idSystemObject) {
    //         const pathObject: string = RouteBuilder.RepositoryDetails(IAR.systemObjectVersion.idSystemObject, eHrefMode.ePrependClientURL);
    //         const hrefObject: string = H.Helpers.computeHref(pathObject, `System Object ${IAR.systemObjectVersion.idSystemObject}`);
    //         message += ` for ${hrefObject}`;
    //     }
    //     await this.appendToWFReport(message);

    //     const parameters = {
    //         modelTransformUpdated,
    //         assetsIngested: IAR.assetsIngested,
    //         skipSceneGenerate: IAR.skipSceneGenerate
    //     };

    //     const workflowParams: WF.WorkflowParameters = {
    //         idSystemObject,
    //         // idProject: TODO: update with project ID
    //         idUserInitiator: user.idUser,
    //         parameters
    //     };

    //     // send workflow engine event, but don't wait for results
    //     workflowEngine.event(COMMON.eVocabularyID.eWorkflowEventIngestionIngestObject, workflowParams);
    // }

    return false;
}