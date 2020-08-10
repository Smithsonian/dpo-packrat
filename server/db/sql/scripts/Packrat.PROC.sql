USE `Packrat`;
DELIMITER //
CREATE OR REPLACE PROCEDURE AssetVersionCreate (
    IN P_idAsset INT,
    IN P_idUserCreator INT,
    IN P_DateCreated DATETIME,
    IN P_StorageChecksum VARCHAR(128),
    IN P_StorageSize BIGINT,
    IN P_Ingested TINYINT
)
BEGIN
    INSERT INTO AssetVersion (idAsset, idUserCreator, DateCreated, StorageChecksum, StorageSize, Ingested, Version)
    VALUES (P_idAsset, P_idUserCreator, P_DateCreated, P_StorageChecksum, P_StorageSize, P_Ingested, 
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

DELIMITER ;