CREATE DATABASE IF NOT EXISTS `Packrat` /*!40100 DEFAULT CHARACTER SET utf8 */;
USE `Packrat`;

CREATE TABLE IF NOT EXISTS `AccessAction` (
  `idAccessAction` int(11) NOT NULL AUTO_INCREMENT,
  `Name` varchar(255) NOT NULL,
  `SortOrder` int(11) NOT NULL,
  PRIMARY KEY (`idAccessAction`),
  KEY `AccessAction_SortOrder` (`SortOrder`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `AccessContext` (
  `idAccessContext` int(11) NOT NULL AUTO_INCREMENT,
  `Global` bit(1) NOT NULL,
  `Authoritative` bit(1) NOT NULL,
  `CaptureData` bit(1) NOT NULL,
  `Model` bit(1) NOT NULL,
  `Scene` bit(1) NOT NULL,
  `IntermediaryFile` bit(1) NOT NULL,
  PRIMARY KEY (`idAccessContext`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `AccessContextObject` (
  `idAccessContextObject` int(11) NOT NULL AUTO_INCREMENT,
  `idAccessContext` int(11) NOT NULL,
  `idSystemObject` int(11) NOT NULL,
  PRIMARY KEY (`idAccessContextObject`),
  KEY `AccessContextObject_idAccessContext` (`idAccessContext`),
  KEY `AccessContextObject_idSystemObject` (`idSystemObject`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `AccessPolicy` (
  `idAccessPolicy` int(11) NOT NULL AUTO_INCREMENT,
  `idUser` int(11) NOT NULL,
  `idAccessRole` int(11) NOT NULL,
  `idAccessContext` int(11) NOT NULL,
  PRIMARY KEY (`idAccessPolicy`),
  KEY `AccessPolicy_idUser` (`idUser`),
  KEY `AccessPolicy_idAccessContext` (`idAccessContext`),
  KEY `AccessPolicy_idAccessRole` (`idAccessRole`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `AccessRole` (
  `idAccessRole` int(11) NOT NULL AUTO_INCREMENT,
  `Name` varchar(255) NOT NULL,
  PRIMARY KEY (`idAccessRole`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `AccessRoleAccessActionXref` (
  `idAccessRoleAccessActionXref` int(11) NOT NULL AUTO_INCREMENT,
  `idAccessRole` int(11) NOT NULL,
  `idAccessAction` int(11) NOT NULL,
  PRIMARY KEY (`idAccessRoleAccessActionXref`),
  KEY `AccessRoleAccessActionXref_idAccessRole` (`idAccessRole`),
  KEY `AccessRoleAccessActionXref_idAccessAction` (`idAccessAction`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `Actor` (
  `idActor` int(11) NOT NULL AUTO_INCREMENT,
  `IndividualName` varchar(255) DEFAULT NULL,
  `OrganizationName` varchar(255) DEFAULT NULL,
  `idUnit` int(11) DEFAULT NULL,
  PRIMARY KEY (`idActor`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `Asset` (
  `idAsset` int(11) NOT NULL AUTO_INCREMENT,
  `FileName` varchar(512) NOT NULL,
  `FilePath` varchar(512) NOT NULL,
  `idAssetGroup` int(11) DEFAULT NULL,
  `idSystemObject` int(11) DEFAULT NULL,
  PRIMARY KEY (`idAsset`),
  KEY `Asset_idAssetGroup` (`idAssetGroup`),
  KEY `Asset_idSystemObject` (`idSystemObject`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `AssetGroup` (
  `idAssetGroup` int(11) NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`idAssetGroup`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `AssetVersion` (
  `idAssetVersion` int(11) NOT NULL AUTO_INCREMENT,
  `idAsset` int(11) NOT NULL,
  `idUserCreator` int(11) NOT NULL,
  `DateCreated` datetime NOT NULL,
  `StorageLocation` varchar(512) NOT NULL,
  `StorageChecksum` varchar(32) NOT NULL,
  `StorageSize` bigint(20) NOT NULL DEFAULT 0,
  PRIMARY KEY (`idAssetVersion`),
  KEY `AssetVersion_idAsset_DateCreated` (`idAsset`,`DateCreated`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `CaptureData` (
  `idCaptureData` int(11) NOT NULL AUTO_INCREMENT,
  `idVCaptureMethod` int(11) NOT NULL,
  `idVCaptureDatasetType` int(11) NOT NULL,
  `DateCaptured` datetime NOT NULL,
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

CREATE TABLE IF NOT EXISTS `CaptureDataFile` (
  `idCaptureDataFile` int(11) NOT NULL AUTO_INCREMENT,
  `idCaptureData` int(11) NOT NULL,
  `idAsset` int(11) NOT NULL,
  `idVVariantType` int(11) NOT NULL,
  `CompressedMultipleFiles` bit(1) NOT NULL,
  PRIMARY KEY (`idCaptureDataFile`),
  KEY `CaptureDataFile_idCaptureData` (`idCaptureData`),
  KEY `CaptureDataFile_idAsset` (`idAsset`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `CaptureDataGroup` (
  `idCaptureDataGroup` int(11) NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`idCaptureDataGroup`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `CaptureDataGroupCaptureDataXref` (
  `idCaptureDataGroupCaptureDataXref` int(11) NOT NULL AUTO_INCREMENT,
  `idCaptureDataGroup` int(11) NOT NULL,
  `idCaptureData` int(11) NOT NULL,
  PRIMARY KEY (`idCaptureDataGroupCaptureDataXref`),
  KEY `CaptureDataGroupCaptureDataXref_idCaptureDataGroup` (`idCaptureDataGroup`),
  KEY `CaptureDataGroupCaptureDataXref_idCaptureData` (`idCaptureData`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `GeoLocation` (
  `idGeoLocation` int(11) NOT NULL AUTO_INCREMENT,
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
  PRIMARY KEY (`idGeoLocation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `Identifier` (
  `idIdentifier` int(11) NOT NULL AUTO_INCREMENT,
  `Identifier` varchar(255) NOT NULL,
  `idVIdentifierType` int(11) NOT NULL,
  `idSystemObject` int(11) DEFAULT NULL,
  PRIMARY KEY (`idIdentifier`),
  KEY `Identifier_idSystemObject_idVIdentifierType` (`idSystemObject`,`idVIdentifierType`),
  KEY `Identifier_Identifier` (`Identifier`),
  KEY `Identifier_idVIdentifierType_Identifier` (`idVIdentifierType`,`Identifier`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `IntermediaryFile` (
  `idIntermediaryFile` int(11) NOT NULL AUTO_INCREMENT,
  `idAsset` int(11) NOT NULL,
  `DateCreated` datetime NOT NULL,
  PRIMARY KEY (`idIntermediaryFile`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `Item` (
  `idItem` int(11) NOT NULL AUTO_INCREMENT,
  `idSubject` int(11) NOT NULL,
  `idAssetThumbnail` int(11) DEFAULT NULL,
  `idGeoLocation` int(11) DEFAULT NULL,
  `Name` varchar(255) NOT NULL,
  `EntireSubject` bit(1) NOT NULL,
  PRIMARY KEY (`idItem`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `License` (
  `idLicense` int(11) NOT NULL AUTO_INCREMENT,
  `Name` varchar(255) NOT NULL,
  `Description` varchar(8000) NOT NULL,
  PRIMARY KEY (`idLicense`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `LicenseAssignment` (
  `idLicenseAssignment` int(11) NOT NULL AUTO_INCREMENT,
  `idLicense` int(11) NOT NULL,
  `idUserCreator` int(11) DEFAULT NULL,
  `DateStart` datetime DEFAULT NULL,
  `DateEnd` datetime DEFAULT NULL,
  `idSystemObject` int(11) DEFAULT NULL,
  PRIMARY KEY (`idLicenseAssignment`),
  KEY `LicenseAssignment_idSystemObject` (`idSystemObject`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `Metadata` (
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

CREATE TABLE IF NOT EXISTS `Model` (
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

CREATE TABLE IF NOT EXISTS `ModelGeometryFile` (
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

CREATE TABLE IF NOT EXISTS `ModelProcessingAction` (
  `idModelProcessingAction` int(11) NOT NULL AUTO_INCREMENT,
  `idModel` int(11) NOT NULL,
  `idActor` int(11) NOT NULL,
  `DateProcessed` datetime NOT NULL,
  `ToolsUsed` varchar(1000) NOT NULL,
  `Description` varchar(20000) NOT NULL,
  PRIMARY KEY (`idModelProcessingAction`),
  KEY `ModelProcessingAction_idModel` (`idModel`),
  KEY `ModelProcessingAction_idActor` (`idActor`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `ModelProcessingActionStep` (
  `idModelProcessingActionStep` int(11) NOT NULL AUTO_INCREMENT,
  `idModelProcessingAction` int(11) NOT NULL,
  `idVActionMethod` int(11) NOT NULL,
  `Description` varchar(20000) NOT NULL,
  PRIMARY KEY (`idModelProcessingActionStep`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `ModelSceneXref` (
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

CREATE TABLE IF NOT EXISTS `ModelUVMapChannel` (
  `idModelUVMapChannel` int(11) NOT NULL AUTO_INCREMENT,
  `idModelUVMapFile` int(11) NOT NULL,
  `ChannelPosition` int(11) NOT NULL,
  `ChannelWidth` int(11) NOT NULL,
  `idVUVMapType` int(11) NOT NULL,
  PRIMARY KEY (`idModelUVMapChannel`),
  KEY `ModelUVMapChannel_idModelUVMapFile` (`idModelUVMapFile`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `ModelUVMapFile` (
  `idModelUVMapFile` int(11) NOT NULL AUTO_INCREMENT,
  `idModelGeometryFile` int(11) NOT NULL,
  `idAsset` int(11) NOT NULL,
  `UVMapEdgeLength` int(11) NOT NULL,
  PRIMARY KEY (`idModelUVMapFile`),
  KEY `ModelUVMapFile_idModelGeometryFile` (`idModelGeometryFile`),
  KEY `ModelUVMapFile_idAsset` (`idAsset`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `Project` (
  `idProject` int(11) NOT NULL AUTO_INCREMENT,
  `Name` varchar(128) NOT NULL,
  `Description` varchar(8000) DEFAULT NULL,
  PRIMARY KEY (`idProject`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `ProjectDocumentation` (
  `idProjectDocumentation` int(11) NOT NULL AUTO_INCREMENT,
  `idProject` int(11) NOT NULL,
  `Name` varchar(255) NOT NULL,
  `Description` varchar(8000) NOT NULL,
  PRIMARY KEY (`idProjectDocumentation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `Scene` (
  `idScene` int(11) NOT NULL AUTO_INCREMENT,
  `Name` varchar(255) NOT NULL,
  `idAssetThumbnail` int(11) DEFAULT NULL,
  `IsOriented` bit(1) NOT NULL,
  `HasBeenQCd` bit(1) NOT NULL,
  PRIMARY KEY (`idScene`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `Stakeholder` (
  `idStakeholder` int(11) NOT NULL AUTO_INCREMENT,
  `IndividualName` varchar(255) NOT NULL,
  `OrganizationName` varchar(255) NOT NULL,
  `EmailAddress` varchar(255) DEFAULT NULL,
  `PhoneNumberMobile` varchar(32) DEFAULT NULL,
  `PhoneNumberOffice` varchar(32) DEFAULT NULL,
  `MailingAddress` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`idStakeholder`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `Subject` (
  `idSubject` int(11) NOT NULL AUTO_INCREMENT,
  `idUnit` int(11) NOT NULL,
  `idAssetThumbnail` int(11) DEFAULT NULL,
  `idGeoLocation` int(11) DEFAULT NULL,
  `Name` varchar(255) NOT NULL,
  PRIMARY KEY (`idSubject`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `SystemObject` (
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

CREATE TABLE IF NOT EXISTS `SystemObjectVersion` (
  `idSystemObjectVersion` int(11) NOT NULL AUTO_INCREMENT,
  `idSystemObject` int(11) NOT NULL,
  `PublishedState` int(11) NOT NULL,
  PRIMARY KEY (`idSystemObjectVersion`),
  KEY `ObjectVersion_idSystemObject_idObjectVersion` (`idSystemObject`,`idSystemObjectVersion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `SystemObjectXref` (
  `idSystemObjectXref` int(11) NOT NULL AUTO_INCREMENT,
  `idSystemObjectMaster` int(11) NOT NULL,
  `idSystemObjectDerived` int(11) NOT NULL,
  PRIMARY KEY (`idSystemObjectXref`),
  KEY `SystemObjectXref_idSystemObjectMaster` (`idSystemObjectMaster`),
  KEY `SystemObjectXref_idSystemObjectDerived` (`idSystemObjectDerived`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `Unit` (
  `idUnit` int(11) NOT NULL AUTO_INCREMENT,
  `Name` varchar(255) NOT NULL,
  `Abbreviation` varchar(20) DEFAULT NULL,
  `ARKPrefix` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`idUnit`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `User` (
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

CREATE TABLE IF NOT EXISTS `UserPersonalizationSystemObject` (
  `idUserPersonalizationSystemObject` int(11) NOT NULL AUTO_INCREMENT,
  `idUser` int(11) NOT NULL,
  `idSystemObject` int(11) DEFAULT NULL,
  `Personalization` varchar(8000) DEFAULT NULL,
  PRIMARY KEY (`idUserPersonalizationSystemObject`),
  KEY `UserPersonalizationObject_idUser` (`idUser`),
  KEY `UserPersonalizationObject_idUser_idSystemObject` (`idUser`,`idSystemObject`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `UserPersonalizationUrl` (
  `idUserPersonalizationURL` int(11) NOT NULL AUTO_INCREMENT,
  `idUser` int(11) NOT NULL,
  `URL` varchar(255) NOT NULL,
  `Personalization` varchar(8000) NOT NULL,
  PRIMARY KEY (`idUserPersonalizationURL`),
  KEY `UserPersonalizationURL_idUser_URL` (`idUser`,`URL`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `Vocabulary` (
  `idVocabulary` int(11) NOT NULL AUTO_INCREMENT,
  `idVocabularySet` int(11) NOT NULL,
  `SortOrder` int(11) NOT NULL,
  PRIMARY KEY (`idVocabulary`),
  KEY `Vocabulary_idVocabulySet_SortOrder` (`idVocabularySet`,`SortOrder`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `VocabularySet` (
  `idVocabularySet` int(11) NOT NULL AUTO_INCREMENT,
  `Name` varchar(255) NOT NULL,
  `SystemMaintained` bit(1) NOT NULL,
  PRIMARY KEY (`idVocabularySet`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `Workflow` (
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

CREATE TABLE IF NOT EXISTS `WorkflowStep` (
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

CREATE TABLE IF NOT EXISTS `WorkflowStepSystemObjectXref` (
  `idWorkflowStepSystemObjectXref` int(11) NOT NULL AUTO_INCREMENT,
  `idWorkflowStep` int(11) NOT NULL,
  `idSystemObject` int(11) NOT NULL,
  `Input` bit(1) NOT NULL,
  PRIMARY KEY (`idWorkflowStepSystemObjectXref`),
  KEY `WorkflowStepSystemObjectXref_idWorkflowStep_Input` (`idWorkflowStep`,`Input`),
  KEY `WorkflowStepSystemObjectXref_idSystemObject_Input` (`idSystemObject`,`Input`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `WorkflowTemplate` (
  `idWorkflowTemplate` int(11) NOT NULL AUTO_INCREMENT,
  `Name` varchar(255) NOT NULL,
  PRIMARY KEY (`idWorkflowTemplate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Foreign Keys
ALTER TABLE `Packrat`.`AccessContextObject` 
ADD CONSTRAINT `fk_accesscontextobject_accesscontext1`
  FOREIGN KEY (`idAccessContext`)
  REFERENCES `Packrat`.`AccessContext` (`idAccessContext`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_accesscontextobject_systemobject1`
  FOREIGN KEY (`idSystemObject`)
  REFERENCES `Packrat`.`SystemObject` (`idSystemObject`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `Packrat`.`AccessPolicy` 
ADD CONSTRAINT `fk_accesspolicy_user1`
  FOREIGN KEY (`idUser`)
  REFERENCES `Packrat`.`User` (`idUser`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_accesspolicy_accessrole1`
  FOREIGN KEY (`idAccessRole`)
  REFERENCES `Packrat`.`AccessRole` (`idAccessRole`)
  ON DELETE NO ACTION 
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_accesspolicy_accesscontext1`
  FOREIGN KEY (`idAccessContext`)
  REFERENCES `Packrat`.`AccessContext` (`idAccessContext`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `Packrat`.`AccessRoleAccessActionXref` 
ADD CONSTRAINT `fk_accessroleaccessactionxref_accessrole1`
  FOREIGN KEY (`idAccessRole`)
  REFERENCES `Packrat`.`AccessRole` (`idAccessRole`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_accessroleaccessactionxref_accessaction1`
  FOREIGN KEY (`idAccessAction`)
  REFERENCES `Packrat`.`AccessAction` (`idAccessAction`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `Packrat`.`Actor` 
ADD CONSTRAINT `fk_actor_unit_1`
  FOREIGN KEY (`idUnit`)
  REFERENCES `Packrat`.`Unit` (`idUnit`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `Packrat`.`Asset` 
ADD CONSTRAINT `fk_asset_assetgroup1`
  FOREIGN KEY (`idAssetGroup`)
  REFERENCES `Packrat`.`AssetGroup` (`idAssetGroup`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_asset_systemobject1`
  FOREIGN KEY (`idSystemObject`)
  REFERENCES `Packrat`.`SystemObject` (`idSystemObject`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `Packrat`.`AssetVersion` 
ADD CONSTRAINT `fk_assetversion_asset1`
  FOREIGN KEY (`idAsset`)
  REFERENCES `Packrat`.`Asset` (`idAsset`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_assetversion_user1`
  FOREIGN KEY (`idUserCreator`)
  REFERENCES `Packrat`.`User` (`idUser`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `Packrat`.`CaptureData` 
ADD CONSTRAINT `fk_capturedata_vocabulary1`
  FOREIGN KEY (`idVCaptureMethod`)
  REFERENCES `Packrat`.`Vocabulary` (`idVocabulary`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_capturedata_vocabulary2`
  FOREIGN KEY (`idVCaptureDatasetType`)
  REFERENCES `Packrat`.`Vocabulary` (`idVocabulary`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_capturedata_vocabulary3`
  FOREIGN KEY (`idVItemPositionType`)
  REFERENCES `Packrat`.`Vocabulary` (`idVocabulary`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_capturedata_vocabulary4`
  FOREIGN KEY (`idVFocusType`)
  REFERENCES `Packrat`.`Vocabulary` (`idVocabulary`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_capturedata_vocabulary5`
  FOREIGN KEY (`idVLightSourceType`)
  REFERENCES `Packrat`.`Vocabulary` (`idVocabulary`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_capturedata_vocabulary6`
  FOREIGN KEY (`idVBackgroundRemovalMethod`)
  REFERENCES `Packrat`.`Vocabulary` (`idVocabulary`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_capturedata_vocabulary7`
  FOREIGN KEY (`idVClusterType`)
  REFERENCES `Packrat`.`Vocabulary` (`idVocabulary`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_capturedata_asset1`
  FOREIGN KEY (`idAssetThumbnail`)
  REFERENCES `Packrat`.`Asset` (`idAsset`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `Packrat`.`CaptureDataFile` 
ADD CONSTRAINT `fk_capturedatafile_capturedata1`
  FOREIGN KEY (`idCaptureData`)
  REFERENCES `Packrat`.`CaptureData` (`idCaptureData`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_capturedatafile_asset1`
  FOREIGN KEY (`idAsset`)
  REFERENCES `Packrat`.`Asset` (`idAsset`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_capturedatafile_vocabulary1`
  FOREIGN KEY (`idVVariantType`)
  REFERENCES `Packrat`.`Vocabulary` (`idVocabulary`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `Packrat`.`CaptureDataGroupCaptureDataXref` 
ADD CONSTRAINT `fk_capturedatagroupcapturedataxref_capturedatagroup1`
  FOREIGN KEY (`idCaptureDataGroup`)
  REFERENCES `Packrat`.`CaptureDataGroup` (`idCaptureDataGroup`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_capturedatagroupcapturedataxref_capturedata1`
  FOREIGN KEY (`idCaptureData`)
  REFERENCES `Packrat`.`CaptureData` (`idCaptureData`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `Packrat`.`Identifier` 
ADD CONSTRAINT `fk_identifier_systemobject1`
  FOREIGN KEY (`idSystemObject`)
  REFERENCES `Packrat`.`SystemObject` (`idSystemObject`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_identifier_vocabulary1`
  FOREIGN KEY (`idVIdentifierType`)
  REFERENCES `Packrat`.`Vocabulary` (`idVocabulary`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `Packrat`.`IntermediaryFile` 
ADD CONSTRAINT `fk_intermediaryfile_asset1`
  FOREIGN KEY (`idAsset`)
  REFERENCES `Packrat`.`Asset` (`idAsset`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `Packrat`.`Item` 
ADD CONSTRAINT `fk_item_subject1`
  FOREIGN KEY (`idSubject`)
  REFERENCES `Packrat`.`Subject` (`idSubject`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_item_asset1`
  FOREIGN KEY (`idAssetThumbnail`)
  REFERENCES `Packrat`.`Asset` (`idAsset`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_item_geolocation1`
  FOREIGN KEY (`idGeoLocation`)
  REFERENCES `Packrat`.`GeoLocation` (`idGeoLocation`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `Packrat`.`LicenseAssignment` 
ADD CONSTRAINT `fk_licenseassignment_license1`
  FOREIGN KEY (`idLicense`)
  REFERENCES `Packrat`.`License` (`idLicense`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_licenseassignment_user1`
  FOREIGN KEY (`idUserCreator`)
  REFERENCES `Packrat`.`User` (`idUser`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_licenseassignment_systemobject1`
  FOREIGN KEY (`idSystemObject`)
  REFERENCES `Packrat`.`SystemObject` (`idSystemObject`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `Packrat`.`Metadata` 
ADD CONSTRAINT `fk_metadata_asset1`
  FOREIGN KEY (`idAssetValue`)
  REFERENCES `Packrat`.`Asset` (`idAsset`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_metadata_user1`
  FOREIGN KEY (`idUser`)
  REFERENCES `Packrat`.`User` (`idUser`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_metadata_vocabulary1`
  FOREIGN KEY (`idVMetadataSource`)
  REFERENCES `Packrat`.`Vocabulary` (`idVocabulary`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_metadata_systemobject1`
  FOREIGN KEY (`idSystemObject`)
  REFERENCES `Packrat`.`SystemObject` (`idSystemObject`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `Packrat`.`Model` 
ADD CONSTRAINT `fk_model_vocabulary1`
  FOREIGN KEY (`idVCreationMethod`)
  REFERENCES `Packrat`.`Vocabulary` (`idVocabulary`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_model_vocabulary2`
  FOREIGN KEY (`idVModality`)
  REFERENCES `Packrat`.`Vocabulary` (`idVocabulary`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_model_vocabulary3`
  FOREIGN KEY (`idVUnits`)
  REFERENCES `Packrat`.`Vocabulary` (`idVocabulary`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_model_vocabulary4`
  FOREIGN KEY (`idVPurpose`)
  REFERENCES `Packrat`.`Vocabulary` (`idVocabulary`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_model_asset1`
  FOREIGN KEY (`idAssetThumbnail`)
  REFERENCES `Packrat`.`Asset` (`idAsset`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `Packrat`.`ModelGeometryFile` 
ADD CONSTRAINT `fk_modelgeometryfile_model1`
  FOREIGN KEY (`idModel`)
  REFERENCES `Packrat`.`Model` (`idModel`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_modelgeometryfile_asset1`
  FOREIGN KEY (`idAsset`)
  REFERENCES `Packrat`.`Asset` (`idAsset`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_modelgeometryfile_vocabulary1`
  FOREIGN KEY (`idVModelFileType`)
  REFERENCES `Packrat`.`Vocabulary` (`idVocabulary`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `Packrat`.`ModelProcessingAction` 
ADD CONSTRAINT `fk_modelprocessingaction_model1`
  FOREIGN KEY (`idModel`)
  REFERENCES `Packrat`.`Model` (`idModel`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_modelprocessingaction_actor1`
  FOREIGN KEY (`idActor`)
  REFERENCES `Packrat`.`Actor` (`idActor`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `Packrat`.`ModelProcessingActionStep` 
ADD CONSTRAINT `fk_modelprocessingactionstep_modelprocessingaction1`
  FOREIGN KEY (`idModelProcessingAction`)
  REFERENCES `Packrat`.`ModelProcessingAction` (`idModelProcessingAction`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_modelprocessingactionstep_vocabulary1`
  FOREIGN KEY (`idVActionMethod`)
  REFERENCES `Packrat`.`Vocabulary` (`idVocabulary`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;
  
ALTER TABLE `Packrat`.`ModelSceneXref` 
ADD CONSTRAINT `fk_modelscenexref_model1`
  FOREIGN KEY (`idModel`)
  REFERENCES `Packrat`.`Model` (`idModel`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_modelscenexref_scene1`
  FOREIGN KEY (`idScene`)
  REFERENCES `Packrat`.`Scene` (`idScene`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `Packrat`.`ModelUVMapChannel` 
ADD CONSTRAINT `fk_modeluvmapchannel_modeluvmapfile1`
  FOREIGN KEY (`idModelUVMapFile`)
  REFERENCES `Packrat`.`ModelUVMapFile` (`idModelUVMapFile`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_modeluvmapchannel_vocabulary1`
  FOREIGN KEY (`idVUVMapType`)
  REFERENCES `Packrat`.`Vocabulary` (`idVocabulary`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;
  
ALTER TABLE `Packrat`.`ModelUVMapFile` 
ADD CONSTRAINT `fk_modeluvmapfile_modelgeometryfile1`
  FOREIGN KEY (`idModelGeometryFile`)
  REFERENCES `Packrat`.`ModelGeometryFile` (`idModelGeometryFile`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_modeluvmapfile_asset1`
  FOREIGN KEY (`idAsset`)
  REFERENCES `Packrat`.`Asset` (`idAsset`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `Packrat`.`ProjectDocumentation` 
ADD CONSTRAINT `fk_projectdocumentation_project1`
  FOREIGN KEY (`idProject`)
  REFERENCES `Packrat`.`Project` (`idProject`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `Packrat`.`Scene` 
ADD CONSTRAINT `fk_scene_asset1`
  FOREIGN KEY (`idAssetThumbnail`)
  REFERENCES `Packrat`.`Asset` (`idAsset`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `Packrat`.`Subject` 
ADD CONSTRAINT `fk_subject_unit1`
  FOREIGN KEY (`idUnit`)
  REFERENCES `Packrat`.`Unit` (`idUnit`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_subject_asset1`
  FOREIGN KEY (`idAssetThumbnail`)
  REFERENCES `Packrat`.`Asset` (`idAsset`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_subject_geolocation1`
  FOREIGN KEY (`idGeoLocation`)
  REFERENCES `Packrat`.`GeoLocation` (`idGeoLocation`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `Packrat`.`SystemObject` 
ADD CONSTRAINT `fk_systemobject_unit1`
  FOREIGN KEY (`idUnit`)
  REFERENCES `Packrat`.`Unit` (`idUnit`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_systemobject_project1`
  FOREIGN KEY (`idProject`)
  REFERENCES `Packrat`.`Project` (`idProject`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_systemobject_subject1`
  FOREIGN KEY (`idSubject`)
  REFERENCES `Packrat`.`Subject` (`idSubject`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_systemobject_item1`
  FOREIGN KEY (`idItem`)
  REFERENCES `Packrat`.`Item` (`idItem`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_systemobject_capturedata1`
  FOREIGN KEY (`idCaptureData`)
  REFERENCES `Packrat`.`CaptureData` (`idCaptureData`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_systemobject_model1`
  FOREIGN KEY (`idModel`)
  REFERENCES `Packrat`.`Model` (`idModel`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_systemobject_scene1`
  FOREIGN KEY (`idScene`)
  REFERENCES `Packrat`.`Scene` (`idScene`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_systemobject_intermediaryfile1`
  FOREIGN KEY (`idIntermediaryFile`)
  REFERENCES `Packrat`.`IntermediaryFile` (`idIntermediaryFile`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_systemobject_asset1`
  FOREIGN KEY (`idAsset`)
  REFERENCES `Packrat`.`Asset` (`idAsset`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_systemobject_assetversion1`
  FOREIGN KEY (`idAssetVersion`)
  REFERENCES `Packrat`.`AssetVersion` (`idAssetVersion`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_systemobject_projectdocumentation1`
  FOREIGN KEY (`idProjectDocumentation`)
  REFERENCES `Packrat`.`ProjectDocumentation` (`idProjectDocumentation`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_systemobject_actor1`
  FOREIGN KEY (`idActor`)
  REFERENCES `Packrat`.`Actor` (`idActor`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_systemobject_stakeholder1`
  FOREIGN KEY (`idStakeholder`)
  REFERENCES `Packrat`.`Stakeholder` (`idStakeholder`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_systemobject_workflow1`
  FOREIGN KEY (`idWorkflow`)
  REFERENCES `Packrat`.`Workflow` (`idWorkflow`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_systemobject_workflowstep1`
  FOREIGN KEY (`idWorkflowStep`)
  REFERENCES `Packrat`.`WorkflowStep` (`idWorkflowStep`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `Packrat`.`SystemObjectVersion` 
ADD CONSTRAINT `fk_systemobjectversion_systemobject`
  FOREIGN KEY (`idSystemObject`)
  REFERENCES `Packrat`.`SystemObject` (`idSystemObject`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `Packrat`.`SystemObjectXref` 
ADD CONSTRAINT `fk_systemobjectxref_systemobject1`
  FOREIGN KEY (`idSystemObjectMaster`)
  REFERENCES `Packrat`.`SystemObject` (`idSystemObject`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_systemobjectxref_systemobject2`
  FOREIGN KEY (`idSystemObjectDerived`)
  REFERENCES `Packrat`.`SystemObject` (`idSystemObject`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `Packrat`.`UserPersonalizationSystemObject` 
ADD CONSTRAINT `fk_userpersonalizationsystemobject_user1`
  FOREIGN KEY (`idUser`)
  REFERENCES `Packrat`.`User` (`idUser`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_userpersonalizationsystemobject_systemobject1`
  FOREIGN KEY (`idSystemObject`)
  REFERENCES `Packrat`.`SystemObject` (`idSystemObject`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `Packrat`.`UserPersonalizationUrl` 
ADD CONSTRAINT `fk_userpersonalizationurl_user1`
  FOREIGN KEY (`idUser`)
  REFERENCES `Packrat`.`User` (`idUser`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `Packrat`.`Vocabulary` 
ADD CONSTRAINT `fk_vocabulary_vocabularyset1`
  FOREIGN KEY (`idVocabularySet`)
  REFERENCES `Packrat`.`VocabularySet` (`idVocabularySet`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `Packrat`.`Workflow` 
ADD CONSTRAINT `fk_workflow_workflowtemplate1`
  FOREIGN KEY (`idWorkflowTemplate`)
  REFERENCES `Packrat`.`WorkflowTemplate` (`idWorkflowTemplate`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_workflow_project1`
  FOREIGN KEY (`idProject`)
  REFERENCES `Packrat`.`Project` (`idProject`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_workflow_user1`
  FOREIGN KEY (`idUserInitiator`)
  REFERENCES `Packrat`.`User` (`idUser`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;
  
ALTER TABLE `Packrat`.`WorkflowStep` 
ADD CONSTRAINT `fk_workflowstep_workflow1`
  FOREIGN KEY (`idWorkflow`)
  REFERENCES `Packrat`.`Workflow` (`idWorkflow`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_workflowstep_user1`
  FOREIGN KEY (`idUserOwner`)
  REFERENCES `Packrat`.`User` (`idUser`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_workflowstep_vocabulary1`
  FOREIGN KEY (`idVWorkflowStepType`)
  REFERENCES `Packrat`.`Vocabulary` (`idVocabulary`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;
  
ALTER TABLE `Packrat`.`WorkflowStepSystemObjectXref` 
ADD CONSTRAINT `fk_workflowstepsystemobjectxref_workflowstep1`
  FOREIGN KEY (`idWorkflowStep`)
  REFERENCES `Packrat`.`WorkflowStep` (`idWorkflowStep`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_workflowstepsystemobjectxref_systemobject1`
  FOREIGN KEY (`idSystemObject`)
  REFERENCES `Packrat`.`SystemObject` (`idSystemObject`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;
