import * as DBAPI from '../../db';
import * as CACHE from '../../cache';
import * as COMMON from '@dpo-packrat/common';
import { SubjectHelpers } from '../../utils/subjectHelpers';

describe('SubjectHelpers.computeTargetRecord — EDAN record normalization', () => {
    afterEach(() => jest.restoreAllMocks());
    beforeEach(() => {
        // reset the memoized vocab id so each test resolves it deterministically
        (SubjectHelpers as unknown as { idVocabEdanRecordID: number | null }).idVocabEdanRecordID = null;
        jest.spyOn(CACHE.SystemObjectCache, 'getObjectFromSystem')
            .mockResolvedValue({ eObjectType: COMMON.eSystemObjectType.eSubject, idObject: 5 } as DBAPI.ObjectIDAndType);
        jest.spyOn(DBAPI.Subject, 'fetch').mockResolvedValue({ idUnit: 3 } as DBAPI.Subject);
        jest.spyOn(CACHE.VocabularyCache, 'vocabularyByEnum').mockResolvedValue({ idVocabulary: 60 } as DBAPI.Vocabulary);
        jest.spyOn(DBAPI.Unit, 'fetch').mockResolvedValue({ Abbreviation: 'CHNDM', Name: 'Cooper Hewitt' } as DBAPI.Unit);
    });

    test('strips a leading edanmdm: scheme so record_ID is bare and url is single-prefixed', async () => {
        jest.spyOn(DBAPI.Identifier, 'fetchFromSystemObject')
            .mockResolvedValue([{ idVIdentifierType: 60, IdentifierValue: 'edanmdm:chndm_1938-58-1083' }] as unknown as DBAPI.Identifier[]);
        const target = await SubjectHelpers.computeTargetRecord(100);
        expect(target.recordId).toBe('chndm_1938-58-1083');            // bare id for the publish record_ID
        expect(target.url).toBe('edanmdm:chndm_1938-58-1083');          // single scheme, not doubled
        expect(target.unitCode).toBe('CHNDM');
    });

    test('leaves a bare record id unchanged and single-prefixes the url', async () => {
        jest.spyOn(DBAPI.Identifier, 'fetchFromSystemObject')
            .mockResolvedValue([{ idVIdentifierType: 60, IdentifierValue: 'chndm_1938-58-1083' }] as unknown as DBAPI.Identifier[]);
        const target = await SubjectHelpers.computeTargetRecord(100);
        expect(target.recordId).toBe('chndm_1938-58-1083');
        expect(target.url).toBe('edanmdm:chndm_1938-58-1083');
    });
});
