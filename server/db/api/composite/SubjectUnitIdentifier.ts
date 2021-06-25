/* eslint-disable camelcase */
import { Vocabulary } from '../Vocabulary';
import * as DBC from '../../connection';
import * as CACHE from '../../../cache';
import * as LOG from '../../../utils/logger';

export class SubjectUnitIdentifier {
    idSubject!: number;
    SubjectName!: string;
    UnitAbbreviation!: string;
    IdentifierPublic!: string;
    IdentifierCollection!: string;

    static initialized: boolean = false;
    static idVocabARK: number;
    static idVocabUnitCMSID: number;

    static async fetch(query: string, maxResults: number): Promise<SubjectUnitIdentifier[] | null> {
        if (!query)         // Searches on '' return everything!  Don't allow this due to performance issues
            return null;

        try {
            if (!SubjectUnitIdentifier.initialized) {
                const vocabARK:         Vocabulary | undefined = await CACHE.VocabularyCache.vocabularyByEnum(CACHE.eVocabularyID.eIdentifierIdentifierTypeARK);
                const vocabUnitCMSID:   Vocabulary | undefined = await CACHE.VocabularyCache.vocabularyByEnum(CACHE.eVocabularyID.eIdentifierIdentifierTypeUnitCMSID);
                SubjectUnitIdentifier.idVocabARK = vocabARK ? vocabARK.idVocabulary : /* istanbul ignore next */ 76;
                SubjectUnitIdentifier.idVocabUnitCMSID = vocabUnitCMSID ? vocabUnitCMSID.idVocabulary : /* istanbul ignore next */ 77;
                SubjectUnitIdentifier.initialized = true;
            }

            query = `%${query}%`;
            return await DBC.DBConnection.prisma.$queryRaw<SubjectUnitIdentifier[] | null>`CALL SubjectUnitIdentifierQuery(${query}, ${SubjectUnitIdentifier.idVocabARK}, ${SubjectUnitIdentifier.idVocabUnitCMSID}, ${maxResults})`;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.SubjectUnitIdentifier.fetch', LOG.LS.eDB, error);
            return null;
        }
    }
}