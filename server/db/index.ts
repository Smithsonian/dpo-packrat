/**
 * DB
 *
 * Organize and export db specific bindings here
 */
export * from './api/AccessAction';
export * from './api/AccessContext';
export * from './api/AccessContextObject';
export * from './api/AccessPolicy';
export * from './api/AccessRole';
export * from './api/AccessRoleAccessActionXref';
export * from './api/Actor';
export * from './api/Asset';
export * from './api/AssetGroup';
export * from './api/AssetVersion';
export * from './api/Audit';
export * from './api/CaptureData';
export * from './api/CaptureDataGroup';
export * from './api/CaptureDataFile';
export * from './api/CaptureDataGroupCaptureDataXref';
export * from './api/CaptureDataPhoto';
export * from './api/CookResource';
export * from './api/GeoLocation';
export * from './api/Identifier';
export * from './api/IntermediaryFile';
export * from './api/Item';
export * from './api/Job';
export * from './api/JobRun';
export * from './api/License';
export * from './api/LicenseAssignment';
export * from './api/Metadata';
export * from './api/Model';
export * from './api/ModelMaterial';
export * from './api/ModelMaterialChannel';
export * from './api/ModelMaterialUVMap';
export * from './api/ModelObject';
export * from './api/ModelObjectModelMaterialXref';
export * from './api/ModelProcessingAction';
export * from './api/ModelProcessingActionStep';
export * from './api/ModelSceneXref';
export * from './api/ObjectType';
export * from './api/Project';
export * from './api/ProjectDocumentation';
export * from './api/Scene';
export * from './api/Sentinel';
export * from './api/Stakeholder';
export * from './api/Subject';
export * from './api/SystemObject';
export * from './api/SystemObjectPairs';
export * from './api/SystemObjectVersion';
export * from './api/SystemObjectVersionAssetVersionXref';
export * from './api/SystemObjectXref';
export * from './api/Unit';
export * from './api/UnitEdan';
export * from './api/User';
export * from './api/UserPersonalizationSystemObject';
export * from './api/UserPersonalizationUrl';
export * from './api/Vocabulary';
export * from './api/VocabularySet';
export * from './api/Workflow';
export * from './api/WorkflowReport';
export * from './api/WorkflowSet';
export * from './api/WorkflowStep';
export * from './api/WorkflowStepSystemObjectXref';

export * from './api/composite/LicenseManager';
export * from './api/composite/LicenseResolver';
export * from './api/composite/ModelConstellation';
export * from './api/composite/ObjectAncestors';
export * from './api/composite/ObjectGraph';
export * from './api/composite/ObjectGraphDatabase';
export * from './api/composite/ObjectGraphDataEntry';
export * from './api/composite/SceneConstellation';
export * from './api/composite/SubjectUnitIdentifier';
export * from './api/composite/WorkflowListResult';

/** Shared types and enums */

// minimal representation of a DB object used for reports to identify/list object
export type DBReference = {
    id: number,     // system object id
    name: string,   // name of object
};