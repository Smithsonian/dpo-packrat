import { QuerySearchIngestionSubjectsArgs, SearchIngestionSubjectsResult } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as COL from '../../../../../collections/interface/';
import * as DBAPI from '../../../../../db';
// import * as LOG from '../../../../../utils/logger';

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
        for (const record of resultsCOL.records) {
            if (resultSet.has(record.identifierPublic))
                continue;

            // LOG.info(`searchIngestionSubjects ${JSON.stringify(record)}`, LOG.LS.eGQL);
            resultSet.add(record.identifierPublic);
            results.push({
                idSubject: 0,
                idSystemObject: 0,
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
