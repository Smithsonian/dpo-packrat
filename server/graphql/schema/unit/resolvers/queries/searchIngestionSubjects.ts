import { QuerySearchIngestionSubjectsArgs, SearchIngestionSubjectsResult } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as COL from '../../../../../collections/interface/';
import * as DBAPI from '../../../../../db';

export default async function searchIngestionSubjects(_: Parent, args: QuerySearchIngestionSubjectsArgs): Promise<SearchIngestionSubjectsResult> {
    const { input } = args;
    const { query, EdanOnly } = input;

    const ICollection: COL.ICollection = COL.CollectionFactory.getInstance();
    let resultsDB: DBAPI.SubjectUnitIdentifier[] | null = EdanOnly ? [] : await DBAPI.SubjectUnitIdentifier.fetch(query, 10);
    const resultsCOL: COL.CollectionQueryResults | null = await ICollection.queryCollection(query, 10, 0, null);

    if (!resultsDB) resultsDB = [];

    if (resultsCOL && resultsCOL.records) {
        for (const record of resultsCOL.records) {
            resultsDB.push({
                idSubject: 0,
                SubjectName: record.name,
                UnitAbbreviation: record.unit,
                IdentifierPublic: record.identifierPublic,
                IdentifierCollection: record.identifierCollection
            });
        }

        return { SubjectUnitIdentifier: resultsDB };
    }

    return { SubjectUnitIdentifier: [] };
}
