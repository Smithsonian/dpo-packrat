CREATE DATABASE IF NOT EXISTS `packrat` /*!40100 DEFAULT CHARACTER SET utf8 */;
USE `packrat`;

CREATE TABLE IF NOT EXISTS `accessaction` (
  `idAccessAction` int(11) NOT NULL AUTO_INCREMENT,
  `Name` varchar(255) NOT NULL,
  `SortOrder` int(11) NOT NULL,
  PRIMARY KEY (`idAccessAction`),
  KEY `AccessAction_SortOrder` (`SortOrder`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `accesscontext` (
  `idAccessContext` int(11) NOT NULL AUTO_INCREMENT,
  `Global` bit(1) NOT NULL,
  `Authoritative` bit(1) NOT NULL,
  `CaptureData` bit(1) NOT NULL,
  `Model` bit(1) NOT NULL,
  `Scene` bit(1) NOT NULL,
  `IntermediaryFile` bit(1) NOT NULL,
  PRIMARY KEY (`idAccessContext`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `accesscontextobject` (
  `idAccessContextObject` int(11) NOT NULL AUTO_INCREMENT,
  `idAccessContext` int(11) NOT NULL,
  `idSystemObject` int(11) NOT NULL,
  PRIMARY KEY (`idAccessContextObject`),
  KEY `AccessContextObject_idAccessContext` (`idAccessContext`),
  KEY `AccessContextObject_idSystemObject` (`idSystemObject`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `accesspolicy` (
  `idAccessPolicy` int(11) NOT NULL AUTO_INCREMENT,
  `idUser` int(11) NOT NULL,
  `idAccessRole` int(11) NOT NULL,
  `idAccessContext` int(11) NOT NULL,
  PRIMARY KEY (`idAccessPolicy`),
  KEY `AccessPolicy_idUser` (`idUser`),
  KEY `AccessPolicy_idAccessContext` (`idAccessContext`),
  KEY `AccessPolicy_idAccessRole` (`idAccessRole`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `accessrole` (
  `idAccessRole` int(11) NOT NULL AUTO_INCREMENT,
  `Name` varchar(255) NOT NULL,
  PRIMARY KEY (`idAccessRole`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `accessroleaccessactionxref` (
  `idAccessRoleAccessActionXref` int(11) NOT NULL AUTO_INCREMENT,
  `idAccessRole` int(11) NOT NULL,
  `idAccessAction` int(11) NOT NULL,
  PRIMARY KEY (`idAccessRoleAccessActionXref`),
  KEY `AccessRoleAccessActionXref_idAccessRole` (`idAccessRole`),
  KEY `AccessRoleAccessActionXref_idAccessAction` (`idAccessAction`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `actor` (
  `idActor` int(11) NOT NULL AUTO_INCREMENT,
  `IndividualName` varchar(255) DEFAULT NULL,
  `OrganizationName` varchar(255) DEFAULT NULL,
  `idUnit` int(11) DEFAULT NULL,
  PRIMARY KEY (`idActor`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `asset` (
  `idAsset` int(11) NOT NULL AUTO_INCREMENT,
  `FileName` varchar(512) NOT NULL,
  `FilePath` varchar(512) NOT NULL,
  `idAssetGroup` int(11) DEFAULT NULL,
  `idSystemObject` int(11) DEFAULT NULL,
  PRIMARY KEY (`idAsset`),
  KEY `Asset_idAssetGroup` (`idAssetGroup`),
  KEY `Asset_idSystemObject` (`idSystemObject`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `assetgroup` (
  `idAssetGroup` int(11) NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`idAssetGroup`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `assetversion` (
  `idAssetVersion` int(11) NOT NULL AUTO_INCREMENT,
  `idAsset` int(11) NOT NULL,
  `idUserCreator` int(11) NOT NULL,
  `CreationDate` datetime NOT NULL,
  `StorageLocation` varchar(512) NOT NULL,
  `StorageChecksum` varchar(32) NOT NULL,
  `StorageSize` bigint(20) NOT NULL DEFAULT 0,
  PRIMARY KEY (`idAssetVersion`),
  KEY `AssetVersion_idAsset_CreationDate` (`idAsset`,`CreationDate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `capturedata` (
  `idCaptureData` int(11) NOT NULL AUTO_INCREMENT,
  `idVCaptureMethod` int(11) NOT NULL,
  `idVCaptureDatasetType` int(11) NOT NULL,
  `CaptureDate` datetime NOT NULL,
  `Description` varchar(8000) NOT NULL,
  `CaptureDatasetFieldID` int(11) DEFAULT NULL,
  `idVItemPositionType` int(11) DEFAULT NULL,
  `ItemPositionFieldID` int(11) DEFAULT NULL,
  `ItemArrangementFieldID` int(11) DEFAULT NULL,
  `idVFocusType` int(11) DEFAULT NULL,
  `idVLightSourceType` int(11) DEFAULT NULL,
  `idVBackgroundRemovalMethod` int(11) DEFAULT NULL,
  `idVClusterType` int(11) DEFAULT NULL,
  `ClusterGeometryFieldID` int(11) DEFAULT NULL,
  `CameraSettingsUniform` bit(1) DEFAULT NULL,
  `idAssetThumbnail` int(11) DEFAULT NULL,
  PRIMARY KEY (`idCaptureData`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `capturedatafile` (
  `idCaptureDataFile` int(11) NOT NULL AUTO_INCREMENT,
  `idCaptureData` int(11) NOT NULL,
  `idAsset` int(11) NOT NULL,
  `idVVariantType` int(11) NOT NULL,
  `CompressedMultipleFiles` bit(1) NOT NULL,
  PRIMARY KEY (`idCaptureDataFile`),
  KEY `CaptureDataFile_idCaptureData` (`idCaptureData`),
  KEY `CaptureDataFile_idAsset` (`idAsset`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `capturedatagroup` (
  `idCaptureDataGroup` int(11) NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`idCaptureDataGroup`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `capturedatagroupcapturedataxref` (
  `idCaptureDataGroupCaptureDataXref` int(11) NOT NULL AUTO_INCREMENT,
  `idCaptureDataGroup` int(11) NOT NULL,
  `idCaptureData` int(11) NOT NULL,
  PRIMARY KEY (`idCaptureDataGroupCaptureDataXref`),
  KEY `CaptureDataGroupCaptureDataXref_idCaptureDataGroup` (`idCaptureDataGroup`),
  KEY `CaptureDataGroupCaptureDataXref_idCaptureData` (`idCaptureData`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `geolocation` (
  `idGeolocation` int(11) NOT NULL AUTO_INCREMENT,
  `Latitude` double DEFAULT NULL,
  `Longitude` double DEFAULT NULL,
  `Altitude` double DEFAULT NULL,
  `TS0` double DEFAULT NULL,
  `TS1` double DEFAULT NULL,
  `TS2` double DEFAULT NULL,
  `R0` double DEFAULT NULL,
  `R1` double DEFAULT NULL,
  `R2` double DEFAULT NULL,
  `R3` double DEFAULT NULL,
  PRIMARY KEY (`idGeolocation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `identifier` (
  `idIdentifier` int(11) NOT NULL AUTO_INCREMENT,
  `Identifier` varchar(255) NOT NULL,
  `idVIdentifierType` int(11) NOT NULL,
  `idSystemObject` int(11) DEFAULT NULL,
  PRIMARY KEY (`idIdentifier`),
  KEY `Identifier_idSystemObject_idVIdentifierType` (`idSystemObject`,`idVIdentifierType`),
  KEY `Identifier_Identifier` (`Identifier`),
  KEY `Identifier_idVIdentifierType_Identifier` (`idVIdentifierType`,`Identifier`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `intermediaryfile` (
  `idIntermediaryFile` int(11) NOT NULL AUTO_INCREMENT,
  `idAsset` int(11) NOT NULL,
  `DateCreated` datetime NOT NULL,
  PRIMARY KEY (`idIntermediaryFile`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `item` (
  `idItem` int(11) NOT NULL AUTO_INCREMENT,
  `idSubject` int(11) NOT NULL,
  `idAssetThumbnail` int(11) DEFAULT NULL,
  `idGeolocation` int(11) DEFAULT NULL,
  `Name` varchar(255) NOT NULL,
  `EntireSubject` bit(1) NOT NULL,
  PRIMARY KEY (`idItem`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `license` (
  `idLicense` int(11) NOT NULL AUTO_INCREMENT,
  `Name` varchar(255) NOT NULL,
  `Description` varchar(8000) NOT NULL,
  PRIMARY KEY (`idLicense`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `licenseassignment` (
  `idLicenseAssignment` int(11) NOT NULL AUTO_INCREMENT,
  `idLicense` int(11) NOT NULL,
  `idUserCreator` int(11) DEFAULT NULL,
  `DateStart` datetime DEFAULT NULL,
  `DateEnd` datetime DEFAULT NULL,
  `idSystemObject` int(11) DEFAULT NULL,
  PRIMARY KEY (`idLicenseAssignment`),
  KEY `LicenseAssignment_idSystemObject` (`idSystemObject`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `metadata` (
  `idMetadata` int(11) NOT NULL AUTO_INCREMENT,
  `Name` varchar(255) NOT NULL,
  `ValueShort` varchar(255) DEFAULT NULL,
  `ValueExtended` varchar(20000) DEFAULT NULL,
  `idAssetValue` int(11) DEFAULT NULL,
  `idUser` int(11) DEFAULT NULL,
  `idVMetadataSource` int(11) DEFAULT NULL,
  `idSystemObject` int(11) DEFAULT NULL,
  PRIMARY KEY (`idMetadata`),
  KEY `Metadata_idAssetValue` (`idAssetValue`),
  KEY `Metadata_Name_ValueShort` (`Name`,`ValueShort`),
  KEY `Metadata_idSystemObject` (`idSystemObject`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `model` (
  `idModel` int(11) NOT NULL AUTO_INCREMENT,
  `DateCreated` datetime NOT NULL,
  `idVCreationMethod` int(11) NOT NULL,
  `Master` bit(1) NOT NULL,
  `Authoritative` bit(1) NOT NULL,
  `idVModality` int(11) NOT NULL,
  `idVUnits` int(11) NOT NULL,
  `idVPurpose` int(11) NOT NULL,
  `idAssetThumbnail` int(11) DEFAULT NULL,
  PRIMARY KEY (`idModel`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `modelgeometryfile` (
  `idModelGeometryFile` int(11) NOT NULL AUTO_INCREMENT,
  `idModel` int(11) NOT NULL,
  `idAsset` int(11) NOT NULL,
  `idVModelFileType` int(11) NOT NULL,
  `Roughness` double DEFAULT NULL,
  `Metalness` double DEFAULT NULL,
  `PointCount` int(11) DEFAULT NULL,
  `FaceCount` int(11) DEFAULT NULL,
  `IsWatertight` bit(1) DEFAULT NULL,
  `HasNormals` bit(1) DEFAULT NULL,
  `HasVertexColor` bit(1) DEFAULT NULL,
  `HasUVSpace` bit(1) DEFAULT NULL,
  `BoundingBoxP1X` double DEFAULT NULL,
  `BoundingBoxP1Y` double DEFAULT NULL,
  `BoundingBoxP1Z` double DEFAULT NULL,
  `BoundingBoxP2X` double DEFAULT NULL,
  `BoundingBoxP2Y` double DEFAULT NULL,
  `BoundingBoxP2Z` double DEFAULT NULL,
  PRIMARY KEY (`idModelGeometryFile`),
  KEY `ModelGeometryFile_idModel` (`idModel`),
  KEY `ModelGeometryFile_idAsset` (`idAsset`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `modelprocessingaction` (
  `idModelProcessingAction` int(11) NOT NULL AUTO_INCREMENT,
  `idModel` int(11) NOT NULL,
  `idActor` int(11) NOT NULL,
  `ProcessingDate` datetime NOT NULL,
  `ToolsUsed` varchar(1000) NOT NULL,
  `Description` varchar(20000) NOT NULL,
  PRIMARY KEY (`idModelProcessingAction`),
  KEY `ModelProcessingAction_idModel` (`idModel`),
  KEY `ModelProcessingAction_idActor` (`idActor`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `modelprocessingactionstep` (
  `idModelProcessingActionStep` int(11) NOT NULL AUTO_INCREMENT,
  `idModelProcessingAction` int(11) NOT NULL,
  `idVActionMethod` int(11) NOT NULL,
  `Description` varchar(20000) NOT NULL,
  PRIMARY KEY (`idModelProcessingActionStep`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `modelscenexref` (
  `idModelSceneXref` int(11) NOT NULL AUTO_INCREMENT,
  `idModel` int(11) NOT NULL,
  `idScene` int(11) NOT NULL,
  `TS0` double DEFAULT NULL,
  `TS1` double DEFAULT NULL,
  `TS2` double DEFAULT NULL,
  `R0` double DEFAULT NULL,
  `R1` double DEFAULT NULL,
  `R2` double DEFAULT NULL,
  `R3` double DEFAULT NULL,
  PRIMARY KEY (`idModelSceneXref`),
  KEY `ModelSceneXref_idModel` (`idModel`),
  KEY `ModelSceneXref_idScene` (`idScene`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `modeluvmapchannel` (
  `idModelUVMapChannel` int(11) NOT NULL AUTO_INCREMENT,
  `idModelUVMapFile` int(11) NOT NULL,
  `ChannelPosition` int(11) NOT NULL,
  `ChannelWidth` int(11) NOT NULL,
  `idVUVMapType` int(11) NOT NULL,
  PRIMARY KEY (`idModelUVMapChannel`),
  KEY `ModelUVMapChannel_idModelUVMapFile` (`idModelUVMapFile`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `modeluvmapfile` (
  `idModelUVMapFile` int(11) NOT NULL AUTO_INCREMENT,
  `idModelGeometryFile` int(11) NOT NULL,
  `idAsset` int(11) NOT NULL,
  `UVMapEdgeLength` int(11) NOT NULL,
  PRIMARY KEY (`idModelUVMapFile`),
  KEY `ModelUVMapFile_idModelGeometryFile` (`idModelGeometryFile`),
  KEY `ModelUVMapFile_idAsset` (`idAsset`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `project` (
  `idProject` int(11) NOT NULL AUTO_INCREMENT,
  `Name` varchar(128) NOT NULL,
  `Description` varchar(8000) DEFAULT NULL,
  PRIMARY KEY (`idProject`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `projectdocumentation` (
  `idProjectDocumentation` int(11) NOT NULL AUTO_INCREMENT,
  `idProject` int(11) NOT NULL,
  `Name` varchar(255) NOT NULL,
  `Description` varchar(8000) NOT NULL,
  PRIMARY KEY (`idProjectDocumentation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `scene` (
  `idScene` int(11) NOT NULL AUTO_INCREMENT,
  `Name` varchar(255) NOT NULL,
  `idAssetThumbnail` int(11) DEFAULT NULL,
  `IsOriented` bit(1) NOT NULL,
  `HasBeenQCd` bit(1) NOT NULL,
  PRIMARY KEY (`idScene`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `stakeholder` (
  `idStakeholder` int(11) NOT NULL AUTO_INCREMENT,
  `IndividualName` varchar(255) NOT NULL,
  `OrganizationName` varchar(255) NOT NULL,
  `EmailAddress` varchar(255) DEFAULT NULL,
  `PhoneNumberMobile` varchar(32) DEFAULT NULL,
  `PhoneNumberOffice` varchar(32) DEFAULT NULL,
  `MailingAddress` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`idStakeholder`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `subject` (
  `idSubject` int(11) NOT NULL AUTO_INCREMENT,
  `idUnit` int(11) NOT NULL,
  `idAssetThumbnail` int(11) DEFAULT NULL,
  `idGeolocation` int(11) DEFAULT NULL,
  `Name` varchar(255) NOT NULL,
  PRIMARY KEY (`idSubject`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `systemobject` (
  `idSystemObject` int(11) NOT NULL AUTO_INCREMENT,
  `idUnit` int(11) DEFAULT NULL,
  `idProject` int(11) DEFAULT NULL,
  `idSubject` int(11) DEFAULT NULL,
  `idItem` int(11) DEFAULT NULL,
  `idCaptureData` int(11) DEFAULT NULL,
  `idModel` int(11) DEFAULT NULL,
  `idScene` int(11) DEFAULT NULL,
  `idIntermediaryFile` int(11) DEFAULT NULL,
  `idAsset` int(11) DEFAULT NULL,
  `idAssetVersion` int(11) DEFAULT NULL,
  `idProjectDocumentation` int(11) DEFAULT NULL,
  `idActor` int(11) DEFAULT NULL,
  `idStakeholder` int(11) DEFAULT NULL,
  `idWorkflow` int(11) DEFAULT NULL,
  `idWorkflowStep` int(11) DEFAULT NULL,
  `Retired` bit(1) NOT NULL,
  PRIMARY KEY (`idSystemObject`),
  KEY `SystemObject_idUnit` (`idUnit`),
  KEY `SystemObject_idProject` (`idProject`),
  KEY `SystemObject_idSubject` (`idSubject`),
  KEY `SystemObject_idItem` (`idItem`),
  KEY `SystemObject_idCaptureData` (`idCaptureData`),
  KEY `SystemObject_idModel` (`idModel`),
  KEY `SystemObject_idAsset` (`idAsset`),
  KEY `SystemObject_idAssetVersion` (`idAssetVersion`),
  KEY `SystemObject_idIntermediaryFile` (`idIntermediaryFile`),
  KEY `SystemObject_idProjectDocumentation` (`idProjectDocumentation`),
  KEY `SystemObject_idActor` (`idActor`),
  KEY `SystemObject_idStakeholder` (`idStakeholder`),
  KEY `SystemObject_idWorkflow` (`idWorkflow`),
  KEY `SystemObject_idWorkflowStep` (`idWorkflowStep`),
  KEY `SystemObject_idScene` (`idScene`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;

CREATE TABLE IF NOT EXISTS `systemobjectversion` (
  `idSystemObjectVersion` int(11) NOT NULL AUTO_INCREMENT,
  `idSystemObject` int(11) NOT NULL,
  `PublishedState` int(11) NOT NULL,
  PRIMARY KEY (`idSystemObjectVersion`),
  KEY `ObjectVersion_idSystemObject_idObjectVersion` (`idSystemObject`,`idSystemObjectVersion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `systemobjectxref` (
  `idSystemObjectXref` int(11) NOT NULL AUTO_INCREMENT,
  `idSystemObjectMaster` int(11) NOT NULL,
  `idSystemObjectDerived` int(11) NOT NULL,
  PRIMARY KEY (`idSystemObjectXref`),
  KEY `SystemObjectXref_idSystemObjectMaster` (`idSystemObjectMaster`),
  KEY `SystemObjectXref_idSystemObjectDerived` (`idSystemObjectDerived`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `unit` (
  `idUnit` int(11) NOT NULL AUTO_INCREMENT,
  `Name` varchar(255) NOT NULL,
  `Abbreviation` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`idUnit`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `user` (
  `idUser` int(11) NOT NULL AUTO_INCREMENT,
  `Name` varchar(255) NOT NULL,
  `EmailAddress` varchar(255) NOT NULL,
  `SecurityID` varchar(255) NOT NULL,
  `Active` bit(1) NOT NULL,
  `DateActivated` datetime NOT NULL,
  `DateDisabled` datetime DEFAULT NULL,
  `WorkflowNotificationTime` time DEFAULT NULL,
  `EmailSettings` int(11) DEFAULT NULL,
  PRIMARY KEY (`idUser`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `userpersonalizationsystemobject` (
  `idUserPersonalizationSystemObject` int(11) NOT NULL AUTO_INCREMENT,
  `idUser` int(11) NOT NULL,
  `idSystemObject` int(11) DEFAULT NULL,
  `Personalization` varchar(8000) DEFAULT NULL,
  PRIMARY KEY (`idUserPersonalizationSystemObject`),
  KEY `UserPersonalizationObject_idUser` (`idUser`),
  KEY `UserPersonalizationObject_idUser_idSystemObject` (`idUser`,`idSystemObject`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `userpersonalizationurl` (
  `idUserPersonalizationURL` int(11) NOT NULL AUTO_INCREMENT,
  `idUser` int(11) NOT NULL,
  `URL` varchar(255) NOT NULL,
  `Personalization` varchar(8000) NOT NULL,
  PRIMARY KEY (`idUserPersonalizationURL`),
  KEY `UserPersonalizationURL_idUser_URL` (`idUser`,`URL`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `vocabulary` (
  `idVocabulary` int(11) NOT NULL AUTO_INCREMENT,
  `idVocabularySet` int(11) NOT NULL,
  `SortOrder` int(11) NOT NULL,
  PRIMARY KEY (`idVocabulary`),
  KEY `Vocabulary_idVocabulySet_SortOrder` (`idVocabularySet`,`SortOrder`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `vocabularyset` (
  `idVocabularySet` int(11) NOT NULL AUTO_INCREMENT,
  `Name` varchar(255) NOT NULL,
  `SystemMaintained` bit(1) NOT NULL,
  PRIMARY KEY (`idVocabularySet`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `workflow` (
  `idWorkflow` int(11) NOT NULL AUTO_INCREMENT,
  `idWorkflowTemplate` int(11) NOT NULL,
  `idProject` int(11) DEFAULT NULL,
  `idUserInitiator` int(11) DEFAULT NULL,
  `DateInitiated` datetime NOT NULL,
  `DateUpdated` datetime NOT NULL,
  PRIMARY KEY (`idWorkflow`),
  KEY `Workflow_idProject` (`idProject`),
  KEY `Workflow_idUserInitiator` (`idUserInitiator`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `workflowstep` (
  `idWorkflowStep` int(11) NOT NULL AUTO_INCREMENT,
  `idWorkflow` int(11) NOT NULL,
  `idUserOwner` int(11) NOT NULL,
  `idVWorkflowStepType` int(11) NOT NULL,
  `State` int(11) NOT NULL,
  `DateCreated` datetime NOT NULL,
  `DateCompleted` datetime DEFAULT NULL,
  PRIMARY KEY (`idWorkflowStep`),
  KEY `WorkflowStep_idWorkflow_DateCreated` (`idWorkflow`,`DateCreated`),
  KEY `WorkflowStep_idWorkflow_DateCompleted` (`idWorkflow`,`DateCompleted`),
  KEY `WorkflowStep_idUserOwner` (`idUserOwner`),
  KEY `WorkflowStep_State_idWorkflow` (`State`,`idWorkflow`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `workflowstepsystemobjectxref` (
  `idWorkflowStepSystemObjectXref` int(11) NOT NULL AUTO_INCREMENT,
  `idWorkflowStep` int(11) NOT NULL,
  `idSystemObject` int(11) NOT NULL,
  `Input` bit(1) NOT NULL,
  PRIMARY KEY (`idWorkflowStepSystemObjectXref`),
  KEY `WorkflowStepSystemObjectXref_idWorkflowStep_Input` (`idWorkflowStep`,`Input`),
  KEY `WorkflowStepSystemObjectXref_idSystemObject_Input` (`idSystemObject`,`Input`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE IF NOT EXISTS `workflowstepworkflowstepxref` (
  `idWorkflowStepWorkflowStepXref` int(11) NOT NULL AUTO_INCREMENT,
  `idWorkflowStep` int(11) NOT NULL,
  `idWorkflowStepNext` int(11) NOT NULL,
  PRIMARY KEY (`idWorkflowStepWorkflowStepXref`),
  KEY `WorkflowStepWorkflowStepXref_idWorkflowStep_idWorkflowStepNext` (`idWorkflowStep`,`idWorkflowStepNext`),
  KEY `WorkflowStepWorkflowStepXref_idWorkflowStepNext_idWorkflowStep` (`idWorkflowStepNext`,`idWorkflowStep`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `workflowtemplate` (
  `idWorkflowTemplate` int(11) NOT NULL AUTO_INCREMENT,
  `Name` varchar(255) NOT NULL,
  PRIMARY KEY (`idWorkflowTemplate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Foreign Keys
ALTER TABLE `packrat`.`accesscontextobject` 
ADD CONSTRAINT `fk_accesscontextobject_accesscontext1`
  FOREIGN KEY (`idAccessContext`)
  REFERENCES `packrat`.`accesscontext` (`idAccessContext`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_accesscontextobject_systemobject1`
  FOREIGN KEY (`idSystemObject`)
  REFERENCES `packrat`.`systemobject` (`idSystemObject`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `packrat`.`accesspolicy` 
ADD CONSTRAINT `fk_accesspolicy_user1`
  FOREIGN KEY (`idUser`)
  REFERENCES `packrat`.`user` (`idUser`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_accesspolicy_accessrole1`
  FOREIGN KEY (`idAccessRole`)
  REFERENCES `packrat`.`accessrole` (`idAccessRole`)
  ON DELETE NO ACTION 
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_accesspolicy_accesscontext1`
  FOREIGN KEY (`idAccessContext`)
  REFERENCES `packrat`.`accesscontext` (`idAccessContext`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `packrat`.`accessroleaccessactionxref` 
ADD CONSTRAINT `fk_accessroleaccessactionxref_accessrole1`
  FOREIGN KEY (`idAccessRole`)
  REFERENCES `packrat`.`accessrole` (`idAccessRole`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_accessroleaccessactionxref_accessaction1`
  FOREIGN KEY (`idAccessAction`)
  REFERENCES `packrat`.`accessaction` (`idAccessAction`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `packrat`.`actor` 
ADD CONSTRAINT `fk_actor_unit_1`
  FOREIGN KEY (`idUnit`)
  REFERENCES `packrat`.`unit` (`idUnit`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `packrat`.`asset` 
ADD CONSTRAINT `fk_asset_assetgroup1`
  FOREIGN KEY (`idAssetGroup`)
  REFERENCES `packrat`.`assetgroup` (`idAssetGroup`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_asset_systemobject1`
  FOREIGN KEY (`idSystemObject`)
  REFERENCES `packrat`.`systemobject` (`idSystemObject`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `packrat`.`assetversion` 
ADD CONSTRAINT `fk_assetversion_asset1`
  FOREIGN KEY (`idAsset`)
  REFERENCES `packrat`.`asset` (`idAsset`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_assetversion_user1`
  FOREIGN KEY (`idUserCreator`)
  REFERENCES `packrat`.`user` (`idUser`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `packrat`.`capturedata` 
ADD CONSTRAINT `fk_capturedata_vocabulary1`
  FOREIGN KEY (`idVCaptureMethod`)
  REFERENCES `packrat`.`vocabulary` (`idVocabulary`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_capturedata_vocabulary2`
  FOREIGN KEY (`idVCaptureDatasetType`)
  REFERENCES `packrat`.`vocabulary` (`idVocabulary`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_capturedata_vocabulary3`
  FOREIGN KEY (`idVItemPositionType`)
  REFERENCES `packrat`.`vocabulary` (`idVocabulary`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_capturedata_vocabulary4`
  FOREIGN KEY (`idVFocusType`)
  REFERENCES `packrat`.`vocabulary` (`idVocabulary`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_capturedata_vocabulary5`
  FOREIGN KEY (`idVLightSourceType`)
  REFERENCES `packrat`.`vocabulary` (`idVocabulary`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_capturedata_vocabulary6`
  FOREIGN KEY (`idVBackgroundRemovalMethod`)
  REFERENCES `packrat`.`vocabulary` (`idVocabulary`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_capturedata_vocabulary7`
  FOREIGN KEY (`idVClusterType`)
  REFERENCES `packrat`.`vocabulary` (`idVocabulary`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_capturedata_asset1`
  FOREIGN KEY (`idAssetThumbnail`)
  REFERENCES `packrat`.`asset` (`idAsset`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `packrat`.`capturedatafile` 
ADD CONSTRAINT `fk_capturedatafile_capturedata1`
  FOREIGN KEY (`idCaptureData`)
  REFERENCES `packrat`.`capturedata` (`idCaptureData`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_capturedatafile_asset1`
  FOREIGN KEY (`idAsset`)
  REFERENCES `packrat`.`asset` (`idAsset`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_capturedatafile_vocabulary1`
  FOREIGN KEY (`idVVariantType`)
  REFERENCES `packrat`.`vocabulary` (`idVocabulary`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `packrat`.`capturedatagroupcapturedataxref` 
ADD CONSTRAINT `fk_capturedatagroupcapturedataxref_capturedatagroup1`
  FOREIGN KEY (`idCaptureDataGroup`)
  REFERENCES `packrat`.`capturedatagroup` (`idCaptureDataGroup`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_capturedatagroupcapturedataxref_capturedata1`
  FOREIGN KEY (`idCaptureData`)
  REFERENCES `packrat`.`capturedata` (`idCaptureData`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `packrat`.`identifier` 
ADD CONSTRAINT `fk_identifier_systemobject1`
  FOREIGN KEY (`idSystemObject`)
  REFERENCES `packrat`.`systemobject` (`idSystemObject`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_identifier_vocabulary1`
  FOREIGN KEY (`idVIdentifierType`)
  REFERENCES `packrat`.`vocabulary` (`idVocabulary`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `packrat`.`intermediaryfile` 
ADD CONSTRAINT `fk_intermediaryfile_asset1`
  FOREIGN KEY (`idAsset`)
  REFERENCES `packrat`.`asset` (`idAsset`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `packrat`.`item` 
ADD CONSTRAINT `fk_item_subject1`
  FOREIGN KEY (`idSubject`)
  REFERENCES `packrat`.`subject` (`idSubject`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_item_asset1`
  FOREIGN KEY (`idAssetThumbnail`)
  REFERENCES `packrat`.`asset` (`idAsset`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_item_geolocation1`
  FOREIGN KEY (`idGeolocation`)
  REFERENCES `packrat`.`geolocation` (`idGeolocation`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `packrat`.`licenseassignment` 
ADD CONSTRAINT `fk_licenseassignment_license1`
  FOREIGN KEY (`idLicense`)
  REFERENCES `packrat`.`license` (`idLicense`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_licenseassignment_user1`
  FOREIGN KEY (`idUserCreator`)
  REFERENCES `packrat`.`user` (`idUser`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_licenseassignment_systemobject1`
  FOREIGN KEY (`idSystemObject`)
  REFERENCES `packrat`.`systemobject` (`idSystemObject`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `packrat`.`metadata` 
ADD CONSTRAINT `fk_metadata_asset1`
  FOREIGN KEY (`idAssetValue`)
  REFERENCES `packrat`.`asset` (`idAsset`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_metadata_user1`
  FOREIGN KEY (`idUser`)
  REFERENCES `packrat`.`user` (`idUser`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_metadata_vocabulary1`
  FOREIGN KEY (`idVMetadataSource`)
  REFERENCES `packrat`.`vocabulary` (`idVocabulary`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_metadata_systemobject1`
  FOREIGN KEY (`idSystemObject`)
  REFERENCES `packrat`.`systemobject` (`idSystemObject`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `packrat`.`model` 
ADD CONSTRAINT `fk_model_vocabulary1`
  FOREIGN KEY (`idVCreationMethod`)
  REFERENCES `packrat`.`vocabulary` (`idVocabulary`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_model_vocabulary2`
  FOREIGN KEY (`idVModality`)
  REFERENCES `packrat`.`vocabulary` (`idVocabulary`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_model_vocabulary3`
  FOREIGN KEY (`idVUnits`)
  REFERENCES `packrat`.`vocabulary` (`idVocabulary`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_model_vocabulary4`
  FOREIGN KEY (`idVPurpose`)
  REFERENCES `packrat`.`vocabulary` (`idVocabulary`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_model_asset1`
  FOREIGN KEY (`idAssetThumbnail`)
  REFERENCES `packrat`.`asset` (`idAsset`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `packrat`.`modelgeometryfile` 
ADD CONSTRAINT `fk_modelgeometryfile_model1`
  FOREIGN KEY (`idModel`)
  REFERENCES `packrat`.`model` (`idModel`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_modelgeometryfile_asset1`
  FOREIGN KEY (`idAsset`)
  REFERENCES `packrat`.`asset` (`idAsset`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_modelgeometryfile_vocabulary1`
  FOREIGN KEY (`idVModelFileType`)
  REFERENCES `packrat`.`vocabulary` (`idVocabulary`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `packrat`.`modelprocessingaction` 
ADD CONSTRAINT `fk_modelprocessingaction_model1`
  FOREIGN KEY (`idModel`)
  REFERENCES `packrat`.`model` (`idModel`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_modelprocessingaction_actor1`
  FOREIGN KEY (`idActor`)
  REFERENCES `packrat`.`actor` (`idActor`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `packrat`.`modelprocessingactionstep` 
ADD CONSTRAINT `fk_modelprocessingactionstep_modelprocessingaction1`
  FOREIGN KEY (`idModelProcessingAction`)
  REFERENCES `packrat`.`modelprocessingaction` (`idModelProcessingAction`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_modelprocessingactionstep_vocabulary1`
  FOREIGN KEY (`idVActionMethod`)
  REFERENCES `packrat`.`vocabulary` (`idVocabulary`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;
  
ALTER TABLE `packrat`.`modelscenexref` 
ADD CONSTRAINT `fk_modelscenexref_model1`
  FOREIGN KEY (`idModel`)
  REFERENCES `packrat`.`model` (`idModel`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_modelscenexref_scene1`
  FOREIGN KEY (`idScene`)
  REFERENCES `packrat`.`scene` (`idScene`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `packrat`.`modeluvmapchannel` 
ADD CONSTRAINT `fk_modeluvmapchannel_modeluvmapfile1`
  FOREIGN KEY (`idModelUVMapFile`)
  REFERENCES `packrat`.`modeluvmapfile` (`idModelUVMapFile`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_modeluvmapchannel_vocabulary1`
  FOREIGN KEY (`idVUVMapType`)
  REFERENCES `packrat`.`vocabulary` (`idVocabulary`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;
  
ALTER TABLE `packrat`.`modeluvmapfile` 
ADD CONSTRAINT `fk_modeluvmapfile_modelgeometryfile1`
  FOREIGN KEY (`idModelGeometryFile`)
  REFERENCES `packrat`.`modelgeometryfile` (`idModelGeometryFile`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_modeluvmapfile_asset1`
  FOREIGN KEY (`idAsset`)
  REFERENCES `packrat`.`asset` (`idAsset`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `packrat`.`projectdocumentation` 
ADD CONSTRAINT `fk_projectdocumentation_project1`
  FOREIGN KEY (`idProject`)
  REFERENCES `packrat`.`project` (`idProject`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `packrat`.`scene` 
ADD CONSTRAINT `fk_scene_asset1`
  FOREIGN KEY (`idAssetThumbnail`)
  REFERENCES `packrat`.`asset` (`idAsset`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `packrat`.`subject` 
ADD CONSTRAINT `fk_subject_unit1`
  FOREIGN KEY (`idUnit`)
  REFERENCES `packrat`.`unit` (`idUnit`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_subject_asset1`
  FOREIGN KEY (`idAssetThumbnail`)
  REFERENCES `packrat`.`asset` (`idAsset`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_subject_geolocation1`
  FOREIGN KEY (`idGeolocation`)
  REFERENCES `packrat`.`geolocation` (`idGeolocation`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `packrat`.`systemobject` 
ADD CONSTRAINT `fk_systemobject_unit1`
  FOREIGN KEY (`idUnit`)
  REFERENCES `packrat`.`unit` (`idUnit`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_systemobject_project1`
  FOREIGN KEY (`idProject`)
  REFERENCES `packrat`.`project` (`idProject`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_systemobject_subject1`
  FOREIGN KEY (`idSubject`)
  REFERENCES `packrat`.`subject` (`idSubject`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_systemobject_item1`
  FOREIGN KEY (`idItem`)
  REFERENCES `packrat`.`item` (`idItem`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_systemobject_capturedata1`
  FOREIGN KEY (`idCaptureData`)
  REFERENCES `packrat`.`capturedata` (`idCaptureData`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_systemobject_model1`
  FOREIGN KEY (`idModel`)
  REFERENCES `packrat`.`model` (`idModel`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_systemobject_scene1`
  FOREIGN KEY (`idScene`)
  REFERENCES `packrat`.`scene` (`idScene`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_systemobject_intermediaryfile1`
  FOREIGN KEY (`idIntermediaryFile`)
  REFERENCES `packrat`.`intermediaryfile` (`idIntermediaryFile`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_systemobject_asset1`
  FOREIGN KEY (`idAsset`)
  REFERENCES `packrat`.`asset` (`idAsset`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_systemobject_assetversion1`
  FOREIGN KEY (`idAssetVersion`)
  REFERENCES `packrat`.`assetversion` (`idAssetVersion`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_systemobject_projectdocumentation1`
  FOREIGN KEY (`idProjectDocumentation`)
  REFERENCES `packrat`.`projectdocumentation` (`idProjectDocumentation`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_systemobject_actor1`
  FOREIGN KEY (`idActor`)
  REFERENCES `packrat`.`actor` (`idActor`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_systemobject_stakeholder1`
  FOREIGN KEY (`idStakeholder`)
  REFERENCES `packrat`.`stakeholder` (`idStakeholder`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_systemobject_workflow1`
  FOREIGN KEY (`idWorkflow`)
  REFERENCES `packrat`.`workflow` (`idWorkflow`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_systemobject_workflowstep1`
  FOREIGN KEY (`idWorkflowStep`)
  REFERENCES `packrat`.`workflowstep` (`idWorkflowStep`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `packrat`.`systemobjectversion` 
ADD CONSTRAINT `fk_systemobjectversion_systemobject`
  FOREIGN KEY (`idSystemObject`)
  REFERENCES `packrat`.`systemobject` (`idSystemObject`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `packrat`.`systemobjectxref` 
ADD CONSTRAINT `fk_systemobjectxref_systemobject1`
  FOREIGN KEY (`idSystemObjectMaster`)
  REFERENCES `packrat`.`systemobject` (`idSystemObject`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_systemobjectxref_systemobject2`
  FOREIGN KEY (`idSystemObjectDerived`)
  REFERENCES `packrat`.`systemobject` (`idSystemObject`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `packrat`.`userpersonalizationsystemobject` 
ADD CONSTRAINT `fk_userpersonalizationsystemobject_user1`
  FOREIGN KEY (`idUser`)
  REFERENCES `packrat`.`user` (`idUser`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_userpersonalizationsystemobject_systemobject1`
  FOREIGN KEY (`idSystemObject`)
  REFERENCES `packrat`.`systemobject` (`idSystemObject`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `packrat`.`userpersonalizationurl` 
ADD CONSTRAINT `fk_userpersonalizationurl_user1`
  FOREIGN KEY (`idUser`)
  REFERENCES `packrat`.`user` (`idUser`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `packrat`.`vocabulary` 
ADD CONSTRAINT `fk_vocabulary_vocabularyset1`
  FOREIGN KEY (`idVocabularySet`)
  REFERENCES `packrat`.`vocabularyset` (`idVocabularySet`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `packrat`.`workflow` 
ADD CONSTRAINT `fk_workflow_workflowtemplate1`
  FOREIGN KEY (`idWorkflowTemplate`)
  REFERENCES `packrat`.`workflowtemplate` (`idWorkflowTemplate`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_workflow_project1`
  FOREIGN KEY (`idProject`)
  REFERENCES `packrat`.`project` (`idProject`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_workflow_user1`
  FOREIGN KEY (`idUserInitiator`)
  REFERENCES `packrat`.`user` (`idUser`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;
  
ALTER TABLE `packrat`.`workflowstep` 
ADD CONSTRAINT `fk_workflowstep_workflow1`
  FOREIGN KEY (`idWorkflow`)
  REFERENCES `packrat`.`workflow` (`idWorkflow`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_workflowstep_user1`
  FOREIGN KEY (`idUserOwner`)
  REFERENCES `packrat`.`user` (`idUser`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_workflowstep_vocabulary1`
  FOREIGN KEY (`idVWorkflowStepType`)
  REFERENCES `packrat`.`vocabulary` (`idVocabulary`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;
  
ALTER TABLE `packrat`.`workflowstepsystemobjectxref` 
ADD CONSTRAINT `fk_workflowstepsystemobjectxref_workflowstep1`
  FOREIGN KEY (`idWorkflowStep`)
  REFERENCES `packrat`.`workflowstep` (`idWorkflowStep`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_workflowstepsystemobjectxref_systemobject1`
  FOREIGN KEY (`idSystemObject`)
  REFERENCES `packrat`.`systemobject` (`idSystemObject`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `packrat`.`workflowstepworkflowstepxref` 
ADD CONSTRAINT `fk_workflowstepworkflowstepxref_workflowstep1`
  FOREIGN KEY (`idWorkflowStep`)
  REFERENCES `packrat`.`workflowstep` (`idWorkflowStep`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_workflowstepworkflowstepxref_workflowstep2`
  FOREIGN KEY (`idWorkflowStepNext`)
  REFERENCES `packrat`.`workflowstep` (`idWorkflowStep`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;
