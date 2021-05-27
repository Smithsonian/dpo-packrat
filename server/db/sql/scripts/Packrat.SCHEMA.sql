-- CREATE DATABASE IF NOT EXISTS Packrat DEFAULT CHARACTER SET 'utf8mb4';
CREATE TABLE IF NOT EXISTS `AccessAction` (
  `idAccessAction` int(11) NOT NULL AUTO_INCREMENT,
  `Name` varchar(255) NOT NULL,
  `SortOrder` int(11) NOT NULL,
  PRIMARY KEY (`idAccessAction`),
  KEY `AccessAction_SortOrder` (`SortOrder`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

CREATE TABLE IF NOT EXISTS `AccessContext` (
  `idAccessContext` int(11) NOT NULL AUTO_INCREMENT,
  `Global` boolean NOT NULL,
  `Authoritative` boolean NOT NULL,
  `CaptureData` boolean NOT NULL,
  `Model` boolean NOT NULL,
  `Scene` boolean NOT NULL,
  `IntermediaryFile` boolean NOT NULL,
  PRIMARY KEY (`idAccessContext`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

CREATE TABLE IF NOT EXISTS `AccessContextObject` (
  `idAccessContextObject` int(11) NOT NULL AUTO_INCREMENT,
  `idAccessContext` int(11) NOT NULL,
  `idSystemObject` int(11) NOT NULL,
  PRIMARY KEY (`idAccessContextObject`),
  KEY `AccessContextObject_idAccessContext` (`idAccessContext`),
  KEY `AccessContextObject_idSystemObject` (`idSystemObject`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

CREATE TABLE IF NOT EXISTS `AccessPolicy` (
  `idAccessPolicy` int(11) NOT NULL AUTO_INCREMENT,
  `idUser` int(11) NOT NULL,
  `idAccessRole` int(11) NOT NULL,
  `idAccessContext` int(11) NOT NULL,
  PRIMARY KEY (`idAccessPolicy`),
  KEY `AccessPolicy_idUser` (`idUser`),
  KEY `AccessPolicy_idAccessContext` (`idAccessContext`),
  KEY `AccessPolicy_idAccessRole` (`idAccessRole`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

CREATE TABLE IF NOT EXISTS `AccessRole` (
  `idAccessRole` int(11) NOT NULL AUTO_INCREMENT,
  `Name` varchar(255) NOT NULL,
  PRIMARY KEY (`idAccessRole`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

CREATE TABLE IF NOT EXISTS `AccessRoleAccessActionXref` (
  `idAccessRoleAccessActionXref` int(11) NOT NULL AUTO_INCREMENT,
  `idAccessRole` int(11) NOT NULL,
  `idAccessAction` int(11) NOT NULL,
  PRIMARY KEY (`idAccessRoleAccessActionXref`),
  KEY `AccessRoleAccessActionXref_idAccessRole` (`idAccessRole`),
  KEY `AccessRoleAccessActionXref_idAccessAction` (`idAccessAction`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

CREATE TABLE IF NOT EXISTS `Actor` (
  `idActor` int(11) NOT NULL AUTO_INCREMENT,
  `IndividualName` varchar(255) DEFAULT NULL,
  `OrganizationName` varchar(255) DEFAULT NULL,
  `idUnit` int(11) DEFAULT NULL,
  PRIMARY KEY (`idActor`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

CREATE TABLE IF NOT EXISTS `Asset` (
  `idAsset` int(11) NOT NULL AUTO_INCREMENT,
  `FileName` varchar(512) NOT NULL,
  `FilePath` varchar(512) NOT NULL,
  `idAssetGroup` int(11) DEFAULT NULL,
  `idVAssetType` int(11) NOT NULL,
  `idSystemObject` int(11) DEFAULT NULL,
  `StorageKey` varchar(512) CHARACTER SET 'LATIN1' NULL UNIQUE,
  PRIMARY KEY (`idAsset`),
  KEY `Asset_idAssetGroup` (`idAssetGroup`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

CREATE TABLE IF NOT EXISTS `AssetGroup` (
  `idAssetGroup` int(11) NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`idAssetGroup`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

CREATE TABLE IF NOT EXISTS `AssetVersion` (
  `idAssetVersion` int(11) NOT NULL AUTO_INCREMENT,
  `idAsset` int(11) NOT NULL,
  `Version` int(11) NOT NULL,
  `FileName` varchar(512) NOT NULL,
  `idUserCreator` int(11) NOT NULL,
  `DateCreated` datetime NOT NULL,
  `StorageHash` varchar(128) CHARACTER SET 'LATIN1' NOT NULL,
  `StorageSize` bigint(20) NOT NULL DEFAULT 0,
  `StorageKeyStaging` varchar(512) CHARACTER SET 'LATIN1' NOT NULL,
  `Ingested` boolean DEFAULT NULL,
  `BulkIngest` boolean NOT NULL,
  PRIMARY KEY (`idAssetVersion`),
  KEY `AssetVersion_idAsset_Version` (`idAsset`,`Version`),
  KEY `AssetVersion_StorageHash` (`StorageHash`),
  KEY `AssetVersion_Ingested_idUserCreator` (`Ingested`,`idUserCreator`),
  KEY `AssetVersion_idUserCreator_Ingested` (`idUserCreator`,`Ingested`),
  KEY `AssetVersion_StorageKeyStaging` (`StorageKeyStaging`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

CREATE TABLE IF NOT EXISTS `Audit` (
  `idAudit` int(11) NOT NULL AUTO_INCREMENT,
  `idUser` int(11) DEFAULT NULL,
  `AuditDate` datetime NOT NULL,
  `AuditType` int(11) NOT NULL,
  `DBObjectType` int(11) NULL,
  `idDBObject` int(11) NULL,
  `idSystemObject` int(11) NULL,
  `Data` longtext NULL,
  PRIMARY KEY (`idAudit`),
  KEY `Audit_idAsset_idUser_AuditDate` (`idUser`,`AuditDate`),
  KEY `Audit_idAsset_idSystemObject_AuditDate` (`idSystemObject`,`AuditDate`),
  KEY `Audit_idAsset_DBObjectType_idDBObject_AuditDate` (`DBObjectType`,`idDBObject`,`AuditDate`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

CREATE TABLE IF NOT EXISTS `CaptureData` (
  `idCaptureData` int(11) NOT NULL AUTO_INCREMENT,
  `Name` varchar(255) NOT NULL,
  `idVCaptureMethod` int(11) NOT NULL,
  `DateCaptured` datetime NOT NULL,
  `Description` varchar(8000) NOT NULL,
  `idAssetThumbnail` int(11) DEFAULT NULL,
  PRIMARY KEY (`idCaptureData`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

CREATE TABLE IF NOT EXISTS `CaptureDataFile` (
  `idCaptureDataFile` int(11) NOT NULL AUTO_INCREMENT,
  `idCaptureData` int(11) NOT NULL,
  `idAsset` int(11) NOT NULL,
  `idVVariantType` int(11) NULL,
  `CompressedMultipleFiles` boolean NOT NULL,
  PRIMARY KEY (`idCaptureDataFile`),
  KEY `CaptureDataFile_idCaptureData` (`idCaptureData`),
  KEY `CaptureDataFile_idAsset` (`idAsset`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

CREATE TABLE IF NOT EXISTS `CaptureDataGroup` (
  `idCaptureDataGroup` int(11) NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`idCaptureDataGroup`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

CREATE TABLE IF NOT EXISTS `CaptureDataGroupCaptureDataXref` (
  `idCaptureDataGroupCaptureDataXref` int(11) NOT NULL AUTO_INCREMENT,
  `idCaptureDataGroup` int(11) NOT NULL,
  `idCaptureData` int(11) NOT NULL,
  PRIMARY KEY (`idCaptureDataGroupCaptureDataXref`),
  KEY `CaptureDataGroupCaptureDataXref_idCaptureDataGroup` (`idCaptureDataGroup`),
  KEY `CaptureDataGroupCaptureDataXref_idCaptureData` (`idCaptureData`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

CREATE TABLE IF NOT EXISTS `CaptureDataPhoto` (
  `idCaptureDataPhoto` int(11) NOT NULL AUTO_INCREMENT,
  `idCaptureData` int(11) NOT NULL,
  `idVCaptureDatasetType` int(11) NOT NULL,
  `CaptureDatasetFieldID` int(11) DEFAULT NULL,
  `idVItemPositionType` int(11) DEFAULT NULL,
  `ItemPositionFieldID` int(11) DEFAULT NULL,
  `ItemArrangementFieldID` int(11) DEFAULT NULL,
  `idVFocusType` int(11) DEFAULT NULL,
  `idVLightSourceType` int(11) DEFAULT NULL,
  `idVBackgroundRemovalMethod` int(11) DEFAULT NULL,
  `idVClusterType` int(11) DEFAULT NULL,
  `ClusterGeometryFieldID` int(11) DEFAULT NULL,
  `CameraSettingsUniform` boolean DEFAULT NULL,
  PRIMARY KEY (`idCaptureDataPhoto`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

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
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

CREATE TABLE IF NOT EXISTS `Identifier` (
  `idIdentifier` int(11) NOT NULL AUTO_INCREMENT,
  `IdentifierValue` varchar(191) NOT NULL,
  `idVIdentifierType` int(11) NOT NULL,
  `idSystemObject` int(11) DEFAULT NULL,
  PRIMARY KEY (`idIdentifier`),
  KEY `Identifier_idSystemObject_idVIdentifierType` (`idSystemObject`,`idVIdentifierType`),
  KEY `Identifier_IdentifierValue` (`IdentifierValue`),
  KEY `Identifier_idVIdentifierType_IdentifierValue` (`idVIdentifierType`,`IdentifierValue`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

CREATE TABLE IF NOT EXISTS `IntermediaryFile` (
  `idIntermediaryFile` int(11) NOT NULL AUTO_INCREMENT,
  `idAsset` int(11) NOT NULL,
  `DateCreated` datetime NOT NULL,
  PRIMARY KEY (`idIntermediaryFile`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

CREATE TABLE IF NOT EXISTS `Item` (
  `idItem` int(11) NOT NULL AUTO_INCREMENT,
  `idAssetThumbnail` int(11) DEFAULT NULL,
  `idGeoLocation` int(11) DEFAULT NULL,
  `Name` varchar(255) NOT NULL,
  `EntireSubject` boolean NOT NULL,
  PRIMARY KEY (`idItem`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

CREATE TABLE IF NOT EXISTS `Job` (
  `idJob` int(11) NOT NULL AUTO_INCREMENT,
  `idVJobType` int(11) NOT NULL,
  `Name` varchar(80) NOT NULL,
  `Status` int(11) NOT NULL,
  `Frequency` varchar(80) NULL,
  PRIMARY KEY (`idJob`),
  KEY `Job_idVJobType_idJob` (`idVJobType`, `idJob`),
  KEY `Job_Name` (`Name`),
  KEY `Job_Status` (`Status`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

CREATE TABLE IF NOT EXISTS `JobRun` (
  `idJobRun` int(11) NOT NULL AUTO_INCREMENT,
  `idJob` int(11) NOT NULL,
  `Status` int(11) NOT NULL,
  `Result` boolean NULL,
  `DateStart` datetime NULL,
  `DateEnd` datetime NULL,
  `Configuration` text NULL,
  `Parameters` text NULL,
  `Output` longtext NULL,
  `Error` text NULL,
  PRIMARY KEY (`idJobRun`),
  KEY `JobRun_idJob` (`idJob`),
  KEY `JobRun_Status` (`Status`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

CREATE TABLE IF NOT EXISTS `License` (
  `idLicense` int(11) NOT NULL AUTO_INCREMENT,
  `Name` varchar(255) NOT NULL,
  `Description` varchar(8000) NOT NULL,
  PRIMARY KEY (`idLicense`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

CREATE TABLE IF NOT EXISTS `LicenseAssignment` (
  `idLicenseAssignment` int(11) NOT NULL AUTO_INCREMENT,
  `idLicense` int(11) NOT NULL,
  `idUserCreator` int(11) DEFAULT NULL,
  `DateStart` datetime DEFAULT NULL,
  `DateEnd` datetime DEFAULT NULL,
  `idSystemObject` int(11) DEFAULT NULL,
  PRIMARY KEY (`idLicenseAssignment`),
  KEY `LicenseAssignment_idSystemObject` (`idSystemObject`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

CREATE TABLE IF NOT EXISTS `Metadata` (
  `idMetadata` int(11) NOT NULL AUTO_INCREMENT,
  `Name` VARCHAR(100) NOT NULL,
  `ValueShort` varchar(255) DEFAULT NULL,
  `ValueExtended` longtext DEFAULT NULL,
  `idAssetValue` int(11) DEFAULT NULL,
  `idUser` int(11) DEFAULT NULL,
  `idVMetadataSource` int(11) DEFAULT NULL,
  `idSystemObject` int(11) DEFAULT NULL,
  PRIMARY KEY (`idMetadata`),
  KEY `Metadata_idAssetValue` (`idAssetValue`),
  KEY `Metadata_Name` (`Name`),
  KEY `Metadata_idSystemObject` (`idSystemObject`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

CREATE TABLE IF NOT EXISTS `Model` (
  `idModel` int(11) NOT NULL AUTO_INCREMENT,
  `Name` varchar(255) NOT NULL,
  `DateCreated` datetime NOT NULL,
  `Authoritative` boolean NOT NULL,
  `idVCreationMethod` int(11) NULL,
  `idVModality` int(11) NULL,
  `idVUnits` int(11) NULL,
  `idVPurpose` int(11) NULL,
  `idVFileType` int(11) NULL,
  `idAssetThumbnail` int(11) DEFAULT NULL,
  `CountAnimations` int (11) NULL,
  `CountCameras` int (11) NULL,
  `CountFaces` int (11) NULL,
  `CountLights` int (11) NULL,
  `CountMaterials` int (11) NULL,
  `CountMeshes` int (11) NULL,
  `CountVertices` int (11) NULL,
  `CountEmbeddedTextures` int (11) NULL,
  `CountLinkedTextures` int (11) NULL,
  `FileEncoding` varchar(40) NULL,
  `IsDracoCompressed` boolean NULL,
  PRIMARY KEY (`idModel`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

CREATE TABLE IF NOT EXISTS `ModelMaterial` (
  `idModelMaterial` int(11) NOT NULL AUTO_INCREMENT,
  `Name` varchar(255) NULL,
  PRIMARY KEY (`idModelMaterial`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

CREATE TABLE IF NOT EXISTS `ModelMaterialChannel` (
  `idModelMaterialChannel` int(11) NOT NULL AUTO_INCREMENT,
  `idModelMaterial` int(11) NOT NULL,
  `idVMaterialType` int(11) NULL,
  `MaterialTypeOther` varchar(255) NULL,
  `idModelMaterialUVMap` int(11) NULL,
  `UVMapEmbedded` boolean DEFAULT NULL,
  `ChannelPosition` int(11) NULL,
  `ChannelWidth` int(11) NULL,
  `Scalar1` double DEFAULT NULL,
  `Scalar2` double DEFAULT NULL,
  `Scalar3` double DEFAULT NULL,
  `Scalar4` double DEFAULT NULL,
  `AdditionalAttributes` text NULL,
  PRIMARY KEY (`idModelMaterialChannel`),
  KEY `ModelMaterialChannel_idModelMaterial` (`idModelMaterial`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

CREATE TABLE IF NOT EXISTS `ModelMaterialUVMap` (
  `idModelMaterialUVMap` int(11) NOT NULL AUTO_INCREMENT,
  `idModel` int(11) NOT NULL,
  `idAsset` int(11) NOT NULL,
  `UVMapEdgeLength` int(11) NOT NULL,
  PRIMARY KEY (`idModelMaterialUVMap`),
  KEY `ModelUVMapFile_idModel` (`idModel`),
  KEY `ModelUVMapFile_idAsset` (`idAsset`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

CREATE TABLE IF NOT EXISTS `ModelObject` (
  `idModelObject` int(11) NOT NULL AUTO_INCREMENT,
  `idModel` int(11) NOT NULL,
  `BoundingBoxP1X` double DEFAULT NULL,
  `BoundingBoxP1Y` double DEFAULT NULL,
  `BoundingBoxP1Z` double DEFAULT NULL,
  `BoundingBoxP2X` double DEFAULT NULL,
  `BoundingBoxP2Y` double DEFAULT NULL,
  `BoundingBoxP2Z` double DEFAULT NULL,
  `CountVertices` int(11) DEFAULT NULL,
  `CountFaces` int(11) DEFAULT NULL,
  `CountColorChannels` int(11) DEFAULT NULL,
  `CountTextureCoordinateChannels` int(11) DEFAULT NULL,
  `HasBones` boolean DEFAULT NULL,
  `HasFaceNormals` boolean DEFAULT NULL,
  `HasTangents` boolean DEFAULT NULL,
  `HasTextureCoordinates` boolean DEFAULT NULL,
  `HasVertexNormals` boolean DEFAULT NULL,
  `HasVertexColor` boolean DEFAULT NULL,
  `IsTwoManifoldUnbounded` boolean DEFAULT NULL,
  `IsTwoManifoldBounded` boolean DEFAULT NULL,
  `IsWatertight` boolean DEFAULT NULL,
  `SelfIntersecting` boolean DEFAULT NULL,
  PRIMARY KEY (`idModelObject`),
  KEY `ModelObject_idModel` (`idModel`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

CREATE TABLE IF NOT EXISTS `ModelObjectModelMaterialXref` (
  `idModelObjectModelMaterialXref` int(11) NOT NULL AUTO_INCREMENT,
  `idModelObject` int(11) NOT NULL,
  `idModelMaterial` int(11) NOT NULL,
  PRIMARY KEY (`idModelObjectModelMaterialXref`),
  KEY `ModelObjectModelMaterialXref_idModelObject` (`idModelObject`),
  KEY `ModelObjectModelMaterialXref_idModelMaterial` (`idModelMaterial`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

CREATE TABLE IF NOT EXISTS `ModelProcessingAction` (
  `idModelProcessingAction` int(11) NOT NULL AUTO_INCREMENT,
  `idModel` int(11) NOT NULL,
  `idActor` int(11) NOT NULL,
  `DateProcessed` datetime NOT NULL,
  `ToolsUsed` varchar(1000) NOT NULL,
  `Description` text NOT NULL,
  PRIMARY KEY (`idModelProcessingAction`),
  KEY `ModelProcessingAction_idModel` (`idModel`),
  KEY `ModelProcessingAction_idActor` (`idActor`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

CREATE TABLE IF NOT EXISTS `ModelProcessingActionStep` (
  `idModelProcessingActionStep` int(11) NOT NULL AUTO_INCREMENT,
  `idModelProcessingAction` int(11) NOT NULL,
  `idVActionMethod` int(11) NOT NULL,
  `Description` text NOT NULL,
  PRIMARY KEY (`idModelProcessingActionStep`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

CREATE TABLE IF NOT EXISTS `ModelSceneXref` (
  `idModelSceneXref` int(11) NOT NULL AUTO_INCREMENT,
  `idModel` int(11) NOT NULL,
  `idScene` int(11) NOT NULL,
  `Name` varchar(100) DEFAULT NULL,
  `Usage` varchar(100) DEFAULT NULL,
  `Quality` varchar(100) DEFAULT NULL,
  `FileSize` bigint(20) DEFAULT NULL,
  `UVResolution` int(11) DEFAULT NULL,
  `BoundingBoxP1X` double DEFAULT NULL,
  `BoundingBoxP1Y` double DEFAULT NULL,
  `BoundingBoxP1Z` double DEFAULT NULL,
  `BoundingBoxP2X` double DEFAULT NULL,
  `BoundingBoxP2Y` double DEFAULT NULL,
  `BoundingBoxP2Z` double DEFAULT NULL,
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
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

CREATE TABLE IF NOT EXISTS `Project` (
  `idProject` int(11) NOT NULL AUTO_INCREMENT,
  `Name` varchar(128) NOT NULL,
  `Description` varchar(8000) DEFAULT NULL,
  PRIMARY KEY (`idProject`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

CREATE TABLE IF NOT EXISTS `ProjectDocumentation` (
  `idProjectDocumentation` int(11) NOT NULL AUTO_INCREMENT,
  `idProject` int(11) NOT NULL,
  `Name` varchar(255) NOT NULL,
  `Description` varchar(8000) NOT NULL,
  PRIMARY KEY (`idProjectDocumentation`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

CREATE TABLE IF NOT EXISTS `Scene` (
  `idScene` int(11) NOT NULL AUTO_INCREMENT,
  `Name` varchar(255) NOT NULL,
  `idAssetThumbnail` int(11) DEFAULT NULL,
  `IsOriented` boolean NOT NULL,
  `HasBeenQCd` boolean NOT NULL,
  `CountScene` int(11) DEFAULT NULL,
  `CountNode` int(11) DEFAULT NULL,
  `CountCamera` int(11) DEFAULT NULL,
  `CountLight` int(11) DEFAULT NULL,
  `CountModel` int(11) DEFAULT NULL,
  `CountMeta` int(11) DEFAULT NULL,
  `CountSetup` int(11) DEFAULT NULL,
  `CountTour` int(11) DEFAULT NULL,
  PRIMARY KEY (`idScene`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

CREATE TABLE IF NOT EXISTS `Stakeholder` (
  `idStakeholder` int(11) NOT NULL AUTO_INCREMENT,
  `IndividualName` varchar(255) NOT NULL,
  `OrganizationName` varchar(255) NOT NULL,
  `EmailAddress` varchar(255) DEFAULT NULL,
  `PhoneNumberMobile` varchar(32) DEFAULT NULL,
  `PhoneNumberOffice` varchar(32) DEFAULT NULL,
  `MailingAddress` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`idStakeholder`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

CREATE TABLE IF NOT EXISTS `Subject` (
  `idSubject` int(11) NOT NULL AUTO_INCREMENT,
  `idUnit` int(11) NOT NULL,
  `idAssetThumbnail` int(11) DEFAULT NULL,
  `idGeoLocation` int(11) DEFAULT NULL,
  `Name` varchar(255) NOT NULL,
  `idIdentifierPreferred` int(11) DEFAULT NULL,
  PRIMARY KEY (`idSubject`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

CREATE TABLE IF NOT EXISTS `SystemObject` (
  `idSystemObject` int(11) NOT NULL AUTO_INCREMENT,
  `idUnit` int(11) UNIQUE DEFAULT NULL,
  `idProject` int(11) UNIQUE DEFAULT NULL,
  `idSubject` int(11) UNIQUE DEFAULT NULL,
  `idItem` int(11) UNIQUE DEFAULT NULL,
  `idCaptureData` int(11) UNIQUE DEFAULT NULL,
  `idModel` int(11) UNIQUE DEFAULT NULL,
  `idScene` int(11) UNIQUE DEFAULT NULL,
  `idIntermediaryFile` int(11) UNIQUE DEFAULT NULL,
  `idAsset` int(11) UNIQUE DEFAULT NULL,
  `idAssetVersion` int(11) UNIQUE DEFAULT NULL,
  `idProjectDocumentation` int(11) UNIQUE DEFAULT NULL,
  `idActor` int(11) UNIQUE DEFAULT NULL,
  `idStakeholder` int(11) UNIQUE DEFAULT NULL,
  `Retired` boolean NOT NULL,
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
  KEY `SystemObject_idScene` (`idScene`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4 ROW_FORMAT=DYNAMIC;

CREATE TABLE IF NOT EXISTS `SystemObjectVersion` (
  `idSystemObjectVersion` int(11) NOT NULL AUTO_INCREMENT,
  `idSystemObject` int(11) NOT NULL,
  `PublishedState` int(11) NOT NULL,
  `DateCreated` datetime NOT NULL,
  PRIMARY KEY (`idSystemObjectVersion`),
  KEY `ObjectVersion_idSystemObject_idObjectVersion` (`idSystemObject`,`idSystemObjectVersion`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

CREATE TABLE IF NOT EXISTS `SystemObjectVersionAssetVersionXref` (
  `idSystemObjectVersionAssetVersionXref` int(11) NOT NULL AUTO_INCREMENT,
  `idSystemObjectVersion` int(11) NOT NULL,
  `idAssetVersion` int(11) NOT NULL,
  PRIMARY KEY (`idSystemObjectVersionAssetVersionXref`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

CREATE TABLE IF NOT EXISTS `SystemObjectXref` (
  `idSystemObjectXref` int(11) NOT NULL AUTO_INCREMENT,
  `idSystemObjectMaster` int(11) NOT NULL,
  `idSystemObjectDerived` int(11) NOT NULL,
  PRIMARY KEY (`idSystemObjectXref`),
  KEY `SystemObjectXref_idSystemObjectMaster` (`idSystemObjectMaster`),
  KEY `SystemObjectXref_idSystemObjectDerived` (`idSystemObjectDerived`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

CREATE TABLE IF NOT EXISTS `Unit` (
  `idUnit` int(11) NOT NULL AUTO_INCREMENT,
  `Name` varchar(255) NOT NULL,
  `Abbreviation` varchar(20) DEFAULT NULL,
  `ARKPrefix` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`idUnit`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

CREATE TABLE IF NOT EXISTS `UnitEdan` (
  `idUnitEdan` int(11) NOT NULL AUTO_INCREMENT,
  `idUnit` int(11) DEFAULT NULL,
  `Abbreviation` varchar(100) NOT NULL UNIQUE,
  PRIMARY KEY (`idUnitEdan`),
  KEY `UnitEdan_Abbreviation` (`Abbreviation`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

CREATE TABLE IF NOT EXISTS `User` (
  `idUser` int(11) NOT NULL AUTO_INCREMENT,
  `Name` varchar(255) NOT NULL,
  `EmailAddress` varchar(255) CHARACTER SET 'LATIN1' NOT NULL,
  `SecurityID` varchar(255) NOT NULL,
  `Active` boolean NOT NULL,
  `DateActivated` datetime NOT NULL,
  `DateDisabled` datetime DEFAULT NULL,
  `WorkflowNotificationTime` time DEFAULT NULL,
  `EmailSettings` int(11) DEFAULT NULL,
  PRIMARY KEY (`idUser`),
  KEY `user_EmailAddress` (`EmailAddress`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

CREATE TABLE IF NOT EXISTS `UserPersonalizationSystemObject` (
  `idUserPersonalizationSystemObject` int(11) NOT NULL AUTO_INCREMENT,
  `idUser` int(11) NOT NULL,
  `idSystemObject` int(11) NOT NULL,
  `Personalization` varchar(8000) DEFAULT NULL,
  PRIMARY KEY (`idUserPersonalizationSystemObject`),
  KEY `UserPersonalizationObject_idUser` (`idUser`),
  KEY `UserPersonalizationObject_idUser_idSystemObject` (`idUser`,`idSystemObject`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

CREATE TABLE IF NOT EXISTS `UserPersonalizationUrl` (
  `idUserPersonalizationUrl` int(11) NOT NULL AUTO_INCREMENT,
  `idUser` int(11) NOT NULL,
  `URL` varchar(255) CHARACTER SET 'LATIN1' NOT NULL,
  `Personalization` varchar(8000) NOT NULL,
  PRIMARY KEY (`idUserPersonalizationUrl`),
  KEY `UserPersonalizationUrl_idUser_URL` (`idUser`,`URL`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

CREATE TABLE IF NOT EXISTS `Vocabulary` (
  `idVocabulary` int(11) NOT NULL AUTO_INCREMENT,
  `idVocabularySet` int(11) NOT NULL,
  `SortOrder` int(11) NOT NULL,
  `Term` varchar(255) NOT NULL,
  PRIMARY KEY (`idVocabulary`),
  KEY `Vocabulary_idVocabulySet_SortOrder` (`idVocabularySet`,`SortOrder`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

CREATE TABLE IF NOT EXISTS `VocabularySet` (
  `idVocabularySet` int(11) NOT NULL AUTO_INCREMENT,
  `Name` varchar(255) NOT NULL,
  `SystemMaintained` boolean NOT NULL,
  PRIMARY KEY (`idVocabularySet`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

CREATE TABLE IF NOT EXISTS `Workflow` (
  `idWorkflow` int(11) NOT NULL AUTO_INCREMENT,
  `idVWorkflowType` int(11) NOT NULL,
  `idProject` int(11) DEFAULT NULL,
  `idUserInitiator` int(11) DEFAULT NULL,
  `DateInitiated` datetime NOT NULL,
  `DateUpdated` datetime NOT NULL,
  `Parameters` text NULL,
  PRIMARY KEY (`idWorkflow`),
  KEY `Workflow_idProject` (`idProject`),
  KEY `Workflow_idUserInitiator` (`idUserInitiator`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

CREATE TABLE IF NOT EXISTS `WorkflowStep` (
  `idWorkflowStep` int(11) NOT NULL AUTO_INCREMENT,
  `idWorkflow` int(11) NOT NULL,
  `idJobRun` int(11) NULL,
  `idUserOwner` int(11) NULL,
  `idVWorkflowStepType` int(11) NOT NULL,
  `State` int(11) NOT NULL,
  `DateCreated` datetime NOT NULL,
  `DateCompleted` datetime DEFAULT NULL,
  PRIMARY KEY (`idWorkflowStep`),
  KEY `WorkflowStep_idWorkflow_DateCreated` (`idWorkflow`,`DateCreated`),
  KEY `WorkflowStep_idWorkflow_DateCompleted` (`idWorkflow`,`DateCompleted`),
  KEY `WorkflowStep_idUserOwner` (`idUserOwner`),
  KEY `WorkflowStep_idJobRun` (`idJobRun`),
  KEY `WorkflowStep_State_idWorkflow` (`State`,`idWorkflow`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

CREATE TABLE IF NOT EXISTS `WorkflowStepSystemObjectXref` (
  `idWorkflowStepSystemObjectXref` int(11) NOT NULL AUTO_INCREMENT,
  `idWorkflowStep` int(11) NOT NULL,
  `idSystemObject` int(11) NOT NULL,
  `Input` boolean NOT NULL,
  PRIMARY KEY (`idWorkflowStepSystemObjectXref`),
  KEY `WorkflowStepSystemObjectXref_idWorkflowStep_Input` (`idWorkflowStep`,`Input`),
  KEY `WorkflowStepSystemObjectXref_idSystemObject_Input` (`idSystemObject`,`Input`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

-- Foreign Keys
ALTER TABLE `AccessContextObject` 
ADD CONSTRAINT `fk_accesscontextobject_accesscontext1`
  FOREIGN KEY (`idAccessContext`)
  REFERENCES `AccessContext` (`idAccessContext`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_accesscontextobject_systemobject1`
  FOREIGN KEY (`idSystemObject`)
  REFERENCES `SystemObject` (`idSystemObject`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `AccessPolicy` 
ADD CONSTRAINT `fk_accesspolicy_user1`
  FOREIGN KEY (`idUser`)
  REFERENCES `User` (`idUser`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_accesspolicy_accessrole1`
  FOREIGN KEY (`idAccessRole`)
  REFERENCES `AccessRole` (`idAccessRole`)
  ON DELETE NO ACTION 
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_accesspolicy_accesscontext1`
  FOREIGN KEY (`idAccessContext`)
  REFERENCES `AccessContext` (`idAccessContext`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `AccessRoleAccessActionXref` 
ADD CONSTRAINT `fk_accessroleaccessactionxref_accessrole1`
  FOREIGN KEY (`idAccessRole`)
  REFERENCES `AccessRole` (`idAccessRole`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_accessroleaccessactionxref_accessaction1`
  FOREIGN KEY (`idAccessAction`)
  REFERENCES `AccessAction` (`idAccessAction`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `Actor` 
ADD CONSTRAINT `fk_actor_unit_1`
  FOREIGN KEY (`idUnit`)
  REFERENCES `Unit` (`idUnit`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `Asset` 
ADD CONSTRAINT `fk_asset_assetgroup1`
  FOREIGN KEY (`idAssetGroup`)
  REFERENCES `AssetGroup` (`idAssetGroup`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_asset_vocabulary1`
  FOREIGN KEY (`idVAssetType`)
  REFERENCES `Vocabulary` (`idVocabulary`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_asset_systemobject1`
  FOREIGN KEY (`idSystemObject`)
  REFERENCES `SystemObject` (`idSystemObject`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `AssetVersion` 
ADD CONSTRAINT `fk_assetversion_asset1`
  FOREIGN KEY (`idAsset`)
  REFERENCES `Asset` (`idAsset`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_assetversion_user1`
  FOREIGN KEY (`idUserCreator`)
  REFERENCES `User` (`idUser`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `Audit` 
ADD CONSTRAINT `fk_audit_user1`
  FOREIGN KEY (`idUser`)
  REFERENCES `User` (`idUser`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_audit_systemobject1`
  FOREIGN KEY (`idSystemObject`)
  REFERENCES `SystemObject` (`idSystemObject`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `CaptureData` 
ADD CONSTRAINT `fk_capturedata_vocabulary1`
  FOREIGN KEY (`idVCaptureMethod`)
  REFERENCES `Vocabulary` (`idVocabulary`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_capturedata_asset1`
  FOREIGN KEY (`idAssetThumbnail`)
  REFERENCES `Asset` (`idAsset`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `CaptureDataFile` 
ADD CONSTRAINT `fk_capturedatafile_capturedata1`
  FOREIGN KEY (`idCaptureData`)
  REFERENCES `CaptureData` (`idCaptureData`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_capturedatafile_asset1`
  FOREIGN KEY (`idAsset`)
  REFERENCES `Asset` (`idAsset`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_capturedatafile_vocabulary1`
  FOREIGN KEY (`idVVariantType`)
  REFERENCES `Vocabulary` (`idVocabulary`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `CaptureDataGroupCaptureDataXref` 
ADD CONSTRAINT `fk_capturedatagroupcapturedataxref_capturedatagroup1`
  FOREIGN KEY (`idCaptureDataGroup`)
  REFERENCES `CaptureDataGroup` (`idCaptureDataGroup`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_capturedatagroupcapturedataxref_capturedata1`
  FOREIGN KEY (`idCaptureData`)
  REFERENCES `CaptureData` (`idCaptureData`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `CaptureDataPhoto` 
ADD CONSTRAINT `fk_capturedataphoto_capturedata1`
  FOREIGN KEY (`idCaptureData`)
  REFERENCES `CaptureData` (`idCaptureData`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_capturedataphoto_vocabulary1`
  FOREIGN KEY (`idVCaptureDatasetType`)
  REFERENCES `Vocabulary` (`idVocabulary`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_capturedataphoto_vocabulary2`
  FOREIGN KEY (`idVItemPositionType`)
  REFERENCES `Vocabulary` (`idVocabulary`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_capturedataphoto_vocabulary3`
  FOREIGN KEY (`idVFocusType`)
  REFERENCES `Vocabulary` (`idVocabulary`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_capturedataphoto_vocabulary4`
  FOREIGN KEY (`idVLightSourceType`)
  REFERENCES `Vocabulary` (`idVocabulary`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_capturedataphoto_vocabulary5`
  FOREIGN KEY (`idVBackgroundRemovalMethod`)
  REFERENCES `Vocabulary` (`idVocabulary`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_capturedataphoto_vocabulary6`
  FOREIGN KEY (`idVClusterType`)
  REFERENCES `Vocabulary` (`idVocabulary`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `Identifier` 
ADD CONSTRAINT `fk_identifier_systemobject1`
  FOREIGN KEY (`idSystemObject`)
  REFERENCES `SystemObject` (`idSystemObject`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_identifier_vocabulary1`
  FOREIGN KEY (`idVIdentifierType`)
  REFERENCES `Vocabulary` (`idVocabulary`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `IntermediaryFile` 
ADD CONSTRAINT `fk_intermediaryfile_asset1`
  FOREIGN KEY (`idAsset`)
  REFERENCES `Asset` (`idAsset`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `Item` 
ADD CONSTRAINT `fk_item_asset1`
  FOREIGN KEY (`idAssetThumbnail`)
  REFERENCES `Asset` (`idAsset`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_item_geolocation1`
  FOREIGN KEY (`idGeoLocation`)
  REFERENCES `GeoLocation` (`idGeoLocation`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `Job` 
ADD CONSTRAINT `fk_job_vocabulary1`
  FOREIGN KEY (`idVJobType`)
  REFERENCES `Vocabulary` (`idVocabulary`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `JobRun` 
ADD CONSTRAINT `fk_jobrun_job1`
  FOREIGN KEY (`idJob`)
  REFERENCES `Job` (`idJob`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `LicenseAssignment` 
ADD CONSTRAINT `fk_licenseassignment_license1`
  FOREIGN KEY (`idLicense`)
  REFERENCES `License` (`idLicense`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_licenseassignment_user1`
  FOREIGN KEY (`idUserCreator`)
  REFERENCES `User` (`idUser`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_licenseassignment_systemobject1`
  FOREIGN KEY (`idSystemObject`)
  REFERENCES `SystemObject` (`idSystemObject`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `Metadata` 
ADD CONSTRAINT `fk_metadata_asset1`
  FOREIGN KEY (`idAssetValue`)
  REFERENCES `Asset` (`idAsset`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_metadata_user1`
  FOREIGN KEY (`idUser`)
  REFERENCES `User` (`idUser`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_metadata_vocabulary1`
  FOREIGN KEY (`idVMetadataSource`)
  REFERENCES `Vocabulary` (`idVocabulary`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_metadata_systemobject1`
  FOREIGN KEY (`idSystemObject`)
  REFERENCES `SystemObject` (`idSystemObject`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `Model` 
ADD CONSTRAINT `fk_model_vocabulary1`
  FOREIGN KEY (`idVCreationMethod`)
  REFERENCES `Vocabulary` (`idVocabulary`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_model_vocabulary2`
  FOREIGN KEY (`idVModality`)
  REFERENCES `Vocabulary` (`idVocabulary`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_model_vocabulary3`
  FOREIGN KEY (`idVUnits`)
  REFERENCES `Vocabulary` (`idVocabulary`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_model_vocabulary4`
  FOREIGN KEY (`idVPurpose`)
  REFERENCES `Vocabulary` (`idVocabulary`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_model_vocabulary5`
  FOREIGN KEY (`idVFileType`)
  REFERENCES `Vocabulary` (`idVocabulary`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_model_asset1`
  FOREIGN KEY (`idAssetThumbnail`)
  REFERENCES `Asset` (`idAsset`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `ModelMaterialChannel` 
ADD CONSTRAINT `fk_modelmaterialchannel_modelmaterial1`
  FOREIGN KEY (`idModelMaterial`)
  REFERENCES `ModelMaterial` (`idModelMaterial`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_modelmaterialchannel_modelmaterialuvmap1`
  FOREIGN KEY (`idModelMaterialUVMap`)
  REFERENCES `ModelMaterialUVMap` (`idModelMaterialUVMap`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_modelmaterialchannel_vocabulary1`
  FOREIGN KEY (`idVMaterialType`)
  REFERENCES `Vocabulary` (`idVocabulary`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;
  
ALTER TABLE `ModelMaterialUVMap` 
ADD CONSTRAINT `fk_modelmaterialuvmap_model1`
  FOREIGN KEY (`idModel`)
  REFERENCES `Model` (`idModel`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_modelmaterialuvmap_asset1`
  FOREIGN KEY (`idAsset`)
  REFERENCES `Asset` (`idAsset`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `ModelObject` 
ADD CONSTRAINT `fk_modelobject_model1`
  FOREIGN KEY (`idModel`)
  REFERENCES `Model` (`idModel`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `ModelObjectModelMaterialXref` 
ADD CONSTRAINT `fk_modelobjectmodelmaterialxref_modelobject1`
  FOREIGN KEY (`idModelObject`)
  REFERENCES `ModelObject` (`idModelObject`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_modelobjectmodelmaterialxref_modelmaterial1`
  FOREIGN KEY (`idModelMaterial`)
  REFERENCES `ModelMaterial` (`idModelMaterial`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `ModelProcessingAction` 
ADD CONSTRAINT `fk_modelprocessingaction_model1`
  FOREIGN KEY (`idModel`)
  REFERENCES `Model` (`idModel`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_modelprocessingaction_actor1`
  FOREIGN KEY (`idActor`)
  REFERENCES `Actor` (`idActor`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `ModelProcessingActionStep` 
ADD CONSTRAINT `fk_modelprocessingactionstep_modelprocessingaction1`
  FOREIGN KEY (`idModelProcessingAction`)
  REFERENCES `ModelProcessingAction` (`idModelProcessingAction`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_modelprocessingactionstep_vocabulary1`
  FOREIGN KEY (`idVActionMethod`)
  REFERENCES `Vocabulary` (`idVocabulary`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;
  
ALTER TABLE `ModelSceneXref` 
ADD CONSTRAINT `fk_modelscenexref_model1`
  FOREIGN KEY (`idModel`)
  REFERENCES `Model` (`idModel`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_modelscenexref_scene1`
  FOREIGN KEY (`idScene`)
  REFERENCES `Scene` (`idScene`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `ProjectDocumentation` 
ADD CONSTRAINT `fk_projectdocumentation_project1`
  FOREIGN KEY (`idProject`)
  REFERENCES `Project` (`idProject`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `Scene` 
ADD CONSTRAINT `fk_scene_asset1`
  FOREIGN KEY (`idAssetThumbnail`)
  REFERENCES `Asset` (`idAsset`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `Subject` 
ADD CONSTRAINT `fk_subject_unit1`
  FOREIGN KEY (`idUnit`)
  REFERENCES `Unit` (`idUnit`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_subject_asset1`
  FOREIGN KEY (`idAssetThumbnail`)
  REFERENCES `Asset` (`idAsset`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_subject_geolocation1`
  FOREIGN KEY (`idGeoLocation`)
  REFERENCES `GeoLocation` (`idGeoLocation`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_subject_identifier1`
  FOREIGN KEY (`idIdentifierPreferred`)
  REFERENCES `Identifier` (`idIdentifier`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `SystemObject` 
ADD CONSTRAINT `fk_systemobject_unit1`
  FOREIGN KEY (`idUnit`)
  REFERENCES `Unit` (`idUnit`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_systemobject_project1`
  FOREIGN KEY (`idProject`)
  REFERENCES `Project` (`idProject`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_systemobject_subject1`
  FOREIGN KEY (`idSubject`)
  REFERENCES `Subject` (`idSubject`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_systemobject_item1`
  FOREIGN KEY (`idItem`)
  REFERENCES `Item` (`idItem`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_systemobject_capturedata1`
  FOREIGN KEY (`idCaptureData`)
  REFERENCES `CaptureData` (`idCaptureData`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_systemobject_model1`
  FOREIGN KEY (`idModel`)
  REFERENCES `Model` (`idModel`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_systemobject_scene1`
  FOREIGN KEY (`idScene`)
  REFERENCES `Scene` (`idScene`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_systemobject_intermediaryfile1`
  FOREIGN KEY (`idIntermediaryFile`)
  REFERENCES `IntermediaryFile` (`idIntermediaryFile`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_systemobject_asset1`
  FOREIGN KEY (`idAsset`)
  REFERENCES `Asset` (`idAsset`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_systemobject_assetversion1`
  FOREIGN KEY (`idAssetVersion`)
  REFERENCES `AssetVersion` (`idAssetVersion`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_systemobject_projectdocumentation1`
  FOREIGN KEY (`idProjectDocumentation`)
  REFERENCES `ProjectDocumentation` (`idProjectDocumentation`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_systemobject_actor1`
  FOREIGN KEY (`idActor`)
  REFERENCES `Actor` (`idActor`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_systemobject_stakeholder1`
  FOREIGN KEY (`idStakeholder`)
  REFERENCES `Stakeholder` (`idStakeholder`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `SystemObjectVersion` 
ADD CONSTRAINT `fk_systemobjectversion_systemobject`
  FOREIGN KEY (`idSystemObject`)
  REFERENCES `SystemObject` (`idSystemObject`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `SystemObjectVersionAssetVersionXref`
ADD CONSTRAINT `fk_systemobjectversionassetversionxref_systemobjectversion`
  FOREIGN KEY (`idSystemObjectVersion`)
  REFERENCES `SystemObjectVersion` (`idSystemObjectVersion`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_systemobjectversionassetversionxref_assetversion`
  FOREIGN KEY (`idAssetVersion`)
  REFERENCES `AssetVersion` (`idAssetVersion`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `SystemObjectXref` 
ADD CONSTRAINT `fk_systemobjectxref_systemobject1`
  FOREIGN KEY (`idSystemObjectMaster`)
  REFERENCES `SystemObject` (`idSystemObject`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_systemobjectxref_systemobject2`
  FOREIGN KEY (`idSystemObjectDerived`)
  REFERENCES `SystemObject` (`idSystemObject`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `UnitEdan` 
ADD CONSTRAINT `fk_unitedan_idunit`
  FOREIGN KEY (`idUnit`)
  REFERENCES `Unit` (`idUnit`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `UserPersonalizationSystemObject` 
ADD CONSTRAINT `fk_userpersonalizationsystemobject_user1`
  FOREIGN KEY (`idUser`)
  REFERENCES `User` (`idUser`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_userpersonalizationsystemobject_systemobject1`
  FOREIGN KEY (`idSystemObject`)
  REFERENCES `SystemObject` (`idSystemObject`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `UserPersonalizationUrl` 
ADD CONSTRAINT `fk_userpersonalizationurl_user1`
  FOREIGN KEY (`idUser`)
  REFERENCES `User` (`idUser`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `Vocabulary` 
ADD CONSTRAINT `fk_vocabulary_vocabularyset1`
  FOREIGN KEY (`idVocabularySet`)
  REFERENCES `VocabularySet` (`idVocabularySet`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `Workflow` 
ADD CONSTRAINT `fk_workflow_project1`
  FOREIGN KEY (`idProject`)
  REFERENCES `Project` (`idProject`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_workflow_user1`
  FOREIGN KEY (`idUserInitiator`)
  REFERENCES `User` (`idUser`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_workflow_vocabulary1`
  FOREIGN KEY (`idVWorkflowType`)
  REFERENCES `Vocabulary` (`idVocabulary`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;
  
ALTER TABLE `WorkflowStep` 
ADD CONSTRAINT `fk_workflowstep_workflow1`
  FOREIGN KEY (`idWorkflow`)
  REFERENCES `Workflow` (`idWorkflow`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_workflowstep_user1`
  FOREIGN KEY (`idUserOwner`)
  REFERENCES `User` (`idUser`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_workflowstep_vocabulary1`
  FOREIGN KEY (`idVWorkflowStepType`)
  REFERENCES `Vocabulary` (`idVocabulary`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_workflowstep_jobrun1`
  FOREIGN KEY (`idJobRun`)
  REFERENCES `JobRun` (`idJobRun`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;
  
ALTER TABLE `WorkflowStepSystemObjectXref` 
ADD CONSTRAINT `fk_workflowstepsystemobjectxref_workflowstep1`
  FOREIGN KEY (`idWorkflowStep`)
  REFERENCES `WorkflowStep` (`idWorkflowStep`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_workflowstepsystemobjectxref_systemobject1`
  FOREIGN KEY (`idSystemObject`)
  REFERENCES `SystemObject` (`idSystemObject`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;
