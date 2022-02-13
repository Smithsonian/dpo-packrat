import * as DBAPI from '../../../db';
import * as CACHE from '../../../cache';
import * as COMMON from '@dpo-packrat/common';
import { createIdentifierForSystemObject } from './Identifier.util';
import { Subject as SubjectBase } from '@prisma/client';

export async function createSubjectTest(base: SubjectBase): Promise<DBAPI.Subject> {
    const subject: DBAPI.Subject = new DBAPI.Subject(base);
    const created: boolean = await subject.create();
    expect(created).toBeTruthy();
    expect(subject.idSubject).toBeGreaterThan(0);
    return subject;
}

export async function createSubjectWithIdentifierTest(base: SubjectBase, identifierValue: string | null = null): Promise<DBAPI.Subject> {
    const subject: DBAPI.Subject = await createSubjectTest(base);

    const vIDTypeArk: DBAPI.Vocabulary | null = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eIdentifierIdentifierTypeARK) || null;
    expect(vIDTypeArk).toBeTruthy();
    const identifier: DBAPI.Identifier | null = await createIdentifierForSystemObject(subject, identifierValue, vIDTypeArk);
    expect(identifier).toBeTruthy();

    if (identifier) {
        subject.idIdentifierPreferred = identifier.idIdentifier;
        expect(await subject.update()).toBeTruthy();
    }

    return subject;
}