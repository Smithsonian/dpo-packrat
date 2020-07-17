/* eslint-disable camelcase */
import * as P from '@prisma/client';
import { DBConnectionFactory, Actor, Asset, AssetVersion, CaptureData, IntermediaryFile, Item, Model,
    Project, ProjectDocumentation, Scene, Stakeholder, SystemObject, Subject, Unit,
    Workflow, WorkflowStep } from '..';
import * as DBO from './DBObject';
import * as LOG from '../../utils/logger';

type SystemObjectPairsBase = P.SystemObject
& { Actor: P.Actor | null}
& { Asset: P.Asset | null}
& { AssetVersion: P.AssetVersion | null}
& { CaptureData: P.CaptureData | null}
& { IntermediaryFile: P.IntermediaryFile | null}
& { Item: P.Item | null}
& { Model: P.Model | null}
& { Project: P.Project | null}
& { ProjectDocumentation: P.ProjectDocumentation | null}
& { Scene: P.Scene | null}
& { Stakeholder: P.Stakeholder | null}
& { Subject: P.Subject | null}
& { Unit: P.Unit | null}
& { Workflow: P.Workflow | null}
& { WorkflowStep: P.WorkflowStep | null};

type SystemObjectActorBase = P.SystemObject & { Actor: P.Actor | null};
type SystemObjectAssetBase = P.SystemObject & { Asset: P.Asset | null};
type SystemObjectAssetVersionBase = P.SystemObject & { AssetVersion: P.AssetVersion | null};
type SystemObjectCaptureDataBase = P.SystemObject & { CaptureData: P.CaptureData | null};
type SystemObjectIntermediaryFileBase = P.SystemObject & { IntermediaryFile: P.IntermediaryFile | null};
type SystemObjectItemBase = P.SystemObject & { Item: P.Item | null};
type SystemObjectModelBase = P.SystemObject & { Model: P.Model | null};
type SystemObjectProjectBase = P.SystemObject & { Project: P.Project | null};
type SystemObjectProjectDocumentationBase = P.SystemObject & { ProjectDocumentation: P.ProjectDocumentation | null};
type SystemObjectSceneBase = P.SystemObject & { Scene: P.Scene | null};
type SystemObjectStakeholderBase = P.SystemObject & { Stakeholder: P.Stakeholder | null};
type SystemObjectSubjectBase = P.SystemObject & { Subject: P.Subject | null};
type SystemObjectUnitBase = P.SystemObject & { Unit: P.Unit | null};
type SystemObjectWorkflowBase = P.SystemObject & { Workflow: P.Workflow | null};
type SystemObjectWorkflowStepBase = P.SystemObject & { WorkflowStep: P.WorkflowStep | null};

export class SystemObjectActor extends SystemObject implements SystemObjectActorBase {
    Actor: Actor | null;

    constructor(input: SystemObjectActorBase) {
        super(input);
        this.Actor = (input.Actor) ? new Actor(input.Actor) : /* istanbul ignore next */ null;
    }

    static async fetch(idActor: number): Promise<SystemObjectActor | null> {
        if (!idActor)
            return null;
        try {
            const SOPair: SystemObjectActorBase | null =
                await DBConnectionFactory.prisma.systemObject.findOne({ where: { idActor, }, include: { Actor: true, }, });
            return SOPair ? new SystemObjectActor(SOPair) : null;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.SystemObjectActor.fetch', error);
            return null;
        }
    }
}

export class SystemObjectAsset extends SystemObject implements SystemObjectAssetBase {
    Asset: Asset | null;

    constructor(input: SystemObjectAssetBase) {
        super(input);
        this.Asset = (input.Asset) ? new Asset(input.Asset) : /* istanbul ignore next */ null;
    }

    static async fetch(idAsset: number): Promise<SystemObjectAsset | null> {
        if (!idAsset)
            return null;
        try {
            const SOPair: SystemObjectAssetBase | null =
                await DBConnectionFactory.prisma.systemObject.findOne({ where: { idAsset, }, include: { Asset: true, }, });
            return SOPair ? new SystemObjectAsset(SOPair) : null;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.SystemObjectAsset.fetch', error);
            return null;
        }
    }
}

export class SystemObjectAssetVersion extends SystemObject implements SystemObjectAssetVersionBase {
    AssetVersion: AssetVersion | null;

    constructor(input: SystemObjectAssetVersionBase) {
        super(input);
        this.AssetVersion = (input.AssetVersion) ? new AssetVersion(input.AssetVersion) : /* istanbul ignore next */ null;
    }

    static async fetch(idAssetVersion: number): Promise<SystemObjectAssetVersion | null> {
        if (!idAssetVersion)
            return null;
        try {
            const SOPair: SystemObjectAssetVersionBase | null =
                await DBConnectionFactory.prisma.systemObject.findOne({ where: { idAssetVersion, }, include: { AssetVersion: true, }, });
            return SOPair ? new SystemObjectAssetVersion(SOPair) : null;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.SystemObjectAssetVersion.fetch', error);
            return null;
        }
    }
}

export class SystemObjectCaptureData extends SystemObject implements SystemObjectCaptureDataBase {
    CaptureData: CaptureData | null;

    constructor(input: SystemObjectCaptureDataBase) {
        super(input);
        this.CaptureData = (input.CaptureData) ? new CaptureData(input.CaptureData) : /* istanbul ignore next */ null;
    }

    static async fetch(idCaptureData: number): Promise<SystemObjectCaptureData | null> {
        if (!idCaptureData)
            return null;
        try {
            const SOPair: SystemObjectCaptureDataBase | null =
                await DBConnectionFactory.prisma.systemObject.findOne({ where: { idCaptureData, }, include: { CaptureData: true, }, });
            return SOPair ? new SystemObjectCaptureData(SOPair) : null;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.SystemObjectCaptureData.fetch', error);
            return null;
        }
    }
}

export class SystemObjectIntermediaryFile extends SystemObject implements SystemObjectIntermediaryFileBase {
    IntermediaryFile: IntermediaryFile | null;

    constructor(input: SystemObjectIntermediaryFileBase) {
        super(input);
        this.IntermediaryFile = (input.IntermediaryFile) ? new IntermediaryFile(input.IntermediaryFile) : /* istanbul ignore next */ null;
    }

    static async fetch(idIntermediaryFile: number): Promise<SystemObjectIntermediaryFile | null> {
        if (!idIntermediaryFile)
            return null;
        try {
            const SOPair: SystemObjectIntermediaryFileBase | null =
                await DBConnectionFactory.prisma.systemObject.findOne({ where: { idIntermediaryFile, }, include: { IntermediaryFile: true, }, });
            return SOPair ? new SystemObjectIntermediaryFile(SOPair) : null;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.SystemObjectIntermediaryFile.fetch', error);
            return null;
        }
    }
}

export class SystemObjectItem extends SystemObject implements SystemObjectItemBase {
    Item: Item | null;

    constructor(input: SystemObjectItemBase) {
        super(input);
        this.Item = (input.Item) ? new Item(input.Item) : /* istanbul ignore next */ null;
    }

    static async fetch(idItem: number): Promise<SystemObjectItem | null> {
        if (!idItem)
            return null;
        try {
            const SOPair: SystemObjectItemBase | null =
                await DBConnectionFactory.prisma.systemObject.findOne({ where: { idItem, }, include: { Item: true, }, });
            return SOPair ? new SystemObjectItem(SOPair) : null;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.SystemObjectItem.fetch', error);
            return null;
        }
    }
}

export class SystemObjectModel extends SystemObject implements SystemObjectModelBase {
    Model: Model | null;

    constructor(input: SystemObjectModelBase) {
        super(input);
        this.Model = (input.Model) ? new Model(input.Model) : /* istanbul ignore next */ null;
    }

    static async fetch(idModel: number): Promise<SystemObjectModel | null> {
        if (!idModel)
            return null;
        try {
            const SOPair: SystemObjectModelBase | null =
                await DBConnectionFactory.prisma.systemObject.findOne({ where: { idModel, }, include: { Model: true, }, });
            return SOPair ? new SystemObjectModel(SOPair) : null;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.SystemObjectModel.fetch', error);
            return null;
        }
    }
}

export class SystemObjectProject extends SystemObject implements SystemObjectProjectBase {
    Project: Project | null;

    constructor(input: SystemObjectProjectBase) {
        super(input);
        this.Project = (input.Project) ? new Project(input.Project) : /* istanbul ignore next */ null;
    }

    static async fetch(idProject: number): Promise<SystemObjectProject | null> {
        if (!idProject)
            return null;
        try {
            const SOPair: SystemObjectProjectBase | null =
                await DBConnectionFactory.prisma.systemObject.findOne({ where: { idProject, }, include: { Project: true, }, });
            return SOPair ? new SystemObjectProject(SOPair) : null;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.SystemObjectProject.fetch', error);
            return null;
        }
    }
}

export class SystemObjectProjectDocumentation extends SystemObject implements SystemObjectProjectDocumentationBase {
    ProjectDocumentation: ProjectDocumentation | null;

    constructor(input: SystemObjectProjectDocumentationBase) {
        super(input);
        this.ProjectDocumentation = (input.ProjectDocumentation) ? new ProjectDocumentation(input.ProjectDocumentation) : /* istanbul ignore next */ null;
    }

    static async fetch(idProjectDocumentation: number): Promise<SystemObjectProjectDocumentation | null> {
        if (!idProjectDocumentation)
            return null;
        try {
            const SOPair: SystemObjectProjectDocumentationBase | null =
                await DBConnectionFactory.prisma.systemObject.findOne({ where: { idProjectDocumentation, }, include: { ProjectDocumentation: true, }, });
            return SOPair ? new SystemObjectProjectDocumentation(SOPair) : null;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.SystemObjectProjectDocumentation.fetch', error);
            return null;
        }
    }
}

export class SystemObjectScene extends SystemObject implements SystemObjectSceneBase {
    Scene: Scene | null;

    constructor(input: SystemObjectSceneBase) {
        super(input);
        this.Scene = (input.Scene) ? new Scene(input.Scene) : /* istanbul ignore next */ null;
    }

    static async fetch(idScene: number): Promise<SystemObjectScene | null> {
        if (!idScene)
            return null;
        try {
            const SOPair: SystemObjectSceneBase | null =
                await DBConnectionFactory.prisma.systemObject.findOne({ where: { idScene, }, include: { Scene: true, }, });
            return SOPair ? new SystemObjectScene(SOPair) : null;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.SystemObjectScene.fetch', error);
            return null;
        }
    }
}

export class SystemObjectStakeholder extends SystemObject implements SystemObjectStakeholderBase {
    Stakeholder: Stakeholder | null;

    constructor(input: SystemObjectStakeholderBase) {
        super(input);
        this.Stakeholder = (input.Stakeholder) ? new Stakeholder(input.Stakeholder) : /* istanbul ignore next */ null;
    }

    static async fetch(idStakeholder: number): Promise<SystemObjectStakeholder | null> {
        if (!idStakeholder)
            return null;
        try {
            const SOPair: SystemObjectStakeholderBase | null =
                await DBConnectionFactory.prisma.systemObject.findOne({ where: { idStakeholder, }, include: { Stakeholder: true, }, });
            return SOPair ? new SystemObjectStakeholder(SOPair) : null;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.SystemObjectStakeholder.fetch', error);
            return null;
        }
    }
}

export class SystemObjectSubject extends SystemObject implements SystemObjectSubjectBase {
    Subject: Subject | null;

    constructor(input: SystemObjectSubjectBase) {
        super(input);
        this.Subject = (input.Subject) ? new Subject(input.Subject) : /* istanbul ignore next */ null;
    }

    static async fetch(idSubject: number): Promise<SystemObjectSubject | null> {
        if (!idSubject)
            return null;
        try {
            const SOPair: SystemObjectSubjectBase | null =
                await DBConnectionFactory.prisma.systemObject.findOne({ where: { idSubject, }, include: { Subject: true, }, });
            return SOPair ? new SystemObjectSubject(SOPair) : null;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.SystemObjectSubject.fetch', error);
            return null;
        }
    }
}

export class SystemObjectUnit extends SystemObject implements SystemObjectUnitBase {
    Unit: Unit | null;

    constructor(input: SystemObjectUnitBase) {
        super(input);
        this.Unit = (input.Unit) ? new Unit(input.Unit) : /* istanbul ignore next */ null;
    }

    static async fetch(idUnit: number): Promise<SystemObjectUnit | null> {
        if (!idUnit)
            return null;
        try {
            const SOPair: SystemObjectUnitBase | null =
                await DBConnectionFactory.prisma.systemObject.findOne({ where: { idUnit, }, include: { Unit: true, }, });
            return SOPair ? new SystemObjectUnit(SOPair) : null;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.SystemObjectUnit.fetch', error);
            return null;
        }
    }
}

export class SystemObjectWorkflow extends SystemObject implements SystemObjectWorkflowBase {
    Workflow: Workflow | null;

    constructor(input: SystemObjectWorkflowBase) {
        super(input);
        this.Workflow = (input.Workflow) ? new Workflow(input.Workflow) : /* istanbul ignore next */ null;
    }

    static async fetch(idWorkflow: number): Promise<SystemObjectWorkflow | null> {
        if (!idWorkflow)
            return null;
        try {
            const SOPair: SystemObjectWorkflowBase | null =
                await DBConnectionFactory.prisma.systemObject.findOne({ where: { idWorkflow, }, include: { Workflow: true, }, });
            return SOPair ? new SystemObjectWorkflow(SOPair) : null;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.SystemObjectWorkflow.fetch', error);
            return null;
        }
    }
}

export class SystemObjectWorkflowStep extends SystemObject implements SystemObjectWorkflowStepBase {
    WorkflowStep: WorkflowStep | null;

    constructor(input: SystemObjectWorkflowStepBase) {
        super(input);
        this.WorkflowStep = (input.WorkflowStep) ? new WorkflowStep(input.WorkflowStep) : /* istanbul ignore next */ null;
    }

    static async fetch(idWorkflowStep: number): Promise<SystemObjectWorkflowStep | null> {
        if (!idWorkflowStep)
            return null;
        try {
            const SOPair: SystemObjectWorkflowStepBase | null =
                await DBConnectionFactory.prisma.systemObject.findOne({ where: { idWorkflowStep, }, include: { WorkflowStep: true, }, });
            return SOPair ? new SystemObjectWorkflowStep(SOPair) : null;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.SystemObjectWorkflowStep.fetch', error);
            return null;
        }
    }
}

export class SystemObjectPairs extends SystemObject implements SystemObjectPairsBase {
    Actor: Actor | null = null;
    Asset: Asset | null = null;
    AssetVersion: AssetVersion | null = null;
    CaptureData: CaptureData | null = null;
    IntermediaryFile: IntermediaryFile | null = null;
    Item: Item | null = null;
    Model: Model | null = null;
    Project: Project | null = null;
    ProjectDocumentation: ProjectDocumentation | null = null;
    Scene: Scene | null = null;
    Stakeholder: Stakeholder | null = null;
    Subject: Subject | null = null;
    Unit: Unit | null = null;
    Workflow: Workflow | null = null;
    WorkflowStep: WorkflowStep | null = null;

    constructor(input: SystemObjectPairsBase) {
        super(input);
        if (input.Actor) this.Actor = new Actor(input.Actor);
        if (input.Asset) this.Asset = new Asset(input.Asset);
        if (input.AssetVersion) this.AssetVersion = new AssetVersion(input.AssetVersion);
        if (input.CaptureData) this.CaptureData = new CaptureData(input.CaptureData);
        if (input.IntermediaryFile) this.IntermediaryFile = new IntermediaryFile(input.IntermediaryFile);
        if (input.Item) this.Item = new Item(input.Item);
        if (input.Model) this.Model = new Model(input.Model);
        if (input.Project) this.Project = new Project(input.Project);
        if (input.ProjectDocumentation) this.ProjectDocumentation = new ProjectDocumentation(input.ProjectDocumentation);
        if (input.Scene) this.Scene = new Scene(input.Scene);
        if (input.Subject) this.Subject = new Subject(input.Subject);
        if (input.Stakeholder) this.Stakeholder = new Stakeholder(input.Stakeholder);
        if (input.Unit) this.Unit = new Unit(input.Unit);
        if (input.Workflow) this.Workflow = new Workflow(input.Workflow);
        if (input.WorkflowStep) this.WorkflowStep = new WorkflowStep(input.WorkflowStep);
    }

    static async fetch(idSystemObject: number): Promise<SystemObjectPairs | null> {
        if (!idSystemObject)
            return null;
        try {
            const SOAPB: SystemObjectPairsBase | null =
                await DBConnectionFactory.prisma.systemObject.findOne({
                    where: { idSystemObject, },
                    include: {
                        Actor: true,
                        Asset: true,
                        AssetVersion: true,
                        CaptureData: true,
                        IntermediaryFile: true,
                        Item: true,
                        Model: true,
                        Project: true,
                        ProjectDocumentation: true,
                        Scene: true,
                        Stakeholder: true,
                        Subject: true,
                        Unit: true,
                        Workflow: true,
                        WorkflowStep: true
                    },
                });
            return (SOAPB ? new SystemObjectPairs(SOAPB) : null);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.SystemObjectAndPairs.fetch', error);
            return null;
        }
    }

    static async fetchDerivedFromXref(idSystemObjectMaster: number): Promise<SystemObjectPairs[] | null> {
        if (!idSystemObjectMaster)
            return null;
        try {
            return DBO.CopyArray<SystemObjectPairsBase, SystemObjectPairs>(
                await DBConnectionFactory.prisma.systemObject.findMany({
                    where: {
                        SystemObjectXref_SystemObjectToSystemObjectXref_idSystemObjectDerived: {
                            some: { idSystemObjectMaster },
                        },
                    },
                    include: {
                        Actor: true,
                        Asset: true,
                        AssetVersion: true,
                        CaptureData: true,
                        IntermediaryFile: true,
                        Item: true,
                        Model: true,
                        Project: true,
                        ProjectDocumentation: true,
                        Scene: true,
                        Stakeholder: true,
                        Subject: true,
                        Unit: true,
                        Workflow: true,
                        WorkflowStep: true
                    },
                }), SystemObjectPairs);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.SystemObjectAndPairs.fetchDerivedFromXref', error);
            return null;
        }
    }

    static async fetchMasterFromXref(idSystemObjectDerived: number): Promise<SystemObjectPairs[] | null> {
        if (!idSystemObjectDerived)
            return null;
        try {
            return DBO.CopyArray<SystemObjectPairsBase, SystemObjectPairs>(
                await DBConnectionFactory.prisma.systemObject.findMany({
                    where: {
                        SystemObjectXref_SystemObjectToSystemObjectXref_idSystemObjectMaster: {
                            some: { idSystemObjectDerived },
                        },
                    },
                    include: {
                        Actor: true,
                        Asset: true,
                        AssetVersion: true,
                        CaptureData: true,
                        IntermediaryFile: true,
                        Item: true,
                        Model: true,
                        Project: true,
                        ProjectDocumentation: true,
                        Scene: true,
                        Stakeholder: true,
                        Subject: true,
                        Unit: true,
                        Workflow: true,
                        WorkflowStep: true
                    },
                }), SystemObjectPairs);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.SystemObjectAndPairs.fetchMasterFromXref', error);
            return null;
        }
    }
}
