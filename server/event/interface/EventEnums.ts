export enum eEventTopic {
    eAuth = 1,
    eDB = 2,
    ePublish = 3,
    eHTTP = 4,
    eScene = 5
}

export enum eEventKey {
    eDBCreate = 1,
    eDBUpdate = 2,
    eDBDelete = 3,
    eAuthLogin = 4,
    eSceneQCd = 5,
    eHTTPDownload = 6,
    eHTTPUpload = 7,
    eAuthFailed = 8,
    eGenDownloads = 9,
    eSolrRebuild = 10
}
