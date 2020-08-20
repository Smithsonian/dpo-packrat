import { Actor, Asset, AssetVersion, CaptureData, IntermediaryFile, Item, Model,
    Project, ProjectDocumentation, Scene, Stakeholder, Subject, SystemObject,
    SystemObjectPairs, Unit, Workflow, WorkflowStep, eSystemObjectType } from '../..';
import * as LOG from '../../../utils/logger';
import * as L from 'lodash';

type SystemObjectIDType = {
    idSystemObject: number,
    idObject: number,
    eType: eSystemObjectType
};

export class ObjectAncestry {
    idSystemObject: number = 0;
    unit: Unit[] | null = null;
    project: Project[] | null = null;
    subject: Subject[] | null = null;
    item: Item[] | null = null;
    captureData: CaptureData[] | null = null;
    model: Model[] | null = null;
    scene: Scene[] | null = null;
    intermediaryFile: IntermediaryFile[] | null = null;
    projectDocumentation: ProjectDocumentation[] | null = null;
    asset: Asset[] | null = null;
    assetVersion: AssetVersion[] | null = null;
    actor: Actor[] | null = null;
    stakeholder: Stakeholder[] | null = null;
    workflow: Workflow[] | null = null;
    workflowStep: WorkflowStep[] | null = null;

    validHierarchy: boolean = true;
    noCycles: boolean = true;

    pushCount: number = 0;
    maxPushCount: number = 500;
    systemObjectList: number[] = []; // array of idSystemObjects to be processed
    systemObjectMap: Map<number, SystemObjectIDType> = new Map<number, SystemObjectIDType>(); // map from idSystemObject -> { idSystemObject, id of database object, type of database object}

    constructor(idSystemObject: number) {
        this.idSystemObject = idSystemObject;
    }

    async fetch(): Promise<boolean> {
        if (!this.idSystemObject)
            return true;
        return this.fetchWorker(null, this.idSystemObject);
    }

    // Expected types of hierarchies:
    // Unit -> Project -> Subject -> Item -> CaptureData / Model / Scene / IntermediaryFile
    // Unit -> Project -> ProjectDocumentation
    // Unit -> Subject -> Item -> CaptureData / Model / Scene / IntermediaryFile

    // SystemObjectXref allows us to model any graph of SystemObjects, including ones that
    // are cyclic and/or do not adhere to the expected object hierarchies described above.
    // This method will extract all ancestors, as well as look for invalid hierarchies and (invalid) cycles.

    private async fetchWorker(childType: SystemObjectIDType | null, idSystemObjectParent: number): Promise<boolean> {
        try {
            // detect cycle; if so, record and short-circuit
            if (this.systemObjectMap.has(idSystemObjectParent)) {
                this.noCycles = false;
                this.validHierarchy = false;
                return true;
            }

            // Determine what kind of object this is
            // push to the appropriate list
            // perform type-specific validity checks
            // gather explicitly related objects
            const parentType: SystemObjectIDType = {
                idSystemObject: idSystemObjectParent,
                idObject: 0,
                eType: eSystemObjectType.eUnknown
            };

            const SOP: SystemObjectPairs | null = await SystemObjectPairs.fetch(idSystemObjectParent);
            if (!SOP) {
                LOG.logger.error(`DBAPI.ObjectAncestry.fetchWorker Unidentified SystemObject ${idSystemObjectParent}`);
                return true;
            }
            if (SOP.CaptureData && !this.pushCaptureData(SOP.CaptureData, childType, parentType))
                return true;
            else if (SOP.Model && !this.pushModel(SOP.Model, childType, parentType))
                return true;
            else if (SOP.Scene && !this.pushScene(SOP.Scene, childType, parentType))
                return true;
            else if (SOP.IntermediaryFile && !this.pushIntermediaryFile(SOP.IntermediaryFile, childType, parentType))
                return true;
            else if (SOP.ProjectDocumentation && !this.pushProjectDocumentation(SOP.ProjectDocumentation, childType, parentType))
                return true;
            else if (SOP.Scene && !this.pushScene(SOP.Scene, childType, parentType))
                return true;
            else if (SOP.Item && !this.pushItem(SOP.Item, childType, parentType))
                return true;
            else if (SOP.Subject && !this.pushSubject(SOP.Subject, childType, parentType))
                return true;
            else if (SOP.Project && !this.pushProject(SOP.Project, childType, parentType))
                return true;
            else if (SOP.Unit && !this.pushUnit(SOP.Unit, childType, parentType))
                return true;
            else if (SOP.Asset && !this.pushAsset(SOP.Asset, childType, parentType))
                return true;
            else if (SOP.AssetVersion && !this.pushAssetVersion(SOP.AssetVersion, childType, parentType))
                return true;
            else if (SOP.Actor && !this.pushActor(SOP.Actor, childType, parentType))
                return true;
            else if (SOP.Stakeholder && !this.pushStakeholder(SOP.Stakeholder, childType, parentType))
                return true;
            else if (SOP.Workflow && !this.pushWorkflow(SOP.Workflow, childType, parentType))
                return true;
            else if (SOP.WorkflowStep && !this.pushWorkflowStep(SOP.WorkflowStep, childType, parentType))
                return true;
            else
                LOG.logger.error(`DBAPI.ObjectAncestry.fetchWorker Unidentified SystemObject type ${JSON.stringify(SOP)}`);

            this.systemObjectMap.set(idSystemObjectParent, parentType);

            // gather using master systemobjectxref's
            const SOMaster: SystemObject[] | null = await SystemObject.fetchMasterFromXref(idSystemObjectParent);
            if (SOMaster)
                for (const SO of SOMaster)
                    this.systemObjectList.push(SO.idSystemObject);

            // handle all gathered objects
            const AncestorList: number[] = L.clone(this.systemObjectList);
            this.systemObjectList = [];
            for (const idSystemObject of AncestorList) {
                if (!await this.fetchWorker(parentType, idSystemObject))
                    return false;
            }

        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.ObjectAncestry.fetchWorker', error);
            return false;
        }

        return true;
    }

    private async pushIntermediaryFile(intermediaryFile: IntermediaryFile, childType: SystemObjectIDType | null, parentType: SystemObjectIDType): Promise<boolean> {
        if (!this.intermediaryFile)
            this.intermediaryFile = [];
        this.intermediaryFile.push(intermediaryFile);

        parentType.idObject = intermediaryFile.idIntermediaryFile;
        parentType.eType = eSystemObjectType.eIntermediaryFile;
        if (childType)
            this.validHierarchy = false;

        if (this.pushCount++ >= this.maxPushCount)
            return false;
        return true;
    }

    private async pushScene(scene: Scene, childType: SystemObjectIDType | null, parentType: SystemObjectIDType): Promise<boolean> {
        if (!this.scene)
            this.scene = [];
        this.scene.push(scene);

        parentType.idObject = scene.idScene;
        parentType.eType = eSystemObjectType.eScene;
        if (!childType ||
            (childType.eType != eSystemObjectType.eAsset &&
             childType.eType != eSystemObjectType.eModel))
            this.validHierarchy = false;

        if (this.pushCount++ >= this.maxPushCount)
            return false;
        return true;
    }

    private async pushModel(model: Model, childType: SystemObjectIDType | null, parentType: SystemObjectIDType): Promise<boolean> {
        if (!this.model)
            this.model = [];
        this.model.push(model);

        parentType.idObject = model.idModel;
        parentType.eType = eSystemObjectType.eModel;
        if (!childType ||
            (childType.eType != eSystemObjectType.eAsset &&
             childType.eType != eSystemObjectType.eScene &&
             childType.eType != eSystemObjectType.eModel))
            this.validHierarchy = false;

        if (this.pushCount++ >= this.maxPushCount)
            return false;
        return true;
    }

    private async pushCaptureData(captureData: CaptureData, childType: SystemObjectIDType | null, parentType: SystemObjectIDType): Promise<boolean> {
        if (!this.captureData)
            this.captureData = [];
        this.captureData.push(captureData);

        parentType.idObject = captureData.idCaptureData;
        parentType.eType = eSystemObjectType.eCaptureData;
        if (!childType ||
            (childType.eType != eSystemObjectType.eAsset &&
             childType.eType != eSystemObjectType.eModel))
            this.validHierarchy = false;

        if (this.pushCount++ >= this.maxPushCount)
            return false;
        return true;
    }

    private async pushAsset(asset: Asset, childType: SystemObjectIDType | null, parentType: SystemObjectIDType): Promise<boolean> {
        if (!this.asset)
            this.asset = [];
        this.asset.push(asset);

        parentType.idObject = asset.idAsset;
        parentType.eType = eSystemObjectType.eAsset;
        if (!childType || childType.eType != eSystemObjectType.eAssetVersion)
            this.validHierarchy = false;

        if (this.pushCount++ >= this.maxPushCount)
            return false;
        return true;
    }

    private async pushAssetVersion(assetVersion: AssetVersion, childType: SystemObjectIDType | null, parentType: SystemObjectIDType): Promise<boolean> {
        if (!this.assetVersion)
            this.assetVersion = [];
        this.assetVersion.push(assetVersion);

        parentType.idObject = assetVersion.idAsset;
        parentType.eType = eSystemObjectType.eAssetVersion;
        if (childType)
            this.validHierarchy = false;

        if (this.pushCount++ >= this.maxPushCount)
            return false;

        if (assetVersion.idAsset) {
            const SO: SystemObject | null = await SystemObject.fetchFromAssetID(assetVersion.idAsset);
            if (SO)
                this.systemObjectList.push(SO.idSystemObject);
            else
                LOG.logger.error(`Missing SystemObject for asset ${assetVersion.idAsset} linked from ${JSON.stringify(assetVersion)}`);
        }
        return true;
    }

    private async pushActor(actor: Actor, childType: SystemObjectIDType | null, parentType: SystemObjectIDType): Promise<boolean> {
        if (!this.actor)
            this.actor = [];
        this.actor.push(actor);

        parentType.idObject = actor.idActor;
        parentType.eType = eSystemObjectType.eActor;
        if (childType)
            this.validHierarchy = false;

        if (this.pushCount++ >= this.maxPushCount)
            return false;

        if (actor.idUnit) {
            const SO: SystemObject | null = await SystemObject.fetchFromUnitID(actor.idUnit);
            if (SO)
                this.systemObjectList.push(SO.idSystemObject);
            else
                LOG.logger.error(`Missing SystemObject for unit ${actor.idUnit} linked from ${JSON.stringify(actor)}`);
        }
        return true;
    }

    private async pushStakeholder(stakeholder: Stakeholder, childType: SystemObjectIDType | null, parentType: SystemObjectIDType): Promise<boolean> {
        if (!this.stakeholder)
            this.stakeholder = [];
        this.stakeholder.push(stakeholder);

        parentType.idObject = stakeholder.idStakeholder;
        parentType.eType = eSystemObjectType.eStakeholder;
        if (childType)
            this.validHierarchy = false;

        if (this.pushCount++ >= this.maxPushCount)
            return false;
        return true;
    }

    private async pushWorkflow(workflow: Workflow, childType: SystemObjectIDType | null, parentType: SystemObjectIDType): Promise<boolean> {
        if (!this.workflow)
            this.workflow = [];
        this.workflow.push(workflow);

        parentType.idObject = workflow.idWorkflow;
        parentType.eType = eSystemObjectType.eWorkflow;
        if (!childType || childType.eType != eSystemObjectType.eWorkflowStep)
            this.validHierarchy = false;

        if (this.pushCount++ >= this.maxPushCount)
            return false;
        return true;
    }

    private async pushWorkflowStep(workflowStep: WorkflowStep, childType: SystemObjectIDType | null, parentType: SystemObjectIDType): Promise<boolean> {
        if (!this.workflowStep)
            this.workflowStep = [];
        this.workflowStep.push(workflowStep);

        parentType.idObject = workflowStep.idWorkflowStep;
        parentType.eType = eSystemObjectType.eWorkflowStep;
        if (childType)
            this.validHierarchy = false;

        if (this.pushCount++ >= this.maxPushCount)
            return false;

        if (workflowStep.idWorkflow) {
            const SO: SystemObject | null = await SystemObject.fetchFromWorkflowID(workflowStep.idWorkflow);
            if (SO)
                this.systemObjectList.push(SO.idSystemObject);
            else
                LOG.logger.error(`Missing SystemObject for workflow ${workflowStep.idWorkflow} linked from ${JSON.stringify(workflowStep)}`);
        }

        return true;
    }

    private async pushItem(item: Item, childType: SystemObjectIDType | null, parentType: SystemObjectIDType): Promise<boolean> {
        if (!this.item)
            this.item = [];
        this.item.push(item);

        parentType.idObject = item.idItem;
        parentType.eType = eSystemObjectType.eItem;
        if (!childType ||
            (childType.eType != eSystemObjectType.eAsset &&
             childType.eType != eSystemObjectType.eCaptureData &&
             childType.eType != eSystemObjectType.eModel &&
             childType.eType != eSystemObjectType.eScene))
            this.validHierarchy = false;

        if (this.pushCount++ >= this.maxPushCount)
            return false;
        return true;
    }

    private async pushSubject(subject: Subject, childType: SystemObjectIDType | null, parentType: SystemObjectIDType): Promise<boolean> {
        if (!this.subject)
            this.subject = [];
        this.subject.push(subject);

        parentType.idObject = subject.idSubject;
        parentType.eType = eSystemObjectType.eSubject;
        if (!childType ||
            (childType.eType != eSystemObjectType.eAsset &&
             childType.eType != eSystemObjectType.eItem))
            this.validHierarchy = false;

        if (this.pushCount++ >= this.maxPushCount)
            return false;

        if (subject.idUnit) {
            const SO: SystemObject | null = await SystemObject.fetchFromUnitID(subject.idUnit);
            if (SO)
                this.systemObjectList.push(SO.idSystemObject);
            else
                LOG.logger.error(`Missing SystemObject for unit ${subject.idUnit} linked from ${JSON.stringify(subject)}`);
        }

        return true;
    }

    private async pushProjectDocumentation(projectDocumentation: ProjectDocumentation, childType: SystemObjectIDType | null, parentType: SystemObjectIDType): Promise<boolean> {
        if (!this.projectDocumentation)
            this.projectDocumentation = [];
        this.projectDocumentation.push(projectDocumentation);

        parentType.idObject = projectDocumentation.idProjectDocumentation;
        parentType.eType = eSystemObjectType.eProjectDocumentation;
        if (childType)
            this.validHierarchy = false;

        if (this.pushCount++ >= this.maxPushCount)
            return false;

        if (projectDocumentation.idProject) {
            const SO: SystemObject | null = await SystemObject.fetchFromProjectID(projectDocumentation.idProject);
            if (SO)
                this.systemObjectList.push(SO.idSystemObject);
            else
                LOG.logger.error(`Missing SystemObject for project ${projectDocumentation.idProject} linked from ${JSON.stringify(projectDocumentation)}`);
        }

        return true;
    }

    private async pushProject(project: Project, childType: SystemObjectIDType | null, parentType: SystemObjectIDType): Promise<boolean> {
        if (!this.project)
            this.project = [];
        this.project.push(project);

        parentType.idObject = project.idProject;
        parentType.eType = eSystemObjectType.eProject;
        if (!childType ||
            (childType.eType != eSystemObjectType.eSubject &&
             childType.eType != eSystemObjectType.eProjectDocumentation))
            this.validHierarchy = false;

        if (this.pushCount++ >= this.maxPushCount)
            return false;
        return true;
    }

    private async pushUnit(unit: Unit, childType: SystemObjectIDType | null, parentType: SystemObjectIDType): Promise<boolean> {
        if (!this.unit)
            this.unit = [];
        this.unit.push(unit);

        parentType.idObject = unit.idUnit;
        parentType.eType = eSystemObjectType.eUnit;
        if (!childType ||
            (childType.eType != eSystemObjectType.eSubject &&
             childType.eType != eSystemObjectType.eProject))
            this.validHierarchy = false;

        if (this.pushCount++ >= this.maxPushCount)
            return false;
        return true;
    }
}

