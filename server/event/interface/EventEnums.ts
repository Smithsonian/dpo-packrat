export enum eEventTopic {
    eAuth,
    eDB,
    ePublish,
    eHTTP,
    eJob,
    eWF,
}

export enum eEventKey {
    eDBCreate,
    eDBUpdate,
    eDBDelete,
    eAuthLogin,
    ePubSceneQCd,
    eHTTPDownload,
    eHTTPUpload,
    eAuthFailed,
    eJobCreated,
    eJobRunning,
    eJobUpdated,
    eJobWaiting,
    eJobDone,
    eJobError,
    eJobCancelled,
    eWFStart,
    eWFIngestObject,
    eWFDone,
}

