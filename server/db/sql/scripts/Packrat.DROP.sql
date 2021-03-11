SET foreign_key_checks = 0;
DROP TABLE IF EXISTS `AccessAction`;
DROP TABLE IF EXISTS `AccessContext`;
DROP TABLE IF EXISTS `AccessContextObject`;
DROP TABLE IF EXISTS `AccessPolicy`;
DROP TABLE IF EXISTS `AccessRole`;
DROP TABLE IF EXISTS `AccessRoleAccessActionXref`;
DROP TABLE IF EXISTS `Actor`;
DROP TABLE IF EXISTS `Asset`;
DROP TABLE IF EXISTS `AssetGroup`;
DROP TABLE IF EXISTS `AssetVersion`;
DROP TABLE IF EXISTS `CaptureData`;
DROP TABLE IF EXISTS `CaptureDataFile`;
DROP TABLE IF EXISTS `CaptureDataGroup`;
DROP TABLE IF EXISTS `CaptureDataGroupCaptureDataXref`;
DROP TABLE IF EXISTS `CaptureDataPhoto`;
DROP TABLE IF EXISTS `GeoLocation`;
DROP TABLE IF EXISTS `Identifier`;
DROP TABLE IF EXISTS `IntermediaryFile`;
DROP TABLE IF EXISTS `Item`;
DROP TABLE IF EXISTS `Job`;
DROP TABLE IF EXISTS `JobTask`;
DROP TABLE IF EXISTS `JobTaskCook`;
DROP TABLE IF EXISTS `License`;
DROP TABLE IF EXISTS `LicenseAssignment`;
DROP TABLE IF EXISTS `Metadata`;
DROP TABLE IF EXISTS `Model`;
DROP TABLE IF EXISTS `ModelMaterial`;
DROP TABLE IF EXISTS `ModelMaterialChannel`;
DROP TABLE IF EXISTS `ModelMaterialUVMap`;
DROP TABLE IF EXISTS `ModelMetrics`;
DROP TABLE IF EXISTS `ModelObject`;
DROP TABLE IF EXISTS `ModelProcessingAction`;
DROP TABLE IF EXISTS `ModelProcessingActionStep`;
DROP TABLE IF EXISTS `ModelSceneXref`;
DROP TABLE IF EXISTS `Project`;
DROP TABLE IF EXISTS `ProjectDocumentation`;
DROP TABLE IF EXISTS `Scene`;
DROP TABLE IF EXISTS `Stakeholder`;
DROP TABLE IF EXISTS `Subject`;
DROP TABLE IF EXISTS `SystemObject`;
DROP TABLE IF EXISTS `SystemObjectVersion`;
DROP TABLE IF EXISTS `SystemObjectXref`;
DROP TABLE IF EXISTS `Unit`;
DROP TABLE IF EXISTS `UnitEdan`;
DROP TABLE IF EXISTS `User`;
DROP TABLE IF EXISTS `UserPersonalizationSystemObject`;
DROP TABLE IF EXISTS `UserPersonalizationUrl`;
DROP TABLE IF EXISTS `Vocabulary`;
DROP TABLE IF EXISTS `VocabularySet`;
DROP TABLE IF EXISTS `Workflow`;
DROP TABLE IF EXISTS `WorkflowStep`;
DROP TABLE IF EXISTS `WorkflowStepSystemObjectXref`;
DROP TABLE IF EXISTS `WorkflowTemplate`;
SET foreign_key_checks = 1;

DROP PROCEDURE IF EXISTS AssetVersionCreate;