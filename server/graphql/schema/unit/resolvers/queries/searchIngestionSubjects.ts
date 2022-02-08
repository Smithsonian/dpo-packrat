import { QuerySearchIngestionSubjectsArgs, SearchIngestionSubjectsResult } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as COL from '../../../../../collections/interface/';
import * as DBAPI from '../../../../../db';
import * as LOG from '../../../../../utils/logger';

export default async function searchIngestionSubjects(_: Parent, args: QuerySearchIngestionSubjectsArgs): Promise<SearchIngestionSubjectsResult> {
    const { input } = args;
    const { query, EdanOnly } = input;

    const ICollection: COL.ICollection = COL.CollectionFactory.getInstance();
    const resultsDB: DBAPI.SubjectUnitIdentifier[] | null = EdanOnly ? [] : await DBAPI.SubjectUnitIdentifier.fetch(query, 10);
    const resultsCOL: COL.CollectionQueryResults | null = await ICollection.queryCollection(query, 10, 0, null);

    const results: DBAPI.SubjectUnitIdentifier[] = [];
    const resultSet: Set<string> = new Set<string>();

    if (resultsDB) {
        for (const resultDB of resultsDB) {
            if (resultSet.has(resultDB.IdentifierPublic))
                continue;
            // LOG.info(`searchIngestionSubjects ${JSON.stringify(resultDB)}`, LOG.LS.eGQL);
            resultSet.add(resultDB.IdentifierPublic);
            results.push(resultDB);
        }
    }

    if (resultsCOL && resultsCOL.records) {
        const identifierSubjectMap: Map<string, { idSubject: number, idSystemObject: number }> = new Map<string, { idSubject: number, idSystemObject: number }>();
        for (const record of resultsCOL.records) {
            if (resultSet.has(record.identifierPublic))
                continue;
            identifierSubjectMap.set(record.identifierPublic, { idSubject: 0, idSystemObject: 0 });
        }

        if (identifierSubjectMap.size > 0)
            if (!await DBAPI.Subject.populateIdentifierSubjectMap(identifierSubjectMap))
                LOG.error('searchIngestionSubjects received failure when calling populateIdentifierSubjectMap', LOG.LS.eGQL);

        for (const record of resultsCOL.records) {
            if (resultSet.has(record.identifierPublic))
                continue;

            const identifierInfo = identifierSubjectMap.get(record.identifierPublic);
            const idSubject: number = identifierInfo?.idSubject ?? 0;
            const idSystemObject: number = identifierInfo?.idSystemObject ?? 0;
            // LOG.info(`searchIngestionSubjects ${JSON.stringify(record)}, subject = ${idSubject}`, LOG.LS.eGQL);

            resultSet.add(record.identifierPublic);
            results.push({
                idSubject,
                idSystemObject,
                SubjectName: record.name,
                UnitAbbreviation: record.unit,
                IdentifierPublic: record.identifierPublic,
                IdentifierCollection: record.identifierCollection
            });
        }

        return { SubjectUnitIdentifier: results };
    }

    return { SubjectUnitIdentifier: [] };
}
