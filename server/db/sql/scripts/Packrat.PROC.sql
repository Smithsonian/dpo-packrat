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

DELIMITER ;