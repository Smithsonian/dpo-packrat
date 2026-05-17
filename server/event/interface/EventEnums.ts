/**
 * Event-key enum consumed by the legacy DBObject.audit() shim and the
 * AuditFactory key→AuditType mapping. The broader event-engine surface
 * (topics, producers, consumers) is gone; this enum survives only until
 * DBObject.audit() is migrated to a direct AuditFactory.emit call.
 */
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
