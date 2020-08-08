import { QueryGetIngestionProjectsForSubjectsArgs, GetIngestionProjectsForSubjectsResult } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';

export default async function getIngestionProjectsForSubjects(_: Parent, args: QueryGetIngestionProjectsForSubjectsArgs): Promise<GetIngestionProjectsForSubjectsResult> {
    const { input } = args;
    const { idSubjects } = input;

    console.log(idSubjects);
    return { Project: [] };
}
