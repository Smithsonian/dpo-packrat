import * as DBAPI from '../../../db';
import { Subject as SubjectBase } from '@prisma/client';

export async function createSubjectTest(base: SubjectBase): Promise<DBAPI.Subject> {
    const subject: DBAPI.Subject = new DBAPI.Subject(base);
    const created: boolean = await subject.create();
    expect(created).toBeTruthy();
    expect(subject.idSubject).toBeGreaterThan(0);
    return subject;
}