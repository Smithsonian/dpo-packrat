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
