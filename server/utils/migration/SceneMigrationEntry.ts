export class SceneMigrationEntry {
    EdanUUID: string;                           // EDAN 3d_package UUID
    PackageName?: string;                       // Name of zip containing scene; undefined means fetch from EDAN
    PackagePath?: string;                       // Path to zip containing scene; undefined means fetch from EDAN
    PosedAndQCd?: boolean;
    ApprovedForPublication?: boolean;
    idSystemObjectItem?: number;                // idSystemObject of item that owns this scene.
    testData?: boolean;                         // Set to true for test data; will create subject and item if idSystemObject is undefined

    constructor(EdanUUID: string, PackageName?: string, PackagePath?: string,
        PosedAndQCd?: boolean, ApprovedForPublication?: boolean, idSystemObjectItem?: number, testData?: boolean) {
        this.EdanUUID               = EdanUUID;
        this.PackageName            = PackageName;
        this.PackagePath            = PackagePath;
        this.PosedAndQCd            = PosedAndQCd;
        this.ApprovedForPublication = ApprovedForPublication;
        this.idSystemObjectItem     = idSystemObjectItem;
        this.testData               = testData;
    }
}
