/* eslint-disable camelcase */
import * as P from '@prisma/client';
import { Actor, Asset, AssetVersion, CaptureData, IntermediaryFile, Item, Model,
    Project, ProjectDocumentation, Scene, Stakeholder, SystemObject, Subject, Unit } from '..';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

type SystemObjectPairsBase = P.SystemObject
& { Actor: P.Actor | null}
& { Asset_AssetToSystemObject_idAsset: P.Asset | null}
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
& { Unit: P.Unit | null};

type SystemObjectActorBase = P.SystemObject & { Actor: P.Actor | null};
type SystemObjectAssetBase = P.SystemObject & { Asset_AssetToSystemObject_idAsset: P.Asset | null};
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
                await DBC.DBConnection.prisma.systemObject.findUnique({ where: { idActor, }, include: { Actor: true, }, });
            return SOPair ? new SystemObjectActor(SOPair) : null;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.SystemObjectActor.fetch', LOG.LS.eDB, error);
            return null;
        }
    }
}

export class SystemObjectAsset extends SystemObject implements SystemObjectAssetBase {
    Asset_AssetToSystemObject_idAsset: Asset | null; // wacky name produced by prisma
    get Asset(): Asset | null {
        return this.Asset_AssetToSystemObject_idAsset;
    }
    set Asset(value: Asset | null) {
        this.Asset_AssetToSystemObject_idAsset = value;
    }

    constructor(input: SystemObjectAssetBase) {
        super(input);
        this.Asset_AssetToSystemObject_idAsset = (input.Asset_AssetToSystemObject_idAsset)
            ? new Asset(input.Asset_AssetToSystemObject_idAsset) : /* istanbul ignore next */ null;
    }

    static async fetch(idAsset: number): Promise<SystemObjectAsset | null> {
        if (!idAsset)
            return null;
        try {
            const SOPair: SystemObjectAssetBase | null =
                await DBC.DBConnection.prisma.systemObject.findUnique({ where: { idAsset, }, include: { Asset_AssetToSystemObject_idAsset: true, }, });
            return SOPair ? new SystemObjectAsset(SOPair) : null;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.SystemObjectAsset.fetch', LOG.LS.eDB, error);
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
                await DBC.DBConnection.prisma.systemObject.findUnique({ where: { idAssetVersion, }, include: { AssetVersion: true, }, });
            return SOPair ? new SystemObjectAssetVersion(SOPair) : null;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.SystemObjectAssetVersion.fetch', LOG.LS.eDB, error);
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
                await DBC.DBConnection.prisma.systemObject.findUnique({ where: { idCaptureData, }, include: { CaptureData: true, }, });
            return SOPair ? new SystemObjectCaptureData(SOPair) : null;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.SystemObjectCaptureData.fetch', LOG.LS.eDB, error);
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
                await DBC.DBConnection.prisma.systemObject.findUnique({ where: { idIntermediaryFile, }, include: { IntermediaryFile: true, }, });
            return SOPair ? new SystemObjectIntermediaryFile(SOPair) : null;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.SystemObjectIntermediaryFile.fetch', LOG.LS.eDB, error);
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
                await DBC.DBConnection.prisma.systemObject.findUnique({ where: { idItem, }, include: { Item: true, }, });
            return SOPair ? new SystemObjectItem(SOPair) : null;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.SystemObjectItem.fetch', LOG.LS.eDB, error);
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
                await DBC.DBConnection.prisma.systemObject.findUnique({ where: { idModel, }, include: { Model: true, }, });
            return SOPair ? new SystemObjectModel(SOPair) : null;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.SystemObjectModel.fetch', LOG.LS.eDB, error);
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
                await DBC.DBConnection.prisma.systemObject.findUnique({ where: { idProject, }, include: { Project: true, }, });
            return SOPair ? new SystemObjectProject(SOPair) : null;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.SystemObjectProject.fetch', LOG.LS.eDB, error);
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
                await DBC.DBConnection.prisma.systemObject.findUnique({ where: { idProjectDocumentation, }, include: { ProjectDocumentation: true, }, });
            return SOPair ? new SystemObjectProjectDocumentation(SOPair) : null;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.SystemObjectProjectDocumentation.fetch', LOG.LS.eDB, error);
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
                await DBC.DBConnection.prisma.systemObject.findUnique({ where: { idScene, }, include: { Scene: true, }, });
            return SOPair ? new SystemObjectScene(SOPair) : null;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.SystemObjectScene.fetch', LOG.LS.eDB, error);
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
                await DBC.DBConnection.prisma.systemObject.findUnique({ where: { idStakeholder, }, include: { Stakeholder: true, }, });
            return SOPair ? new SystemObjectStakeholder(SOPair) : null;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.SystemObjectStakeholder.fetch', LOG.LS.eDB, error);
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
                await DBC.DBConnection.prisma.systemObject.findUnique({ where: { idSubject, }, include: { Subject: true, }, });
            return SOPair ? new SystemObjectSubject(SOPair) : null;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.SystemObjectSubject.fetch', LOG.LS.eDB, error);
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
                await DBC.DBConnection.prisma.systemObject.findUnique({ where: { idUnit, }, include: { Unit: true, }, });
            return SOPair ? new SystemObjectUnit(SOPair) : null;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.SystemObjectUnit.fetch', LOG.LS.eDB, error);
            return null;
        }
    }
}

export enum eSystemObjectType {
    eUnknown = 0,
    eUnit = 1,
    eProject = 2,
    eSubject = 3,
    eItem = 4,
    eCaptureData = 5,
    eModel = 6,
    eScene = 7,
    eIntermediaryFile = 8,
    eProjectDocumentation = 9,
    eAsset = 10,
    eAssetVersion = 11,
    eActor = 12,
    eStakeholder = 13,
}

export enum eNonSystemObjectType {
    eUnknown = 0,
    eAccessAction = 21,
    eAccessContext = 22,
    eAccessContextObject = 23,
    eAccessPolicy = 24,
    eAccessRole = 25,
    eAccessRoleAccessActionXref = 26,
    eAssetGroup = 27,
    eAudit = 28,
    eCaptureDataFile = 29,
    eCaptureDataGroup = 30,
    eCaptureDataGroupCaptureDataXref = 31,
    eCaptureDataPhoto = 32,
    eGeoLocation = 33,
    eIdentifier= 34,
    eJob = 35,
    eJobRun = 36,
    eLicense = 37,
    eLicenseAssignment = 38,
    eMetadata = 39,
    eModelMaterial = 40,
    eModelMaterialChannel = 41,
    eModelMaterialUVMap = 42,
    eModelObject = 43,
    eModelObjectModelMaterialXref = 44,
    eModelProcessingAction = 45,
    eModelProcessingActionStep = 46,
    eModelSceneXref = 47,
    eSystemObject = 48,
    eSystemObjectVersion = 49,
    eSystemObjectXref = 50,
    eUnitEdan = 51,
    eUser = 52,
    eUserPersonalizationSystemObject = 53,
    eUserPersonalizationUrl = 54,
    eVocabulary = 55,
    eVocabularySet = 56,
    eWorkflow = 57,
    eWorkflowStep = 58,
    eWorkflowStepSystemObjectXref = 59,
}

export type eDBObjectType = eSystemObjectType | eNonSystemObjectType;

export function SystemObjectTypeToName(eObjectType: eSystemObjectType | null): string {
    switch (eObjectType) {
        case eSystemObjectType.eUnit:                   return 'Unit';
        case eSystemObjectType.eProject:                return 'Project';
        case eSystemObjectType.eSubject:                return 'Subject';
        case eSystemObjectType.eItem:                   return 'Item';
        case eSystemObjectType.eCaptureData:            return 'Capture Data';
        case eSystemObjectType.eModel:                  return 'Model';
        case eSystemObjectType.eScene:                  return 'Scene';
        case eSystemObjectType.eIntermediaryFile:       return 'Intermediary File';
        case eSystemObjectType.eProjectDocumentation:   return 'Project Documentation';
        case eSystemObjectType.eAsset:                  return 'Asset';
        case eSystemObjectType.eAssetVersion:           return 'Asset Version';
        case eSystemObjectType.eActor:                  return 'Actor';
        case eSystemObjectType.eStakeholder:            return 'Stakeholder';
        case eSystemObjectType.eUnknown:                return 'Unknown';
        default:                                        return 'Unknown';
    }
}

export function SystemObjectNameToType(objectTypeName: string | null): eSystemObjectType {
    switch (objectTypeName) {
        case 'Unit':                    return eSystemObjectType.eUnit;
        case 'Project':                 return eSystemObjectType.eProject;
        case 'Subject':                 return eSystemObjectType.eSubject;
        case 'Item':                    return eSystemObjectType.eItem;
        case 'Capture Data':            return eSystemObjectType.eCaptureData;
        case 'Model':                   return eSystemObjectType.eModel;
        case 'Scene':                   return eSystemObjectType.eScene;
        case 'Intermediary File':       return eSystemObjectType.eIntermediaryFile;
        case 'Project Documentation':   return eSystemObjectType.eProjectDocumentation;
        case 'Asset':                   return eSystemObjectType.eAsset;
        case 'Asset Version':           return eSystemObjectType.eAssetVersion;
        case 'Actor':                   return eSystemObjectType.eActor;
        case 'Stakeholder':             return eSystemObjectType.eStakeholder;

        default:
        case 'Unknown':                 return eSystemObjectType.eUnknown;
    }
}

export function DBObjectTypeToName(dbType: eDBObjectType | null): string {
    switch (dbType) {
        case eSystemObjectType.eUnit:
        case eSystemObjectType.eProject:
        case eSystemObjectType.eSubject:
        case eSystemObjectType.eItem:
        case eSystemObjectType.eCaptureData:
        case eSystemObjectType.eModel:
        case eSystemObjectType.eScene:
        case eSystemObjectType.eIntermediaryFile:
        case eSystemObjectType.eProjectDocumentation:
        case eSystemObjectType.eAsset:
        case eSystemObjectType.eAssetVersion:
        case eSystemObjectType.eActor:
        case eSystemObjectType.eStakeholder:
        case eSystemObjectType.eUnknown:
            return SystemObjectTypeToName(dbType);

        case eNonSystemObjectType.eAccessAction:                    return 'Access Action';
        case eNonSystemObjectType.eAccessContext:                   return 'Access Context';
        case eNonSystemObjectType.eAccessContextObject:             return 'Access Context Object';
        case eNonSystemObjectType.eAccessPolicy:                    return 'Access Policy';
        case eNonSystemObjectType.eAccessRole:                      return 'Access Role';
        case eNonSystemObjectType.eAccessRoleAccessActionXref:      return 'Access Role Access Action Xref';
        case eNonSystemObjectType.eAssetGroup:                      return 'Asset Group';
        case eNonSystemObjectType.eAudit:                           return 'Audit';
        case eNonSystemObjectType.eCaptureDataFile:                 return 'Capture Data File';
        case eNonSystemObjectType.eCaptureDataGroup:                return 'Capture Data Group';
        case eNonSystemObjectType.eCaptureDataGroupCaptureDataXref: return 'Capture Data Group Capture Data Xref';
        case eNonSystemObjectType.eCaptureDataPhoto:                return 'Capture Data Photo';
        case eNonSystemObjectType.eGeoLocation:                     return 'GeoLocation';
        case eNonSystemObjectType.eIdentifier:                      return 'Identifier';
        case eNonSystemObjectType.eJob:                             return 'Job';
        case eNonSystemObjectType.eJobRun:                          return 'Job Run';
        case eNonSystemObjectType.eLicense:                         return 'License';
        case eNonSystemObjectType.eLicenseAssignment:               return 'License Assignment';
        case eNonSystemObjectType.eMetadata:                        return 'Metadata';
        case eNonSystemObjectType.eModelMaterial:                   return 'Model Material';
        case eNonSystemObjectType.eModelMaterialChannel:            return 'Model Material Channel';
        case eNonSystemObjectType.eModelMaterialUVMap:              return 'Model Material UV Map';
        case eNonSystemObjectType.eModelObject:                     return 'Model Object';
        case eNonSystemObjectType.eModelObjectModelMaterialXref:    return 'Model Object Model Material Xref';
        case eNonSystemObjectType.eModelProcessingAction:           return 'Model Processing Action';
        case eNonSystemObjectType.eModelProcessingActionStep:       return 'Model Proessing Action Step';
        case eNonSystemObjectType.eModelSceneXref:                  return 'Model Scene Xref';
        case eNonSystemObjectType.eSystemObject:                    return 'System Object';
        case eNonSystemObjectType.eSystemObjectVersion:             return 'System Object Version';
        case eNonSystemObjectType.eSystemObjectXref:                return 'System Object Xref';
        case eNonSystemObjectType.eUnitEdan:                        return 'Unit Edan';
        case eNonSystemObjectType.eUser:                            return 'User';
        case eNonSystemObjectType.eUserPersonalizationSystemObject: return 'User Personalization System Object';
        case eNonSystemObjectType.eUserPersonalizationUrl:          return 'User Personalization Url';
        case eNonSystemObjectType.eVocabulary:                      return 'Vocabulary';
        case eNonSystemObjectType.eVocabularySet:                   return 'Vocabulary Set';
        case eNonSystemObjectType.eWorkflow:                        return 'Workflow';
        case eNonSystemObjectType.eWorkflowStep:                    return 'Workflow Step';
        case eNonSystemObjectType.eWorkflowStepSystemObjectXref:    return 'Workflow Step System Object Xref';

        default: return 'Unknown';
    }
}

export function DBObjectNameToType(objectTypeName: string | null): eDBObjectType {
    const systemObjectType: eSystemObjectType = SystemObjectNameToType(objectTypeName);
    if (systemObjectType !== eSystemObjectType.eUnknown)
        return systemObjectType;

    switch (objectTypeName) {
        case 'Access Action': return eNonSystemObjectType.eAccessAction;
        case 'Access Context': return eNonSystemObjectType.eAccessContext;
        case 'Access Context Object': return eNonSystemObjectType.eAccessContextObject;
        case 'Access Policy': return eNonSystemObjectType.eAccessPolicy;
        case 'Access Role': return eNonSystemObjectType.eAccessRole;
        case 'Access Role Access Action Xref': return eNonSystemObjectType.eAccessRoleAccessActionXref;
        case 'Asset Group': return eNonSystemObjectType.eAssetGroup;
        case 'Audit': return eNonSystemObjectType.eAudit;
        case 'Capture Data File': return eNonSystemObjectType.eCaptureDataFile;
        case 'Capture Data Group': return eNonSystemObjectType.eCaptureDataGroup;
        case 'Capture Data Group Capture Data Xref': return eNonSystemObjectType.eCaptureDataGroupCaptureDataXref;
        case 'Capture Data Photo': return eNonSystemObjectType.eCaptureDataPhoto;
        case 'GeoLocation': return eNonSystemObjectType.eGeoLocation;
        case 'Identifier': return eNonSystemObjectType.eIdentifier;
        case 'Job': return eNonSystemObjectType.eJob;
        case 'Job Run': return eNonSystemObjectType.eJobRun;
        case 'License': return eNonSystemObjectType.eLicense;
        case 'License Assignment': return eNonSystemObjectType.eLicenseAssignment;
        case 'Metadata': return eNonSystemObjectType.eMetadata;
        case 'Model Material': return eNonSystemObjectType.eModelMaterial;
        case 'Model Material Channel': return eNonSystemObjectType.eModelMaterialChannel;
        case 'Model Material UV Map': return eNonSystemObjectType.eModelMaterialUVMap;
        case 'Model Object': return eNonSystemObjectType.eModelObject;
        case 'Model Object Model Material Xref': return eNonSystemObjectType.eModelObjectModelMaterialXref;
        case 'Model Processing Action': return eNonSystemObjectType.eModelProcessingAction;
        case 'Model Proessing Action Step': return eNonSystemObjectType.eModelProcessingActionStep;
        case 'Model Scene Xref': return eNonSystemObjectType.eModelSceneXref;
        case 'System Object': return eNonSystemObjectType.eSystemObject;
        case 'System Object Version': return eNonSystemObjectType.eSystemObjectVersion;
        case 'System Object Xref': return eNonSystemObjectType.eSystemObjectXref;
        case 'Unit Edan': return eNonSystemObjectType.eUnitEdan;
        case 'User': return eNonSystemObjectType.eUser;
        case 'User Personalization System Object': return eNonSystemObjectType.eUserPersonalizationSystemObject;
        case 'User Personalization Url': return eNonSystemObjectType.eUserPersonalizationUrl;
        case 'Vocabulary': return eNonSystemObjectType.eVocabulary;
        case 'Vocabulary Set': return eNonSystemObjectType.eVocabularySet;
        case 'Workflow': return eNonSystemObjectType.eWorkflow;
        case 'Workflow Step': return eNonSystemObjectType.eWorkflowStep;
        case 'Workflow Step System Object Xref': return eNonSystemObjectType.eWorkflowStepSystemObjectXref;

        default:
        case 'Unknown':                 return eNonSystemObjectType.eUnknown;
    }
}

export class SystemObjectPairs extends SystemObject implements SystemObjectPairsBase {
    Actor: Actor | null = null;
    Asset_AssetToSystemObject_idAsset: Asset | null = null;
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

    get Asset(): Asset | null {
        return this.Asset_AssetToSystemObject_idAsset;
    }
    set Asset(value: Asset | null) {
        this.Asset_AssetToSystemObject_idAsset = value;
    }

    constructor(input: SystemObjectPairsBase) {
        super(input);
        if (input.Actor) this.Actor = new Actor(input.Actor);
        if (input.Asset_AssetToSystemObject_idAsset) this.Asset_AssetToSystemObject_idAsset = new Asset(input.Asset_AssetToSystemObject_idAsset);
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
    }

    static async fetch(idSystemObject: number): Promise<SystemObjectPairs | null> {
        if (!idSystemObject)
            return null;
        try {
            const SOAPB: SystemObjectPairsBase | null =
                await DBC.DBConnection.prisma.systemObject.findUnique({
                    where: { idSystemObject, },
                    include: {
                        Actor: true,
                        Asset_AssetToSystemObject_idAsset: true,
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
                        Unit: true
                    },
                });
            return (SOAPB ? new SystemObjectPairs(SOAPB) : null);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.SystemObjectAndPairs.fetch', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchDerivedFromXref(idSystemObjectMaster: number): Promise<SystemObjectPairs[] | null> {
        if (!idSystemObjectMaster)
            return null;
        try {
            return DBC.CopyArray<SystemObjectPairsBase, SystemObjectPairs>(
                await DBC.DBConnection.prisma.systemObject.findMany({
                    where: {
                        SystemObjectXref_SystemObjectToSystemObjectXref_idSystemObjectDerived: {
                            some: { idSystemObjectMaster },
                        },
                    },
                    include: {
                        Actor: true,
                        Asset_AssetToSystemObject_idAsset: true,
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
                        Unit: true
                    },
                }), SystemObjectPairs);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.SystemObjectAndPairs.fetchDerivedFromXref', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchMasterFromXref(idSystemObjectDerived: number): Promise<SystemObjectPairs[] | null> {
        if (!idSystemObjectDerived)
            return null;
        try {
            return DBC.CopyArray<SystemObjectPairsBase, SystemObjectPairs>(
                await DBC.DBConnection.prisma.systemObject.findMany({
                    where: {
                        SystemObjectXref_SystemObjectToSystemObjectXref_idSystemObjectMaster: {
                            some: { idSystemObjectDerived },
                        },
                    },
                    include: {
                        Actor: true,
                        Asset_AssetToSystemObject_idAsset: true,
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
                        Unit: true
                    },
                }), SystemObjectPairs);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.SystemObjectAndPairs.fetchMasterFromXref', LOG.LS.eDB, error);
            return null;
        }
    }
}
