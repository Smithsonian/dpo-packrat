/**
* This file serves as a changelog tracking any and all modifications made to the
* the DB. If a change is made append it to the end of this file with a date and 
* comment.
*/
-- 2021-05-12 Jon
UPDATE Model SET MASTER = 0 WHERE MASTER = 1 AND idVPurpose <> 45;
UPDATE Model SET idVPurpose = 46 WHERE MASTER = 0 AND idVPurpose = 45;
ALTER TABLE Model DROP COLUMN `Master`;

ALTER TABLE Metadata MODIFY COLUMN `ValueExtended` longtext DEFAULT NULL;

CREATE TABLE IF NOT EXISTS `SystemObjectVersionAssetVersionXref` (
  `idSystemObjectVersionAssetVersionXref` int(11) NOT NULL AUTO_INCREMENT,
  `idSystemObjectVersion` int(11) NOT NULL,
  `idAssetVersion` int(11) NOT NULL,
  PRIMARY KEY (`idSystemObjectVersionAssetVersionXref`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

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

-- 2021-05-18 Jon
ALTER TABLE Model ADD COLUMN `IsDracoCompressed` boolean NULL;
ALTER TABLE SystemObjectVersion ADD COLUMN `DateCreated` datetime NOT NULL;

-- 2021-05-26 Jon
ALTER TABLE Model MODIFY COLUMN `idVCreationMethod` int(11) NULL;
ALTER TABLE Model MODIFY COLUMN `idVModality` int(11) NULL;
ALTER TABLE Model MODIFY COLUMN `idVUnits` int(11) NULL;
ALTER TABLE Model MODIFY COLUMN `idVPurpose` int(11) NULL;
ALTER TABLE Model MODIFY COLUMN `idVFileType` int(11) NULL;

-- 2021-06-01 Jon
ALTER TABLE Model DROP COLUMN Authoritative;
UPDATE Vocabulary SET Term = 'Download' WHERE Term = 'Print Delivery';

-- 2021-06-02 Jon
SELECT idVocabulary INTO @idVocabARK FROM Vocabulary 
WHERE Term = 'ARK' AND idVocabularySet = (SELECT idVocabularySet FROM VocabularySet WHERE NAME = 'Identifier.IdentifierType');
SELECT idVocabulary INTO @idVocabCMSUnitID FROM Vocabulary 
WHERE Term = 'Unit CMS ID' AND idVocabularySet = (SELECT idVocabularySet FROM VocabularySet WHERE NAME = 'Identifier.IdentifierType');

INSERT INTO Identifier (IdentifierValue, idVIdentifierType, idSystemObject) SELECT 'ITEM_GUID_4', @idVocabARK, idSystemObject FROM SystemObject WHERE idItem = (SELECT idItem FROM Item WHERE NAME = 'NMAH Baseball Bat');

-- 2021-06-05 Jon
ALTER TABLE Model ADD COLUMN AutomationTag varchar(256) NULL;

-- 2021-06-06 Deployed to Staging

-- 2021-07-01 Jon
ALTER TABLE License ADD COLUMN RestrictLevel int(11) NOT NULL;
INSERT INTO License (Name, Description, RestrictLevel) VALUES ('View And Download CC0', 'View And Download CC0', 10);
INSERT INTO License (Name, Description, RestrictLevel) VALUES ('View with Download Restrictions', 'View with Download Restrictions', 20);
INSERT INTO License (Name, Description, RestrictLevel) VALUES ('View Only', 'View Only', 30);
INSERT INTO License (Name, Description, RestrictLevel) VALUES ('Restricted', 'Restricted', 1000);

-- 2021-07-13 Jon
CREATE TABLE IF NOT EXISTS `WorkflowReport` (
  `idWorkflowReport` int(11) NOT NULL AUTO_INCREMENT,
  `idWorkflow` int(11) NOT NULL,
  `MimeType` varchar(256) NOT NULL,
  `Data` longtext NOT NULL,
  PRIMARY KEY (`idWorkflowReport`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

ALTER TABLE `WorkflowReport` 
ADD CONSTRAINT `fk_workflowreport_workflow1`
  FOREIGN KEY (`idWorkflow`)
  REFERENCES `Workflow` (`idWorkflow`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

-- 2021-07-16 Jon
CREATE TABLE IF NOT EXISTS `WorkflowSet` (
  `idWorkflowSet` int(11) NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`idWorkflowSet`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

ALTER TABLE Workflow ADD COLUMN idWorkflowSet int(11) DEFAULT NULL;

ALTER TABLE `Workflow` 
ADD CONSTRAINT `fk_workflow_workflowset1`
  FOREIGN KEY (`idWorkflowSet`)
  REFERENCES `WorkflowSet` (`idWorkflowSet`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

-- 2021-07-20 Jon
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (22, 2, 'Ingestion');
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (22, 3, 'Upload');

-- 2021-07-25 Jon
UPDATE WorkflowStep SET State = 4 WHERE State = 2;
UPDATE WorkflowStep SET State = 2 WHERE State = 1;
UPDATE WorkflowStep SET State = 1 WHERE State = 0;

-- 2021-07-30 Jon
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (18, 2, 'Image');

-- 2021-08-03 Jon
DROP TABLE Metadata;

CREATE TABLE IF NOT EXISTS `Metadata` (
  `idMetadata` int(11) NOT NULL AUTO_INCREMENT,
  `Name` VARCHAR(100) NOT NULL,
  `ValueShort` varchar(255) DEFAULT NULL,
  `ValueExtended` longtext DEFAULT NULL,
  `idAssetVersionValue` int(11) DEFAULT NULL,
  `idUser` int(11) DEFAULT NULL,
  `idVMetadataSource` int(11) DEFAULT NULL,
  `idSystemObject` int(11) DEFAULT NULL,
  `idSystemObjectParent` int(11) DEFAULT NULL,
  PRIMARY KEY (`idMetadata`),
  KEY `Metadata_Name` (`Name`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

ALTER TABLE `Metadata` 
ADD CONSTRAINT `fk_metadata_assetversion1`
  FOREIGN KEY (`idAssetVersionValue`)
  REFERENCES `AssetVersion` (`idAssetVersion`)
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
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_metadata_systemobject2`
  FOREIGN KEY (`idSystemObjectParent`)
  REFERENCES `SystemObject` (`idSystemObject`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

-- 2021-08-12 Jon
ALTER TABLE Scene ADD COLUMN EdanUUID varchar(64) NULL;

-- 2021-08-20 Deployed to Staging

-- 2021-09-30 Jon
ALTER TABLE Scene ADD COLUMN `PosedAndQCd` boolean NULL;
ALTER TABLE Scene ADD COLUMN `ApprovedForPublication` boolean NULL;
UPDATE Scene SET PosedAndQCd = isOriented, ApprovedForPublication = hasBeenQCd;
ALTER TABLE Scene MODIFY COLUMN `PosedAndQCd` boolean NOT NULL;
ALTER TABLE Scene MODIFY COLUMN `ApprovedForPublication` boolean NOT NULL;
ALTER TABLE Scene DROP COLUMN `isOriented`;
ALTER TABLE Scene DROP COLUMN `hasBeenQCd`;

-- 2021-10-26 Deployed to Staging

-- 2021-10-27 Jon
CREATE TABLE IF NOT EXISTS `Sentinel` (
  `idSentinel` int(11) NOT NULL AUTO_INCREMENT,
  `URLBase` varchar(512) NOT NULL,
  `ExpirationDate` datetime NOT NULL,
  `idUser` int(11) NOT NULL,
  PRIMARY KEY (`idSentinel`),
  KEY `Sentinel_URLBase` (`URLBase`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

ALTER TABLE `Sentinel` 
ADD CONSTRAINT `fk_sentinel_user1`
  FOREIGN KEY (`idUser`)
  REFERENCES `User` (`idUser`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

-- 2021-11-04 Deployed to Staging

-- 2021-11-17 Jon
ALTER TABLE AssetVersion ADD COLUMN `idSOAttachment` int(11) NULL;
ALTER TABLE AssetVersion
ADD CONSTRAINT `fk_assetversion_systemobject1`
  FOREIGN KEY (`idSOAttachment`)
  REFERENCES `SystemObject` (`idSystemObject`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;


-- 2021-11-21 Jon
INSERT INTO VocabularySet (idVocabularySet, Name, SystemMaintained) VALUES (24, 'Edan3DResource.AttributeUnits', 1);
INSERT INTO VocabularySet (idVocabularySet, Name, SystemMaintained) VALUES (25, 'Edan3DResource.AttributeModelFileType', 1);
INSERT INTO VocabularySet (idVocabularySet, Name, SystemMaintained) VALUES (26, 'Edan3DResource.AttributeFileType', 1);
INSERT INTO VocabularySet (idVocabularySet, Name, SystemMaintained) VALUES (27, 'Edan3DResource.Type', 1);
INSERT INTO VocabularySet (idVocabularySet, Name, SystemMaintained) VALUES (28, 'Edan3DResource.Category', 1);
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (24, 1, 'mm');
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (24, 2, 'cm');
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (24, 3, 'm');
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (24, 4, 'km');
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (24, 5, 'in');
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (24, 6, 'ft');
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (24, 7, 'yd');
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (24, 8, 'mi');
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (25, 1, 'obj');
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (25, 2, 'ply');
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (25, 3, 'stl');
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (25, 4, 'glb');
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (25, 5, 'x3d');
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (25, 6, 'gltf');
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (25, 7, 'usdz');
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (26, 1, 'zip');
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (26, 2, 'glb');
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (26, 3, 'usdz');
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (27, 1, '3d mesh');
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (27, 2, 'CAD model');
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (28, 1, 'Full resolution');
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (28, 2, 'Medium resolution');
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (28, 3, 'Low resolution');
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (28, 4, 'Watertight');
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (28, 5, 'iOS AR model');

UPDATE Vocabulary SET SortOrder = 17 WHERE idVocabularySet = 20 AND Term = 'Other';
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (20, 16, 'Attachment');

-- 2021-11-23 Jon
ALTER TABLE SystemObjectVersion ADD COLUMN Comment text NULL;

-- 2021-11-27 Jon
UPDATE VocabularySet SET Name = 'Edan.3DResourceAttributeUnits' WHERE Name = 'Edan3DResource.AttributeUnits';
UPDATE VocabularySet SET Name = 'Edan.3DResourceAttributeModelFileType' WHERE Name = 'Edan3DResource.AttributeModelFileType';
UPDATE VocabularySet SET Name = 'Edan.3DResourceAttributeFileType' WHERE Name = 'Edan3DResource.AttributeFileType';
UPDATE VocabularySet SET Name = 'Edan.3DResourceType' WHERE Name = 'Edan3DResource.Type';
UPDATE VocabularySet SET Name = 'Edan.3DResourceCategory' WHERE Name = 'Edan3DResource.Category';
INSERT INTO VocabularySet (idVocabularySet, Name, SystemMaintained) VALUES (29, 'Edan.MDMFields', 1);

INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (29, 1, 'Label');
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (29, 2, 'Title');
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (29, 3, 'Record ID');
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (29, 4, 'Unit');
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (29, 5, 'License');
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (29, 6, 'License Text');
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (29, 7, 'Object Type');
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (29, 8, 'Date');
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (29, 9, 'Place');
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (29, 10, 'Topic');
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (29, 11, 'Identifier (FT)');
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (29, 12, 'Data Source (FT)');
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (29, 13, 'Date (FT)');
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (29, 14, 'Name (FT)');
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (29, 15, 'Object Rights (FT)');
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (29, 16, 'Place (FT)');
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (29, 17, 'Taxonomic Name (FT)');
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (29, 18, 'Notes (FT)');
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (29, 19, 'Physical Description (FT)');

-- 2021-12-03 Jon
ALTER TABLE AssetVersion ADD COLUMN FilePath varchar(512) NULL;

UPDATE AssetVersion AS AV
JOIN Asset AS A ON (AV.idAsset = A.idAsset)
SET AV.FilePath = A.FilePath;

ALTER TABLE Asset DROP COLUMN `FilePath`;

ALTER TABLE AssetVersion MODIFY COLUMN `FilePath` varchar(512) NOT NULL;

-- 2021-12-08 Jon
DROP TABLE UnitEdan;

CREATE TABLE IF NOT EXISTS `UnitEdan` (
  `idUnitEdan` int(11) NOT NULL AUTO_INCREMENT,
  `idUnit` int(11) DEFAULT NULL,
  `Name` varchar(255) NULL,
  `Abbreviation` varchar(100) NOT NULL UNIQUE,
  PRIMARY KEY (`idUnitEdan`),
  KEY `UnitEdan_Abbreviation` (`Abbreviation`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

ALTER TABLE `UnitEdan` 
ADD CONSTRAINT `fk_unitedan_idunit`
  FOREIGN KEY (`idUnit`)
  REFERENCES `Unit` (`idUnit`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (1, NULL, '3D_YT');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (4, 'Archives of American Art', 'AAA');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (4, NULL, 'AAA TH');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (4, NULL, 'AAA_BL');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (4, NULL, 'AAA_PC');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (4, NULL, 'AAA_YT');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (4, NULL, 'AAADCD');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (29, 'Archives of American Gardens', 'AAG');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (29, NULL, 'AAG_YT');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (2, 'Anacostia Community Museum', 'ACM');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (2, NULL, 'ACM_YT');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (2, NULL, 'ACMA_YT');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (24, NULL, 'AECI');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (25, NULL, 'APAP_BL');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (24, NULL, 'ARI');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (1, NULL, 'CEPH');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (5, 'Center for Folklife and Cultural Heritage', 'CFCHFOLKLIFE');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (5, NULL, 'CFCHFOLKLIFE_YT');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (5, NULL, 'CFCHFOLKWAYS_YT');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (6, 'Cooper Hewitt, Smithsonian Design Museum', 'CHNDM');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (6, NULL, 'CHNDM_BL');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (6, NULL, 'CHNDM_YT');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (23, '3D Smithsonian', 'DPO');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (15, NULL, 'EEPA');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (30, NULL, 'FBR');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (5, NULL, 'FLP_BL');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (5, NULL, 'FLP_PC');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (1, NULL, 'FONZ_YT');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (1, NULL, 'FPMS_YT');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (1, NULL, 'FSA_YT');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (7, 'Freer Gallery of Art and Arthur M. Sackler Gallery', 'FSG');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (7, NULL, 'FSG_BL');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (7, NULL, 'FSG_YT');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (1, NULL, 'HAC');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (8, 'Hirshhorn Museum and Sculpture Garden', 'HMSG');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (8, NULL, 'HMSG_YT');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (17, NULL, 'HSFA');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (17, NULL, 'HSFA_YT');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (25, NULL, 'IAHP_BL');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (11, NULL, 'MCI_YT');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (1, NULL, 'MMAM');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (1, NULL, 'MSB');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (17, 'National Anthropological Archives', 'NAA');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (12, 'National Air and Space Museum', 'NASM');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (12, NULL, 'NASM_BL');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (12, NULL, 'NASM_PC');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (12, NULL, 'NASM_YT');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (14, 'National Museum of African American History and Culture', 'NMAAHC');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (14, NULL, 'NMAAHC_YT');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (15, 'National Museum of African Art', 'NMAfA');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (15, NULL, 'NMAfA_YT');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (16, 'National Museum of American History', 'NMAH');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (16, NULL, 'NMAH_BL');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (16, NULL, 'NMAH_YT');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (16, NULL, 'NMAH-AF');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (16, NULL, 'NMAHLC_YT');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (18, 'National Museum of the American Indian', 'NMAI');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (18, NULL, 'NMAI_BL');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (18, NULL, 'NMAI_PC');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (18, NULL, 'NMAI_YT');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (1, NULL, 'NMAIA');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (17, NULL, 'NMNH_BL');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (17, NULL, 'NMNH_YT');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (17, 'NMNH - Anthropology Dept.', 'NMNHANTHRO');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (17, 'NMNH - Vertebrate Zoology - Birds Division', 'NMNHBIRDS');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (17, 'NMNH - Botany Dept.', 'NMNHBOTANY');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (17, 'NMNH - Education & Outreach', 'NMNHEDUCATION');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (17, 'NMNH - Entomology Dept.', 'NMNHENTO');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (17, 'NMNH - Vertebrate Zoology - Fishes Division', 'NMNHFISHES');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (17, 'NMNH - Vertebrate Zoology - Herpetology Division', 'NMNHHERPS');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (17, 'NMNH - Invertebrate Zoology Dept.', 'NMNHINV');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (17, 'NMNH - Vertebrate Zoology - Mammals Division', 'NMNHMAMMALS');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (17, 'NMNH - Mineral Sciences Dept.', 'NMNHMINSCI');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (17, 'NMNH - Paleobiology Dept.', 'NMNHPALEO');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (19, 'National Portrait Gallery', 'NPG');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (19, NULL, 'NPG_BL');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (19, NULL, 'NPG_PC');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (19, NULL, 'NPG_YT');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (19, NULL, 'NPGCAP');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (20, 'National Postal Museum', 'NPM');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (20, NULL, 'NPM_BL');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (20, NULL, 'NPM_YT');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (1, NULL, 'NSRC_YT');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (21, 'National Zoo', 'NZP');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (21, NULL, 'NZP_YT');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (29, 'Smithsonian Gardens', 'OFEO-SG');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (24, 'Smithsonian American Art Museum', 'SAAM');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (24, NULL, 'SAAM_BL');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (24, NULL, 'SAAM_PC');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (24, NULL, 'SAAM_YT');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (24, NULL, 'SAAMPHOTO');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (26, 'Smithsonian Astrophysical Observatory', 'SAO');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (26, NULL, 'SAO_YT');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (1, 'Smithsonian Center for Learning and Digital Access', 'SCLDA');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (28, NULL, 'SERC_BL');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (28, NULL, 'SERC_YT');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (29, NULL, 'SG_BL');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (1, NULL, 'SI');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (1, NULL, 'SI_YT');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (1, NULL, 'SI20_BL');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (30, 'Smithsonian Institution Archives', 'SIA');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (30, NULL, 'SIA_BL');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (30, NULL, 'SIA_YT');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (30, NULL, 'SIAFFIL_BL');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (30, 'Smithsonian Archives - History Div', 'SIA-HIS');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (30, NULL, 'SIAPA_YT');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (1, NULL, 'SICHANNEL_PC');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (1, NULL, 'SICHANNEL_YT');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (1, NULL, 'SIEDU_PC');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (1, NULL, 'SIEDUC_YT');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (31, 'Smithsonian Libraries', 'SIL');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (31, NULL, 'SIL_BL');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (31, NULL, 'SIL_YT');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (31, NULL, 'SILAF');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (31, NULL, 'SILDF');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (31, NULL, 'SILNMAHTL');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (31, NULL, 'SILSRO');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (1, NULL, 'SIMAG_BL');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (1, NULL, 'SIMAG_PC');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (1, NULL, 'SIMAG_YT');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (1, NULL, 'SIMBC_YT');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (23, NULL, 'SIOCIO_YT');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (1, NULL, 'SIOPA_YT');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (1, NULL, 'SISCIEDU_YT');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (1, NULL, 'SITES_BL');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (1, NULL, 'SITES_PC');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (1, NULL, 'SITES_YT');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (1, NULL, 'SJ_BL');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (1, NULL, 'SLC_YT');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (1, NULL, 'SS_BL');
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (32, NULL, 'STRI_YT');

-- 2021-12-08 Deployed to Staging

-- 2022-01-10 Jon
ALTER TABLE AssetVersion ADD COLUMN Comment text NULL;

-- 2022-01-16 Deployed to Staging

-- 2022-01-21 Jon
ALTER TABLE Model ADD COLUMN CountTriangles int(11) DEFAULT NULL;
ALTER TABLE ModelObject ADD COLUMN CountTriangles int(11) DEFAULT NULL;

-- 2022-01-31 Deployed to Staging and Production

-- 2022-02-02 Jon
UPDATE Vocabulary SET Term = 'Edan Record ID' WHERE Term = 'Unit CMS ID';

SELECT idVocabulary INTO @idVocabEdanRecordID FROM Vocabulary 
WHERE Term = 'Edan Record ID' AND idVocabularySet = (SELECT idVocabularySet FROM VocabularySet WHERE NAME = 'Identifier.IdentifierType');

UPDATE Identifier SET IdentifierValue = CONCAT('edanmdm:', IdentifierValue) WHERE idVIdentifierType = @idVocabEdanRecordID;

UPDATE Vocabulary SET Term = 'Background Subtraction' WHERE Term = 'Background Subtraction By Capture Dataset Set';

-- 2022-02-07 Jon
UPDATE License SET Name = 'CC0, Publishable w/ Downloads', Description = 'CC0, Publishable w/ Downloads' WHERE Name = 'View And Download CC0';
UPDATE License SET Name = 'SI ToU, Publishable w/ Downloads', Description = 'SI ToU, Publishable w/ Downloads' WHERE Name = 'View With Download Restrictions';
UPDATE License SET Name = 'SI ToU, Publishable Only', Description = 'SI ToU, Publishable Only' WHERE Name = 'View Only';
UPDATE License SET Name = 'Restricted, Not Publishable', Description = 'Restricted, Not Publishable' WHERE Name = 'Restricted';

-- 2022-02-08 Deployed to Staging and Production

-- 2022-02-09 Jon
ALTER TABLE ModelSceneXref ADD COLUMN S0 double DEFAULT NULL;
ALTER TABLE ModelSceneXref ADD COLUMN S1 double DEFAULT NULL;
ALTER TABLE ModelSceneXref ADD COLUMN S2 double DEFAULT NULL;

-- 2022-02-23 Jon
UPDATE Vocabulary SET Term = 'Voyager Scene Model' WHERE Term = 'Web Delivery';

-- 2022-03-01 Jon
ALTER TABLE Item ADD COLUMN Title VARCHAR(255) DEFAULT NULL;
ALTER TABLE Model ADD COLUMN Title VARCHAR(255) DEFAULT NULL;
ALTER TABLE Scene ADD COLUMN Title VARCHAR(255) DEFAULT NULL;

-- 2022-03-04 Deployed to Staging and Production

-- 2022-04-19 Jon
INSERT INTO Project (idProject, Name) VALUES (99, 'Lineages'); INSERT INTO SystemObject (idProject, Retired) VALUES (99, 0);
INSERT INTO Project (idProject, Name) VALUES (100, 'Awhi-Girlhood'); INSERT INTO SystemObject (idProject, Retired) VALUES (100, 0);
INSERT INTO Project (idProject, Name) VALUES (101, 'Searchable Museum Pottery'); INSERT INTO SystemObject (idProject, Retired) VALUES (101, 0);
INSERT INTO UnitEdan (idUnit, Name, Abbreviation) VALUES (24, NULL, 'SAAMPAIK');

-- 2022-07-01 Jon
INSERT INTO Project (idProject, Name) VALUES (102, 'Awhi-Girlhood Phase2'); INSERT INTO SystemObject (idProject, Retired) VALUES (102, 0);
INSERT INTO Project (idProject, Name) VALUES (103, 'Chandra X-Ray Observatory-2021'); INSERT INTO SystemObject (idProject, Retired) VALUES (103, 0);
INSERT INTO Project (idProject, Name) VALUES (104, 'Triceratops Cds'); INSERT INTO SystemObject (idProject, Retired) VALUES (104, 0);
INSERT INTO Project (idProject, Name) VALUES (105, 'Nps-Devils Tower'); INSERT INTO SystemObject (idProject, Retired) VALUES (105, 0);
INSERT INTO Project (idProject, Name) VALUES (106, 'Pullman Car'); INSERT INTO SystemObject (idProject, Retired) VALUES (106, 0);
UPDATE Unit SET ARKPrefix = 'ch5' WHERE Abbreviation = 'CFCH';
UPDATE Unit SET ARKPrefix = 'uj5' WHERE Abbreviation = 'OCIO';

-- 2022-11-11 Jon
ALTER TABLE ModelSceneXref MODIFY COLUMN `NAME` varchar(512) DEFAULT NULL;

-- 2022-11-11 Deployed to Staging and Production

-- 2023-10-19 Add CookResources table and default data (Eric)
CREATE TABLE IF NOT EXISTS `CookResource` (
    `idCookResource` int(11) NOT NULL AUTO_INCREMENT,
	  `Name` varchar(256) NOT NULL,
    `Address`  varchar(256) NOT NULL,
    `Port` int(11) NOT NULL,
    `Inspection` int(11) NOT NULL,
    `SceneGeneration` int(11) NOT NULL,
    `GenerateDownloads` int(11) NOT NULL,
    `Photogrammetry` int(11) NOT NULL,
    `LargeFiles` int(11) NOT NULL,
    `MachineType` varchar(256) NOT NULL,
    PRIMARY KEY (`idCookResource`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

INSERT INTO CookResource (Name, Address, Port, Inspection, SceneGeneration, GenerateDownloads, Photogrammetry, LargeFiles, MachineType) VALUES ('Cook Server: 1', 'http://si-3dcook01.us.sinet.si.edu', 8000, 3, 1, 1, 0, 0, 'server');
INSERT INTO CookResource (Name, Address, Port, Inspection, SceneGeneration, GenerateDownloads, Photogrammetry, LargeFiles, MachineType) VALUES ('Cook Server: 2', 'http://si-3dcook02.us.sinet.si.edu', 8000, 3, 3, 3, 0, 0, 'server');
INSERT INTO CookResource (Name, Address, Port, Inspection, SceneGeneration, GenerateDownloads, Photogrammetry, LargeFiles, MachineType) VALUES ('DPO Workstation: Digitization', 'http://ocio-73qycx3.us.sinet.si.edu', 8000, 3, 3, 3, 0, 0, 'workstation');
INSERT INTO CookResource (Name, Address, Port, Inspection, SceneGeneration, GenerateDownloads, Photogrammetry, LargeFiles, MachineType) VALUES ('DPO Workstation: #9', 'http://ocio-3ddigisi-9.us.sinet.si.edu', 8000, 3, 1, 1, 0, 0, 'workstation');

-- 2024-07-03 Add 'Masks' variant type for Capture Data (Eric)
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (8, 4, 'Masks');

-- 2024-07-05 Add 'Dataset Use' to vocabulary and table for Capture Data (Eric)
-- using 'longtext' for JSON since JSON fields stored as longtext by MariaDB losing assignment
-- GOTCHA: MariaDB doesn't support multi-value fields and we're using default Vocabulary 'index' values (see below)
--         If the vocabulary order changes this will reference incorrect values.
ALTER TABLE CaptureDataPhoto ADD COLUMN CaptureDatasetUse longtext NOT NULL DEFAULT '[207,208,209]';

-- define vocab set and values
INSERT INTO VocabularySet (idVocabularySet, Name, SystemMaintained) VALUES (30, 'CaptureData.DatasetUse', 1);
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (30, 1, 'Alignment');          -- 207
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (30, 2, 'Reconstruction');     -- 208
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (30, 3, 'Texture Generation'); -- 209

-- update CaptureDataPhoto tables for the field (where needed)
UPDATE CaptureDataPhoto SET CaptureDatasetUse = "[207,208,209]" WHERE CaptureDatasetUse = "[]";

-- 2025-06-30 Add 'Model Variant' to vocabulary and table for Model (Eric)
ALTER TABLE Model ADD COLUMN Variant longtext NOT NULL DEFAULT '[]';

-- define vocab set and values
INSERT INTO VocabularySet (idVocabularySet, Name, SystemMaintained) VALUES (31, 'Model.Variant', 1);
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (31, 1, 'Raw Clean');        -- 210
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (31, 2, 'Presentation');     -- 211

-- 2025-07-18 Add Slack ID to User Table (Eric)
ALTER TABLE User ADD COLUMN SlackID longtext NOT NULL DEFAULT '';

-- 2025-08-17 added Contact table for tracking POCs (Eric)
CREATE TABLE IF NOT EXISTS `Contact` (
  `idContact` int(11) NOT NULL AUTO_INCREMENT,
  `Name` varchar(255) NOT NULL,
  `EmailAddress` varchar(255) NOT NULL,
  `Title` varchar(255) DEFAULT NULL,
  `idUnit` int(11) DEFAULT NULL,
  `Department` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`idContact`),
  UNIQUE KEY `Contact_EmailAddress` (`EmailAddress`),
  KEY `Contact_idUnit` (`idUnit`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

ALTER TABLE `Contact`
ADD CONSTRAINT `fk_contact_unit1`
  FOREIGN KEY (`idUnit`)
  REFERENCES `Unit` (`idUnit`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

-- 2025-08-17 Add ObjectProperties table (Eric)
CREATE TABLE IF NOT EXISTS `ObjectProperty` (
  `idObjectProperty` int(11) NOT NULL AUTO_INCREMENT,
  `idSystemObject` int(11) NOT NULL,
  `PropertyType` enum('sensitivity') NOT NULL,
  `Level` int(11) NOT NULL DEFAULT 0,
  `Rationale` text DEFAULT NULL,
  `idContact` int(11) DEFAULT NULL,
  PRIMARY KEY (`idObjectProperty`),
  UNIQUE KEY `ObjectProperty_idSystemObject_Type` (`idSystemObject`,`PropertyType`),
  KEY `ObjectProperty_idSystemObject` (`idSystemObject`),
  KEY `ObjectProperty_idContact` (`idContact`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

ALTER TABLE `ObjectProperty`
ADD CONSTRAINT `fk_objectproperty_systemobject1`
  FOREIGN KEY (`idSystemObject`)
  REFERENCES `SystemObject` (`idSystemObject`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_objectproperty_contact1`
  FOREIGN KEY (`idContact`)
  REFERENCES `Contact` (`idContact`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

-- 2026-02-18 Project-based authorization (Eric)
ALTER TABLE Project ADD COLUMN `isRestricted` boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS `UserAuthorization` (
  `idUserAuthorization` int(11) NOT NULL AUTO_INCREMENT,
  `idUser` int(11) NOT NULL,
  `idSystemObject` int(11) NOT NULL,
  `DateCreated` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `idUserCreator` int(11) DEFAULT NULL,
  PRIMARY KEY (`idUserAuthorization`),
  UNIQUE KEY `UserAuthorization_idUser_idSystemObject` (`idUser`,`idSystemObject`),
  KEY `UserAuthorization_idUser` (`idUser`),
  KEY `UserAuthorization_idSystemObject` (`idSystemObject`),
  KEY `UserAuthorization_idUserCreator` (`idUserCreator`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

ALTER TABLE `UserAuthorization`
ADD CONSTRAINT `fk_userauthorization_user1`
  FOREIGN KEY (`idUser`)
  REFERENCES `User` (`idUser`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_userauthorization_systemobject1`
  FOREIGN KEY (`idSystemObject`)
  REFERENCES `SystemObject` (`idSystemObject`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_userauthorization_usercreator1`
  FOREIGN KEY (`idUserCreator`)
  REFERENCES `User` (`idUser`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

------
-- 2026-03-29 Wire legacy projects to units via SystemObjectXref (Eric)
-- Fills missing Unit->Project xrefs in production for 109 legacy projects.
-- Unit 1: Unknown Unit
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 1 AND SOP.idProject = 42 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- White House Ornaments

-- Unit 6: Cooper-Hewitt, National Design Museum
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 6 AND SOP.idProject = 1 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- 20_Objects
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 6 AND SOP.idProject = 2 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Building
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 6 AND SOP.idProject = 3 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Chairs

-- Unit 7: Freer Gallery of Art and Arthur M. Sackler Gallery
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 7 AND SOP.idProject = 4 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Blue And White
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 7 AND SOP.idProject = 5 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Bronze Amazon Project
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 7 AND SOP.idProject = 6 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Cosmic Buddha-Gallery 17
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 7 AND SOP.idProject = 7 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Couch-F1915 110
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 7 AND SOP.idProject = 8 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Elephant Zun-F1936 6 Ab
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 7 AND SOP.idProject = 9 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Gargoyle-F1916 345
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 7 AND SOP.idProject = 10 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Gathering Of The Buddhas-F1921 1
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 7 AND SOP.idProject = 11 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Incense Burner-F1947 15 Ab
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 7 AND SOP.idProject = 12 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Nmk Bodhisattva
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 7 AND SOP.idProject = 13 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Palmyra Object-F1908 236
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 7 AND SOP.idProject = 14 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Paradise Of The Buddhas-F1921 2

-- Unit 8: Hirshhorn Museum and Sculpture Garden
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 8 AND SOP.idProject = 15 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Hand To Mouth
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 8 AND SOP.idProject = 16 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Lick And Lather
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 8 AND SOP.idProject = 17 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Noguchi
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 8 AND SOP.idProject = 18 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Oldenburg
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 8 AND SOP.idProject = 19 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Ruby Light-Sam Gilliam

-- Unit 12: National Air and Space Museum
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 12 AND SOP.idProject = 20 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Armstrong Spacesuit
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 12 AND SOP.idProject = 21 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Command Module
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 12 AND SOP.idProject = 22 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Milestones Of Flight
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 12 AND SOP.idProject = 23 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Ortery
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 12 AND SOP.idProject = 24 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Space Shuttle Discovery
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 12 AND SOP.idProject = 25 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Wright Bicycle
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 12 AND SOP.idProject = 26 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Wright Flyer

-- Unit 14: National Museum of African American History and Culture
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 14 AND SOP.idProject = 27 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Google Box
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 14 AND SOP.idProject = 28 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Powder Horn
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 14 AND SOP.idProject = 29 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Shackles
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 14 AND SOP.idProject = 30 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Thomas Jefferson
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 14 AND SOP.idProject = 101 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Searchable Museum
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 14 AND SOP.idProject = 106 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Pullman Car

-- Unit 15: National Museum of African Art
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 15 AND SOP.idProject = 31 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Incised Ivory

-- Unit 16: National Museum of American History
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 16 AND SOP.idProject = 32 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Cornerstone
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 16 AND SOP.idProject = 33 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Electricity And Magnetism
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 16 AND SOP.idProject = 34 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Gunboat
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 16 AND SOP.idProject = 35 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Lincoln Hat
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 16 AND SOP.idProject = 36 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Musical Instruments
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 16 AND SOP.idProject = 37 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Numismatics Pilot
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 16 AND SOP.idProject = 38 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Numismatics Reproduction 6 Coins
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 16 AND SOP.idProject = 40 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Vannevar-Bush Kiplinger
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 16 AND SOP.idProject = 41 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Violin Chello-Piccolo-Pegbox
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 16 AND SOP.idProject = 100 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Girlhood
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 16 AND SOP.idProject = 102 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Girlhood Phase 2
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 16 AND SOP.idProject = 108 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Slippers

-- Unit 17: National Museum of the American Latino
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 17 AND SOP.idProject = 39 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Pleibol
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 17 AND SOP.idProject = 109 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Molina Gallery

-- Unit 18: National Museum of Natural History
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 18 AND SOP.idProject = 44 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Usnm V 10923
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 18 AND SOP.idProject = 45 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Anthro Oceana Figures Tablets
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 18 AND SOP.idProject = 46 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Arctic Studies Center-Kayaks Boats
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 18 AND SOP.idProject = 47 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Argonauta Nodosa Solander-00816577
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 18 AND SOP.idProject = 48 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Atlatl
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 18 AND SOP.idProject = 49 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Birdman Copper Plate-A91117 0
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 18 AND SOP.idProject = 50 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Bonebed Analysis
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 18 AND SOP.idProject = 51 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Camptosaurus
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 18 AND SOP.idProject = 52 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Catfish
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 18 AND SOP.idProject = 53 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Ccpp Paleo 2016
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 18 AND SOP.idProject = 54 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Cerro Ballena Chile Whales
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 18 AND SOP.idProject = 55 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Chiton
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 18 AND SOP.idProject = 56 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Dolphin-Usnm214830
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 18 AND SOP.idProject = 57 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Dolphin-Usnm214911
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 18 AND SOP.idProject = 58 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Drake Points
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 18 AND SOP.idProject = 59 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Duck Bones-Teresa Feo
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 18 AND SOP.idProject = 60 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Giant Ground Sloths
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 18 AND SOP.idProject = 61 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Hawaii Canoe
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 18 AND SOP.idProject = 62 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Hydrous Coral Pilot
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 18 AND SOP.idProject = 63 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Ichthyosaur-Bisp
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 18 AND SOP.idProject = 64 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Jamestown
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 18 AND SOP.idProject = 65 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Jorge Fossil
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 18 AND SOP.idProject = 66 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Kennicott
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 18 AND SOP.idProject = 67 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Key Marco Project
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 18 AND SOP.idProject = 68 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Liang Bua
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 18 AND SOP.idProject = 69 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Mammoth
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 18 AND SOP.idProject = 70 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Microfossils
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 18 AND SOP.idProject = 71 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Mummies
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 18 AND SOP.idProject = 72 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Nps-Paleo
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 18 AND SOP.idProject = 73 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Odobenocetops-Walrus Whale
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 18 AND SOP.idProject = 74 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Oec Tree
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 18 AND SOP.idProject = 75 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Olmec San Lorenzo
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 18 AND SOP.idProject = 76 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Ontocetus Emmonsi-Usnm 329064
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 18 AND SOP.idProject = 77 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Ortery 2015
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 18 AND SOP.idProject = 78 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Paleo Hall-Deep Time
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 18 AND SOP.idProject = 79 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Pella Tree-Usnm Pal 414097
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 18 AND SOP.idProject = 81 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Repat Sculpin Hat
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 18 AND SOP.idProject = 82 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Repat Tlingit Whale Hat
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 18 AND SOP.idProject = 83 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Sauropod
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 18 AND SOP.idProject = 84 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- T Rex
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 18 AND SOP.idProject = 85 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Tanzania-Engare Sero
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 18 AND SOP.idProject = 86 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Usnm-18313
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 18 AND SOP.idProject = 98 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Panamanian Dolphin Odontocete
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 18 AND SOP.idProject = 99 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Lineages
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 18 AND SOP.idProject = 104 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Triceratops Cds
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 18 AND SOP.idProject = 105 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Nps-Devils Tower
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 18 AND SOP.idProject = 107 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Vz And Hop Migration

-- Unit 19: National Museum of the American Indian
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 19 AND SOP.idProject = 43 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Inka Road
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 19 AND SOP.idProject = 80 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Quirigua Altar

-- Unit 20: National Portrait Gallery
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 20 AND SOP.idProject = 87 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- 75 17 Ann Sullivan
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 20 AND SOP.idProject = 88 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Helen Keller
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 20 AND SOP.idProject = 89 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Presidential Busts

-- Unit 21: National Postal Museum
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 21 AND SOP.idProject = 90 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Earhart

-- Unit 25: Smithsonian American Art Museum
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 25 AND SOP.idProject = 91 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Greek Slave
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 25 AND SOP.idProject = 92 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Greenough George Washington

-- Unit 27: Smithsonian Astrophysical Observatory
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 27 AND SOP.idProject = 93 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Casa Supernova
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 27 AND SOP.idProject = 103 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Chandra X-Ray Observatory-2021

-- Unit 29: Smithsonian Environmental Research Center
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 29 AND SOP.idProject = 94 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Crab

-- Unit 30: Smithsonian Gardens
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 30 AND SOP.idProject = 95 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Bees
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 30 AND SOP.idProject = 96 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- Orchids

-- Unit 32: Smithsonian Libraries
INSERT INTO SystemObjectXref (idSystemObjectMaster, idSystemObjectDerived) SELECT SOU.idSystemObject, SOP.idSystemObject FROM SystemObject SOU JOIN SystemObject SOP WHERE SOU.idUnit = 32 AND SOP.idProject = 97 AND NOT EXISTS (SELECT 1 FROM SystemObjectXref X WHERE X.idSystemObjectMaster = SOU.idSystemObject AND X.idSystemObjectDerived = SOP.idSystemObject); -- David Livingston Gun

-- 2026-03-30 ExternalSource table for scene preview and future external integrations (Eric)
CREATE TABLE IF NOT EXISTS `ExternalSource` (
  `idExternalSource` int(11) NOT NULL AUTO_INCREMENT,
  `ClientId` varchar(36) NOT NULL,
  `Name` varchar(255) NOT NULL,
  `ReferrerPattern` varchar(1024) DEFAULT NULL,
  `idContact` int(11) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `DateCreated` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idExternalSource`),
  UNIQUE KEY `ClientId` (`ClientId`),
  KEY `fk_aes_contact` (`idContact`),
  CONSTRAINT `fk_aes_contact` FOREIGN KEY (`idContact`)
    REFERENCES `User` (`idUser`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;