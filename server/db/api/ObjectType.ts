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

export type ObjectIDAndType = {
    idObject: number;
    eObjectType: eDBObjectType;
};

export type SystemObjectInfo = {
    idSystemObject: number;
    Retired: boolean;
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

export enum eAuditType {
    eUnknown = 0,
    eDBCreate = 1,
    eDBUpdate = 2,
    eDBDelete = 3,
    eAuthLogin = 4,
}
