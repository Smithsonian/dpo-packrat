import { QueryGetIngestionProjectsForSubjectsArgs, GetIngestionProjectsForSubjectsResult } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

export default async function getIngestionProjectsForSubjects(_: Parent, args: QueryGetIngestionProjectsForSubjectsArgs): Promise<GetIngestionProjectsForSubjectsResult> {
    const { input } = args;
    const { idSubjects } = input;

    const Project = await DBAPI.Project.fetchFromSubjects(idSubjects);

    if (Project) {
        return { Project };
    }

    return { Project: [] };
}
