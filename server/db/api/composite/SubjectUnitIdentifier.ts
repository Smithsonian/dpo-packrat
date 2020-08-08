/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-empty-function */
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

            return await DBC.DBConnection.prisma.queryRaw<SubjectUnitIdentifier[]>`
            WITH 
            ARKIDs (idSystemObject, IdentifierValue) AS (
                SELECT idSystemObject, IdentifierValue
                FROM Identifier
                WHERE idVIdentifierType = ${SubjectUnitIdentifier.idVocabARK}
            ),
            UnitCMSIDs (idSystemObject, IdentifierValue) AS (
                SELECT idSystemObject, IdentifierValue
                FROM Identifier
                WHERE idVIdentifierType = ${SubjectUnitIdentifier.idVocabUnitCMSID}
            ),
            IDs (idSystemObject, IdentifierPublic, IdentifierCollection) AS (
                SELECT IFNULL(A.idSystemObject, U.idSystemObject) AS idSystemObject,
                    A.IdentifierValue AS 'IdentifierPublic',
                    U.IdentifierValue AS 'IdentifierCollection'
                FROM ARKIDs AS A
                LEFT JOIN UnitCMSIDs AS U ON (A.idSystemObject = U.idSystemObject)
                
                UNION
            
                SELECT IFNULL(A.idSystemObject, U.idSystemObject) AS idSystemObject,
                    A.IdentifierValue AS 'IdentifierPublic',
                    U.IdentifierValue AS 'IdentifierCollection'
                FROM ARKIDs AS A
                RIGHT JOIN UnitCMSIDs AS U ON (A.idSystemObject = U.idSystemObject)    
            )
            
            SELECT S.idSubject, S.Name AS 'SubjectName', U.Abbreviation AS 'UnitAbbreviation', 
                ID.IdentifierPublic, ID.IdentifierCollection
            FROM Subject AS S
            JOIN Unit AS U ON (S.idUnit = U.idUnit)
            JOIN SystemObject AS SO ON (S.idSubject = SO.idSubject)
            LEFT JOIN IDs AS ID ON (SO.idSystemObject = ID.idSystemObject)
            WHERE (S.Name LIKE CONCAT('%', ${query}, '%')
                OR U.Abbreviation LIKE CONCAT('%', ${query}, '%')
                OR ID.identifierPublic LIKE CONCAT('%', ${query}, '%')
                OR ID.identifierCollection LIKE CONCAT('%', ${query}, '%'))
            ORDER BY S.idSubject
            LIMIT ${maxResults}`;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.SubjectUnitIdentifier.fetch', error);
            return null;
        }
    }
}