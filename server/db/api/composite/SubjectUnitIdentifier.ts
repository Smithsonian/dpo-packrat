/* eslint-disable camelcase */
import { Vocabulary } from '../Vocabulary';
import * as DBC from '../../connection';
import * as CACHE from '../../../cache';
import * as LOG from '../../../utils/logger';

export enum eSubjectUnitIdentifierSortColumns {
    eUnitAbbreviation = 1,
    eSubjectName = 2,
    eIdentifierValue = 3,
    eDefault = 0
}

export class SubjectUnitIdentifier {
    idSubject!: number;
    idSystemObject!: number;
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
            // The use of the SubjectUnitIdentifierQuery proc is failing due to a prisma bug: https://github.com/prisma/prisma/issues/6173
            // Note that the SQL below uses common table expressions, which are only supported in MariaDB v10.2.1 and later
            // TODO: replace extensive SQL below with commented code once prisma addresses this defect
            // return await DBC.DBConnection.prisma.$queryRaw<SubjectUnitIdentifier[] | null>`CALL SubjectUnitIdentifierQuery(${query}, ${SubjectUnitIdentifier.idVocabARK}, ${SubjectUnitIdentifier.idVocabUnitCMSID}, ${maxResults})`;
            return await DBC.DBConnection.prisma.$queryRaw<SubjectUnitIdentifier[] | null>`
            WITH
            _IDMatches (idSystemObject) AS (
                SELECT idSystemObject
                FROM Identifier
                WHERE (idVIdentifierType = ${SubjectUnitIdentifier.idVocabARK} OR
                       idVIdentifierType = ${SubjectUnitIdentifier.idVocabUnitCMSID})
                  AND IdentifierValue LIKE ${query}
                  
                UNION
                
                SELECT SO.idSystemObject
                FROM Subject AS S
                JOIN Unit AS U ON (S.idUnit = U.idUnit)
                JOIN SystemObject AS SO ON (S.idSubject = SO.idSubject)
                WHERE (S.Name LIKE ${query}
                    OR U.Abbreviation LIKE ${query})	
            ),
            _ARKIDs (idSystemObject, IdentifierValue) AS (
                SELECT ID.idSystemObject, ID.IdentifierValue
                FROM Identifier AS ID
                JOIN _IDMatches AS IDM ON (ID.idSystemObject = IDM.idSystemObject)
                WHERE idVIdentifierType = ${SubjectUnitIdentifier.idVocabARK}
            ),
            _UnitCMSIDs (idSystemObject, IdentifierValue) AS (
                SELECT ID.idSystemObject, ID.IdentifierValue
                FROM Identifier AS ID
                JOIN _IDMatches AS IDM ON (ID.idSystemObject = IDM.idSystemObject)
                WHERE idVIdentifierType = ${SubjectUnitIdentifier.idVocabUnitCMSID}
            )
            SELECT DISTINCT S.idSubject, SO.idSystemObject, S.Name AS 'SubjectName', U.Abbreviation AS 'UnitAbbreviation', 
                IDA.IdentifierValue AS 'IdentifierPublic', IDU.IdentifierValue AS 'IdentifierCollection'
            FROM Subject AS S
            JOIN Unit AS U ON (S.idUnit = U.idUnit)
            JOIN SystemObject AS SO ON (S.idSubject = SO.idSubject)
            JOIN _IDMatches AS IDM ON (SO.idSystemObject = IDM.idSystemObject)
            LEFT JOIN _ARKIDs AS IDA ON (SO.idSystemObject = IDA.idSystemObject)
            LEFT JOIN _UnitCMSIDs AS IDU ON (SO.idSystemObject = IDU.idSystemObject)
            LIMIT ${maxResults};`;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.SubjectUnitIdentifier.fetch', LOG.LS.eDB, error);
            return null;
        }
    }

    static async search(query: string, idUnit?: number | undefined, pageNumber?: number | undefined,
        rowCount?: number | undefined, sortBy?: eSubjectUnitIdentifierSortColumns | undefined,
        sortDirection?: boolean | undefined): Promise<SubjectUnitIdentifier[] | null> {
        try {
            const queryRawParams: string[] = [];
            const querySupplied: boolean = (query !== '');
            const idUnitSupplied: boolean = ((idUnit ?? 0) !== 0);
            const whereConditions: string[] = [];
            if (querySupplied) {
                query = `%${query}%`;
                whereConditions.push('(S.Name LIKE ? OR ID.IdentifierValue LIKE ?)');
                queryRawParams.push(query);
                queryRawParams.push(query);
            }
            if (idUnitSupplied) {
                whereConditions.push('U.idUnit = ?');
                queryRawParams.push(`${idUnit}`);
            }
            const where: string = whereConditions.length > 0 ? `\nWHERE ${whereConditions.join(' AND ')}` : '';

            let orderBy: string = '';
            if (sortBy === undefined)
                sortBy = eSubjectUnitIdentifierSortColumns.eDefault;
            switch (sortBy) { /* istanbul ignore next */
                default:
                case eSubjectUnitIdentifierSortColumns.eDefault:
                case eSubjectUnitIdentifierSortColumns.eSubjectName:
                    orderBy = 'ORDER BY S.Name' + ((sortDirection === false) ? ' DESC' : '');
                    break;
                case eSubjectUnitIdentifierSortColumns.eUnitAbbreviation:
                    if (sortDirection === false)
                        orderBy = 'ORDER BY U.Abbreviation DESC, S.Name DESC';
                    else
                        orderBy = 'ORDER BY U.Abbreviation, S.Name';
                    break;
                case eSubjectUnitIdentifierSortColumns.eIdentifierValue:
                    orderBy = 'ORDER BY ID.IdentifierValue' + ((sortDirection === false) ? ' DESC' : '');
                    break;
            }

            if ((rowCount ?? 0) <= 0)
                rowCount = 100;
            if ((pageNumber ?? 0) <= 1)
                pageNumber = 1;
            const rowStart: number = (pageNumber! - 1) * rowCount!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
            queryRawParams.push(`${rowStart}`);
            queryRawParams.push(`${rowCount}`);

            const sql: string = `SELECT S.idSubject, SO.idSystemObject, S.Name AS 'SubjectName', U.Abbreviation AS 'UnitAbbreviation',
                    ID.IdentifierValue AS 'IdentifierPublic', '' AS 'IdentifierCollection'
                FROM Subject AS S
                JOIN SystemObject AS SO ON (S.idSubject = SO.idSubject)
                LEFT JOIN Identifier AS ID ON (S.idIdentifierPreferred = ID.idIdentifier)
                LEFT JOIN Unit AS U ON (S.idUnit = U.idUnit)${where}
                ${orderBy}
                LIMIT ?, ?`;
            // LOG.info(`DBAPI.SubjectUnitIdentifier.search, sql=${sql}; params=${JSON.stringify(queryRawParams)}`, LOG.LS.eDB);
            return await DBC.DBConnection.prisma.$queryRaw<SubjectUnitIdentifier[] | null>(sql, ...queryRawParams);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.SubjectUnitIdentifier.search', LOG.LS.eDB, error);
            return null;
        }
    }
}