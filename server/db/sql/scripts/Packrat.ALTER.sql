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
