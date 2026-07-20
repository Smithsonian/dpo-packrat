import * as DBAPI from '../db';
import * as CACHE from '../cache';
import * as COMMON from '@dpo-packrat/common';

/** The EDAN record a Subject publish will create or overwrite: the record id from the
 * Subject's EDAN Record ID Identifier, and the unit fields from the Subject's Unit. */
export type SubjectTargetRecord = {
    recordId: string;   // IdentifierValue of the EDAN Record ID Identifier, '' when absent
    unitCode: string;   // Unit.Abbreviation
    dataSource: string; // Unit.Name
    url: string;        // edanmdm:<recordId>, '' when no recordId
};

export class SubjectHelpers {
    private static idVocabEdanRecordID: number | null = null;

    private static async resolveEdanRecordIDVocab(): Promise<number | null> {
        if (SubjectHelpers.idVocabEdanRecordID === null) {
            const vocab: DBAPI.Vocabulary | undefined =
                await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eIdentifierIdentifierTypeEdanRecordID);
            if (!vocab)
                return null;
            SubjectHelpers.idVocabEdanRecordID = vocab.idVocabulary;
        }
        return SubjectHelpers.idVocabEdanRecordID;
    }

    /** Single source of truth for the Subject's EDAN target record, shared by the publish
     * path (PublishSubject) and the details query (getSystemObjectDetails). record_ID comes
     * from the EDAN Record ID Identifier; unit_code/data_source from the Subject's Unit. */
    static async computeTargetRecord(idSystemObject: number): Promise<SubjectTargetRecord> {
        const empty: SubjectTargetRecord = { recordId: '', unitCode: '', dataSource: '', url: '' };

        const oID: DBAPI.ObjectIDAndType | undefined = await CACHE.SystemObjectCache.getObjectFromSystem(idSystemObject);
        if (!oID || oID.eObjectType !== COMMON.eSystemObjectType.eSubject || !oID.idObject)
            return empty;

        const subject: DBAPI.Subject | null = await DBAPI.Subject.fetch(oID.idObject);
        if (!subject)
            return empty;

        let recordId: string = '';
        const idVocab: number | null = await SubjectHelpers.resolveEdanRecordIDVocab();
        if (idVocab !== null) {
            const identifiers: DBAPI.Identifier[] | null = await DBAPI.Identifier.fetchFromSystemObject(idSystemObject);
            if (identifiers) {
                for (const ident of identifiers) {
                    if (ident.idVIdentifierType === idVocab && ident.IdentifierValue) {
                        recordId = ident.IdentifierValue;
                        break;
                    }
                }
            }
        }

        let unitCode: string = '';
        let dataSource: string = '';
        const unit: DBAPI.Unit | null = await DBAPI.Unit.fetch(subject.idUnit);
        if (unit) {
            unitCode = unit.Abbreviation ?? '';
            dataSource = unit.Name ?? '';
        }

        return { recordId, unitCode, dataSource, url: recordId ? `edanmdm:${recordId}` : '' };
    }
}
