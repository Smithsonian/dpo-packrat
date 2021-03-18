DROP PROCEDURE IF EXISTS AssetVersionCreate;
DROP PROCEDURE IF EXISTS SubjectUnitIdentifierQuery;

DELIMITER //
CREATE PROCEDURE AssetVersionCreate (
    IN P_idAsset INT,
    IN P_FileName VARCHAR(512),
    IN P_idUserCreator INT,
    IN P_DateCreated DATETIME,
    IN P_StorageHash VARCHAR(128),
    IN P_StorageSize BIGINT,
    IN P_StorageKeyStaging VARCHAR(512),
    IN P_Ingested TINYINT,
    IN P_IsBagit TINYINT
)
BEGIN
    INSERT INTO AssetVersion (idAsset, FileName, idUserCreator, DateCreated, StorageHash, StorageSize, StorageKeyStaging, Ingested, BulkIngest, Version)
    VALUES (P_idAsset, P_FileName, P_idUserCreator, P_DateCreated, P_StorageHash, P_StorageSize, P_StorageKeyStaging, P_Ingested, P_IsBagit,
	     (SELECT IFNULL(MAX(AV.Version), 0) + 1 
         FROM AssetVersion AS AV
         WHERE AV.idAsset = P_idAsset));

    SET @idAssetVersion = LAST_INSERT_ID();
    
    INSERT INTO SystemObject (idAssetVersion, Retired) VALUES (@idAssetVersion, 0);

    SELECT * 
    FROM AssetVersion 
    WHERE idAssetVersion = @idAssetVersion
    LIMIT 1;
END
//

CREATE PROCEDURE SubjectUnitIdentifierQuery (
    IN P_Query VARCHAR(191),
    IN P_idVocabArkID INT,
    IN P_idVocabUnitCMSID INT,
    IN P_MaxRows INT
)
BEGIN
CREATE TEMPORARY TABLE `_IDMatches` (
    `idSystemObject` INT(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

CREATE TEMPORARY TABLE `_ARKIDs` (
    `idSystemObject` INT(11) NOT NULL,
    `IdentifierValue` VARCHAR(191) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

CREATE TEMPORARY TABLE `_UnitCMSIDs` (
    `idSystemObject` INT(11) NOT NULL,
    `IdentifierValue` VARCHAR(191) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

CREATE TEMPORARY TABLE `_IDs` (
    `idSystemObject` INT(11) NOT NULL,
    `IdentifierPublic` VARCHAR(191) NULL,
    `IdentifierCollection` VARCHAR(191) NULL
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

INSERT INTO _IDMatches (idSystemObject)
SELECT idSystemObject
FROM Identifier
WHERE idVIdentifierType = P_idVocabArkID
  AND IdentifierValue LIKE P_Query;

INSERT INTO _IDMatches (idSystemObject)
SELECT idSystemObject
FROM Identifier
WHERE idVIdentifierType = P_idVocabUnitCMSID
  AND IdentifierValue LIKE P_Query;

INSERT INTO _IDMatches (idSystemObject)
SELECT SO.idSystemObject
FROM Subject AS S
JOIN Unit AS U ON (S.idUnit = U.idUnit)
JOIN SystemObject AS SO ON (S.idSubject = SO.idSubject)
WHERE (S.Name LIKE P_Query
	OR U.Abbreviation LIKE P_Query);

INSERT INTO _ARKIDs (idSystemObject, IdentifierValue)
SELECT ID.idSystemObject, ID.IdentifierValue
FROM Identifier AS ID
JOIN _IDMatches AS IDM ON (ID.idSystemObject = IDM.idSystemObject)
WHERE idVIdentifierType = P_idVocabArkID;

INSERT INTO _UnitCMSIDs (idSystemObject, IdentifierValue)
SELECT ID.idSystemObject, ID.IdentifierValue
FROM Identifier AS ID
JOIN _IDMatches AS IDM ON (ID.idSystemObject = IDM.idSystemObject)
WHERE idVIdentifierType = P_idVocabUnitCMSID;

INSERT INTO _IDs (idSystemObject, IdentifierPublic, IdentifierCollection)
SELECT IFNULL(A.idSystemObject, U.idSystemObject) AS idSystemObject,
	A.IdentifierValue AS 'IdentifierPublic',
	U.IdentifierValue AS 'IdentifierCollection'
FROM _ARKIDs AS A
LEFT JOIN _UnitCMSIDs AS U ON (A.idSystemObject = U.idSystemObject);

INSERT INTO _IDs (idSystemObject, IdentifierPublic, IdentifierCollection)
SELECT IFNULL(A.idSystemObject, U.idSystemObject) AS idSystemObject,
	A.IdentifierValue AS 'IdentifierPublic',
	U.IdentifierValue AS 'IdentifierCollection'
FROM _ARKIDs AS A
RIGHT JOIN _UnitCMSIDs AS U ON (A.idSystemObject = U.idSystemObject)
WHERE A.idSystemObject IS NULL; 

SELECT S.idSubject, S.Name AS 'SubjectName', U.Abbreviation AS 'UnitAbbreviation', 
	ID.IdentifierPublic, ID.IdentifierCollection
FROM Subject AS S
JOIN Unit AS U ON (S.idUnit = U.idUnit)
JOIN SystemObject AS SO ON (S.idSubject = SO.idSubject)
JOIN _IDMatches AS IDM ON (SO.idSystemObject = IDM.idSystemObject)
LEFT JOIN _IDs AS ID ON (SO.idSystemObject = ID.idSystemObject)
ORDER BY S.idSubject
LIMIT P_MaxRows;

DROP TABLE _IDMatches;
DROP TABLE _ARKIDs;
DROP TABLE _UnitCMSIDs;
DROP TABLE _IDs;
END
//

DELIMITER ;