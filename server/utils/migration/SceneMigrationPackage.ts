import * as COMMON from '@dpo-packrat/common';

export class SceneMigrationPackage {
    SceneName: string;                          // Name of scene
    SceneTitle: string;                         // Title of scene (often part of Name)
    EdanUUID: string;                           // EDAN 3d_package UUID
    fetchRemote: boolean;                       // true -> fetch from EDAN; false -> read locally
    PackageName?: string;                       // Name of zip containing scene; undefined is allowed when fetching from EDAN
    PackagePath?: string;                       // Path to zip containing scene; undefined defaults to ../../tests/mock/scenes relative to this folder (or fetch from EDAN, if PackageName is undefined)
    PosedAndQCd?: boolean;
    ApprovedForPublication?: boolean;
    License?: COMMON.eLicense;
    PublishedState?: COMMON.ePublishedState;
    idSystemObjectItem?: number;                // idSystemObject of item that owns this scene.
    testData?: boolean;                         // Set to true for test data; will create subject and item if idSystemObject is undefined

    constructor(SceneName: string, SceneTitle: string, EdanUUID: string, fetchRemote: boolean, PackageName?: string, PackagePath?: string,
        PosedAndQCd?: boolean, ApprovedForPublication?: boolean, License?: COMMON.eLicense, PublishedState?: COMMON.ePublishedState,
        idSystemObjectItem?: number, testData?: boolean) {
        this.SceneName              = SceneName;
        this.SceneTitle             = SceneTitle;
        this.EdanUUID               = EdanUUID;
        this.fetchRemote            = fetchRemote;
        this.PackageName            = PackageName;
        this.PackagePath            = PackagePath;
        this.PosedAndQCd            = PosedAndQCd;
        this.ApprovedForPublication = ApprovedForPublication;
        this.License                = License;
        this.PublishedState         = PublishedState;
        this.idSystemObjectItem     = idSystemObjectItem;
        this.testData               = testData;
    }
}
