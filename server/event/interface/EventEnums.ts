export enum eEventTopic {
    eAuth,
    eDB,
    ePublish,
    eHTTP,
    eJob,
    eWF,
}

export enum eEventKey {
    eDBCreate,                  // value: Audit
    eDBUpdate,                  // value: Audit
    eDBDelete,                  // value: Audit
    eAuthLogin,                 // value: Audit
    ePubSceneQCd,               // value: Audit
    eHTTPDownload,              // value: Audit
    eHTTPUpload,                // value: Audit
    eAuthFailed,                // value: Audit
    eJobCreated,                // value: { idJobRun: number }
    eJobRunning,                // value: { idJobRun: number }
    eJobUpdated,                // value: { idJobRun: number }
    eJobWaiting,                // value: { idJobRun: number }
    eJobDone,                   // value: { idJobRun: number }
    eJobError,                  // value: { idJobRun: number }
    eJobCancelled,              // value: { idJobRun: number }
    eWFIngestObject,            // value: WF.WorkflowParameters
    eWFGenerateSceneDownloads,  // value: { idScene: number, workflowParams: WF.WorkflowParameters }
}
