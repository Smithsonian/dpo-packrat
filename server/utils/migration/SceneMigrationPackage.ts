export class SceneMigrationPackage {
    SceneName: string;                          // Name of scene
    EdanUUID: string;                           // EDAN 3d_package UUID
    fetchRemote: boolean;                       // true -> fetch from EDAN; false -> read locally
    PackageName?: string;                       // Name of zip containing scene; undefined is allowed when fetching from EDAN
    PackagePath?: string;                       // Path to zip containing scene; undefined defaults to ../../tests/mock/scenes relative to this folder (or fetch from EDAN, if PackageName is undefined)
    PosedAndQCd?: boolean;
    ApprovedForPublication?: boolean;
    idSystemObjectItem?: number;                // idSystemObject of item that owns this scene.
    testData?: boolean;                         // Set to true for test data; will create subject and item if idSystemObject is undefined

    constructor(SceneName: string, EdanUUID: string, fetchRemote: boolean, PackageName?: string, PackagePath?: string,
        PosedAndQCd?: boolean, ApprovedForPublication?: boolean, idSystemObjectItem?: number, testData?: boolean) {
        this.SceneName              = SceneName;
        this.EdanUUID               = EdanUUID;
        this.fetchRemote            = fetchRemote;
        this.PackageName            = PackageName;
        this.PackagePath            = PackagePath;
        this.PosedAndQCd            = PosedAndQCd;
        this.ApprovedForPublication = ApprovedForPublication;
        this.idSystemObjectItem     = idSystemObjectItem;
        this.testData               = testData;
    }
}
