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

export type eDBObjectType = eSystemObjectType | eNonSystemObjectType;

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
        case 'CaptureData':             return eSystemObjectType.eCaptureData;
        case 'Capture Data':            return eSystemObjectType.eCaptureData;
        case 'Model':                   return eSystemObjectType.eModel;
        case 'Scene':                   return eSystemObjectType.eScene;
        case 'IntermediaryFile':        return eSystemObjectType.eIntermediaryFile;
        case 'Intermediary File':       return eSystemObjectType.eIntermediaryFile;
        case 'ProjectDocumentation':    return eSystemObjectType.eProjectDocumentation;
        case 'Project Documentation':   return eSystemObjectType.eProjectDocumentation;
        case 'Asset':                   return eSystemObjectType.eAsset;
        case 'AssetVersion':            return eSystemObjectType.eAssetVersion;
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
    const systemObjectType: eSystemObjectType = SystemObjectNameToType(objectTypeName);
    if (systemObjectType !== eSystemObjectType.eUnknown)
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
    eSceneQCd = 5
}

export enum ePublishedState {
    eNotPublished = 0,              // 'Not Published', default
    eRestricted = 1,                // 'Restricted',
    eViewOnly = 2,                  // 'View Only',
    eViewDownloadRestriction = 3,   // 'View and Download with usage restrictions',
    eViewDownloadCC0 = 4,           // 'View and Download CC0'
}

export function PublishedStateEnumToString(eState: ePublishedState): string {
    switch (eState) {
        case ePublishedState.eRestricted:               return 'Restricted';
        case ePublishedState.eViewOnly:                 return 'View Only';
        case ePublishedState.eViewDownloadRestriction:  return 'View and Download with usage restrictions';
        case ePublishedState.eViewDownloadCC0:          return 'View and Download CC0';
        default:
        case ePublishedState.eNotPublished:             return 'Not Published';
    }
}

// Keep this in sync with SQL in WorkflowListResult.search()
export enum eWorkflowJobRunStatus {
    eUnitialized = 0,
    eCreated = 1,
    eRunning = 2,
    eWaiting = 3,
    eDone = 4,
    eError = 5,
    eCancelled = 6,
}

// Keep this in sync with SQL in WorkflowListResult.search()
export function convertWorkflowJobRunStatusEnumToString(eStatus: eWorkflowJobRunStatus): string {
    switch (eStatus) {
        default: return 'Uninitialized';
        case eWorkflowJobRunStatus.eUnitialized: return 'Uninitialized';
        case eWorkflowJobRunStatus.eCreated: return 'Created';
        case eWorkflowJobRunStatus.eRunning: return 'Running';
        case eWorkflowJobRunStatus.eWaiting: return 'Waiting';
        case eWorkflowJobRunStatus.eDone: return 'Done';
        case eWorkflowJobRunStatus.eError: return 'Error';
        case eWorkflowJobRunStatus.eCancelled: return 'Cancelled';
    }
}

export function convertWorkflowJobRunStatusToEnum(Status: number): eWorkflowJobRunStatus {
    switch (Status) {
        default:    return eWorkflowJobRunStatus.eUnitialized;
        case 0:     return eWorkflowJobRunStatus.eUnitialized;
        case 1:     return eWorkflowJobRunStatus.eCreated;
        case 2:     return eWorkflowJobRunStatus.eRunning;
        case 3:     return eWorkflowJobRunStatus.eWaiting;
        case 4:     return eWorkflowJobRunStatus.eDone;
        case 5:     return eWorkflowJobRunStatus.eError;
        case 6:     return eWorkflowJobRunStatus.eCancelled;
    }
}

