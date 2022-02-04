import * as COMMON from '@dpo-packrat/common';

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
    eSentinel = 63,
    eSystemObject = 48,
    eSystemObjectVersion = 49,
    eSystemObjectVersionAssetVersionXref = 60,
    eSystemObjectXref = 50,
    eUnitEdan = 51,
    eUser = 52,
    eUserPersonalizationSystemObject = 53,
    eUserPersonalizationUrl = 54,
    eVocabulary = 55,
    eVocabularySet = 56,
    eWorkflow = 57,
    eWorkflowReport = 61,
    eWorkflowSet = 62,
    eWorkflowStep = 58,
    eWorkflowStepSystemObjectXref = 59,
}

export type eDBObjectType = COMMON.eSystemObjectType | eNonSystemObjectType;

export type ObjectIDAndType = {
    idObject: number;
    eObjectType: eDBObjectType;
};

export type SystemObjectInfo = {
    idSystemObject: number;
    Retired: boolean;
};

export type SystemObjectIDAndType = {
    oID: ObjectIDAndType;
    sID: SystemObjectInfo;
};

export function SystemObjectTypeToName(eObjectType: COMMON.eSystemObjectType | null): string {
    switch (eObjectType) {
        case COMMON.eSystemObjectType.eUnit:                   return 'Unit';
        case COMMON.eSystemObjectType.eProject:                return 'Project';
        case COMMON.eSystemObjectType.eSubject:                return 'Subject';
        case COMMON.eSystemObjectType.eItem:                   return 'Item';
        case COMMON.eSystemObjectType.eCaptureData:            return 'Capture Data';
        case COMMON.eSystemObjectType.eModel:                  return 'Model';
        case COMMON.eSystemObjectType.eScene:                  return 'Scene';
        case COMMON.eSystemObjectType.eIntermediaryFile:       return 'Intermediary File';
        case COMMON.eSystemObjectType.eProjectDocumentation:   return 'Project Documentation';
        case COMMON.eSystemObjectType.eAsset:                  return 'Asset';
        case COMMON.eSystemObjectType.eAssetVersion:           return 'Asset Version';
        case COMMON.eSystemObjectType.eActor:                  return 'Actor';
        case COMMON.eSystemObjectType.eStakeholder:            return 'Stakeholder';
        case COMMON.eSystemObjectType.eUnknown:                return 'Unknown';
        default:                                        return 'Unknown';
    }
}

export function SystemObjectNameToType(objectTypeName: string | null): COMMON.eSystemObjectType {
    switch (objectTypeName) {
        case 'Unit':                    return COMMON.eSystemObjectType.eUnit;
        case 'Project':                 return COMMON.eSystemObjectType.eProject;
        case 'Subject':                 return COMMON.eSystemObjectType.eSubject;
        case 'Item':                    return COMMON.eSystemObjectType.eItem;
        case 'CaptureData':             return COMMON.eSystemObjectType.eCaptureData;
        case 'Capture Data':            return COMMON.eSystemObjectType.eCaptureData;
        case 'Model':                   return COMMON.eSystemObjectType.eModel;
        case 'Scene':                   return COMMON.eSystemObjectType.eScene;
        case 'IntermediaryFile':        return COMMON.eSystemObjectType.eIntermediaryFile;
        case 'Intermediary File':       return COMMON.eSystemObjectType.eIntermediaryFile;
        case 'ProjectDocumentation':    return COMMON.eSystemObjectType.eProjectDocumentation;
        case 'Project Documentation':   return COMMON.eSystemObjectType.eProjectDocumentation;
        case 'Asset':                   return COMMON.eSystemObjectType.eAsset;
        case 'AssetVersion':            return COMMON.eSystemObjectType.eAssetVersion;
        case 'Asset Version':           return COMMON.eSystemObjectType.eAssetVersion;
        case 'Actor':                   return COMMON.eSystemObjectType.eActor;
        case 'Stakeholder':             return COMMON.eSystemObjectType.eStakeholder;

        default:
        case 'Unknown':                 return COMMON.eSystemObjectType.eUnknown;
    }
}

export function DBObjectTypeToName(dbType: eDBObjectType | null): string {
    switch (dbType) {
        case COMMON.eSystemObjectType.eUnit:
        case COMMON.eSystemObjectType.eProject:
        case COMMON.eSystemObjectType.eSubject:
        case COMMON.eSystemObjectType.eItem:
        case COMMON.eSystemObjectType.eCaptureData:
        case COMMON.eSystemObjectType.eModel:
        case COMMON.eSystemObjectType.eScene:
        case COMMON.eSystemObjectType.eIntermediaryFile:
        case COMMON.eSystemObjectType.eProjectDocumentation:
        case COMMON.eSystemObjectType.eAsset:
        case COMMON.eSystemObjectType.eAssetVersion:
        case COMMON.eSystemObjectType.eActor:
        case COMMON.eSystemObjectType.eStakeholder:
        case COMMON.eSystemObjectType.eUnknown:
            return SystemObjectTypeToName(dbType);

        case eNonSystemObjectType.eAccessAction:                        return 'AccessAction';
        case eNonSystemObjectType.eAccessContext:                       return 'AccessContext';
        case eNonSystemObjectType.eAccessContextObject:                 return 'AccessContextObject';
        case eNonSystemObjectType.eAccessPolicy:                        return 'AccessPolicy';
        case eNonSystemObjectType.eAccessRole:                          return 'AccessRole';
        case eNonSystemObjectType.eAccessRoleAccessActionXref:          return 'AccessRoleAccessActionXref';
        case eNonSystemObjectType.eAssetGroup:                          return 'AssetGroup';
        case eNonSystemObjectType.eAudit:                               return 'Audit';
        case eNonSystemObjectType.eCaptureDataFile:                     return 'CaptureDataFile';
        case eNonSystemObjectType.eCaptureDataGroup:                    return 'CaptureDataGroup';
        case eNonSystemObjectType.eCaptureDataGroupCaptureDataXref:     return 'CaptureDataGroupCaptureDataXref';
        case eNonSystemObjectType.eCaptureDataPhoto:                    return 'CaptureDataPhoto';
        case eNonSystemObjectType.eGeoLocation:                         return 'GeoLocation';
        case eNonSystemObjectType.eIdentifier:                          return 'Identifier';
        case eNonSystemObjectType.eJob:                                 return 'Job';
        case eNonSystemObjectType.eJobRun:                              return 'JobRun';
        case eNonSystemObjectType.eLicense:                             return 'License';
        case eNonSystemObjectType.eLicenseAssignment:                   return 'LicenseAssignment';
        case eNonSystemObjectType.eMetadata:                            return 'Metadata';
        case eNonSystemObjectType.eModelMaterial:                       return 'ModelMaterial';
        case eNonSystemObjectType.eModelMaterialChannel:                return 'ModelMaterialChannel';
        case eNonSystemObjectType.eModelMaterialUVMap:                  return 'ModelMaterialUVMap';
        case eNonSystemObjectType.eModelObject:                         return 'ModelObject';
        case eNonSystemObjectType.eModelObjectModelMaterialXref:        return 'ModelObjectModelMaterialXref';
        case eNonSystemObjectType.eModelProcessingAction:               return 'ModelProcessingAction';
        case eNonSystemObjectType.eModelProcessingActionStep:           return 'ModelProessingActionStep';
        case eNonSystemObjectType.eModelSceneXref:                      return 'ModelSceneXref';
        case eNonSystemObjectType.eSentinel:                            return 'Sentinel';
        case eNonSystemObjectType.eSystemObject:                        return 'SystemObject';
        case eNonSystemObjectType.eSystemObjectVersion:                 return 'SystemObjectVersion';
        case eNonSystemObjectType.eSystemObjectVersionAssetVersionXref: return 'SystemObjectVersionAssetVersionXref';
        case eNonSystemObjectType.eSystemObjectXref:                    return 'SystemObjectXref';
        case eNonSystemObjectType.eUnitEdan:                            return 'UnitEdan';
        case eNonSystemObjectType.eUser:                                return 'User';
        case eNonSystemObjectType.eUserPersonalizationSystemObject:     return 'UserPersonalizationSystemObject';
        case eNonSystemObjectType.eUserPersonalizationUrl:              return 'UserPersonalizationUrl';
        case eNonSystemObjectType.eVocabulary:                          return 'Vocabulary';
        case eNonSystemObjectType.eVocabularySet:                       return 'VocabularySet';
        case eNonSystemObjectType.eWorkflow:                            return 'Workflow';
        case eNonSystemObjectType.eWorkflowReport:                      return 'WorkflowReport';
        case eNonSystemObjectType.eWorkflowSet:                         return 'WorkflowSet';
        case eNonSystemObjectType.eWorkflowStep:                        return 'WorkflowStep';
        case eNonSystemObjectType.eWorkflowStepSystemObjectXref:        return 'WorkflowStepSystemObjectXref';

        default: return 'Unknown';
    }
}

export function DBObjectNameToType(objectTypeName: string | null): eDBObjectType {
    const systemObjectType: COMMON.eSystemObjectType = SystemObjectNameToType(objectTypeName);
    if (systemObjectType !== COMMON.eSystemObjectType.eUnknown)
        return systemObjectType;

    switch (objectTypeName) {
        case 'AccessAction': return eNonSystemObjectType.eAccessAction;
        case 'Access Action': return eNonSystemObjectType.eAccessAction;
        case 'AccessContext': return eNonSystemObjectType.eAccessContext;
        case 'Access Context': return eNonSystemObjectType.eAccessContext;
        case 'AccessContextObject': return eNonSystemObjectType.eAccessContextObject;
        case 'Access Context Object': return eNonSystemObjectType.eAccessContextObject;
        case 'AccessPolicy': return eNonSystemObjectType.eAccessPolicy;
        case 'Access Policy': return eNonSystemObjectType.eAccessPolicy;
        case 'AccessRole': return eNonSystemObjectType.eAccessRole;
        case 'Access Role': return eNonSystemObjectType.eAccessRole;
        case 'AccessRoleAccessActionXref': return eNonSystemObjectType.eAccessRoleAccessActionXref;
        case 'Access Role Access Action Xref': return eNonSystemObjectType.eAccessRoleAccessActionXref;
        case 'AssetGroup': return eNonSystemObjectType.eAssetGroup;
        case 'Asset Group': return eNonSystemObjectType.eAssetGroup;
        case 'Audit': return eNonSystemObjectType.eAudit;
        case 'CaptureDataFile': return eNonSystemObjectType.eCaptureDataFile;
        case 'Capture Data File': return eNonSystemObjectType.eCaptureDataFile;
        case 'CaptureDataGroup': return eNonSystemObjectType.eCaptureDataGroup;
        case 'Capture Data Group': return eNonSystemObjectType.eCaptureDataGroup;
        case 'CaptureDataGroupCaptureDataXref': return eNonSystemObjectType.eCaptureDataGroupCaptureDataXref;
        case 'Capture Data Group Capture Data Xref': return eNonSystemObjectType.eCaptureDataGroupCaptureDataXref;
        case 'CaptureDataPhoto': return eNonSystemObjectType.eCaptureDataPhoto;
        case 'Capture Data Photo': return eNonSystemObjectType.eCaptureDataPhoto;
        case 'GeoLocation': return eNonSystemObjectType.eGeoLocation;
        case 'Identifier': return eNonSystemObjectType.eIdentifier;
        case 'Job': return eNonSystemObjectType.eJob;
        case 'JobRun': return eNonSystemObjectType.eJobRun;
        case 'Job Run': return eNonSystemObjectType.eJobRun;
        case 'License': return eNonSystemObjectType.eLicense;
        case 'LicenseAssignment': return eNonSystemObjectType.eLicenseAssignment;
        case 'License Assignment': return eNonSystemObjectType.eLicenseAssignment;
        case 'Metadata': return eNonSystemObjectType.eMetadata;
        case 'ModelMaterial': return eNonSystemObjectType.eModelMaterial;
        case 'Model Material': return eNonSystemObjectType.eModelMaterial;
        case 'ModelMaterialChannel': return eNonSystemObjectType.eModelMaterialChannel;
        case 'Model Material Channel': return eNonSystemObjectType.eModelMaterialChannel;
        case 'ModelMaterialUVMap': return eNonSystemObjectType.eModelMaterialUVMap;
        case 'Model Material UV Map': return eNonSystemObjectType.eModelMaterialUVMap;
        case 'ModelObject': return eNonSystemObjectType.eModelObject;
        case 'Model Object': return eNonSystemObjectType.eModelObject;
        case 'ModelObjectModelMaterialXref': return eNonSystemObjectType.eModelObjectModelMaterialXref;
        case 'Model Object Model Material Xref': return eNonSystemObjectType.eModelObjectModelMaterialXref;
        case 'ModelProcessingAction': return eNonSystemObjectType.eModelProcessingAction;
        case 'Model Processing Action': return eNonSystemObjectType.eModelProcessingAction;
        case 'ModelProessingActionStep': return eNonSystemObjectType.eModelProcessingActionStep;
        case 'Model Proessing Action Step': return eNonSystemObjectType.eModelProcessingActionStep;
        case 'ModelSceneXref': return eNonSystemObjectType.eModelSceneXref;
        case 'Model Scene Xref': return eNonSystemObjectType.eModelSceneXref;
        case 'Sentinel': return eNonSystemObjectType.eSentinel;
        case 'SystemObject': return eNonSystemObjectType.eSystemObject;
        case 'System Object': return eNonSystemObjectType.eSystemObject;
        case 'SystemObjectVersion': return eNonSystemObjectType.eSystemObjectVersion;
        case 'System Object Version': return eNonSystemObjectType.eSystemObjectVersion;
        case 'SystemObjectXref': return eNonSystemObjectType.eSystemObjectXref;
        case 'System Object Xref': return eNonSystemObjectType.eSystemObjectXref;
        case 'SystemObjectVersionAssetVersionXref': return eNonSystemObjectType.eSystemObjectVersionAssetVersionXref;
        case 'System Object Version Asset Version Xref': return eNonSystemObjectType.eSystemObjectVersionAssetVersionXref;
        case 'UnitEdan': return eNonSystemObjectType.eUnitEdan;
        case 'Unit Edan': return eNonSystemObjectType.eUnitEdan;
        case 'User': return eNonSystemObjectType.eUser;
        case 'UserPersonalizationSystemObject': return eNonSystemObjectType.eUserPersonalizationSystemObject;
        case 'User Personalization System Object': return eNonSystemObjectType.eUserPersonalizationSystemObject;
        case 'UserPersonalizationUrl': return eNonSystemObjectType.eUserPersonalizationUrl;
        case 'User Personalization Url': return eNonSystemObjectType.eUserPersonalizationUrl;
        case 'Vocabulary': return eNonSystemObjectType.eVocabulary;
        case 'VocabularySet': return eNonSystemObjectType.eVocabularySet;
        case 'Vocabulary Set': return eNonSystemObjectType.eVocabularySet;
        case 'Workflow': return eNonSystemObjectType.eWorkflow;
        case 'WorkflowReport': return eNonSystemObjectType.eWorkflowReport;
        case 'Workflow Report': return eNonSystemObjectType.eWorkflowReport;
        case 'WorkflowSet': return eNonSystemObjectType.eWorkflowSet;
        case 'Workflow Set': return eNonSystemObjectType.eWorkflowSet;
        case 'WorkflowStep': return eNonSystemObjectType.eWorkflowStep;
        case 'Workflow Step': return eNonSystemObjectType.eWorkflowStep;
        case 'WorkflowStepSystemObjectXref': return eNonSystemObjectType.eWorkflowStepSystemObjectXref;
        case 'Workflow Step System Object Xref': return eNonSystemObjectType.eWorkflowStepSystemObjectXref;

        default:
        case 'Unknown': return eNonSystemObjectType.eUnknown;
    }
}

export enum eAuditType {
    eUnknown = 0,
    eDBCreate = 1,
    eDBUpdate = 2,
    eDBDelete = 3,
    eAuthLogin = 4,
    eSceneQCd = 5,
    eHTTPDownload = 6,
    eHTTPUpload = 7,
    eAuthFailed = 8,
}

export function LicenseRestrictLevelToPublishedStateEnum(restrictLevel: number): COMMON.ePublishedState {
    if (restrictLevel <= 10)
        return COMMON.ePublishedState.ePublished;
    if (restrictLevel <= 20)
        return COMMON.ePublishedState.ePublished;
    if (restrictLevel <= 30)
        return COMMON.ePublishedState.ePublished;
    return COMMON.ePublishedState.eNotPublished;
}

// Keep this in sync with SQL in WorkflowListResult.search()
export function convertWorkflowJobRunStatusEnumToString(eStatus: COMMON.eWorkflowJobRunStatus): string {
    switch (eStatus) {
        default: return 'Uninitialized';
        case COMMON.eWorkflowJobRunStatus.eUnitialized: return 'Uninitialized';
        case COMMON.eWorkflowJobRunStatus.eCreated: return 'Created';
        case COMMON.eWorkflowJobRunStatus.eRunning: return 'Running';
        case COMMON.eWorkflowJobRunStatus.eWaiting: return 'Waiting';
        case COMMON.eWorkflowJobRunStatus.eDone: return 'Done';
        case COMMON.eWorkflowJobRunStatus.eError: return 'Error';
        case COMMON.eWorkflowJobRunStatus.eCancelled: return 'Cancelled';
    }
}

export function convertWorkflowJobRunStatusToEnum(Status: number): COMMON.eWorkflowJobRunStatus {
    switch (Status) {
        default:    return COMMON.eWorkflowJobRunStatus.eUnitialized;
        case 0:     return COMMON.eWorkflowJobRunStatus.eUnitialized;
        case 1:     return COMMON.eWorkflowJobRunStatus.eCreated;
        case 2:     return COMMON.eWorkflowJobRunStatus.eRunning;
        case 3:     return COMMON.eWorkflowJobRunStatus.eWaiting;
        case 4:     return COMMON.eWorkflowJobRunStatus.eDone;
        case 5:     return COMMON.eWorkflowJobRunStatus.eError;
        case 6:     return COMMON.eWorkflowJobRunStatus.eCancelled;
    }
}

