/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-empty-function */
import { Vocabulary } from '../Vocabulary';
import * as DBC from '../../connection';
import * as CACHE from '../../../cache';
import * as LOG from '../../../utils/logger';

export class SubjectUnitIdentifier {
    idSubject!: number;
    SubjectName!: string;
    IdentifierValue!: string;
    UnitAbbreviation!: string;

    static initialized: boolean = false;
    static idVocabARK: number;
    static idVocabUnitCMSID: number;

    static async fetch(query: string): Promise<SubjectUnitIdentifier[] | null> {
        if (!query)         // Searches on "" return everything!  Don't allow this due to performance issues
            return null;

        try {
            if (!SubjectUnitIdentifier.initialized) {
                const vocabARK:         Vocabulary | undefined = await CACHE.VocabularyCache.vocabularyByEnum(CACHE.eVocabularyID.eIdentifierIdentifierTypeARK);
                const vocabUnitCMSID:   Vocabulary | undefined = await CACHE.VocabularyCache.vocabularyByEnum(CACHE.eVocabularyID.eIdentifierIdentifierTypeUnitCMSID);
                SubjectUnitIdentifier.idVocabARK = vocabARK ? vocabARK.idVocabulary : 76;
                SubjectUnitIdentifier.idVocabUnitCMSID = vocabUnitCMSID ? vocabUnitCMSID.idVocabulary : 77;
                SubjectUnitIdentifier.initialized = true;
            }

            return await DBC.DBConnection.prisma.queryRaw<SubjectUnitIdentifier[]>`
                SELECT DISTINCT S.idSubject, I.IdentifierValue, U.Abbreviation AS 'UnitAbbreviation', S.Name AS 'SubjectName'
                FROM Subject AS S
                JOIN Unit AS U ON (S.idUnit = U.idUnit)
                LEFT JOIN SystemObject AS SO ON (S.idSubject = SO.idSubject)
                LEFT JOIN Identifier AS I ON (SO.idSystemObject = I.idSystemObject)
                WHERE IFNULL(I.idVIdentifierType, ${SubjectUnitIdentifier.idVocabARK}) 
                    IN (${SubjectUnitIdentifier.idVocabARK}, ${SubjectUnitIdentifier.idVocabUnitCMSID})
                AND (S.Name LIKE CONCAT('%', ${query}, '%') OR
                    U.Abbreviation LIKE CONCAT('%', ${query}, '%') OR
                    I.IdentifierValue LIKE CONCAT('%', ${query}, '%'))`;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.SubjectUnitIdentifier.fetch', error);
            return null;
        }
    }
}