import { AuditFactory } from '../../audit/interface/AuditFactory';
import { eAuditType } from '../../db/api/ObjectType';
import { eEventKey } from '../../event/interface/EventEnums';

describe('AuditFactory.keyToAuditType mapping', () => {
    const cases: Array<[eEventKey, eAuditType]> = [
        [eEventKey.eDBCreate,     eAuditType.eDBCreate],
        [eEventKey.eDBUpdate,     eAuditType.eDBUpdate],
        [eEventKey.eDBDelete,     eAuditType.eDBDelete],
        [eEventKey.eAuthLogin,    eAuditType.eAuthLogin],
        [eEventKey.eAuthFailed,   eAuditType.eAuthFailed],
        [eEventKey.eSceneQCd,     eAuditType.eSceneQCd],
        [eEventKey.eHTTPDownload, eAuditType.eHTTPDownload],
        [eEventKey.eHTTPUpload,   eAuditType.eHTTPUpload],
        [eEventKey.eSolrRebuild,  eAuditType.eSolrRebuild],
        [eEventKey.eGenDownloads, eAuditType.eGenDownloads],
    ];

    test.each(cases)('maps %s to the expected eAuditType', (key, expected) => {
        expect(AuditFactory.keyToAuditType(key)).toBe(expected);
    });
});
